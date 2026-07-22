import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import Sparkline from './Sparkline';
import RiskPanel from './RiskPanel';
import EnginePanel from './EnginePanel';
import StrategyPanel from './StrategyPanel';

const Dashboard = () => {
    const { t, toggleLanguage, lang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    
    // --- Refs ---
    const mainContentRef = useRef(null);
    
    // --- States ---
    const [mt5Path, setMt5Path] = useState("");
    const [initialData, setInitialData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [strategies, setStrategies] = useState({});

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
                const data = await window.eel.get_initial_data()();
                if(data) {
                    setInitialData(data);
                    setMt5Path(data.mt5_path || "");
                    if (data.strategies) {
                        setStrategies(data.strategies);
                    }
                }
            }
        };
        fetchInit();

        if(window.eel) {
            window.eel.expose(update_dashboard, 'update_dashboard');
            window.eel.expose(update_status, 'update_status');
        }
        
        return () => {
            if(window.eel) {
                delete window.update_dashboard;
                delete window.update_status;
            }
        };
    }, []);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    function update_status(type, message) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        let color = 'text-zinc-500';
        
        if (type === 'error') {
            color = 'text-rose-500';
            setIsRunning(false); 
        }
        else if (type === 'success') {
            color = 'text-emerald-500';
            if (message.includes('فعال شد') || message.includes('Active')) setIsRunning(true); 
        }
        else if (type === 'warning') {
            color = 'text-yellow-500';
            if (message.includes('توقف') || message.includes('Stop')) setIsRunning(false); 
        }
        
        // Anti-Memory Leak Feature: Keep only the latest 100 logs
        setLogs(prev => {
            const newLogs = [...prev, { time, message, color }];
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
        const p = parseFloat(profit);
        const e = parseFloat(equity);
        setLiveData({ profit: p, equity: e, positions });
        setProfitHistory(prev => {
            const newHist = [...prev, p];
            if(newHist.length > 20) newHist.shift();
            return newHist;
        });
        if (initialEquity === null && e > 0) setInitialEquity(e - p);
    }

    const getEquityBar = () => {
        if (!initialEquity || initialEquity <= 0) return { width: '0%', isProfit: true, percent: 0 };
        const current = liveData.equity;
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
                ...prev[strategyName],
                config: newConfig
            }
        }));
        if(window.eel) window.eel.update_strategy_config(strategyName, 'config', newConfig);
    };

    const transitionClass = "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]";

    return (
        <div className={`flex flex-col h-screen bg-zinc-50 dark:bg-[#09090b] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30 ${transitionClass}`}>
            <div className="flex flex-1 overflow-hidden relative">
                
                <Sidebar status={isRunning ? "Running" : (mt5Path ? "Ready" : "Disconnected")} activeTab={activeTab} onTabChange={setActiveTab} />

                <main 
                    ref={mainContentRef}
                    className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] opacity-40"></div>
                        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] opacity-30"></div>
                    </div>

                    <header className={`h-20 shrink-0 border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-8 z-20 sticky top-0 ${transitionClass}`}>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight flex items-center gap-3">
                                {activeTab === 'dashboard' ? 'RoadMap Trader Basic' : 'Strategy Manager'}
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">
                                {activeTab === 'dashboard' ? 'Real-time monitoring of performance & risk' : 'Manage and configure your algorithmic strategies'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-white/5 shadow-sm ${transitionClass}`}>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Strategies</span>
                                <div className="h-4 w-px bg-zinc-300 dark:bg-white/10"></div>
                                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {Object.keys(strategies).length.toString().padStart(2, '0')}
                                </span>
                            </div>
                            
                            <button 
                                onClick={toggleLanguage} 
                                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 active:scale-95 shadow-sm ${transitionClass}`}
                                title="Switch Language"
                            >
                                <span className="text-xs font-bold">{lang === 'fa' ? 'EN' : 'FA'}</span>
                            </button>

                            <button 
                                onClick={toggleTheme} 
                                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 active:scale-95 shadow-sm ${transitionClass}`}
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 px-8 pt-10 pb-8 z-10 custom-scroll">
                        <div className="max-w-[1920px] mx-auto h-full flex flex-col">
                            
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <StatCard 
                                            title={t('net_profit_today')} 
                                            value={`$${liveData.profit.toFixed(2)}`} 
                                            trend={liveData.profit > 0 ? 'up' : liveData.profit < 0 ? 'down' : 'neutral'} 
                                            subValue={liveData.profit !== 0 ? (liveData.profit > 0 ? "+ROI" : "-Drawdown") : "0.0%"} 
                                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                                        >
                                            <div className="h-16 w-full -mb-3 mt-3 opacity-80 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-[1.02]">
                                                <Sparkline data={profitHistory} color={liveData.profit >= 0 ? "#10b981" : "#f43f5e"} />
                                            </div>
                                        </StatCard>
                                        
                                        <StatCard 
                                            title={t('account_balance')} 
                                            value={`$${liveData.equity.toFixed(2)}`}
                                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                                        >
                                            <div className="w-full bg-zinc-200 dark:bg-zinc-800/50 h-2 rounded-full overflow-hidden flex justify-start relative mt-6 border border-zinc-300 dark:border-white/5">
                                                {eqBar.isProfit ? (
                                                    <>
                                                        <div className="h-full bg-zinc-400 dark:bg-zinc-600 w-full opacity-20"></div>
                                                        <div className="absolute h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_10px_#10b981]" style={{width: eqBar.width, right: lang === 'fa' ? 'auto' : 0, left: lang === 'fa' ? 0 : 'auto'}}></div>
                                                    </>
                                                ) : (
                                                    <div className="h-full bg-rose-500 transition-all duration-700 ease-out shadow-[0_0_10px_#f43f5e]" style={{width: eqBar.width}}></div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Equity Growth</span>
                                                <span className={`text-[10px] font-bold ${eqBar.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {eqBar.isProfit ? '+' : '-'}{eqBar.percent}%
                                                </span>
                                            </div>
                                        </StatCard>
                                        
                                        <StatCard 
                                            title={t('open_positions')} 
                                            value={liveData.positions}
                                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                        >
                                             <div className="flex items-center gap-2 mt-4 p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
                                                </span>
                                                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                    {liveData.positions > 0 ? 'Market Exposure Active' : 'No Exposure'}
                                                </span>
                                             </div>
                                        </StatCard>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 h-full min-h-[500px]">
                                        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                                            <RiskPanel initialData={initialData} />
                                        </div>
                                        
                                        <div className="lg:col-span-4 h-full">
                                            <EnginePanel 
                                                mt5Path={mt5Path} 
                                                onPathChange={setMt5Path} 
                                                logs={logs} 
                                                isRunning={isRunning}
                                                onToggle={handleToggleEngine}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'strategies' && (
                                <div className="h-full animate-fade-in">
                                    <StrategyPanel 
                                        strategies={strategies}
                                        onStrategiesChange={setStrategies} 
                                        onUpdateConfig={handleStrategyConfigUpdate}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;