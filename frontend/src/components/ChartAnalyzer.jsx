import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * FluentCustomSelect Component
 * Implements Microsoft Fluent 2 ComboBox pattern for risk mode selection.
 */
const FluentCustomSelect = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = (options || []).find(opt => opt.value === value)?.label || value;

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full flex items-center justify-between bg-[#18181B] border rounded-[4px] px-3 text-xs text-[#E1DFDD] font-mono transition-all outline-none cursor-pointer ${
                    isOpen 
                        ? 'border-[#107C41] bg-[#1F1F22]' 
                        : 'border-[#333333] hover:border-[#3E3E3E]'
                }`}
            >
                <span className="truncate pr-2" dir="ltr">{selectedLabel}</span>
                <svg 
                    className={`w-3.5 h-3.5 text-[#797775] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#107C41]' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {/* Flyout menu */}
            <div className={`absolute left-0 top-full mt-1 w-full bg-[#242424] border border-[#3E3E3E] rounded-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-50 transition-all duration-150 origin-top ${
                isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
            }`}>
                <div className="max-h-48 overflow-y-auto py-1">
                    {(options || []).map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`px-3 py-2 text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                                    isSelected 
                                        ? 'bg-[#107C41]/15 text-[#34D399] font-semibold' 
                                        : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
                                }`}
                                dir="ltr"
                            >
                                <span>{opt.label}</span>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#107C41]" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/**
 * ChartAnalyzer Component
 * Cognitive chart analysis deck with native Python/Eel bridges.
 */
const ChartAnalyzer = () => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    
    // Core Vision States
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const isCancelledRef = useRef(false);
    
    // Execution & Configuration States
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const lastSavedApiKey = useRef("");
    const [symbol, setSymbol] = useState("XAUUSD");
    const [riskMode, setRiskMode] = useState('percentage');
    const [riskValue, setRiskValue] = useState('1.0');
    const [isDeploying, setIsDeploying] = useState(false);

    // Toast/Flyout Notification State
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const riskModeOptions = [
        { label: t('risk_percent') || 'Percentage (%)', value: 'percentage' },
        { label: t('risk_fixed_usd') || 'Fixed USD ($)', value: 'fixed_usd' },
        { label: t('risk_fixed_lot') || 'Fixed Volume (Lot)', value: 'fixed_lot' },
    ];

    // Load initial configuration
    useEffect(() => {
        if (window.eel) {
            window.eel.get_initial_data()().then(data => {
                if (data?.gemini_api_key) {
                    setApiKey(data.gemini_api_key);
                    lastSavedApiKey.current = data.gemini_api_key;
                }
            }).catch(err => console.error("Initial data fetch error:", err));
        }
    }, []);

    // Save Gemini API Key on blur
    const saveApiKey = () => {
        if (apiKey !== lastSavedApiKey.current) {
            if (window.eel) {
                window.eel.save_user_config({ gemini_api_key: apiKey })()
                    .catch(err => console.error("API Key save error:", err));
                lastSavedApiKey.current = apiKey; 
                showToast(lang === 'fa' ? "کلید API با موفقیت ثبت شد." : "API Key saved successfully.", "success");
            }
        }
    };

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        if (type === 'success') {
            setTimeout(() => {
                setToast(prev => prev.message === message ? { show: false, message: '', type: 'error' } : prev);
            }, 4000);
        }
    };

    const handleImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setResult(null); 
            setIsAnalyzing(false);
        };
        reader.readAsDataURL(file);
    };

    // Global Paste Listener for instant screenshot loading
    const handlePaste = useCallback((e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                handleImageFile(file);
                break;
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault(); 
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) handleImageFile(e.dataTransfer.files[0]);
    };

    const cancelAnalysis = () => {
        isCancelledRef.current = true;
        setIsAnalyzing(false);
        showToast(lang === 'fa' ? "عملیات تحلیل لغو شد." : "Analysis cancelled by user.", "error");
    };

    // Run Vision LLM Analysis
    const runAnalysis = async () => {
        if (!imagePreview || !window.eel) return;
        
        setIsAnalyzing(true);
        setResult(null);
        isCancelledRef.current = false;
        
        try {
            const fetchPromise = window.eel.analyze_uploaded_chart(imagePreview, lang)();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), 90000)
            );

            const data = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (isCancelledRef.current) return;
            
            if (data?.market_state && data.market_state.includes('ERROR')) {
                showToast(data.price_action_analysis || (lang === 'fa' ? "خطای ارتباط با سرور هوش مصنوعی رخ داد." : "AI analysis request failed."), 'error');
            }
            
            setResult(data);
        } catch (err) {
            if (isCancelledRef.current) return;
            console.error("Backend connection failed:", err);
            if (err.message === 'TIMEOUT') {
                showToast(lang === 'fa' ? "زمان تحلیل به پایان رسید (Timeout)." : "Analysis timed out after 90 seconds.", 'error');
            } else {
                showToast(t('connection_error') || "Connection to core Python engine failed.", 'error');
            }
        } finally {
            if (!isCancelledRef.current) {
                setIsAnalyzing(false);
            }
        }
    };

    // Dispatch verified trade order to MetaTrader 5
    const handleDeployToMT5 = async () => {
        if (!result || isDeploying || !symbol) return;
        setIsDeploying(true);
        try {
            const deployRes = await window.eel.deploy_ai_trade_to_mt5(symbol, result, riskMode, parseFloat(riskValue))();
            if (deployRes?.success) {
                showToast(deployRes.message || "Order deployed successfully.", 'success');
            } else {
                showToast(deployRes?.message || "Failed to place order in MT5.", 'error');
            }
        } catch (error) {
            console.error("MT5 Deployment error:", error);
            showToast("Critical error during MT5 execution bridge.", 'error');
        }
        setIsDeploying(false);
    };

    // Resolve visual theme by trade bias
    const getBiasBadge = (bias) => {
        if (bias === 'BUY') {
            return 'bg-[#107C41]/15 border-[#107C41]/40 text-[#34D399]';
        }
        if (bias === 'SELL') {
            return 'bg-[#C42B1C]/15 border-[#C42B1C]/40 text-[#F87171]';
        }
        return 'bg-[#1F1F1F] border-[#333333] text-[#A19F9D]';
    };

    const isTradeable = result && result.trade_bias !== 'NEUTRAL' && result.trade_bias !== 'WAIT' && !(result.market_state?.includes('ERROR')) && symbol.trim().length > 0;

    return (
        <div 
            className="flex flex-col w-full h-full font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] text-[#F3F2F1] select-none gap-4"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Microsoft WinUI MessageDialog Notification */}
            {toast.show && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
                    <div className={`flex flex-col items-start p-6 rounded-[8px] border shadow-[0_16px_40px_rgba(0,0,0,0.6)] max-w-md w-full bg-[#242424] ${
                        toast.type === 'success' ? 'border-[#107C41]' : 'border-[#C42B1C]'
                    }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center ${
                                toast.type === 'success' ? 'bg-[#107C41]/20 text-[#34D399]' : 'bg-[#C42B1C]/20 text-[#F87171]'
                            }`}>
                                {toast.type === 'success' ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                            </div>
                            <h4 className="text-sm font-semibold text-white">
                                {toast.type === 'success' ? (lang === 'fa' ? 'عملیات موفق' : 'Success') : (lang === 'fa' ? 'پیام سیستم' : 'System Alert')}
                            </h4>
                        </div>
                        
                        <p className="text-xs text-[#CCCCCC] leading-relaxed mb-5" dir="auto">
                            {toast.message}
                        </p>

                        <div className="flex justify-end w-full">
                            <button 
                                type="button"
                                onClick={() => setToast({ show: false, message: '', type: 'error' })} 
                                className="px-5 py-1.5 rounded-[4px] bg-[#2D2D2D] hover:bg-[#383838] text-xs font-semibold text-white border border-[#3E3E3E] transition-colors cursor-pointer shadow-sm"
                            >
                                {lang === 'fa' ? 'تایید' : 'Dismiss'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Command Deck: Title & API Key Configuration */}
            <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[4px] bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#107C41] shrink-0 shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
                            {t('vision_trade_engine') || 'Vision Trade Engine'}
                        </h1>
                        <p className="text-[11px] text-[#A19F9D] mt-0.5">
                            {t('vision_engine_desc') || 'Inspect chart setups via multimodal Gemini AI models and dispatch trades.'}
                        </p>
                    </div>
                </div>

                {/* API Key Box */}
                <div className="flex items-center gap-2 bg-[#18181B] border border-[#333333] focus-within:border-[#107C41] rounded-[4px] px-2.5 h-8 transition-colors max-w-sm w-full">
                    <svg className="w-3.5 h-3.5 text-[#797775] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    
                    <input 
                        type={showKey ? "text" : "password"} 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)}
                        onBlur={saveApiKey}
                        placeholder="Google Gemini API Key..."
                        dir="ltr"
                        className="w-full bg-transparent border-none outline-none text-xs font-mono text-white placeholder-[#52525B]"
                    />

                    <button 
                        type="button" 
                        onClick={() => setShowKey(!showKey)}
                        className="text-[#797775] hover:text-[#CCCCCC] text-[10px] font-mono px-1 shrink-0"
                    >
                        {showKey ? 'HIDE' : 'SHOW'}
                    </button>
                </div>
            </div>

            {/* Main Workstation Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: Image Input & Inspection Controls               */}
                {/* ------------------------------------------------------------- */}
                <div className="xl:col-span-5 flex flex-col gap-3.5">
                    
                    {/* Guidance InfoBar */}
                    <div className="bg-[#202023] border border-[#333333] rounded-[6px] p-3 flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-white">
                                {t('note_label') || 'Resolution Guidelines:'}
                            </span>
                            <p className="text-[11px] text-[#A19F9D] leading-relaxed mt-0.5" dir="auto">
                                {t('chart_tips') || 'Capture clean price bars with clear timestamp and price axis visible. Paste (Ctrl+V) directly.'}
                            </p>
                        </div>
                    </div>

                    {/* Chart Dropzone / Preview */}
                    {!imagePreview ? (
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[6px] transition-all cursor-pointer ${
                                isDragging 
                                    ? 'border-[#107C41] bg-[#107C41]/5' 
                                    : 'border-[#333333] hover:border-[#444444] bg-[#18181B]'
                            }`}
                        >
                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
                                <div className="w-10 h-10 rounded-[4px] bg-[#202023] border border-[#333333] flex items-center justify-center text-[#797775] mb-2.5 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-white">
                                    {t('drag_drop_text') || 'Drag and drop screenshot here'}
                                </p>
                                <p className="text-[11px] text-[#797775] mt-1 font-mono">
                                    {t('paste_screenshot') || 'or press Ctrl+V to paste buffer'}
                                </p>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
                            </label>
                        </div>
                    ) : (
                        <div className="relative w-full rounded-[6px] overflow-hidden border border-[#333333] bg-[#141416] group shadow-sm flex items-center justify-center min-h-[260px]">
                            <img src={imagePreview} alt="Chart inspection subject" className="w-full h-auto object-contain max-h-[380px]" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    type="button"
                                    onClick={() => { setImagePreview(null); setResult(null); setIsAnalyzing(false); }}
                                    className="bg-[#C42B1C] hover:bg-[#B32719] text-white px-4 py-1.5 rounded-[4px] text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                >
                                    {t('clear_image') || 'Remove Screenshot'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Execution Button */}
                    {isAnalyzing ? (
                        <button 
                            type="button"
                            onClick={cancelAnalysis}
                            className="w-full h-10 rounded-[4px] font-semibold text-xs flex items-center justify-center gap-2 bg-[#C42B1C] hover:bg-[#B32719] text-white border border-[#C42B1C] transition-colors cursor-pointer shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>{lang === 'fa' ? 'انصراف و لغو پردازش' : 'Halt Cognitive Analysis'}</span>
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={runAnalysis}
                            disabled={!imagePreview || !apiKey}
                            className={`w-full h-10 rounded-[4px] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                !imagePreview || !apiKey 
                                    ? 'bg-[#242424] text-[#797775] border border-[#333333] cursor-not-allowed' 
                                    : 'bg-[#107C41] hover:bg-[#0E6B37] text-white border border-[#107C41] cursor-pointer'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span>{t('run_deep_analysis') || 'Execute Deep Vision Inference'}</span>
                        </button>
                    )}
                    {!apiKey && (
                        <span className="text-[10px] font-mono text-[#F87171] text-center">
                            * Gemini API Key required to run vision model
                        </span>
                    )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: Inference Results & Execution Order Ticket     */}
                {/* ------------------------------------------------------------- */}
                <div className="xl:col-span-7 flex flex-col gap-3.5 h-full min-h-0">
                    {!result ? (
                        <div className="flex-1 flex flex-col items-center justify-center border border-[#333333] rounded-[6px] bg-[#242424] p-8 text-center min-h-[300px]">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 rounded-full border-2 border-[#107C41] border-t-transparent animate-spin mb-3" />
                                    <h3 className="text-sm font-semibold text-white tracking-tight">
                                        {t('analyzing_chart') || 'Analyzing Chart via Multimodal LLM...'}
                                    </h3>
                                    <p className="text-xs text-[#A19F9D] mt-1 font-mono">
                                        Extracting price action confluences, support/resistance & liquidity zones
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-[4px] bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#797775] mb-2.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white tracking-tight">
                                        {t('awaiting_chart') || 'Awaiting Chart Input'}
                                    </h3>
                                    <p className="text-xs text-[#A19F9D] mt-1 max-w-sm leading-relaxed">
                                        {t('awaiting_chart_desc') || 'Upload or paste an image to extract actionable signals, structural zones, and risk boundaries.'}
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Panel 1: Structured Telemetry Results */}
                            <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-4 flex flex-col gap-3.5 shadow-sm overflow-hidden">
                                
                                {/* Metrics Strip */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2.5 flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-mono text-[#797775] uppercase tracking-wider mb-1">
                                            {t('trade_bias') || 'Trade Bias'}
                                        </span>
                                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-[2px] border ${getBiasBadge(result.trade_bias)}`}>
                                            {result.trade_bias || 'NEUTRAL'}
                                        </span>
                                    </div>

                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2.5 flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-mono text-[#797775] uppercase tracking-wider mb-1">
                                            {t('market_state') || 'Structure'}
                                        </span>
                                        <span className={`text-xs font-mono font-bold truncate max-w-full px-1 ${
                                            result.market_state?.includes('ERROR') ? 'text-[#F87171]' : 'text-[#60A5FA]'
                                        }`}>
                                            {result.market_state?.replace(/_/g, ' ') || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2.5 flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-mono text-[#797775] uppercase tracking-wider mb-1">
                                            {t('ai_confidence') || 'Confidence'}
                                        </span>
                                        <span className={`text-xs font-mono font-bold ${
                                            result.confidence_score >= 70 ? 'text-[#34D399]' : result.confidence_score >= 50 ? 'text-[#FCE100]' : 'text-[#F87171]'
                                        }`}>
                                            {result.confidence_score}%
                                        </span>
                                    </div>
                                </div>

                                {/* Order Quotation Level Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2">
                                        <span className="text-[9px] font-mono text-[#797775] uppercase block mb-0.5">
                                            {t('entry_zone') || 'Entry Zone'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-white truncate block" dir="ltr">
                                            {result.entry_zone || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2">
                                        <span className="text-[9px] font-mono text-[#F87171] uppercase block mb-0.5">
                                            {t('stop_loss') || 'Stop Loss'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-[#F87171] truncate block" dir="ltr">
                                            {result.stop_loss || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2">
                                        <span className="text-[9px] font-mono text-[#34D399] uppercase block mb-0.5">
                                            {t('take_profit_1') || 'Take Profit 1'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-[#34D399] truncate block" dir="ltr">
                                            {result.take_profit_1 || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2">
                                        <span className="text-[9px] font-mono text-[#34D399] uppercase block mb-0.5">
                                            {t('take_profit_2') || 'Take Profit 2'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-[#34D399] truncate block" dir="ltr">
                                            {result.take_profit_2 || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Reasoning Sections */}
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2.5">
                                        <span className="text-[10px] font-mono font-semibold uppercase text-[#60A5FA] block mb-1">
                                            {t('price_action_logic') || 'Price Action Assessment'}
                                        </span>
                                        <p className="text-xs text-[#CCCCCC] leading-relaxed" dir="auto">
                                            {result.price_action_analysis}
                                        </p>
                                    </div>

                                    {result.indicators_analysis && (
                                        <div className="bg-[#18181B] border border-[#333333] rounded-[4px] p-2.5">
                                            <span className="text-[10px] font-mono font-semibold uppercase text-[#34D399] block mb-1">
                                                {t('indicators_confluence') || 'Technical Confluence'}
                                            </span>
                                            <p className="text-xs text-[#CCCCCC] leading-relaxed" dir="auto">
                                                {result.indicators_analysis}
                                            </p>
                                        </div>
                                    )}

                                    {result.risk_note && result.risk_note !== "N/A" && (
                                        <div className="p-2.5 rounded-[4px] bg-[#FCE100]/10 border border-[#FCE100]/30 text-[11px] text-[#FCE100] leading-relaxed flex items-start gap-2" dir="auto">
                                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span><strong>{t('risk_warning') || 'Notice:'}</strong> {result.risk_note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Panel 2: MT5 Trade Execution Order Ticket */}
                            <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-4 flex flex-col gap-3 shadow-sm">
                                
                                {/* Microsoft Disclaimer Callout */}
                                <div className="p-2.5 rounded-[4px] bg-[#C42B1C]/10 border border-[#C42B1C]/30 text-[11px] text-[#F87171] leading-relaxed flex items-start gap-2">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p dir="auto">
                                        <strong>{lang === 'fa' ? 'سلب مسئولیت:' : 'Important Risk Notice:'}</strong>{' '}
                                        {lang === 'fa' 
                                            ? 'بازارهای مالی با ریسک همراه هستند. هوش مصنوعی صرفاً نقش دستیار را دارد و مسئولیتی متوجه آن نیست.' 
                                            : 'Financial trading incurs risk of loss. Verify all order parameters before dispatching to MT5.'}
                                    </p>
                                </div>

                                {/* Inputs Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                    
                                    {/* Symbol Field */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-semibold uppercase text-[#A19F9D]">
                                            {t('symbol_label') || 'Symbol'}
                                        </label>
                                        <input 
                                            type="text" 
                                            value={symbol} 
                                            onChange={(e) => setSymbol(e.target.value)}
                                            dir="ltr"
                                            className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs font-mono font-bold text-white uppercase outline-none"
                                            placeholder="XAUUSD"
                                        />
                                    </div>

                                    {/* Risk Mode Field */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-semibold uppercase text-[#A19F9D]">
                                            {t('risk_mode') || 'Risk Type'}
                                        </label>
                                        <div className="h-8">
                                            <FluentCustomSelect 
                                                value={riskMode}
                                                options={riskModeOptions}
                                                onChange={setRiskMode}
                                            />
                                        </div>
                                    </div>

                                    {/* Risk Value Field */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-semibold uppercase text-[#A19F9D]">
                                            {t('risk_value') || 'Risk Metric'}
                                        </label>
                                        <div className="h-8 bg-[#18181B] border border-[#333333] focus-within:border-[#107C41] rounded-[4px] px-2.5 flex items-center justify-between">
                                            <input 
                                                type="number"
                                                step="any"
                                                value={riskValue} 
                                                onChange={(e) => setRiskValue(e.target.value)}
                                                dir="ltr"
                                                className="w-full bg-transparent border-none outline-none text-xs font-mono font-bold text-[#34D399]"
                                                placeholder="1.0"
                                            />
                                            <span className="text-[10px] font-mono text-[#797775] ml-1 shrink-0">
                                                {riskMode === 'percentage' ? '%' : riskMode === 'fixed_lot' ? 'LOT' : 'USD'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deploy Action */}
                                    <div className="flex flex-col justify-end">
                                        <button 
                                            type="button"
                                            onClick={handleDeployToMT5}
                                            disabled={!isTradeable || isDeploying}
                                            className={`w-full h-8 rounded-[4px] font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                                !isTradeable 
                                                    ? 'bg-[#18181B] text-[#52525B] border border-[#333333] cursor-not-allowed' 
                                                    : isDeploying 
                                                    ? 'bg-[#107C41] text-white cursor-wait opacity-80' 
                                                    : 'bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white border border-[#107C41] cursor-pointer'
                                            }`}
                                        >
                                            {isDeploying ? (
                                                <>
                                                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>{t('executing') || 'Dispatching...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span className="uppercase">{t('deploy_mt5') || 'Deploy MT5'}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ChartAnalyzer;