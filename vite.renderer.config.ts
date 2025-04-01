import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: './index.html'  // Changed to point to root index.html
      }
    }
  },
  optimizeDeps: {
    exclude: ['node-7z', 'electron']
  },
  resolve: {
    alias: {
      '@renderer': '/src/renderer',
      '@utils': '/src/renderer/utils',
      '@components': '/src/renderer/components',
      '@assets': '/src/renderer/assets'
    }
  },
  server: {
    strictPort: true,
  }
});