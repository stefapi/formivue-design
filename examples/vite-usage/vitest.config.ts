import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  test: {
    name: 'vite-usage',
    environment: 'jsdom',
    setupFiles: ['../../scripts/test-setup.ts'],
  },
})
