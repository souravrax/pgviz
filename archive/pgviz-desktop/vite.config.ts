import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    host: process.env.TAURI_DEV_HOST ? '0.0.0.0' : false,
    hmr: process.env.TAURI_DEV_HOST
      ? {
          protocol: 'ws',
          host: process.env.TAURI_DEV_HOST || 'localhost',
          port: 5173,
        }
      : undefined,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}))
