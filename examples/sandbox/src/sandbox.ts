// Phase 7 (7.1) — port Vue de sandbox.tsx : contenu de l'iframe Sandbox
// (bundle IIFE, cf. vite.sandbox.config.mts).
import { h } from 'vue'
import { Content } from './content'
import { renderSandboxContent } from '@formivue-design/vue-sandbox'

renderSandboxContent(() => h(Content))
