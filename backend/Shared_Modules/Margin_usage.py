import MetaTrader5 as mt5

class MarginManager:
    """
    Handles margin calculations and intelligent risk scaling for MT5.
    Ensures safe lot sizing based on broker-specific leverage and free margin.
    """
    
    def __init__(self, config: dict):
        self.leverage = config.get("leverage", 100.0)
        self.margin_limit_pct = config.get("margin_limit_pct", 0.99)
        self.max_allowed_margin = 0.0 
        print(f"⚖️ MarginManager Init: Base Leverage 1:{self.leverage}, Limit: {self.margin_limit_pct * 100}%")

    def update_account_limits(self, balance: float):
        """Updates the maximum allowed margin based on the current account balance."""
        self.max_allowed_margin = balance * self.margin_limit_pct

    def calculate_margin(self, symbol: str, lot: float, price: float, contract_size: float = None) -> float:
        """
        Calculates the exact margin required using MT5 built-in functions.
        Perfectly handles CFD leverage differences and dynamic margin rates.
        """
        if price <= 0 or lot <= 0: 
            return 0.0
        
        # mt5.ORDER_TYPE_BUY is strictly used to query the broker's margin requirement
        margin = mt5.order_calc_margin(mt5.ORDER_TYPE_BUY, symbol, lot, price)
        
        if margin is None:
            print(f"⚠️ Warning: MT5 margin calculation failed for {symbol}. Error: {mt5.last_error()}")
            # Fallback to the classic algorithmic formula if the API fails
            if contract_size:
                return (lot * contract_size * price) / self.leverage
            return 0.0
            
        return margin

    def get_safe_lot_size(self, current_used_margin: float, symbol: str, desired_lot: float, price: float, contract_size: float) -> tuple:
        """
        Intelligent risk management core:
        If margin is insufficient, it proportionally scales down the lot size
        based on the broker's exact margin requirements.
        
        Returns:
            tuple: (safe_lot_size, safe_margin_cost)
        """
        remaining_margin = self.max_allowed_margin - current_used_margin
        
        if remaining_margin <= 0:
            print(f"⚠️ Margin Blocked: No free margin left ({remaining_margin:.2f})")
            return 0.0, 0.0
            
        # Calculate the required margin for the initially desired lot size
        required_margin = self.calculate_margin(symbol, desired_lot, price, contract_size)
        
        # If the remaining margin can cover the requirement, proceed normally
        if 0 < required_margin <= remaining_margin:
            return desired_lot, required_margin
            
        # Smart Scaling: Scale down the lot size proportionally
        ratio = remaining_margin / required_margin
        safe_lot = desired_lot * ratio
        
        if safe_lot < desired_lot:
            print(f"📉 Margin Adjustment: {symbol} lot reduced from {desired_lot:.2f} to {safe_lot:.4f}")
            
        # Recalculate to ensure exact margin cost accuracy after the reduction
        safe_margin = self.calculate_margin(symbol, safe_lot, price, contract_size)
        
        return safe_lot, safe_margin