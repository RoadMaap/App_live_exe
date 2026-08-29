import eel
import os
import sys
import subprocess

# --- 1. SYSTEM PATH INJECTION ---
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# --- 2. ENTERPRISE ARCHITECTURE IMPORTS ---
import core.engine_controller as engine_controller
import storage.json_manager as jm

# 🛡️ اضافه کردن سیستم سپر امنیتی (System Shield)
from security.system_shield import SystemShield

try:
    from security.auth import start_web_auth_flow
except ImportError as e:
    print(f"⚠️ Security module import skipped: {e}")

try:
    from services.ai_vision import GeminiVisionClient
    from services.ai_executor import AITradeExecutor
except ImportError as e:
    print(f"⚠️ AI Services import skipped: {e}")


# --- 3. AUTHENTICATION ---
@eel.expose
def attempt_login():
    print("🌐 Waiting for Web Authentication...")
    try:
        is_valid, message, token = start_web_auth_flow()
        if is_valid: 
            print(f"✅ Web Auth Success! Token: {token[:10]}...")
        return {'success': is_valid, 'message': message}
    except Exception as e:
        return {'success': True, 'message': 'Auth skipped / dev mode'}

# --- 4. CONFIG & STATE ENDPOINTS ---
@eel.expose
def get_initial_data():
    data = jm.load_settings()
    data['strategies'] = jm.get_strategies_for_frontend()
    return data

@eel.expose
def save_user_config(data):
    return jm.save_settings_to_file(data)

# --- 5. STRATEGY MANAGER ENDPOINTS ---
@eel.expose
@SystemShield.rate_limit(max_calls=2, period_seconds=2.0) # 🛡️ جلوگیری از آپلود رگباری و هنگ کردن سیستم
def load_custom_strategy(file_path):
    # 🛡️ Path Sanitization (محافظت در برابر حملات Path Traversal)
    if not SystemShield.sanitize_path(file_path):
        return {'success': False, 'message': 'Security Block: Invalid file path detected.'}
    return jm.load_custom_strategy(file_path)

@eel.expose
def remove_strategy(strategy_name):
    return jm.remove_strategy(strategy_name)

@eel.expose
def update_strategy_config(strategy_name, config_type, new_data):
    return jm.update_strategy_config(strategy_name, config_type, new_data)

@eel.expose
def update_strategy_param(strategy_name, param_key, new_value):
    return jm.update_strategy_param(strategy_name, param_key, new_value)

@eel.expose
def clear_active_strategy():
    return jm.clear_active_strategy()

# --- 6. NATIVE OS DIALOGS ---
def _open_file_dialog_subprocess(title, filetypes):
    dialog_code = f"import tkinter, os, sys; from tkinter import filedialog; root=tkinter.Tk(); root.withdraw(); root.wm_attributes('-topmost', 1); path=filedialog.askopenfilename(title='{title}', filetypes={filetypes}); root.destroy(); print(path) if path else None"
    try:
        si = subprocess.STARTUPINFO()
        si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        proc = subprocess.run([sys.executable, "-c", dialog_code], capture_output=True, text=True, startupinfo=si)
        return proc.stdout.strip() or None
    except: return None

@eel.expose
def choose_mt5_path():
    path = _open_file_dialog_subprocess('Select terminal64.exe', "[('Exe', '*.exe')]")
    if path:
        jm.save_settings_to_file({'mt5_path': path})
        return path
    return None

@eel.expose
def open_strategy_file_dialog():
    return _open_file_dialog_subprocess('Select Strategy Python File', "[('Python', '*.py')]")

# --- 7. ENGINE COMMAND ENDPOINTS ---
@eel.expose
@SystemShield.rate_limit(max_calls=1, period_seconds=3.0) # 🛡️ فقط ۱ کلیک در هر ۳ ثانیه (Anti-Spam)
def start_robot():
    engine_controller.start_robot()

@eel.expose
@SystemShield.rate_limit(max_calls=1, period_seconds=2.0) # 🛡️ جلوگیری از ارسال رگباری دستور استاپ
def stop_robot():
    engine_controller.stop_robot()

# --- 8. AI VISION ENDPOINTS ---
@eel.expose
@SystemShield.rate_limit(max_calls=1, period_seconds=5.0) # 🛡️ محدودیت شدید برای جلوگیری از مسدود شدن API توسط گوگل
def analyze_uploaded_chart(base64_image, lang="en"):
    client = GeminiVisionClient()
    return client.analyze_chart(base64_image, lang)

@eel.expose
@SystemShield.rate_limit(max_calls=1, period_seconds=3.0) # 🛡️ جلوگیری از اسپم کردن سرورهای بروکر (اردرهای تکراری)
def deploy_ai_trade_to_mt5(symbol, ai_result, risk_mode, risk_value):
    settings = jm.load_settings()
    executor = AITradeExecutor(mt5_path=settings.get("mt5_path", ""))
    return executor.execute_from_ai(symbol, ai_result, risk_mode, float(risk_value))