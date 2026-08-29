import pandas as pd
import numpy as np

# ==============================================================================
# 1. POSITION SIZING RULES
# ==============================================================================

class FixedLotRule:
    """
    Simplest approach: Fixed volume for all trades.
    Commission does not affect the volume calculation; it is only reflected in the final PnL.
    """
    def __init__(self, lot_size: float = 0.1):
        self.lot_size = lot_size

    def calculate_risk_details(self, context: dict) -> dict:
        return {
            'lot_size': self.lot_size,
            'stop_loss': context['stop_loss'],
            'take_profit': context['take_profit'],
        }

class FixedRiskAmountRule:
    """
    Capital management based on a fixed dollar amount (including commission).
    Formula aligns the total cost (SL distance + Commission) with the specified risk amount.
    """
    def __init__(self, risk_amount_dollar: float = 50.0):
        self.risk_amount = float(risk_amount_dollar)

    def calculate_risk_details(self, context: dict) -> dict:
        entry = context.get('entry_price')
        sl = context.get('stop_loss')
        
        if entry is None or sl is None:
            return None

        risk_distance = abs(entry - sl)
        if risk_distance == 0:
            return {'lot_size': 0}
            
        config = context['config']
        contract_size = config.get('contract_size', 1)
        point_value = config.get('point_value', 1.0)
        commission_per_lot = config.get('COMMISSION_PER_LOT', 0.0)
        
        price_loss_per_lot = risk_distance * contract_size * point_value
        total_risk_cost_per_lot = price_loss_per_lot + commission_per_lot
        
        if total_risk_cost_per_lot <= 0:
            return {'lot_size': 0}

        lot_size = self.risk_amount / total_risk_cost_per_lot
        lot_size = max(0.01, round(lot_size, 2))

        return {
            'lot_size': lot_size,
            'stop_loss': sl,
            'take_profit': context.get('take_profit'),
        }

class PercentRiskRule:
    """
    Percentage-based risk modeling (including round-turn commission limits).
    """
    def __init__(self, risk_percent: float = 1.0):
        self.risk_percent = risk_percent / 100.0

    def calculate_risk_details(self, context: dict) -> dict:
        equity = context['equity']
        entry = context.get('entry_price')
        sl = context.get('stop_loss')
        
        if entry is None or sl is None: 
            return None
        
        risk_distance = abs(entry - sl)
        if risk_distance == 0: 
            return {'lot_size': 0}
        
        config = context['config']
        contract_size = config.get('contract_size', 1)
        point_value = config.get('point_value', 1.0)
        commission_per_lot = config.get('COMMISSION_PER_LOT', 0.0)
        
        risk_amount = equity * self.risk_percent
        price_loss_per_lot = risk_distance * contract_size * point_value
        total_risk_cost_per_lot = price_loss_per_lot + commission_per_lot
        
        if total_risk_cost_per_lot <= 0: 
            return {'lot_size': 0}
        
        lot_size = risk_amount / total_risk_cost_per_lot
        lot_size = max(0.01, round(lot_size, 2))
        
        return {
            'lot_size': lot_size,
            'stop_loss': sl,
            'take_profit': context.get('take_profit'),
        }
    
class VolatilitySizingRule:
    """
    Volume sizing based on market volatility (ATR).
    High volatility -> Wider SL -> Smaller Volume.
    Low volatility -> Tighter SL -> Larger Volume.
    """
    def __init__(self, risk_amount_dollar: float = 100.0, atr_multiplier: float = 2.0, atr_period: int = 14):
        self.risk_amount = float(risk_amount_dollar)
        self.atr_mult = float(atr_multiplier)
        self.atr_period = atr_period

    def prepare_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        col_name = f'ATR_{self.atr_period}'
        if 'ATR' not in data.columns and col_name not in data.columns:
             try:
                 import pandas_ta as ta
                 data['ATR'] = ta.atr(data['high'], data['low'], data['close'], length=self.atr_period)
             except ImportError:
                 pass
        return data

    def calculate_risk_details(self, context: dict) -> dict:
        candle = context['current_candle']
        entry = context.get('entry_price')
        trade_type = context.get('trade_type')
        config = context['config']
        
        atr_value = candle.get('ATR', candle.get(f'ATR_{self.atr_period}'))
            
        if pd.isna(atr_value) or atr_value == 0:
            return {'lot_size': 0}

        sl_distance = atr_value * self.atr_mult
        stop_loss = (entry - sl_distance) if trade_type == 'buy' else (entry + sl_distance)

        contract_size = config.get('contract_size', 1)
        point_value = config.get('point_value', 1.0)
        risk_per_lot = sl_distance * contract_size * point_value
        
        if risk_per_lot <= 0: 
            return {'lot_size': 0}

        lot_size = max(0.01, round(self.risk_amount / risk_per_lot, 2))
        
        take_profit = context.get('take_profit')
        if take_profit is None:
            tp_dist = sl_distance * 2.0
            take_profit = (entry + tp_dist) if trade_type == 'buy' else (entry - tp_dist)

        return {
            'lot_size': lot_size,
            'stop_loss': stop_loss,    
            'take_profit': take_profit 
        }

# ==============================================================================
# 2. TRADE MANAGEMENT RULES
# ==============================================================================

class TrailingStopRule:
    """
    ATR Trailing Stop logic.
    Trails the Stop Loss behind the asset price dynamically.
    """
    def __init__(self, atr_period: int = 14, atr_multiplier: float = 1.5, activation_rr: float = None):
        self.atr_period = atr_period
        self.atr_mult = atr_multiplier
        self.activation_rr = activation_rr

    def prepare_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        if 'ATR_TRAIL' not in data.columns:
            h = data.get('high', data['close'])
            l = data.get('low', data['close'])
            c = data['close']
            try:
                import pandas_ta as ta
                data['ATR_TRAIL'] = ta.atr(h, l, c, length=self.atr_period)
            except ImportError:
                pass 
        return data

    def update_sl(self, context: dict):
        pos = context['position']
        candle = context['current_candle']
        
        atr_val = candle.get('ATR_TRAIL', 0)
        if pd.isna(atr_val) or atr_val == 0: 
            return None

        if self.activation_rr is not None:
            entry = pos['entry_price']
            initial_sl = pos.get('initial_sl', pos['sl'])
            risk_dist = abs(entry - initial_sl)
            
            if risk_dist == 0: 
                return None 

            current_profit = (candle['high'] - entry) if pos['type'] == 'buy' else (entry - candle['low'])
            if current_profit < (risk_dist * self.activation_rr):
                return None

        dist = atr_val * self.atr_mult
        current_sl = pos.get('sl')

        if pos['type'] == 'buy':
            new_sl = candle['low'] - dist
            if current_sl is None or new_sl > current_sl:
                return new_sl
        else:
            new_sl = candle['high'] + dist
            if current_sl is None or new_sl < current_sl:
                return new_sl
        return None

class BreakevenHandler:
    """
    Breakeven Rule:
    Moves the Stop Loss to the entry price (+ buffer) once profit hits the trigger threshold.
    """
    def __init__(self, trigger_rr_ratio: float = 1.0, buffer_pips: float = 2.0):
        self.trigger_rr_ratio = trigger_rr_ratio
        self.buffer_pips = buffer_pips

    def update_sl(self, context: dict):
        pos = context['position']
        candle = context['current_candle']
        config = context['config']
        
        entry = pos['entry_price']
        ref_sl = pos.get('initial_sl', pos['sl'])
        risk_dist = abs(entry - ref_sl)
        
        if risk_dist == 0: 
            return None

        current_profit_dist = (candle['high'] - entry) if pos['type'] == 'buy' else (entry - candle['low'])

        if current_profit_dist >= (risk_dist * self.trigger_rr_ratio):
            pv = config.get('point_value', 1.0)
            if pos['type'] == 'buy':
                new_sl = entry + (self.buffer_pips * pv)
                if new_sl > pos['sl']: return new_sl
            else:
                new_sl = entry - (self.buffer_pips * pv)
                if new_sl < pos['sl']: return new_sl
        return None

class StepBreakevenHandler:
    """
    Step Trailing Stop Management.
    Advances the Stop Loss in predefined steps (e.g., locking 1R at 2R profit).
    """
    def __init__(self, steps: list = None, buffer_pips: float = 2.0):
        self.steps = sorted(steps, key=lambda x: x[0]) if steps else [(1.0, 0.0)]
        self.buffer_pips = buffer_pips

    def update_sl(self, context: dict):
        pos = context['position']
        candle = context['current_candle']
        config = context['config']
        
        entry = pos['entry_price']
        ref_sl = pos.get('initial_sl', pos['sl'])
        risk_dist = abs(entry - ref_sl)
        
        if risk_dist == 0: 
            return None

        current_profit_dist = (candle['high'] - entry) if pos['type'] == 'buy' else (entry - candle['low'])
        current_rr = current_profit_dist / risk_dist
        
        best_lock_rr = None
        for trigger_rr, lock_rr in self.steps:
            if current_rr >= trigger_rr:
                best_lock_rr = lock_rr
            else:
                break
        
        if best_lock_rr is None:
            return None

        pv = config.get('point_value', 1.0)
        buffer_val = self.buffer_pips * pv
        lock_dist_price = (risk_dist * best_lock_rr) + buffer_val

        if pos['type'] == 'buy':
            new_sl = entry + lock_dist_price
            if new_sl > pos['sl']: return new_sl
        else:
            new_sl = entry - lock_dist_price
            if new_sl < pos['sl']: return new_sl
        return None

class PartialCloseRule:
    """
    Partial Exit Rule:
    Closes a portion of the position volume upon reaching a target profit.
    """
    def __init__(self, target_rr: float = 1.0, close_volume: float = None, close_percentage: float = None):
        self.target_rr = float(target_rr)
        self.close_volume = close_volume
        self.close_percentage = close_percentage

    def check_partial_exit(self, context: dict):
        pos = context['position']
        
        if pos.get('partial_closed', False):
            return None

        candle = context['current_candle']
        entry = pos['entry_price']
        ref_sl = pos.get('initial_sl', pos['sl'])
        risk_dist = abs(entry - ref_sl)
        
        if risk_dist == 0: 
            return None
        
        current_profit_dist = (candle['high'] - entry) if pos['type'] == 'buy' else (entry - candle['low'])

        if current_profit_dist >= (risk_dist * self.target_rr):
            current_lot = pos['lot_size']
            final_lot_to_close = 0.0
            
            if self.close_percentage is not None:
                final_lot_to_close = current_lot * self.close_percentage
            elif self.close_volume is not None:
                final_lot_to_close = self.close_volume
            
            final_lot_to_close = round(final_lot_to_close, 2)
            
            # Security limits preventing fractional execution errors
            if final_lot_to_close >= current_lot: return None
            if final_lot_to_close < 0.01: return None
            if (current_lot - final_lot_to_close) < 0.01: return None
            
            return final_lot_to_close
                
        return None