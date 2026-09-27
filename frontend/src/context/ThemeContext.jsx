import React, { createContext, useState, useContext, useEffect } from 'react';

// ایجاد کانتکست برای مدیریت تم (دارک/لایت)
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // خواندن تم قبلی از حافظه مرورگر یا استفاده از حالت دارک به عنوان پیش‌فرض
    const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');

    useEffect(() => {
        // اعمال کلاس 'dark' روی کل داکیومنت HTML برای Tailwind CSS
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // ذخیره تم در حافظه
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// هوک کاستوم برای استفاده راحت در داشبورد
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // این هشدار جلوی کرش کردن را می‌گیرد و مقدار پیش‌فرض می‌دهد
        console.warn("useTheme must be used within a ThemeProvider");
        return { theme: 'dark', toggleTheme: () => {} };
    }
    return context;
};