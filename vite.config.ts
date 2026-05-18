import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@blinkdotnew/ui': path.resolve(import.meta.dirname, './src/lib/blink-ui-shim.tsx'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
  }
});