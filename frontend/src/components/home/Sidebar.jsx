import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Sidebar Component
 * Engineered following Microsoft Fluent 2 / WinUI 3 NavigationPane specifications.
 * Incorporates dark bloom lighting, precision grid textures, and stationary icon geometry.
 */
const Sidebar = ({ 
    status, 
    activeTab, 
    onTabChange, 
    isCollapsed: controlledCollapsed, 
    onToggleCollapse 
}) => {
    const { t, lang } = useLanguage();
    const { isDark } = useTheme();
    const isRtl = lang === 'fa';

    // Internal fallback collapse state
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

    const handleToggle = () => {
        if (onToggleCollapse) {
            onToggleCollapse();
        } else {
            setInternalCollapsed(prev => !prev);
        }
    };

    /**
     * Resolve system status indicators (Clean, centered vector icons)
     */
    const getStatusConfig = () => {
        if (status === "Running") {
            return {
                boxStyle: "bg-[#107C41]/15 border-[#107C41]/40 text-[#34D399]",
                dotColor: "bg-[#107C41]",
                ping: true,
                label: t('running') || "RUNNING",
                icon: (
                    <svg className="w-4 h-4 text-[#34D399] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                )
            };
        } else if (status === "Ready") {
            return {
                boxStyle: "bg-[#0078D4]/15 border-[#0078D4]/40 text-[#60A5FA]",
                dotColor: "bg-[#0078D4]",
                ping: false,
                label: t('ready') || "READY",
                icon: (
                    <svg className="w-4 h-4 text-[#60A5FA] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                )
            };
        }
        return {
            boxStyle: "bg-[#18191D] border-white/10 text-[#A19F9D]",
            dotColor: "bg-[#797775]",
            ping: false,
            label: t('stopped') || "STOPPED",
            icon: (
                <svg className="w-4 h-4 text-[#797775] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        };
    };

    const statusConfig = getStatusConfig();

    const navItems = [
        {
            id: 'dashboard',
            label: t('overview') || 'Overview',
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            id: 'strategies',
            label: t('strategy_manager') || 'Strategy Manager',
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {
            id: 'education',
            label: t('education_tab') || 'AI Builder',
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
        {
            id: 'analyze',
            label: t('analyze_chart') || 'Analyze Chart',
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        }
    ];

    return (
        <aside 
            className={`app-sidebar h-full bg-[var(--bg-sidebar)] text-[#F3F2F1] border-r border-white/10 flex flex-col justify-between font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] select-none relative overflow-hidden transition-[width] duration-200 ease-out shrink-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
                isCollapsed ? 'w-[72px]' : 'w-[220px] xl:w-[clamp(72px,18vw,270px)]'
            }`}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* ------------------------------------------------------------- */}
            {/* ATMOSPHERIC BACKGROUND LAYERS                                  */}
            {/* ------------------------------------------------------------- */}
            
            {/* Ambient Bloom Lights matching Login */}
            <div className="absolute top-[-50px] left-[-50px] w-64 h-64 rounded-full bg-[#107C41]/10 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 rounded-full bg-[#0078D4]/10 blur-[100px] pointer-events-none" />

            {/* Subtle Precision Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '36px 36px',
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)'
                }}
            />

            {/* ------------------------------------------------------------- */}
            {/* TOP SHELL: Header, Status, Navigation Items                  */}
            {/* ------------------------------------------------------------- */}
            <div className="relative z-10 w-full max-w-full">
                
                {/* Header: Exact 85px alignment */}
                <div className="app-sidebar-header h-[85px] border-b border-white/10 flex items-center px-4 gap-3 bg-[#131418]/60 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="w-10 h-10 rounded-[4px] bg-[#18191D] hover:bg-[#23242A] active:bg-[#2A2C32] border border-white/5 hover:border-white/15 text-[#CCCCCC] hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm"
                        title={isCollapsed ? (lang === 'fa' ? "باز کردن منو" : "Expand") : (lang === 'fa' ? "بستن منو" : "Collapse")}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? (lang === 'fa' ? "باز کردن منو" : "Expand sidebar") : (lang === 'fa' ? "بستن منو" : "Collapse sidebar")}
                    >
                        <svg className="w-5 h-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={isCollapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
                        </svg>
                    </button>

                    {/* Brand Identity */}
                    <div className={`flex items-center gap-2.5 min-w-0 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-150 ease-out ${
                        isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[220px] opacity-100'
                    }`}>
                        <div className="w-7 h-7 rounded-[4px] bg-[#222327] border border-[#3A3B40] flex items-center justify-center p-1 shrink-0 shadow-sm">
                            <img 
                                src={isDark ? "/logo.png" : "/darklogo.png"} 
                                alt="Logo" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-xs font-semibold tracking-tight text-[#E1DFDD]">
                            RoadMaps App
                        </span>
                    </div>
                </div>

                {/* Connection Status Section: Centered in collapsed mode */}
                <div className="px-4 pt-4 pb-2">
                    <div className="h-10 flex items-center">
                        {isCollapsed ? (
                            <div 
                                className={`w-10 h-10 rounded-[4px] border flex items-center justify-center transition-all cursor-pointer shadow-sm ${statusConfig.boxStyle}`}
                                title={`${t('connection_status') || 'Status'}: ${statusConfig.label}`}
                            >
                                {statusConfig.icon}
                            </div>
                        ) : (
                            <div className={`w-full h-10 px-3 rounded-[4px] border flex items-center justify-between shadow-sm transition-all backdrop-blur-sm ${statusConfig.boxStyle}`}>
                                <div className="flex items-center gap-2.5 truncate">
                                    {statusConfig.icon}
                                    <span className="text-xs font-semibold tracking-wide truncate">
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
                                    {statusConfig.ping && (
                                        <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-ping absolute`} />
                                    )}
                                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Items: Stationary icon positioning */}
                <nav className="px-4 pt-2 space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                title={isCollapsed ? item.label : undefined}
                                className={`group relative h-10 rounded-[4px] flex items-center transition-all duration-150 cursor-pointer overflow-hidden ${
                                    isCollapsed ? 'w-10 justify-center' : 'w-full px-3 gap-3'
                                } ${
                                    isActive
                                        ? 'bg-[#18191D] text-white font-semibold border border-white/15 shadow-sm backdrop-blur-sm'
                                        : 'bg-transparent text-[#A19F9D] hover:text-white hover:bg-white/[0.04] border border-transparent'
                                }`}
                            >
                                {/* Active Indicator Strip */}
                                {isActive && (
                                    <div 
                                        className={`absolute top-2 bottom-2 w-[3px] bg-[#107C41] rounded-full shadow-[0_0_8px_#107C41] ${
                                            isRtl ? 'right-0' : 'left-0'
                                        }`} 
                                    />
                                )}

                                <span className={`shrink-0 ${isActive ? 'text-[#34D399]' : 'text-[#797775] group-hover:text-white'} transition-colors`}>
                                    {item.icon}
                                </span>
                                
                                <span className={`text-xs tracking-tight whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                                    isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'
                                }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* BOTTOM FOOTER SECTION: Site Link + Language Switcher           */}
            {/* ------------------------------------------------------------- */}
            <div className="app-sidebar-footer relative z-10 w-full max-w-full border-t border-white/10 px-4 py-3.5 flex flex-col gap-2 bg-[#131418]/60 backdrop-blur-md">
                
                {/* 1. Website Link */}
                <div className="h-10 flex items-center">
                    {isCollapsed ? (
                        <a
                            href="https://roadmaps.ir"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-[4px] border border-white/10 hover:border-white/20 bg-[#18191D] hover:bg-[#23242A] text-[#A19F9D] hover:text-white flex items-center justify-center transition-colors shadow-sm"
                            title="roadmaps.ir"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </a>
                    ) : (
                        <a
                            href="https://roadmaps.ir"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-10 px-3 rounded-[4px] border border-white/10 hover:border-white/20 bg-[#18191D] hover:bg-[#23242A] text-[#CCCCCC] hover:text-white text-xs transition-colors flex items-center justify-between shadow-sm whitespace-nowrap"
                        >
                            <span className="font-medium">roadmaps.ir</span>
                            <svg className="w-3.5 h-3.5 text-[#797775]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;