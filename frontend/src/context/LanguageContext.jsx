import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
    en: {
        // --- App & General ---
        page_title: "RoadMaps App | Dashboard",
        RoadMaps: "RoadMaps",
        App: "App",
        version: "v2.5.0",
        global: "Global",
        symbol_label: "SYMBOL",
        live_market: "LIVE MARKET",
        Basic: "PRO EDITION",

        // --- Sidebar & Status ---
        dashboard: "Dashboard",
        overview: "Overview",
        strategy_manager: "Strategy Manager",
        education_tab: "AI Builder",
        analyze_chart: "Analyze Chart",
        connection_status: "Connection Status",
        ready: "Ready",
        running: "RUNNING",
        stopped: "STOPPED",
        collapse_view: "Collapse View",

        // --- Dashboard Header ---
        Roadmaps_App: "RoadMaps App",
        real_time_monitoring: "Real-time monitoring of performance & risk",
        active_strategies: "ACTIVE STRATEGIES",
        upcoming_news: "UPCOMING HIGH-IMPACT NEWS",
        starts_in: "STARTS IN",
        happening_now: "HAPPENING NOW!",

        // --- Dashboard Stats ---
        net_profit_today: "Net Profit (Today)",
        drawdown: "Drawdown",
        roi: "ROI",
        account_balance: "Account Balance",
        equity_growth: "Equity Growth",
        open_positions: "Active Positions",
        market_exposure_active: "Market Exposure Active",
        no_exposure: "No Exposure",

        // --- Engine Panel ---
        trading_engine: "Trading Engine",
        system_online: "SYSTEM ONLINE",
        system_offline: "SYSTEM OFFLINE",
        processing_ticks: "Processing Ticks...",
        terminal_path: "Terminal Path",
        not_selected: "Not Selected",
        browse_btn: "BROWSE",
        live_logs: "Live Logs",
        system_init: "System Initialized. Waiting for commands...",

        // --- Strategy Panel ---
        strategy_management: "Strategy Management",
        strategy_config_subtitle: "Configure trading algorithms & execution rules",
        import_strategy: "Import Strategy",
        no_strategies_found: "No active strategies found",
        no_strategies_desc: "Import a Python strategy file (.py) to get started",
        algorithm_parameters: "Algorithm Parameters",
        invalid: "INVALID",
        market_configuration: "Market Configuration",
        magic_number: "Magic Number",
        candle_type: "Candle Type",
        candle_standard: "Standard Candles",
        candle_heikin: "Heikin Ashi",
        strategy_leverage: "Symbol Leverage",
        leverage_auto: "Auto",
        timeframe_label: "TIMEFRAME",
        trading_days: "Trading Days",
        day_mon: "Mon", 
        day_tue: "Tue", 
        day_wed: "Wed", 
        day_thu: "Thu", 
        day_fri: "Fri", 
        day_sat: "Sat", 
        day_sun: "Sun",
        active_trading_hours: "Active Trading Hours",
        add_trading_window: "Add Trading Window",
        from: "FROM", 
        to: "TO",
        timeframe_m1: "M1 - 1 Minute", 
        timeframe_m5: "M5 - 5 Minutes", 
        timeframe_m15: "M15 - 15 Minutes",
        timeframe_h1: "H1 - 1 Hour", 
        timeframe_h4: "H4 - 4 Hours", 
        timeframe_d1: "D1 - Daily", 
        timeframe_w1: "W1 - Weekly",
        risk_management: "Risk Management",
        risk_fixed_usd: "Fixed USD Risk ($)", 
        risk_fixed_lot: "Fixed Lot Size", 
        risk_percent: "Percentage Risk (%)",
        delay_logic_checks: "Delay Between Logic Checks",
        cycle_seconds: "CYCLE SECONDS",

        // --- Risk Panel & News Filter ---
        global_risk: "Global Risk Management",
        global_risk_desc: "Auto-safety rules for all trades",
        margin_usage: "Max Margin Usage",
        margin_usage_desc: "Halts new positions if account margin exceeds this percentage. Crucial to prevent Prop Firm violations.",
        warmup_system: "Engine Warm-up Phase",
        warmup_desc: "Maintains algorithm rhythm by pre-calculating historical data.",
        candles: "Candles",
        news_filter: "Smart News Filter",
        news_filter_desc: "Halts trading during high-impact (RED) economic events.",
        mins_before: "Mins Before",
        mins_after: "Mins After",
        auto_breakeven: "Auto Breakeven",
        trigger: "Trigger:",
        partial_close: "Partial Close",
        vol: "Vol:",
        at: "@",
        target_lock: "Target Lock",
        target_value: "Target",
        save_config: "Save Config",
        saving: "Saving...",
        core_system_logic: "Core System & Logic Rules",



        // --- AI Builder Panel ---
        ai_builder_title: "AI Strategy Builder",
        ai_builder_subtitle: "Build trading bots without coding! Copy the template and paste it into AI.",
        step_1_title: "1. Copy Template",
        step_1_desc: "Click the copy button below to copy the standard trading architecture.",
        step_2_title: "2. Talk to AI",
        step_2_desc: "Open AI and Paste the code and say: 'Using this template, write a strategy that buys when RSI < 30...'",
        step_3_title: "3. Import & Run",
        step_3_desc: "Save the AI's code in a python file. Go to the Strategy Manager tab, import it, and watch it trade!",
        copy_code: "Copy Architecture",
        copied: "Copied successfully!",
        
        // --- News Add ---
        system_broker_settings: "System & Broker Settings",
        global_risk_protections: "Global Risk Protections",

        // --- Chart Analyzer ---
        chart_analysis: "Chart Analysis",
        analyze_and_trade: "Analyze and Trade ...",
        upload_chart: "Upload a chart for analysis",
        note_label: "Note:",
        chart_tips: "The image must be legible; we recommend using a screenshot. Ensure the symbol and timeframe are clearly visible. Any issues may reduce the accuracy of the analysis.",
        drag_drop_text: "Click to upload or drag image here",
        paste_text: "Or press Ctrl+V to paste",
        clear_image: "Clear Image",
        analyzing_chart: "Vision Engine is processing...",
        start_analysis: "Start Analysis",
        waiting_chart: "Waiting for your chart",
        waiting_chart_desc: "Upload a chart screenshot to extract trading structures and deploy them directly to your MT5 account.",
        ai_confidence: "AI CONFIDENCE",
        market_state: "MARKET STATE",
        trade_bias: "TRADE BIAS",
        entry_zone: "ENTRY ZONE",
        stop_loss: "STOP LOSS",
        take_profit_1: "TAKE PROFIT 1",
        take_profit_2: "TAKE PROFIT 2",
        price_action_logic: "PRICE ACTION LOGIC",
        indicators_confluence: "INDICATORS & CONFLUENCE",
        execution_setup: "EXECUTION SETUP",
        deploy_mt5: "DEPLOY TO MT5",
        risk_warning: "Warning:",
        executing: "Executing...",
        connection_error: "Connection to Python server failed. Please ensure Eel is running.",
        chart_analysis_header: "Chart Analysis",
        upload_chart_screenshots: "Upload chart screenshots for AI technical analysis",
        vision_trade_engine: "Vision Trade Engine",
        vision_engine_desc: "Upload a chart for deep LLM analysis and 1-click MT5 execution.",
        run_deep_analysis: "Run Deep Analysis",
        awaiting_chart: "Awaiting Chart Data",
        awaiting_chart_desc: "Upload a screenshot to extract trading structures and deploy them directly to your MT5 account.",
        paste_screenshot: "Or press Ctrl+V to paste screenshot",
        deploy_to_mt5: "DEPLOY TO MT5",
    },
    fa: {
        // --- App & General ---
        page_title: "پنل مدیریت | RoadMaps App",
        RoadMaps: "RoadMaps",
        App: "App",
        version: "نسخه 2.5.0",
        global: "جهانی",
        symbol_label: "نماد",
        live_market: "بازار زنده",
        Basic: "PRO EDITION",

        // --- Sidebar & Status ---
        dashboard: "داشبورد اصلی",
        overview: "مرور کلی",
        strategy_manager: "مدیریت استراتژی",
        education_tab: "ربات‌سازی با هوش مصنوعی",
        analyze_chart: "تحلیل چارت",
        connection_status: "وضعیت اتصال",
        ready: "آماده",
        running: "در حال اجرا",
        stopped: "متوقف شده",
        collapse_view: "جمع‌کردن نوار",

        // --- Dashboard Header ---
        Roadmaps_App: "RoadMaps App",
        real_time_monitoring: "داشبورد نظارت و عملکرد",
        active_strategies: "استراتژی‌های فعال",
        upcoming_news: "خبر مهم اقتصادی پیش‌رو",
        starts_in: "زمان باقی‌مانده",
        happening_now: "در حال انتشار!",

        // --- Dashboard Stats ---
        net_profit_today: "سود خالص (امروز)",
        drawdown: "کاهش",
        roi: "بازده",
        account_balance: "موجودی اکانت",
        equity_growth: "رشد سرمایه",
        open_positions: "پوزیشن‌های باز",
        market_exposure_active: "در معرض بازار",
        no_exposure: "بدون پوزیشن فعال",

        // --- Engine Panel ---
        trading_engine: "موتور معاملاتی",
        system_online: "سیستم آنلاین",
        system_offline: "سیستم آفلاین",
        processing_ticks: "پردازش تیک‌ها...",
        terminal_path: "مسیر ترمینال",
        not_selected: "انتخاب نشده",
        browse_btn: "انتخاب مسیر",
        live_logs: "لاگ‌های زنده",
        system_init: "سیستم مهیا شد. منتظر دریافت دستورات...",

        // --- Strategy Panel ---
        strategy_management: "مدیریت استراتژی",
        strategy_config_subtitle: "پیکربندی الگوریتم‌های معاملاتی و قوانین اجرا",
        import_strategy: "افزودن استراتژی",
        no_strategies_found: "هیچ استراتژی فعالی یافت نشد",
        no_strategies_desc: "یک فایل استراتژی پایتون (.py) را برای شروع وارد کنید",
        algorithm_parameters: "پارامترهای الگوریتم",
        invalid: "نامعتبر",
        market_configuration: "پیکربندی بازار",
        magic_number: "شماره جادویی",
        candle_type: "نوع کندل",
        candle_standard: "شمع‌های معمولی",
        candle_heikin: "هایکین آشی",
        strategy_leverage: "لوریج نماد",
        leverage_auto: "خودکار",
        timeframe_label: "تایم فریم",
        trading_days: "روز‌های معاملاتی",
        day_mon: "دوشنبه", 
        day_tue: "سه‌شنبه", 
        day_wed: "چهارشنبه", 
        day_thu: "پنج‌شنبه", 
        day_fri: "جمعه", 
        day_sat: "شنبه", 
        day_sun: "یکشنبه",
        active_trading_hours: "ساعات فعال معاملاتی",
        add_trading_window: "افزودن بازه زمانی",
        from: "از", 
        to: "تا",
        timeframe_m1: "M1 - 1 دقیقه", 
        timeframe_m5: "M5 - 5 دقیقه", 
        timeframe_m15: "M15 - 15 دقیقه",
        timeframe_h1: "H1 - 1 ساعت", 
        timeframe_h4: "H4 - 4 ساعت", 
        timeframe_d1: "D1 - روزانه", 
        timeframe_w1: "W1 - هفتگی",
        risk_management: "مدیریت ریسک استراتژی",
        risk_fixed_usd: "ریسک مبلغ ثابت ($)", 
        risk_fixed_lot: "حجم ثابت (لات)", 
        risk_percent: "ریسک درصدی (%)",
        delay_logic_checks: "تاخیر بین بررسی منطق",
        cycle_seconds: "سیکل ثانیه",

        // --- Risk Panel & News Filter ---
        global_risk: "مدیریت ریسک سراسری",
        global_risk_desc: "قوانین امنیتی خودکار برای تمامی معاملات",
        margin_usage: "حداکثر مارجین درگیر",
        margin_usage_desc: "در صورت عبور مارجین از این درصد، سیستم از باز کردن پوزیشن جدید جلوگیری می‌کند. بسیار مهم برای اکانت‌های پراپ‌فرم.",
        warmup_system: "مرحله گرم‌سازی موتور",
        warmup_desc: "حفظ ریتم الگوریتم با از پیش محاسبه داده‌های تاریخی برای جلوگیری از خطای سیگنال.",
        candles: "تعداد کندل",
        news_filter: "فیلتر هوشمند اخبار",
        news_filter_desc: "توقف معاملات در زمان انتشار اخبار مهم اقتصادی برای محافظت از حساب.",
        mins_before: "دقیقه قبل",
        mins_after: "دقیقه بعد",
        auto_breakeven: "ریسک‌فری خودکار",
        trigger: "شروع:",
        partial_close: "سیو سود (Partial)",
        vol: "حجم:",
        at: "در",
        target_lock: "قفل تارگت کل",
        target_value: "تارگت",
        save_config: "ذخیره تنظیمات",
        saving: "در حال ذخیره...",
        core_system_logic: "قوانین اصلی سیستم و منطق معاملاتی",

        // --- AI Builder Panel ---
        ai_builder_title: "ساخت استراتژی با هوش مصنوعی",
        ai_builder_subtitle: "بدون یک خط کدنویسی ربات بسازید! این قالب را کپی کرده و به هوش مصنوعی بدهید.",
        step_1_title: "۱. کپی کردن قالب",
        step_1_desc: "روی دکمه کپی کلیک کنید تا معماری استاندارد ربات در حافظه شما ذخیره شود.",
        step_2_title: "۲. صحبت با هوش مصنوعی",
        step_2_desc: "هوش مصنوعی را باز کنید. قالب را پیست کنید و به زبان ساده بگویید: «با این قالب استراتژی بنویس که اگر RSI زیر 30 رفت بخر...»",
        step_3_title: "۳. درون‌ریزی و اجرا",
        step_3_desc: "کدی که هوش مصنوعی داد را در یک فایل پایتونی ذخیره کنید. به تب مدیریت استراتژی بروید، آن را وارد نرم افزار (Import) کنید و تمام!",
        copy_code: "کپی کردن معماری",
        copied: "با موفقیت کپی شد!",
        
        // --- News Add ---
        system_broker_settings: "مدیریت سیستم",
        global_risk_protections: "مدیریت ریسک سراسری",

        // --- Chart Analyzer ---
        chart_analysis: "تحلیل چارت",
        analyze_and_trade: "تحلیل کن و معامله بزن",
        upload_chart: "بارگذاری نمودار برای تحلیل",
        note_label: "نکته:",
        chart_tips: "توجه داشته باشید که تصویر باید خوانا باشد؛ توصیه می‌کنیم از اسکرین‌شات استفاده کنید. اطمینان حاصل کنید که نماد (Symbol) و بازه زمانی (Timeframe) به‌وضوح قابل مشاهده هستند؛ هرگونه نقص در این موارد ممکن است دقت تحلیل را کاهش دهد.",
        drag_drop_text: "برای آپلود کلیک کن یا تصویر رو بکش اینجا",
        paste_text: "یا برای پیست کردن کلیدهای Ctrl+V رو بزن",
        clear_image: "پاک کردن تصویر",
        analyzing_chart: "در حال تحلیل نمودار...",
        start_analysis: "شروع تحلیل دقیق",
        waiting_chart: "منتظر چارت شما",
        waiting_chart_desc: "اسکرین‌شات چارت رو آپلود کن تا ساختار بازار بررسی بشه و بتونی سیگنال رو مستقیم روی متاتریدرت اجرا کنی.",
        ai_confidence: "اطمینان هوش مصنوعی",
        market_state: "وضعیت بازار",
        trade_bias: "جهت معامله",
        entry_zone: "محدوده ورود",
        stop_loss: "حد ضرر",
        take_profit_1: "حد سود ۱",
        take_profit_2: "حد سود ۲",
        price_action_logic: "منطق پرایس اکشن",
        indicators_confluence: "اندیکاتورها و تاییدیه‌ها",
        execution_setup: "تنظیمات اجرا",
        deploy_mt5: "اجرای معامله در MT5",
        risk_warning: "هشدار:",
        executing: "در حال اجرا...",
        connection_error: "ارتباط با سرور پایتون برقرار نشد. لطفا بررسی کنید که Eel در حال اجرا باشد.",
        chart_analysis_header: "تحلیل چارت",
        upload_chart_screenshots: "بارگذاری تصاویر نمودار برای تحلیل تکنیکال توسط هوش مصنوعی",
        vision_trade_engine: "موتور بینایی معاملاتی",
        vision_engine_desc: "چارت خود را آپلود کنید تا هوش مصنوعی نقاط ورود را استخراج کرده و روی متاتریدر اجرا کند.",
        run_deep_analysis: "شروع تحلیل عمیق چارت",
        awaiting_chart: "منتظر دریافت چارت",
        awaiting_chart_desc: "یک اسکرین‌شات از چارت آپلود کنید تا ساختار بازار و استاپ‌لاس استاندارد استخراج شود.",
        paste_screenshot: "یا کلیدهای Ctrl+V را فشار دهید تا عکس مستقیماً پیست شود",
        deploy_to_mt5: "ارسال مستقیم به MT5",
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