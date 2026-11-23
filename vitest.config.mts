import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'workspaces',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./scripts/test-setup.ts'],
          include: [
            'manager/**/__tests__/**/*.spec.[jt]s?(x)',
            'design/**/__tests__/**/*.spec.[jt]s?(x)',
            'examples/designer-playground/**/__tests__/**/*.spec.[jt]s?(x)',
            'scripts/**/__tests__/**/*.spec.[jt]s?(x)',
          ],
          alias: {
            // Manager tests consume the built packages. Designer tests use source.
            '@formivue': resolve('./manager'),
            '@formivue-design/shared': resolve('./design/shared/src'),
            '@formivue-design/core': resolve('./design/core/src'),
            '@formivue-design/vue-ui': resolve('./design/vue-ui/src'),
            '@formivue-design/vue': resolve('./design/vue/src'),
            '@formivue-design/vue-sandbox': resolve('./design/vue-sandbox/src'),
            '@formivue-design/vue-settings-form': resolve(
              './design/vue-settings-form/src',
            ),
            '@formivue-design/formivue-transformer': resolve(
              './design/formivue-transformer/src',
            ),
            '@formivue-design/formivue-setters': resolve(
              './design/formivue-setters/src',
            ),
            '@formivue-design/formivue-vue': resolve(
              './design/formivue-vue/src',
            ),
          },
        },
      },
      './examples/vite-usage/vitest.config.ts',
    ],
  },
})
