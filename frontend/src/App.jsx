import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext'; // ✅ اضافه شد
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function MainApp() {
  const [view, setView] = useState('login'); 

  if (view === 'login') {
    return <Login onLoginSuccess={() => setView('dashboard')} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider> {/* ✅ اضافه شد: کل برنامه داخل تم‌پروايدر قرار گرفت */}
        <MainApp />
      </ThemeProvider>
    </LanguageProvider>
  );
}