import sys
import threading
import time
import os
from datetime import datetime
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QPushButton, QTextEdit, 
                             QGroupBox, QFormLayout, QComboBox, 
                             QCheckBox, QDoubleSpinBox, QLineEdit, QFileDialog, QFrame)
from PyQt6.QtCore import pyqtSignal, QObject, Qt
from PyQt6.QtGui import QFont, QColor, QPalette

# ==============================================================================
# 1. ایمپورت‌ها و تنظیمات
# ==============================================================================
try:
    from multi_live_engine import LiveTrader
    from risk_management import (FixedRiskAmountRule, FixedLotRule, PercentRiskRule, 
                                 BreakevenHandler, PartialCloseRule)
    from bot_settings import LOCKED_STRATEGY_CONFIG 
except ImportError as e:
    print(f"CRITICAL ERROR: {e}")
    sys.exit(1)

# ==============================================================================
# 2. استایل‌شیت حرفه‌ای (TAILWIND CSS 3.4 SLATE THEME)
# ==============================================================================
TAILWIND_QSS = """
/* --- General Reset & Background (bg-slate-950) --- */
QMainWindow {
    background-color: #020617; 
    color: #e2e8f0;
}
QWidget {
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    color: #cbd5e1; /* text-slate-300 */
}

/* --- Cards (bg-slate-900) --- */
QGroupBox {
    background-color: #0f172a; 
    border: 1px solid #1e293b; /* border-slate-800 */
    border-radius: 8px; /* rounded-lg */
    margin-top: 24px;
    padding-top: 10px;
    font-weight: bold;
}
QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 10px;
    padding: 0 5px;
    color: #38bdf8; /* text-sky-400 */
    font-size: 13px;
    background-color: #020617; /* match window bg to hide line */
}

/* --- Inputs (bg-slate-950, border-slate-700) --- */
QLineEdit, QComboBox, QDoubleSpinBox {
    background-color: #020617; 
    border: 1px solid #334155; 
    border-radius: 6px; /* rounded-md */
    padding: 6px 10px;
    color: #f1f5f9; /* text-slate-100 */
    selection-background-color: #3b82f6;
}
QLineEdit:focus, QComboBox:focus, QDoubleSpinBox:focus {
    border: 1px solid #3b82f6; /* focus:border-blue-500 */
}
QComboBox::drop-down {
    border: none;
    width: 20px;
}

/* --- Checkboxes (accent-sky-500) --- */
QCheckBox {
    spacing: 8px;
    color: #cbd5e1;
}
QCheckBox::indicator {
    width: 18px;
    height: 18px;
    background-color: #020617;
    border: 1px solid #475569;
    border-radius: 4px;
}
QCheckBox::indicator:checked {
    background-color: #0ea5e9; /* bg-sky-500 */
    border-color: #0ea5e9;
}

/* --- Buttons --- */
QPushButton {
    background-color: #1e293b; /* bg-slate-800 */
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 8px 16px;
    color: #f8fafc;
    font-weight: 600;
}
QPushButton:hover {
    background-color: #334155; /* hover:bg-slate-700 */
}
QPushButton:pressed {
    background-color: #0f172a;
}

/* Primary Button (Start) - bg-emerald-600 */
QPushButton#BtnStart {
    background-color: #059669; 
    border: 1px solid #047857;
    color: white;
}
QPushButton#BtnStart:hover {
    background-color: #10b981; /* hover:bg-emerald-500 */
}
QPushButton#BtnStart:disabled {
    background-color: #064e3b;
    color: #6ee7b7;
}

/* Danger Button (Stop) - bg-rose-600 */
QPushButton#BtnStop {
    background-color: #e11d48;
    border: 1px solid #be123c;
    color: white;
}
QPushButton#BtnStop:hover {
    background-color: #f43f5e;
}
QPushButton#BtnStop:disabled {
    background-color: #881337;
    color: #fda4af;
}

/* Browse Button - bg-blue-600 */
QPushButton#BtnBrowse {
    background-color: #2563eb;
    border: none;
}
QPushButton#BtnBrowse:hover {
    background-color: #3b82f6;
}

/* --- Log Console (bg-black/50) --- */
QTextEdit {
    background-color: #000000;
    border: 1px solid #1e293b;
    border-radius: 8px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    padding: 10px;
    color: #4ade80; /* text-green-400 */
}

/* --- Headers --- */
QLabel#HeaderTitle {
    font-size: 20px;
    font-weight: bold;
    color: #f8fafc;
}
QLabel#HeaderSubtitle {
    font-size: 12px;
    color: #94a3b8; /* text-slate-400 */
}
"""

# ==============================================================================
# 3. لاجیک ترد و لاگ (بدون تغییر)
# ==============================================================================
class LogSignal(QObject):
    log_received = pyqtSignal(str)

class GUILogger:
    def __init__(self, signal):
        self.signal = signal
    def write(self, message):
        if message.strip(): self.signal.log_received.emit(message.strip())
    def flush(self): pass

class EngineThread(threading.Thread):
    def __init__(self, config, logger_signal):
        super().__init__()
        self.config = config
        self.running = False
        self.trader_instance = None
        self.logger_signal = logger_signal

    def run(self):
        self.running = True
        sys.stdout = GUILogger(self.logger_signal) 
        try:
            print("🚀 Initializing Engine...")
            mt5_path = self.config.get("MT5_PATH")
            if mt5_path and not os.path.exists(mt5_path):
                print(f"⚠️ Path invalid: {mt5_path}. Using default.")
                self.config["MT5_PATH"] = None

            self.trader_instance = LiveTrader(self.config) 
            print(f"✅ Active Symbol: {self.config['strategy_instances'][0]['symbol']}")
            
            while self.running:
                try:
                    self.trader_instance.position_manager.manage_positions()
                    self.trader_instance.signal_engine.process_entries()
                    time.sleep(1)
                except Exception as loop_error:
                    print(f"⚠️ Loop: {loop_error}")
                    time.sleep(5)      
        except Exception as e:
            print(f"❌ FATAL ERROR: {e}")
        finally:
            print("🛑 Engine Halted.")

    def stop(self):
        self.running = False

# ==============================================================================
# 4. رابط کاربری مدرن
# ==============================================================================
class TradingApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ProTrade AI - Dashboard")
        self.setGeometry(100, 100, 1000, 700)
        
        # اعمال استایل Tailwind
        self.setStyleSheet(TAILWIND_QSS)
        
        self.log_signal = LogSignal()
        self.log_signal.log_received.connect(self.update_log_window)
        self.engine_thread = None
        self.setup_ui()

    def setup_ui(self):
        # ویجت اصلی
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # لایوت اصلی (افقی: چپ تنظیمات، راست لاگ)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)

        # ----------------------------------------------------
        # ستون سمت چپ (Controls)
        # ----------------------------------------------------
        left_panel = QVBoxLayout()
        left_panel.setSpacing(15)

        # هدر
        header_layout = QVBoxLayout()
        title = QLabel("ProTrade AI")
        title.setObjectName("HeaderTitle")
        subtitle = QLabel(f"Version 3.7 | Strategy: {LOCKED_STRATEGY_CONFIG['ACTIVE_STRATEGY_CLASS'].__name__}")
        subtitle.setObjectName("HeaderSubtitle")
        header_layout.addWidget(title)
        header_layout.addWidget(subtitle)
        left_panel.addLayout(header_layout)
        
        # جداکننده
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setStyleSheet("color: #334155;") # border-slate-700
        left_panel.addWidget(line)

        # 1. بخش اتصال
        conn_group = QGroupBox("CONNECTION SETTINGS")
        conn_layout = QVBoxLayout()
        
        path_layout = QHBoxLayout()
        self.txt_mt5_path = QLineEdit()
        self.txt_mt5_path.setPlaceholderText("Auto-detect or select terminal64.exe...")
        # پر کردن خودکار اگر فایل موجود بود
        default_p = r"C:\Program Files\MetaTrader 5\terminal64.exe"
        if os.path.exists(default_p): self.txt_mt5_path.setText(default_p)
        
        btn_browse = QPushButton("Browse")
        btn_browse.setObjectName("BtnBrowse")
        btn_browse.setFixedWidth(80)
        btn_browse.clicked.connect(self.browse_mt5_file)
        
        path_layout.addWidget(self.txt_mt5_path)
        path_layout.addWidget(btn_browse)
        conn_layout.addLayout(path_layout)
        conn_group.setLayout(conn_layout)
        left_panel.addWidget(conn_group)

        # 2. مدیریت ریسک (Grid Layout for cleaner look)
        risk_group = QGroupBox("RISK MANAGEMENT")
        risk_form = QFormLayout()
        risk_form.setSpacing(10)
        
        self.combo_risk = QComboBox()
        self.combo_risk.addItems(["💵 Fixed Dollar Amount ($)", "📦 Fixed Lot Size", "📊 Percentage of Equity (%)"])
        self.combo_risk.currentIndexChanged.connect(self.update_risk_label)
        
        self.spin_risk_val = QDoubleSpinBox()
        self.spin_risk_val.setRange(0.01, 1000000)
        self.spin_risk_val.setValue(200)
        self.spin_risk_val.setButtonSymbols(QDoubleSpinBox.ButtonSymbols.NoButtons) # مدرن‌تر بدون دکمه‌های اسپین
        
        self.lbl_risk_unit = QLabel("Risk Value ($):")
        
        risk_form.addRow("Calculation Mode:", self.combo_risk)
        risk_form.addRow(self.lbl_risk_unit, self.spin_risk_val)
        risk_group.setLayout(risk_form)
        left_panel.addWidget(risk_group)

        # 3. مدیریت خروج (Trade Exit)
        exit_group = QGroupBox("TRADE MANAGEMENT")
        exit_layout = QVBoxLayout()
        exit_layout.setSpacing(12)

        # Breakeven Row
        be_row = QHBoxLayout()
        self.chk_be = QCheckBox("Activate Breakeven")
        self.chk_be.toggled.connect(lambda x: self.spin_be_rr.setEnabled(x))
        
        self.spin_be_rr = QDoubleSpinBox()
        self.spin_be_rr.setPrefix("Risk Reward: ")
        self.spin_be_rr.setRange(0.1, 10.0); self.spin_be_rr.setValue(1.0)
        self.spin_be_rr.setEnabled(False)
        self.spin_be_rr.setFixedWidth(150)
        
        be_row.addWidget(self.chk_be)
        be_row.addStretch()
        be_row.addWidget(self.spin_be_rr)

        # Partial Row
        pc_row = QHBoxLayout()
        self.chk_pc = QCheckBox("Activate Partial Close")
        self.chk_pc.toggled.connect(self.toggle_pc_inputs)
        
        self.spin_pc_vol = QDoubleSpinBox()
        self.spin_pc_vol.setSuffix("% Volume")
        self.spin_pc_vol.setRange(1, 99); self.spin_pc_vol.setValue(50); self.spin_pc_vol.setEnabled(False)
        
        self.spin_pc_rr = QDoubleSpinBox()
        self.spin_pc_rr.setPrefix("at R:R ")
        self.spin_pc_rr.setRange(0.1, 10.0); self.spin_pc_rr.setValue(2.0); self.spin_pc_rr.setEnabled(False)
        
        pc_row.addWidget(self.chk_pc)
        exit_layout.addLayout(be_row)
        
        # سطر دوم پارشیال (برای تمیزی بیشتر)
        pc_settings_row = QHBoxLayout()
        pc_settings_row.setContentsMargins(25, 0, 0, 0) # ایندنت
        pc_settings_row.addWidget(self.spin_pc_vol)
        pc_settings_row.addWidget(self.spin_pc_rr)
        
        exit_layout.addLayout(pc_row)
        exit_layout.addLayout(pc_settings_row)
        
        exit_group.setLayout(exit_layout)
        left_panel.addWidget(exit_group)
        
        left_panel.addStretch()

        # دکمه‌های اکشن
        action_layout = QHBoxLayout()
        self.btn_start = QPushButton("START ENGINE")
        self.btn_start.setObjectName("BtnStart")
        self.btn_start.setMinimumHeight(45)
        self.btn_start.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_start.clicked.connect(self.start_engine)
        
        self.btn_stop = QPushButton("STOP ENGINE")
        self.btn_stop.setObjectName("BtnStop")
        self.btn_stop.setMinimumHeight(45)
        self.btn_stop.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_stop.clicked.connect(self.stop_engine)
        self.btn_stop.setEnabled(False)
        
        action_layout.addWidget(self.btn_start)
        action_layout.addWidget(self.btn_stop)
        left_panel.addLayout(action_layout)

        # ----------------------------------------------------
        # ستون سمت راست (Log)
        # ----------------------------------------------------
        right_panel = QVBoxLayout()
        
        log_header = QLabel("Real-time Logs")
        log_header.setStyleSheet("font-weight: bold; color: #94a3b8; margin-bottom: 5px;")
        
        self.lbl_status = QLabel("● SYSTEM READY")
        self.lbl_status.setStyleSheet("color: #fbbf24; font-weight: bold; font-size: 12px;") # Amber status
        
        header_logs = QHBoxLayout()
        header_logs.addWidget(log_header)
        header_logs.addStretch()
        header_logs.addWidget(self.lbl_status)

        self.log_view = QTextEdit()
        self.log_view.setReadOnly(True)
        
        right_panel.addLayout(header_logs)
        right_panel.addWidget(self.log_view)

        # نسبت ستون‌ها (چپ 40% ، راست 60%)
        main_layout.addLayout(left_panel, 4)
        main_layout.addLayout(right_panel, 6)

    # ==========================================================================
    # Logic
    # ==========================================================================
    def browse_mt5_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Terminal", r"C:\Program Files", "Executable (*.exe)")
        if file_path: self.txt_mt5_path.setText(file_path)

    def update_risk_label(self, idx):
        labels = ["Risk Value ($):", "Lot Size:", "Equity Risk (%):"]
        self.lbl_risk_unit.setText(labels[idx])

    def toggle_pc_inputs(self, checked):
        self.spin_pc_vol.setEnabled(checked)
        self.spin_pc_rr.setEnabled(checked)

    def update_log_window(self, msg):
        t = datetime.now().strftime("%H:%M:%S")
        self.log_view.append(f"[{t}] {msg}")

    def generate_engine_config(self):
        user_mt5_path = self.txt_mt5_path.text().strip() or None
        mm_rules = []
        r_type = self.combo_risk.currentIndex()
        r_val = self.spin_risk_val.value()
        
        if r_type == 0: mm_rules.append(FixedRiskAmountRule(risk_amount_dollar=r_val))
        elif r_type == 1: mm_rules.append(FixedLotRule(lot_size=r_val))
        elif r_type == 2: mm_rules.append(PercentRiskRule(risk_percent=r_val))

        if self.chk_be.isChecked():
            mm_rules.append(BreakevenHandler(trigger_rr_ratio=self.spin_be_rr.value()))
        if self.chk_pc.isChecked():
            mm_rules.append(PartialCloseRule(target_rr=self.spin_pc_rr.value(), close_percentage=self.spin_pc_vol.value()/100.0))

        strategy_obj = LOCKED_STRATEGY_CONFIG['ACTIVE_STRATEGY_CLASS'](LOCKED_STRATEGY_CONFIG['STRATEGY_PARAMS'])
        
        return {
            "MT5_PATH": user_mt5_path,
            "strategy_instances": [{
                'strategy_id': f"LIVE_{LOCKED_STRATEGY_CONFIG['SYMBOL']}",
                'magic_number': LOCKED_STRATEGY_CONFIG['MAGIC_NUMBER'],
                'symbol': LOCKED_STRATEGY_CONFIG['SYMBOL'],
                'LOOKBACK_PERIOD': 500,
                'TIMEFRAME_MT5': LOCKED_STRATEGY_CONFIG['TIMEFRAME'],
                'TIMEFRAME_SECONDS': LOCKED_STRATEGY_CONFIG['TIMEFRAME_SECONDS'],
                'strategy': strategy_obj,
                'MONEY_MANAGEMENT_MODE': mm_rules,
                'SELL_SL_TP_ADJUSTMENT_PIPS': 1.5,
                'point_value': 1.0, 'contract_size': 1, 'candle_type': 'STANDARD',
                'allowed_days': LOCKED_STRATEGY_CONFIG['ALLOWED_DAYS'],
                'killzones': LOCKED_STRATEGY_CONFIG['KILLZONES']
            }]
        }

    def start_engine(self):
        self.toggle_inputs(False)
        try:
            live_config = self.generate_engine_config()
            self.engine_thread = EngineThread(live_config, self.log_signal)
            self.engine_thread.start()
            self.lbl_status.setText("● RUNNING")
            self.lbl_status.setStyleSheet("color: #4ade80; font-weight: bold; font-size: 12px;") # Green
            self.btn_start.setEnabled(False)
            self.btn_stop.setEnabled(True)
        except Exception as e:
            self.log_view.append(f"Error: {e}")
            self.toggle_inputs(True)

    def stop_engine(self):
        if self.engine_thread:
            self.log_view.append("Stopping...")
            self.engine_thread.stop()
            self.engine_thread.join()
        self.lbl_status.setText("● STOPPED")
        self.lbl_status.setStyleSheet("color: #f43f5e; font-weight: bold; font-size: 12px;") # Red
        self.btn_start.setEnabled(True)
        self.btn_stop.setEnabled(False)
        self.toggle_inputs(True)

    def toggle_inputs(self, enable):
        self.txt_mt5_path.setEnabled(enable)
        self.combo_risk.setEnabled(enable)
        self.spin_risk_val.setEnabled(enable)
        self.chk_be.setEnabled(enable)
        self.chk_pc.setEnabled(enable)
        if enable:
            self.spin_be_rr.setEnabled(self.chk_be.isChecked())
            self.toggle_pc_inputs(self.chk_pc.isChecked())
        else:
            self.spin_be_rr.setEnabled(False)
            self.spin_pc_vol.setEnabled(False)
            self.spin_pc_rr.setEnabled(False)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = TradingApp()
    window.show()
    sys.exit(app.exec())