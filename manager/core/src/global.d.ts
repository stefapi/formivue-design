import * as Types from './types'
import * as Models from './models'

declare global {
  namespace Formivue.Core {
    export { Types, Models }
  }
}
