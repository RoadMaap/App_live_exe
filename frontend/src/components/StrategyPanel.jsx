import React, { useState, useEffect, useRef } from 'react';

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
        <div className="relative w-full group" ref={containerRef}>
            {label && <label className="text-[9px] text-zinc-500 font-bold mb-1.5 block">{label}</label>}
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-[#18181b] border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 transition-all outline-none hover:border-white/10 hover:bg-[#1a1a20] ${isOpen ? 'border-emerald-500/50 bg-[#1a1a20]' : ''}`}
            >
                <span className="flex items-center gap-2 truncate" dir="ltr">
                    {prefixIcon && <span className="text-emerald-500">{prefixIcon}</span>}
                    {selectedLabel}
                </span>
                
                <svg 
                    className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div className={`absolute left-0 top-full mt-1 w-full bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}>
                <div className="max-h-48 overflow-y-auto custom-scroll py-1">
                    {(options || []).map((opt) => (
                        <div 
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${value === opt.value ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                            dir="ltr"
                        >
                            <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${value === opt.value ? 'opacity-100' : 'opacity-0'}`}></div>
                            {opt.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StrategyPanel = ({ strategies, onStrategiesChange, onUpdateConfig }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [expandedStrategies, setExpandedStrategies] = useState([]);

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        if(window.eel) {
            try {
                const path = await window.eel.open_strategy_file_dialog()();
                if (path) {
                    const res = await window.eel.load_custom_strategy(path)();
                    if (res?.success && res?.strategies) {
                        onStrategiesChange(res.strategies);
                    }
                }
            } catch (err) {
                console.error("Import Error:", err);
            }
        }
        setIsLoading(false);
    };

    const handleDelete = async (name, e) => {
        e.stopPropagation();
        if(window.eel) {
            try {
                const newStrategies = await window.eel.remove_strategy(name)();
                if (newStrategies) onStrategiesChange(newStrategies);
            } catch (err) {
                console.error("Delete Error:", err);
            }
        }
    };

    const saveParamToBackend = (strategyName, paramKey, value) => {
        if(window.eel) {
            window.eel.update_strategy_param(strategyName, paramKey, value)();
        }
    };

    // Updated handleParamChange: Just updates local UI state, allowing string values (like "1.")
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

    // New handler for onBlur: Parses to float and saves
    const handleParamBlur = (strategyName, paramKey, currentValue) => {
        let finalValue = currentValue;
        
        if (typeof currentValue === 'string') {
            // Attempt to parse to float. Handle empty string case.
            if (currentValue.trim() === '') {
                finalValue = ''; // Or 0, depending on preference
            } else {
                const parsed = parseFloat(currentValue);
                finalValue = isNaN(parsed) ? '' : parsed;
            }
        }

        // Update UI state with the parsed (clean) value
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

        // Save the parsed value to the backend
        saveParamToBackend(strategyName, paramKey, finalValue);
    };

    const handleConfigChange = (strategyName, configKey, value) => {
        const currentConfig = strategies?.[strategyName]?.config || {};
        const newConfig = { ...currentConfig, [configKey]: value };
        onUpdateConfig(strategyName, newConfig);
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
        handleConfigChange(strategyName, 'killzones', newZones);
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
        if (formatted !== value) updateKillzoneTime(strategyName, currentZones, index, type, formatted);
    };

    const strategyList = Object.entries(strategies || {});

    const timeframeOptions = [
        { label: 'M1 - 1 Minute', value: 'M1' }, { label: 'M5 - 5 Minutes', value: 'M5' },
        { label: 'M15 - 15 Minutes', value: 'M15' }, { label: 'M30 - 30 Minutes', value: 'M30' },
        { label: 'H1 - 1 Hour', value: 'H1' }, { label: 'H4 - 4 Hours', value: 'H4' },
        { label: 'D1 - Daily', value: 'D1' },
    ];

    const candleOptions = [
        { label: 'Standard Candles', value: 'STANDARD' },
        { label: 'Heikin Ashi', value: 'HEIKIN_ASHI' },
    ];

    const riskModeOptions = [
        { label: 'Fixed USD Risk', value: 'fixed_usd' },
        { label: 'Fixed Lot Size', value: 'fixed_lot' },
        { label: 'Percentage Risk', value: 'percentage' },
    ];

    return (
        <div className="h-full flex flex-col gap-5 font-sans">
            
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1c1c20] to-[#000] border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-tight">Strategy Management</h1>
                        <p className="text-xs text-zinc-500 font-medium">Configure trading algorithms & execution rules</p>
                    </div>
                </div>
                <button onClick={handleImport} disabled={isLoading} className="relative z-10 bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2">
                    {isLoading ? (<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>)}
                    Import Strategy
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-4 pb-4">
                {strategyList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-600 border border-dashed border-zinc-800 rounded-2xl bg-[#0e0e11]">
                        <p className="text-sm font-medium text-zinc-400">No active strategies found</p>
                        <p className="text-xs opacity-50 mt-1">Import a Python strategy file to get started</p>
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

                        const paramCount = filteredParams.length;

                        return (
                            <div key={name} className={`bg-[#121215] border transition-all duration-500 ease-out rounded-xl overflow-hidden ${isExpanded ? 'border-emerald-500/30 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.15)]' : 'border-white/5 hover:border-white/10'}`}>
                                
                                <div onClick={() => toggleExpand(name)} className="p-4 flex items-center justify-between cursor-pointer select-none group relative z-20 bg-[#121215]">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono font-bold text-sm shadow-inner transition-colors border ${isExpanded ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/20' : 'bg-[#18181b] text-zinc-500 border-white/5 group-hover:border-white/10'}`}>
                                            {String(name).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold transition-colors ${isExpanded ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>{name}</h4>
                                            <div className="flex items-center gap-2 mt-1.5" dir="ltr">
                                                {config?.symbol && (<span className="text-[10px] font-bold font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5">{config.symbol}</span>)}
                                                <span className="text-[10px] font-bold font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">{config?.timeframe || 'M5'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => handleDelete(name, e)} className="p-2 rounded-lg text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <div className={`p-2 rounded-lg text-zinc-500 transition-transform duration-500 ease-out ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-5 pb-6 border-t border-white/5 bg-[#0e0e11]">
                                            
                                            <div className="mt-5 mb-6">
                                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Algorithm Parameters</h5>
                                                {paramCount === 0 ? (
                                                    <div className="text-center text-zinc-600 py-4 text-xs italic bg-[#151518] rounded-xl border border-white/5">No configurable parameters detected.</div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {filteredParams.map(([key, val]) => {
                                                            // Empty string is no longer an error, just an empty field
                                                            const isEmpty = val === '';
                                                            
                                                            return (
                                                                <div key={key} className={`group relative bg-[#18181b] p-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 ${isEmpty ? 'border-rose-500/50 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)] focus-within:!border-rose-500' : 'border-white/5 hover:border-white/10 focus-within:!border-blue-500/50'}`}>
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <label className={`text-[9px] uppercase font-bold tracking-wider truncate transition-colors ${isEmpty ? 'text-rose-500' : 'text-zinc-500 group-focus-within:text-blue-400'}`} title={key}>
                                                                            {key}
                                                                        </label>
                                                                        {isEmpty && (
                                                                            <span className="text-[8px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                                                                EMPTY
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        value={val !== undefined && val !== null ? val : ''}
                                                                        onChange={(e) => handleParamChange(name, key, e.target.value)}
                                                                        onBlur={(e) => handleParamBlur(name, key, e.target.value)}
                                                                        dir="ltr"
                                                                        className={`w-full bg-transparent border-none outline-none p-0 text-sm font-mono font-bold placeholder-zinc-700 transition-colors ${isEmpty ? 'text-rose-400' : 'text-zinc-200 focus:text-white'}`}
                                                                    />
                                                                    <div className={`absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none ${isEmpty ? 'bg-rose-500/5' : 'bg-blue-500/5'}`}></div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-5 mb-6">
                                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Market Configuration</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 font-bold mb-1.5 block">SYMBOL</label>
                                                        <input type="text" value={config?.symbol || ''} onChange={(e) => handleConfigChange(name, 'symbol', e.target.value.toUpperCase())} dir="ltr" className="w-full bg-[#18181b] border border-white/5 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase transition-all outline-none hover:border-white/10" />
                                                    </div>
                                                    
                                                    <CustomSelect 
                                                        label="TIMEFRAME"
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

                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 font-bold mb-1.5 block">MAGIC NO.</label>
                                                        <input type="number" value={config?.magic_number || 0} onChange={(e) => handleConfigChange(name, 'magic_number', parseInt(e.target.value))} dir="ltr" className="w-full bg-[#18181b] border border-white/5 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-blue-400 font-mono transition-all outline-none hover:border-white/10" />
                                                    </div>
                                                    
                                                    <CustomSelect 
                                                        label="CANDLE TYPE"
                                                        value={config?.candle_type || 'STANDARD'}
                                                        options={candleOptions}
                                                        onChange={(val) => handleConfigChange(name, 'candle_type', val)}
                                                    />
                                                </div>
                                                
                                                <div className="mt-4">
                                                    <label className="text-[9px] text-zinc-500 font-bold mb-2 block">ACTIVE TRADING DAYS</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {daysOfWeek.map(d => (
                                                            <button key={d} onClick={() => toggleDay(name, d)} className={`flex-1 min-w-[40px] py-1.5 rounded text-[10px] border font-medium transition-all ${(config?.allowed_days || []).includes(d) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#18181b] border-white/5 text-zinc-600 hover:bg-white/5'}`}>{dayLabels[d]}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Risk Management
                                                </h5>
                                                <div className="bg-[#151518] rounded-xl border border-white/5 flex items-center relative transition-colors hover:border-white/10 p-1 gap-1">
                                                    <div className="w-[180px]">
                                                        <CustomSelect 
                                                            value={config?.risk_mode || 'fixed_usd'}
                                                            options={riskModeOptions}
                                                            onChange={(val) => handleConfigChange(name, 'risk_mode', val)}
                                                        />
                                                    </div>
                                                    <div className="flex-1 relative h-full">
                                                        <input 
                                                            type="number" 
                                                            value={config?.risk_value || 0} 
                                                            onChange={(e) => handleConfigChange(name, 'risk_value', e.target.value)}
                                                            dir="ltr"
                                                            className="w-full h-full bg-transparent border-none outline-none text-emerald-400 font-mono font-bold text-sm px-4 py-2 placeholder-zinc-700"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 pointer-events-none">
                                                            {config?.risk_mode === 'percentage' ? '%' : config?.risk_mode === 'fixed_lot' ? 'LOT' : 'USD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                                                <div className="lg:col-span-8">
                                                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Active Trading Hours</h5>
                                                    <div className="bg-[#151518] rounded-xl border border-white/5 p-3 space-y-2">
                                                        {killzones.map((zone, idx) => {
                                                            let [start, end] = zone.includes('-') ? zone.split('-') : ["", ""];
                                                            return (
                                                                <div key={idx} className="flex items-center gap-2 group animate-fade-in-down">
                                                                    <div className="flex-1 flex items-center gap-3 bg-black/30 p-1.5 rounded-lg border border-white/5 focus-within:border-indigo-500/50 transition-colors hover:border-white/10">
                                                                        <div className="relative w-full"><input type="text" placeholder="00:00" value={start} onChange={(e) => updateKillzoneTime(name, killzones, idx, 'start', e.target.value)} onBlur={(e) => handleTimeBlur(name, killzones, idx, 'start', e.target.value)} dir="ltr" className="w-full bg-transparent border-none text-center text-xs text-white font-mono focus:ring-0 focus:outline-none placeholder-zinc-700" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 font-bold pointer-events-none">FROM</span></div>
                                                                        <div className="w-px h-4 bg-white/10"></div>
                                                                        <div className="relative w-full"><input type="text" placeholder="00:00" value={end} onChange={(e) => updateKillzoneTime(name, killzones, idx, 'end', e.target.value)} onBlur={(e) => handleTimeBlur(name, killzones, idx, 'end', e.target.value)} dir="ltr" className="w-full bg-transparent border-none text-center text-xs text-white font-mono focus:ring-0 focus:outline-none placeholder-zinc-700" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 font-bold pointer-events-none">TO</span></div>
                                                                    </div>
                                                                    <button onClick={() => removeKillzone(name, killzones, idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        <button onClick={() => addKillzone(name, killzones)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 border-dashed rounded-lg text-xs font-bold text-zinc-400 transition-colors flex items-center justify-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                            Add Trading Window
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="lg:col-span-4">
                                                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>Delay Between Logic Checks</h5>
                                                    <div className="bg-[#151518] rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center h-[calc(100%-28px)]">
                                                        <input 
                                                            type="number" 
                                                            value={config?.TIMEFRAME_SECONDS || 300} 
                                                            onChange={(e) => handleConfigChange(name, 'TIMEFRAME_SECONDS', e.target.value)}
                                                            onBlur={(e) => handleSecondsBlur(name, e.target.value)}
                                                            dir="ltr"
                                                            className="w-full text-center bg-transparent border-none text-2xl font-bold text-orange-400 font-mono outline-none mb-1"
                                                        />
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">CYCLE SECONDS</span>
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