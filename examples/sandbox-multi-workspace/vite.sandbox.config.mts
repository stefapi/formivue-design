// Phase 7 (7.1) — bundle IIFE du contenu de l'iframe Sandbox (port du
// contrat d'ère à la pile Vue) : le <Sandbox> écrit une iframe qui charge
// les jsAssets dans l'ordre — la distribution Vue locale (global Vue),
// puis ./sandbox.bundle.js (ce build) qui
// appelle renderSandboxContent(<Content />). vue reste un external global ;
// les @formivue-design/vue + @formivue/reactive-vue sont bundleés dans l'IIFE.
//
// @formivue-design/core et @formivue/reactive DOIVENT être les instances de la
// page parente (contrat d'ère : le <Sandbox> injecte window.FormivueDesign /
// window.Formivue dans l'iframe) — sinon registre, TreeNode et tracking
// réactif sont dupliqués et le canvas ne réagit plus.
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  publicDir: false,
  plugins: [vue()],
  build: {
    minify: false,
    outDir: 'public',
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/sandbox.ts', import.meta.url)),
      formats: ['iife'],
      name: 'FormivueDesignSandbox',
      fileName: () => 'sandbox.bundle.js',
    },
    rolldownOptions: {
      external: ['vue', '@formivue-design/core', '@formivue/reactive'],
      output: {
        globals: {
          vue: 'Vue',
          '@formivue-design/core': 'FormivueDesign.Core',
          '@formivue/reactive': 'Formivue.Reactive',
        },
      },
    },
  },
})
