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
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot', '**/*.svg', '**/*.png'],
  optimizeDeps: {
    include: ['@fontsource-variable/exo-2'],
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