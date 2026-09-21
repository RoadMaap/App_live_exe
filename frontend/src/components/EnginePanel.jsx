import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * EnginePanel Component
 * Engineered following Microsoft Fluent 2 / Windows Terminal design patterns.
 * Provides live telemetry controls, MT5 filesystem binding, and terminal stream logging.
 */
const EnginePanel = ({ 
    mt5Path, 
    onPathChange, 
    logs = [], 
    isRunning, 
    onToggle, 
    onClearLogs 
}) => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    const scrollViewportRef = useRef(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isBrowsing, setIsBrowsing] = useState(false);

    // Auto-scroll viewport to the latest entry when logs update
    useEffect(() => {
        if (scrollViewportRef.current) {
            const { scrollHeight, clientHeight } = scrollViewportRef.current;
            if (scrollHeight > clientHeight) {
                scrollViewportRef.current.scrollTop = scrollHeight;
            }
        }
    }, [logs]);

    // Invoke Python native file picker dialog
    const choosePath = async () => {
        if (isBrowsing) return;
        setIsBrowsing(true);

        if (window.eel) {
            try {
                // Support both Python bindings seamlessly
                const targetFn = window.eel.choose_mt5_path || window.eel.select_mt5_path;
                if (targetFn) {
                    const path = await targetFn()();
                    if (path) onPathChange(path);
                }
            } catch (err) {
                console.error('Error invoking native file dialog via Eel:', err);
            } finally {
                setIsBrowsing(false);
            }
        } else {
            // Emulated fallback for standalone preview
            setTimeout(() => {
                onPathChange('C:\\Program Files\\MetaTrader 5\\terminal64.exe');
                setIsBrowsing(false);
            }, 500);
        }
    };

    // Copy all current stream entries to clipboard
    const handleCopyLogs = async () => {
        if (!logs.length) return;
        const logText = logs.map(l => `[${l.time}] ${l.message}`).join('\n');
        
        try {
            await navigator.clipboard.writeText(logText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy console logs to clipboard:', err);
        }
    };

    return (
        <div 
            className="flex flex-col gap-4 font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] h-full select-none"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* 1. Primary Engine Execution Controller */}
            <div className="bg-[#242424] border border-[#333333] rounded-[8px] p-4 shadow-sm relative overflow-hidden shrink-0">
                <div className="flex items-center justify-between gap-4">
                    
                    {/* Status & Telemetry Metadata */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${
                            isRunning 
                                ? 'bg-[#107C41]/15 border-[#107C41]/40 text-[#107C41]' 
                                : 'bg-[#1F1F1F] border-[#333333] text-[#797775]'
                        }`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white tracking-tight">
                                    {t('trading_engine') || 'Trading Engine'}
                                </span>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[3px] bg-[#18181B] border border-[#333333]">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        isRunning ? 'bg-[#107C41] animate-pulse' : 'bg-[#797775]'
                                    }`} />
                                    <span className={`text-[10px] font-mono font-medium ${
                                        isRunning ? 'text-[#34D399]' : 'text-[#797775]'
                                    }`}>
                                        {isRunning ? 'ONLINE' : 'STANDBY'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[11px] text-[#A19F9D] mt-0.5 font-mono">
                                {isRunning ? 'Processing Live Ticks...' : 'Engine halted. Awaiting initialization.'}
                            </p>
                        </div>
                    </div>

                    {/* Primary Toggle Action Button */}
                    <button 
                        type="button"
                        onClick={onToggle}
                        className={`h-9 px-5 rounded-[4px] text-xs font-semibold tracking-wide transition-all duration-150 flex items-center gap-2 shadow-sm cursor-pointer shrink-0 ${
                            isRunning 
                                ? 'bg-[#C42B1C] hover:bg-[#B32719] active:bg-[#9B2215] text-white border border-[#C42B1C]' 
                                : 'bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white border border-[#107C41]'
                        }`}
                    >
                        {isRunning ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth={2} />
                                </svg>
                                <span>{t('stop_engine') || 'Halt Engine'}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                <span>{t('start_engine') || 'Start Engine'}</span>
                            </>
                        )}
                    </button>

                </div>
            </div>

            {/* 2. Path Configuration Bar */}
            <div className="bg-[#242424] border border-[#333333] rounded-[8px] p-3.5 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-1.5 px-0.5">
                    <label className="text-[10px] font-mono font-semibold text-[#A19F9D] uppercase tracking-wider">
                        {t('terminal_path') || 'MetaTrader 5 Executable Path'}
                    </label>
                    <span className={`text-[10px] font-mono ${mt5Path ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                        {mt5Path ? 'LINKED' : 'UNCONFIGURED'}
                    </span>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={mt5Path || ''} 
                        placeholder={lang === 'fa' ? "مسیر ترمینال متاتریدر ۵ انتخاب نشده است" : "Select MetaTrader 5 terminal executable path..."}
                        readOnly
                        className="flex-1 h-8 bg-[#18181B] border border-[#333333] rounded-[4px] px-2.5 text-xs text-[#E1DFDD] font-mono placeholder-[#52525B] focus:outline-none truncate"
                    />

                    <button 
                        type="button"
                        onClick={choosePath}
                        disabled={isBrowsing}
                        className="h-8 px-4 bg-[#2D2D2D] hover:bg-[#383838] active:bg-[#404040] border border-[#3E3E3E] text-xs font-semibold text-[#CCCCCC] hover:text-white rounded-[4px] transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                        <svg className="w-3.5 h-3.5 text-[#A19F9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{isBrowsing ? '...' : (t('browse') || 'Browse')}</span>
                    </button>
                </div>
            </div>

            {/* 3. Live Console Logs Terminal (Windows Terminal Pattern) */}
            <div className="bg-[#18181B] border border-[#333333] rounded-[8px] flex-1 flex flex-col min-h-[300px] overflow-hidden shadow-inner">
                
                {/* CommandBar Header */}
                <div className="h-9 px-3 border-b border-[#2D2D30] bg-[#1F1F22] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[#A19F9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9l3 3-3 3m5 0h3" />
                        </svg>
                        <span className="text-[11px] font-semibold text-[#FFFFFF] tracking-tight">
                            {t('live_logs') || 'Terminal Logs'}
                        </span>
                        <span className="text-[10px] font-mono text-[#797775] px-1.5 py-0.2 rounded bg-[#18181B] border border-[#2D2D30]">
                            {logs.length}
                        </span>
                    </div>

                    {/* Console Actions */}
                    <div className="flex items-center gap-1">
                        {/* Copy Logs Action */}
                        <button 
                            type="button"
                            onClick={handleCopyLogs} 
                            disabled={!logs.length}
                            className="p-1 rounded-[3px] hover:bg-[#2D2D30] text-[#A19F9D] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title={isCopied ? "Copied!" : "Copy Console Stream"}
                        >
                            {isCopied ? (
                                <svg className="w-3.5 h-3.5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            )}
                        </button>

                        {/* Clear Console Action */}
                        <button 
                            type="button"
                            onClick={onClearLogs} 
                            disabled={!logs.length}
                            className="p-1 rounded-[3px] hover:bg-[#2D2D30] text-[#A19F9D] hover:text-[#F87171] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Clear Console Stream"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Output Text Viewport */}
                <div 
                    ref={scrollViewportRef}
                    className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1.5 select-text bg-[#141416]"
                >
                    <div className="text-[#52525B] text-[10px] pb-1 border-b border-[#1F1F22]">
                        // RoadMaps Execution Daemon Console initialized.
                    </div>

                    {logs.length === 0 ? (
                        <div className="text-[#52525B] italic pt-6 text-center text-xs">
                            No telemetry logs recorded. Start engine to stream events.
                        </div>
                    ) : (
                        logs.map((log, index) => {
                            const isError = log.color?.includes('rose') || log.color?.includes('red');
                            const isSuccess = log.color?.includes('emerald') || log.color?.includes('green');
                            const isWarning = log.color?.includes('yellow') || log.color?.includes('amber');

                            return (
                                <div key={index} className="flex items-start gap-2 leading-tight">
                                    <span className="text-[#52525B] text-[10px] shrink-0 tabular-nums">
                                        [{log.time}]
                                    </span>

                                    <div className={`flex-1 break-words whitespace-pre-wrap ${
                                        isError ? 'text-[#F87171]' :
                                        isSuccess ? 'text-[#34D399]' :
                                        isWarning ? 'text-[#FDE047]' : 'text-[#D4D4D8]'
                                    }`}>
                                        {log.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default EnginePanel;