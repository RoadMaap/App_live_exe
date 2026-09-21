import React, { useEffect, useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/auth/Login';
import Dashboard from './components/home/Dashboard';

function UpdateModal({ updateInfo, onConfirm, onLater }) {
  const isForce = Boolean(updateInfo?.is_force_update);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(6, 10, 18, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
    }}>
      <div style={{
        width: 'min(540px, 100%)',
        background: '#111827',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 20px 70px rgba(0,0,0,0.45)',
        color: '#f8fafc',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          {isForce ? 'Required update' : 'New version available'}
        </div>

        <div style={{ color: '#cbd5e1', marginBottom: 12 }}>
          {isForce
            ? 'This update is required to continue using RoadMaps safely.'
            : 'A newer version of RoadMaps is available.'}
        </div>

        <div style={{ marginBottom: 10, color: '#dbeafe' }}>
          <strong>Current:</strong> {updateInfo?.current_version || 'unknown'}
        </div>
        <div style={{ marginBottom: 18, color: '#dbeafe' }}>
          <strong>Latest:</strong> {updateInfo?.latest_version || 'unknown'}
        </div>

        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(148,163,184,0.25)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 22,
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
          minHeight: 90,
        }}>
          {updateInfo?.changelog || 'Improved stability and security updates.'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {!isForce && (
            <button
              onClick={onLater}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Later
            </button>
          )}

          <button
            onClick={onConfirm}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {isForce ? 'Update now' : 'Update now'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [view, setView] = useState('login');
<<<<<<< HEAD
=======
  const [updateInfo, setUpdateInfo] = useState(null);

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

    try {
      const result = await window.eel.download_and_install_update()();
      if (result && result.success) {
        setUpdateInfo(null);
        window.location.reload();
        return;
      }

      if (result && result.message) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Install update failed:', error);
      alert('Update failed. Please try again later.');
    }
  };

  const handleLater = () => {
    setUpdateInfo(null);
  };

  if (updateInfo && updateInfo.has_update) {
    return (
      <UpdateModal
        updateInfo={updateInfo}
        onConfirm={handleUpdateInstall}
        onLater={handleLater}
      />
    );
  }
>>>>>>> 737967bc704de09d328468ff4290a4e61852c1fe

  if (view === 'login') {
    return <Login onLoginSuccess={() => setView('dashboard')} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
<<<<<<< HEAD
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
=======
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
>>>>>>> 737967bc704de09d328468ff4290a4e61852c1fe
  );
}