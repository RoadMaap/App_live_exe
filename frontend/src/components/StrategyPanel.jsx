import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * FluentComboBox
 * Ultra-clean WinUI 3 dropdown implementation.
 */
const FluentComboBox = ({ label, value, options, onChange }) => {
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
        <div className="relative w-full flex flex-col gap-1.5" ref={containerRef}>
            {label && (
                <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">
                    {label}
                </label>
            )}
            
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-[34px] flex items-center justify-between px-3 text-xs font-mono transition-all outline-none cursor-default ${
                    isOpen 
                        ? 'bg-[#1E1E1E] border-b-2 border-b-[#107C41] border-t border-t-white/5 border-x border-x-white/5 text-white' 
                        : 'bg-[#242424] hover:bg-[#2A2A2A] border-b border-b-white/20 border-t border-t-white/5 border-x border-x-white/5 text-[#E1DFDD]'
                }`}
            >
                <span className="truncate pr-4" dir="ltr">{selectedLabel}</span>
                <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#107C41]' : 'text-[#797775]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Flyout Menu */}
            <div className={`absolute left-0 top-[calc(100%+4px)] w-full bg-[#2D2D2D] border border-[#3E3E3E] rounded-[4px] shadow-[0_16px_32px_rgba(0,0,0,0.6)] overflow-hidden z-50 transition-all duration-100 origin-top ${
                isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
            }`}>
                <div className="max-h-48 overflow-y-auto py-1 custom-scroll">
                    {(options || []).map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                            <div 
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-2 text-xs font-mono cursor-default flex items-center justify-between mx-1 rounded-[3px] transition-colors ${
                                    isSelected ? 'bg-[#107C41]/20 text-[#34D399]' : 'text-[#E1DFDD] hover:bg-white/10'
                                }`}
                                dir="ltr"
                            >
                                <span className="truncate">{opt.label}</span>
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
 * StrategyPanel Component
 * Executive desktop workstation aesthetic. Pure neutral palettes with strategic accenting.
 */
const StrategyPanel = ({ strategies, onStrategiesChange, onUpdateConfig }) => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    const [isLoading, setIsLoading] = useState(false);
    const [expandedStrategies, setExpandedStrategies] = useState([]);

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const dayLabels = [
        t('day_mon') || 'Mon', t('day_tue') || 'Tue', t('day_wed') || 'Wed', 
        t('day_thu') || 'Thu', t('day_fri') || 'Fri', t('day_sat') || 'Sat', t('day_sun') || 'Sun'
    ];

    const timeframeToSeconds = {
        'M1': 60, 'M5': 300, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H4': 14400, 'D1': 86400,
    };
    const validSecondsList = [60, 300, 900, 1800, 3600, 14400, 86400];
    const blacklistParams = ['allowed_days', 'allowdays', 'allow_days', 'alloweddays', 'allowed_day', 'killzones', 'killzone', 'kill_zones', 'kill_zone', 'kill_zones_list', 'allow_day', 'kill_zone_list'];

    const toggleExpand = (name) => {
        setExpandedStrategies(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    const handleImport = async () => {
        setIsLoading(true);
        if (window.eel) {
            try {
                const path = await window.eel.open_strategy_file_dialog()();
                if (path) {
                    const res = await window.eel.load_custom_strategy(path)();
                    if (res?.success && res?.strategies) onStrategiesChange(res.strategies);
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

    const saveParamToBackend = (strategyName, paramKey, value) => {
        if (window.eel) window.eel.update_strategy_param(strategyName, paramKey, value)();
    };

    const handleParamChange = (strategyName, paramKey, newValue) => {
        onStrategiesChange(prev => ({
            ...prev, [strategyName]: { ...prev[strategyName], params: { ...prev[strategyName].params, [paramKey]: newValue } }
        }));
    };

    const handleParamBlur = (strategyName, paramKey, currentValue, originalType) => {
        let finalValue = currentValue;
        const strVal = String(currentValue).trim();
        if (strVal === '') finalValue = originalType === 'number' ? 1 : '1';
        else if (originalType === 'number') {
            const parsed = parseFloat(strVal);
            finalValue = (isNaN(parsed) || parsed === 0) ? 1 : parsed;
        } else if (strVal === '0') finalValue = '1';

        onStrategiesChange(prev => ({
            ...prev, [strategyName]: { ...prev[strategyName], params: { ...prev[strategyName].params, [paramKey]: finalValue } }
        }));
        saveParamToBackend(strategyName, paramKey, finalValue);
    };

    const handleConfigChangeLocal = (strategyName, configKey, value) => {
        onStrategiesChange(prev => ({
            ...prev, [strategyName]: { ...prev[strategyName], config: { ...prev[strategyName].config, [configKey]: value } }
        }));
    };

    const handleConfigChange = (strategyName, configKey, value) => {
        const newConfig = { ...strategies[strategyName].config, [configKey]: value };
        onUpdateConfig(strategyName, newConfig);
    };

    const handleConfigBlur = (strategyName, configKey, value) => handleConfigChange(strategyName, configKey, value);

    const handleSecondsBlur = (strategyName, inputValue) => {
        const minAllowed = timeframeToSeconds[strategies[strategyName].config?.timeframe] || 300;
        let val = parseInt(inputValue);
        if (isNaN(val) || val < minAllowed) val = minAllowed;
        else val = validSecondsList.filter(s => s >= minAllowed).reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
        handleConfigChange(strategyName, 'TIMEFRAME_SECONDS', val);
    };

    const toggleDay = (strategyName, dayIndex) => {
        const currentDays = strategies[strategyName].config?.allowed_days || [];
        const newDays = currentDays.includes(dayIndex) ? currentDays.filter(d => d !== dayIndex) : [...currentDays, dayIndex].sort();
        handleConfigChange(strategyName, 'allowed_days', newDays);
    };

    const addKillzone = (strategyName, currentZones) => handleConfigChange(strategyName, 'killzones', [...(currentZones || []), ""]);
    const removeKillzone = (strategyName, currentZones, index) => handleConfigChange(strategyName, 'killzones', (currentZones || []).filter((_, i) => i !== index));

    const updateKillzoneTime = (strategyName, currentZones, index, type, value) => {
        if (!/^[0-9:]*$/.test(value) || value.length > 5) return;
        const newZones = [...(currentZones || [])];
        const [start, end] = (newZones[index] || "-").includes('-') ? newZones[index].split('-') : ["", ""];
        newZones[index] = type === 'start' ? `${value}-${end}` : `${start}-${value}`;
        handleConfigChangeLocal(strategyName, 'killzones', newZones);
    };

    const handleTimeBlur = (strategyName, currentZones, index, type, value) => {
        if (!value) return;
        let formatted = value;
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length > 0 && digits.length <= 2) {
            formatted = `${Math.min(parseInt(digits), 23).toString().padStart(2, '0')}:00`;
        } else if (digits.length === 3 || digits.length === 4) {
             let padded = digits.padStart(4, '0');
             formatted = `${Math.min(parseInt(padded.slice(0, 2)), 23).toString().padStart(2, '0')}:${Math.min(parseInt(padded.slice(2)), 59).toString().padStart(2, '0')}`;
        }
        const newZones = [...(currentZones || [])];
        const [start, end] = (newZones[index] || "-").includes('-') ? newZones[index].split('-') : ["", ""];
        newZones[index] = type === 'start' ? `${formatted}-${end}` : `${start}-${formatted}`;
        handleConfigChange(strategyName, 'killzones', newZones);
    };

    const strategyList = Object.entries(strategies || {});

    const timeframeOptions = [
        { label: 'M1 - 1 Minute', value: 'M1' }, { label: 'M5 - 5 Minutes', value: 'M5' },
        { label: 'M15 - 15 Minutes', value: 'M15' }, { label: 'H1 - 1 Hour', value: 'H1' },
        { label: 'H4 - 4 Hours', value: 'H4' }, { label: 'D1 - 1 Day', value: 'D1' }
    ];

    const candleOptions = [
        { label: 'Standard', value: 'STANDARD' }, { label: 'Heikin Ashi', value: 'HEIKIN_ASHI' }
    ];

    const riskModeOptions = [
        { label: 'Fixed USD ($)', value: 'fixed_usd' }, { label: 'Fixed Lot Size', value: 'fixed_lot' }, { label: 'Percentage (%)', value: 'percentage' }
    ];

    return (
        <div className="h-full flex flex-col gap-4 font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] select-none" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Action Bar */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-white font-semibold text-sm tracking-tight">{t('strategy_management') || 'Strategy Configurations'}</h1>
                    <p className="text-[11px] text-[#A19F9D] mt-0.5">{t('strategy_config_subtitle') || 'Manage and tune algorithmic parameters.'}</p>
                </div>
                <button 
                    type="button"
                    onClick={handleImport} 
                    disabled={isLoading} 
                    className="h-8 px-4 bg-[#242424] hover:bg-[#2D2D2D] active:bg-[#333333] text-white rounded-[4px] text-xs font-semibold border border-[#3E3E3E] transition-all shadow-sm flex items-center gap-2 cursor-default disabled:opacity-60"
                >
                    {isLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#107C41] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-3.5 h-3.5 text-[#107C41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                    <span>{t('import_strategy') || 'Add Strategy'}</span>
                </button>
            </div>

            {/* Strategy Accordion List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pb-4 pr-1 custom-scroll">
                {strategyList.length === 0 ? (
                    <div className="border border-dashed border-[#333333] rounded-[6px] p-10 flex flex-col items-center justify-center text-center mt-4">
                        <svg className="w-8 h-8 text-[#52525B] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm font-semibold text-[#E1DFDD]">{t('no_strategies_loaded') || 'No Strategies Loaded'}</p>
                        <p className="text-xs text-[#797775] mt-1">{t('import_strategy_hint') || 'Import a Python strategy file to view configuration options.'}</p>
                    </div>
                ) : (
                    strategyList.map(([name, data]) => {
                        if (!data) return null;
                        const isExpanded = expandedStrategies.includes(name);
                        const config = data.config || {};
                        const killzones = config.killzones || [];
                        const filteredParams = Object.entries(data.params || {}).filter(([k]) => !blacklistParams.includes(String(k).trim().toLowerCase()));

                        return (
                            <div key={name} className="bg-[#1C1C1E] border border-[#2D2D30] rounded-[6px] overflow-hidden transition-all shadow-sm">
                                
                                {/* Expander Header */}
                                <div onClick={() => toggleExpand(name)} className="h-[52px] px-4 flex items-center justify-between cursor-default hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-semibold text-white tracking-tight">{name}</h4>
                                                {config.symbol && (
                                                    <span className="text-[10px] font-mono px-1.5 rounded-[2px] bg-[#2D2D30] text-[#CCCCCC]">{config.symbol}</span>
                                                )}
                                                <span className="text-[10px] font-mono px-1.5 rounded-[2px] bg-[#107C41]/20 text-[#34D399]">{config.timeframe || 'M5'}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-[#797775] mt-0.5">
                                                MAGIC: <span className="text-[#A19F9D]">{config.magic_number ?? '0'}</span>
                                                <span className="mx-1.5">•</span>
                                                PARAMS: <span className="text-[#A19F9D]">{filteredParams.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => handleDelete(name, e)} className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#797775] hover:bg-[#C42B1C]/20 hover:text-[#F87171] transition-colors" title="Delete">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <div className={`w-7 h-7 flex items-center justify-center text-[#A19F9D] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Expander Body */}
                                <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="p-5 border-t border-[#2D2D30] bg-[#161618] space-y-7">
                                            
                                            {/* Logic Settings Property Grid */}
                                            <section>
                                                <h5 className="text-[10px] font-semibold text-[#797775] tracking-widest uppercase mb-3 border-b border-[#2D2D30] pb-1">Algorithm Parameters</h5>
                                                {filteredParams.length === 0 ? (
                                                    <p className="text-xs text-[#52525B] font-mono italic">No custom parameters detected.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {filteredParams.map(([key, val]) => {
                                                            const isInvalid = val === "" || val === undefined || val === null || val === 0 || val === "0";
                                                            return (
                                                                <div key={key} className="flex flex-col gap-1.5">
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="text-[10px] font-mono uppercase text-[#A19F9D] truncate pr-2" title={key}>{key}</label>
                                                                        {isInvalid && <span className="text-[8px] font-mono px-1 rounded bg-[#C42B1C]/20 text-[#F87171]">INVALID</span>}
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        value={val !== undefined && val !== null ? val : ''}
                                                                        onChange={(e) => handleParamChange(name, key, e.target.value)}
                                                                        onBlur={(e) => handleParamBlur(name, key, e.target.value, typeof val)}
                                                                        dir="ltr"
                                                                        className={`h-[34px] px-2.5 text-xs font-mono transition-all outline-none rounded-[3px] border-x border-t border-b-2 ${
                                                                            isInvalid 
                                                                                ? 'bg-[#C42B1C]/5 border-x-[#C42B1C]/20 border-t-[#C42B1C]/20 border-b-[#C42B1C] text-[#F87171]' 
                                                                                : 'bg-[#242424] border-x-white/5 border-t-white/5 border-b-white/20 focus:border-b-[#107C41] text-white hover:bg-[#2A2A2A]'
                                                                        }`}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </section>

                                            {/* Configuration Panel */}
                                            <section>
                                                <h5 className="text-[10px] font-semibold text-[#797775] tracking-widest uppercase mb-3 border-b border-[#2D2D30] pb-1">Market Configuration</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                                    
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">Symbol</label>
                                                        <input 
                                                            type="text" 
                                                            value={config.symbol || ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'symbol', e.target.value)} 
                                                            onBlur={(e) => handleConfigBlur(name, 'symbol', e.target.value)}
                                                            dir="ltr" 
                                                            className="h-[34px] px-2.5 text-xs font-mono uppercase text-white bg-[#242424] border-x border-t border-x-white/5 border-t-white/5 border-b-2 border-b-white/20 focus:border-b-[#107C41] hover:bg-[#2A2A2A] transition-all outline-none rounded-[3px]"
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">Leverage</label>
                                                        <div className="relative h-[34px] flex items-center bg-[#242424] border-x border-t border-x-white/5 border-t-white/5 border-b-2 border-b-white/20 focus-within:border-b-[#107C41] hover:bg-[#2A2A2A] transition-all rounded-[3px]">
                                                            <input 
                                                                type="number" 
                                                                placeholder="Auto" 
                                                                value={config.leverage !== undefined ? config.leverage : ''} 
                                                                onChange={(e) => handleConfigChangeLocal(name, 'leverage', e.target.value)} 
                                                                onBlur={(e) => handleConfigBlur(name, 'leverage', e.target.value ? parseInt(e.target.value) : '')} 
                                                                dir="ltr" 
                                                                className="w-full h-full bg-transparent px-2.5 text-xs font-mono text-white outline-none"
                                                            />
                                                            <span className="absolute right-2.5 text-[10px] font-mono text-[#797775] pointer-events-none">X</span>
                                                        </div>
                                                    </div>

                                                    <FluentComboBox label="Timeframe" value={config.timeframe || 'M5'} options={timeframeOptions} onChange={(val) => {
                                                        onUpdateConfig(name, { ...config, timeframe: val, TIMEFRAME_SECONDS: timeframeToSeconds[val] || 300 });
                                                    }} />

                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">Magic Number</label>
                                                        <input 
                                                            type="number" 
                                                            value={config.magic_number ?? ''} 
                                                            onChange={(e) => handleConfigChangeLocal(name, 'magic_number', e.target.value)} 
                                                            onBlur={(e) => handleConfigBlur(name, 'magic_number', parseInt(e.target.value) || 0)}
                                                            dir="ltr" 
                                                            className="h-[34px] px-2.5 text-xs font-mono text-white bg-[#242424] border-x border-t border-x-white/5 border-t-white/5 border-b-2 border-b-white/20 focus:border-b-[#107C41] hover:bg-[#2A2A2A] transition-all outline-none rounded-[3px]"
                                                        />
                                                    </div>
                                                    
                                                    <FluentComboBox label="Candle Type" value={config.candle_type || 'STANDARD'} options={candleOptions} onChange={(val) => handleConfigChange(name, 'candle_type', val)} />
                                                </div>

                                                <div className="mt-4 flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">Active Trading Days</label>
                                                    <div className="flex bg-[#1E1E1E] rounded-[4px] border border-[#2D2D30] overflow-hidden w-fit">
                                                        {daysOfWeek.map((d, i) => {
                                                            const isSelected = (config.allowed_days || []).includes(d);
                                                            return (
                                                                <button 
                                                                    key={d} type="button" onClick={() => toggleDay(name, d)} 
                                                                    className={`px-3.5 py-1.5 text-[11px] font-mono font-medium transition-colors ${i !== 0 ? 'border-l border-[#2D2D30]' : ''} ${
                                                                        isSelected ? 'bg-[#107C41] text-white' : 'text-[#797775] hover:bg-[#2A2A2A] hover:text-white'
                                                                    }`}
                                                                >
                                                                    {dayLabels[d]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                                                {/* Risk Config */}
                                                <section>
                                                    <h5 className="text-[10px] font-semibold text-[#797775] tracking-widest uppercase mb-3 border-b border-[#2D2D30] pb-1">Risk Architecture</h5>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <FluentComboBox label="Risk Mode" value={config.risk_mode || 'fixed_usd'} options={riskModeOptions} onChange={(val) => handleConfigChange(name, 'risk_mode', val)} />
                                                        
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[10px] font-semibold text-[#A19F9D] tracking-wide uppercase">Value</label>
                                                            <div className="relative h-[34px] flex items-center bg-[#242424] border-x border-t border-x-white/5 border-t-white/5 border-b-2 border-b-white/20 focus-within:border-b-[#107C41] hover:bg-[#2A2A2A] transition-all rounded-[3px]" dir="ltr">
                                                                <input 
                                                                    type="text" value={config.risk_value !== undefined ? config.risk_value : ''} 
                                                                    onChange={(e) => handleConfigChangeLocal(name, 'risk_value', e.target.value)}
                                                                    onBlur={(e) => handleConfigBlur(name, 'risk_value', e.target.value ? parseFloat(e.target.value) : 0)}
                                                                    className="w-full h-full bg-transparent px-2.5 text-xs font-mono font-semibold text-white outline-none" placeholder="0.00"
                                                                />
                                                                <span className="absolute right-2.5 text-[10px] font-mono text-[#797775] pointer-events-none">
                                                                    {config.risk_mode === 'percentage' ? '%' : config.risk_mode === 'fixed_lot' ? 'LOT' : 'USD'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                {/* Advanced Tuning */}
                                                <section className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h5 className="text-[10px] font-semibold text-[#797775] tracking-widest uppercase mb-3 border-b border-[#2D2D30] pb-1">Killzones (UTC)</h5>
                                                        <div className="space-y-1.5">
                                                            {killzones.map((zone, idx) => {
                                                                let [start, end] = zone.includes('-') ? zone.split('-') : ["", ""];
                                                                return (
                                                                    <div key={idx} className="flex items-center gap-1.5">
                                                                        <div className="flex-1 h-[28px] flex items-center bg-[#242424] px-2 rounded-[3px] border border-white/5 focus-within:border-[#107C41] transition-colors" dir="ltr">
                                                                            <input type="text" placeholder="00:00" value={start} onChange={(e) => updateKillzoneTime(name, killzones, idx, 'start', e.target.value)} onBlur={(e) => handleTimeBlur(name, killzones, idx, 'start', e.target.value)} className="w-10 bg-transparent border-none text-center text-[11px] text-white font-mono outline-none" />
                                                                            <span className="text-[#52525B] font-mono mx-1">-</span>
                                                                            <input type="text" placeholder="00:00" value={end} onChange={(e) => updateKillzoneTime(name, killzones, idx, 'end', e.target.value)} onBlur={(e) => handleTimeBlur(name, killzones, idx, 'end', e.target.value)} className="w-10 bg-transparent border-none text-center text-[11px] text-white font-mono outline-none" />
                                                                        </div>
                                                                        <button type="button" onClick={() => removeKillzone(name, killzones, idx)} className="w-[28px] h-[28px] flex items-center justify-center text-[#52525B] hover:bg-[#C42B1C] hover:text-white rounded-[3px] transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                                    </div>
                                                                );
                                                            })}
                                                            <button type="button" onClick={() => addKillzone(name, killzones)} className="w-full h-[28px] border border-dashed border-[#3E3E3E] hover:border-[#107C41] hover:text-[#107C41] rounded-[3px] text-[10px] font-semibold text-[#797775] transition-colors">
                                                                + ADD WINDOW
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-[10px] font-semibold text-[#797775] tracking-widest uppercase mb-3 border-b border-[#2D2D30] pb-1">Tick Interval</h5>
                                                        <div className="bg-[#242424] border border-white/5 rounded-[4px] p-3 flex items-center gap-3">
                                                            <svg className="w-4 h-4 text-[#797775] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <div className="flex flex-col min-w-0" dir="ltr">
                                                                <div className="flex items-baseline gap-1">
                                                                    <input 
                                                                        type="number" value={config.TIMEFRAME_SECONDS ?? 300} 
                                                                        onChange={(e) => handleConfigChangeLocal(name, 'TIMEFRAME_SECONDS', e.target.value)}
                                                                        onBlur={(e) => handleSecondsBlur(name, e.target.value)}
                                                                        className="w-14 bg-transparent border-none text-sm font-bold text-white font-mono outline-none" 
                                                                    />
                                                                    <span className="text-[10px] font-mono text-[#797775]">sec</span>
                                                                </div>
                                                                <span className="text-[9px] text-[#A19F9D] uppercase">Cycle Delay</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
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