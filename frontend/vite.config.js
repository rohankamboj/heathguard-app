import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default to localhost so dev server startup does not rely on os.networkInterfaces()
// (can throw on some macOS/VPN/sandbox setups). Use VITE_DEV_HOST=0.0.0.0 for LAN/Docker.
const devHost = process.env.VITE_DEV_HOST || 'localhost'

export default defineConfig({
  plugins: [react()],
  server: {
    host: devHost,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
