# security.py
import subprocess
import hashlib
import sys
import requests
import time

# ==========================================================
# تنظیمات تست (وقتی سرور ندارید این را True بگذارید)
# ==========================================================
TEST_MODE = True  
# وقتی True باشد، همیشه لاگین موفق می‌شود.

# آدرس سرور واقعی (بعدا استفاده می‌شود)
API_URL = "http://127.0.0.1:8000/api/check-license/"

def get_hwid():
    """تولید شناسه سخت‌افزاری یونیک"""
    try:
        if sys.platform == "win32":
            cmd_uuid = "wmic csproduct get uuid"
            uuid = subprocess.check_output(cmd_uuid).decode().split('\n')[1].strip()
            cmd_cpu = "wmic cpu get processorid"
            cpu = subprocess.check_output(cmd_cpu).decode().split('\n')[1].strip()
            raw_id = f"{uuid}-{cpu}"
            return hashlib.md5(raw_id.encode()).hexdigest().upper()
        else:
            return "NON_WINDOWS_PLATFORM"
    except:
        return "Enter the license key."

def verify_license_online():
    """
    بررسی لایسنس (با قابلیت حالت تست)
    خروجی: (True/False, "پیام")
    """
    user_hwid = get_hwid()
    print(f"🔒 Checking License for: {user_hwid}")

    # --- حالت تست (شبیه‌سازی سرور) ---
    if TEST_MODE:
        time.sleep(1.5) # کمی تاخیر مصنوعی برای حس واقعی بودن
        print("⚠️ Running in TEST MODE: Access Granted Bypass.")
        return True, "حالت تست فعال است. خوش آمدید."
    # --------------------------------

    # --- حالت واقعی (اتصال به سرور) ---
    try:
        payload = {'hwid': user_hwid}
        response = requests.post(API_URL, json=payload, timeout=8)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'authorized':
                return True, "لایسنس تایید شد."
            else:
                return False, data.get('message', 'دسترسی غیرمجاز.')
        else:
            return False, f"خطای سرور: {response.status_code}"

    except requests.exceptions.ConnectionError:
        return False, "Error connecting to the Internet."
    except Exception as e:
        return False, f"خطای ناشناخته: {e}"

if __name__ == "__main__":
    print(f"HWID: {get_hwid()}")
    print(verify_license_online())