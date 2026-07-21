import eel
import threading
import time
import json
import os
import sys
import subprocess
import traceback
import copy
import ast
import re  # <-- Essential for bulletproof string parsing

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ==============================================================================
# Project Module Imports
# ==============================================================================
try:
    import MetaTrader5 as mt5
    
    # Core Engine Modules
    from Multi_live_engine import LiveTrader
    from security import verify_license_online, get_hwid
    from bot_settings import create_symbol_config 
    from strategy_loader import StrategyLoader 
    
    # Shared Modules (Risk & Margin)
    from Shared_Modules.Risk_management_Class import (FixedRiskAmountRule, FixedLotRule, PercentRiskRule, 
                                                      BreakevenHandler, PartialCloseRule)
    
except ImportError as e:
    print(f"❌ Critical Import Error: {e}")
    print("⚠️ Please ensure the __init__.py file exists in the Shared_Modules directory.")
    pass

# ==============================================================================
# Global Settings & Defaults
# ==============================================================================

GLOBAL_SETTINGS_DEFAULTS = {
    "mt5_path": "",
    "risk_mode": "fixed_usd",
    "risk_value": 100.0,
    "be_enabled": False,
    "be_trigger": 1.0,
    "pc_enabled": False,
    "pc_volume": 50.0,
    "pc_trigger": 2.0,
    "tl_enabled": False,       # Target Lock toggle
    "tl_trigger": 10200.0,     # Target Equity value
    "wu_enabled": True,        # Engine Warm-up toggle
    "wu_candles": 500          # Candles for pre-calculation
}

DEFAULT_STRATEGY_CONFIG = {
    "symbol": "XAUUSD",
    "magic_number": 777888,
    "timeframe": "M5",
    "lookback": 500,
    "point_value": 1.0,
    "adjustment_pips": 0,
    "candle_type": "STANDARD",
    "contract_size": None,
    "allowed_days": [0, 1, 2, 3, 4],
    "killzones": [],
    "TIMEFRAME_SECONDS": 300
}

JSON_FOLDER = os.path.join(BACKEND_DIR, "Jsons")
SETTINGS_FILENAME = 'user_settings.json'
STRATEGIES_FILENAME = 'active_strategies.json'

SETTINGS_FILE = os.path.join(JSON_FOLDER, SETTINGS_FILENAME)
STRATEGIES_FILE = os.path.join(JSON_FOLDER, STRATEGIES_FILENAME)

strategies_store = {}
robot_running = False
trade_thread = None
live_trader_instance = None

# ==============================================================================
# JSON Storage Management
# ==============================================================================
def load_settings():
    """Loads global settings from JSON or creates defaults if missing."""
    if not os.path.exists(SETTINGS_FILE):
        save_settings_to_file(GLOBAL_SETTINGS_DEFAULTS)
        return GLOBAL_SETTINGS_DEFAULTS
    try:
        with open(SETTINGS_FILE, 'r') as f:
            data = json.load(f)
            for k, v in GLOBAL_SETTINGS_DEFAULTS.items():
                if k not in data: data[k] = v
            return data
    except: return GLOBAL_SETTINGS_DEFAULTS

def save_settings_to_file(settings):
    """Saves global settings to JSON."""
    try:
        if not os.path.exists(JSON_FOLDER): os.makedirs(JSON_FOLDER)
        with open(SETTINGS_FILE, 'w') as f: json.dump(settings, f, indent=4)
        return True
    except Exception as e:
        print(f"❌ Error saving JSON: {e}")
        return False

def save_strategies_disk():
    """Saves active strategies configuration to JSON."""
    data_to_save = {}
    for name, data in strategies_store.items():
        data_to_save[name] = {
            "file_path": data.get("file_path", ""),
            "params": data["params"],
            "config": data["config"]
        }
    try:
        if not os.path.exists(JSON_FOLDER): os.makedirs(JSON_FOLDER)
        with open(STRATEGIES_FILE, 'w') as f:
            json.dump(data_to_save, f, indent=4)
        print("💾 Strategies Saved to Disk.")
    except Exception as e:
        print(f"❌ Error Saving Strategies: {e}")

def load_saved_strategies_disk():
    """Restores previously saved strategies on startup."""
    global strategies_store
    if not os.path.exists(STRATEGIES_FILE): return

    print("🔄 Restoring Saved Strategies...")
    try:
        with open(STRATEGIES_FILE, 'r') as f:
            saved_data = json.load(f)
        
        loader = StrategyLoader()
        
        for name, data in saved_data.items():
            path = data.get("file_path")
            if not path or not os.path.exists(path):
                print(f"⚠️ Strategy file missing: {path}")
                continue
                
            try:
                loaded_classes = loader.load_strategies_from_file(path)
                if name in loaded_classes:
                    strategies_store[name] = {
                        "class": loaded_classes[name],
                        "file_path": path,
                        "params": data["params"],
                        "config": data["config"]
                    }
                    print(f"✅ Restored: {name}")
            except Exception as e:
                print(f"❌ Failed to restore {name}: {e}")
                
    except Exception as e:
        print(f"❌ Error Loading Strategies JSON: {e}")

# ==============================================================================
# Eel Endpoints (Backend API)
# ==============================================================================

@eel.expose
def get_hwid_frontend():
    return get_hwid()

@eel.expose
def attempt_login():
    is_valid, message = verify_license_online()
    return {'success': is_valid, 'message': message}

def _get_strategies_for_frontend():
    export_data = {}
    for name, data in strategies_store.items():
        export_data[name] = {
            "params": data["params"],
            "config": data["config"]
        }
    return export_data

@eel.expose
def get_initial_data():
    data = load_settings()
    data['strategies'] = _get_strategies_for_frontend()
    return data

@eel.expose
def load_custom_strategy(file_path):
    global strategies_store
    loader = StrategyLoader()
    try:
        print(f"🔄 Loading file: {file_path}")
        loaded_classes = loader.load_strategies_from_file(file_path)
        extracted_params = loader.extract_params_for_classes(file_path)
        newly_added = []
        for name, cls_obj in loaded_classes.items():
            params = extracted_params.get(name, {})
            adv_config = copy.deepcopy(DEFAULT_STRATEGY_CONFIG)
            adv_config['magic_number'] += (len(strategies_store) * 100) + 10
            
            strategies_store[name] = {
                "class": cls_obj,
                "file_path": file_path,
                "params": params,
                "config": adv_config
            }
            newly_added.append(name)
        print(f"✅ Loaded Strategies: {newly_added}")
        save_strategies_disk()
        return {'success': True, 'strategies': _get_strategies_for_frontend()}
    except Exception as e:
        print(f"❌ Load Error: {e}")
        traceback.print_exc()
        return {'success': False, 'message': str(e)}

@eel.expose
def remove_strategy(strategy_name):
    global strategies_store
    if strategy_name in strategies_store:
        del strategies_store[strategy_name]
        print(f"🗑️ Removed Strategy: {strategy_name}")
        save_strategies_disk()
    return _get_strategies_for_frontend()

@eel.expose
def update_strategy_config(strategy_name, config_type, new_data):
    global strategies_store
    if strategy_name in strategies_store:
        strategies_store[strategy_name][config_type].update(new_data)
        print(f"✏️ Updated {config_type} for {strategy_name}")
        save_strategies_disk()
    return True

@eel.expose
def update_strategy_param(strategy_name, param_key, new_value):
    global strategies_store
    if strategy_name in strategies_store:
        strategies_store[strategy_name]['params'][param_key] = new_value
        print(f"🎛 Param Updated: {strategy_name} -> {param_key} = {new_value}")
        save_strategies_disk()
        return True
    return False

@eel.expose
def save_user_config(data):
    try:
        if save_settings_to_file(data):
            print("💾 Global Settings Saved.")
            return True
        return False
    except: return False

@eel.expose
def clear_active_strategy():
    global strategies_store
    strategies_store = {}
    save_strategies_disk()
    print("🗑️ All Strategies Cleared.")
    return _get_strategies_for_frontend()

def _open_file_dialog_subprocess(title, filetypes):
    dialog_code = f"import tkinter, os, sys; from tkinter import filedialog; root=tkinter.Tk(); root.withdraw(); root.wm_attributes('-topmost', 1); path=filedialog.askopenfilename(title='{title}', filetypes={filetypes}); root.destroy(); print(path) if path else None"
    try:
        si = subprocess.STARTUPINFO(); si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        proc = subprocess.run([sys.executable, "-c", dialog_code], capture_output=True, text=True, startupinfo=si)
        return proc.stdout.strip() or None
    except: return None

@eel.expose
def choose_mt5_path():
    path = _open_file_dialog_subprocess('Select terminal64.exe', "[('Exe', '*.exe')]")
    if path:
        s = load_settings(); s['mt5_path'] = path; save_settings_to_file(s)
        return path
    return None

@eel.expose
def open_strategy_file_dialog():
    return _open_file_dialog_subprocess('Select Strategy Python File', "[('Python', '*.py')]")

@eel.expose
def start_robot():
    global robot_running, trade_thread
    if robot_running: return
    if not strategies_store:
        eel.update_status('error', 'No strategies loaded. Engine halted.')
        return
    print("▶️ Starting Engine with All Strategies...")
    robot_running = True
    trade_thread = threading.Thread(target=run_trading_engine, daemon=True)
    trade_thread.start()

@eel.expose
def stop_robot():
    global robot_running
    print("⏹️ Stopping Engine...")
    robot_running = False
    eel.update_status('warning', 'Halting Engine...')

# ==============================================================================
# Core Trading Engine Thread
# ==============================================================================
def run_trading_engine():
    global live_trader_instance, robot_running
    
    # 1. Read Global Settings
    user_settings = load_settings()
    mt5_path = user_settings.get("mt5_path")
    
    # Risk parameters
    global_be_enabled = user_settings.get('be_enabled', False)
    global_be_trigger = float(user_settings.get('be_trigger', 1.0))
    global_pc_enabled = user_settings.get('pc_enabled', False)
    global_pc_vol = float(user_settings.get('pc_volume', 50.0))
    global_pc_trigger = float(user_settings.get('pc_trigger', 2.0))
    
    # Target Lock parameters
    global_tl_enabled = user_settings.get('tl_enabled', False)
    try:
        global_tl_trigger = float(user_settings.get('tl_trigger', 10200.0))
    except ValueError:
        global_tl_trigger = 10200.0
        
    # Warm-up parameters
    global_wu_enabled = user_settings.get('wu_enabled', True)
    try:
        global_wu_candles = int(user_settings.get('wu_candles', 500))
    except ValueError:
        global_wu_candles = 500

    strategy_instances_config = []
    tf_map = {
        "M1": mt5.TIMEFRAME_M1, "M5": mt5.TIMEFRAME_M5, "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30, "H1": mt5.TIMEFRAME_H1, "H4": mt5.TIMEFRAME_H4, "D1": mt5.TIMEFRAME_D1
    }

    for name, data in strategies_store.items():
        cls = data["class"]
        params = data["params"]
        cfg = data["config"] 
        try:
            strat_mm_rules = []
            risk_mode = cfg.get('risk_mode', 'fixed_usd')
            try: risk_val = float(cfg.get('risk_value', 100.0))
            except: risk_val = 100.0
            
            if risk_mode == 'fixed_usd': strat_mm_rules.append(FixedRiskAmountRule(risk_val))
            elif risk_mode == 'fixed_lot': strat_mm_rules.append(FixedLotRule(risk_val))
            elif risk_mode == 'percentage': strat_mm_rules.append(PercentRiskRule(risk_val))
            
            if global_be_enabled: strat_mm_rules.append(BreakevenHandler(global_be_trigger))
            if global_pc_enabled: strat_mm_rules.append(PartialCloseRule(global_pc_trigger, global_pc_vol/100.0))

            # ==================================================================
            # BULLETPROOF DATA SANITIZER (Prevents String Fallback Crash)
            # ==================================================================
            def sanitize_days_list(raw_val):
                """Forces any representation of days into a pure list of integers."""
                try:
                    if isinstance(raw_val, str):
                        nums = re.findall(r'\d+', raw_val)
                        return [int(n) for n in nums if 0 <= int(n) <= 6]
                    elif isinstance(raw_val, (list, tuple)):
                        return [int(d) for d in raw_val if str(d).isdigit() and 0 <= int(d) <= 6]
                except Exception:
                    pass
                return [0, 1, 2, 3, 4]

            # Prioritize fetching from params if it exists, fallback to config
            clean_days = sanitize_days_list(cfg.get('allowed_days', [0, 1, 2, 3, 4]))
            for k in list(params.keys()):
                if k.lower() == 'allowed_days':
                    clean_days = sanitize_days_list(params[k])
                    break
            
            # CRITICAL FIX: Inject clean data back in ALL possible key formats.
            # This guarantees that Strategy_Class.py finds the correct integer list 
            # regardless of whether it requests 'allowed_days', 'ALLOWED_DAYS', etc.
            cfg['allowed_days'] = clean_days
            params['allowed_days'] = clean_days
            params['ALLOWED_DAYS'] = clean_days
            params['Allowed_Days'] = clean_days
            
            # Safely handle killzones
            kz = cfg.get("killzones", [])
            if isinstance(kz, str):
                try:
                    kz = ast.literal_eval(kz)
                except Exception:
                    kz = []
            if not isinstance(kz, list):
                kz = []
                
            cfg['killzones'] = kz
            params['killzones'] = kz
            params['KILLZONES'] = kz
            # ==================================================================

            print(f"🛠 Instantiating {name}...")
            strat_instance = cls(params)
            selected_tf = tf_map.get(cfg.get("timeframe", "M5"), mt5.TIMEFRAME_M5)
            
            # Use custom Warm-up candles if enabled, else default to lookback
            final_lookback = global_wu_candles if global_wu_enabled else cfg.get("lookback", 500)
            
            sym_config = create_symbol_config(
                symbol=cfg["symbol"],
                strategy_instance=strat_instance,
                mm_rules=strat_mm_rules,
                timeframe_mt5=selected_tf,
                magic_number=cfg["magic_number"],
                lookback=final_lookback,
                point_value=cfg["point_value"],
                adjustment_pips=cfg["adjustment_pips"],
                candle_type=cfg["candle_type"],
                contract_size=cfg["contract_size"],
                allowed_days=clean_days, 
                killzones=cfg.get("killzones", []),
                custom_seconds=cfg.get("TIMEFRAME_SECONDS", 300)
            )
            strategy_instances_config.append(sym_config)
            print(f"🚀 Prepared Config: {name} on {cfg['symbol']}")
            
        except Exception as e:
            print(f"❌ Error preparing {name}: {e}")
            traceback.print_exc()

    if not strategy_instances_config:
        eel.update_status('error', 'No valid configurations constructed. Engine halted.')
        robot_running = False
        return

    # 2. Setup Live Configuration with Target Lock
    LIVE_CONFIG = { 
        "MT5_PATH": mt5_path, 
        "TARGET_LOCK_ENABLED": global_tl_enabled,
        "TARGET_EQUITY": global_tl_trigger,
        "strategy_instances": strategy_instances_config 
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
            
            # --- Check Equity Target Lock Mechanism ---
            if live_trader_instance.target_lock.check_and_lock(live_trader_instance.mt5_interface):
                print("🎯 Target Lock Triggered! Halting Engine...")
                eel.update_status('success', 'Target Equity Hit! Positions secured and engine halted.')
                robot_running = False
                break
            
            # --- Primary Execution Loop ---
            live_trader_instance.position_manager.manage_positions()
            live_trader_instance.signal_engine.process_entries()
            
            # --- UI Dashboard Updates ---
            if mt5.terminal_info():
                acc = mt5.account_info()
                if acc:
                    pos_count = mt5.positions_total()
                    eel.update_dashboard(round(acc.profit, 2), round(acc.equity, 2), pos_count)
                    
            time.sleep(1)
            
    except Exception as e:
        print(f"❌ Engine Crash: {e}")
        traceback.print_exc()
        eel.update_status('error', f'Fatal Error: {str(e)}')
    finally:
        robot_running = False

def on_close(page, sockets):
    global robot_running
    print("❌ UI Window closed. Terminating process...")
    robot_running = False
    sys.exit()

if __name__ == '__main__':
    FRONTEND_DIR = os.path.join(os.path.dirname(BACKEND_DIR), 'frontend', 'dist')
    eel.init(FRONTEND_DIR) 
    load_saved_strategies_disk()
    MY_PORT = 8989
    START_PAGE = 'index.html' 
    APP_URL = f'http://localhost:{MY_PORT}/{START_PAGE}'
    
    print(f"🚀 Starting App Mode at {APP_URL}")
    app_flags = ['--window-size=1200,850', '--disable-infobars', '--disable-extensions']
    
    try:
        eel.start(START_PAGE, mode='edge', port=MY_PORT, size=(1200, 850), close_callback=on_close, cmdline_args=app_flags)
    except Exception as e:
        print(f"⚠️ Primary App Mode Failed: {e}. Attempting Fallback...")
        try:
            eel.start(START_PAGE, mode='edge', size=(1200, 850), close_callback=on_close)
        except: pass