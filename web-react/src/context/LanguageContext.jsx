import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
    en: {
        page_title: "RoadMap Trader | Dashboard",
        login_title: "RoadMap Trader | Login",
        roadmap: "RoadMap",
        trader: "Trader",
        pro: "Pro",
        dashboard: "Dashboard",
        connection_status: "Connection Status",
        ready: "Ready",
        overview: "Overview",
        live_market: "LIVE MARKET",
        symbol: "Symbol:",
        global: "Global",
        login_subtitle: "Secure entry to capital management panel",
        hwid_label: "Hardware ID",
        hwid_placeholder: "Authenticating...",
        check_login_btn: "Verify & Login",
        server_online: "SERVER ONLINE",
        net_profit_today: "Net Profit Today",
        account_balance: "Account Balance",
        open_positions: "Open Positions",
        status_normal: "Status: Normal",
        risk_management_cfg: "Risk Management Configuration",
        risk_calc_label: "Risk Calculation",
        risk_val_label: "Risk Value ($)",
        risk_val_label_lot: "Lot Size",
        risk_val_label_percent: "Percentage (%)",
        opt_fixed_usd: "Fixed Amount ($)",
        opt_fixed_lot: "Fixed Lot Size",
        opt_percent: "Balance Percentage (%)",
        auto_breakeven: "Auto Breakeven",
        move_sl_entry: "Move SL to Entry",
        trigger: "Trigger:",
        partial_close: "Partial Close",
        secure_profits: "Secure Profits",
        vol: "Vol:",
        at: "@",
        save_config: "Save Config",
        saving: "Saving...",
        trading_engine: "Trading Engine",
        terminal_path: "Terminal Path",
        live_logs: "Live Logs",
        system_init: "[System] Initializing Interface...",
        running: "RUNNING",
        stopped: "STOPPED",
        
        // NEW ADDITIONS
        global_risk: "Global Risk Management",
        global_risk_desc: "Auto-safety rules for all trades",
        target_lock: "Daily Target Lock",
        target_value: "Target"
    },
    fa: {
        page_title: "پنل مدیریت | RoadMap Trader",
        login_title: "ورود به سیستم | RoadMap Trader",
        roadmap: "RoadMap",
        trader: "Trader",
        pro: "Pro",
        dashboard: "داشبورد اصلی",
        connection_status: "وضعیت اتصال",
        ready: "آماده",
        overview: "مرور کلی",
        live_market: "بازار زنده",
        symbol: "نماد:",
        global: "جهانی",
        login_subtitle: "ورود امن به پنل مدیریت سرمایه",
        hwid_label: "شناسه سخت‌افزاری",
        hwid_placeholder: "در حال احراز هویت...",
        check_login_btn: "بررسی و ورود",
        server_online: "سرور آنلاین",
        net_profit_today: "سود خالص امروز",
        account_balance: "موجودی اکانت",
        open_positions: "پوزیشن‌های باز",
        status_normal: "وضعیت: نرمال",
        risk_management_cfg: "تنظیمات مدیریت ریسک",
        risk_calc_label: "محاسبه ریسک",
        risk_val_label: "مقدار ریسک ($)",
        risk_val_label_lot: "حجم لات (Lot)",
        risk_val_label_percent: "درصد موجودی (%)",
        opt_fixed_usd: "مبلغ ثابت ($)",
        opt_fixed_lot: "حجم ثابت (لات)",
        opt_percent: "درصد از موجودی (%)",
        auto_breakeven: "ریسک‌فری خودکار",
        move_sl_entry: "انتقال حدضرر به نقطه ورود",
        trigger: "شروع:",
        partial_close: "سیو سود (Partial)",
        secure_profits: "برداشت بخشی از سود",
        vol: "حجم:",
        at: "در",
        save_config: "ذخیره تنظیمات",
        saving: "در حال ذخیره...",
        trading_engine: "موتور معاملاتی",
        terminal_path: "مسیر ترمینال",
        live_logs: "لاگ‌های زنده",
        system_init: "[سیستم] رابط کاربری آماده شد...",
        running: "در حال اجرا",
        stopped: "متوقف شده",
        
        // NEW ADDITIONS
        global_risk: "مدیریت ریسک سراسری",
        global_risk_desc: "قوانین امنیتی خودکار برای تمامی معاملات",
        target_lock: "قفل تارگت روزانه",
        target_value: "تارگت"
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'fa');

    const toggleLanguage = () => {
        const newLang = lang === 'fa' ? 'en' : 'fa';
        setLang(newLang);
        localStorage.setItem('app_lang', newLang);
    };

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    }, [lang]);

    const t = (key) => translations[lang][key] || key;

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);