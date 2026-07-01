import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const RiskPanel = ({ initialData }) => {
    const { t } = useLanguage();
    
    // --- State Management ---
    const [isSaving, setIsSaving] = useState(false);
    
    // Warm-up Phase State
    const [wuEnabled, setWuEnabled] = useState(true);
    const [wuCandles, setWuCandles] = useState('500');

    // Breakeven State
    const [beEnabled, setBeEnabled] = useState(false);
    const [beTrigger, setBeTrigger] = useState('1.0');
    
    // Partial Close State
    const [pcEnabled, setPcEnabled] = useState(false);
    const [pcVolume, setPcVolume] = useState('50');
    const [pcTrigger, setPcTrigger] = useState('2.0');

    // Target Lock State
    const [tlEnabled, setTlEnabled] = useState(false);
    const [tlTrigger, setTlTrigger] = useState('10200.0');

    // --- Component Initialization ---
    useEffect(() => {
        if (initialData) {
            // Initialize Warm-up variables
            setWuEnabled(initialData.wu_enabled !== undefined ? initialData.wu_enabled : true);
            setWuCandles(initialData.wu_candles || '500');

            // Initialize Breakeven variables
            setBeEnabled(initialData.be_enabled || false);
            setBeTrigger(initialData.be_trigger || '1.0');
            
            // Initialize Partial Close variables
            setPcEnabled(initialData.pc_enabled || false);
            setPcVolume(initialData.pc_volume || '50');
            setPcTrigger(initialData.pc_trigger || '2.0');
            
            // Initialize Target Lock variables
            setTlEnabled(initialData.tl_enabled || false);
            setTlTrigger(initialData.tl_trigger || '10200.0');
        }
    }, [initialData]);

    // Save configuration handler
    const handleSave = async () => {
        setIsSaving(true);
        const config = {
            mt5_path: initialData?.mt5_path || "",
            wu_enabled: wuEnabled,
            wu_candles: wuCandles,
            be_enabled: beEnabled,
            be_trigger: beTrigger,
            pc_enabled: pcEnabled,
            pc_volume: pcVolume,
            pc_trigger: pcTrigger,
            tl_enabled: tlEnabled,
            tl_trigger: tlTrigger
        };
        
        if (window.eel) await window.eel.save_user_config(config)();
        setTimeout(() => setIsSaving(false), 800);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#121215] shadow-xl h-full min-h-[500px] flex flex-col group">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

            {/* Scrollable Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scroll relative z-10">
                
                {/* Header Section */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c1c20] to-black border border-white/10 flex items-center justify-center shadow-inner">
                        {/* 100% Safe Shield Icon without problematic SVG arcs */}
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{t('global_risk') || "Global Risk Management"}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">{t('global_risk_desc') || "Auto-safety rules for all trades"}</p>
                    </div>
                </div>

                {/* Advanced Settings Toggles */}
                <div className="space-y-4">
                    
                    {/* 0. Warm-Up System Toggle (Violet Theme) */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${wuEnabled ? 'bg-violet-500/[0.03] border-violet-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-start gap-3">
                                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                                    <input type="checkbox" checked={wuEnabled} onChange={(e) => setWuEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500 peer-checked:after:bg-white"></div>
                                </label>
                                <div className="flex flex-col">
                                    <span className={`text-xs font-bold transition-colors ${wuEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('warmup_system') || "Engine Warm-up Phase"}</span>
                                    <span className="text-[9px] text-zinc-500 mt-1">{t('warmup_desc') || "Maintains algorithm rhythm by pre-calculating historical data."}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${wuEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('candles') || "Candles:"}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-violet-500/30 transition-colors">
                                <input type="number" value={wuCandles} onChange={(e) => setWuCandles(e.target.value)} placeholder="500" className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                            </div>
                        </div>
                    </div>

                    {/* 1. Breakeven Toggle (Emerald Theme) */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${beEnabled ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={beEnabled} onChange={(e) => setBeEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${beEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('auto_breakeven') || "Auto Breakeven"}</span>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${beEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('trigger') || "Trigger:"}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-emerald-500/30 transition-colors">
                                <input type="number" value={beTrigger} onChange={(e) => setBeTrigger(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">R</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Partial Close Toggle (Blue Theme) */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${pcEnabled ? 'bg-blue-500/[0.03] border-blue-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={pcEnabled} onChange={(e) => setPcEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${pcEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('partial_close') || "Partial Close"}</span>
                            </div>
                        </div>
                        <div className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${pcEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                             <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-3 h-9 focus-within:border-blue-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-600 font-bold mr-2 w-6">{t('vol') || "Vol:"}</span>
                                <input type="number" value={pcVolume} onChange={(e) => setPcVolume(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">%</span>
                            </div>
                            <div className="flex items-center bg-[#09090b] rounded-lg border border-white/10 px-3 h-9 focus-within:border-blue-500/30 transition-colors">
                                <span className="text-[9px] text-zinc-600 font-bold mr-2 w-6">{t('at') || "At:"}</span>
                                <input type="number" value={pcTrigger} onChange={(e) => setPcTrigger(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[9px] text-zinc-600 font-bold ml-1">R</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Equity Lock Toggle (Amber Theme) */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${tlEnabled ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-[#151518] border-white/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={tlEnabled} onChange={(e) => setTlEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                                </label>
                                <span className={`text-xs font-bold transition-colors ${tlEnabled ? 'text-white' : 'text-zinc-500'}`}>{t('target_lock') || "Target Lock"}</span>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${tlEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold w-16">{t('target_value') || "Target Equity:"}</span>
                            <div className="flex-1 flex items-center bg-[#09090b] rounded-lg border border-white/10 px-2 h-9 focus-within:border-amber-500/30 transition-colors">
                                <input type="number" value={tlTrigger} onChange={(e) => setTlTrigger(e.target.value)} placeholder="10200" className="w-full bg-transparent border-none outline-none text-xs font-mono text-zinc-200" />
                                <span className="text-[10px] text-amber-600 font-bold ml-2">$</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer / Save Button Section */}
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
                            <span>{t('save_config') || "Save Config"}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RiskPanel;