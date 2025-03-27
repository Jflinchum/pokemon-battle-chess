import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import { keyLocation, certLocation } from './server/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(keyLocation),
      cert: fs.readFileSync(certLocation),
    },
    open: true,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        secure: false,
      }
    }
  },
})
