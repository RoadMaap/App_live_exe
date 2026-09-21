import React, { createContext, useState, useContext, useEffect } from 'react';
import safeStorage from '../lib/safeStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = safeStorage.getItem('app_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }

        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        safeStorage.setItem('app_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.add('theme-transitioning');
            window.setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 130);
        }
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom consumer hook with crash-resilient default fallback
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        console.warn("useTheme invoked outside of ThemeProvider scope. Falling back to static dark context.");
        return { theme: 'dark', toggleTheme: () => {}, isDark: true };
    }
    return context;
};