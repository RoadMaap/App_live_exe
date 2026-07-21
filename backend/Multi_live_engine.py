# ==============================================================================
# ULTIMATE MULTI LIVE ENGINE (v3.9.0) - UNIVERSAL ADAPTER MODE
# Ultimate Live Mirror Sync with Dynamic Comments & Ghost Recovery
# Architecture: Core execution module for Live Trading (Strict Core Functions)
# ==============================================================================

import os
import sys
import math
import traceback
import time as os_time
from datetime import datetime, timedelta
import pandas as pd
import MetaTrader5 as mt5

# ==============================================================================
# 1. SYSTEM PATH INJECTION (Dynamic Routing to Root)
# ==============================================================================
project_root = os.path.abspath(os.path.dirname(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# ==============================================================================
# 2. LOCAL MODULE IMPORTS (Safe & Protected)
# ==============================================================================
try:
    # --- Shared Modules (Risk & Margin) ---
    from Shared_Modules.Risk_management_Class import *
    from Shared_Modules.Margin_usage import MarginManager
    
    # --- Live Engine Specific Modules ---
    from Target_lock import TargetLockManager

except ImportError as e:
    print(f"❌ Critical Core Engine Import Error: {e}")
    print("⚠️ Please ensure the correct architecture is in place:")
    print("   - Shared_Modules/Risk_management_Class.py")
    print("   - Shared_Modules/Margin_usage.py")
    print("   - Target_lock.py")
    sys.exit(1)

# ==============================================================================
# 1. MT5 Interface (Core Broker Connection Layer)
# ==============================================================================
class MT5Interface:
    def __init__(self, mt5_path=None, max_retries=15, retry_delay_seconds=5):
        self.mt5_path = mt5_path
        self._connect_with_retry(max_retries, retry_delay_seconds)

    def _connect_with_retry(self, max_retries, retry_delay):
        print("\n🔌 [SYSTEM] Initiating MT5 Connection Protocol...")
        
        for attempt in range(1, max_retries + 1):
            print(f"   ⏳ Attempt [{attempt}/{max_retries}]: Binding to MT5 Terminal...")
            
            init_success = mt5.initialize(path=self.mt5_path) if self.mt5_path else mt5.initialize()
            
            if init_success:
                term_info = mt5.terminal_info()
                if term_info is not None and term_info.connected:
                    acc_info = mt5.account_info()
                    if acc_info is not None:
                        print(f"✅ [SUCCESS] MT5 Connected & Synced! Account: {acc_info.login} | Server: {acc_info.server}")
                        return 
                    else:
                        print("   ⚠️ Terminal connected, but Account Data is null (Wait for sync).")
                else:
                    print("   ⚠️ Terminal launched, but NOT connected to Broker (Check Internet/Login).")
            else:
                print(f"   ❌ Terminal Init Failed. Error Code: {mt5.last_error()}")
            
            if attempt < max_retries:
                print(f"   💤 Retrying in {retry_delay} seconds...\n")
                os_time.sleep(retry_delay)
                
        raise ConnectionError("🛑 [FATAL] Could not establish stable MT5 connection after maximum retries.")

    def get_account_info(self):
        return mt5.account_info()

    def get_symbol_info(self, symbol):
        return mt5.symbol_info(symbol)

    def get_real_contract_size(self, symbol):
        info = self.get_symbol_info(symbol)
        if info:
            return info.trade_contract_size
        return 1.0 

    def normalize_price(self, symbol, price):
        info = self.get_symbol_info(symbol)
        if not info: return price
        tick_size = info.trade_tick_size
        if tick_size == 0: return price
        return round(round(price / tick_size) * tick_size, info.digits)

    def normalize_volume(self, symbol, volume):
        info = self.get_symbol_info(symbol)
        if not info: return volume
        step = info.volume_step
        if step == 0: return volume
        vol = round(volume / step + 1e-9) * step
        vol = round(vol, 2)
        vol = max(vol, info.volume_min)
        vol = min(vol, info.volume_max)
        return vol

    def get_candles(self, symbol, timeframe, count):
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        if rates is None or len(rates) == 0: return None
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        df.set_index('time', inplace=True)
        if 'tick_volume' in df.columns: df.rename(columns={'tick_volume': 'volume'}, inplace=True)
        elif 'real_volume' in df.columns: df.rename(columns={'real_volume': 'volume'}, inplace=True)
        if 'volume' not in df.columns: df['volume'] = 0
        return df

    def get_symbol_tick(self, symbol):
        return mt5.symbol_info_tick(symbol)

    def get_open_positions(self, symbol=None):
        if symbol: return mt5.positions_get(symbol=symbol)
        return mt5.positions_get()

    def send_market_order(self, symbol, order_type, volume, sl, tp, magic, comment):
        tick = self.get_symbol_tick(symbol)
        if not tick: return False
        
        price = tick.ask if order_type == 'buy' else tick.bid
        mt5_type = mt5.ORDER_TYPE_BUY if order_type == 'buy' else mt5.ORDER_TYPE_SELL
        
        final_vol = self.normalize_volume(symbol, volume)
        final_sl = self.normalize_price(symbol, sl)
        final_tp = self.normalize_price(symbol, tp)

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(final_vol),
            "type": mt5_type,
            "price": price,
            "sl": float(final_sl),
            "tp": float(final_tp),
            "deviation": 20, 
            "magic": magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_FOK  
        }
        
        res = mt5.order_send(request)
        if res and res.retcode == 10030:
            request["type_filling"] = mt5.ORDER_FILLING_IOC
            res = mt5.order_send(request)

        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"✅ FILLED: {order_type.upper()} {symbol} | Vol: {final_vol} | SL: {final_sl} | TP: {final_tp}")
            return True
        else:
            print(f"❌ Order Failed: {res.comment if res else 'Unknown'} (Retcode: {res.retcode if res else 'None'})")
            return False

    def modify_position(self, ticket, symbol, new_sl, new_tp):
        final_sl = self.normalize_price(symbol, new_sl)
        final_tp = self.normalize_price(symbol, new_tp)
        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": ticket,
            "symbol": symbol,
            "sl": float(final_sl),
            "tp": float(final_tp),
        }
        res = mt5.order_send(request)
        return res.retcode == mt5.TRADE_RETCODE_DONE

    def close_partial(self, ticket, symbol, volume, type_op, price):
        final_vol = self.normalize_volume(symbol, volume)
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": ticket,
            "symbol": symbol,
            "volume": float(final_vol),
            "type": type_op,
            "price": price,
            "deviation": 20,
            "comment": f"PARTIAL_{ticket}"
        }
        res = mt5.order_send(request)
        if res.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"✂️ Partial Closed: {final_vol} lots")
            return True
        return False

    def close_full(self, ticket, symbol, volume, type_op, price, comment):
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": ticket,
            "symbol": symbol,
            "volume": float(volume),
            "type": type_op,
            "price": price,
            "deviation": 20,
            "comment": comment
        }
        res = mt5.order_send(request)
        return res.retcode == mt5.TRADE_RETCODE_DONE


# ==============================================================================
# 2. Live Signal Engine (Universal Core Focus)
# ==============================================================================
class LiveSignalEngine:
    def __init__(self, mt5_interface, config, margin_manager):
        self.mt5 = mt5_interface
        self.config = config
        self.margin_manager = margin_manager 
        
        self.last_candle_times = {s['strategy_id']: None for s in config['strategy_instances']}
        self.lockout_until = {s['strategy_id']: pd.Timestamp(0) for s in config['strategy_instances']}
        self.active_recovery_trades = {s['strategy_id']: None for s in config['strategy_instances']}
        
        self.known_open_positions = {s['strategy_id']: False for s in config['strategy_instances']}
        
        self.warmup_strategies()

    def warmup_strategies(self):
        print("\n🔥 [WARM-UP PHASE] Syncing Engine with Historical Data...")
        
        for s_config in self.config['strategy_instances']:
            strat_id = s_config['strategy_id']
            symbol = s_config['symbol']
            strat = s_config['strategy']

            lookback = s_config.get('LOOKBACK_PERIOD', 2000)
            df = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], lookback)
            
            if df is None or len(df) < 5: continue
                
            # CORE FUNCTION: prepare_indicators
            if hasattr(strat, 'prepare_indicators'):
                try:
                    df = strat.prepare_indicators(df.copy(), s_config.get('candle_type', 'STANDARD'))
                except Exception as e:
                    print(f"   ❌ Indicator prep failed for {strat_id}: {e}")
                    continue
            else:
                print(f"   ❌ CRITICAL: 'prepare_indicators' method missing in {strat_id}!")
                continue

            print(f"⏳ Fast-forwarding {len(df)} candles for {strat_id}...")
            
            virtual_real_position = None 
            last_real_trade_log = None 
            
            for i in range(5, len(df) + 1):
                history_slice = df.iloc[:i]
                current_candle = history_slice.iloc[-1]
                
                # Position Management Simulation
                if virtual_real_position is not None:
                    v_type = virtual_real_position['type']
                    v_sl = virtual_real_position['sl']
                    v_tp = virtual_real_position['tp']
                    
                    is_closed = False
                    exit_reason = ""
                    
                    raw_spread = current_candle.get('spread', 0.0)
                    spread_div = s_config.get('spread_divisor', 1.0)
                    point_val = s_config.get('point_value', 1.0)
                    spread_val = (raw_spread / spread_div) * point_val
                    
                    curr_o = current_candle['open']
                    curr_h = current_candle['high']
                    curr_l = current_candle['low']
                    
                    if v_type == 'buy':
                        if curr_o < v_sl: is_closed = True; exit_reason = "SL (Gap Slippage)"
                        elif curr_o > v_tp: is_closed = True; exit_reason = "TP (Positive Gap)"
                        elif curr_l <= v_sl: is_closed = True; exit_reason = "SL"
                        elif curr_h >= v_tp: is_closed = True; exit_reason = "TP"
                    elif v_type == 'sell':
                        ask_open = curr_o + spread_val
                        ask_high = curr_h + spread_val
                        ask_low = curr_l + spread_val
                        
                        if ask_open > v_sl: is_closed = True; exit_reason = "SL (Gap Slippage)"
                        elif ask_open < v_tp: is_closed = True; exit_reason = "TP (Positive Gap)"
                        elif ask_high >= v_sl: is_closed = True; exit_reason = "SL (Spread)"
                        elif ask_low <= v_tp: is_closed = True; exit_reason = "TP"
                            
                    if is_closed:
                        virtual_real_position['exit_time'] = current_candle.name
                        virtual_real_position['exit_reason'] = exit_reason
                        last_real_trade_log = virtual_real_position.copy()
                        virtual_real_position = None 
                        
                        # CORE FUNCTION: on_exit (Third Exit)
                        if hasattr(strat, 'on_exit'):
                            try:
                                strat.on_exit()
                            except: pass
                    
                    continue 
                
                # CORE FUNCTION: check_entry_signal
                trade_type, ep, sl, tp = None, None, None, None
                if hasattr(strat, 'check_entry_signal'):
                    try:
                        res = strat.check_entry_signal(history_slice)
                        if isinstance(res, tuple) and len(res) == 4:
                            trade_type, ep, sl, tp = res
                    except Exception as e: pass

                if trade_type:
                    virtual_real_position = {
                        'type': trade_type, 'entry_price': ep, 'sl': sl, 'tp': tp, 'entry_time': current_candle.name 
                    }
                    
            print(f"✅ [{strat_id}] Memory Synced Successfully!")
            
            if virtual_real_position is not None:
                vr = virtual_real_position
                print(f"   💎 [OPEN REAL]     : {vr['type'].upper():<4} | Entry: {vr['entry_price']} | SL: {vr['sl']} | TP: {vr['tp']} | Opened: {vr['entry_time']} 🔴(STILL RUNNING!)")
                self.active_recovery_trades[strat_id] = vr
                self.known_open_positions[strat_id] = True 
            elif last_real_trade_log is not None:
                lr = last_real_trade_log
                print(f"   💎 [CLOSED REAL]   : {lr['type'].upper():<4} | Closed: {lr['exit_time']} (Hit {lr['exit_reason']})")
                self.known_open_positions[strat_id] = False
            else:
                print(f"   💎 Real Trade      : None in recent history")
                self.known_open_positions[strat_id] = False
            print("-" * 80)
        print("🚀 Warm-up Complete! Engine is LIVE and PERFECTLY SYNCED.\n")

    def process_entries(self):
        for s_config in self.config['strategy_instances']:
            self._process_single_strategy_entry(s_config)

    def _process_single_strategy_entry(self, s_config):
        import MetaTrader5 as mt5_lib 
        import pandas as pd 
        
        strat_id = s_config['strategy_id']
        symbol = s_config['symbol']
        magic = s_config['magic_number']
        strat = s_config['strategy']

        open_positions = self.mt5.get_open_positions()
        has_open_position = any(p.magic == magic for p in open_positions) if open_positions else False

        if self.known_open_positions.get(strat_id, False) and not has_open_position:
            print(f"🔔 [LIVE DETECT] Broker closed position for {strat_id}. Injecting on_exit() rhythm hook.")
            if hasattr(strat, 'on_exit'):
                try: strat.on_exit()
                except: pass
        
        self.known_open_positions[strat_id] = has_open_position

        last_candle_df = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], 1)
        if last_candle_df is None: return
        current_candle_time = last_candle_df.index[0]
        is_new_candle_tick = (current_candle_time != self.last_candle_times.get(strat_id))

        # ==============================================================================
        # 1. 👻 GHOST RECOVERY LOGIC
        # ==============================================================================
        if self.active_recovery_trades[strat_id] is not None:
            if has_open_position:
                print(f"✅ [RECOVERY SUCCESS] Position is LIVE! Unlocking Rhythm.")
                self.active_recovery_trades[strat_id] = None
                if is_new_candle_tick: self.last_candle_times[strat_id] = current_candle_time
                return

            recovery_trade = self.active_recovery_trades[strat_id]
            t_type = recovery_trade['type']
            g_entry = recovery_trade['entry_price']
            g_sl = recovery_trade['sl']
            g_tp = recovery_trade['tp']

            pending_orders = mt5_lib.orders_get(symbol=symbol)
            has_pending = False
            pending_ticket = None
            if pending_orders:
                for p in pending_orders:
                    if p.magic == magic:
                        has_pending = True
                        pending_ticket = p.ticket
                        break

            tick = self.mt5.get_symbol_tick(symbol)
            if not tick: return

            is_invalid = False
            if t_type == 'buy' and tick.bid >= g_tp: is_invalid = True
            if t_type == 'sell' and tick.ask <= g_tp: is_invalid = True

            if is_invalid:
                if has_pending:
                    current_time = pd.Timestamp.now()
                    if 'delete_retry_time' in recovery_trade and current_time < recovery_trade['delete_retry_time']:
                        return 

                    res = mt5_lib.order_send({"action": mt5_lib.TRADE_ACTION_REMOVE, "order": pending_ticket})
                    if res and res.retcode == mt5_lib.TRADE_RETCODE_DONE:
                        print(f"👻 [RECOVERY CANCELLED] Market hit TP. Zombie Order KILLED!")
                        self.active_recovery_trades[strat_id] = None
                        if hasattr(strat, 'on_exit'): 
                            try: strat.on_exit() 
                            except: pass
                    else:
                        retries = recovery_trade.get('delete_retries', 0)
                        if retries < 1: 
                            print(f"⚠️ [WARNING] Failed to kill Pending Order. Retrying in 10s...")
                            recovery_trade['delete_retries'] = retries + 1
                            recovery_trade['delete_retry_time'] = current_time + pd.Timedelta(seconds=10)
                            return 
                        else: 
                            print(f"❌ [CRITICAL] 2nd attempt failed. Killing Ghost Memory. CHECK MT5 MANUALLY!")
                            self.active_recovery_trades[strat_id] = None
                            if hasattr(strat, 'on_exit'): 
                                try: strat.on_exit() 
                                except: pass
                else:
                    print(f"👻 [RECOVERY CANCELLED] Market hit TP. Rhythm Unlocked!")
                    self.active_recovery_trades[strat_id] = None
                    if hasattr(strat, 'on_exit'): 
                        try: strat.on_exit() 
                        except: pass

            else:
                if not has_pending:
                    execute_market = False
                    if (t_type == 'buy' and tick.ask <= g_entry) or (t_type == 'sell' and tick.bid >= g_entry):
                        execute_market = True

                    df_recovery = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], s_config.get('LOOKBACK_PERIOD', 100))
                    if df_recovery is not None:
                        try:
                            if hasattr(strat, 'prepare_indicators'):
                                df_recovery = strat.prepare_indicators(df_recovery, s_config.get('candle_type', 'STANDARD'))
                            for rule in s_config.get('MONEY_MANAGEMENT_MODE', []):
                                if hasattr(rule, 'prepare_indicators'): df_recovery = rule.prepare_indicators(df_recovery)
                        except Exception: pass

                        if execute_market:
                            success = self._execute_order(t_type, g_entry, g_sl, g_tp, s_config, df_recovery, current_candle_time, is_recovery=True)
                            if success:
                                self.active_recovery_trades[strat_id] = None
                            else:
                                print(f"❌ [FATAL] Recovery Market Order Rejected. Killing Ghost.")
                                self.active_recovery_trades[strat_id] = None
                        else:
                            success = self._execute_limit_order(t_type, g_entry, g_sl, g_tp, s_config, df_recovery)
                            if not success:
                                print(f"❌ [FATAL] Limit Order Rejected. Killing Ghost.")
                                self.active_recovery_trades[strat_id] = None

            if self.active_recovery_trades[strat_id] is not None:
                if is_new_candle_tick: self.last_candle_times[strat_id] = current_candle_time
                return

        # ==============================================================================
        # 2. 💎 NORMAL REAL TRADE MANAGEMENT
        # ==============================================================================
        if has_open_position:
            if is_new_candle_tick: self.last_candle_times[strat_id] = current_candle_time
            return 

        # ==============================================================================
        # 3. 🧠 NORMAL SIGNAL LOGIC
        # ==============================================================================
        if not is_new_candle_tick: return
        self.last_candle_times[strat_id] = current_candle_time

        df = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], s_config['LOOKBACK_PERIOD'])
        if df is None: return

        try:
            if hasattr(strat, 'prepare_indicators'):
                df = strat.prepare_indicators(df.copy(), s_config.get('candle_type', 'STANDARD'))
            for rule in s_config.get('MONEY_MANAGEMENT_MODE', []):
                if hasattr(rule, 'prepare_indicators'): df = rule.prepare_indicators(df)
        except Exception: return

        trade_type, entry_anchor, sl_anchor, tp_anchor = None, None, None, None
        if hasattr(strat, 'check_entry_signal'):
            try:
                res = strat.check_entry_signal(df)
                if isinstance(res, tuple) and len(res) == 4:
                    trade_type, entry_anchor, sl_anchor, tp_anchor = res
            except Exception: pass

        if trade_type:
            if pd.Timestamp.now() < self.lockout_until[strat_id]: 
                return
            self._execute_order(trade_type, entry_anchor, sl_anchor, tp_anchor, s_config, df, current_candle_time, is_recovery=False)

    def _execute_order(self, trade_type, entry_anchor, sl_anchor, tp_anchor, s_config, df, current_candle_time, is_recovery=False):
        import pandas as pd
        symbol = s_config['symbol']
        acc_info = self.mt5.get_account_info()
        if acc_info is None: return False
        
        self.margin_manager.update_account_limits(acc_info.balance)
        calc_entry = self.mt5.normalize_price(symbol, entry_anchor)
        final_sl = self.mt5.normalize_price(symbol, sl_anchor)
        final_tp = self.mt5.normalize_price(symbol, tp_anchor)
        s_config['contract_size'] = self.mt5.get_real_contract_size(symbol)

        raw_lot = self._calculate_risk_modular(trade_type, calc_entry, final_sl, final_tp, s_config, df)
        desired_lot = self.mt5.normalize_volume(symbol, raw_lot)

        if desired_lot > 0:
            safe_raw_lot, trade_margin = self.margin_manager.get_safe_lot_size(
                acc_info.margin, symbol, desired_lot, calc_entry, s_config['contract_size']
            )
            final_lot = self.mt5.normalize_volume(symbol, safe_raw_lot)

            if final_lot > 0:
                tag = "🔥 [DISCOUNT RECOVERY]" if is_recovery else "💎 Signal Confirmed"
                print(f"{tag} | {symbol} {trade_type.upper()} | Vol: {final_lot} | Margin: ${trade_margin:.2f}")
                
                order_comment = f"{symbol}-Ghost" if is_recovery else f"{symbol}-GAP4"
                
                success = self.mt5.send_market_order(
                    symbol, trade_type, final_lot, final_sl, final_tp, 
                    s_config['magic_number'], comment=order_comment
                )
                if success:
                    lock_seconds = s_config.get('TIMEFRAME_SECONDS', 300)
                    self.lockout_until[s_config['strategy_id']] = pd.Timestamp.now() + pd.Timedelta(seconds=lock_seconds)
                    return True
        return False

    def _execute_limit_order(self, trade_type, entry_anchor, sl_anchor, tp_anchor, s_config, df):
        import MetaTrader5 as mt5_lib
        symbol = s_config['symbol']
        acc_info = self.mt5.get_account_info()
        if acc_info is None: return False
        
        self.margin_manager.update_account_limits(acc_info.balance)
        calc_entry = self.mt5.normalize_price(symbol, entry_anchor)
        final_sl = self.mt5.normalize_price(symbol, sl_anchor)
        final_tp = self.mt5.normalize_price(symbol, tp_anchor)
        s_config['contract_size'] = self.mt5.get_real_contract_size(symbol)

        raw_lot = self._calculate_risk_modular(trade_type, calc_entry, final_sl, final_tp, s_config, df)
        desired_lot = self.mt5.normalize_volume(symbol, raw_lot)

        if desired_lot > 0:
            safe_raw_lot, _ = self.margin_manager.get_safe_lot_size(
                acc_info.margin, symbol, desired_lot, calc_entry, s_config['contract_size']
            )
            final_lot = self.mt5.normalize_volume(symbol, safe_raw_lot)

            if final_lot > 0:
                print(f"🎣 [MT5 LIMIT PLACED] Waiting for Pullback on Broker Server: {calc_entry} | Vol: {final_lot}")
                mt5_type = mt5_lib.ORDER_TYPE_BUY_LIMIT if trade_type == 'buy' else mt5_lib.ORDER_TYPE_SELL_LIMIT
                limit_comment = f"{symbol}-GLimit"
                
                request = {
                    "action": mt5_lib.TRADE_ACTION_PENDING,
                    "symbol": symbol,
                    "volume": float(final_lot),
                    "type": mt5_type,
                    "price": float(calc_entry),
                    "sl": float(final_sl),
                    "tp": float(final_tp),
                    "magic": s_config['magic_number'],
                    "comment": limit_comment,
                    "type_time": mt5_lib.ORDER_TIME_GTC
                }
                res = mt5_lib.order_send(request)
                if res and res.retcode == mt5_lib.TRADE_RETCODE_DONE:
                    return True
        return False

    def _calculate_risk_modular(self, trade_type, entry, sl, tp, s_config, df):
        acc = self.mt5.get_account_info()
        context = {
            'equity': acc.equity, 'balance': acc.balance, 'trade_type': trade_type,
            'entry_price': entry, 'stop_loss': sl, 'take_profit': tp,
            'current_candle': df.iloc[-1], 'config': s_config
        }
        lot = 0.0
        risk_rules = s_config.get('MONEY_MANAGEMENT_MODE', [])
        if not isinstance(risk_rules, list): risk_rules = [risk_rules]
        for rule in risk_rules:
            if hasattr(rule, 'calculate_risk_details'):
                res = rule.calculate_risk_details(context)
                if res:
                    if isinstance(res, list): lot = res[0].get('lot_size', lot)
                    elif isinstance(res, dict): lot = res.get('lot_size', lot)
        return lot


# ==============================================================================
# 3. Live Position Manager
# ==============================================================================
class LivePositionManager:
    def __init__(self, mt5_interface, config):
        self.mt5 = mt5_interface
        self.config = config
        self.last_processed_candle_time = {s['strategy_id']: None for s in config['strategy_instances']}

    def manage_positions(self):
        all_positions = self.mt5.get_open_positions()
        if not all_positions: return

        open_magics = {p.magic for p in all_positions}
        for s_config in self.config['strategy_instances']:
            if s_config['magic_number'] not in open_magics: continue
            
            strat_id = s_config['strategy_id']
            strat_positions = [p for p in all_positions if p.magic == s_config['magic_number']]
            
            df = self._get_fresh_data(s_config)
            if df is None: continue
            
            current_candle_time = df.index[-1]
            is_new_candle = False
            
            if current_candle_time != self.last_processed_candle_time.get(strat_id):
                is_new_candle = True
            
            s_config['contract_size'] = self.mt5.get_real_contract_size(s_config['symbol'])

            for pos in strat_positions:
                self._process_position(pos, s_config, df, is_new_candle)

            if is_new_candle:
                self.last_processed_candle_time[strat_id] = current_candle_time

    def _process_position(self, mt5_pos, s_config, df, is_new_candle):
        pos_dict = {
            'ticket': mt5_pos.ticket,
            'type': 'buy' if mt5_pos.type == 0 else 'sell',
            'entry_price': mt5_pos.price_open,
            'sl': mt5_pos.sl,
            'tp': mt5_pos.tp,
            'lot_size': mt5_pos.volume,
            'initial_sl': mt5_pos.sl, 
            'partial_closed': "PARTIAL" in mt5_pos.comment
        }
        
        closed_candle = df.iloc[-2] 
        current_candle = df.iloc[-1] 
        strat = s_config['strategy']

        risk_rules = s_config.get('MONEY_MANAGEMENT_MODE', [])
        if not isinstance(risk_rules, list): risk_rules = [risk_rules]

        if is_new_candle:
            context_closed = {
                'position': pos_dict,
                'current_candle': closed_candle,
                'history_slice': df.iloc[:-1],
                'config': s_config
            }
            
            for rule in risk_rules:
                if hasattr(rule, 'check_partial_exit'):
                    vol = rule.check_partial_exit(context_closed)
                    if vol: self._execute_partial(mt5_pos, vol)
                
                if hasattr(rule, 'update_sl'):
                    new_sl = rule.update_sl(context_closed)
                    if new_sl:
                        norm_sl = self.mt5.normalize_price(mt5_pos.symbol, new_sl)
                        if norm_sl != mt5_pos.sl:
                             self.mt5.modify_position(mt5_pos.ticket, mt5_pos.symbol, norm_sl, mt5_pos.tp)

        # CORE FUNCTION: check_exit_conditions
        if hasattr(strat, 'check_exit_conditions'):
            try:
                res = strat.check_exit_conditions(current_candle, df, pos_dict)
                if isinstance(res, tuple) and len(res) == 2:
                    exit_price, reason = res
                else:
                    exit_price, reason = res, "Strategy Custom Exit"
                    
                if exit_price:
                    self._execute_full_close(mt5_pos, exit_price, reason)
            except Exception as e:
                pass

    def _execute_partial(self, mt5_pos, vol):
        tick = self.mt5.get_symbol_tick(mt5_pos.symbol)
        price = tick.bid if mt5_pos.type == 0 else tick.ask
        type_c = 1 if mt5_pos.type == 0 else 0
        self.mt5.close_partial(mt5_pos.ticket, mt5_pos.symbol, vol, type_c, price)

    def _execute_full_close(self, mt5_pos, price, reason):
        if not isinstance(price, (int, float)):
            tick = self.mt5.get_symbol_tick(mt5_pos.symbol)
            price = tick.bid if mt5_pos.type == 0 else tick.ask
            
        type_c = 1 if mt5_pos.type == 0 else 0
        self.mt5.close_full(mt5_pos.ticket, mt5_pos.symbol, mt5_pos.volume, type_c, price, str(reason))

    def _get_fresh_data(self, s_config):
        df = self.mt5.get_candles(s_config['symbol'], s_config['TIMEFRAME_MT5'], s_config.get('LOOKBACK_PERIOD', 100))
        if df is None or len(df) < 2: return None
        try:
            strat = s_config['strategy']
            if hasattr(strat, 'prepare_indicators'):
                df = strat.prepare_indicators(df, s_config.get('candle_type', 'STANDARD'))
                
            for rule in s_config.get('MONEY_MANAGEMENT_MODE', []):
                if hasattr(rule, 'prepare_indicators'): df = rule.prepare_indicators(df)
            return df
        except: return None


# ==============================================================================
# 4. Live Trader Main Engine Call
# ==============================================================================
class LiveTrader:
    def __init__(self, config):
        self.config = config
        print(f"🚀 Initializing Live Trader V3.9 (Universal Adapter Architecture)...")
        self.mt5_interface = MT5Interface(config.get("MT5_PATH"))
        
        acc_info = self.mt5_interface.get_account_info()
        if acc_info is not None:
            config['leverage'] = float(acc_info.leverage)
        
        self.margin_manager = MarginManager(config)
        self.target_lock = TargetLockManager(config)  
        self.signal_engine = LiveSignalEngine(self.mt5_interface, config, self.margin_manager)
        self.position_manager = LivePositionManager(self.mt5_interface, config)

    def run(self):
        print("🟢 Bot is Active and Listening to the Market...")
        while True:
            try:
                if self.target_lock.check_and_lock(self.mt5_interface):
                    mt5.shutdown()
                    break

                self.position_manager.manage_positions()
                self.signal_engine.process_entries()
                os_time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Stopped by User."); mt5.shutdown(); break
            except Exception as e:
                print(f"❌ Error: {e}"); traceback.print_exc(); os_time.sleep(5)