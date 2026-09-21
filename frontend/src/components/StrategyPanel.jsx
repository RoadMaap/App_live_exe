import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * CustomSelect Component
 * Implements Microsoft Fluent 2 ComboBox pattern.
 */
const CustomSelect = ({ label, value, options, onChange, prefixIcon }) => {
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
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] mb-1.5 block">
                    {label}
                </label>
            )}
            
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-8 flex items-center justify-between bg-[#18181B] border rounded-[4px] px-2.5 text-xs text-[#E1DFDD] font-mono transition-all outline-none cursor-pointer ${
                    isOpen 
                        ? 'border-[#107C41] bg-[#1F1F22]' 
                        : 'border-[#333333] hover:border-[#444444] hover:bg-[#1C1C1F]'
                }`}
            >
                <span className="flex items-center gap-2 truncate" dir="ltr">
                    {prefixIcon && <span className="text-[#107C41]">{prefixIcon}</span>}
                    <span className="truncate">{selectedLabel}</span>
                </span>
                
                <svg 
                    className={`w-3.5 h-3.5 text-[#797775] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#107C41]' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Fluent Flyout Menu */}
            <div className={`absolute left-0 top-full mt-1 w-full bg-[#242424] border border-[#3E3E3E] rounded-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden z-50 transition-all duration-150 origin-top ${
                isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
            }`}>
                <div className="max-h-48 overflow-y-auto py-1">
                    {(options || []).map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                            <div 
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                                    isSelected 
                                        ? 'bg-[#107C41]/15 text-[#34D399] font-semibold' 
                                        : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
                                }`}
                                dir="ltr"
                            >
                                <span className="truncate">{opt.label}</span>
                                {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#107C41]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/**
 * StrategyPanel Component
 * Main strategy manager engineered with WinUI 3 workstation patterns.
 */
const StrategyPanel = ({ strategies, onStrategiesChange, onUpdateConfig }) => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    const [isLoading, setIsLoading] = useState(false);
    const [expandedStrategies, setExpandedStrategies] = useState([]);

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const dayLabels = [
        t('day_mon') || 'Mon', 
        t('day_tue') || 'Tue', 
        t('day_wed') || 'Wed', 
        t('day_thu') || 'Thu', 
        t('day_fri') || 'Fri', 
        t('day_sat') || 'Sat', 
        t('day_sun') || 'Sun'
    ];

    const timeframeToSeconds = {
        'M1': 60, 'M5': 300, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H4': 14400, 'D1': 86400,
    };
    
    const validSecondsList = [60, 300, 900, 1800, 3600, 14400, 86400];

    const blacklistParams = [
        'allowed_days', 'allowdays', 'allow_days', 'alloweddays', 'allowed_day',
        'killzones', 'killzone', 'kill_zones', 'kill_zone', 'kill_zones_list',
        'allow_day', 'kill_zone_list'
    ];

    const toggleExpand = (name) => {
        setExpandedStrategies(prev => 
            (prev || []).includes(name) ? prev.filter(n => n !== name) : [...(prev || []), name]
        );
    };

    const handleImport = async () => {
        setIsLoading(true);
        if (window.eel) {
            try {
                const path = await window.eel.open_strategy_file_dialog()();
                if (path) {
                    const res = await window.eel.load_custom_strategy(path)();
                    if (res?.success && res?.strategies) {
                        onStrategiesChange(res.strategies);
                    }
                }
            } catch (err) {
                console.error("Strategy Import Error:", err);
            }
        }
        setIsLoading(false);
    };

    const handleDelete = async (name, e) => {
        e.stopPropagation();
        if (window.eel) {
            try {
                const newStrategies = await window.eel.remove_strategy(name)();
                if (newStrategies) onStrategiesChange(newStrategies);
            } catch (err) {
                console.error("Strategy Deletion Error:", err);
            }
        }
    };

    // Parameter Update Handlers
    const saveParamToBackend = (strategyName, paramKey, value) => {
        if (window.eel) window.eel.update_strategy_param(strategyName, paramKey, value)();
    };

    const handleParamChange = (strategyName, paramKey, newValue) => {
        onStrategiesChange(prevStrategies => ({
            ...prevStrategies,
            [strategyName]: {
                ...(prevStrategies?.[strategyName] || {}),
                params: {
                    ...(prevStrategies?.[strategyName]?.params || {}),
                    [paramKey]: newValue
                }
            }
        }));
    };

    const handleParamBlur = (strategyName, paramKey, currentValue, originalType) => {
        let finalValue = currentValue;
        const strVal = String(currentValue).trim();
        
        if (strVal === '') {
            finalValue = originalType === 'number' ? 1 : '1';
        } else if (originalType === 'number') {
            const parsed = parseFloat(strVal);
            if (isNaN(parsed) || parsed === 0) {
                finalValue = 1;
            } else {
                finalValue = parsed;
            }
        } else if (strVal === '0') {
            finalValue = '1';
        }

        onStrategiesChange(prevStrategies => ({
            ...prevStrategies,
            [strategyName]: {
                ...(prevStrategies?.[strategyName] || {}),
                params: {
                    ...(prevStrategies?.[strategyName]?.params || {}),
                    [paramKey]: finalValue
                }
            }
        }));

        saveParamToBackend(strategyName, paramKey, finalValue);
    };

    // Configuration Update Handlers
    const handleConfigChangeLocal = (strategyName, configKey, value) => {
        onStrategiesChange(prevStrategies => ({
            ...prevStrategies,
            [strategyName]: {
                ...(prevStrategies?.[strategyName] || {}),
                config: {
                    ...(prevStrategies?.[strategyName]?.config || {}),
                    [configKey]: value
                }
            }
        }));
    };

    const handleConfigChange = (strategyName, configKey, value) => {
        const currentConfig = strategies?.[strategyName]?.config || {};
        const newConfig = { ...currentConfig, [configKey]: value };
        onUpdateConfig(strategyName, newConfig);
    };

    const handleConfigBlur = (strategyName, configKey, value) => {
        handleConfigChange(strategyName, configKey, value);
    };

    const handleSecondsBlur = (strategyName, inputValue) => {
        const currentConfig = strategies?.[strategyName]?.config || {};
        const minAllowed = timeframeToSeconds[currentConfig?.timeframe] || 300;
        
        let val = parseInt(inputValue);
        if (isNaN(val)) val = minAllowed;

        if (val < minAllowed) {
            val = minAllowed;
        } else {
            const allowedOptions = validSecondsList.filter(s => s >= minAllowed);
            const closest = allowedOptions.reduce((prev, curr) => {
                return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
            });
            val = closest;
        }
        handleConfigChange(strategyName, 'TIMEFRAME_SECONDS', val);
    };

    const toggleDay = (strategyName, dayIndex) => {
        const currentConfig = strategies?.[strategyName]?.config || {};
        const currentDays = currentConfig?.allowed_days || [];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }
        handleConfigChange(strategyName, 'allowed_days', newDays);
    };

    const addKillzone = (strategyName, currentZones) => {
        const newZones = [...(currentZones || []), ""]; 
        handleConfigChange(strategyName, 'killzones', newZones);
    };

    const removeKillzone = (strategyName, currentZones, index) => {
        const newZones = (currentZones || []).filter((_, i) => i !== index);
        handleConfigChange(strategyName, 'killzones', newZones);
    };

    const updateKillzoneTime = (strategyName, currentZones, index, type, value) => {
        if (!/^[0-9:]*$/.test(value)) return;
        if (value.length > 5) return;
        const newZones = [...(currentZones || [])];
        const currentString = newZones[index] || "-";
        let [start, end] = currentString.includes('-') ? currentString.split('-') : ["", ""];
        if (type === 'start') newZones[index] = `${value}-${end}`;
        else newZones[index] = `${start}-${value}`;
        
        handleConfigChangeLocal(strategyName, 'killzones', newZones);
    };

    const handleTimeBlur = (strategyName, currentZones, index, type, value) => {
        if (!value) return;
        let formatted = value;
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length > 0 && digits.length <= 2) {
            let hour = parseInt(digits);
            if (hour > 23) hour = 23;
            formatted = `${hour.toString().padStart(2, '0')}:00`;
        } else if (digits.length === 3 || digits.length === 4) {
             let padded = digits.padStart(4, '0');
             let hh = padded.slice(0, 2);
             let mm = padded.slice(2);
             if (parseInt(hh) > 23) hh = '23';
             if (parseInt(mm) > 59) mm = '59';
             formatted = `${hh}:${mm}`;
        }
        
        const newZones = [...(currentZones || [])];
        const currentString = newZones[index] || "-";
        let [start, end] = currentString.includes('-') ? currentString.split('-') : ["", ""];
        
        if (type === 'start') newZones[index] = `${formatted}-${end}`;
        else newZones[index] = `${start}-${formatted}`;
        
        handleConfigChange(strategyName, 'killzones', newZones);
    };

    const strategyList = Object.entries(strategies || {});

    const timeframeOptions = [
        { label: t('timeframe_m1') || 'M1 - 1 Minute', value: 'M1' },
        { label: t('timeframe_m5') || 'M5 - 5 Minutes', value: 'M5' },
        { label: t('timeframe_m15') || 'M15 - 15 Minutes', value: 'M15' },
        { label: t('timeframe_h1') || 'H1 - 1 Hour', value: 'H1' },
        { label: t('timeframe_h4') || 'H4 - 4 Hours', value: 'H4' },
        { label: t('timeframe_d1') || 'D1 - 1 Day', value: 'D1' },
        { label: t('timeframe_w1') || 'W1 - 1 Week', value: 'W1' },
    ];

    const candleOptions = [
        { label: t('candle_standard') || 'Standard Candlesticks', value: 'STANDARD' },
        { label: t('candle_heikin') || 'Heikin Ashi', value: 'HEIKIN_ASHI' },
    ];

    const riskModeOptions = [
        { label: t('risk_fixed_usd') || 'Fixed Balance ($)', value: 'fixed_usd' },
        { label: t('risk_fixed_lot') || 'Fixed Volume (Lot)', value: 'fixed_lot' },
        { label: t('risk_percent') || 'Account Percentage (%)', value: 'percentage' },
    ];

    return (
        <div 
            className="h-full flex flex-col gap-4 font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] select-none"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Header Command Bar */}
            <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-4 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1F1F1F] border border-[#333333] rounded-[4px] flex items-center justify-center text-[#107C41] shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-white font-semibold text-sm tracking-tight leading-tight">
                            {t('strategy_management') || 'Strategy Manager'}
                        </h1>
                        <p className="text-[11px] text-[#A19F9D] mt-0.5">
                            {t('strategy_config_subtitle') || 'Configure quantitative algorithmic rules and risk constraints.'}
                        </p>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={handleImport} 
                    disabled={isLoading} 
                    className="h-8 px-4 bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white rounded-[4px] text-xs font-semibold border border-[#107C41] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    )}
                    <span>{t('import_strategy') || 'Import Strategy'}</span>
                </button>
            </div>

            {/* Strategy List Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
                {strategyList.length === 0 ? (
                    <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                        <div className="w-12 h-12 bg-[#1F1F1F] border border-[#333333] rounded-[4px] flex items-center justify-center mb-3 text-[#797775]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-white tracking-tight">
                            {t('no_strategies_found') || 'No Strategies Active'}
                        </p>
                        <p className="text-xs text-[#A19F9D] mt-1 max-w-sm">
                            {t('no_strategies_desc') || 'Click "Import Strategy" above to load python strategy packages into the execution environment.'}
                        </p>
                    </div>
                ) : (
                    strategyList.map(([name, data]) => {
                        if (!data) return null;
                        
                        const isExpanded = (expandedStrategies || []).includes(name);
                        const config = data?.config || {};
                        const killzones = config?.killzones || [];

                        const filteredParams = Object.entries(data?.params || {}).filter(([key]) => {
                            const normalizedKey = String(key).trim().toLowerCase();
                            return !blacklistParams.includes(normalizedKey);
                        });

                        return (
                            <div 
                                key={name} 
                                className={`rounded-[6px] border transition-all duration-200 overflow-hidden ${
                                    isExpanded 
                                        ? 'bg-[#242424] border-[#3E3E3E] shadow-sm' 
                                        : 'bg-[#202023] border-[#2D2D30] hover:border-[#38383B]'
                                }`}
                            >
                                {/* Strategy Card Header */}
                                <div 
                                    onClick={() => toggleExpand(name)} 
                                    className="p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors border ${
                                            isExpanded 
                                                ? 'bg-[#107C41] text-white border-[#107C41]' 
                                                : 'bg-[#18181B] text-[#A19F9D] border-[#333333]'
                                        }`}>
                                            {String(name).slice(0, 2).toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                                                    {name}
                                                </h4>
                                                {config?.symbol && (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#18181B] border border-[#333333] text-[#CCCCCC]">
                                                        {config.symbol}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0078D4]/10 border border-[#0078D4]/30 text-[#60A5FA]">
                                                    {config?.timeframe || 'M5'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#797775]">
                                                <span>MAGIC: <strong className="text-[#CCCCCC]">{config?.magic_number ?? '0'}</strong></span>
                                                <span>•</span>
                                                <span>PARAMS: <strong className="text-[#CCCCCC]">{filteredParams.length}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button 
                                            type="button"
                                            onClick={(e) => handleDelete(name, e)} 
                                            className="p-1.5 rounded-[4px] text-[#797775] hover:text-[#F87171] hover:bg-red-500/10 transition-colors"
                                            title="Remove Strategy"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>

                                        <div className={`p-1.5 text-[#A19F9D] transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#107C41]' : ''}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Body */}
                                <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                }`}>
                                    <div className="overflow-hidden">
                                        <div className="p-4 border-t border-[#2D2D30] bg-[#1C1C1E] space-y-5">
                                            
                                            {/* 1. Algorithm Parameters */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4]" />
                                                    <h5 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                                        {t('algorithm_parameters') || 'Algorithm Parameters'}
                                                    </h5>
                                                </div>

                                                {filteredParams.length === 0 ? (
                                                    <div className="text-center text-[#52525B] py-3 text-xs italic bg-[#18181B] rounded-[4px] border border-[#2D2D30]">
                                                        No dynamic parameters exposed by this strategy class.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                                        {filteredParams.map(([key, val]) => {
                                                            const isInvalid = val === "" || val === undefined || val === null || val === 0 || val === "0" || (String(val).trim() !== "" && parseFloat(val) === 0);
                                                            
                                                            return (
                                                                <div 
                                                                    key={key} 
                                                                    className={`bg-[#18181B] p-2.5 rounded-[4px] border transition-colors ${
                                                                        isInvalid 
                                                                            ? 'border-[#C42B1C]/60 bg-[#C42B1C]/5' 
                                                                            : 'border-[#333333] focus-within:border-[#0078D4]'
                                                                    }`}
                                                                >
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <label className={`text-[9px] font-mono uppercase truncate ${
                                                                            isInvalid ? 'text-[#F87171] font-semibold' : 'text-[#797775]'
                                                                        }`} title={key}>
                                                                            {key}
                                                                        </label>
                                                                        {isInvalid && (
                                                                            <span className="text-[8px] font-mono px-1 rounded bg-red-500/20 text-[#F87171]">
                                                                                {t('invalid') || 'INVALID'}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <input 
                                                                        type="text" 
                                                                        value={val !== undefined && val !== null ? val : ''}
                                                                        onChange={(e) => handleParamChange(name, key, e.target.value)}
                                                                        onBlur={(e) => handleParamBlur(name, key, e.target.value, typeof val)}
                                                                        dir="ltr"
                                                                        className={`w-full bg-transparent border-none outline-none text-xs font-mono font-semibold ${
                                                                            isInvalid ? 'text-[#F87171]' : 'text-white'
                                                                        }`}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Market Execution Parameters */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#107C41]" />
                                                    <h5 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                                        {t('market_configuration') || 'Market Configuration'}
                                                    </h5>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                                    {/* Symbol */}
                                                    <div>
                                                        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] mb-1.5 block">
                                                            {t('symbol_label') || "SYMBOL"}
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={config?.symbol || ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'symbol', e.target.value)} 
                                                            onBlur={(e) => handleConfigBlur(name, 'symbol', e.target.value)}
                                                            dir="ltr" 
                                                            className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs text-white font-mono uppercase focus:outline-none transition-colors" 
                                                        />
                                                    </div>
                                                    
                                                    {/* Leverage */}
                                                    <div>
                                                        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] mb-1.5 block">
                                                            {t('strategy_leverage') || "LEVERAGE"}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            placeholder={t('leverage_auto') || "Auto (Broker Default)"} 
                                                            value={config?.leverage !== undefined ? config.leverage : ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'leverage', e.target.value)} 
                                                            onBlur={(e) => handleConfigBlur(name, 'leverage', e.target.value ? parseInt(e.target.value) : '')} 
                                                            dir="ltr" 
                                                            className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs text-[#60A5FA] font-mono placeholder-[#52525B] focus:outline-none transition-colors" 
                                                        />
                                                    </div>

                                                    {/* Timeframe */}
                                                    <CustomSelect 
                                                        label={t('timeframe_label') || "TIMEFRAME"}
                                                        value={config?.timeframe || 'M5'}
                                                        options={timeframeOptions}
                                                        onChange={(val) => {
                                                            const seconds = timeframeToSeconds[val] || 300;
                                                            const newConfig = {
                                                                ...config,
                                                                timeframe: val,
                                                                TIMEFRAME_SECONDS: seconds
                                                            };
                                                            onUpdateConfig(name, newConfig);
                                                        }}
                                                    />

                                                    {/* Magic Number */}
                                                    <div>
                                                        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] mb-1.5 block">
                                                            {t('magic_number') || "MAGIC NUMBER"}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            value={config?.magic_number ?? ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'magic_number', e.target.value)} 
                                                            onBlur={(e) => handleConfigBlur(name, 'magic_number', parseInt(e.target.value) || 0)}
                                                            dir="ltr" 
                                                            className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs text-[#34D399] font-mono focus:outline-none transition-colors" 
                                                        />
                                                    </div>
                                                    
                                                    {/* Candle Type */}
                                                    <CustomSelect 
                                                        label={t('candle_type') || "CANDLE TYPE"}
                                                        value={config?.candle_type || 'STANDARD'}
                                                        options={candleOptions}
                                                        onChange={(val) => handleConfigChange(name, 'candle_type', val)}
                                                    />
                                                </div>
                                                
                                                {/* Allowed Trading Days */}
                                                <div className="mt-3">
                                                    <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] mb-1.5 block">
                                                        {t('trading_days') || "ALLOWED TRADING DAYS"}
                                                    </label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {daysOfWeek.map(d => {
                                                            const isSelected = (config?.allowed_days || []).includes(d);
                                                            return (
                                                                <button 
                                                                    key={d} 
                                                                    type="button"
                                                                    onClick={() => toggleDay(name, d)} 
                                                                    className={`px-3 py-1 rounded-[4px] text-[10px] font-mono font-medium border transition-all cursor-pointer ${
                                                                        isSelected 
                                                                            ? 'bg-[#107C41] border-[#107C41] text-white font-semibold' 
                                                                            : 'bg-[#18181B] border-[#333333] text-[#797775] hover:border-[#3E3E3E] hover:text-white'
                                                                    }`}
                                                                >
                                                                    {dayLabels[d]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Risk Configuration */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E81123]" />
                                                    <h5 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                                        {t('risk_management') || 'Risk Management Model'}
                                                    </h5>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#18181B] p-2.5 rounded-[4px] border border-[#333333]">
                                                    <CustomSelect 
                                                        value={config?.risk_mode || 'fixed_usd'}
                                                        options={riskModeOptions}
                                                        onChange={(val) => handleConfigChange(name, 'risk_mode', val)}
                                                    />

                                                    <div className="flex items-center bg-[#202023] border border-[#333333] rounded-[4px] px-3 h-8" dir="ltr">
                                                        <input 
                                                            type="text"
                                                            value={config?.risk_value !== undefined ? config.risk_value : ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'risk_value', e.target.value)}
                                                            onBlur={(e) => handleConfigBlur(name, 'risk_value', e.target.value ? parseFloat(e.target.value) : 0)}
                                                            className="w-full bg-transparent border-none outline-none text-[#34D399] font-mono font-semibold text-xs placeholder-[#52525B]"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="text-[10px] font-mono text-[#797775] ml-2 shrink-0">
                                                            {config?.risk_mode === 'percentage' ? '%' : config?.risk_mode === 'fixed_lot' ? 'LOT' : 'USD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Killzones & Delay Checks */}
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                                                {/* Killzones */}
                                                <div className="lg:col-span-8">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FCE100]" />
                                                        <h5 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                                            {t('active_trading_hours') || 'Session Killzones (Trading Windows)'}
                                                        </h5>
                                                    </div>

                                                    <div className="bg-[#18181B] rounded-[4px] border border-[#333333] p-2.5 space-y-2">
                                                        {killzones.map((zone, idx) => {
                                                            let [start, end] = zone.includes('-') ? zone.split('-') : ["", ""];
                                                            return (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="flex-1 flex items-center bg-[#202023] px-2 h-7 rounded-[4px] border border-[#333333]">
                                                                        <span className="text-[9px] font-mono text-[#797775] mr-1.5">FROM:</span>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="00:00" 
                                                                            value={start} 
                                                                            onChange={(e) => updateKillzoneTime(name, killzones, idx, 'start', e.target.value)} 
                                                                            onBlur={(e) => handleTimeBlur(name, killzones, idx, 'start', e.target.value)} 
                                                                            dir="ltr" 
                                                                            className="w-14 bg-transparent border-none text-center text-xs text-white font-mono outline-none" 
                                                                        />
                                                                        <div className="w-px h-3 bg-[#3E3E3E] mx-2" />
                                                                        <span className="text-[9px] font-mono text-[#797775] mr-1.5">TO:</span>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="00:00" 
                                                                            value={end} 
                                                                            onChange={(e) => updateKillzoneTime(name, killzones, idx, 'end', e.target.value)} 
                                                                            onBlur={(e) => handleTimeBlur(name, killzones, idx, 'end', e.target.value)} 
                                                                            dir="ltr" 
                                                                            className="w-14 bg-transparent border-none text-center text-xs text-white font-mono outline-none" 
                                                                        />
                                                                    </div>

                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeKillzone(name, killzones, idx)} 
                                                                        className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#797775] hover:bg-red-500/10 hover:text-[#F87171] transition-colors cursor-pointer"
                                                                        title="Remove Window"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}

                                                        <button 
                                                            type="button"
                                                            onClick={() => addKillzone(name, killzones)} 
                                                            className="w-full py-1.5 bg-[#202023] hover:bg-[#28282B] border border-dashed border-[#3E3E3E] rounded-[4px] text-xs font-semibold text-[#CCCCCC] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-[#107C41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            <span>{t('add_trading_window') || "Add Trading Window"}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Logic Check Interval */}
                                                <div className="lg:col-span-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4]" />
                                                        <h5 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                                            {t('delay_logic_checks') || "Tick Logic Interval"}
                                                        </h5>
                                                    </div>

                                                    <div className="bg-[#18181B] rounded-[4px] border border-[#333333] p-3 flex flex-col items-center justify-center h-[calc(100%-24px)]">
                                                        <input 
                                                            type="number" 
                                                            value={config?.TIMEFRAME_SECONDS ?? 300} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'TIMEFRAME_SECONDS', e.target.value)}
                                                            onBlur={(e) => handleSecondsBlur(name, e.target.value)}
                                                            dir="ltr"
                                                            className="w-full text-center bg-transparent border-none text-xl font-bold text-[#60A5FA] font-mono outline-none" 
                                                        />
                                                        <span className="text-[10px] font-mono text-[#797775] uppercase mt-1">
                                                            {t('cycle_seconds') || "SECONDS / TICK"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StrategyPanel;