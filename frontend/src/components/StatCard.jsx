import React from 'react';

/**
 * StatCard Component
 * Microsoft Fluent 2 / WinUI 3 telemetry card.
 * Designed with restrained surface lighting, crisp border definitions, and monospace values.
 */
const StatCard = ({ title, value, subValue, trend = "neutral", children, icon, iconTone = 'text-[#A19F9D]', embedded = false, className = '' }) => {
    const isUp = trend === 'up';
    const isDown = trend === 'down';

    // Fluent telemetry status styling
    const trendStyles = {
        up: {
            accentText: 'text-[#34D399]',
            badgeBg: 'bg-[#107C41]/15 border-[#107C41]/30 text-[#34D399]',
            indicatorIcon: (
                <svg className="w-2.5 h-2.5 text-[#34D399] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            )
        },
        down: {
            accentText: 'text-[#F87171]',
            badgeBg: 'bg-[#C42B1C]/15 border-[#C42B1C]/30 text-[#F87171]',
            indicatorIcon: (
                <svg className="w-2.5 h-2.5 text-[#F87171] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            )
        },
        neutral: {
            accentText: 'text-white',
            badgeBg: 'bg-[#1F1F1F] border-[#333333] text-[#A19F9D]',
            indicatorIcon: null
        }
    };

    const currentTheme = isUp ? trendStyles.up : isDown ? trendStyles.down : trendStyles.neutral;

    return (
        <div className={`${embedded ? 'relative w-full min-w-0 min-h-[178px] p-3 sm:p-4' : 'relative w-full min-w-0 min-h-[178px] rounded-[8px] border border-[#333333] bg-[#242424] hover:border-[#3E3E3E] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-200'} ${className} group flex flex-col justify-between select-none`}>
            
            {/* Inner Content Stack */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Header: Identity & Telemetry Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {icon && (
                            <div className={`w-6 h-6 rounded-[4px] bg-[#1F1F1F] border border-[#333333] flex items-center justify-center ${iconTone} transition-colors shrink-0 shadow-sm`}>
                                {icon}
                            </div>
                        )}
                        <span className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-[#A19F9D] truncate">
                            {title}
                        </span>
                    </div>

                    {subValue && (
                        <div className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold border flex items-center gap-1 shrink-0 ${currentTheme.badgeBg}`}>
                            {currentTheme.indicatorIcon}
                            <span>{subValue}</span>
                        </div>
                    )}
                </div>

                {/* Primary Metric Value */}
                <div className="my-2">
                    <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white drop-shadow-sm break-words leading-none">
                        {value}
                    </h3>
                </div>

                {/* Chart / Micro-Visual Slot */}
                {children && (
                    <div className="mt-auto pt-3 relative min-h-[56px] flex flex-col justify-end overflow-visible">
                        {children}
                    </div>
                )}

            </div>
        </div>
    );
};

export default StatCard;