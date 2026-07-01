/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui'],
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        page: '#09090b', // رنگ پس‌زمینه اصلی
        panel: '#121215', // رنگ پنل‌ها
        border: 'rgba(255,255,255,0.06)',
        primary: '#10b981', // سبز زمردی
        danger: '#f43f5e', // قرمز
      },
    },
  },
  plugins: [],
}