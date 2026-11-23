// Phase 7 (7.1) — port Vue de sandbox.tsx : contenu de l'iframe Sandbox.
// renderSandboxContent crée/monte une app Vue sur #__SANDBOX_ROOT__ (le
// bridge postMessage/global de vue-sandbox est inchangé, framework-agnostic).
import { h } from 'vue'
import { Content } from './content'
import { renderSandboxContent } from '@formivue-design/vue-sandbox'

renderSandboxContent(() => h(Content))
