import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  // O cast (process as any) evita erros de TypeScript no ambiente de build
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // Base './' é OBRIGATÓRIO para o GitHub Pages funcionar em subpastas
    base: './', 
    plugins: [react()],
    define: {
      // Define process.env para evitar erros no código cliente que usa process.env.API_KEY
      'process.env': JSON.stringify({
        API_KEY: process.env.API_KEY || env.API_KEY,
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
      })
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  }
})