import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 9010,
    host: true,
    allowedHosts: [
      'pharma.vimedika.com',
      'www.pharma.vimedika.com',
      'localhost',
      '200.200.200.2',
      '47.241.27.87'
    ]
  }
});
