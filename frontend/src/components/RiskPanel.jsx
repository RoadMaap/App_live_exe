import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const RiskPanel = ({ initialData, nextNews }) => {
    const { t } = useLanguage();
    
    const [isSaving, setIsSaving] = useState(false);
    
    // --- Tooltip State (جلوگیری از تداخل راهنماها) ---
    const [activeTooltip, setActiveTooltip] = useState(null);
    
    const [wuEnabled, setWuEnabled] = useState(true);
    const [wuCandles, setWuCandles] = useState('500');

    // --- News Filter State ---
    const [nfEnabled, setNfEnabled] = useState(false);
    const [nfEur, setNfEur] = useState(true);
    const [nfUsd, setNfUsd] = useState(true);
    const [nfBefore, setNfBefore] = useState('30');
    const [nfAfter, setNfAfter] = useState('30');

    // --- Risk Management State ---
    const [beEnabled, setBeEnabled] = useState(false);
    const [beTrigger, setBeTrigger] = useState('1.0');
    
    const [pcEnabled, setPcEnabled] = useState(false);
    const [pcVolume, setPcVolume] = useState('50');
    const [pcTrigger, setPcTrigger] = useState('2.0');

    const [tlEnabled, setTlEnabled] = useState(false);
    const [tlTrigger, setTlTrigger] = useState('10200.0');

    useEffect(() => {
        if (initialData) {
            setWuEnabled(initialData?.wu_enabled !== undefined ? initialData.wu_enabled : true);
            setWuCandles(initialData?.wu_candles || '500');

            setNfEnabled(initialData?.nf_enabled || false);
            setNfEur(initialData?.nf_eur !== undefined ? initialData.nf_eur : true);
            setNfUsd(initialData?.nf_usd !== undefined ? initialData.nf_usd : true);
            setNfBefore(initialData?.nf_before || '30');
            setNfAfter(initialData?.nf_after || '30');

            setBeEnabled(initialData?.be_enabled || false);
            setBeTrigger(initialData?.be_trigger || '1.0');
            
            setPcEnabled(initialData?.pc_enabled || false);
            setPcVolume(initialData?.pc_volume || '50');
            setPcTrigger(initialData?.pc_trigger || '2.0');
            
            setTlEnabled(initialData?.tl_enabled || false);
            setTlTrigger(initialData?.tl_trigger || '10200.0');
        }
    }, [initialData]);

    const handleSave = async () => {
        setIsSaving(true);
        const config = {
            mt5_path: initialData?.mt5_path || "",
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
            await window.eel.save_user_config(config)();
        }
        setTimeout(() => setIsSaving(false), 800);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#121215] shadow-xl h-full min-h-[500px] flex flex-col group">
            <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

            <div className="flex-1 p-6 overflow-y-auto custom-scroll relative z-10">
                
                {/* Header Section */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c1c20] to-black border border-white/10 flex items-center justify-center shadow-inner">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{t('global_risk') || 'Global Risk Management'}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">{t('global_risk_desc') || 'Auto-safety rules for all trades'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    
                    {/* 1. Warm-Up System */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${wuEnabled ? 'bg-violet-500/[0.03] border-violet-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={wuEnabled} onChange={(e) => setWuEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500 peer-checked:after:bg-white"></div>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold transition-colors ${wuEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('warmup_system') || 'Engine Warm-up'}</span>
                                    
                                    {/* 🚨 FIX: Tightly bound strict React State Tooltip 🚨 */}
                                    <div 
                                        className="relative flex items-center justify-center w-5 h-5 rounded-full cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setActiveTooltip('warmup')}
                                        onMouseLeave={() => setActiveTooltip(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 transition-colors ${activeTooltip === 'warmup' ? 'text-violet-400' : 'text-zinc-500'}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-2.5 bg-zinc-800 text-zinc-200 text-[10px] leading-relaxed rounded-lg shadow-2xl z-[100] pointer-events-none border border-white/10 text-center transition-all duration-200 ease-out ${activeTooltip === 'warmup' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'}`}>
                                            {t('warmup_desc') || 'Pre-calculates indicators before starting.'}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${wuEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('candles') || 'Candles'}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-violet-500/30 transition-colors">
                                <input type="number" value={wuCandles} onChange={(e) => setWuCandles(e.target.value)} placeholder="500" className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Smart News Filter Block */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${nfEnabled ? 'bg-rose-500/[0.03] border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={nfEnabled} onChange={(e) => setNfEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white"></div>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold transition-colors ${nfEnabled ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-zinc-500'}`}>
                                        {t('news_filter') || 'Smart News Filter'}
                                    </span>
                                    
                                    {/* 🚨 FIX: Tightly bound strict React State Tooltip 🚨 */}
                                    <div 
                                        className="relative flex items-center justify-center w-5 h-5 rounded-full cursor-help hover:bg-white/5 transition-colors"
                                        onMouseEnter={() => setActiveTooltip('news')}
                                        onMouseLeave={() => setActiveTooltip(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 transition-colors ${activeTooltip === 'news' ? 'text-rose-400' : 'text-zinc-500'}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-2.5 bg-zinc-800 text-zinc-200 text-[10px] leading-relaxed rounded-lg shadow-2xl z-[100] pointer-events-none border border-white/10 text-center transition-all duration-200 ease-out ${activeTooltip === 'news' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'}`}>
                                            {t('news_filter_desc') || 'Halts trading during high-impact (RED) economic events.'}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {nfEnabled && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            )}
                        </div>

                        {/* Currencies Toggles */}
                        <div className={`flex items-center gap-3 mb-3 transition-opacity duration-300 ${nfEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <button onClick={() => setNfEur(!nfEur)} className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${nfEur ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-[#09090b] border-white/10 text-zinc-500 hover:border-white/20'}`}>
                                <span className={`w-2 h-2 rounded-full ${nfEur ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]' : 'bg-zinc-700'}`}></span>
                                EUR News
                            </button>
                            <button onClick={() => setNfUsd(!nfUsd)} className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${nfUsd ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-[#09090b] border-white/10 text-zinc-500 hover:border-white/20'}`}>
                                <span className={`w-2 h-2 rounded-full ${nfUsd ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]' : 'bg-zinc-700'}`}></span>
                                USD News
                            </button>
                        </div>

                        {/* Time Settings */}
                        <div className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${nfEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                             <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-rose-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold mr-2 w-20">{t('mins_before') || 'Mins Before'}</span>
                                <input type="number" value={nfBefore} onChange={(e) => setNfBefore(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200 text-right" />
                            </div>
                            <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-rose-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold mr-2 w-20">{t('mins_after') || 'Mins After'}</span>
                                <input type="number" value={nfAfter} onChange={(e) => setNfAfter(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200 text-right" />
                            </div>
                        </div>

                        {/* Embedded Ticker UI */}
                        {nextNews && nfEnabled && (
                            <div className="mt-3 p-2 bg-gradient-to-r from-rose-500/10 to-transparent rounded-lg border border-rose-500/20 flex flex-col gap-1 relative overflow-hidden group animate-fade-in">
                                <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 animate-pulse"></div>
                                <div className="flex items-center justify-between ml-2">
                                    <span className="text-[10px] font-bold text-rose-400 tracking-wide flex items-center gap-1.5">
                                        <span className="animate-pulse text-xs">🔥</span> {nextNews.currency} News
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${nextNews.countdown.includes('NOW') || nextNews.countdown.includes('انتشار') ? 'text-rose-400 animate-bounce' : 'text-rose-500'}`}>
                                        {nextNews.countdown}
                                    </span>
                                </div>
                                <span className="text-[9px] text-zinc-400 ml-2 truncate" title={nextNews.title}>{nextNews.title}</span>
                            </div>
                        )}
                    </div>

                    {/* 3. Breakeven Toggle */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${beEnabled ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={beEnabled} onChange={(e) => setBeEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${beEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('auto_breakeven') || 'Auto Breakeven'}</span>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${beEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('trigger') || 'Trigger:'}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-emerald-500/30 transition-colors">
                                <input type="number" value={beTrigger} onChange={(e) => setBeTrigger(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">R</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Partial Close Toggle */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${pcEnabled ? 'bg-blue-500/[0.03] border-blue-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={pcEnabled} onChange={(e) => setPcEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${pcEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('partial_close') || 'Partial Close'}</span>
                            </div>
                        </div>
                        <div className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${pcEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                             <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-3 h-9 focus-within:border-blue-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-600 font-bold mr-2 w-6">{t('vol') || 'Vol:'}</span>
                                <input type="number" value={pcVolume} onChange={(e) => setPcVolume(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">%</span>
                            </div>
                            <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-3 h-9 focus-within:border-blue-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-600 font-bold mr-2 w-6">{t('at') || '@'}</span>
                                <input type="number" value={pcTrigger} onChange={(e) => setPcTrigger(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">R</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Equity Lock Toggle */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${tlEnabled ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={tlEnabled} onChange={(e) => setTlEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${tlEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('target_lock') || 'Daily Target Lock'}</span>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${tlEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('target_value') || 'Target'}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-amber-500/30 transition-colors">
                                <input type="number" value={tlTrigger} onChange={(e) => setTlTrigger(e.target.value)} placeholder="10200" className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[10px] text-amber-600 font-bold ml-2">$</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Section - Save Button */}
            <div className="p-4 border-t border-white/5 bg-[#0e0e11] z-20 shrink-0">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isSaving ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0 -2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>{t('save_config') || 'Save Config'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RiskPanel;