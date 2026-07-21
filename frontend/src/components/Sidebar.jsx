import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ status = "Ready", activeTab, onTabChange }) => {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: t('dashboard'), 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> 
    },
    { 
      id: 'strategies', 
      label: t('strategy_management'), 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> 
    }
  ];

  // متغیر انیمیشن مشترک
  const transitionClass = "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]";

  // اصلاح مهم: فقط وقتی Running است آنلاین باشد (حالت Ready آفلاین محسوب می‌شود)
  const isOnline = status === 'Running';

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#0c0c0e] border-r border-white/5 flex flex-col z-20 h-screen shrink-0 font-sans ${transitionClass}`}
    >
      {/* 1. Header */}
      <div className={`h-20 shrink-0 flex items-center justify-center border-b border-white/5 relative overflow-hidden group ${transitionClass}`}>
            
            {/* حالت باز */}
            <div className={`flex items-center justify-center ${transitionClass} ${isCollapsed ? 'opacity-0 scale-90 absolute' : 'opacity-100 scale-100'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
              </div>
            </div>
            
            {/* حالت بسته */}
            <div className={`absolute inset-0 flex items-center justify-center ${transitionClass} ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className={`w-10 h-10 rounded-xl bg-[#18181b] border border-white/10 flex items-center justify-center text-emerald-500 ${transitionClass}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
              </div>
            </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex-1 overflow-y-auto custom-scroll py-4 px-3">
        
        {/* دکمه Collapse */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center gap-0 px-0' : 'justify-start gap-3 px-3'} py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 mb-6 group outline-none ${transitionClass}`}
        >
            <span className={`shrink-0 flex items-center justify-center group-hover:scale-110 ${transitionClass}`}>
              {isCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              )}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap overflow-hidden mt-0.5 ${transitionClass} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'}`}>
              {t('collapse_view')}
            </span>
        </button>

        {/* منو */}
        <div className="space-y-1">
          {menuItems.map((item) => (
             <button 
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center gap-0 px-0' : 'justify-start gap-3 px-3'} py-3 rounded-xl text-sm font-medium border group relative overflow-hidden outline-none ${
                    activeTab === item.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 shadow-[0_0_20px_-10px_rgba(16,185,129,0.2)]' 
                    : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-white/5'
                } ${transitionClass}`}
             >
                {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full shadow-[0_0_8px_#10b981]"></div>
                )}

                <span className={`shrink-0 flex items-center justify-center ${transitionClass} ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                </span>
                
                <span className={`whitespace-nowrap overflow-hidden mt-0.5 ${transitionClass} ${isCollapsed ? 'max-w-0 opacity-0 translate-x-4' : 'max-w-[120px] opacity-100 translate-x-0'}`}>
                    {item.label}
                </span>
             </button>
          ))}
        </div>
      </div>

      {/* 3. Footer Status */}
      <div className={`p-4 border-t border-white/5 bg-[#0a0a0c] shrink-0 ${transitionClass}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-2`}>
          <span className={`text-[9px] uppercase font-bold text-zinc-500 whitespace-nowrap overflow-hidden ${transitionClass} ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[80px] opacity-100'}`}>Connection</span>
          
          <div 
             className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors duration-300 ${isCollapsed ? 'hidden' : 'flex'} ${
                 isOnline 
                 ? 'bg-emerald-500/10 border-emerald-500/10' 
                 : 'bg-rose-500/10 border-rose-500/10'
             }`} 
             title={status}
          >
            <span className="relative flex h-1.5 w-1.5">
              {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </>
              ) : (
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              )}
            </span>
             
             <span className={`text-[9px] font-bold overflow-hidden pl-1 ${
                 isOnline 
                 ? 'text-emerald-500' 
                 : 'text-rose-500'
             }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
             </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;