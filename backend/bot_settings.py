import MetaTrader5 as mt5

# ==============================================================================
# تولید کننده کانفیگ داینامیک
# ==============================================================================

def create_symbol_config(symbol, strategy_instance, mm_rules, 
                         timeframe_mt5=mt5.TIMEFRAME_M5, 
                         magic_number=777888, 
                         lookback=500, 
                         point_value=1.0, 
                         adjustment_pips=0,
                         candle_type='STANDARD',
                         contract_size=None,
                         allowed_days=None,
                         killzones=None,
                         custom_seconds=None): # پارامتر جدید برای دریافت ثانیه دستی
    """
    این تابع تنظیمات را به صورت پویا برای هر نماد و استراتژی که کاربر انتخاب کرده می‌سازد.
    تمام تنظیمات پیشرفته (Advanced Config) در اینجا اعمال می‌شوند.
    """
    
    # تبدیل تایم‌فریم متاتریدر به ثانیه (حالت پیش‌فرض)
    timeframe_seconds_map = {
        mt5.TIMEFRAME_M1: 60,
        mt5.TIMEFRAME_M5: 300,
        mt5.TIMEFRAME_M15: 900,
        mt5.TIMEFRAME_M30: 1800,
        mt5.TIMEFRAME_H1: 3600,
        mt5.TIMEFRAME_H4: 14400,
        mt5.TIMEFRAME_D1: 86400,
    }
    
    # منطق تعیین TIMEFRAME_SECONDS:
    # اگر کاربر در پنل فرانت عدد دستی وارد کرده باشد، آن را در اولویت قرار می‌دهیم.
    # در غیر این صورت، بر اساس تایم‌فریم انتخاب شده (مثلا M5) ثانیه استاندارد را پیدا می‌کنیم.
    if custom_seconds is not None and int(custom_seconds) > 0:
        tf_seconds = int(custom_seconds)
    else:
        tf_seconds = timeframe_seconds_map.get(timeframe_mt5, 300) 

    # مقادیر پیش‌فرض برای لیست‌ها (جهت جلوگیری از ارور None)
    if allowed_days is None: allowed_days = [0, 1, 2, 3, 4] # دوشنبه تا جمعه
    if killzones is None: killzones = []

    return {
        # شناسه منحصر به فرد استراتژی
        'strategy_id': f"STRAT_{symbol}_{strategy_instance.__class__.__name__}",
        
        # مجیک نامبر (دریافتی از داشبورد)
        'magic_number': int(magic_number), 
        
        'symbol': symbol,
        
        # تعداد کندل‌های مورد نیاز برای محاسبه (Lookback)
        'LOOKBACK_PERIOD': int(lookback),
        
        # کلاس استراتژی لود شده
        'strategy': strategy_instance,
        
        'TIMEFRAME_MT5': timeframe_mt5,
        
        # ثانیه محاسبه شده (یا دستی وارد شده) که انجین برای وقفه بین سیکل‌ها استفاده می‌کند
        'TIMEFRAME_SECONDS': tf_seconds,
        
        # قوانین مدیریت ریسک
        'MONEY_MANAGEMENT_MODE': mm_rules,
        
        # --- تنظیمات پیشرفته ---
        'candle_type': candle_type,       # نوع کندل (STANDARD / HEIKIN_ASHI)
        'contract_size': contract_size,   # حجم قرارداد (اگر None باشد اتوماتیک است)
        'allowed_days': allowed_days,     # روزهای مجاز ترید [0, 1, 2, ...]
        'killzones': killzones,           # ساعات ممنوعه ["13:00-14:30", ...]
        
        # تنظیمات فنی پوینت و پیپ
        'SELL_SL_TP_ADJUSTMENT_PIPS': float(adjustment_pips),
        'point_value': float(point_value), 
    }