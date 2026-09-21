import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * StrategyConfigCard Component
 * Implements Microsoft Fluent 2 Expander control pattern for algorithmic strategy configuration.
 */
const StrategyConfigCard = ({ name, config, onSave }) => {
    const { t, lang } = useLanguage();

    const [localConfig, setLocalConfig] = useState(() => config || {});
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setLocalConfig(config || {});
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({ ...prev, [name]: value }));
    };

    const direction = lang === 'fa' ? 'rtl' : 'ltr';

    const handleSaveClick = () => {
        onSave(name, localConfig);
    };

    // Trading days index and localized labels
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

    const toggleDay = (dayIndex) => {
        setLocalConfig(prev => {
            const currentDays = prev.allowed_days || [];
            if (currentDays.includes(dayIndex)) {
                return { ...prev, allowed_days: currentDays.filter(d => d !== dayIndex) };
            } else {
                return { ...prev, allowed_days: [...currentDays, dayIndex].sort() };
            }
        });
    };

    return (
        <div dir={direction} className={`rounded-[6px] border transition-all duration-200 overflow-hidden ${
            isExpanded 
                ? 'bg-[#242424] border-[#3E3E3E] shadow-[0_4px_16px_rgba(0,0,0,0.3)]' 
                : 'bg-[#202023] border-[#2D2D30] hover:border-[#38383B]'
        }`}>
            {/* Header: Clickable Expander Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-white/[0.02]"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                        isExpanded ? 'bg-[#107C41]' : 'bg-[#52525B]'
                    }`} />
                    
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-[#FFFFFF] tracking-tight truncate">
                                {name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-[#1F1F1F] border border-[#333333] text-[#A19F9D]">
                                {localConfig.symbol || 'N/A'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#797775]">
                            <span>TF: <strong className="text-[#CCCCCC]">{localConfig.timeframe || 'M15'}</strong></span>
                            <span>•</span>
                            <span>MAGIC: <strong className="text-[#CCCCCC]">{localConfig.magic_number || '0'}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Fluent Chevron Toggle Indicator */}
                <div className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#A19F9D] hover:text-white transition-transform duration-200">
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Expander Body: Parameter Settings */}
            {isExpanded && (
                <div className="p-4 pt-3 border-t border-[#2D2D30] bg-[#1C1C1E] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        
                        {/* Symbol Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                {t('symbol') || 'Symbol'}
                            </label>
                            <input 
                                type="text" 
                                name="symbol" 
                                value={localConfig.symbol || ''} 
                                onChange={handleChange} 
                                className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs text-white font-mono uppercase focus:outline-none transition-colors" 
                            />
                        </div>

                        {/* Timeframe Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                {t('timeframe') || 'Timeframe'}
                            </label>
                            <select 
                                name="timeframe" 
                                value={localConfig.timeframe || 'M15'} 
                                onChange={handleChange} 
                                className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2 text-xs text-[#E1DFDD] font-mono focus:outline-none transition-colors"
                            >
                                <option value="M1">M1</option>
                                <option value="M5">M5</option>
                                <option value="M15">M15</option>
                                <option value="M30">M30</option>
                                <option value="H1">H1</option>
                                <option value="H4">H4</option>
                                <option value="D1">D1</option>
                            </select>
                        </div>

                        {/* Magic Number Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                {t('magic_number') || 'Magic Number'}
                            </label>
                            <input 
                                type="number" 
                                name="magic_number" 
                                value={localConfig.magic_number || 0} 
                                onChange={handleChange} 
                                className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2.5 text-xs text-white font-mono focus:outline-none transition-colors" 
                            />
                        </div>

                        {/* Candle Type Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                {t('candle_type') || 'Candle Type'}
                            </label>
                            <select 
                                name="candle_type" 
                                value={localConfig.candle_type || 'STANDARD'} 
                                onChange={handleChange} 
                                className="w-full h-8 bg-[#18181B] border border-[#333333] focus:border-[#107C41] rounded-[4px] px-2 text-xs text-[#E1DFDD] font-mono focus:outline-none transition-colors"
                            >
                                <option value="STANDARD">{t('candle_standard') || 'Standard Candlesticks'}</option>
                                <option value="HEIKIN_ASHI">{t('candle_heikin') || 'Heikin Ashi'}</option>
                            </select>
                        </div>

                        {/* Allowed Trading Days Chips */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D]">
                                {t('trading_days') || 'Active Trading Days'}
                            </label>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {daysOfWeek.map(d => {
                                    const isSelected = localConfig.allowed_days?.includes(d);
                                    return (
                                        <button 
                                            key={d} 
                                            type="button"
                                            onClick={() => toggleDay(d)}
                                            className={`px-2.5 py-1 rounded-[4px] text-[10px] font-medium border transition-all duration-150 ${
                                                isSelected 
                                                    ? 'bg-[#107C41] border-[#107C41] text-white shadow-sm font-semibold' 
                                                    : 'bg-[#18181B] border-[#333333] text-[#797775] hover:text-[#CCCCCC] hover:border-[#3E3E3E]'
                                            }`}
                                        >
                                            {dayLabels[d]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Save Action */}
                    <div className="pt-2 flex justify-end">
                        <button 
                            type="button"
                            onClick={handleSaveClick} 
                            className="px-5 py-1.5 bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white text-xs font-semibold rounded-[4px] border border-[#107C41] transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('apply_changes') || 'Apply Changes'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * BotSettingsPanel Component
 * Main strategy configuration list container formatted with Microsoft Fluent styles.
 */
const BotSettingsPanel = ({ strategies = {}, onUpdateConfig }) => {
    const { t } = useLanguage();
    const strategyList = Object.entries(strategies);

    // Microsoft Fluent Empty State Widget
    if (strategyList.length === 0) {
        return (
            <div className="bg-[#242424] border border-[#333333] rounded-[8px] p-10 flex flex-col items-center justify-center text-center min-h-[340px]">
                <div className="w-12 h-12 bg-[#1F1F1F] border border-[#333333] rounded-[6px] flex items-center justify-center mb-3 text-[#797775] shadow-sm">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#FFFFFF] tracking-tight mb-1">
                    {t('no_strategies_loaded') || 'No Strategies Loaded'}
                </h3>
                <p className="text-xs text-[#A19F9D] max-w-xs leading-relaxed">
                    {t('import_strategy_hint') || 'Import or attach a quantitative Python strategy to configure its execution parameters.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header: Title and Active Count Indicator */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[4px] bg-[#107C41]/15 text-[#107C41] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
                        {t('strategy_configurations') || 'Strategy Configurations'}
                    </h3>
                </div>

                <span className="text-[10px] font-mono text-[#A19F9D] px-2 py-0.5 rounded-[4px] bg-[#202023] border border-[#333333]">
                    {strategyList.length} ACTIVE
                </span>
            </div>
            
            {/* Strategy Expander Cards List */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {strategyList.map(([name, data]) => (
                    <StrategyConfigCard 
                        key={name} 
                        name={name} 
                        config={data?.config} 
                        onSave={onUpdateConfig} 
                    />
                ))}
            </div>
        </div>
    );
};

export default BotSettingsPanel;