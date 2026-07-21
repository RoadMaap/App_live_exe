# ==============================================================================
# STRATEGY: GAP HUNTER (GAP4)
# Version: 7.4.0 (Global ISO-Week Alignment & Anti-Stray-Tick Sync)
# ==============================================================================
import mplfinance as mpf
import pandas as pd
import numpy as np
from datetime import time

class GAP4:
    def __init__(self, params):
        """
        Strategy: GAP Hunter V7.4 (Perfect Mirror + Global ISO-Week Sync)
        """
        self.params = params
        self.fvg_threshold = params.get('FVG_COUNT', 1)
        self.sl_tiers = params.get('SL_TIERS', [])
        
        self.bull_fvgs = [] 
        self.bear_fvgs = []
        self.flat_period_high = None
        self.flat_period_low = None
        self.skip_processing = False

        # --- Shadow State (Simulation) ---
        self.sim_active = False      
        self.current_shadow_trade = None 
        self.shadow_history_log = []

        # --- Pending Order State ---
        self.pending_active = False
        self.current_pending_trade = None
        self.pending_history_log = [] 

    def on_exit(self):
        self.skip_processing = True

    def prepare_indicators(self, data, candle_type='STANDARD'):
        data.dropna(inplace=True)
        return data

    def check_exit_conditions(self, current_candle, history_slice, position):
        # Exit management (SL/TP) is fully handled by the core engine (PositionManager)
        return None, None

    def check_filters(self, current_time):
        allowed_days = self.params.get('ALLOWED_DAYS', [0, 1, 2, 3, 4])
        if current_time.weekday() not in allowed_days:
            return False
            
        killzones = self.params.get('KILLZONES', [])
        if killzones:
            current_time_only = current_time.time()
            in_killzone = False
            for start_time, end_time in killzones:
                if start_time <= current_time_only <= end_time:
                    in_killzone = True
                    break
            if not in_killzone:
                return False
                
        return True 

    def check_entry_signal(self, history_slice):
        if len(history_slice) < 5: return None, None, None, None

        current_candle = history_slice.iloc[-1]
        signal_candle = history_slice.iloc[-2]
        prev_candle = history_slice.iloc[-3]
        prev_prev_candle = history_slice.iloc[-4]

        # ==================================================================
        # 0. WEEKEND GAP RESET (Anti-Stray-Tick System)
        # ==================================================================
        # Utilizing the international ISO Week calendar to bypass brokers' fake weekend candles
        curr_week = signal_candle.name.isocalendar()[1]
        prev_week = prev_candle.name.isocalendar()[1]
        curr_year = signal_candle.name.year
        prev_year = prev_candle.name.year

        if curr_week != prev_week or curr_year != prev_year: 
            print(f"🔄 [WEEKEND RESET] New ISO-Week Detected at {signal_candle.name}. Clearing memory...")
            self._reset_state()

        # ==================================================================
        # 0.1 PENDING MANAGEMENT
        # ==================================================================
        if self.pending_active:
            p_trade = self.current_pending_trade
            cancel_price = p_trade['cancel_price']
            trigger_price = p_trade['trigger_price']
            p_dir = p_trade['direction']
            
            is_canceled = False
            is_triggered = False

            if p_trade['original_signal'] == 'buy':
                if signal_candle['low'] <= cancel_price: is_canceled = True
                elif signal_candle['high'] >= trigger_price: is_triggered = True
            elif p_trade['original_signal'] == 'sell':
                if signal_candle['high'] >= cancel_price: is_canceled = True
                elif signal_candle['low'] <= trigger_price: is_triggered = True

            if is_canceled:
                p_trade['end_time'] = signal_candle.name 
                self.pending_history_log.append(p_trade)
                self.pending_active = False
                self.current_pending_trade = None
                self._reset_state()
                return None, None, None, None

            if is_triggered:
                p_trade['end_time'] = signal_candle.name 
                self.pending_history_log.append(p_trade)
                self.pending_active = False
                trade_to_exec = self.current_pending_trade
                self.current_pending_trade = None
                self._reset_state()
                
                if trade_to_exec.get('is_virtual', False):
                    self.sim_active = True
                    self.current_shadow_trade = {
                        'start_time': signal_candle.name,
                        'direction': trade_to_exec['direction'],
                        'sl': trade_to_exec['sl'],
                        'tp': trade_to_exec['tp'],
                        'end_time': None
                    }
                    print(f"👻 [VIRTUAL PENDING TRIGGERED] Moved to Shadow | Dir: {trade_to_exec['direction'].upper()}")
                    return None, None, None, None
                else:
                    return trade_to_exec['direction'], trade_to_exec['trigger_price'], trade_to_exec['sl'], trade_to_exec['tp']

            return None, None, None, None

        # ==================================================================
        # 0.2 SIMULATION MANAGEMENT
        # ==================================================================
        if self.sim_active and self.current_shadow_trade:
            trade = self.current_shadow_trade
            sim_exited = False
            exit_price = None
            if trade['direction'] == 'buy':
                if signal_candle['low'] <= trade['sl']: 
                    sim_exited = True; exit_price = trade['sl']
                elif signal_candle['high'] >= trade['tp']: 
                    sim_exited = True; exit_price = trade['tp']
            elif trade['direction'] == 'sell':
                if signal_candle['high'] >= trade['sl']: 
                    sim_exited = True; exit_price = trade['sl']
                elif signal_candle['low'] <= trade['tp']: 
                    sim_exited = True; exit_price = trade['tp']
            
            if sim_exited:
                print(f"🔴 [SHADOW END] Exit at {exit_price:.5f} | Dir: {trade['direction'].upper()} | Date: {signal_candle.name}")
                trade['end_time'] = signal_candle.name
                self.shadow_history_log.append(trade)
                self.sim_active = False
                self.current_shadow_trade = None
                self.skip_processing = True 
                return None, None, None, None

        # ==================================================================
        # 1. RHYTHM KEEPER 
        # ==================================================================
        if self.skip_processing:
            self.skip_processing = False
            return None, None, None, None
        
        # ==================================================================
        # 2. STRATEGY LOGIC 
        # ==================================================================
        if self.flat_period_low is None:
            self.flat_period_low = float(signal_candle['low'])
            self.flat_period_high = float(signal_candle['high'])
        else:
            self.flat_period_low = min(self.flat_period_low, float(signal_candle['low']))
            self.flat_period_high = max(self.flat_period_high, float(signal_candle['high']))

        if float(signal_candle['low']) > float(prev_prev_candle['high']):
            self.bull_fvgs.append({'level': float(prev_prev_candle['high']), 'filled': False})
        if float(signal_candle['high']) < float(prev_prev_candle['low']):
            self.bear_fvgs.append({'level': float(prev_prev_candle['low']), 'filled': False})

        self.bull_fvgs = [f for f in self.bull_fvgs if float(signal_candle['low']) > f['level']]
        self.bear_fvgs = [f for f in self.bear_fvgs if float(signal_candle['high']) < f['level']]

        unfilled_bulls = len(self.bull_fvgs)
        unfilled_bears = len(self.bear_fvgs)

        entry_price = float(current_candle['open'])
        potential_signal = None
        stop_loss = 0.0
        risk_size = 0.0 
        
        if unfilled_bulls >= self.fvg_threshold:
            potential_signal = 'buy'
            stop_loss = self.flat_period_low
            risk_size = entry_price - stop_loss
            if risk_size <= 0: potential_signal = None

        elif unfilled_bears >= self.fvg_threshold:
            potential_signal = 'sell'
            stop_loss = self.flat_period_high
            risk_size = stop_loss - entry_price
            if risk_size <= 0: potential_signal = None

        # ==================================================================
        # 3. DECISION LOGIC 
        # ==================================================================
        if potential_signal:
            is_in_killzone = self.check_filters(current_candle.name)
            matched_tier = None
            for tier in self.sl_tiers:
                if tier['min'] <= risk_size < tier['max']:
                    matched_tier = tier
                    break
            
            if not matched_tier: return None, None, None, None
            
            action = matched_tier['action']
            if action in ['real', 'shadow']:
                final_signal = potential_signal
                final_sl = stop_loss
                current_rr = matched_tier.get('rr', 1.0)
                is_reversed = matched_tier.get('reverse', False)
                
                if action == 'shadow': 
                    current_rr = 1.0
                    is_reversed = False

                if is_reversed:
                    final_signal = 'sell' if potential_signal == 'buy' else 'buy'
                    final_sl = entry_price + risk_size if final_signal == 'sell' else entry_price - risk_size 
                        
                if final_signal == 'buy':
                    take_profit = entry_price + (abs(entry_price - final_sl) * current_rr)
                else:
                    take_profit = entry_price - (abs(entry_price - final_sl) * current_rr)

                # -------------------------------------------------------------------
                # 🚨 CORE BRAIN STATUS LOGGER (DEBUG LOGGER) 🚨
                # -------------------------------------------------------------------
                if action == 'real':
                    if is_in_killzone:
                        print(f"🎯 [REAL TRADE] Date: {current_candle.name} | Signal: {final_signal.upper()} | Bull_FVG: {unfilled_bulls} | Bear_FVG: {unfilled_bears} | Box High: {self.flat_period_high} | Box Low: {self.flat_period_low} | Risk Size: {risk_size:.1f} | SL: {final_sl:.1f} | TP: {take_profit:.1f}")
                        self._reset_state()
                        return final_signal, entry_price, final_sl, take_profit
                    else:
                        print(f"👻 [SHADOW CREATED] Date: {current_candle.name} | Signal: {final_signal.upper()} | Bull_FVG: {unfilled_bulls} | Bear_FVG: {unfilled_bears} | Box High: {self.flat_period_high} | Box Low: {self.flat_period_low} | Risk Size: {risk_size:.1f}")
                        self.sim_active = True
                        self.current_shadow_trade = {
                            'start_time': current_candle.name,
                            'direction': final_signal,
                            'sl': final_sl,
                            'tp': take_profit,
                            'end_time': None
                        }
                        self._reset_state()
                        return None, None, None, None
            
            elif action == 'pending_reverse':
                trigger_price = entry_price + (risk_size * 0.5) if potential_signal == 'buy' else entry_price - (risk_size * 0.5)
                final_sl = entry_price + risk_size if potential_signal == 'buy' else entry_price - risk_size
                final_tp = stop_loss 
                pending_dir = 'sell' if potential_signal == 'buy' else 'buy'

                self.pending_active = True
                self.current_pending_trade = {
                    'start_time': current_candle.name, 
                    'original_signal': potential_signal,
                    'direction': pending_dir,
                    'trigger_price': trigger_price,
                    'sl': final_sl,
                    'tp': final_tp,
                    'cancel_price': stop_loss,
                    'is_virtual': not is_in_killzone 
                }
                print(f"⏳ [PENDING CREATED] Date: {current_candle.name} | Original: {potential_signal.upper()} -> Pending: {pending_dir.upper()} | Bull_FVG: {unfilled_bulls} | Bear_FVG: {unfilled_bears}")
                return None, None, None, None

        return None, None, None, None

    def _reset_state(self):
        self.bull_fvgs = []
        self.bear_fvgs = []
        self.flat_period_high = None
        self.flat_period_low = None
        self.skip_processing = False

    def get_plot_addplots(self, plot_data, ap, config):
        safe_ap = []
        if ap:
            for p_dict in ap:
                try:
                    data = p_dict.get('data', None) if isinstance(p_dict, dict) else getattr(p_dict, 'data', None)
                    if data is not None:
                        if isinstance(data, (pd.Series, pd.DataFrame)) and data.dropna().empty: continue
                        if isinstance(data, np.ndarray) and np.isnan(data).all(): continue
                        safe_ap.append(p_dict)
                except Exception:
                    safe_ap.append(p_dict)

        if not plot_data.empty:
            shadow_sl = pd.Series(np.nan, index=plot_data.index)
            shadow_tp = pd.Series(np.nan, index=plot_data.index)
            has_shadow_data = False

            for trade in self.shadow_history_log:
                s_time = trade['start_time']
                e_time = trade['end_time']
                if e_time and (s_time in plot_data.index or e_time in plot_data.index):
                    mask = (plot_data.index >= s_time) & (plot_data.index <= e_time)
                    if mask.any():
                        shadow_sl.loc[mask] = trade['sl']
                        shadow_tp.loc[mask] = trade['tp']
                        has_shadow_data = True

            if self.sim_active and self.current_shadow_trade:
                s_time = self.current_shadow_trade['start_time']
                if s_time in plot_data.index:
                    mask = (plot_data.index >= s_time)
                    if mask.any():
                        shadow_sl.loc[mask] = self.current_shadow_trade['sl']
                        shadow_tp.loc[mask] = self.current_shadow_trade['tp']
                        has_shadow_data = True

            if has_shadow_data:
                if not shadow_sl.dropna().empty: safe_ap.append(mpf.make_addplot(shadow_sl, color='blue', linestyle=':', width=1.5, alpha=0.6, panel=0))
                if not shadow_tp.dropna().empty: safe_ap.append(mpf.make_addplot(shadow_tp, color='blue', linestyle=':', width=1.5, alpha=0.6, panel=0))

            pending_trigger = pd.Series(np.nan, index=plot_data.index)
            has_pending_data = False

            for ptr in self.pending_history_log:
                s_time = ptr.get('start_time')
                e_time = ptr.get('end_time')
                if e_time and (s_time in plot_data.index or e_time in plot_data.index):
                    mask = (plot_data.index >= s_time) & (plot_data.index <= e_time)
                    if mask.any():
                        pending_trigger.loc[mask] = ptr['trigger_price']
                        has_pending_data = True

            if self.pending_active and self.current_pending_trade:
                s_time = self.current_pending_trade.get('start_time')
                if s_time in plot_data.index:
                    mask = (plot_data.index >= s_time)
                    if mask.any():
                        pending_trigger.loc[mask] = self.current_pending_trade['trigger_price']
                        has_pending_data = True

            if has_pending_data:
                if not pending_trigger.dropna().empty: 
                    safe_ap.append(mpf.make_addplot(pending_trigger, color='orange', linestyle='--', width=2.0, alpha=0.9, panel=0))

        return safe_ap, (1,)