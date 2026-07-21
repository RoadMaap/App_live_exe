# target_lock.py
# Autonomous Profit Killswitch for Prop Firm Accounts

import MetaTrader5 as mt5
import time

class TargetLockManager:
    def __init__(self, config):
        """
        Initializes the Target Lock system.
        Reads the activation state and target equity from the main config.
        """
        self.enabled = config.get('TARGET_LOCK_ENABLED', False)
        self.target_equity = config.get('TARGET_EQUITY', 0.0)
        
        if self.enabled:
            print(f"🎯 Target Lock Active: Engine will halt when Equity hits ${self.target_equity:,.2f}")

    def check_and_lock(self, mt5_interface):
        """
        Scans the current equity. If the target is reached, it triggers the Killswitch:
        1. Closes all open positions with guaranteed retry.
        2. Cancels all pending orders with guaranteed retry.
        3. Returns True to halt the main engine loop.
        """
        if not self.enabled:
            return False

        acc_info = mt5_interface.get_account_info()
        if acc_info is None:
            return False

        current_equity = acc_info.equity

        if current_equity >= self.target_equity:
            print("\n" + "="*60)
            print(f"🎉 [CHALLENGE PASSED] Target Equity Reached: ${current_equity:,.2f}!")
            print(f"🛑 [TARGET LOCK] Triggering Auto-Killswitch...")
            print("="*60)
            
            # Execute with guaranteed success loops (Anti-Rejection System)
            self._close_all_positions_guaranteed(mt5_interface)
            self._cancel_all_pending_guaranteed()
            
            print("✅ Account is perfectly flat and safe. Shutting down bot.")
            return True 
            
        return False

    def _close_all_positions_guaranteed(self, mt5_interface, max_retries=15):
        """
        Attempts to close all positions. If the broker rejects the request 
        (e.g., due to high volatility slippage), it retries until the account is flat.
        """
        for attempt in range(1, max_retries + 1):
            positions = mt5_interface.get_open_positions()
            if not positions:
                return # Success: No open positions left
                
            print(f"   ⏳ Closing running positions (Attempt {attempt}/{max_retries})...")
            
            for pos in positions:
                tick = mt5_interface.get_symbol_tick(pos.symbol)
                if not tick: continue
                
                # Determine the opposite order type to close the position
                type_c = mt5.ORDER_TYPE_SELL if pos.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
                price = tick.bid if pos.type == mt5.POSITION_TYPE_BUY else tick.ask
                
                # Execute Market Close
                success = mt5_interface.close_full(pos.ticket, pos.symbol, pos.volume, type_c, price, "TARGET_WON")
                if success:
                    print(f"   ✂️ Force closed position {pos.ticket} on {pos.symbol}")
                else:
                    print(f"   ⚠️ Broker rejected close for {pos.ticket}. Retrying in next loop...")
            
            time.sleep(1.0) # Wait 1 second before retrying to prevent server flooding

        print("❌ [CRITICAL] Failed to close some positions after maximum retries. Check MT5 Manually!")

    def _cancel_all_pending_guaranteed(self, max_retries=10):
        """
        Attempts to cancel all pending/ghost orders with a retry mechanism.
        """
        for attempt in range(1, max_retries + 1):
            orders = mt5.orders_get()
            if not orders:
                return # Success: No pending orders left
                
            print(f"   ⏳ Canceling pending orders (Attempt {attempt}/{max_retries})...")
            
            for o in orders:
                request = {
                    "action": mt5.TRADE_ACTION_REMOVE, 
                    "order": o.ticket
                }
                res = mt5.order_send(request)
                if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"   🗑️ Removed pending order {o.ticket}")
                else:
                    print(f"   ⚠️ Failed to remove order {o.ticket}. Retrying in next loop...")
                    
            time.sleep(1.0) # Wait 1 second before retrying

        print("❌ [CRITICAL] Failed to clear all pending orders. Check MT5 Manually!")