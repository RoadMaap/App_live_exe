import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ status, activeTab, onTabChange }) => {
    const { t, lang } = useLanguage();

    const getStatusConfig = () => {
        if (status === "Running") {
            return {
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                text: "text-emerald-500",
                dot: "bg-emerald-500",
                label: t('running') || "RUNNING",
                animation: "animate-pulse"
            };
        } else if (status === "Ready") {
            return {
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                text: "text-blue-500",
                dot: "bg-blue-500",
                label: t('ready') || "READY",
                animation: ""
            };
        }
        return {
            bg: "bg-zinc-800/50",
            border: "border-zinc-700",
            text: "text-zinc-500",
            dot: "bg-zinc-600",
            label: t('stopped') || "STOPPED",
            animation: ""
        };
    };

    const statusConfig = getStatusConfig();

    return (
        <aside className="w-72 h-full bg-[#09090b] border-r border-white/5 flex flex-col relative z-30 shrink-0">
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none opacity-50"></div>

            <div className="p-6 relative z-10 flex flex-col h-full">
                {/* Logo & Branding */}
                <div className="flex items-center gap-3 mb-8 group cursor-pointer">
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-105">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {status === "Running" && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                            {t('roadmap')} <span className="text-emerald-500">{t('trader')}</span>
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('pro') || 'PRO EDITION'}</p>
                    </div>
                </div>

                {/* Connection Status Indicator */}
                <div className="mb-8">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 px-1">{t('connection_status') || 'Connection Status'}</div>
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${statusConfig.bg} ${statusConfig.border}`}>
                        <span className={`text-xs font-bold tracking-wide ${statusConfig.text}`}>
                            {statusConfig.label}
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dot}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dot}`}></span>
                        </span>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-6">
                    <div className="space-y-1">
                        {/* 1. Dashboard Tab */}
                        <button 
                            onClick={() => onTabChange('dashboard')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-bold' : 'text-zinc-500 hover:text-white hover:bg-white/5 font-medium'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-sm">{t('overview')}</span>
                        </button>

                        {/* 2. NEW TAB: AI Builder */}
                        <button 
                            onClick={() => onTabChange('education')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeTab === 'education' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-bold' : 'text-zinc-500 hover:text-white hover:bg-white/5 font-medium'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span className="text-sm">{t('education_tab') || 'AI Builder'}</span>
                            {/* Tiny spark icon to show it's an AI feature */}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-colors ${lang === 'fa' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'education' ? 'text-indigo-200 animate-pulse' : 'text-zinc-700 group-hover:text-indigo-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.64 5.93h1.43v4.28h4.28v1.43h-4.28v4.28h-1.43v-4.28H7.36v-1.43h4.28V5.93z"/>
                            </svg>
                        </button>

                        {/* 3. Strategy Manager Tab */}
                        <button 
                            onClick={() => onTabChange('strategies')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'strategies' ? 'bg-zinc-800 text-white shadow-lg font-bold border border-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5 font-medium'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm">{t('strategy_manager')}</span>
                        </button>
                    </div>
                </nav>

                {/* Footer Info */}
                <div className="pt-6 border-t border-white/5 mt-auto">
                    <div className="flex items-center justify-between text-zinc-500">
                        <span className="text-xs font-bold">RoadMap Terminal</span>
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded-md">{t('version')}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;