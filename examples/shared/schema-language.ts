import { observable } from '@formivue/reactive'
import { watchEffect } from 'vue'
import {
  exampleLanguage,
  localeTags,
  localize,
  messageFor,
  type Message,
} from './language'

type Catalog = Readonly<Record<string, Message>>

export function createExampleSchemaScope(catalog: Catalog) {
  const state = observable({ language: exampleLanguage.value })
  watchEffect(
    () => {
      state.language = exampleLanguage.value
    },
    { flush: 'sync' },
  )
  return {
    $exampleText: (text: string) => messageFor(state.language, catalog[text]),
    $exampleLocale: () => localeTags[state.language],
  }
}

export function translateExampleSchema<T>(schema: T, catalog: Catalog): T {
  if (
    typeof schema === 'string' &&
    Object.prototype.hasOwnProperty.call(catalog, schema)
  )
    return `{{ $exampleText(${JSON.stringify(schema)}) }}` as T
  if (Array.isArray(schema))
    return schema.map((item) => translateExampleSchema(item, catalog)) as T
  if (
    schema &&
    typeof schema === 'object' &&
    Object.getPrototypeOf(schema) === Object.prototype
  ) {
    const node = schema as Record<string, unknown>
    const component = node['x-component']
    const direct = [
      'ArrayTable.Column',
      'FormTab.TabPane',
      'FormCollapse.CollapsePanel',
    ].includes(String(component))
    const result = Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        key === 'default' || key === 'value'
          ? value
          : // These headings are read directly from the schema.
            direct && key === 'x-component-props'
            ? localize(value, catalog)
            : translateExampleSchema(value, catalog),
      ]),
    )
    if (component === 'NumberPicker') {
      const props = result['x-component-props']
      result['x-component-props'] = {
        ...(props && typeof props === 'object' ? props : {}),
        locale: '{{ $exampleLocale() }}',
      }
    }
    return result as T
  }
  return schema
}
