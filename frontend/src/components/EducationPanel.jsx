import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const EducationPanel = () => {
    const { t } = useLanguage();
    const [isCopied, setIsCopied] = useState(false);

    // قالب فوق‌پیشرفته، شامل گاردریل‌ها و قوانین استخراج شده از کدهای لایو
    const templateCode = `import pandas as pd
import numpy as np
import pandas_ta as ta
import mplfinance as mpf

class Strategy:
    def __init__(self, params):
        """
        ⚠️ AI INSTRUCTION - STRICT GUARDRAILS (MUST FOLLOW):
        1. NO LOOKAHEAD BIAS: NEVER use iloc[-1]['close'], ['high'], or ['low'] for logic. 
           ONLY use iloc[-1]['open'] as the entry_price. All logic MUST use iloc[-2] (Confirmed Candle).
        2. ZERO DIVISION: ALWAYS handle division by zero. If calculating range, use: (high - low).replace(0, 0.00001).
        3. PANDAS_TA QUIRKS: Multi-column indicators (MACD, BBANDS) change column names based on params.
           ALWAYS extract them using index: macd_df = ta.macd(close); data['MACD'] = macd_df.iloc[:, 0]
        4. SAFE CASTING: ALWAYS wrap params in int() or float() (e.g., length=int(self.params.get('LEN', 14))).
        5. BOOLEAN SAFETY: ALWAYS wrap pandas boolean extractions in bool() to avoid Truth Value errors.
           Example: is_bullish = bool(signal_candle['close'] > signal_candle['open'])
        """
        self.params = params

    def prepare_indicators(self, data, candle_type='STANDARD'):
        # ⚠️ Example of SAFE indicator extraction:
        # ema_len = int(self.params.get('EMA_LEN', 50))
        # data['EMA'] = ta.ema(data['close'], length=ema_len)
        
        data.dropna(inplace=True)
        return data

    def check_entry_signal(self, history_slice):
        # 1. Validation (Safe Minimum Length)
        min_len = int(self.params.get('MIN_LOOKBACK', 50))
        if len(history_slice) < min_len: return None, None, None, None

        # 2. Candle Definitions
        signal_candle = history_slice.iloc[-2]   # Confirmed Candle (USE THIS FOR LOGIC)
        current_candle = history_slice.iloc[-1]  # Market Open (ONLY USE ['open'])
        
        trade_type = None
        entry_price = float(current_candle['open'])
        stop_loss = 0.0
        take_profit = 0.0

        # --- LOGIC START ---
        # ⚠️ AI INSTRUCTION: trade_type MUST be exactly 'buy' or 'sell' (lowercase). NEVER use 'LONG'/'SHORT'.
        
        # Example Logic:
        # is_cross_up = bool(signal_candle['MACD'] > signal_candle['MACD_Signal'])
        # if is_cross_up:
        #     trade_type = 'buy'
        #     stop_loss = float(signal_candle['low'] - 2.0)
        #     take_profit = float(entry_price + (entry_price - stop_loss) * 2.0)
        # --- LOGIC END ---

        # 3. Engine Safety Net & Strict SL Validation
        if trade_type in ['buy', 'sell']:
            if stop_loss <= 0 or take_profit <= 0: return None, None, None, None
            
            # Anti-Crash: Prevent Invalid SL direction
            risk_distance = abs(entry_price - stop_loss)
            if risk_distance <= 0: return None, None, None, None
            if trade_type == 'buy' and stop_loss >= entry_price: return None, None, None, None
            if trade_type == 'sell' and stop_loss <= entry_price: return None, None, None, None

            return trade_type, entry_price, stop_loss, take_profit

        return None, None, None, None

    def check_exit_conditions(self, current_candle, history_slice, position):
        """
        ⚠️ AI INSTRUCTION: MUST return exactly TWO values: (exit_price, reason_string) or (None, None).
        """
        return None, None

    def get_plot_addplots(self, plot_data, ap, config):
        """
        ⚠️ AI INSTRUCTION: Always check if plot_data is empty before appending!
        """
        if plot_data is None or plot_data.empty:
            return ap, (3, 1)

        # Example:
        # if 'EMA' in plot_data.columns and not plot_data['EMA'].isna().all():
        #     ap.append(mpf.make_addplot(plot_data['EMA'], color='blue', width=1.0))

        return ap, (3, 1)
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
            {/* Header Section */}
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
                            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30 font-mono">BULLETPROOF</span>
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

            {/* Code Template Display & Copy Action */}
            <div className="flex-1 bg-[#09090b] border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                <div className="flex items-center justify-between px-4 py-3 bg-[#121215] border-b border-white/5 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500 font-bold ml-2">ZeroCrash_Template.py</span>
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

                <div className="flex-1 p-4 overflow-auto custom-scroll relative z-10" dir="ltr">
                    <pre className="text-[11px] font-mono leading-[1.6] text-zinc-300">
                        <code>
                            {templateCode.split('\n').map((line, i) => {
                                let coloredLine = line;
                                if (line.trim().startsWith('#') || line.trim().startsWith('"""') || line.trim().startsWith('\"\"\"')) {
                                    if (line.includes('⚠️')) {
                                        coloredLine = <span className="text-amber-400 font-bold">{line}</span>;
                                    } else {
                                        coloredLine = <span className="text-zinc-500">{line}</span>;
                                    }
                                } else {
                                    const keywords = ['def ', 'class ', 'return ', 'if ', 'None', 'import ', 'from ', 'elif ', 'else:', 'True', 'False'];
                                    keywords.forEach(kw => {
                                        if (line.includes(kw)) {
                                            const parts = line.split(kw);
                                            coloredLine = (
                                                <span>
                                                    {parts[0]}
                                                    <span className="text-indigo-400 font-bold">{kw}</span>
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