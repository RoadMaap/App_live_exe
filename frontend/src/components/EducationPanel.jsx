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
        <div className="h-full flex flex-col gap-8 font-sans p-2">
            
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#18181b] to-[#09090b] border border-white/5 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center shrink-0 shadow-2xl">
                {/* Ambient Glow Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            {t('ai_builder_title')}
                        </h2>
                        <p className="text-sm text-zinc-400 font-medium mt-2 max-w-2xl leading-relaxed">
                            {t('ai_builder_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Instruction Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
                <div className="bg-[#121215]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-[#18181b] hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg group">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 flex items-center justify-center font-bold text-lg mb-4 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">1</div>
                    <h4 className="text-base font-bold text-zinc-100 mb-2">{t('step_1_title')}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{t('step_1_desc')}</p>
                </div>
                
                <div className="bg-[#121215]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-[#18181b] hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">2</div>
                    <h4 className="text-base font-bold text-zinc-100 mb-2">{t('step_2_title')}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{t('step_2_desc')}</p>
                </div>
                
                <div className="bg-[#121215]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-[#18181b] hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg group">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 flex items-center justify-center font-bold text-lg mb-4 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">3</div>
                    <h4 className="text-base font-bold text-zinc-100 mb-2">{t('step_3_title')}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{t('step_3_desc')}</p>
                </div>
            </div>

            {/* Code Template Display & Copy Action */}
            <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                {/* IDE Mockup Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#121215] border-b border-zinc-800 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></span>
                            <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span>
                            <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-300 tracking-wide ml-2">Create Strategy Template</span>
                    </div>
                    
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                            isCopied 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)] active:scale-95'
                        }`}
                    >
                        {isCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
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

                {/* Code Content */}
                <div className="flex-1 p-6 overflow-auto custom-scrollbar relative z-10" dir="ltr">
                    <pre className="text-[13px] font-mono leading-[1.7] text-zinc-300">
                        <code>
                            {templateCode.split('\n').map((line, i) => {
                                let coloredLine = line;
                                if (line.trim().startsWith('#') || line.trim().startsWith('"""') || line.trim().startsWith('\"\"\"')) {
                                    if (line.includes('⚠️')) {
                                        coloredLine = <span className="text-amber-400 font-bold drop-shadow-md">{line}</span>;
                                    } else {
                                        coloredLine = <span className="text-zinc-500 italic">{line}</span>;
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
                                    <div key={i} className="table-row hover:bg-white/[0.03] transition-colors duration-150">
                                        <div className="table-cell select-none text-zinc-600 pr-5 text-right border-r border-zinc-800 w-10 text-xs">
                                            {i + 1}
                                        </div>
                                        <div className="table-cell pl-5 whitespace-pre">
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