import React, { useEffect, useRef } from 'react';

const EnginePanel = ({ mt5Path, onPathChange, logs = [], isRunning, onToggle }) => {
    
    const scrollViewportRef = useRef(null);

    // اسکرول خودکار به پایین
    useEffect(() => {
        if (scrollViewportRef.current) {
            const { scrollHeight, clientHeight } = scrollViewportRef.current;
            if (scrollHeight > clientHeight) {
                scrollViewportRef.current.scrollTop = scrollHeight;
            }
        }
    }, [logs]);

    const choosePath = async () => {
        if(window.eel) {
            const path = await window.eel.choose_mt5_path()();
            if(path) onPathChange(path);
        }
    };

    return (
        <div className="flex flex-col gap-6 font-sans h-full">
            
            {/* --- Control Center (ثابت) --- */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px] shrink-0 group shadow-xl">
                <div className={`absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent blur-2xl transition-opacity duration-700 ${isRunning ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent transition-opacity duration-700 ${isRunning ? 'opacity-100' : 'opacity-0'}`}></div>

                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 relative z-10">Trading Engine</h3>
                
                <button 
                    onClick={onToggle} 
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 outline-none ${
                        isRunning 
                        ? 'bg-emerald-500 text-white shadow-[0_0_50px_-10px_#10b981] scale-105' 
                        : 'bg-[#18181b] border-2 border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all duration-500 ${isRunning ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    
                    {isRunning && (
                        <span className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-50"></span>
                    )}
                </button>
                
                <div className="mt-5 relative z-10 flex flex-col items-center h-10 justify-start">
                    <span className={`text-xs font-bold transition-all duration-300 ${isRunning ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500'}`}>
                        {isRunning ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                    </span>
                    <span className={`text-[9px] text-emerald-500/60 mt-1 font-mono transition-opacity duration-300 ${isRunning ? 'opacity-100' : 'opacity-0'}`}>
                        Processing Ticks...
                    </span>
                </div>
            </div>

            {/* --- Path Settings (ثابت) --- */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Terminal Path</label>
                    <span className={`w-2 h-2 rounded-full ${mt5Path ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </div>
                <div className="flex gap-2 bg-[#09090b] p-1.5 rounded-xl border border-white/5 focus-within:border-emerald-500/30 transition-colors">
                    <input 
                        type="text" 
                        value={mt5Path || "Not Selected"} 
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none px-2 text-[10px] text-zinc-400 font-mono truncate" 
                    />
                    <button onClick={choosePath} className="px-3 bg-white/5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-bold transition-colors">
                        BROWSE
                    </button>
                </div>
            </div>

            {/* --- Console Logs --- */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-inner shrink-0">
                
                <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-[#151518] shrink-0">
                     <div className="flex items-center gap-2">
                         <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3" /></svg>
                         <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Execution Logs</h3>
                     </div>
                     <div className="flex gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                         <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                     </div>
                </div>
                
                {/* [تغییر]: افزایش ارتفاع از h-60 به h-96 (حدود 384 پیکسل) */}
                <div 
                    ref={scrollViewportRef}
                    className="h-96 overflow-y-auto custom-scroll p-4 font-mono text-[10px] space-y-1.5 bg-[#09090b]/50 scroll-smooth"
                >
                    <div className="text-zinc-600 border-l-2 border-zinc-800 pl-2">System Initialized. Waiting for commands...</div>
                    {logs.map((log, index) => (
                        <div key={index} className={`pl-2 border-l-2 leading-relaxed break-words animate-fade-in ${
                            log.color.includes('rose') ? 'border-rose-500/50 text-rose-400 bg-rose-500/5 py-1 pr-1' : 
                            log.color.includes('emerald') ? 'border-emerald-500/50 text-emerald-400' : 
                            log.color.includes('yellow') ? 'border-yellow-500/50 text-yellow-400' : 'border-zinc-700 text-zinc-400'
                        }`}>
                            <span className="opacity-50 text-[9px] mr-2">[{log.time}]</span>
                            {log.message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EnginePanel;