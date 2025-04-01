import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Mark these modules as external to prevent bundling
      external: [
        'electron',
        'node-7z',
        '7zip-bin',
        /node:.*/,
        'path',
        'fs',
        'child_process'
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    // Include 7zip-bin for proper resolution
    include: ['7zip-bin']
  }
});