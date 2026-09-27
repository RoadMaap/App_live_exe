import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
// نکته: اگر با ایمپورت پایین به مشکل خوردید، خط پایین را حذف کنید و از روش استاندارد استفاده کنید
// اما چون در فایل شما بود، من آن را نگه داشتم:
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // تغییر اصلی اینجاست: فایل eel.js را به لیست نادیده‌ها اضافه کردیم
  globalIgnores(['dist', 'public/eel.js']),
  
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
  },
])