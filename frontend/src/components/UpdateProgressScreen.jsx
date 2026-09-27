import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function UpdateProgressScreen({ progress = 0, message }) {
  const { t } = useLanguage();
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const messageKey = {
    'Downloading the latest version...': 'update_downloading',
    'Update complete. Restarting application...': 'update_complete_restarting',
    update_install_failed: 'update_install_failed',
  }[message];

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#09090b] px-6 font-sans selection:bg-emerald-500/30">
      
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        <div className="absolute left-[20%] top-[20%] h-[35rem] w-[35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[20%] right-[20%] h-[40rem] w-[40rem] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-600/10 blur-[130px]" />
      </div>

      <section className="relative z-10 w-full max-w-xl flex flex-col items-center">
        
        <div className="relative mb-10 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse"></div>
          <div className="absolute inset-0 rounded-3xl border border-emerald-400/30 bg-[#121215]/80 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.2)]"></div>
          <svg className="relative z-10 h-10 w-10 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
          {t('update_progress_eyebrow')}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mb-4">
          {t('update_progress_title')}
        </h1>
        <p className="mx-auto max-w-sm text-center text-sm leading-relaxed text-zinc-400 font-medium">
          {t('update_do_not_close')}
        </p>

        <div className="mt-12 w-full rounded-3xl border border-white/5 bg-[#121215]/60 p-7 backdrop-blur-xl shadow-2xl shadow-black/50 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('update_progress_label')}</span>
              <span className="truncate text-sm font-medium text-zinc-300">
                {messageKey ? t(messageKey) : message || t('update_downloading')}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-4xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {Math.round(safeProgress)}<span className="text-lg text-zinc-500 ml-1">%</span>
              </span>
            </div>
          </div>
          
          <div
            className="relative h-3 w-full overflow-hidden rounded-full bg-[#09090b] border border-white/5 shadow-inner"
            role="progressbar"
            aria-valuenow={Math.round(safeProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(16,185,129,0.6)]"
              style={{ width: `${safeProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}