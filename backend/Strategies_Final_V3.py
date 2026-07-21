import pandas as pd
import numpy as np
import pandas_ta as ta
import mplfinance as mpf

# ==============================================================================
# 1. استراتژی ADX (اصلاح شده برای Engine 3.6)
# ==============================================================================
class ADXStrategy:
    def __init__(self, params):
        self.params = params

    def prepare_indicators(self, data, candle_type='STANDARD'):
        # نکته: انجین دیتا را آماده می‌کند. ما فرض می‌کنیم ستون‌های open/high/low/close معتبر هستند.
        # اگر انجین Heikin Ashi فرستاده باشد، ستون‌های اصلی با مقادیر HA پر شده‌اند.
        
        # محاسبه Bollinger Bands
        bb_period = self.params['BB_PERIOD']
        bb_std = float(self.params['BB_STD_DEV'])
        bb_df = ta.bbands(close=data['close'], length=bb_period, std=bb_std)
        
        # محاسبه ADX
        adx_df = ta.adx(high=data['high'], low=data['low'], close=data['close'], length=self.params['ADX_PERIOD'])
        
        # محاسبه ATR
        atr_df = ta.atr(high=data['high'], low=data['low'], close=data['close'], length=self.params['ATR_PERIOD'])
        
        # افزودن به دیتافریم اصلی (با هندل کردن نام ستون‌های کتابخانه pandas_ta)
        data['LowerBand'] = bb_df[f"BBL_{bb_period}_{bb_std}"]
        data['MA'] = bb_df[f"BBM_{bb_period}_{bb_std}"]
        data['UpperBand'] = bb_df[f"BBU_{bb_period}_{bb_std}"]
        data['ADX'] = adx_df[f"ADX_{self.params['ADX_PERIOD']}"]
        data['ATR'] = atr_df
        
        data['price_source'] = data['close']
        
        # پاکسازی NaN های اولیه که ناشی از محاسبه اندیکاتور است
        data.dropna(subset=['ADX', 'MA', 'ATR'], inplace=True)
        return data

    def check_entry_signal(self, history_slice):
        # دریافت کندل سیگنال (Close شده) و کندل جاری (Open شده)
        if len(history_slice) < 2: return None, None, None, None
        
        signal_candle = history_slice.iloc[-2] # کندل T-1
        current_candle = history_slice.iloc[-1] # کندل T
        trade_type = None
        
        # 1. منطق سیگنال
        # نکته امنیتی: از وجود دیتا مطمئن شویم
        if pd.isna(signal_candle['ADX']) or pd.isna(signal_candle['LowerBand']):
            return None, None, None, None

        if signal_candle['ADX'] < self.params['ADX_THRESHOLD']:
            if signal_candle['price_source'] < signal_candle['LowerBand']:
                trade_type = 'buy'
            elif signal_candle['price_source'] > signal_candle['UpperBand']:
                trade_type = 'sell'
        
        if trade_type:
            entry_price = current_candle['open']
            atr_value = signal_candle['ATR']
            
            # محاسبه SL/TP
            if pd.isna(atr_value) or atr_value == 0: return None, None, None, None

            risk_distance = atr_value * self.params['ATR_MULTIPLIER']
            if risk_distance <= 0: return None, None, None, None
                
            tp_distance = risk_distance * self.params['RISK_REWARD_RATIO']
            
            if trade_type == 'buy':
                stop_loss = entry_price - risk_distance
                take_profit = entry_price + tp_distance
            else:
                stop_loss = entry_price + risk_distance
                take_profit = entry_price - tp_distance
            
            return trade_type, entry_price, stop_loss, take_profit
        
        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        # در انجین 3.6، مدیریت SL/TP استاندارد توسط خود انجین انجام می‌شود.
        # اینجا فقط خروج‌های خاص (Dynamic Exit) را بررسی می‌کنیم.
        
        # خروج با MA (On-Bar-Close)
        signal_candle = history_slice.iloc[-2] # کندل کامل شده قبلی
        target_ma = signal_candle.get('MA')
        
        if pd.isna(target_ma): return None, None

        close_price = current_candle['close'] # قیمت لحظه‌ای یا کلوز کندل جاری
        
        if position['type'] == 'buy' and close_price >= target_ma:
             return close_price, 'MA Exit'
        elif position['type'] == 'sell' and close_price <= target_ma:
             return close_price, 'MA Exit'
        
        return None, None

    def get_plot_addplots(self, plot_data, ap, config):
        ap.append(mpf.make_addplot(plot_data['UpperBand'], color='gray', linestyle=':'))
        ap.append(mpf.make_addplot(plot_data['MA'], color='purple', linestyle='--'))
        ap.append(mpf.make_addplot(plot_data['LowerBand'], color='gray', linestyle=':'))
        if 'ADX' in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data['ADX'], panel=1, color='purple', ylabel='ADX'))
        return ap, (6, 2)


# ==============================================================================
# 2. استراتژی SupplyDemand (اصلاح شده برای Engine 3.6)
# ==============================================================================
class SupplyDemandStrategy:
    def __init__(self, params):
        self.params = params
        self.active_zones = [] 

    def prepare_indicators(self, data, candle_type='STANDARD'):
        # محاسبات ATR
        atr_series = ta.atr(high=data['high'], low=data['low'], close=data['close'], length=self.params["ATR_PERIOD"])
        data[f'ATR_{self.params["ATR_PERIOD"]}'] = atr_series
        
        # محاسبات EMA
        ema_series = ta.ema(close=data['close'], length=self.params["TREND_EMA_PERIOD"])
        data[f'EMA_{self.params["TREND_EMA_PERIOD"]}'] = ema_series
        
        # محاسبات بدنه کندل برای تشخیص زون
        data['body_size'] = abs(data['close'] - data['open'])
        data['avg_body'] = data['body_size'].rolling(window=self.params["ZONE_AVG_BODY_PERIOD"]).mean().shift(1)
        
        data.dropna(subset=[f'ATR_{self.params["ATR_PERIOD"]}', f'EMA_{self.params["TREND_EMA_PERIOD"]}', 'avg_body'], inplace=True)
        return data

    def check_entry_signal(self, history_slice):
        if len(history_slice) < 4: return None, None, None, None

        current_candle = history_slice.iloc[-1]  # T
        signal_candle = history_slice.iloc[-2]   # T-1
        base_candle = history_slice.iloc[-3]     # T-2

        # آپدیت لیست زون‌ها (حذف زون‌های شکسته شده)
        self.active_zones = [
            z for z in self.active_zones
            if not (z['type'] == 'demand' and signal_candle['low'] < z['bottom']) and
               not (z['type'] == 'supply' and signal_candle['high'] > z['top'])
        ]

        # شناسایی زون جدید (Explosive Move)
        is_explosive = base_candle['body_size'] > (base_candle['avg_body'] * self.params["ZONE_STRENGTH_MULT"])
        if is_explosive:
            new_zone = None
            if base_candle['close'] > base_candle['open']: # کندل صعودی -> دیمند
                new_zone = {'type': 'demand', 'top': base_candle['high'], 'bottom': base_candle['low'], 'created_at': base_candle.name, 'status': 'fresh'}
            elif base_candle['close'] < base_candle['open']: # کندل نزولی -> ساپلای
                new_zone = {'type': 'supply', 'top': base_candle['high'], 'bottom': base_candle['low'], 'created_at': base_candle.name, 'status': 'fresh'}
            
            # جلوگیری از تکراری شدن (بر اساس زمان ایجاد)
            if new_zone and not any(z['created_at'] == new_zone['created_at'] for z in self.active_zones):
                self.active_zones.append(new_zone)

        # بررسی سیگنال ورود روی زون‌های فعال
        for zone in reversed(self.active_zones):
            if zone['status'] == 'fresh':
                trade_type = None
                
                # برخورد قیمت به زون
                if zone['type'] == 'demand' and signal_candle['low'] <= zone['top'] and signal_candle['open'] > zone['top']:
                    trade_type = 'buy'
                elif zone['type'] == 'supply' and signal_candle['high'] >= zone['bottom'] and signal_candle['open'] < zone['bottom']:
                    trade_type = 'sell'

                if trade_type:
                    # فیلتر روند (EMA)
                    trend_ema = signal_candle[f'EMA_{self.params["TREND_EMA_PERIOD"]}']
                    if (trade_type == 'buy' and signal_candle['close'] < trend_ema) or \
                       (trade_type == 'sell' and signal_candle['close'] > trend_ema):
                        continue 

                    entry_price = current_candle['open']
                    atr = signal_candle[f'ATR_{self.params["ATR_PERIOD"]}']
                    sl_padding = atr * self.params["SL_ATR_PADDING"]
                    
                    # محاسبه SL پشت زون
                    if trade_type == 'buy':
                        stop_loss = zone['bottom'] - sl_padding
                        risk_dist = entry_price - stop_loss
                    else:
                        stop_loss = zone['top'] + sl_padding
                        risk_dist = stop_loss - entry_price
                    
                    if risk_dist <= 0: continue

                    if trade_type == 'buy':
                        take_profit = entry_price + (risk_dist * self.params["RISK_REWARD_RATIO"])
                    else:
                        take_profit = entry_price - (risk_dist * self.params["RISK_REWARD_RATIO"])
                    
                    zone['status'] = 'tested' # مارک کردن زون
                    return trade_type, entry_price, stop_loss, take_profit

        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        # این استراتژی فقط بر اساس SL/TP کار می‌کند که انجین 3.6 آن را مدیریت می‌کند.
        return None, None

    def get_plot_addplots(self, plot_data, ap, config):
        ema_period = self.params.get('TREND_EMA_PERIOD')
        col_name = f"EMA_{ema_period}"
        if ema_period and col_name in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data[col_name], color='purple', width=1.5, label=f'EMA({ema_period})'))
        return ap, (6, 1)


# ==============================================================================
# 3. استراتژی SqueezeBreakout (اصلاح شده برای Engine 3.6)
# ==============================================================================
class SqueezeBreakoutStrategy:
    def __init__(self, params):
        self.params = params
    
    def prepare_indicators(self, data, candle_type='STANDARD'):
        # تنظیم پارامترها
        bb_period = self.params['BB_PERIOD']
        bb_std = float(self.params['BB_STD'])
        kc_period = self.params['KC_PERIOD']
        kc_atr_mult = float(self.params['KC_ATR_MULT'])
        
        # Bollinger Bands
        bbands = ta.bbands(close=data['close'], length=bb_period, std=bb_std)
        data['BBL'] = bbands[f'BBL_{bb_period}_{bb_std}']
        data['BBU'] = bbands[f'BBU_{bb_period}_{bb_std}']
        
        # Keltner Channels
        keltner = ta.kc(high=data['high'], low=data['low'], close=data['close'], length=kc_period, scalar=kc_atr_mult)
        data['KCL'] = keltner[f'KCLe_{kc_period}_{kc_atr_mult}']
        data['KCU'] = keltner[f'KCUe_{kc_period}_{kc_atr_mult}']
        
        # EMA & ATR
        data['EMA'] = ta.ema(close=data['close'], length=self.params['EMA_PERIOD'])
        data['ATR'] = ta.atr(high=data['high'], low=data['low'], close=data['close'], length=self.params['ATR_PERIOD'])
        
        # Squeeze Logic
        # Squeeze زمانی است که باندهای بولینگر داخل کانال کلتنر می‌روند
        data['squeeze_on'] = (data['BBL'] > data['KCL']) & (data['BBU'] < data['KCU'])
        data['squeeze_on_prev'] = data['squeeze_on'].shift(1)
        
        data.dropna(subset=['EMA', 'ATR', 'squeeze_on_prev'], inplace=True)
        return data

    def check_entry_signal(self, history_slice):
        if len(history_slice) < 2: return None, None, None, None
        
        signal_candle = history_slice.iloc[-2]
        current_candle = history_slice.iloc[-1]
        trade_type = None
        
        # منطق: خروج از حالت Squeeze (قبلاً Squeeze بوده، الان نیست)
        if signal_candle['squeeze_on_prev'] and not signal_candle['squeeze_on']:
            # فیلتر جهت با EMA
            if signal_candle['close'] > signal_candle['EMA']:
                trade_type = 'buy'
            elif signal_candle['close'] < signal_candle['EMA']:
                trade_type = 'sell'
        
        if trade_type:
            entry_price = current_candle['open']
            atr_value = signal_candle['ATR']
            
            if pd.isna(atr_value) or atr_value == 0: return None, None, None, None
            
            risk_distance = self.params['SL_ATR_MULT'] * atr_value
            if risk_distance <= 0: return None, None, None, None
            
            tp_distance = risk_distance * self.params['RISK_REWARD_RATIO']
            
            if trade_type == 'buy':
                stop_loss = entry_price - risk_distance
                take_profit = entry_price + tp_distance
            else:
                stop_loss = entry_price + risk_distance
                take_profit = entry_price - tp_distance
                
            return trade_type, entry_price, stop_loss, take_profit
        
        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        # خروج فقط با SL/TP استاندارد انجین
        return None, None

    def get_plot_addplots(self, plot_data, ap, config):
        if 'BBL' in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data['BBU'], color='gray', linestyle=':', label='Boll Bands'))
            ap.append(mpf.make_addplot(plot_data['BBL'], color='gray', linestyle=':'))
        if 'KCL' in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data['KCU'], color='blue', linestyle=':', label='Keltner Ch.'))
            ap.append(mpf.make_addplot(plot_data['KCL'], color='blue', linestyle=':'))
        if 'EMA' in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data['EMA'], color='orange', width=1.5, label='EMA Filter'))
        
        panel_ratios = [6]
        if 'ATR' in plot_data.columns:
            ap.append(mpf.make_addplot(plot_data['ATR'], panel=1, color='blue', ylabel='ATR'))
            panel_ratios.append(1)
            
        return ap, tuple(panel_ratios)
    


# class QuantSetupStrategy:
#     """
#     استراتژی کمی Price Action با قابلیت تنظیم Risk:Reward
#     بازنویسی شده بر اساس تمپلیت ON_BAR_CLOSE
#     """

#     def __init__(self, params):     # این تابع برای دریافت پارامتر های استراتژی است و یک تابع اجباریه
#         self.params = params
#         # مقادیر پیش‌فرض اگر در params نباشند
#         if 'RISK_REWARD_RATIO' not in self.params:
#             self.params['RISK_REWARD_RATIO'] = 2.0  # مقدار پیش‌فرض
#         if 'pip_offset' not in self.params:
#             self.params['pip_offset'] = 0.0

#     def prepare_indicators(self, data, candle_type='STANDARD'):  # این تابع برای اماده سازی اندیکاتور ها است و یک تابع اجباریه 
#         df = data.copy()
        
#         # محاسبات اجزای کندل (بدنه، ویک‌ها) طبق استراتژی شما
#         df['body'] = (df['close'] - df['open']).abs()
#         df['upper_wick'] = df['high'] - df[['open', 'close']].max(axis=1)
#         df['lower_wick'] = df[['open', 'close']].min(axis=1) - df['low']
#         df['is_green'] = df['close'] > df['open']
#         df['is_red'] = df['close'] < df['open']
        
#         return df

#     def check_entry_signal(self, history_slice):   # این تابع برای چک کردن سیگنال ورود است و یک تابع اجباریه 
#         # نیاز به حداقل 3 کندل داریم (ستاپ، تایید، ورود) چون current_candle فقط برای ورود است
#         if len(history_slice) < 3: return None, None, None, None  
            
#         # تعریف کندل‌ها طبق قوانین سخت‌گیرانه تمپلیت
#         # setup_candle: کندل ستاپ (دو تا قبل از بسته شدن) - ایندکس 3-
#         setup_candle = history_slice.iloc[-3] 
        
#         # signal_candle: کندل تایید (کندلی که تازه بسته شده) - ایندکس 2-
#         signal_candle = history_slice.iloc[-2]  # حتما باید به این صورت نوشته شود 
        
#         current_candle = history_slice.iloc[-1]    # حتما باید به این صورت نوشته شود و این متغیر فقط برای  نقطه ورود است
        
#         trade_type = None  # باید باشد 
        
#         # --- منطق استراتژی (انتقال یافته به کندل‌های بسته شده) ---
        
#         # 1. LONG SETUP (بررسی سیگنال خرید)
#         if setup_candle['is_green'] and setup_candle['lower_wick'] >= (2 * setup_candle['body']):
#             # بررسی کندل تایید (Signal Candle)
#             if signal_candle['high'] > setup_candle['high']:
#                 required_close = signal_candle['open'] + (0.5 * signal_candle['body'])
#                 if signal_candle['close'] >= required_close:
#                     trade_type = 'buy'

#         # 2. SHORT SETUP (بررسی سیگنال فروش)
#         elif setup_candle['is_red'] and setup_candle['upper_wick'] >= (2 * setup_candle['body']):
#             # بررسی کندل تایید (Signal Candle)
#             if signal_candle['low'] < setup_candle['low']:
#                 required_close = signal_candle['open'] - (0.5 * signal_candle['body'])
#                 if signal_candle['close'] <= required_close:
#                     trade_type = 'sell'


#         if trade_type:
#             entry_price = current_candle['open']  # نقطه ورود بر اساس ON_BAR_CLOSE (اوپن کندل جاری)
            
#             risk_distance = None    # برای محاسبه حد ضرر است 
#             stop_loss = None
#             take_profit = None

#             pip_offset = self.params['pip_offset']

#             if trade_type == 'buy':   # شرط های ورود به معامله بای
#                 # محاسبه Stop Loss بر اساس کندل ستاپ
#                 sl_price = setup_candle['low']
#                 if pip_offset > 0:
#                     sl_price -= pip_offset
                
#                 stop_loss = sl_price
                
#                 # محاسبه Risk Distance برای بدست آوردن TP
#                 risk_distance = entry_price - stop_loss
                
#                 # محاسبه TP بر اساس R:R
#                 if risk_distance > 0:
#                     tp_distance = risk_distance * self.params['RISK_REWARD_RATIO']
#                     take_profit = entry_price + tp_distance

#             if trade_type == 'sell':   # شرط های ورود به معامله سل
#                 # محاسبه Stop Loss بر اساس کندل ستاپ
#                 sl_price = setup_candle['high']
#                 if pip_offset > 0:
#                     sl_price += pip_offset
                
#                 stop_loss = sl_price

#                 # محاسبه Risk Distance (در سل: استاپ منهای ورود)
#                 risk_distance = stop_loss - entry_price
                
#                 # محاسبه TP بر اساس R:R
#                 if risk_distance > 0:
#                     tp_distance = risk_distance * self.params['RISK_REWARD_RATIO']
#                     take_profit = entry_price - tp_distance
                    
#             return trade_type, entry_price, stop_loss, take_profit
            
#         return None, None, None, None

#     def check_exit_conditions(self, current_candle, history_slice, position):   # این تابع برای چک کردن شرایط خروج سوم به جز استاپ و تیپی  است و یک تابع اجباریه
#         # چون SL و TP در زمان ورود ست شده‌اند، نیاز به خروج دستی دیگری نیست
#         return None, None  

#     def get_plot_addplots(self, plot_data, ap, config):   
#             """
#             برای رفع ارور پنل‌ها، باید نسبت پنل اصلی (Price Chart) را مشخص کنیم.
#             (1,) یعنی یک پنل با نسبت استاندارد.
#             """
#             return ap, (1,)



class QuantSetupStrategy:            # نسخه آپدیت شده
    """
    استراتژی Price Action پیشرفته (نسخه آپدیت شده)
    شامل:
    - مدیریت ریسک پویا با ATR
    - فیلتر حجم (Volume Filter)
    - انعطاف در رنگ کندل ستاپ
    """

    def __init__(self, params):
        self.params = params
        
        # --- پارامترهای پیش‌فرض ---
        if 'RISK_REWARD_RATIO' not in self.params:
            self.params['RISK_REWARD_RATIO'] = 2.0
            
        # پارامترهای ATR (برای گزینه ب)
        if 'atr_period' not in self.params:
            self.params['atr_period'] = 14
        if 'atr_multiplier' not in self.params:
            self.params['atr_multiplier'] = 1.5  # ضریب اطمینان برای فاصله استاپ
            
        # پارامترهای حجم (برای گزینه ج)
        if 'vol_ma_period' not in self.params:
            self.params['vol_ma_period'] = 20

    def prepare_indicators(self, data, candle_type='STANDARD'):
        df = data.copy()
        
        # 1. محاسبات پایه کندل
        df['body'] = (df['close'] - df['open']).abs()
        df['upper_wick'] = df['high'] - df[['open', 'close']].max(axis=1)
        df['lower_wick'] = df[['open', 'close']].min(axis=1) - df['low']
        
        # 2. محاسبات ATR (گزینه ب)
        # استفاده از pandas_ta برای محاسبه ATR
        df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=self.params['atr_period'])
        
        # 3. محاسبات میانگین حجم (گزینه ج)
        df['vol_ma'] = ta.sma(df['volume'], length=self.params['vol_ma_period'])
        
        return df

    def check_entry_signal(self, history_slice):
        # نیاز به حداقل 3 کندل + دوره ATR/Volume داریم
        if len(history_slice) < 3: return None, None, None, None
        
        # تعریف کندل‌ها
        setup_candle = history_slice.iloc[-3]  # کندل پین‌بار
        signal_candle = history_slice.iloc[-2] # کندل تایید
        current_candle = history_slice.iloc[-1] # کندل جاری (نقطه ورود)
        
        trade_type = None
        
        # --- فیلتر حجم (گزینه ج) ---
        # حجم کندل ستاپ باید بیشتر از میانگین حجم باشد (نشان‌دهنده قدرت)
        is_volume_valid = setup_candle['volume'] > setup_candle['vol_ma']
        
        if not is_volume_valid:
            return None, None, None, None

        # --- 1. LONG SETUP (اصلاح شده - گزینه د) ---
        # شرط رنگ (is_green) حذف شد. فقط شکل کندل مهم است.
        # شرط اضافی: سایه پایین باید بزرگتر از سایه بالا باشد (تا شبیه چکش باشد نه دوجی)
        if (setup_candle['lower_wick'] >= (2 * setup_candle['body']) and 
            setup_candle['lower_wick'] > setup_candle['upper_wick']):
            
            # تاییدیه (Confirmation)
            if signal_candle['high'] > setup_candle['high']:
                # بدنه کندل تایید باید صعودی (سبز) باشد برای اطمینان بیشتر
                if signal_candle['close'] > signal_candle['open']:
                    required_close = signal_candle['open'] + (0.5 * signal_candle['body'])
                    if signal_candle['close'] >= required_close:
                        trade_type = 'buy'

        # --- 2. SHORT SETUP (اصلاح شده - گزینه د) ---
        # شرط رنگ (is_red) حذف شد.
        elif (setup_candle['upper_wick'] >= (2 * setup_candle['body']) and 
              setup_candle['upper_wick'] > setup_candle['lower_wick']):
            
            # تاییدیه (Confirmation)
            if signal_candle['low'] < setup_candle['low']:
                # بدنه کندل تایید باید نزولی (قرمز) باشد
                if signal_candle['close'] < signal_candle['open']:
                    required_close = signal_candle['open'] - (0.5 * signal_candle['body'])
                    if signal_candle['close'] <= required_close:
                        trade_type = 'sell'

        # --- محاسبات ورود و خروج ---
        if trade_type:
            entry_price = current_candle['open']
            
            # محاسبه مقدار فاصله بر اساس ATR (گزینه ب)
            # اگر ATR موجود نبود (مثلا اول دیتا)، از 0 استفاده کن تا خطا ندهد
            atr_value = setup_candle['atr'] if not pd.isna(setup_candle['atr']) else 0.0
            atr_sl_distance = atr_value * self.params['atr_multiplier']
            
            stop_loss = None
            take_profit = None

            if trade_type == 'buy':
                # استاپ لاس پویا: Low کندل ستاپ منهای ATR
                sl_price = setup_candle['low'] - atr_sl_distance
                stop_loss = sl_price
                
                # محاسبه TP
                risk_distance = entry_price - stop_loss
                if risk_distance > 0:
                    take_profit = entry_price + (risk_distance * self.params['RISK_REWARD_RATIO'])

            elif trade_type == 'sell':
                # استاپ لاس پویا: High کندل ستاپ به علاوه ATR
                sl_price = setup_candle['high'] + atr_sl_distance
                stop_loss = sl_price
                
                # محاسبه TP
                risk_distance = stop_loss - entry_price
                if risk_distance > 0:
                    take_profit = entry_price - (risk_distance * self.params['RISK_REWARD_RATIO'])
                    
            return trade_type, entry_price, stop_loss, take_profit
            
        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        return None, None  

    def get_plot_addplots(self, plot_data, ap, config):
        """
        نمایش ATR و میانگین حجم روی نمودار (اختیاری)
        """
        # رسم یک پنل جداگانه برای حجم اگر نیاز بود، اما اینجا فقط پنل اصلی را فیکس میکنیم
        return ap, (1,)

