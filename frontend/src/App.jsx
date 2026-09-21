import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/auth/Login';
import Dashboard from './components/home/Dashboard';

function MainApp() {
  const [view, setView] = useState('login');

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