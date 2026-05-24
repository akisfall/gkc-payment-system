import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@shared': '../shared'
    }
  },
  build: {
    outDir: '../backend/public'
  }
});