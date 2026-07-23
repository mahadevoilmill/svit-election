import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    proxy: {
      '/login': 'http://localhost:5000',
      '/register': 'http://localhost:5000',
      '/reset-password': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/upload-excel': 'http://localhost:5000',
      '/member-template': 'http://localhost:5000',
      '/upload-logo': 'http://localhost:5000',
      '/candidate-logo': 'http://localhost:5000',
      '/voters-list': 'http://localhost:5000',
      '/has-voted': 'http://localhost:5000',
      '/ballots': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    }
  }
});
