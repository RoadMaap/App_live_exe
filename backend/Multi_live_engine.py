# ==============================================================================
# ULTIMATE MULTI LIVE ENGINE (v4.1.0) - PRODUCTION SAFE MODE
# Architecture: Core execution module with Traceback UI Routing & Single Time Filter
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
# 0. UI LOGGING BRIDGE
# ==============================================================================
def ui_log(msg_type, text):
    """Safely routes logs to terminal stdout and React Frontend for debugging."""
    print(text)
    try:
        import eel
        if hasattr(eel, 'update_status'):
            eel.update_status(msg_type, text)()
    except Exception:
        pass

# ==============================================================================
# 1. SYSTEM PATH INJECTION & SAFE IMPORTS
# ==============================================================================
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from Shared_Modules.Risk_management_Class import *
    from Shared_Modules.Margin_usage import MarginManager
    from Target_lock import TargetLockManager
except ImportError as e:
    err_msg = f"❌ Critical Core Engine Import Error: {e}\nEnsure required modules exist in system path."
    ui_log('error', err_msg)
    sys.exit(1)

# ==============================================================================
# 1. MT5 Interface (Core Broker Connection Layer)
# ==============================================================================
class MT5Interface:
    """Handles low-level MetaTrader 5 terminal communication and formatting."""
    def __init__(self, mt5_path=None, max_retries=15, retry_delay_seconds=5):
        self.mt5_path = mt5_path
        self._connect_with_retry(max_retries, retry_delay_seconds)

    def _connect_with_retry(self, max_retries, retry_delay):
        ui_log('warning', "🔌 [SYSTEM] Initiating MT5 Terminal Connection Protocol...")
        for attempt in range(1, max_retries + 1):
            init_success = mt5.initialize(path=self.mt5_path) if self.mt5_path else mt5.initialize()
            if init_success:
                term_info = mt5.terminal_info()
                if term_info is not None and term_info.connected:
                    acc_info = mt5.account_info()
                    if acc_info is not None:
                        ui_log('success', f"✅ [SUCCESS] MT5 Connected & Synced! Account: {acc_info.login}")
                        return 
            if attempt < max_retries:
                os_time.sleep(retry_delay)
        raise ConnectionError("🛑 [FATAL] Could not establish stable MT5 connection.")

    def is_connected(self):
        term = mt5.terminal_info()
        return term is not None and term.connected

    def get_account_info(self): return mt5.account_info()
    def get_symbol_info(self, symbol): return mt5.symbol_info(symbol)
    
    def get_real_contract_size(self, symbol):
        info = self.get_symbol_info(symbol)
        return info.trade_contract_size if info else 1.0 

    def normalize_price(self, symbol, price):
        info = self.get_symbol_info(symbol)
        if not info or info.trade_tick_size == 0: return price
        return round(round(price / info.trade_tick_size) * info.trade_tick_size, info.digits)

    def normalize_volume(self, symbol, volume):
        info = self.get_symbol_info(symbol)
        if not info or info.volume_step == 0: return volume
        vol = round(volume / info.volume_step + 1e-9) * info.volume_step
        vol = round(vol, 2)
        return min(max(vol, info.volume_min), info.volume_max)

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

    def get_symbol_tick(self, symbol): return mt5.symbol_info_tick(symbol)
    def get_open_positions(self, symbol=None): return mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()

    def send_market_order(self, symbol, order_type, volume, sl, tp, magic, comment):
        tick = self.get_symbol_tick(symbol)
        if not tick: return False
        
        price = tick.ask if order_type == 'buy' else tick.bid
        mt5_type = mt5.ORDER_TYPE_BUY if order_type == 'buy' else mt5.ORDER_TYPE_SELL
        final_vol = self.normalize_volume(symbol, volume)
        final_sl = self.normalize_price(symbol, sl)
        final_tp = self.normalize_price(symbol, tp)

        request = {
            "action": mt5.TRADE_ACTION_DEAL, "symbol": symbol, "volume": float(final_vol),
            "type": mt5_type, "price": price, "sl": float(final_sl), "tp": float(final_tp),
            "deviation": 20, "magic": magic, "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC, "type_filling": mt5.ORDER_FILLING_FOK  
        }
        res = mt5.order_send(request)
        if res and res.retcode == 10030:
            request["type_filling"] = mt5.ORDER_FILLING_IOC
            res = mt5.order_send(request)

        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            ui_log('success', f"✅ FILLED: {order_type.upper()} {symbol} | Vol: {final_vol} | SL: {final_sl}")
            return True
        else:
            err_desc = res.comment if res else 'Unknown Broker Error'
            ui_log('error', f"❌ Order Execution Failed ({symbol}): {err_desc}")
            return False

    def modify_position(self, ticket, symbol, new_sl, new_tp):
        request = {
            "action": mt5.TRADE_ACTION_SLTP, "position": ticket, "symbol": symbol,
            "sl": float(self.normalize_price(symbol, new_sl)), 
            "tp": float(self.normalize_price(symbol, new_tp))
        }
        return mt5.order_send(request).retcode == mt5.TRADE_RETCODE_DONE

    def close_partial(self, ticket, symbol, volume, type_op, price):
        final_vol = self.normalize_volume(symbol, volume)
        request = {
            "action": mt5.TRADE_ACTION_DEAL, "position": ticket, "symbol": symbol,
            "volume": float(final_vol), "type": type_op, "price": price,
            "deviation": 20, "comment": f"PARTIAL_{ticket}"
        }
        res = mt5.order_send(request)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            ui_log('warning', f"✂️ Partial Closed Position #{ticket} ({symbol}): {final_vol} lots")
            return True
        return False

    def close_full(self, ticket, symbol, volume, type_op, price, comment):
        request = {
            "action": mt5.TRADE_ACTION_DEAL, "position": ticket, "symbol": symbol,
            "volume": float(volume), "type": type_op, "price": price,
            "deviation": 20, "comment": comment
        }
        res = mt5.order_send(request)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            ui_log('success', f"🔒 Closed Position #{ticket} ({symbol}) | Reason: {comment}")
            return True
        return False

# ==============================================================================
# 2. Live Signal Engine (Universal Core & Traceback Error Debugger)
# ==============================================================================
class LiveSignalEngine:
    """Executes historical warmup, ghost recoveries, and evaluates single-layer time filters."""
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
        ui_log('warning', "\n🔥 [WARM-UP PHASE] Syncing Engine with Historical Data...")
        
        for s_config in self.config['strategy_instances']:
            strat_id = s_config['strategy_id']
            symbol = s_config['symbol']
            strat = s_config['strategy']

            if hasattr(strat, '_reset_state'):
                try: strat._reset_state()
                except Exception as e:
                    ui_log('error', f"❌ [RUNTIME ERROR] Method: '_reset_state' in {strat_id}\n{traceback.format_exc()}")

            df = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], s_config.get('LOOKBACK_PERIOD', 2000))
            if df is None or len(df) < 5: continue
                
            if hasattr(strat, 'prepare_indicators'):
                try: df = strat.prepare_indicators(df.copy(), s_config.get('candle_type', 'STANDARD'))
                except Exception as e:
                    ui_log('error', f"❌ Indicator prep failed for {strat_id}:\n{traceback.format_exc()}")
                    continue
            else: continue

            virtual_real_position = None 
            last_real_trade_log = None 

            for i in range(5, len(df) + 1):
                history_slice = df.iloc[:i]
                current_candle = history_slice.iloc[-1]
                
                if virtual_real_position is not None:
                    v_type = virtual_real_position['type']
                    v_sl = virtual_real_position['sl']
                    v_tp = virtual_real_position['tp']
                    is_closed = False
                    exit_reason = ""
                    
                    spread_val = (current_candle.get('spread', 0.0) / s_config.get('spread_divisor', 1.0)) * s_config.get('point_value', 1.0)
                    curr_o, curr_h, curr_l = current_candle['open'], current_candle['high'], current_candle['low']
                    
                    if v_type == 'buy':
                        if curr_o < v_sl: is_closed, exit_reason = True, "SL (Gap Slippage)"
                        elif curr_o > v_tp: is_closed, exit_reason = True, "TP (Positive Gap)"
                        elif curr_l <= v_sl: is_closed, exit_reason = True, "SL"
                        elif curr_h >= v_tp: is_closed, exit_reason = True, "TP"
                    elif v_type == 'sell':
                        if curr_o + spread_val > v_sl: is_closed, exit_reason = True, "SL (Gap Slippage)"
                        elif curr_o + spread_val < v_tp: is_closed, exit_reason = True, "TP (Positive Gap)"
                        elif curr_h + spread_val >= v_sl: is_closed, exit_reason = True, "SL (Spread)"
                        elif curr_l + spread_val <= v_tp: is_closed, exit_reason = True, "TP"
                            
                    if is_closed:
                        virtual_real_position.update({'exit_time': current_candle.name, 'exit_reason': exit_reason})
                        last_real_trade_log = virtual_real_position.copy()
                        virtual_real_position = None 
                        if hasattr(strat, 'on_exit'):
                            try: strat.on_exit()
                            except: pass
                    continue 
                
                trade_type, ep, sl, tp = None, None, None, None
                if hasattr(strat, 'check_entry_signal'):
                    try:
                        res = strat.check_entry_signal(history_slice)
                        if isinstance(res, tuple) and len(res) == 4:
                            trade_type, ep, sl, tp = res
                    except Exception: pass

                if trade_type:
                    virtual_real_position = {'type': trade_type, 'entry_price': ep, 'sl': sl, 'tp': tp, 'entry_time': current_candle.name}
                    
            if virtual_real_position is not None:
                self.active_recovery_trades[strat_id] = virtual_real_position
                self.known_open_positions[strat_id] = True 
            else:
                self.known_open_positions[strat_id] = False
                
        ui_log('success', "🚀 Warm-up Complete! All Strategies Synced and Live Engine Ready.")

    def process_entries(self):
        for s_config in self.config['strategy_instances']:
            try:
                self._process_single_strategy_entry(s_config)
            except Exception as e:
                ui_log('error', f"❌ [FATAL EXCEPTION] Strategy: {s_config.get('strategy_id', 'Unknown')}\n[TRACEBACK]\n{traceback.format_exc()}")

    def _process_single_strategy_entry(self, s_config):
        import MetaTrader5 as mt5_lib 
        
        strat_id = s_config['strategy_id']
        symbol = s_config['symbol']
        magic = s_config['magic_number']
        strat = s_config['strategy']

        open_positions = self.mt5.get_open_positions()
        has_open_position = any(p.magic == magic for p in open_positions) if open_positions else False

        # Hook 'on_exit' when broker closes position externally
        if self.known_open_positions.get(strat_id, False) and not has_open_position:
            if hasattr(strat, 'on_exit'):
                try: strat.on_exit()
                except Exception as e: 
                    ui_log('error', f"❌ [RUNTIME ERROR] Method: 'on_exit' in Strategy: {strat_id}\n[TRACEBACK]\n{traceback.format_exc()}")
        
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
                ui_log('success', f"✅ [RECOVERY SUCCESS] {strat_id} Position is LIVE!")
                self.active_recovery_trades[strat_id] = None
                if is_new_candle_tick: self.last_candle_times[strat_id] = current_candle_time
                return

            recovery_trade = self.active_recovery_trades[strat_id]
            t_type, g_entry, g_sl, g_tp = recovery_trade['type'], recovery_trade['entry_price'], recovery_trade['sl'], recovery_trade['tp']

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

            is_invalid = (t_type == 'buy' and tick.bid >= g_tp) or (t_type == 'sell' and tick.ask <= g_tp)

            if is_invalid:
                if has_pending:
                    current_time = pd.Timestamp.now()
                    if 'delete_retry_time' in recovery_trade and current_time < recovery_trade['delete_retry_time']: return 

                    res = mt5_lib.order_send({"action": mt5_lib.TRADE_ACTION_REMOVE, "order": pending_ticket})
                    if res and res.retcode == mt5_lib.TRADE_RETCODE_DONE:
                        self.active_recovery_trades[strat_id] = None
                        if hasattr(strat, 'on_exit'): 
                            try: strat.on_exit() 
                            except: pass
                    else:
                        retries = recovery_trade.get('delete_retries', 0)
                        if retries < 1: 
                            recovery_trade['delete_retries'] = retries + 1
                            recovery_trade['delete_retry_time'] = current_time + pd.Timedelta(seconds=10)
                            return 
                        else: 
                            self.active_recovery_trades[strat_id] = None
                            if hasattr(strat, 'on_exit'): 
                                try: strat.on_exit() 
                                except: pass
                else:
                    self.active_recovery_trades[strat_id] = None
                    if hasattr(strat, 'on_exit'): 
                        try: strat.on_exit() 
                        except: pass
            else:
                if not has_pending:
                    execute_market = (t_type == 'buy' and tick.ask <= g_entry) or (t_type == 'sell' and tick.bid >= g_entry)
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
                            self.active_recovery_trades[strat_id] = None
                        else:
                            success = self._execute_limit_order(t_type, g_entry, g_sl, g_tp, s_config, df_recovery)
                            if not success: self.active_recovery_trades[strat_id] = None

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
        # 3. 🧠 NORMAL SIGNAL LOGIC (Unbroken Rhythm Architecture)
        # ==============================================================================
        if not is_new_candle_tick: return
        self.last_candle_times[strat_id] = current_candle_time

        df = self.mt5.get_candles(symbol, s_config['TIMEFRAME_MT5'], s_config['LOOKBACK_PERIOD'])
        if df is None: return

        # ALWAYS calculate indicators to maintain state rhythm
        try:
            if hasattr(strat, 'prepare_indicators'):
                df = strat.prepare_indicators(df.copy(), s_config.get('candle_type', 'STANDARD'))
            for rule in s_config.get('MONEY_MANAGEMENT_MODE', []):
                if hasattr(rule, 'prepare_indicators'): df = rule.prepare_indicators(df)
        except Exception as e: 
            ui_log('error', f"❌ [INDICATOR ERROR] Strategy: {strat_id}\n[TRACEBACK]\n{traceback.format_exc()}")
            return

        trade_type, entry_anchor, sl_anchor, tp_anchor = None, None, None, None
        if hasattr(strat, 'check_entry_signal'):
            try:
                res = strat.check_entry_signal(df)
                if isinstance(res, tuple) and len(res) == 4:
                    trade_type, entry_anchor, sl_anchor, tp_anchor = res
            except Exception as e:
                ui_log('error', f"❌ [SIGNAL LOGIC ERROR] Strategy: {strat_id}\n[TRACEBACK]\n{traceback.format_exc()}")
                pass

        # --- THE EXECUTION GATE (Block Orders based on Time Filters) ---
        if trade_type:
            # 1. Trading Days Filter (UI Managed)
            allowed_days = s_config.get('allowed_days', [0, 1, 2, 3, 4, 5, 6])
            if current_candle_time.dayofweek not in allowed_days:
                return 

            # 2. Killzones / Trading Hours Filter (UI Managed)
            killzones = s_config.get('killzones', [])
            if killzones and isinstance(killzones, list) and killzones[0] != "":
                candle_time_str = current_candle_time.strftime('%H:%M')
                in_killzone = False
                for zone in killzones:
                    if '-' in zone:
                        start_t, end_t = zone.split('-')
                        if start_t <= candle_time_str <= end_t:
                            in_killzone = True
                            break
                if not in_killzone:
                    return 

            # 3. Lockout Timer Filter (Delay between trades)
            if self.lockout_until.get(strat_id) and current_candle_time < self.lockout_until[strat_id]: 
                return

            # ✅ All filters passed -> Execute Trade
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
            safe_raw_lot, _ = self.margin_manager.get_safe_lot_size(
                acc_info.margin, symbol, desired_lot, calc_entry, s_config['contract_size']
            )
            final_lot = self.mt5.normalize_volume(symbol, safe_raw_lot)

            if final_lot > 0:
                order_comment = f"{symbol}-Ghost" if is_recovery else f"{symbol}-{s_config['strategy_id']}"
                success = self.mt5.send_market_order(
                    symbol, trade_type, final_lot, final_sl, final_tp, 
                    s_config['magic_number'], comment=order_comment
                )
                if success:
                    lock_seconds = s_config.get('TIMEFRAME_SECONDS', 300)
                    # Use current_candle_time to align with broker's timezone
                    self.lockout_until[s_config['strategy_id']] = current_candle_time + pd.Timedelta(seconds=lock_seconds)
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
                ui_log('warning', f"🎣 [MT5 LIMIT PLACED] Waiting for Pullback on {symbol} | Vol: {final_lot}")
                mt5_type = mt5_lib.ORDER_TYPE_BUY_LIMIT if trade_type == 'buy' else mt5_lib.ORDER_TYPE_SELL_LIMIT
                
                request = {
                    "action": mt5_lib.TRADE_ACTION_PENDING, "symbol": symbol, "volume": float(final_lot),
                    "type": mt5_type, "price": float(calc_entry), "sl": float(final_sl), "tp": float(final_tp),
                    "magic": s_config['magic_number'], "comment": f"{symbol}-GLimit", "type_time": mt5_lib.ORDER_TIME_GTC
                }
                if mt5_lib.order_send(request).retcode == mt5_lib.TRADE_RETCODE_DONE:
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
                try:
                    res = rule.calculate_risk_details(context)
                    if res:
                        if isinstance(res, list): lot = res[0].get('lot_size', lot)
                        elif isinstance(res, dict): lot = res.get('lot_size', lot)
                except Exception as e:
                    ui_log('error', f"❌ [RISK MANAGEMENT ERROR] Strategy: {s_config.get('strategy_id')}\n[TRACEBACK]\n{traceback.format_exc()}")
        return lot

# ==============================================================================
# 3. Live Position Manager
# ==============================================================================
class LivePositionManager:
    """Monitors live positions and evaluates exit criteria or trailing stops."""
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
            is_new_candle = (current_candle_time != self.last_processed_candle_time.get(strat_id))
            
            s_config['contract_size'] = self.mt5.get_real_contract_size(s_config['symbol'])

            for pos in strat_positions:
                self._process_position(pos, s_config, df, is_new_candle)

            if is_new_candle:
                self.last_processed_candle_time[strat_id] = current_candle_time

    def _process_position(self, mt5_pos, s_config, df, is_new_candle):
        pos_dict = {
            'ticket': mt5_pos.ticket, 'type': 'buy' if mt5_pos.type == 0 else 'sell',
            'entry_price': mt5_pos.price_open, 'sl': mt5_pos.sl, 'tp': mt5_pos.tp,
            'lot_size': mt5_pos.volume, 'initial_sl': mt5_pos.sl, 'partial_closed': "PARTIAL" in mt5_pos.comment
        }
        
        closed_candle = df.iloc[-2] if len(df) >= 2 else df.iloc[-1]
        current_candle = df.iloc[-1] 
        strat = s_config['strategy']
        risk_rules = s_config.get('MONEY_MANAGEMENT_MODE', [])
        if not isinstance(risk_rules, list): risk_rules = [risk_rules]

        if is_new_candle:
            context_closed = {'position': pos_dict, 'current_candle': closed_candle, 'history_slice': df.iloc[:-1], 'config': s_config}
            for rule in risk_rules:
                if hasattr(rule, 'check_partial_exit'):
                    try:
                        vol = rule.check_partial_exit(context_closed)
                        if vol: self._execute_partial(mt5_pos, vol)
                    except Exception as e:
                        ui_log('error', f"❌ [PARTIAL EXIT ERROR] Strategy: {s_config['strategy_id']}\n[TRACEBACK]\n{traceback.format_exc()}")
                
                if hasattr(rule, 'update_sl'):
                    try:
                        new_sl = rule.update_sl(context_closed)
                        if new_sl:
                            norm_sl = self.mt5.normalize_price(mt5_pos.symbol, new_sl)
                            if norm_sl != mt5_pos.sl:
                                 self.mt5.modify_position(mt5_pos.ticket, mt5_pos.symbol, norm_sl, mt5_pos.tp)
                    except Exception as e:
                        ui_log('error', f"❌ [TRAILING STOP ERROR] Strategy: {s_config['strategy_id']}\n[TRACEBACK]\n{traceback.format_exc()}")

        if hasattr(strat, 'check_exit_conditions'):
            try:
                res = strat.check_exit_conditions(current_candle, df, pos_dict)
                if isinstance(res, tuple) and len(res) == 2:
                    exit_price, reason = res
                    if exit_price:
                        self._execute_full_close(mt5_pos, exit_price, reason)
                else:
                    ui_log('error', f"❌ [EXIT WARNING] Strategy: {s_config['strategy_id']} 'check_exit_conditions' must return (exit_price, reason).")
            except Exception as e:
                ui_log('error', f"❌ [EXIT LOGIC ERROR] Strategy: {s_config['strategy_id']}\n[TRACEBACK]\n{traceback.format_exc()}")

    def _execute_partial(self, mt5_pos, vol):
        tick = self.mt5.get_symbol_tick(mt5_pos.symbol)
        if not tick: return
        price = tick.bid if mt5_pos.type == 0 else tick.ask
        type_c = 1 if mt5_pos.type == 0 else 0
        self.mt5.close_partial(mt5_pos.ticket, mt5_pos.symbol, vol, type_c, price)

    def _execute_full_close(self, mt5_pos, price, reason):
        if not isinstance(price, (int, float)) or price <= 0:
            tick = self.mt5.get_symbol_tick(mt5_pos.symbol)
            if not tick: return
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
        except Exception: return None

# ==============================================================================
# 4. Live Trader Main Engine Call (Protected with Fatal Crash Handler)
# ==============================================================================
class LiveTrader:
    """The central loop governing connections, locks, and strategy execution."""
    def __init__(self, config):
        self.config = config
        ui_log('success', f"🚀 Initializing Live Trader V4.1.0 (Production Safe)...")
        self.mt5_interface = MT5Interface(config.get("MT5_PATH"))
        
        acc_info = self.mt5_interface.get_account_info()
        if acc_info is not None:
            config['leverage'] = float(acc_info.leverage)
        
        self.margin_manager = MarginManager(config)
        self.target_lock = TargetLockManager(config)  
        self.signal_engine = LiveSignalEngine(self.mt5_interface, config, self.margin_manager)
        self.position_manager = LivePositionManager(self.mt5_interface, config)

    def run(self):
        ui_log('success', "🟢 Bot is Active and Listening to the Market...")
        connection_warned = False
        
        while True:
            try:
                # 1. Connection Heartbeat Check
                if not self.mt5_interface.is_connected():
                    if not connection_warned:
                        ui_log('warning', "⚠️ [NETWORK ALERT] MT5 Disconnected. Waiting for reconnection...")
                        connection_warned = True
                    os_time.sleep(3)
                    continue
                else:
                    if connection_warned:
                        ui_log('success', "✅ [NETWORK RESTORED] Reconnected to MT5 Broker Server.")
                        connection_warned = False

                # 2. Equity Target Lock Enforcement
                if self.target_lock.check_and_lock(self.mt5_interface):
                    ui_log('warning', "🔒 Target Lock Triggered! Shutting down MT5 engine session.")
                    mt5.shutdown()
                    break

                # 3. Position Execution & Entry Processing
                self.position_manager.manage_positions()
                self.signal_engine.process_entries()
                
                os_time.sleep(1)
                
            except KeyboardInterrupt:
                ui_log('warning', "\n🛑 Stopped by User.")
                mt5.shutdown()
                break
            except Exception as e:
                # Fatal Engine Crash UI Router
                error_trace = traceback.format_exc()
                crash_msg = f"❌ Fatal Engine Crash:\n{str(e)}\n\n[TRACEBACK]\n{error_trace}"
                ui_log('error', crash_msg)
                os_time.sleep(5) # Prevent rapid loop crashing