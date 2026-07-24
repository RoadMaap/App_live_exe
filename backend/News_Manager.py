import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import time
import threading
import os
import json

def ui_log(msg_type, msg):
    print(msg)
    try:
        import eel
        if hasattr(eel, 'update_status'):
            # 🚨 FIX: حذف پرانتز برای جلوگیری از فریز شدن پایتون هنگام ارسال خبر
            eel.update_status(msg_type, msg)
    except Exception:
        pass

def get_active_currencies():
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        settings_path = os.path.join(backend_dir, 'Jsons', 'user_settings.json')
        if not os.path.exists(settings_path):
            return ['EUR', 'USD']
        with open(settings_path, 'r') as f:
            data = json.load(f)
            curs = []
            if data.get('nf_eur', True): curs.append('EUR')
            if data.get('nf_usd', True): curs.append('USD')
            return curs
    except Exception:
        return ['EUR', 'USD']

class NewsFilter:
    _instance = None
    FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml"

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(NewsFilter, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, cache_minutes=240):
        if self._initialized: return
        self.cache_minutes = cache_minutes
        self.news_data = []
        self.last_fetch_time = 0
        self._initialized = True

    def fetch_news(self):
        current_time = time.time()
        
        if self.news_data and (current_time - self.last_fetch_time) < (self.cache_minutes * 60):
            return self.news_data

        try:
            req = urllib.request.Request(self.FF_URL, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
                
            root = ET.fromstring(xml_data)
            parsed_news = []
            
            for event in root.findall('event'):
                impact = event.find('impact').text.strip() if event.find('impact') is not None else ''
                if impact != 'High': continue
                    
                currency = event.find('country').text.strip().upper() if event.find('country') is not None else ''
                
                # فیلتر اولیه: فقط اخبار یورو و دلار را ذخیره کن
                if currency not in ['EUR', 'USD']: continue
                    
                date_str = event.find('date').text.strip() if event.find('date') is not None else ''
                time_str = event.find('time').text.strip() if event.find('time') is not None else ''
                title = event.find('title').text.strip() if event.find('title') is not None else ''
                
                if 'All Day' in time_str or not time_str: continue
                
                try:
                    datetime_str = f"{date_str} {time_str}"
                    event_dt_est = datetime.strptime(datetime_str, '%m-%d-%Y %I:%M%p')
                    event_utc = event_dt_est + timedelta(hours=5)
                    
                    parsed_news.append({
                        'currency': currency,
                        'time': event_utc,
                        'title': title
                    })
                except Exception:
                    pass 

            self.news_data = sorted(parsed_news, key=lambda x: x['time'])
            self.last_fetch_time = current_time
            ui_log('success', f"🌍 [NEWS DAEMON] Synced {len(self.news_data)} High-Impact (EUR/USD) events.")
            
        except Exception as e:
            ui_log('error', f"⚠️ [NEWS DAEMON ERROR] Could not fetch calendar: {e}")
            
        return self.news_data

    def get_next_news_ui(self):
        if not self.news_data:
            return None
            
        current_utc = datetime.utcnow()
        active_curs = get_active_currencies() 
        
        for news in self.news_data:
            if news['currency'] not in active_curs:
                continue
                
            if news['time'] + timedelta(minutes=30) > current_utc:
                time_diff = news['time'] - current_utc
                
                if time_diff.total_seconds() < 0:
                    countdown_str = "HAPPENING NOW!"
                else:
                    hours, remainder = divmod(int(time_diff.total_seconds()), 3600)
                    minutes, seconds = divmod(remainder, 60)
                    countdown_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                    
                return {
                    'currency': news['currency'],
                    'title': news['title'],
                    'countdown': countdown_str
                }
                
        return None

class NewsTickerDaemon(threading.Thread):
    def __init__(self):
        super().__init__()
        self.daemon = True 
        self.news_filter = NewsFilter()

    def run(self):
        time.sleep(2) 
        ui_log('success', "🌐 [BACKGROUND SERVICE] UI News Ticker Daemon Started.")
        
        while True:
            try:
                self.news_filter.fetch_news()
                next_news = self.news_filter.get_next_news_ui()
                
                if next_news:
                    import eel
                    if hasattr(eel, 'update_news_ticker'):
                        # 🚨 FIX: حذف پرانتز آخر برای جلوگیری از تایم‌اوت و گیر کردن برنامه
                        eel.update_news_ticker(next_news)
            except Exception:
                pass
            
            time.sleep(1)

def start_news_ticker_service():
    daemon = NewsTickerDaemon()
    daemon.start()
    return daemon