import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /api 요청을 Express(4000)로 넘긴다. 브라우저 CORS 설정이 필요 없다.
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
