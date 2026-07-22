# ==============================================================================
# CORE ERROR HANDLER & AI DEBUGGER (v5.0 PRO - ULTIMATE EDITION)
# Features: MT5 Decoder, Architecture Validator, AI Prompt Generator, Data Scanner
# ==============================================================================

import traceback
import time
import inspect
import pandas as pd
import numpy as np

def ui_log(msg_type, text):
    """Safely routes logs to terminal stdout and React Frontend Debugger."""
    print(text)
    try:
        import eel
        if hasattr(eel, 'update_status'):
            eel.update_status(msg_type, text)()
    except Exception:
        pass


class StrategyValidator:
    """
    Advanced Engine to validate user strategy architecture, return types, 
    and DataFrame integrity (NaN/Inf detection) at runtime.
    """
    
    @staticmethod
    def pre_flight_check(strat_class_instance):
        """Checks if the strategy class has the bare minimum required methods before running."""
        required_methods = ['prepare_indicators', 'check_entry_signal']
        missing = [m for m in required_methods if not hasattr(strat_class_instance, m) or not callable(getattr(strat_class_instance, m))]
        
        if missing:
            return False, f"Missing required methods in your Strategy Class: {missing}. You must define them."
        return True, ""

    @staticmethod
    def validate_return(method_name, result):
        """Checks if the outputs of the user's functions match the Engine's requirements."""
        if result is None:
            return True, ""

        if method_name == 'prepare_indicators':
            if not isinstance(result, pd.DataFrame):
                return False, f"Expected Pandas 'DataFrame', but got '{type(result).__name__}'."
            
            # Check for missing crucial columns
            required_cols = {'open', 'high', 'low', 'close'}
            missing_cols = required_cols - set(result.columns.str.lower())
            if missing_cols:
                return False, f"DataFrame is missing crucial price columns: {missing_cols}."
                
            # Scan for Data Integrity (NaN or Infinity) which causes 90% of crashes
            # We check the last 5 rows because that's where the trading logic looks
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
                # If there's a signal, ensure prices are numbers, not strings or None
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
    
    # 1. Comprehensive MT5 Error Dictionary (Expanded)
    MT5_ERRORS = {
        10004: "Requote - قیمت به شدت نوسان دارد و تغییر کرده است (Requote).",
        10006: "Request Rejected - درخواست توسط بروکر رد شد (احتمالاً به دلیل اخبار یا اسپرد بالا).",
        10007: "Request Canceled - درخواست توسط تریدر یا سیستم لغو شد.",
        10009: "Order Done - درخواست با موفقیت انجام شد.",
        10013: "Invalid Request - درخواست نامعتبر است (تیکت یا نماد اشتباه است).",
        10014: "Invalid Volume - حجم وارد شده (Lot) بسیار کوچک، بسیار بزرگ یا دارای اعشار غیرمجاز در این نماد است.",
        10015: "Invalid Price - قیمت درخواستی با قیمت فعلی بازار هم‌خوانی ندارد.",
        10016: "Invalid Stops (SL/TP) - فاصله‌ها بسیار به قیمت مارکت نزدیک است (Stoplevel Limit).",
        10017: "Trade Disabled - ترید روی این نماد از سمت بروکر مسدود شده است.",
        10018: "Market Closed - بازار این نماد در حال حاضر بسته است (خارج از ساعات معاملاتی).",
        10019: "Not Enough Money - موجودی یا مارجین حساب برای باز کردن این حجم کافی نیست.",
        10021: "Position Only Close - بروکر فقط اجازه بستن پوزیشن را می‌دهد (حالت Close-Only).",
        10027: "AutoTrading Disabled - معاملات خودکار در متاتریدر خاموش است (دکمه Algo Trading در MT5 خاموش است).",
        10030: "Unsupported Filling Mode - نوع پر شدن اوردر (FOK/IOC) توسط این بروکر پشتیبانی نمی‌شود.",
        10031: "No Connection - اتصال به سرور بروکر قطع است.",
        10033: "Limit Reached - به حداکثر تعداد پوزیشن‌های مجاز بروکر رسیده‌اید.",
        10038: "Volume Limit - به حداکثر حجم مجاز (Lot) در این نماد رسیده‌اید.",
        10044: "Close By Rule - بستن پوزیشن متقابل مجاز نیست (قوانین FIFO).",
        10046: "Margin Restricted - حساب شما در وضعیت Call Margin یا محدودیت قرار دارد."
    }

    @staticmethod
    def handle_mt5_error(retcode, symbol, action_type):
        """Translates MT5 numerical errors into human-readable logs."""
        error_desc = ErrorManager.MT5_ERRORS.get(retcode, f"Unknown Broker Error Code ({retcode})")
        full_msg = f"❌ [MT5 REJECTED] Action: {action_type} | Symbol: {symbol}\nReason: {error_desc}"
        ui_log('error', full_msg)
        return full_msg

    @staticmethod
    def catch_strategy_error(strat_id, method_name, exception, validation_msg=""):
        """Formats strategy bugs and generates a Copy-Paste prompt for AI (ChatGPT/Claude)."""
        error_trace = traceback.format_exc()
        error_type = type(exception).__name__
        error_msg = str(exception)
        
        # Build Terminal UI Message
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
            f"and provide the corrected python code.\n"
            f"----------------------------------------------------------------------\n"
        )
        
        # Send everything to the UI Debugger
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
            # 1. Execute User Code
            result = func(*args, **kwargs)
            exec_time = time.time() - start_time
            
            # 2. Performance Watchdog (Warn if a method takes more than 1.5 seconds)
            if exec_time > 1.5:
                ui_log('warning', f"⚠️ [PERFORMANCE WARNING] Strategy '{strat_id}' method '{method_name}' took {exec_time:.2f}s! (Optimization highly recommended to avoid slippage)")
            
            # 3 & 4. Output Architecture & Data Integrity Validation
            is_valid, validation_msg = StrategyValidator.validate_return(method_name, result)
            if not is_valid:
                # Raise an intentional exception to trigger the AI Debugger prompt
                raise TypeError(f"Invalid Output or Corrupted Data: {validation_msg}")
                
            return result
            
        except Exception as e:
            # Check if this was our custom validation error or a pure python crash
            val_msg = str(e) if isinstance(e, TypeError) and "Invalid Output or Corrupted Data:" in str(e) else ""
            ErrorManager.catch_strategy_error(strat_id, method_name, e, validation_msg=val_msg)
            return None