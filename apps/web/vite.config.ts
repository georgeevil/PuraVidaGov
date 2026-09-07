import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client always uses relative `/api/...` URLs. In dev Vite proxies them to the API;
// in Docker nginx does the same (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
