import {
  applyJsonPatch,
  isJsonObject,
  jsonPointer,
  valueAt,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'
import { Button } from '@formivue-design/vue-ui'
import type { FormDocuments } from '@formivue-design/formivue-transformer'
import { computed, defineComponent, h, ref, watch, type PropType } from 'vue'

function valuePaths(
  value: unknown,
  schema: unknown,
  root: FormDocuments['dataSchema'],
  path: string[] = [],
): string[][] {
  let shape = isJsonObject(schema) ? schema : {}
  if (typeof shape.$ref === 'string' && shape.$ref.startsWith('#/')) {
    const definition = valueAt(
      root,
      shape.$ref
        .slice(2)
        .split('/')
        .map((part) => part.replace(/~1/gu, '/').replace(/~0/gu, '~')),
    )
    if (isJsonObject(definition)) shape = { ...definition, ...shape }
  }
  if (Array.isArray(value)) {
    return [
      path,
      ...value.flatMap((item, index) =>
        valuePaths(
          item,
          (Array.isArray(shape.prefixItems) && shape.prefixItems[index]) ||
            shape.items,
          root,
          [...path, String(index)],
        ),
      ),
    ]
  }
  const properties = isJsonObject(shape.properties) ? shape.properties : {}
  const fields = isJsonObject(value) ? value : {}
  const keys = new Set([...Object.keys(fields), ...Object.keys(properties)])
  return [
    path,
    ...[...keys].flatMap((key) => {
      const child = [...path, key]
      return Object.prototype.hasOwnProperty.call(fields, key)
        ? valuePaths(fields[key], properties[key], root, child)
        : [child]
    }),
  ]
}

export const DataValuesEditor = defineComponent({
  name: 'DataValuesEditor',
  props: {
    modelValue: { type: Object as PropType<JsonObject>, required: true },
    schema: {
      type: Object as PropType<FormDocuments['dataSchema']>,
      required: true,
    },
    locale: { type: String, default: 'en' },
  },
  emits: { 'update:modelValue': (data: JsonObject) => !!data },
  setup(props, { emit }) {
    const selection = ref('')
    const input = ref('')
    const invalid = ref(false)
    const t = (en: string, fr: string, es: string) =>
      props.locale.startsWith('fr')
        ? fr
        : props.locale.startsWith('es')
          ? es
          : en
    const locations = computed(() =>
      valuePaths(props.modelValue, props.schema, props.schema).map((path) => ({
        path,
        pointer: jsonPointer(path),
      })),
    )
    const selected = computed(
      () =>
        locations.value.find(
          (location) => location.pointer === selection.value,
        ) ?? locations.value[0],
    )
    const value = computed(() => valueAt(props.modelValue, selected.value.path))
    watch(
      [value, selection],
      () => {
        input.value = JSON.stringify(value.value, null, 2) ?? ''
        invalid.value = false
      },
      { immediate: true },
    )

    function change(remove = false) {
      try {
        const { pointer } = selected.value
        const next = remove ? undefined : (JSON.parse(input.value) as JsonValue)
        if (!pointer) {
          if (!isJsonObject(next)) throw new Error()
          emit('update:modelValue', next)
        } else {
          emit(
            'update:modelValue',
            applyJsonPatch(props.modelValue, [
              remove
                ? { op: 'remove', path: pointer }
                : {
                    op: value.value === undefined ? 'add' : 'replace',
                    path: pointer,
                    value: next,
                  },
            ]) as JsonObject,
          )
        }
        invalid.value = false
      } catch {
        invalid.value = true
      }
    }
    return () =>
      h('div', { class: 'grid min-w-0 gap-3' }, [
        h('label', { class: 'grid gap-1 text-sm' }, [
          t('Data path', 'Chemin de données', 'Ruta de datos'),
          h(
            'select',
            {
              class: 'min-w-0 rounded border bg-background p-2',
              'aria-label': t(
                'Data path',
                'Chemin de données',
                'Ruta de datos',
              ),
              value: selected.value.pointer,
              onChange: (event: Event) => {
                selection.value = (event.target as HTMLSelectElement).value
              },
            },
            locations.value.map(({ pointer }) =>
              h('option', { value: pointer }, pointer || '/'),
            ),
          ),
        ]),
        h('label', { class: 'grid gap-1 text-sm' }, [
          t('JSON value', 'Valeur JSON', 'Valor JSON'),
          h('textarea', {
            rows: 4,
            class: 'min-w-0 rounded border bg-background p-2 font-mono',
            value: input.value,
            onInput: (event: Event) => {
              input.value = (event.target as HTMLTextAreaElement).value
              invalid.value = false
            },
          }),
        ]),
        invalid.value &&
          h(
            'p',
            { role: 'alert', class: 'text-sm text-destructive' },
            t(
              'Enter a valid JSON value',
              'Saisir une valeur JSON valide',
              'Introduce un valor JSON válido',
            ),
          ),
        h('div', { class: 'flex flex-wrap gap-2' }, [
          h(Button, { size: 'small', onClick: () => change() }, () =>
            t(
              'Set test value',
              'Définir la valeur d’essai',
              'Definir valor de prueba',
            ),
          ),
          selected.value.pointer && value.value !== undefined
            ? h(
                Button,
                {
                  variant: 'outline',
                  size: 'small',
                  onClick: () => change(true),
                },
                () => t('Remove value', 'Retirer la valeur', 'Quitar valor'),
              )
            : null,
        ]),
      ])
  },
})
