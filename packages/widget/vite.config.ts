import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(), tailwindcss()],
  server: {
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
