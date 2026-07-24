import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const EducationPanel = () => {
    const { t } = useLanguage();
    const [isCopied, setIsCopied] = useState(false);

    const templateCode = `import pandas as pd
import numpy as np
import pandas_ta as ta
import mplfinance as mpf

class Strategy:
    def __init__(self, params):
        """
        Strategy Parameters:
        Example: {'EMA_LEN': 50, 'RSI_LEN': 14, 'RISK_REWARD': 2.0}
        """
        self.params = params

    def prepare_indicators(self, data, candle_type='STANDARD'):
        """
        Calculates Indicators.
        ⚠️ PRO TIP: ALWAYS use int() or float() when reading self.params to prevent UI string errors!
        """
        # --- Safe Parameter Extraction Example ---
        # ema_len = int(self.params.get('EMA_LEN', 50))
        # data['EMA'] = ta.ema(data['close'], length=ema_len)
        
        data.dropna(inplace=True)
        return data

    def get_swing_levels(self, history, length=20):
        """
        HELPER: Calculates Swing High/Low for Elliott/Fibonacci.
        Returns (swing_high, swing_low).
        """
        relevant_data = history.iloc[:-2] 
        if len(relevant_data) < length: return None, None
        
        swing_high = float(relevant_data['high'].rolling(window=length).max().iloc[-1])
        swing_low = float(relevant_data['low'].rolling(window=length).min().iloc[-1])
        return swing_high, swing_low

    def check_entry_signal(self, history_slice):
        # 1. Validation & Safe Parameters
        min_len = int(self.params.get('MIN_LOOKBACK', 50))
        if len(history_slice) < min_len: return None, None, None, None

        # 2. Candle Definitions
        signal_candle = history_slice.iloc[-2]   # Confirmed Candle
        current_candle = history_slice.iloc[-1]  # Market Open
        
        trade_type = None
        entry_price = float(current_candle['open'])
        stop_loss = 0.0
        take_profit = 0.0

        # --- LOGIC START ---
        # (AI LOGIC HERE - Note to AI: Always wrap self.params in int() or float())
        # --- LOGIC END ---

        if trade_type:
            if stop_loss <= 0 or take_profit <= 0: return None, None, None, None
            return trade_type, entry_price, stop_loss, take_profit

        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        return None, None

    def get_plot_addplots(self, plot_data, ap, config):
        """
        Visual debugging for Backtest Reports.
        Add indicators here to see them on the chart.
        """
        # if 'EMA' in plot_data.columns:
        #     ap.append(mpf.make_addplot(plot_data['EMA'], panel=0, color='blue', width=1.0))
        return ap, (3, 1) # Aspect Ratio (Main: 3, Indicator: 1)
`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(templateCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 font-sans">
            {/* Header section with AI Vibes */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center shrink-0 group shadow-xl">
                <div className="absolute -top-[50%] -right-[10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            {t('ai_builder_title')}
                            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30 font-mono">NO-CODE</span>
                        </h2>
                        <p className="text-xs text-zinc-400 font-medium mt-1 max-w-2xl leading-relaxed">
                            {t('ai_builder_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Instruction Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-[#121215] border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold font-mono text-sm mb-3">1</div>
                    <h4 className="text-sm font-bold text-zinc-200 mb-2">{t('step_1_title')}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{t('step_1_desc')}</p>
                </div>
                <div className="bg-[#121215] border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold font-mono text-sm mb-3 shadow-[0_0_10px_rgba(99,102,241,0.2)]">2</div>
                    <h4 className="text-sm font-bold text-zinc-200 mb-2">{t('step_2_title')}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{t('step_2_desc')}</p>
                </div>
                <div className="bg-[#121215] border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold font-mono text-sm mb-3">3</div>
                    <h4 className="text-sm font-bold text-zinc-200 mb-2">{t('step_3_title')}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{t('step_3_desc')}</p>
                </div>
            </div>

            {/* Code Template Box */}
            <div className="flex-1 bg-[#09090b] border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl group">
                {/* Subtle border glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                {/* Code Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#121215] border-b border-white/5 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500 font-bold ml-2">Base_Strategy_Template.py</span>
                    </div>
                    
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            isCopied 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                        }`}
                    >
                        {isCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                {t('copied')}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                {t('copy_code')}
                            </>
                        )}
                    </button>
                </div>

                {/* Code Body */}
                <div className="flex-1 p-4 overflow-auto custom-scroll relative z-10">
                    <pre className="text-[11px] font-mono leading-[1.6] text-zinc-300">
                        <code>
                            {templateCode.split('\n').map((line, i) => {
                                // Simple syntax highlighting logic for visualization
                                let coloredLine = line;
                                if (line.trim().startsWith('#')) {
                                    coloredLine = <span className="text-zinc-500">{line}</span>;
                                } else if (line.includes('"""')) {
                                    coloredLine = <span className="text-emerald-500/70">{line}</span>;
                                } else {
                                    // Highlight keywords
                                    const keywords = ['def ', 'class ', 'return ', 'if ', 'None', 'import ', 'from '];
                                    let htmlLine = line;
                                    keywords.forEach(kw => {
                                        if (line.includes(kw)) {
                                            const parts = line.split(kw);
                                            coloredLine = (
                                                <span>
                                                    {parts[0]}
                                                    <span className="text-indigo-400">{kw}</span>
                                                    {parts[1]}
                                                </span>
                                            );
                                        }
                                    });
                                }

                                return (
                                    <div key={i} className="table-row hover:bg-white/[0.02]">
                                        <div className="table-cell select-none text-zinc-600 pr-4 text-right border-r border-white/5 w-8">
                                            {i + 1}
                                        </div>
                                        <div className="table-cell pl-4 whitespace-pre">
                                            {coloredLine}
                                        </div>
                                    </div>
                                );
                            })}
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default EducationPanel;