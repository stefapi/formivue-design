/// <reference types="@formivue/core" />
/// <reference types="@formivue/json-schema" />
import * as Types from './types'
declare global {
  namespace Formivue.Vue {
    export { Types }
  }
}
