import * as Core from './exports'
export * from './exports'
import { globalThisPolyfill } from '@formivue-design/shared'

if (globalThisPolyfill?.['FormivueDesign']?.['Core']) {
  // ESM (phase 4+) : `module` n'existe pas — le partage d'instance avec
  // l'iframe Sandbox passe par l'external global `FormivueDesign.Core`.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      __esModule: true,
      ...globalThisPolyfill['FormivueDesign']['Core'],
    }
  }
} else {
  globalThisPolyfill['FormivueDesign'] =
    globalThisPolyfill['FormivueDesign'] || {}
  globalThisPolyfill['FormivueDesign'].Core = Core
}
