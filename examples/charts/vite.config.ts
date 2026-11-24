import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  publicDir: fileURLToPath(new URL('../../branding', import.meta.url)),
  plugins: [vue(), tailwindcss()],
  server: { host: '127.0.0.1', port: 3005 },
})
