import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Compatibilité avec les navigateurs plus anciens (le poste de démonstration a Chrome 96).
    target: ['chrome96', 'edge96', 'firefox100', 'safari15'],
  },
  server: {
    port: 5173,
    // En développement, /api est redirigé vers Laravel (php artisan serve).
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
