import { ref, onScopeDispose, type Ref } from 'vue'
import { autorun } from '@formivue/reactive'
import type { Form } from '@formivue/core'

/**
 * Pont @formivue/reactive -> Vue (cf. guide reactive-vs-juke) :
 * un `autorun` formivue track la lecture de `form.values` (getter observable
 * formivue) et pousse un **snapshot** dans un `ref` Vue.
 *
 * ⚠ Ne PAS lire via `raw(form.values)` ici : la lecture hors Proxy n'est pas
 * traquée par l'autorun (cf. docs guide/reactive-vs-vue.md, « ne jamais mixer »).
 * Le snapshot assure que le `ref` change de référence à chaque mutation.
 */
export function useFormValues(form: Form): Ref<Record<string, any>> {
  const values = ref<Record<string, any>>({})
  const dispose = autorun(() => {
    const snapshot = form.values // lecture traquée
    values.value = JSON.parse(JSON.stringify(snapshot))
  })
  onScopeDispose(() => dispose())
  return values
}
