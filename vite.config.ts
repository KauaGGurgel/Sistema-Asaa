import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  // Fix TS error by casting process to any to access cwd()
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // Base './' é crucial para o GitHub Pages funcionar em subdiretórios
    base: './', 
    plugins: [react()],
    define: {
      // Garante que process.env.API_KEY funcione mesmo no browser
      'process.env': {
        ...env,
        API_KEY: process.env.API_KEY || env.API_KEY
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  }
})