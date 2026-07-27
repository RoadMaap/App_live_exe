import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Copy, Check, ArrowRight, LogIn } from 'lucide-react';
import { LoginProps } from './Login.types';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    // State management for software ID, authentication, and network status
    const [swid, setSwid] = useState<string>('Fetching connection...');
    const [statusMsg, setStatusMsg] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(true); // Update this based on actual network connectivity

    // Fetch the software ID on component mount
    useEffect(() => {
        const fetchSwid = async () => {
            if (window.eel?.get_hwid_frontend) {
                try {
                    const id = await window.eel.get_hwid_frontend()();
                    setSwid(id);
                } catch (error) {
                    setSwid('Connection Error');
                }
            }
        };
        fetchSwid();
    }, []);

    // Handle copying SWID to clipboard with subtle visual feedback
    const handleCopySWID = useCallback(() => {
        navigator.clipboard.writeText(swid);
        setIsCopied(true);
        setStatusMsg('ID copied to clipboard');
        
        setTimeout(() => {
            setIsCopied(false);
            setStatusMsg('');
        }, 2000);
    }, [swid]);

    // Handle the authentication attempt
    const handleLogin = async () => {
        setIsLoading(true);
        setStatusMsg('');
        
        if (window.eel?.attempt_login) {
            try {
                const response = await window.eel.attempt_login()();
                if (response.success) {
                    setStatusMsg('Access Granted');
                    setTimeout(() => {
                        onLoginSuccess(); 
                    }, 800);
                } else {
                    throw new Error(response.message || 'Invalid License');
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Connection Error';
                setStatusMsg(errorMessage);
                setIsLoading(false);
            }
        } else {
            // Mock delay for UI testing and development
            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
        }
    };

    return (
        /* Primary Background: Deep minimalist dark, strict LTR structure */
        <div dir="ltr" className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans text-zinc-100 selection:bg-emerald-500/30">
            
            {/* Main Panel: Fluent depth (shadow-2xl) + Brutalist structure (clear borders) */}
            <div className="w-full max-w-[380px] bg-[#121215] border border-white/10 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Subtle top highlight for premium feel */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <div className="p-8">
                    {/* Header Section */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-14 h-14 bg-[#18181b] border border-white/5 rounded-xl flex items-center justify-center shadow-inner mb-5">
                            <LogIn className="w-6 h-6 text-emerald-500" strokeWidth="2" />
                        </div>
                        
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
                            RoadMap <span className="text-emerald-500">Trading</span>
                        </h1>
                        <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">
                            Empowering your journey into financial markets
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2.5 px-1">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Fingerprint className="w-3.5 h-3.5" />
                                Software ID
                            </label>
                            
                            <span className={`text-[11px] font-bold tracking-wide transition-opacity duration-200 ${
                                statusMsg ? 'opacity-100' : 'opacity-0'
                            } ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {statusMsg || 'Ready'}
                            </span>
                        </div>
                        
                        {/* Software ID Field */}
                        <div className="relative flex items-center w-full bg-[#09090b] border border-white/10 rounded-xl transition-colors focus-within:border-zinc-500 hover:border-white/20">
                            <input 
                                type="text" 
                                value={swid} 
                                readOnly 
                                className="w-full bg-transparent border-none text-[13px] font-mono text-zinc-300 py-3.5 px-4 pr-12 text-left focus:ring-0 outline-none truncate"
                            />
                            {swid !== 'Fetching connection...' && (
                                <button 
                                    onClick={handleCopySWID}
                                    className="absolute right-1.5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors"
                                    aria-label="Copy Software ID"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Button: w-full makes it exactly the same width as the input field */}
                    <button 
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 py-3.5 rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <span className="leading-none pt-[1px]">Sign In</span>
                                <ArrowRight className="w-4 h-4 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

                {/* Footer Section */}
                <div className="px-8 py-4 bg-[#0e0e11] border-t border-white/5 flex justify-end items-center text-[11px] font-medium">
                    <div className="flex items-center gap-1">
                        <span className="text-zinc-500">System</span>
                        {isOnline ? (
                            <span className="text-[#10b981] animate-pulse">Online</span>
                        ) : (
                            <span className="text-[#ef467e]">Offline</span>
                        )}
                    </div>
                </div>
                
            </div>
        </div>
    );
};