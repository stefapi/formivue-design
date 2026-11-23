// vue-settings-form — useSnapshot (port verbatim de l'ère : effet formivue,
// debounce 1s → operation.snapshot('update:node:props')).
import type { Operation } from '@formivue-design/core'
import { onFieldInputValueChange } from '@formivue/core'

let timeRequest: any = null

export const useSnapshot = (operation: Operation) => {
  onFieldInputValueChange('*', () => {
    clearTimeout(timeRequest)
    timeRequest = setTimeout(() => {
      operation.snapshot('update:node:props')
    }, 1000)
  })
}
