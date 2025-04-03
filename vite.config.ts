import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import { keyLocation, certLocation } from './server/config';

const httpsOptions: { key?: any; cert?: any } = {}

try {
  httpsOptions.key = fs.readFileSync(keyLocation);
  httpsOptions.cert = fs.readFileSync(certLocation);
} catch (err) {
  console.log(err);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsOptions,
    open: true,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        secure: false,
      }
    }
  },
})
