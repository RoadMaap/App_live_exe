import React from 'react';

const StatCard = ({ title, value, subValue, trend = "neutral", children, icon }) => {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  const theme = {
    up: {
      border: 'border-emerald-500/20 group-hover:border-emerald-500/30',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-400',
      shadow: 'group-hover:shadow-[0_0_50px_-20px_rgba(16,185,129,0.3)]'
    },
    down: {
      border: 'border-rose-500/20 group-hover:border-rose-500/30',
      text: 'text-rose-400',
      badgeBg: 'bg-rose-500/10',
      badgeText: 'text-rose-400',
      shadow: 'group-hover:shadow-[0_0_50px_-20px_rgba(244,63,94,0.3)]'
    },
    neutral: {
      border: 'border-white/5 group-hover:border-white/10',
      text: 'text-zinc-200',
      badgeBg: 'bg-white/5',
      badgeText: 'text-zinc-400',
      shadow: ''
    }
  };

  const currentTheme = isUp ? theme.up : isDown ? theme.down : theme.neutral;

  return (
    // overflow-hidden اینجا لازم است تا نورهای پس‌زمینه بیرون نزنند
    <div className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} bg-[#121215] p-6 transition-all duration-500 group ${currentTheme.shadow}`}>
      
      {/* Decorative Gradient Blob */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${isUp ? 'bg-emerald-500/20' : isDown ? 'bg-rose-500/20' : 'bg-white/5'}`}></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border border-white/5 bg-[#18181b] text-zinc-400`}>
                    {icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</span>
            </div>

            {subValue && (
                <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold border border-transparent flex items-center gap-1 transition-colors ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                    {isUp && '▲'}
                    {isDown && '▼'}
                    {subValue}
                </div>
            )}
        </div>

        {/* Value */}
        <div className="mt-3 mb-2">
            <h3 className={`text-3xl font-black tracking-tight font-mono ${currentTheme.text} drop-shadow-sm`}>
                {value}
            </h3>
        </div>

        {/* Chart Area - اصلاح شده */}
        {/* overflow-hidden حذف شد تا نمودار هنگام انیمیشن بریده نشود */}
        <div className="mt-auto pt-4 border-t border-white/5 relative h-16">
            {children}
        </div>

      </div>
    </div>
  );
};

export default StatCard;