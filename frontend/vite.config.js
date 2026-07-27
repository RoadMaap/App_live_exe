import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Force Vite to bind to IPv4 loopback to prevent localhost resolution mismatch
    host: '127.0.0.1',
  }
})