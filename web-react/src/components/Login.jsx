import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Login = ({ onLoginSuccess }) => {
    const { t } = useLanguage();
    const [hwid, setHwid] = useState('Fetching HWID...');
    const [statusMsg, setStatusMsg] = useState('');
    const [statusType, setStatusType] = useState(''); // success | error
    const [isLoading, setIsLoading] = useState(false);

    // دریافت HWID هنگام لود شدن
    useEffect(() => {
        const fetchHwid = async () => {
            if (window.eel) {
                try {
                    const id = await window.eel.get_hwid_frontend()();
                    setHwid(id);
                } catch (e) {
                    setHwid("Connection Error");
                }
            }
        };
        fetchHwid();
    }, []);

    // کپی کردن HWID
    const copyHWID = () => {
        navigator.clipboard.writeText(hwid);
        setStatusMsg("ID copied to clipboard");
        setStatusType('success');
        setTimeout(() => setStatusMsg(''), 2000);
    };

    // تلاش برای لاگین
    const handleLogin = async () => {
        setIsLoading(true);
        setStatusMsg('');
        
        if (window.eel) {
            try {
                const response = await window.eel.attempt_login()();
                if (response.success) {
                    setStatusMsg("Access Granted");
                    setStatusType('success');
                    setTimeout(() => {
                        onLoginSuccess(); 
                    }, 800);
                } else {
                    throw new Error(response.message || 'Invalid License');
                }
            } catch (e) {
                setStatusMsg(e.message || "Connection Error");
                setStatusType('error');
                setIsLoading(false);
            }
        } else {
            // حالت تست
            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            
            {/* Background Ambience (Similar to Dashboard) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[400px] bg-[#121215] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden group animate-fade-in-up">
                
                {/* Decorative Gradient Overlay */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

                <div className="p-8 relative z-10 flex flex-col items-center text-center">
                    
                    {/* Logo Box (Same style as StrategyPanel Header Icon) */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#1c1c20] to-[#000] border border-white/10 rounded-2xl flex items-center justify-center shadow-inner mb-6">
                        <svg className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>

                    {/* Titles */}
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                        {t('roadmap')} <span className="text-emerald-500">Pro</span>
                    </h1>
                    <p className="text-xs text-zinc-500 font-medium mb-8 max-w-[260px]">
                        Professional Algorithmic Trading Terminal
                    </p>

                    {/* HWID Section */}
                    <div className="w-full mb-6">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Hardware ID</label>
                            <span className={`text-[9px] font-bold transition-opacity ${statusMsg ? 'opacity-100' : 'opacity-0'} ${statusType === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {statusMsg || "Ready"}
                            </span>
                        </div>
                        
                        <div className="group relative flex items-center w-full bg-[#18181b] border border-white/5 rounded-xl transition-all focus-within:border-emerald-500/50 hover:border-white/10">
                            <div className="pl-3 text-zinc-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                            </div>
                            <input 
                                type="text" 
                                value={hwid} 
                                readOnly 
                                className="w-full bg-transparent border-none text-xs font-mono text-zinc-300 py-3.5 px-3 focus:ring-0 outline-none truncate"
                            />
                            <button 
                                onClick={copyHWID}
                                className="mr-1.5 p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                title="Copy HWID"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Action Button (Style like 'Import Strategy' button) */}
                    <button 
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <>
                                <span>Verify License</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer Strip */}
                <div className="bg-[#0e0e11] py-3 px-8 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span>Server Online</span>
                    </div>
                    <span>v2.5.0</span>
                </div>
            </div>
        </div>
    );
};

export default Login;