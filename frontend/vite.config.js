import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiPort = Number(process.env.VITE_API_PORT || process.env.PORT || 5000);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    proxy: {
      '/login': `http://localhost:${apiPort}`,
      '/register': `http://localhost:${apiPort}`,
      '/reset-password': `http://localhost:${apiPort}`,
      '/users': `http://localhost:${apiPort}`,
      '/upload-excel': `http://localhost:${apiPort}`,
      '/member-template': `http://localhost:${apiPort}`,
      '/upload-logo': `http://localhost:${apiPort}`,
      '/candidate-logo': `http://localhost:${apiPort}`,
      '/voters-list': `http://localhost:${apiPort}`,
      '/has-voted': `http://localhost:${apiPort}`,
      '/ballots': `http://localhost:${apiPort}`,
      '/admin': `http://localhost:${apiPort}`,
      '/uploads': `http://localhost:${apiPort}`,
    }
  }
});
