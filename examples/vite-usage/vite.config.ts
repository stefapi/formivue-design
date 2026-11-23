import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: import.meta.dirname,
  publicDir: fileURLToPath(new URL('../../branding', import.meta.url)),
  plugins: [vue(), tailwindcss()],
})
