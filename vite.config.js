import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  define: {
    // Use different API base for development vs production
    __API_BASE__: JSON.stringify(process.env.NODE_ENV === 'production' ? '/api' : '/api')
  }
})
