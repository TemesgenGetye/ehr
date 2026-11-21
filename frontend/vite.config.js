import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/search': 'http://127.0.0.1:8000',
      '/patients': 'http://127.0.0.1:8000',
      '/pipeline': 'http://127.0.0.1:8000',
    },
  },
});
