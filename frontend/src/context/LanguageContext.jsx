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
        net_profit_today: "Net Profit (Today)",
        drawdown: "Drawdown",
        roi: "ROI",
        account_balance: "Account Balance",
        equity_growth: "Equity Growth",
        open_positions: "Active Positions",
        market_exposure_active: "Market Exposure Active",
        no_exposure: "No Exposure",
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
        
        // --- Dashboard Header ---
        roadmap_trader_basic: "RoadMap Trader Basic",
        strategy_manager: "Strategy Manager",
        real_time_monitoring: "Real-time monitoring of performance & risk",
        active_strategies: "ACTIVE STRATEGIES",
        
        // --- Engine Panel / Logs ---
        trading_engine_title: "Trading Engine",
        system_online: "SYSTEM ONLINE",
        system_offline: "SYSTEM OFFLINE",
        processing_ticks: "Processing Ticks...",
        not_selected: "Not Selected",
        browse_btn: "BROWSE",
        live_execution_logs: "Live Execution Logs",
        system_initialized: "System Initialized. Waiting for commands...",
        debugger: "DEBUGGER",
        terminal: "TERMINAL",
        
        // --- Strategy Panel ---
        strategy_management: "Strategy Management",
        strategy_config_subtitle: "Configure trading algorithms & execution rules",
        import_strategy: "Import Strategy",
        no_strategies_found: "No active strategies found",
        no_strategies_desc: "Import a Python strategy file (.py) to get started",
        timeframe_m1: "M1 - 1 Minute",
        timeframe_m5: "M5 - 5 Minutes",
        timeframe_m15: "M15 - 15 Minutes",
        timeframe_h1: "H1 - 1 Hour",
        timeframe_h4: "H4 - 4 Hours",
        timeframe_d1: "D1 - Daily",
        timeframe_w1: "W1 - Weekly",
        candle_standard: "Standard Candles",
        candle_heikin: "Heikin Ashi",
        risk_fixed_usd: "Fixed USD Risk",
        risk_fixed_lot: "Fixed Lot Size",
        risk_percent: "Percentage Risk",
        algorithm_parameters: "Algorithm Parameters",
        market_configuration: "Market Configuration",
        active_trading_hours: "Active Trading Hours",
        from: "FROM",
        to: "TO",
        invalid: "INVALID",
        
        // --- Bot Settings Panel ---
        trading_days: "Trading Days",
        apply_changes: "Apply Changes",
        day_mon: "Mon",
        day_tue: "Tue",
        day_wed: "Wed",
        day_thu: "Thu",
        day_fri: "Fri",
        day_sat: "Sat",
        day_sun: "Sun",
        magic_number: "Magic Number",
        candle_type: "Candle Type",
        
        // --- Risk Panel & News Filter ---
        engine_warmup: "Engine Warm-up Phase",
        warmup_candles: "Candles",
        warmup_system: "Engine Warm-up Phase",
        warmup_desc: "Maintains algorithm rhythm by pre-calculating historical data.",
        candles: "Candles",
        news_filter: "Smart News Filter",
        news_filter_desc: "Halts trading during high-impact (RED) economic events.",
        mins_before: "Mins Before",
        mins_after: "Mins After",
        
        // --- Login Page ---
        app_subtitle: "Professional Algorithmic Trading Terminal",
        version: "v2.5.0",
        
        // --- Sidebar ---
        collapse_view: "Collapse View",
        
        // --- Global Risk ---
        global_risk: "Global Risk Management",
        global_risk_desc: "Auto-safety rules for all trades",
        target_lock: "Daily Target Lock",
        target_value: "Target",
        
        // --- AI & Education ---
        education_tab: "AI Builder",
        ai_builder_title: "AI Strategy Builder",
        ai_builder_subtitle: "Build trading bots without coding! Copy the template and paste it into ChatGPT.",
        step_1_title: "1. Copy Template",
        step_1_desc: "Click the copy button below to copy the standard trading architecture.",
        step_2_title: "2. Talk to AI",
        step_2_desc: "Open ChatGPT or Claude. Paste the code and say: 'Using this template, write a strategy that buys when RSI < 30...'",
        step_3_title: "3. Import & Run",
        step_3_desc: "Save the AI's code in a .py file. Go to the Strategy Manager tab, import it, and watch it trade!",
        copy_code: "Copy Architecture",
        copied: "Copied successfully!"
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
        net_profit_today: "سود خالص (امروز)",
        drawdown: "کاهش",
        roi: "بازده",
        account_balance: "موجودی اکانت",
        equity_growth: "رشد سرمایه",
        open_positions: "پوزیشن‌های باز",
        market_exposure_active: "در معرض بازار",
        no_exposure: "بدون پوزیشن فعال",
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
        
        // --- Dashboard Header ---
        roadmap_trader_basic: "RoadMap Trader",
        strategy_manager: "مدیریت استراتژی",
        real_time_monitoring: "نظارت بلادرنگ بر عملکرد و وضعیت ریسک",
        active_strategies: "استراتژی‌های فعال",
        
        // --- Engine Panel / Logs ---
        trading_engine_title: "موتور معاملاتی",
        system_online: "سیستم آنلاین",
        system_offline: "سیستم آفلاین",
        processing_ticks: "پردازش تیک‌ها...",
        not_selected: "انتخاب نشده",
        browse_btn: "مرور مسیر",
        live_execution_logs: "لاگ اجرای زنده",
        system_initialized: "سیستم مهیا شد. منتظر دریافت دستورات...",
        debugger: "دیباگر (عیب‌یاب)",
        terminal: "ترمینال اصلی",
        
        // --- Strategy Panel ---
        strategy_management: "مدیریت استراتژی",
        strategy_config_subtitle: "پیکربندی الگوریتم‌های معاملاتی و قوانین اجرا",
        import_strategy: "افزودن استراتژی",
        no_strategies_found: "هیچ استراتژی فعالی یافت نشد",
        no_strategies_desc: "یک فایل استراتژی پایتون (.py) را برای شروع وارد کنید",
        timeframe_m1: "M1 - 1 دقیقه",
        timeframe_m5: "M5 - 5 دقیقه",
        timeframe_m15: "M15 - 15 دقیقه",
        timeframe_h1: "H1 - 1 ساعت",
        timeframe_h4: "H4 - 4 ساعت",
        timeframe_d1: "D1 - روزانه",
        timeframe_w1: "W1 - هفتگی",
        candle_standard: "شمع‌های معمولی",
        candle_heikin: "هایکین آشی",
        risk_fixed_usd: "ریسک مبلغ ثابت ($)",
        risk_fixed_lot: "حجم لات ثابت",
        risk_percent: "ریسک درصدی (%)",
        algorithm_parameters: "پارامترهای الگوریتم",
        market_configuration: "پیکربندی بازار",
        active_trading_hours: "ساعات فعال معاملاتی",
        from: "از",
        to: "تا",
        invalid: "نامعتبر",
        
        // --- Bot Settings Panel ---
        trading_days: "روز‌های معاملاتی",
        apply_changes: "اعمال تغییرات",
        day_mon: "دوشنبه",
        day_tue: "سه‌شنبه",
        day_wed: "چهارشنبه",
        day_thu: "پنج‌شنبه",
        day_fri: "جمعه",
        day_sat: "شنبه",
        day_sun: "یکشنبه",
        magic_number: "شماره جادویی",
        candle_type: "نوع شمع",
        
        // --- Risk Panel & News Filter ---
        engine_warmup: "مرحله گرم‌سازی موتور",
        warmup_candles: "شمع",
        warmup_system: "مرحله گرم‌سازی موتور",
        warmup_desc: "حفظ ریتم الگوریتم با از پیش محاسبه داده‌های تاریخی برای جلوگیری از خطای سیگنال.",
        candles: "شمع",
        news_filter: "فیلتر هوشمند اخبار",
        news_filter_desc: "توقف معاملات در زمان انتشار اخبار مهم اقتصادی برای محافظت از حساب.",
        mins_before: "دقیقه قبل",
        mins_after: "دقیقه بعد",
        
        // --- Login Page ---
        app_subtitle: "ترمینال معاملاتی الگوریتمی حرفه‌ای",
        version: "نسخه 2.5.0",
        
        // --- Sidebar ---
        collapse_view: "جمع‌کردن نوار",
        
        // --- Global Risk ---
        global_risk: "مدیریت ریسک سراسری",
        global_risk_desc: "قوانین امنیتی خودکار برای تمامی معاملات",
        target_lock: "قفل تارگت روزانه",
        target_value: "تارگت",
        
        // --- AI & Education ---
        education_tab: "ربات‌ساز هوش مصنوعی",
        ai_builder_title: "ساخت استراتژی با هوش مصنوعی",
        ai_builder_subtitle: "بدون یک خط کدنویسی ربات بسازید! این قالب را کپی کرده و به ChatGPT بدهید.",
        step_1_title: "۱. کپی کردن قالب",
        step_1_desc: "روی دکمه کپی کلیک کنید تا معماری استاندارد ربات در حافظه شما ذخیره شود.",
        step_2_title: "۲. صحبت با هوش مصنوعی",
        step_2_desc: "چت‌جی‌پی‌تی (ChatGPT) را باز کنید. قالب را پیست کنید و به زبان ساده بگویید: «با این قالب استراتژی بنویس که اگر RSI زیر 30 رفت بخر...»",
        step_3_title: "۳. درون‌ریزی و اجرا",
        step_3_desc: "کدی که هوش مصنوعی داد را در یک فایل .py ذخیره کنید. به تب مدیریت استراتژی بروید، آن را درون‌ریزی (Import) کنید و تمام!",
        copy_code: "کپی کردن معماری",
        copied: "با موفقیت کپی شد!"
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