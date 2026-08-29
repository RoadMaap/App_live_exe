import os
import re
import time
import base64
import hashlib
import platform
import subprocess
from functools import wraps

class SystemShield:
    """
    لایه محافظتی Enterprise برای برنامه لوکال:
    - رمزنگاری داده‌های حساس متصل به سخت‌افزار (HWID Locking)
    - جلوگیری از اسپم (Rate Limiting)
    - پاک‌سازی ورودی‌ها (Input Sanitization)
    """

    _call_history = {}

    @staticmethod
    def _get_machine_id():
        """تولید یک کلید یکتا بر اساس سخت‌افزار کامپیوتر (جلوگیری از کارکرد فایل JSON روی سیستم دیگر)"""
        try:
            if platform.system() == "Windows":
                output = subprocess.check_output("wmic csproduct get uuid", shell=True).decode()
                return output.split('\n')[1].strip()
            elif platform.system() == "Darwin": # macOS
                output = subprocess.check_output("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID", shell=True).decode()
                return output.split('"')[3]
        except Exception:
            pass
        return "UNKNOWN_NATIVE_MACHINE_12345"

    @staticmethod
    def _get_cipher_key():
        """تبدیل هش سخت‌افزار به کلید رمزنگاری"""
        hwid = SystemShield._get_machine_id()
        return hashlib.sha256(hwid.encode('utf-8')).digest()

    @staticmethod
    def encrypt_data(text: str) -> str:
        """رمزنگاری متن با استفاده از ترکیب Base64 و کلید سخت‌افزاری (XOR)"""
        if not text or text.startswith("ENC::"): 
            return text
            
        key = SystemShield._get_cipher_key()
        # XOR Encryption
        xored = "".join(chr(ord(c) ^ key[i % len(key)]) for i, c in enumerate(text))
        # Base64 Encoding
        encoded = base64.b64encode(xored.encode('utf-8')).decode('utf-8')
        return f"ENC::{encoded}"

    @staticmethod
    def decrypt_data(encrypted_text: str) -> str:
        """رمزگشایی دیتای قفل شده با سخت‌افزار"""
        if not encrypted_text or not encrypted_text.startswith("ENC::"):
            return encrypted_text
            
        try:
            clean_text = encrypted_text.replace("ENC::", "")
            decoded = base64.b64decode(clean_text.encode('utf-8')).decode('utf-8')
            key = SystemShield._get_cipher_key()
            
            # XOR Decryption (XOR is symmetric)
            return "".join(chr(ord(c) ^ key[i % len(key)]) for i, c in enumerate(decoded))
        except Exception as e:
            print(f"🛡️ [SECURITY ALERT] Failed to decrypt data. File might be stolen or tampered: {e}")
            return ""

    @staticmethod
    def rate_limit(max_calls: int = 3, period_seconds: float = 2.0):
        """
        دکوراتور ضد-اسپم (Anti-DDoS لوکال).
        از کلیک‌های رگباری کاربر روی دکمه‌هایی مثل "استارت ربات" جلوگیری می‌کند.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                func_name = func.__name__
                now = time.time()
                
                # پاک‌سازی هیستوری قدیمی
                history = SystemShield._call_history.get(func_name, [])
                history = [t for t in history if now - t < period_seconds]
                
                if len(history) >= max_calls:
                    print(f"🛡️ [SECURITY ALERT] Rate limit exceeded for '{func_name}'. Request blocked.")
                    from core.error_handler import ui_log
                    ui_log('error', "⚠️ Please slow down! Too many requests.")
                    return {"success": False, "message": "Too many requests. Please wait."}
                
                history.append(now)
                SystemShield._call_history[func_name] = history
                return func(*args, **kwargs)
            return wrapper
        return decorator

    @staticmethod
    def sanitize_path(file_path: str) -> bool:
        """جلوگیری از حملات Path Traversal (مثل دسترسی به فایل‌های خارج از پوشه مجاز)"""
        if not file_path: return False
        
        # کاراکترهای خطرناک
        dangerous_patterns = ['..', '\x00', '%00']
        if any(pat in file_path for pat in dangerous_patterns):
            print(f"🛡️ [SECURITY ALERT] Malicious path traversal detected: {file_path}")
            return False
            
        return True