import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import StatCard from '../StatCard';
import Sparkline from '../Sparkline';
import RiskPanel from '../RiskPanel';
import EnginePanel from '../EnginePanel';
import StrategyPanel from '../StrategyPanel';
import EducationPanel from '../EducationPanel';
import ChartAnalyzer from '../ChartAnalyzer';

/**
 * Dashboard Component
 * Microsoft Fluent 2 desktop trading workstation.
 * Features synchronized header elevations, persistent telemetry bridges, and acrylic surface decks.
 */
const Dashboard = () => {
    const { t, toggleLanguage, lang } = useLanguage();
    const { isDark, toggleTheme } = useTheme();
    const isRtl = lang === 'fa';
    
    // Viewport reset reference
    const mainContentRef = useRef(null);
    
    // Core workstation states
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mt5Path, setMt5Path] = useState("");
    const [initialData, setInitialData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [strategies, setStrategies] = useState({});
    const [userName, setUserName] = useState('');
    
    // High-impact news event ticker
    const [nextNews, setNextNews] = useState(null);

    // Live execution engine state
    const [isRunning, setIsRunning] = useState(false);

    // Telemetry and equity trajectory tracking
    const [profitHistory, setProfitHistory] = useState(Array(15).fill(0));
    const [initialEquity, setInitialEquity] = useState(null);
    const [liveData, setLiveData] = useState({
        profit: 0.00,
        equity: 0.00,
        positions: 0
    });

    const update_news_ticker = useCallback((newsData) => {
        setNextNews(newsData);
    }, []);

    const update_status = useCallback((type, message) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let color = 'text-[#797775]';

        if (type === 'error') {
            color = 'text-[#F87171]';
            setIsRunning(false);
        } else if (type === 'success') {
            color = 'text-[#34D399]';
            if (message?.includes('فعال شد') || message?.includes('Active')) setIsRunning(true);
        } else if (type === 'warning') {
            color = 'text-[#FCE100]';
            if (message?.includes('توقف') || message?.includes('Stop') || message?.includes('Halting')) setIsRunning(false);
        }

        setLogs(prev => {
            const newLogs = [...(prev || []), { time, message: message || '', color }];
            return newLogs.length > 100 ? newLogs.slice(newLogs.length - 100) : newLogs;
        });
    }, []);

    const update_dashboard = useCallback((profit, equity, positions) => {
        const p = parseFloat(profit) || 0.00;
        const e = parseFloat(equity) || 0.00;
        setLiveData({ profit: p, equity: e, positions: positions || 0 });
        setProfitHistory(prev => {
            const newHist = [...(prev || []), p];
            if (newHist.length > 20) newHist.shift();
            return newHist;
        });
        setInitialEquity(previousEquity => (
            previousEquity === null && e > 0 ? e - p : previousEquity
        ));
    }, []);

    useEffect(() => {
        const fetchInit = async () => {
            if (window.eel) {
                try {
                    const data = await window.eel.get_initial_data()();
                    if (data) {
                        setInitialData(data);
                        setMt5Path(data?.mt5_path || "");
                        if (data?.strategies) {
                            setStrategies(data.strategies);
                        }
                    }

                    const authStatus = await window.eel.get_auth_status()();
                    const authenticatedUserName = authStatus?.profile?.username;
                    if (authenticatedUserName) setUserName(authenticatedUserName);
                } catch (error) {
                    console.error("Error fetching initial workstation telemetry:", error);
                }
            }
        };
        fetchInit();

        if (window.eel) {
            window.eel.expose(update_dashboard, 'update_dashboard');
            window.eel.expose(update_status, 'update_status');
            window.eel.expose(update_news_ticker, 'update_news_ticker');
        }

        return () => {
            if (window.eel) {
                delete window.update_dashboard;
                delete window.update_status;
                delete window.update_news_ticker;
            }
        };
    }, [update_dashboard, update_news_ticker, update_status]);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    const handleToggleEngine = async () => {
        if (!mt5Path) {
            update_status('error', 'MT5 Path not selected!');
            return;
        }

        if (isRunning) {
            setIsRunning(false);
            if (window.eel) await window.eel.stop_robot()();
        } else {
            setIsRunning(true);
            if (window.eel) await window.eel.start_robot()();
        }
    };

    const getEquityBar = () => {
        if (!initialEquity || initialEquity <= 0) return { width: '0%', isProfit: true, percent: "0.0" };
        const current = liveData?.equity || 0;
        if (current >= initialEquity) {
            let basePercent = (initialEquity / current) * 100;
            let profitPercent = 100 - basePercent;
            return { width: `${profitPercent}%`, isProfit: true, percent: profitPercent.toFixed(1) };
        } else {
            let remainingPercent = (current / initialEquity) * 100;
            let lossPercent = 100 - remainingPercent;
            return { width: `${remainingPercent}%`, isProfit: false, percent: lossPercent.toFixed(1) };
        }
    };
    const eqBar = getEquityBar();

    const handleStrategyConfigUpdate = (strategyName, newConfig) => {
        setStrategies(prev => ({
            ...prev,
            [strategyName]: {
                ...(prev?.[strategyName] || {}),
                config: newConfig
            }
        }));
        if (window.eel) window.eel.update_strategy_config(strategyName, 'config', newConfig);
    };

    return (
        <div 
            className="app-shell flex flex-col h-screen text-[#F3F2F1] font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] overflow-hidden select-none relative"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* ------------------------------------------------------------- */}
            {/* ATMOSPHERIC BACKGROUND LAYERS                                  */}
            {/* ------------------------------------------------------------- */}
            
            {/* Ambient Bloom Lights */}
            <div className="absolute top-[-80px] left-[20%] w-[600px] h-[600px] rounded-full bg-[#107C41]/8 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-100px] right-[15%] w-[650px] h-[650px] rounded-full bg-[#0078D4]/8 blur-[160px] pointer-events-none" />

            {/* Precision Institutional Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(circle at 50% 25%, black 40%, transparent 85%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 25%, black 40%, transparent 85%)'
                }}
            />

            {/* Main Application Container */}
            <div className="flex flex-1 overflow-hidden relative z-10">
                
                {/* Collapsible Microsoft Fluent Sidebar */}
                <Sidebar 
                    status={isRunning ? "Running" : (mt5Path ? "Ready" : "Disconnected")} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                {/* Primary Content Viewport (min-w-0 prevents layout jitter during transitions) */}
                <main 
                    ref={mainContentRef}
                    className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden relative"
                >
                    {/* Acrylic CommandBar Header (Synchronized 85px elevation) */}
                    <header className="h-[85px] shrink-0 border-b border-white/10 bg-[rgba(18,22,27,0.8)] backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 xl:px-8 z-20 sticky top-0 shadow-sm">
                        <div className="flex flex-col justify-center min-w-0 flex-1 pr-3">
                            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2 truncate">
                                {activeTab === 'dashboard' ? (userName || t('RoadMaps App')) : 
                                 activeTab === 'education' ? t('ai_builder_title') : 
                                 activeTab === 'analyze' ? (t('chart_analysis') || 'Chart Analysis') : 
                                 t('strategy_management')}
                            </h2>
                            {activeTab !== 'dashboard' && (
                                <p className="text-[10px] sm:text-[11px] text-[#A19F9D] leading-tight mt-0.5 truncate">
                                    {activeTab === 'education' ? t('ai_builder_subtitle') : 
                                     activeTab === 'analyze' ? t('upload_chart_screenshots') : 
                                     t('strategy_config_subtitle')}
                                </p>
                            )}
                        </div>

                        {/* Action Telemetry Header Group */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#18191D] border border-white/10 text-xs shadow-sm">
                                <span className="text-[11px] font-mono text-[#A19F9D] uppercase tracking-wider">
                                    {t('active_strategies')}
                                </span>
                                <div className="h-3 w-px bg-white/10" />
                                <span className="font-mono font-semibold text-[#34D399]">
                                    {Object.keys(strategies || {}).length.toString().padStart(2, '0')}
                                </span>
                            </div>
                            
                            {/* Localized Language Switcher */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="theme-toggle flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#18191D] hover:bg-[#23242A] border border-white/10 hover:border-white/20 text-[#CCCCCC] hover:text-white transition-colors shadow-sm cursor-pointer"
                                title={isDark ? (lang === 'fa' ? 'حالت روشن' : 'Light theme') : (lang === 'fa' ? 'حالت تاریک' : 'Dark theme')}
                                aria-label={isDark ? (lang === 'fa' ? 'فعال‌کردن تم روشن' : 'Enable light theme') : (lang === 'fa' ? 'فعال‌کردن تم تاریک' : 'Enable dark theme')}
                            >
                                {isDark ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                        <circle cx="12" cy="12" r="4" />
                                        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3l1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3l1.42-1.42" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1111.2 3 6.7 6.7 0 0021 12.8z" />
                                    </svg>
                                )}
                            </button>

                            <button 
                                onClick={toggleLanguage} 
                                className="flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-[4px] bg-[#18191D] hover:bg-[#23242A] border border-white/10 hover:border-white/20 text-[11px] sm:text-xs font-semibold text-[#CCCCCC] hover:text-white transition-colors shadow-sm cursor-pointer"
                                title="Switch Interface Language"
                            >
                                <span className="font-mono text-[11px]">{lang === 'fa' ? 'EN' : 'FA'}</span>
                            </button>
                        </div>
                    </header>

                    {/* Workspace Canvas Body */}
                    <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 xl:px-8 xl:py-6 z-10">
                        <div className="max-w-[1920px] mx-auto h-full flex flex-col">
                            
                            {/* TAB 1: DASHBOARD OVERVIEW */}
                            <div className={`space-y-5 ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                                
                                {/* Telemetry StatCards Deck */}
                                <div className="dashboard-telemetry rounded-[10px] border border-white/10 bg-[linear-gradient(135deg,rgba(36,36,36,0.96),rgba(24,25,29,0.96))] shadow-[0_8px_24px_rgba(0,0,0,0.2)] overflow-hidden">
                                    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.7)] shrink-0" />
                                            <span className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[#D7D5D3] truncate">
                                                {t('real_time_monitoring') || 'Account Overview'}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#797775] shrink-0">
                                            LIVE TELEMETRY
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#333333]">
                                    <StatCard 
                                        embedded
                                        title={t('net_profit_today')} 
                                        iconTone="text-[#107C41]"
                                        value={`$${(liveData?.profit || 0).toFixed(2)}`} 
                                        trend={(liveData?.profit || 0) > 0 ? 'up' : (liveData?.profit || 0) < 0 ? 'down' : 'neutral'} 
                                        subValue={(liveData?.profit || 0) !== 0 ? ((liveData?.profit || 0) > 0 ? `+${t('roi') || 'ROI'}` : `-${t('drawdown') || 'Drawdown'}`) : "0.0%"} 
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                                    >
                                        <div className="h-12 w-full mt-3 p-2 rounded-[4px] bg-[#18191D] border border-white/5 opacity-95 transition-opacity">
                                            <Sparkline data={profitHistory || []} color={(liveData?.profit || 0) >= 0 ? "#107C41" : "#C42B1C"} />
                                        </div>
                                    </StatCard>
                                    
                                    <StatCard 
                                        embedded
                                        title={t('account_balance')} 
                                        iconTone="text-[#0078D4]"
                                        value={`$${(liveData?.equity || 0).toFixed(2)}`}
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                                    >
                                        {/* Fluent Equity Progress Gauge */}
                                        <div className="h-12 w-full mt-3 p-2 rounded-[4px] bg-[#18191D] border border-white/5 flex flex-col justify-center">
                                            <div className="w-full bg-[#242428] h-2.5 rounded-[2px] overflow-hidden flex justify-start relative border border-white/5">
                                                {eqBar.isProfit ? (
                                                    <>
                                                        <div className="h-full bg-white/5 w-full" />
                                                        <div 
                                                            className="absolute h-full bg-[#107C41] transition-all duration-700 ease-out" 
                                                            style={{ width: eqBar.width, right: lang === 'fa' ? 'auto' : 0, left: lang === 'fa' ? 0 : 'auto' }} 
                                                        />
                                                    </>
                                                ) : (
                                                    <div 
                                                        className="h-full bg-[#C42B1C] transition-all duration-700 ease-out" 
                                                        style={{ width: eqBar.width }} 
                                                    />
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[9px] font-mono font-semibold text-[#797775] uppercase tracking-wider">
                                                    {t('equity_growth')}
                                                </span>
                                                <span className={`text-[10px] font-mono font-semibold ${eqBar.isProfit ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                                                    {eqBar.isProfit ? '+' : '-'}{eqBar.percent}%
                                                </span>
                                            </div>
                                        </div>
                                    </StatCard>
                                    
                                    <StatCard 
                                        embedded
                                        title={t('open_positions')} 
                                        iconTone="text-[#FCE100]"
                                        value={liveData?.positions || 0}
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                    >
                                        <div className="flex items-center gap-2 mt-3 h-12 p-2 rounded-[4px] bg-[#18191D] border border-white/5">
                                            <span className="relative flex h-2 w-2">
                                                {(liveData?.positions || 0) > 0 && (
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#107C41] opacity-75" />
                                                )}
                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${(liveData?.positions || 0) > 0 ? 'bg-[#107C41]' : 'bg-[#52525B]'}`} />
                                            </span>
                                            <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${(liveData?.positions || 0) > 0 ? 'text-[#34D399]' : 'text-[#797775]'}`}>
                                                {(liveData?.positions || 0) > 0 ? t('market_exposure_active') : t('no_exposure')}
                                            </span>
                                        </div>
                                    </StatCard>
                                    </div>
                                </div>

                                {/* Acrylic Workspace Panels */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 pb-6 min-h-[420px] xl:min-h-[520px]">
                                    <div className="xl:col-span-8 flex flex-col gap-5 min-w-0">
                                        <div className="bg-[#18191D]/80 backdrop-blur-xl border border-white/10 rounded-[8px] p-5 shadow-sm">
                                            <RiskPanel initialData={initialData} nextNews={nextNews} />
                                        </div>
                                    </div>
                                    
                                    <div className="xl:col-span-4 flex flex-col gap-5 min-w-0">
                                        <div className="bg-[#18191D]/80 backdrop-blur-xl border border-white/10 rounded-[8px] p-5 shadow-sm h-full">
                                            <EnginePanel 
                                                mt5Path={mt5Path} 
                                                onPathChange={setMt5Path} 
                                                logs={logs} 
                                                isRunning={isRunning}
                                                onToggle={handleToggleEngine}
                                                onClearLogs={() => setLogs([])}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* TAB 2: STRATEGY MANAGER */}
                            <div className={`h-full ${activeTab === 'strategies' ? 'block' : 'hidden'}`}>
                                <div className="bg-[#18191D]/80 backdrop-blur-xl border border-white/10 rounded-[8px] p-6 shadow-sm">
                                    <StrategyPanel 
                                        strategies={strategies}
                                        onStrategiesChange={setStrategies} 
                                        onUpdateConfig={handleStrategyConfigUpdate}
                                    />
                                </div>
                            </div>

                            {/* TAB 3: AI BUILDER / EDUCATION */}
                            <div className={`h-full ${activeTab === 'education' ? 'block' : 'hidden'}`}>
                                <div className="bg-[#18191D]/80 backdrop-blur-xl border border-white/10 rounded-[8px] p-6 shadow-sm">
                                    <EducationPanel />
                                </div>
                            </div>

                            {/* TAB 4: CHART ANALYZER */}
                            <div className={`h-full ${activeTab === 'analyze' ? 'block' : 'hidden'}`}>
                                <div className="bg-[#18191D]/80 backdrop-blur-xl border border-white/10 rounded-[8px] p-6 shadow-sm">
                                    <ChartAnalyzer />
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;