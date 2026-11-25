import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

const resolve = (dir: string) => fileURLToPath(new URL(dir, import.meta.url))

export default defineConfig({
  title: 'Formivue',
  description: 'Vue binding for @formivue/core',
  head: [
    [
      'link',
      { rel: 'icon', type: 'image/svg+xml', href: '/formivue-mark.svg' },
    ],
  ],
  vite: {
    publicDir: resolve('../../../../branding'),
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@formivue/vue': resolve('../../src'),
        '@formivue/reactive-vue': resolve('../../../reactive-vue/src'),
        '@formivue/core': resolve('../../../core/src'),
        '@formivue/grid': resolve('../../../grid/src'),
        '@formivue/json-schema': resolve('../../../json-schema/src'),
        '@formivue/shared': resolve('../../../shared/src'),
        '@formivue/path': resolve('../../../path/src'),
        '@formivue/reactive': resolve('../../../reactive/src'),
        '@formivue/validator': resolve('../../../validator/src'),
      },
    },
  },
  themeConfig: {
    logo: '/formivue-mark.svg',
    nav: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/stefapi/formivue-design',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Formivue v3', link: '/guide/whats-new' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Core engine (@formivue/core)', link: '/guide/core' },
            { text: 'Effects & lifecycle hooks', link: '/guide/effects' },
            {
              text: 'Vue components & hooks (@formivue/vue)',
              link: '/guide/vue-components',
            },
            { text: 'JSON Schema', link: '/guide/json-schema' },
            { text: 'Validation', link: '/guide/validation' },
            { text: 'Reactivity', link: '/guide/reactive' },
            {
              text: 'Utilities (shared, path, grid)',
              link: '/guide/utilities',
            },
            { text: 'reactive vs Vue', link: '/guide/reactive-vs-vue' },
            {
              text: 'Ecosystem bridges (zod, i18n)',
              link: '/guide/ecosystem-bridges',
            },
          ],
        },
      ],
    },
  },
})
