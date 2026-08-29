import threading
import time
import os
import sys
import re
import ast

# --- 1. SYSTEM PATH INJECTION ---
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import MetaTrader5 as mt5
import eel
import storage.json_manager as jm
from core.trading_engine import LiveTrader
from trading.config_builder import create_symbol_config 
from core.error_handler import ErrorManager, ui_log
from trading.risk_manager import (FixedRiskAmountRule, FixedLotRule, PercentRiskRule, BreakevenHandler, PartialCloseRule)

# --- 2. ENGINE STATES ---
robot_running = False
trade_thread = None
live_trader_instance = None

def sanitize_days_list(raw_val):
    try:
        if isinstance(raw_val, str): 
            return [int(n) for n in re.findall(r'\d+', raw_val) if 0 <= int(n) <= 6]
        elif isinstance(raw_val, (list, tuple)): 
            return [int(d) for d in raw_val if str(d).isdigit() and 0 <= int(d) <= 6]
    except: pass
    return [0, 1, 2, 3, 4]

def validate_number(val, cast_type, field_name):
    """
    نگهبان امنیتی: چک می‌کند که فیلد تنظیمات خالی نباشد و یک عدد معتبر باشد.
    """
    if str(val).strip() == '':
        raise ValueError(f"خطای تنظیمات: شما در بخش '{field_name}' عددی وارد نکرده‌اید! لطفاً کادر مربوطه را پر کنید.")
    try:
        return cast_type(val)
    except ValueError:
        raise ValueError(f"خطای تنظیمات: مقدار وارد شده برای '{field_name}' معتبر نیست. لطفاً فقط عدد وارد کنید.")

# --- 3. MAIN MARKET LOOP ---
def run_trading_engine():
    global live_trader_instance, robot_running
    
    user_settings = jm.load_settings()
    mt5_path = user_settings.get("mt5_path")
    
    # --- 🛡️ لایه اعتبارسنجی تنظیمات کلان (Global Settings) ---
    try:
        global_be_enabled = user_settings.get('be_enabled', False)
        global_be_trigger = validate_number(user_settings.get('be_trigger', 1.0), float, 'شروع ریسک‌فری (Breakeven Trigger)')
        
        global_pc_enabled = user_settings.get('pc_enabled', False)
        global_pc_vol = validate_number(user_settings.get('pc_volume', 50.0), float, 'حجم سیو سود (Partial Volume)')
        global_pc_trigger = validate_number(user_settings.get('pc_trigger', 2.0), float, 'نقطه سیو سود (Partial Trigger)')
        
        global_tl_enabled = user_settings.get('tl_enabled', False)
        global_tl_trigger = validate_number(user_settings.get('tl_trigger', 10200.0), float, 'تارگت روزانه (Target Lock)')
            
        global_wu_enabled = user_settings.get('wu_enabled', True)
        global_wu_candles = validate_number(user_settings.get('wu_candles', 500), int, 'تعداد کندل گرم‌سازی (Warm-up)')
        
        margin_enabled = user_settings.get('margin_enabled', False)
        margin_limit = validate_number(user_settings.get('margin_limit', 50.0), float, 'حداکثر مارجین درگیر (Margin Limit)')
        
        nf_enabled = user_settings.get('nf_enabled', False)
        nf_eur = user_settings.get('nf_eur', True)
        nf_usd = user_settings.get('nf_usd', True)
        nf_before = validate_number(user_settings.get('nf_before', 30), int, 'دقایق قبل از خبر (News Before)')
        nf_after = validate_number(user_settings.get('nf_after', 30), int, 'دقایق بعد از خبر (News After)')

    except ValueError as ve:
        # اگر کادری خالی بود، ارور چاپ می‌شود و ربات خاموش می‌ماند
        ui_log('error', str(ve))
        robot_running = False
        return

    strategy_instances_config = []
    tf_map = { "M1": 1, "M5": 5, "M15": 15, "M30": 30, "H1": 16385, "H4": 16388, "D1": 16408 }

    for name, data in jm.strategies_store.items():
        try:
            cls, params, cfg = data["class"], data["params"], data["config"]
            strat_mm_rules = []
            risk_mode = cfg.get('risk_mode', 'fixed_usd')
            
            # 🛡️ بررسی خالی نبودن عدد ریسک در استراتژی‌ها
            risk_val = validate_number(cfg.get('risk_value', 100.0), float, f"مقدار ریسک در استراتژی {name}")
            
            if risk_mode == 'fixed_usd': strat_mm_rules.append(FixedRiskAmountRule(risk_val))
            elif risk_mode == 'fixed_lot': strat_mm_rules.append(FixedLotRule(risk_val))
            elif risk_mode == 'percentage': strat_mm_rules.append(PercentRiskRule(risk_val))
            
            if global_be_enabled: strat_mm_rules.append(BreakevenHandler(global_be_trigger))
            if global_pc_enabled: strat_mm_rules.append(PartialCloseRule(global_pc_trigger, global_pc_vol/100.0))

            clean_days = sanitize_days_list(cfg.get('allowed_days', [0, 1, 2, 3, 4]))
            for k in list(params.keys()):
                if k.lower() == 'allowed_days':
                    clean_days = sanitize_days_list(params[k])
                    break
            
            cfg['allowed_days'] = params['allowed_days'] = params['ALLOWED_DAYS'] = params['Allowed_Days'] = clean_days
            kz = cfg.get("killzones", [])
            if isinstance(kz, str):
                try: kz = ast.literal_eval(kz)
                except Exception: kz = []
            if not isinstance(kz, list): kz = []
            cfg['killzones'] = params['killzones'] = params['KILLZONES'] = kz

            ui_log('success', f"🛠 Instantiating Strategy: {name}...")
            strat_instance = cls(params)
            selected_tf = tf_map.get(cfg.get("timeframe", "M5"), 5)
            final_lookback = global_wu_candles if global_wu_enabled else cfg.get("lookback", 500)
            
            sym_config = create_symbol_config(
                symbol=cfg["symbol"], strategy_instance=strat_instance, mm_rules=strat_mm_rules,
                timeframe_mt5=selected_tf, magic_number=cfg["magic_number"], lookback=final_lookback,
                point_value=cfg["point_value"], adjustment_pips=cfg["adjustment_pips"],
                candle_type=cfg["candle_type"], contract_size=cfg["contract_size"],
                allowed_days=clean_days, killzones=cfg.get("killzones", []), custom_seconds=cfg.get("TIMEFRAME_SECONDS", 300)
            )
            sym_config['leverage'] = cfg.get('leverage', '')
            strategy_instances_config.append(sym_config)
            
        except ValueError as ve:
            # گیر انداختن ارور خالی بودن فیلد ریسک
            if "خطای تنظیمات:" in str(ve):
                ui_log('error', str(ve))
                robot_running = False
                return
            else:
                ErrorManager.catch_strategy_error(name, "Initialization", ve)
        except Exception as e: 
            ErrorManager.catch_strategy_error(name, "Initialization", e)

    if not strategy_instances_config:
        eel.update_status('error', 'No valid configurations constructed. Engine halted.')
        robot_running = False
        return

    margin_limit_pct = (margin_limit / 100.0) if margin_enabled else 1.0 

    LIVE_CONFIG = { 
        "MT5_PATH": mt5_path, "TARGET_LOCK_ENABLED": global_tl_enabled, "TARGET_EQUITY": global_tl_trigger,
        "margin_limit_pct": margin_limit_pct, "warmup_enabled": global_wu_enabled,
        "nf_enabled": nf_enabled, "nf_eur": nf_eur,
        "nf_usd": nf_usd, "nf_before": nf_before,
        "nf_after": nf_after, "strategy_instances": strategy_instances_config 
    }
    
    try:
        eel.update_status('warning', 'Initializing MT5 Connection Protocol...')
        if mt5_path and not os.path.exists(mt5_path):
            eel.update_status('error', 'MT5 Terminal path not found!')
            robot_running = False
            return
            
        live_trader_instance = LiveTrader(LIVE_CONFIG)
        eel.update_status('success', f'Engine Active with {len(strategy_instances_config)} Strategies.')
        
        while robot_running:
            if live_trader_instance.target_lock.check_and_lock(live_trader_instance.mt5_interface):
                ui_log('success', '🎯 Target Equity Hit! Positions secured and engine halted.')
                robot_running = False
                break
            
            live_trader_instance.position_manager.manage_positions()
            live_trader_instance.signal_engine.process_entries()
            
            if mt5.terminal_info():
                acc = mt5.account_info()
                if acc:
                    pos_count = mt5.positions_total()
                    eel.update_dashboard(round(acc.profit, 2), round(acc.equity, 2), pos_count)
            time.sleep(1)
            
    except Exception as e:
        import traceback
        err_trace = traceback.format_exc()
        print(f"❌ Engine Crash:\n{err_trace}")
        crash_location = "Unknown Location"
        try: crash_location = [line.strip() for line in err_trace.split('\n') if 'File "' in line][-1]
        except: pass
        eel.update_status('error', f'Fatal Error: {str(e)} | Location: {crash_location}')
    finally:
        robot_running = False

# --- 4. ENGINE COMMANDS ---
def start_robot():
    global robot_running, trade_thread
    if robot_running: return
    if not jm.strategies_store:
        eel.update_status('error', 'No strategies loaded. Engine halted.')
        return
    ui_log('success', "▶️ Starting Engine with All Strategies...")
    robot_running = True
    trade_thread = threading.Thread(target=run_trading_engine, daemon=True)
    trade_thread.start()

def stop_robot():
    global robot_running
    ui_log('warning', "⏹️ Stopping Engine...")
    robot_running = False
    eel.update_status('warning', 'Halting Engine...')