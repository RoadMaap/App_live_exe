# ==============================================================================
# CORE ERROR HANDLER & AI DEBUGGER (v7.0 ENTERPRISE EDITION)
# Features: Complete MT5 Error Lexicon, Smart Prompt Generator, Crash Resilience
# ==============================================================================

import traceback
import time
import pandas as pd
import numpy as np
from functools import wraps

def ui_log(msg_type, text):
    """Safely routes logs to terminal stdout and React Frontend Debugger."""
    print(text)
    try:
        import eel
        if hasattr(eel, 'update_status'):
            eel.update_status(msg_type, text)
    except Exception:
        pass


class StrategyValidator:
    """
    Advanced Engine to validate user strategy architecture, return types, 
    and DataFrame integrity (NaN/Inf detection) at runtime.
    """
    
    @staticmethod
    def pre_flight_check(strat_class_instance):
        required_methods = ['prepare_indicators', 'check_entry_signal']
        missing = [m for m in required_methods if not hasattr(strat_class_instance, m) or not callable(getattr(strat_class_instance, m))]
        
        if missing:
            return False, f"Missing required methods in your Strategy Class: {missing}. You must define them."
        return True, ""

    @staticmethod
    def validate_return(method_name, result):
        if result is None:
            return True, ""

        if method_name == 'prepare_indicators':
            if not isinstance(result, pd.DataFrame):
                return False, f"Expected Pandas 'DataFrame', but got '{type(result).__name__}'."
            
            required_cols = {'open', 'high', 'low', 'close'}
            missing_cols = required_cols - set(result.columns.str.lower())
            if missing_cols:
                return False, f"DataFrame is missing crucial price columns: {missing_cols}."
                
            tail_df = result.tail(5)
            if tail_df.isin([np.inf, -np.inf]).values.any():
                return False, f"Mathematical Error: Infinity (inf) detected in your DataFrame calculations (check division by zero)."
            if tail_df.isnull().values.any():
                nan_cols = tail_df.columns[tail_df.isnull().any()].tolist()
                return False, f"Data Corruption: NaN (Not a Number) detected in columns: {nan_cols}. Fix your indicator math/shift logic."
                
        elif method_name == 'check_entry_signal':
            if not isinstance(result, tuple) or len(result) != 4:
                return False, f"Expected tuple of 4: (trade_type, entry, sl, tp), but got {result}."
            if result[0] not in [None, 'buy', 'sell']:
                return False, f"Trade type (first element) must be 'buy' or 'sell'. Got '{result[0]}'."
            if result[0] is not None:
                if not all(isinstance(x, (int, float)) for x in result[1:4]):
                    return False, f"Entry, SL, and TP must be numbers (float/int). Got: {result[1:4]}"
                
        elif method_name == 'check_exit_conditions':
            if not isinstance(result, tuple) or len(result) != 2:
                return False, f"Expected tuple of 2: (exit_price, reason), but got {result}."
                
        elif method_name == 'check_partial_exit':
            if not isinstance(result, (int, float, type(None))):
                return False, f"Expected a number (volume to close) or None, got '{type(result).__name__}'."
                
        return True, ""


class ErrorManager:
    
    # Comprehensive MT5 Error Dictionary (Combined Trade & System Errors)
    MT5_ERRORS = {
        # Trade Server Return Codes
        10004: "Requote - Price changed dramatically.",
        10006: "Request Rejected - Blocked by broker (news, spread).",
        10007: "Request Canceled - Canceled by trader/system.",
        10009: "Order Done - Request completed successfully.",
        10013: "Invalid Request - Invalid ticket or symbol.",
        10014: "Invalid Volume - Lot size too big/small or invalid step.",
        10015: "Invalid Price - Requested price does not match market.",
        10016: "Invalid Stops (SL/TP) - Stops are too close to market (Stoplevel Limit).",
        10017: "Trade Disabled - Trading is prohibited for this symbol.",
        10018: "Market Closed - Outside trading hours.",
        10019: "Not Enough Money - Insufficient margin/balance.",
        10021: "Position Only Close - Broker allows Close-Only mode.",
        10027: "AutoTrading Disabled - Algo Trading button is OFF in terminal.",
        10030: "Unsupported Filling Mode - FOK/IOC not supported by broker.",
        10031: "No Connection - No connection to trade server.",
        10033: "Limit Reached - Max open positions limit reached.",
        10038: "Volume Limit - Max total volume limit reached.",
        10044: "Close By Rule - FIFO rules violation.",
        10046: "Margin Restricted - Account is in Margin Call state.",
        
        # Selected MQL5 Runtime Errors (Based on User's Log)
        4001: "Unexpected internal error",
        4002: "Wrong internal parameter",
        4003: "Invalid system function parameter",
        4010: "Invalid datetime format",
        4014: "Function call not allowed",
        4019: "Math overflow occurred",
        4024: "Invalid terminal handle",
        4104: "No Expert Advisor in chart to handle event",
        4301: "Unknown Market symbol",
        4302: "Symbol is not selected in Market Watch",
        4401: "Requested history not found",
        4403: "History request timeout exceeded",
        4404: "Number of requested bars limited by terminal settings",
        4752: "Trading by Expert Advisors prohibited (AutoTrading off)",
        4753: "Position not found",
        4754: "Order not found",
        4756: "Trade request sending failed",
        4758: "Failed to calculate profit or margin",
        4806: "Requested indicator data not found"
    }

    @staticmethod
    def get_error_description(retcode):
        return ErrorManager.MT5_ERRORS.get(retcode, f"Unknown Error Code: {retcode}")

    @staticmethod
    def handle_mt5_error(retcode, symbol, action_type):
        error_desc = ErrorManager.get_error_description(retcode)
        full_msg = f"❌ [MT5 REJECTED] Action: {action_type} | Symbol: {symbol}\nReason: {error_desc} (Code: {retcode})"
        ui_log('error', full_msg)
        return full_msg

    @staticmethod
    def catch_strategy_error(strat_id, method_name, exception, validation_msg=""):
        error_trace = traceback.format_exc()
        error_type = type(exception).__name__
        error_msg = str(exception)
        
        ui_msg = f"❌ [RUNTIME CRASH] Strategy: '{strat_id}' | Method: '{method_name}'\n"
        if validation_msg:
            ui_msg += f"⚠️ ARCHITECTURE ERROR: {validation_msg}\n"
        ui_msg += f"Details: {error_msg}\n\n"
        
        # Build AI Copilot Prompt for the User
        ai_prompt = (
            f"👇 [AI DEBUG PROMPT] - Copy the text below and paste to ChatGPT/Claude 👇\n"
            f"----------------------------------------------------------------------\n"
            f"I am writing a Python algorithmic trading strategy for MetaTrader 5 using Pandas.\n"
            f"In my class '{strat_id}', the method '{method_name}' crashed during execution.\n\n"
            f"Error Type: {error_type}\n"
            f"Error Message: {error_msg}\n"
        )
        
        if validation_msg:
            ai_prompt += f"\nRule Violation from Engine: {validation_msg}\n"
            
        ai_prompt += (
            f"\nFull Traceback:\n{error_trace}\n"
            f"Please review this method in my code, explain what caused the crash or NaN/Inf values, "
            f"and provide the corrected python code. Make sure to handle type casting (e.g., int/float) "
            f"if params are coming as strings.\n"
            f"----------------------------------------------------------------------\n"
        )
        
        ui_log('error', ui_msg + ai_prompt)

    @staticmethod
    def safe_execute(strat_id, method_name, func, *args, **kwargs):
        """
        Executes strategy functions with 4 layers of security:
        1. Exception Catching (Crash Proof)
        2. Performance Watchdog (Timeout Warnings)
        3. Output Type Validation (Architecture strictness)
        4. Data Integrity Scanning (NaN & Infinity protection)
        """
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            exec_time = time.time() - start_time
            
            if exec_time > 1.5:
                ui_log('warning', f"⚠️ [PERFORMANCE WARNING] Strategy '{strat_id}' method '{method_name}' took {exec_time:.2f}s! (Optimization highly recommended to avoid slippage)")
            
            is_valid, validation_msg = StrategyValidator.validate_return(method_name, result)
            if not is_valid:
                raise TypeError(f"Invalid Output or Corrupted Data: {validation_msg}")
                
            return result
            
        except Exception as e:
            val_msg = str(e) if isinstance(e, TypeError) and "Invalid Output or Corrupted Data:" in str(e) else ""
            ErrorManager.catch_strategy_error(strat_id, method_name, e, validation_msg=val_msg)
            return None


def safe_backend_operation(action_name="Backend Operation"):
    """
    Decorator to safely wrap general backend endpoints or functions in Main.py
    preventing unhandled exceptions from breaking the application loop.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                err_trace = traceback.format_exc()
                error_msg = f"❌ [BACKEND ERROR] Failed during {action_name}: {e}\n{err_trace}"
                ui_log('error', error_msg)
                return None
        return wrapper
    return decorator