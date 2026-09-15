import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to 0.0.0.0 so the dev server is reachable from other devices on
    // the same Wi-Fi (e.g. testing the camera flow on an actual phone).
    host: true,
    // Fail loudly if 5173 is taken instead of silently moving to 5174 — the
    // "open this on your phone" URL has to stay predictable.
    port: 5173,
    strictPort: true,
    // Proxy API calls to the backend server-side, so the browser only ever
    // talks to this origin (no CORS, no https-page-calling-http
    // mixed-content block).
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
