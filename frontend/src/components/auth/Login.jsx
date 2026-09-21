import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Login Component
 * Microsoft Fluent 2 Dark Bloom interface with integrated progress telemetry.
 * The indeterminate progress bar is embedded directly within the status alert box.
 */
const Login = ({ onLoginSuccess }) => {
    const { lang, toggleLanguage } = useLanguage();
    const { isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleWebLogin = async () => {
        setIsLoading(true);
        setErrorMsg("");
        
        // Show soft sliding notification
        setStatusMessage(lang === 'fa' ? "در حال هدایت به مرورگر وب..." : "Redirecting to your browser...");

        const TIMEOUT_DURATION = 60000;
        let isTimedOut = false;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            isTimedOut = true;
            setIsLoading(false);
            setStatusMessage("");
            setErrorMsg(
                lang === 'fa'
                    ? "پاسخی از مرورگر دریافت نشد (پایان مهلت ۶۰ ثانیه). لطفاً مجدداً تلاش کنید."
                    : "Operation timed out after 60 seconds. Please try again."
            );
        }, TIMEOUT_DURATION);

        if (window.eel) {
            try {
                const result = await window.eel.attempt_login()();
                
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                if (isTimedOut) return;

                if (result?.success) {
                    setStatusMessage(lang === 'fa' ? "ورود تایید شد. در حال بارگذاری..." : "Signed in successfully. Loading...");
                    setTimeout(() => {
                        onLoginSuccess();
                    }, 800);
                } else {
                    setErrorMsg(
                        result?.message || 
                        (lang === 'fa' ? "زمان نشست ورود به پایان رسید یا لغو شد." : "The sign-in request timed out or was cancelled.")
                    );
                    setStatusMessage("");
                    setIsLoading(false);
                }
            } catch (err) {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                if (!isTimedOut) {
                    console.error("Authentication Exception:", err);
                    setErrorMsg(lang === 'fa' ? "ارتباط با هسته سیستم برقرار نشد." : "Unable to reach core runtime service.");
                    setStatusMessage("");
                    setIsLoading(false);
                }
            }
        } else {
            // Standalone preview fallback
            setTimeout(() => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                onLoginSuccess();
            }, 1000);
        }
    };

    const handleCancel = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsLoading(false);
        setStatusMessage("");
        setErrorMsg(lang === 'fa' ? "عملیات ورود توسط کاربر لغو شد." : "Sign-in operation cancelled by user.");
    };

    const handleDevBypass = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        onLoginSuccess();
    };

    return (
        <div 
            className="app-shell min-h-screen w-full flex flex-col justify-between select-none relative overflow-hidden font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif]"
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
        >
            {/* Ambient Bloom Glows */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#107C41]/12 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#0078D4]/10 blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-black/40 blur-[100px] pointer-events-none" />

            {/* Precision Financial Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 80%)'
                }}
            />

            {/* Top Balancer */}
            <div className="w-full h-10 relative z-10" />

            {/* Authentication Card */}
            <main className="w-full max-w-[430px] mx-auto px-4 relative z-20 my-auto">
                <div className="bg-[#18191D]/80 backdrop-blur-2xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-[8px] relative overflow-hidden">

                    <div className="p-8 sm:p-10">
                        {/* Brand Identification */}
                        <div className="flex items-center gap-3 mb-6">
                            <div 
                                onDoubleClick={handleDevBypass}
                                className="w-9 h-9 rounded-[4px] bg-[#222327] border border-[#3A3B40] flex items-center justify-center p-1.5 cursor-pointer hover:border-[#107C41] transition-colors shadow-sm overflow-hidden"
                                title="RoadMaps Identity (Double-click for Dev Bypass)"
                            >
                                <img 
                                    src={isDark ? "/logo.png" : "/darklogo.png"}
                                    alt="RoadMaps Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-sm font-semibold tracking-tight text-[#E1DFDD]">
                                RoadMaps Workstation
                            </span>
                        </div>

                        {/* Heading Section */}
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
                            {lang === 'fa' ? "ورود به سیستم" : "Sign in"}
                        </h1>
                        <p className="text-xs text-[#A19F9D] leading-relaxed mb-6">
                            {lang === 'fa' 
                                ? "جهت احراز هویت و برقراری ارتباط با هسته معاملاتی، وارد حساب خود شوید."
                                : "Authenticate your session to connect with the algorithmic engine."}
                        </p>

                        {/* Smooth Expanding Status Message InfoBar with Integrated Progress Line */}
                        <div className={`overflow-hidden transition-all duration-300 ease-out transform ${
                            statusMessage 
                                ? 'max-h-24 opacity-100 mb-5 translate-y-0' 
                                : 'max-h-0 opacity-0 mb-0 -translate-y-2 pointer-events-none'
                        }`}>
                            <div className="rounded-[4px] bg-[#107C41]/15 border border-[#107C41]/40 overflow-hidden shadow-sm relative">
                                <div className="px-3.5 py-3 flex items-center justify-between">
                                    <span className="text-xs text-[#34D399] font-medium">{statusMessage}</span>
                                </div>
                                
                                {/* Integrated Indeterminate Progress Bar */}
                                <div className="h-[2px] w-full bg-[#107C41]/20 overflow-hidden">
                                    <div className="h-full bg-[#107C41] w-1/3 animate-[fluentProgress_1.5s_infinite_ease-in-out]" />
                                </div>
                            </div>
                        </div>

                        {/* Smooth Expanding Error Message InfoBar */}
                        <div className={`overflow-hidden transition-all duration-300 ease-out transform ${
                            errorMsg 
                                ? 'max-h-28 opacity-100 mb-5 translate-y-0' 
                                : 'max-h-0 opacity-0 mb-0 -translate-y-2 pointer-events-none'
                        }`}>
                            <div className="p-3 rounded-[4px] bg-[#C42B1C]/15 border border-[#C42B1C]/40 flex items-start gap-2.5 shadow-sm">
                                <svg className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-[#F87171] leading-relaxed">{errorMsg}</span>
                            </div>
                        </div>

                        {/* Command Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            {isLoading && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 rounded-[4px] text-xs font-semibold text-[#CCCCCC] hover:text-white bg-[#26272B] hover:bg-[#323338] border border-[#3E3F45] transition-colors cursor-pointer shadow-sm"
                                >
                                    {lang === 'fa' ? "انصراف" : "Cancel"}
                                </button>
                            )}

                            <button
                                onClick={handleWebLogin}
                                disabled={isLoading}
                                className={`w-full sm:w-auto min-w-[130px] px-6 py-2 rounded-[4px] text-xs font-semibold text-white transition-all duration-150 shadow-sm flex items-center justify-center gap-2 ${
                                    isLoading 
                                        ? "bg-[#2A2B30] text-[#797775] border border-[#3E3F45] cursor-not-allowed"
                                        : "bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] border border-[#107C41] cursor-pointer"
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-[#797775]" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>{lang === 'fa' ? "در حال انتظار..." : "Waiting..."}</span>
                                    </>
                                ) : (
                                    <span>{lang === 'fa' ? "ورود با مرورگر" : "Sign in with Browser"}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer Options Strip */}
                    <div className="px-8 sm:px-10 py-3 bg-[#131417]/90 border-t border-white/5 flex items-center justify-between">
                        <button 
                            type="button"
                            onClick={handleDevBypass}
                            className="flex items-center gap-2 text-xs text-[#A19F9D] hover:text-white transition-colors cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 text-[#797775]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>{lang === 'fa' ? "گزینه‌های ورود (حالت توسعه)" : "Sign-in options"}</span>
                        </button>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="w-full px-6 py-5 flex items-center justify-center relative z-20">
                <button
                    type="button"
                    onClick={toggleLanguage}
                    className="px-3.5 py-1.5 rounded-[4px] border border-white/10 hover:border-white/20 bg-[#16171B]/80 hover:bg-[#1F2025] text-[#CCCCCC] hover:text-white text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer backdrop-blur-md"
                >
                    <svg className="w-3.5 h-3.5 text-[#A19F9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>{lang === 'fa' ? 'فارسی (ایران)' : 'English (United States)'}</span>
                </button>
            </footer>

            {/* Progress Keyframe */}
            <style jsx>{`
                @keyframes fluentProgress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default Login;