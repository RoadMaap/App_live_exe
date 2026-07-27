import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import Sparkline from './Sparkline';
import RiskPanel from './RiskPanel';
import EnginePanel from './EnginePanel';
import StrategyPanel from './StrategyPanel';
import EducationPanel from './EducationPanel';

const Dashboard = () => {
    const { t, toggleLanguage, lang } = useLanguage();
    
    // --- Refs ---
    const mainContentRef = useRef(null);
    
    // --- States ---
    const [mt5Path, setMt5Path] = useState("");
    const [initialData, setInitialData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [strategies, setStrategies] = useState({});
    
    // News Ticker State
    const [nextNews, setNextNews] = useState(null);

    // --- State Engine ---
    const [isRunning, setIsRunning] = useState(false);

    // Live Data
    const [profitHistory, setProfitHistory] = useState(Array(15).fill(0));
    const [initialEquity, setInitialEquity] = useState(null);
    const [liveData, setLiveData] = useState({
        profit: 0.00,
        equity: 0.00,
        positions: 0
    });

    useEffect(() => {
        const fetchInit = async () => {
            if(window.eel) {
                try {
                    const data = await window.eel.get_initial_data()();
                    if(data) {
                        setInitialData(data);
                        setMt5Path(data?.mt5_path || "");
                        if (data?.strategies) {
                            setStrategies(data.strategies);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching initial data from Eel:", error);
                }
            }
        };
        fetchInit();

        // Expose functions to python
        if(window.eel) {
            window.eel.expose(update_dashboard, 'update_dashboard');
            window.eel.expose(update_status, 'update_status');
            window.eel.expose(update_news_ticker, 'update_news_ticker'); 
        }
        
        return () => {
            if(window.eel) {
                delete window.update_dashboard;
                delete window.update_status;
                delete window.update_news_ticker;
            }
        };
    }, []);

    // Scroll to top when changing tabs
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    function update_news_ticker(newsData) {
        setNextNews(newsData);
    }

    function update_status(type, message) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        // Updated colors to match the muted bespoke palette
        let color = 'text-[#70707B]'; 
        
        if (type === 'error') {
            color = 'text-[#F87171]';
            setIsRunning(false); 
        }
        else if (type === 'success') {
            color = 'text-[#34D399]';
            if (message?.includes('فعال شد') || message?.includes('Active')) setIsRunning(true); 
        }
        else if (type === 'warning') {
            color = 'text-[#FBBF24]';
            if (message?.includes('توقف') || message?.includes('Stop') || message?.includes('Halting')) setIsRunning(false); 
        }
        
        setLogs(prev => {
            const newLogs = [...(prev || []), { time, message: message || '', color }];
            return newLogs.length > 100 ? newLogs.slice(newLogs.length - 100) : newLogs;
        });
    }

    const handleToggleEngine = async () => {
        if (!mt5Path) {
            update_status('error', 'MT5 Path not selected!');
            return;
        }

        if (isRunning) {
            setIsRunning(false);
            if(window.eel) await window.eel.stop_robot()();
        } else {
            setIsRunning(true);
            if(window.eel) await window.eel.start_robot()();
        }
    };

    function update_dashboard(profit, equity, positions) {
        const p = parseFloat(profit) || 0.00;
        const e = parseFloat(equity) || 0.00;
        setLiveData({ profit: p, equity: e, positions: positions || 0 });
        setProfitHistory(prev => {
            const newHist = [...(prev || []), p];
            if(newHist.length > 20) newHist.shift();
            return newHist;
        });
        if (initialEquity === null && e > 0) setInitialEquity(e - p);
    }

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
        if(window.eel) window.eel.update_strategy_config(strategyName, 'config', newConfig);
    };

    // Editorial UI overrides global theme to ensure dark, high-contrast matte presentation
    return (
        <div className="flex flex-col h-screen bg-[#0A0A0C] overflow-hidden text-[#EDEDEF] font-sans selection:bg-white/10">
            <div className="flex flex-1 overflow-hidden relative">
                
                <Sidebar status={isRunning ? "Running" : (mt5Path ? "Ready" : "Disconnected")} activeTab={activeTab} onTabChange={setActiveTab} />

                <main 
                    ref={mainContentRef}
                    className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative"
                >
                    {/* Ambient blurs removed entirely. The background must remain solid and distraction-free. */}

                    {/* Header: Solid, matte, with an ultra-thin hairline border */}
                    <header className="h-[72px] shrink-0 border-b border-[#222225] bg-[#0A0A0C] flex items-center justify-between px-8 z-20 sticky top-0">
                        <div>
                            <h2 className="text-[16px] font-semibold tracking-tight text-[#EDEDEF] flex items-center gap-3">
                                {activeTab === 'dashboard' ? t('roadmap_trader_basic') : activeTab === 'education' ? t('ai_builder_title') : t('strategy_manager')}
                            </h2>
                            <p className="text-[12px] text-[#70707B] leading-relaxed mt-0.5">
                                {activeTab === 'dashboard' ? t('real_time_monitoring') : activeTab === 'education' ? t('ai_builder_subtitle') : t('strategy_config_subtitle')}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Strategy Counter: Meticulous editorial layout */}
                            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#121214] border border-[#222225] shadow-sm">
                                <span className="text-[9px] font-semibold text-[#70707B] uppercase tracking-widest">
                                    {t('active_strategies')}
                                </span>
                                <div className="h-3 w-[1px] bg-[#2A2A2E]"></div>
                                <span className="text-[12px] font-medium font-mono text-[#34D399] tabular-nums">
                                    {Object.keys(strategies || {}).length.toString().padStart(2, '0')}
                                </span>
                            </div>
                            
                            {/* Lang Toggle Button: Matte and tactile */}
                            <button 
                                onClick={toggleLanguage} 
                                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#121214] border border-[#222225] text-[#A1A1AA] hover:text-[#EDEDEF] hover:bg-[#1A1A1D] transition-colors focus:outline-none"
                                title="Switch Language"
                            >
                                <span className="text-[10px] font-bold tracking-widest">{lang === 'fa' ? 'EN' : 'FA'}</span>
                            </button>
                        </div>
                    </header>

                    {/* Main Content Container */}
                    <div className="flex-1 px-8 pt-8 pb-8 z-10 custom-scroll">
                        <div className="max-w-[1920px] mx-auto h-full flex flex-col">
                            
                            {/* TAB 1: DASHBOARD */}
                            <div className={`space-y-6 animate-fade-in ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                                
                                {/* Top Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard 
                                        title={t('net_profit_today')} 
                                        value={`$${(liveData?.profit || 0).toFixed(2)}`} 
                                        trend={(liveData?.profit || 0) > 0 ? 'up' : (liveData?.profit || 0) < 0 ? 'down' : 'neutral'} 
                                        subValue={(liveData?.profit || 0) !== 0 ? ((liveData?.profit || 0) > 0 ? "+ROI" : "-Drawdown") : "0.0%"} 
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                                    >
                                        <div className="h-14 w-full -mb-3 mt-3 opacity-90 transition-opacity duration-300">
                                            <Sparkline data={profitHistory || []} color={(liveData?.profit || 0) >= 0 ? "#34D399" : "#F87171"} />
                                        </div>
                                    </StatCard>
                                        
                                    <StatCard 
                                        title={t('account_balance')} 
                                        value={`$${(liveData?.equity || 0).toFixed(2)}`}
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                                    >
                                        {/* Subtle Progress Bar without glowing shadows */}
                                        <div className="w-full bg-[#1A1A1D] h-1.5 rounded-full overflow-hidden flex justify-start relative mt-6 border border-[#222225]">
                                            {eqBar.isProfit ? (
                                                <>
                                                    <div className="h-full bg-[#2A2A2E] w-full"></div>
                                                    <div className="absolute h-full bg-[#34D399] transition-all duration-700 ease-out" style={{width: eqBar.width, right: lang === 'fa' ? 'auto' : 0, left: lang === 'fa' ? 0 : 'auto'}}></div>
                                                </>
                                            ) : (
                                                <div className="h-full bg-[#F87171] transition-all duration-700 ease-out" style={{width: eqBar.width}}></div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-[9px] font-semibold text-[#70707B] uppercase tracking-widest">{t('equity_growth')}</span>
                                            <span className={`text-[10px] font-medium font-mono tabular-nums ${eqBar.isProfit ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                                                {eqBar.isProfit ? '+' : '-'}{eqBar.percent}%
                                            </span>
                                        </div>
                                    </StatCard>
                                        
                                    <StatCard 
                                        title={t('open_positions')} 
                                        value={liveData?.positions || 0}
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                    >
                                         <div className="flex items-center gap-2 mt-4 p-2.5 rounded-md bg-[#121214] border border-[#222225]">
                                            <span className="relative flex h-1.5 w-1.5">
                                                {(liveData?.positions || 0) > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-40"></span>}
                                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${(liveData?.positions || 0) > 0 ? 'bg-[#34D399]' : 'bg-[#55555E]'}`}></span>
                                            </span>
                                            <span className={`text-[9px] font-semibold uppercase tracking-widest ${(liveData?.positions || 0) > 0 ? 'text-[#EDEDEF]' : 'text-[#70707B]'}`}>
                                                {(liveData?.positions || 0) > 0 ? t('market_exposure_active') : t('no_exposure')}
                                            </span>
                                         </div>
                                    </StatCard>
                                </div>

                                {/* Main Panels Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 h-full min-h-[500px]">
                                    <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                                        <RiskPanel initialData={initialData} nextNews={nextNews} />
                                    </div>
                                    
                                    <div className="lg:col-span-4 h-full">
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

                            {/* TAB 2: STRATEGY MANAGER */}
                            <div className={`h-full animate-fade-in ${activeTab === 'strategies' ? 'block' : 'hidden'}`}>
                                <StrategyPanel 
                                    strategies={strategies}
                                    onStrategiesChange={setStrategies} 
                                    onUpdateConfig={handleStrategyConfigUpdate}
                                />
                            </div>

                            {/* TAB 3: AI BUILDER / EDUCATION */}
                            <div className={`h-full animate-fade-in ${activeTab === 'education' ? 'block' : 'hidden'}`}>
                                <EducationPanel />
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;