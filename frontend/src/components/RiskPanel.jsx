import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Isolated Fluent Tooltip Component
 * Displays contextual helper descriptions without breaking overflow bounds.
 */
const InfoTooltip = ({ text }) => {
    if (!text) return null;
    return (
        <div className="info-tooltip relative flex items-center cursor-help shrink-0" tabIndex="0" title={text} aria-label={text}>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-3.5 h-3.5 text-[#797775] transition-colors"
            >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <div role="tooltip" className="info-tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 text-[11px] leading-relaxed rounded-[4px] text-center z-50">
                {text}
                <div className="info-tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" />
            </div>
        </div>
    );
};

/**
 * WinUI 3 Style Toggle Switch Component
 */
const FluentToggle = ({ checked, onChange, disabled = false, isRtl = false }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none ${
                checked 
                    ? 'bg-[#107C41] border-[#107C41]' 
                    : 'bg-[#1F1F1F] border-[#3E3E3E] hover:border-[#525252]'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out my-auto ml-[2px] ${
                    checked 
                        ? (isRtl ? '-translate-x-4' : 'translate-x-4') 
                        : 'translate-x-0'
                }`}
            />
        </button>
    );
};

const RiskPanel = ({ initialData, nextNews }) => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessBadge, setShowSuccessBadge] = useState(false);
    
    // System & Broker States
    const [marginEnabled, setMarginEnabled] = useState(false);
    const [marginLimit, setMarginLimit] = useState('50');
    
    const [wuEnabled, setWuEnabled] = useState(true);
    const [wuCandles, setWuCandles] = useState('500');

    const [nfEnabled, setNfEnabled] = useState(false);
    const [nfEur, setNfEur] = useState(true);
    const [nfUsd, setNfUsd] = useState(true);
    const [nfBefore, setNfBefore] = useState('30');
    const [nfAfter, setNfAfter] = useState('30');

    // Global Risk Protections States
    const [beEnabled, setBeEnabled] = useState(false);
    const [beTrigger, setBeTrigger] = useState('1.0');
    
    const [pcEnabled, setPcEnabled] = useState(false);
    const [pcVolume, setPcVolume] = useState('50');
    const [pcTrigger, setPcTrigger] = useState('2.0');

    const [tlEnabled, setTlEnabled] = useState(false);
    const [tlTrigger, setTlTrigger] = useState('10200.0');

    useEffect(() => {
        if (!initialData) return;

        setMarginEnabled(initialData.margin_enabled ?? false);
        setMarginLimit(String(initialData.margin_limit ?? '50'));

        setWuEnabled(initialData.wu_enabled ?? true);
        setWuCandles(String(initialData.wu_candles ?? '500'));

        setNfEnabled(initialData.nf_enabled ?? false);
        setNfEur(initialData.nf_eur ?? true);
        setNfUsd(initialData.nf_usd ?? true);
        setNfBefore(String(initialData.nf_before ?? '30'));
        setNfAfter(String(initialData.nf_after ?? '30'));

        setBeEnabled(initialData.be_enabled ?? false);
        setBeTrigger(String(initialData.be_trigger ?? '1.0'));

        setPcEnabled(initialData.pc_enabled ?? false);
        setPcVolume(String(initialData.pc_volume ?? '50'));
        setPcTrigger(String(initialData.pc_trigger ?? '2.0'));

        setTlEnabled(initialData.tl_enabled ?? false);
        setTlTrigger(String(initialData.tl_trigger ?? '10200.0'));
    }, [initialData]);
    // Persist configuration to backend
    const handleSave = async () => {
        setIsSaving(true);
        setShowSuccessBadge(false);

        const config = {
            mt5_path: initialData?.mt5_path || "",
            margin_enabled: marginEnabled,
            margin_limit: marginLimit,
            wu_enabled: wuEnabled,
            wu_candles: wuCandles,
            nf_enabled: nfEnabled,
            nf_eur: nfEur,
            nf_usd: nfUsd,
            nf_before: nfBefore,
            nf_after: nfAfter,
            be_enabled: beEnabled,
            be_trigger: beTrigger,
            pc_enabled: pcEnabled,
            pc_volume: pcVolume,
            pc_trigger: pcTrigger,
            tl_enabled: tlEnabled,
            tl_trigger: tlTrigger
        };
        
        if (window.eel) {
            try {
                await window.eel.save_user_config(config)();
            } catch (err) {
                console.error("Failed to save risk configuration via Eel:", err);
            }
        }

        setTimeout(() => {
            setIsSaving(false);
            setShowSuccessBadge(true);
            setTimeout(() => setShowSuccessBadge(false), 2500);
        }, 600);
    };

    return (
        <div 
            className="font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] h-full flex flex-col justify-between select-none"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Scrollable Form Content */}
            <div className="space-y-6">
                
                {/* SECTION 1: System & Broker Settings */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-[4px] bg-[#107C41]/15 text-[#107C41] flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                                {t('system_broker_settings') || 'System & Broker Settings'}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        
                        {/* 1. Margin Usage Limit */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            marginEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <FluentToggle 
                                        checked={marginEnabled} 
                                        onChange={setMarginEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`text-xs font-semibold tracking-tight truncate ${
                                            marginEnabled ? 'text-white' : 'text-[#797775]'
                                        }`}>
                                            {t('margin_usage') || 'Margin Usage Threshold'}
                                        </span>
                                        <InfoTooltip text={t('margin_usage_desc')} />
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1.5 transition-opacity ${
                                    marginEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                                }`}>
                                    <div className="h-7 w-24 flex items-center bg-[#18181B] rounded-[4px] border border-[#333333] px-2" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={marginLimit} 
                                            onChange={(e) => setMarginLimit(e.target.value)} 
                                            className="w-full bg-transparent border-none outline-none text-xs font-mono text-white text-right" 
                                        />
                                        <span className="text-[10px] font-mono text-[#797775] ml-1.5">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Warm-Up System */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            wuEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <FluentToggle 
                                        checked={wuEnabled} 
                                        onChange={setWuEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`text-xs font-semibold tracking-tight truncate ${
                                            wuEnabled ? 'text-white' : 'text-[#797775]'
                                        }`}>
                                            {t('warmup_system') || 'Warm-Up Data Buffer'}
                                        </span>
                                        <InfoTooltip text={t('warmup_desc')} />
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1.5 transition-opacity ${
                                    wuEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                                }`}>
                                    <div className="h-7 w-24 flex items-center bg-[#18181B] rounded-[4px] border border-[#333333] px-2" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={wuCandles} 
                                            onChange={(e) => setWuCandles(e.target.value)} 
                                            className="w-full bg-transparent border-none outline-none text-xs font-mono text-white text-right" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Smart News Filter */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            nfEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <FluentToggle 
                                        checked={nfEnabled} 
                                        onChange={setNfEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-semibold tracking-tight ${
                                            nfEnabled ? 'text-[#F87171]' : 'text-[#797775]'
                                        }`}>
                                            {t('news_filter') || 'High-Impact News Filter'}
                                        </span>
                                        <InfoTooltip text={t('news_filter_desc')} />
                                    </div>
                                </div>

                            </div>

                            {/* Sub-Parameters for News Protection */}
                            <div className={`space-y-3 pt-1 transition-opacity ${
                                nfEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setNfEur(!nfEur)}
                                        className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold border transition-all ${
                                            nfEur 
                                                ? 'bg-[#107C41]/20 border-[#107C41] text-[#34D399]' 
                                                : 'bg-[#18181B] border-[#333333] text-[#797775]'
                                        }`}
                                    >
                                        EUR
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setNfUsd(!nfUsd)}
                                        className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold border transition-all ${
                                            nfUsd 
                                                ? 'bg-[#107C41]/20 border-[#107C41] text-[#34D399]' 
                                                : 'bg-[#18181B] border-[#333333] text-[#797775]'
                                        }`}
                                    >
                                        USD
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div className="flex items-center justify-between bg-[#18181B] border border-[#333333] rounded-[4px] px-2.5 h-7">
                                        <span className="text-[10px] font-mono text-[#797775] uppercase">
                                            {t('mins_before') || 'Before Event'}
                                        </span>
                                        <div className="flex items-center gap-1" dir="ltr">
                                            <input 
                                                type="number" 
                                                value={nfBefore} 
                                                onChange={(e) => setNfBefore(e.target.value)} 
                                                className="w-12 bg-transparent text-right outline-none text-xs font-mono text-white" 
                                            />
                                            <span className="text-[9px] font-mono text-[#797775]">M</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-[#18181B] border border-[#333333] rounded-[4px] px-2.5 h-7">
                                        <span className="text-[10px] font-mono text-[#797775] uppercase">
                                            {t('mins_after') || 'After Event'}
                                        </span>
                                        <div className="flex items-center gap-1" dir="ltr">
                                            <input 
                                                type="number" 
                                                value={nfAfter} 
                                                onChange={(e) => setNfAfter(e.target.value)} 
                                                className="w-12 bg-transparent text-right outline-none text-xs font-mono text-white" 
                                            />
                                            <span className="text-[9px] font-mono text-[#797775]">M</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Upcoming News Callout Banner */}
                                {nextNews && (
                                    <div className="p-2.5 rounded-[4px] bg-[#A80000]/10 border border-[#A80000]/30 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#E81123] animate-ping shrink-0" />
                                            <span className="text-[11px] font-mono text-[#F3F2F1] truncate">
                                                <strong className="text-white">[{nextNews.currency}]</strong> {nextNews.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono font-semibold text-[#F87171] shrink-0">
                                            {nextNews.countdown}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECTION 2: Global Risk Protections */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-[4px] bg-[#107C41]/15 text-[#107C41] flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                                {t('global_risk_protections') || 'Global Risk Management'}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        
                        {/* 4. Auto Breakeven */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            beEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <FluentToggle 
                                        checked={beEnabled} 
                                        onChange={setBeEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <span className={`text-xs font-semibold tracking-tight truncate ${
                                        beEnabled ? 'text-white' : 'text-[#797775]'
                                    }`}>
                                        {t('auto_breakeven') || 'Auto Breakeven (BE)'}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-1.5 transition-opacity ${
                                    beEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                                }`}>
                                    <div className="h-7 w-24 flex items-center bg-[#18181B] rounded-[4px] border border-[#333333] px-2" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={beTrigger} 
                                            onChange={(e) => setBeTrigger(e.target.value)} 
                                            className="w-full bg-transparent border-none outline-none text-xs font-mono text-white text-right" 
                                        />
                                        <span className="text-[10px] font-mono text-[#797775] ml-1.5">R</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Partial Close */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            pcEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <FluentToggle 
                                        checked={pcEnabled} 
                                        onChange={setPcEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <span className={`text-xs font-semibold tracking-tight truncate ${
                                        pcEnabled ? 'text-white' : 'text-[#797775]'
                                    }`}>
                                        {t('partial_close') || 'Partial Scale-Out'}
                                    </span>
                                </div>
                            </div>

                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity ${
                                pcEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                            }`}>
                                <div className="flex items-center justify-between bg-[#18181B] border border-[#333333] rounded-[4px] px-2.5 h-7">
                                    <span className="text-[10px] font-mono text-[#797775] uppercase">
                                        {t('vol') || 'Volume'}
                                    </span>
                                    <div className="flex items-center gap-1" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={pcVolume} 
                                            onChange={(e) => setPcVolume(e.target.value)} 
                                            className="w-12 bg-transparent text-right outline-none text-xs font-mono text-white" 
                                        />
                                        <span className="text-[9px] font-mono text-[#797775]">%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-[#18181B] border border-[#333333] rounded-[4px] px-2.5 h-7">
                                    <span className="text-[10px] font-mono text-[#797775] uppercase">
                                        {t('at') || 'Trigger'}
                                    </span>
                                    <div className="flex items-center gap-1" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={pcTrigger} 
                                            onChange={(e) => setPcTrigger(e.target.value)} 
                                            className="w-12 bg-transparent text-right outline-none text-xs font-mono text-white" 
                                        />
                                        <span className="text-[9px] font-mono text-[#797775]">R</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Daily Target Lock */}
                        <div className={`p-3.5 rounded-[6px] border transition-all duration-150 ${
                            tlEnabled ? 'bg-[#202023] border-[#3E3E3E]' : 'bg-[#1C1C1E] border-[#2D2D30]'
                        }`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <FluentToggle 
                                        checked={tlEnabled} 
                                        onChange={setTlEnabled} 
                                        isRtl={isRtl} 
                                    />
                                    <span className={`text-xs font-semibold tracking-tight truncate ${
                                        tlEnabled ? 'text-white' : 'text-[#797775]'
                                    }`}>
                                        {t('target_lock') || 'Daily Profit Target Lock'}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-1.5 transition-opacity ${
                                    tlEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                                }`}>
                                    <div className="h-7 w-28 flex items-center bg-[#18181B] rounded-[4px] border border-[#333333] px-2" dir="ltr">
                                        <input 
                                            type="number" 
                                            value={tlTrigger} 
                                            onChange={(e) => setTlTrigger(e.target.value)} 
                                            className="w-full bg-transparent border-none outline-none text-xs font-mono text-white text-right" 
                                        />
                                        <span className="text-[10px] font-mono text-[#107C41] font-semibold ml-1.5">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Bottom Sticky Action Deck */}
            <div className="pt-4 mt-6 border-t border-[#333333] flex items-center justify-between gap-3">
                {showSuccessBadge ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#34D399] font-medium animate-fade-in">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{lang === 'fa' ? 'تنظیمات ذخیره شد' : 'Configuration synchronized'}</span>
                    </div>
                ) : null}

                <button 
                    type="button"
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="h-9 px-6 bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white text-xs font-semibold rounded-[4px] border border-[#107C41] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>{lang === 'fa' ? 'در حال ثبت...' : 'Saving...'}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>{t('save_config') || 'Save Risk Parameters'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RiskPanel;