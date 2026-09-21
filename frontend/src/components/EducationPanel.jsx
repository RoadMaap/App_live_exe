import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * EducationPanel Component
 * Engineered following Microsoft Fluent 2 / Visual Studio Code interface guidelines.
 * Displays strict architectural guidelines and clean Python strategy scaffolding for AI model prompts.
 */
const EducationPanel = () => {
    const { t, lang } = useLanguage();
    const isRtl = lang === 'fa';
    const [isCopied, setIsCopied] = useState(false);

    // Advanced strategy template with strict execution guardrails
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

    // Clipboard copy action handler
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(templateCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code to clipboard: ', err);
        }
    };

    return (
        <div 
            className="h-full flex flex-col gap-4 font-['Segoe_UI',-apple-system,BlinkMacSystemFont,sans-serif] select-none"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            {/* Header Hero Card */}
            <div className="bg-[#242424] border border-[#333333] rounded-[6px] p-5 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[4px] bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[#107C41] shrink-0 shadow-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-white tracking-tight leading-tight">
                                {t('ai_builder_title') || 'Strategy AI Scaffolding'}
                            </h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#107C41]/15 border border-[#107C41]/30 text-[#34D399] font-medium">
                                PROTOCOL V2
                            </span>
                        </div>
                        <p className="text-xs text-[#A19F9D] mt-1 leading-relaxed max-w-3xl">
                            {t('ai_builder_subtitle') || 'Provide this foundational template to large language models to generate crash-resilient quantitative strategies.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Instruction Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 shrink-0">
                
                {/* Step 1 */}
                <div className="bg-[#202023] border border-[#2D2D30] hover:border-[#3E3E3E] rounded-[6px] p-4 transition-colors flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="w-6 h-6 rounded-[3px] bg-[#18181B] border border-[#333333] text-[#A19F9D] flex items-center justify-center font-mono text-xs font-semibold">
                                01
                            </span>
                            <span className="text-[9px] font-mono text-[#797775]">COPY</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-1.5 tracking-tight">
                            {t('step_1_title') || 'Copy Foundation Blueprint'}
                        </h4>
                        <p className="text-[11px] text-[#A19F9D] leading-relaxed">
                            {t('step_1_desc') || 'Copy the complete template code containing guardrails against lookahead bias.'}
                        </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[#202023] border border-[#2D2D30] hover:border-[#3E3E3E] rounded-[6px] p-4 transition-colors flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="w-6 h-6 rounded-[3px] bg-[#18181B] border border-[#333333] text-[#34D399] flex items-center justify-center font-mono text-xs font-semibold">
                                02
                            </span>
                            <span className="text-[9px] font-mono text-[#797775]">PROMPT</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-1.5 tracking-tight">
                            {t('step_2_title') || 'Feed Prompt to LLM'}
                        </h4>
                        <p className="text-[11px] text-[#A19F9D] leading-relaxed">
                            {t('step_2_desc') || 'Instruct your model to implement indicators within prepare_indicators and signals in check_entry_signal.'}
                        </p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="bg-[#202023] border border-[#2D2D30] hover:border-[#3E3E3E] rounded-[6px] p-4 transition-colors flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="w-6 h-6 rounded-[3px] bg-[#18181B] border border-[#333333] text-[#60A5FA] flex items-center justify-center font-mono text-xs font-semibold">
                                03
                            </span>
                            <span className="text-[9px] font-mono text-[#797775]">EXECUTE</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-1.5 tracking-tight">
                            {t('step_3_title') || 'Deploy & Hot-Reload'}
                        </h4>
                        <p className="text-[11px] text-[#A19F9D] leading-relaxed">
                            {t('step_3_desc') || 'Save the generated script into the strategy directory and import it directly into the live workspace.'}
                        </p>
                    </div>
                </div>

            </div>

            {/* Code Template Display & Terminal Header */}
            <div className="flex-1 bg-[#141416] border border-[#333333] rounded-[6px] flex flex-col overflow-hidden shadow-inner min-h-[420px]">
                
                {/* VS Code Style Header */}
                <div className="h-10 px-4 bg-[#1F1F22] border-b border-[#2D2D30] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#3E3E42]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#3E3E42]" />
                        </div>
                        <div className="flex items-center gap-2 pl-2 border-l border-[#2D2D30]">
                            <svg className="w-3.5 h-3.5 text-[#60A5FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="text-xs font-mono font-medium text-[#E1DFDD]">
                                strategy_template.py
                            </span>
                            <span className="text-[9px] font-mono text-[#797775] px-1.5 py-0.2 rounded bg-[#18181B] border border-[#2D2D30]">
                                UTF-8
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={handleCopy}
                        className={`h-7 px-3.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            isCopied 
                                ? 'bg-[#107C41]/20 text-[#34D399] border border-[#107C41]/40' 
                                : 'bg-[#107C41] hover:bg-[#0E6B37] active:bg-[#0C5B2F] text-white border border-[#107C41]'
                        }`}
                    >
                        {isCopied ? (
                            <>
                                <svg className="w-3.5 h-3.5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{t('copied') || 'Copied'}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                <span>{t('copy_code') || 'Copy Template'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Code Body Viewport */}
                <div className="education-code flex-1 p-4 overflow-auto custom-scroll select-text font-mono text-[12px] leading-[1.65]" dir="ltr">
                    <pre className="text-[#D4D4D8]">
                        <code>
                            {templateCode.split('\n').map((line, i) => {
                                let coloredLine = line;
                                const trimmed = line.trim();

                                if (trimmed.startsWith('#') || trimmed.startsWith('"""')) {
                                    if (line.includes('⚠️')) {
                                        coloredLine = <span className="text-[#FCE100] font-semibold">{line}</span>;
                                    } else {
                                        coloredLine = <span className="text-[#797775] italic">{line}</span>;
                                    }
                                } else {
                                    const keywords = [
                                        'def ', 'class ', 'return ', 'if ', 'None', 'import ', 
                                        'from ', 'elif ', 'else:', 'True', 'False', 'in '
                                    ];
                                    
                                    keywords.forEach(kw => {
                                        if (line.includes(kw)) {
                                            const parts = line.split(kw);
                                            coloredLine = (
                                                <span>
                                                    {parts[0]}
                                                    <span className="text-[#60A5FA] font-semibold">{kw}</span>
                                                    {parts.slice(1).join(kw)}
                                                </span>
                                            );
                                        }
                                    });
                                }

                                return (
                                    <div key={i} className="table-row hover:bg-white/[0.02]">
                                        <div className="table-cell select-none text-[#52525B] pr-4 text-right border-r border-[#242427] w-10 text-[11px]">
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