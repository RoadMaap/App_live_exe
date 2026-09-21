import React, { useEffect, useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';
import Login from './components/auth/Login';
import Dashboard from './components/home/Dashboard';

function UpdateModal({ updateInfo, onConfirm, onLater, isInstalling, errorMessage }) {
  const isForce = Boolean(updateInfo?.is_force_update || updateInfo?.update_type === 'forced');
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const isRtl = lang === 'fa';
  const copy = isRtl ? {
    forceTitle: 'به‌روزرسانی اجباری',
    optionalTitle: 'نسخه جدید در دسترس است',
    forceDescription: 'برای ادامه استفاده امن از RoadMaps، این به‌روزرسانی باید نصب شود.',
    optionalDescription: 'نسخه جدیدی از RoadMaps برای نصب در دسترس است.',
    current: 'نسخه فعلی',
    latest: 'نسخه جدید',
    changelog: 'بهبود پایداری و امنیت برنامه.',
    later: 'بعداً',
    updating: 'در حال به‌روزرسانی...',
    update: 'به‌روزرسانی الآن',
    retry: 'تلاش دوباره',
  } : {
    forceTitle: 'Required update',
    optionalTitle: 'New version available',
    forceDescription: 'This update is required to continue using RoadMaps safely.',
    optionalDescription: 'A newer version of RoadMaps is available.',
    current: 'Current',
    latest: 'Latest',
    changelog: 'Improved stability and security updates.',
    later: 'Later',
    updating: 'Updating...',
    update: 'Update now',
    retry: 'Try again',
  };

  return (
    <div className={`update-modal-overlay ${isDark ? 'update-modal-dark' : 'update-modal-light'}`} dir={isRtl ? 'rtl' : 'ltr'} role="presentation">
      <div className="update-modal" role="dialog" aria-modal="true" aria-labelledby="update-modal-title">
        <div className={`update-modal-badge ${isForce ? 'update-modal-badge-force' : ''}`}>
          {isForce ? '!' : 'i'}
        </div>
        <div id="update-modal-title" className="update-modal-title">
          {isForce ? copy.forceTitle : copy.optionalTitle}
        </div>
        <div className="update-modal-description">
          {isForce ? copy.forceDescription : copy.optionalDescription}
        </div>
        <div className="update-modal-versions">
          <span><strong>{copy.current}:</strong> {updateInfo?.current_version || 'unknown'}</span>
          <span><strong>{copy.latest}:</strong> {updateInfo?.latest_version || 'unknown'}</span>
        </div>
        <div className="update-modal-changelog">
          {updateInfo?.changelog || copy.changelog}
        </div>
        {errorMessage && <div className="update-modal-error" role="alert">{errorMessage}</div>}
        <div className="update-modal-actions">
          {!isForce && (
            <button type="button" onClick={onLater} disabled={isInstalling} className="update-modal-button update-modal-button-secondary">
              {copy.later}
            </button>
          )}
          <button type="button" onClick={onConfirm} disabled={isInstalling} className="update-modal-button update-modal-button-primary">
            {isInstalling ? copy.updating : errorMessage ? copy.retry : copy.update}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [view, setView] = useState('login');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (!window.eel) return;

    const checkUpdate = async () => {
      try {
        const result = await window.eel.check_for_app_update()();
        if (result && result.has_update) {
          setUpdateInfo(result);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    checkUpdate();
  }, []);

  const handleUpdateInstall = async () => {
    if (!window.eel) return;

    setIsInstalling(true);
    setUpdateError('');
    try {
      const result = await window.eel.download_and_install_update()();
      if (result && result.success) {
        setUpdateInfo(null);
        window.location.reload();
        return;
      }

      if (result && result.message) {
        setUpdateError(result.message);
      }
    } catch (error) {
      console.error('Install update failed:', error);
      setUpdateError('Update failed. Please try again later.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    if (updateInfo?.is_force_update) return;
    setUpdateInfo(null);
    setUpdateError('');
  };

  if (updateInfo && updateInfo.has_update) {
    return (
      <UpdateModal
        updateInfo={updateInfo}
        onConfirm={handleUpdateInstall}
        onLater={handleLater}
        isInstalling={isInstalling}
        errorMessage={updateError}
      />
    );
  }

  if (view === 'login') {
    return <Login onLoginSuccess={() => setView('dashboard')} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}