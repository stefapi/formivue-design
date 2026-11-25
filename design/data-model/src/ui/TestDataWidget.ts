import { createForm, onFormValuesChange } from '@formivue/core'
import { isEqual } from '@formivue/shared'
import {
  copyJson,
  pointerSegments,
  projectDocumentRows,
  valueAt,
  type JsonObject,
} from '@formivue/json-schema'
import { DataValuesEditor } from '@formivue-design/data-schema-editor'
import type {
  compileFormDocuments,
  FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  defineComponent,
  h,
  onUnmounted,
  watch,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import { createDocumentMessages } from './document-messages'

export interface DraftFormPreview {
  form: ReturnType<typeof createForm>
  compiled: ReturnType<typeof compileFormDocuments>
  scope: Record<string, unknown>
}

export const TestDataWidget = defineComponent({
  name: 'TestDataWidget',
  props: {
    compiled: Object as PropType<ReturnType<typeof compileFormDocuments>>,
    data: { type: Object as PropType<JsonObject>, required: true },
    schema: {
      type: Object as PropType<FormDocuments['dataSchema']>,
      required: true,
    },
    locale: String,
  },
  slots: Object as SlotsType<{
    preview?: (draft: DraftFormPreview) => VNodeChild
  }>,
  emits: { change: (data: JsonObject) => !!data },
  setup(props, { emit, slots }) {
    const { message } = createDocumentMessages(() => props.locale)
    let syncing = false
    const form = createForm<JsonObject>({
      values: copyJson(props.data) as JsonObject,
      effects() {
        onFormValuesChange((form) => {
          if (syncing) return
          const data = copyJson(form.values, true) as JsonObject
          if (!isEqual(data, props.data)) emit('change', data)
        })
      },
    })
    const scope = {
      $document: {
        read(
          pointer: string,
          base: string[] = [],
          columns?: Record<string, string[]>,
        ) {
          const value = valueAt(form.values, [
            ...base,
            ...pointerSegments(pointer),
          ])
          return value === undefined
            ? undefined
            : copyJson(columns ? projectDocumentRows(value, columns) : value)
        },
      },
    }
    watch(
      () => props.data,
      (data) => {
        if (isEqual(form.values, data)) return
        syncing = true
        try {
          form.setValues(copyJson(data), 'overwrite')
        } finally {
          syncing = false
        }
      },
    )
    onUnmounted(() => form.onUnmount())
    return () =>
      h('div', { class: 'grid min-w-0 items-start gap-4 lg:grid-cols-2' }, [
        props.compiled && slots.preview
          ? h('section', { class: 'min-w-0 rounded-md border p-3' }, [
              h(
                'h3',
                { class: 'mb-3 font-semibold' },
                message([
                  'Form fields',
                  'Champs du formulaire',
                  'Campos del formulario',
                ]),
              ),
              slots.preview({ form, compiled: props.compiled, scope }),
            ])
          : null,
        h('section', { class: 'min-w-0 rounded-md border p-3' }, [
          h(
            'h3',
            { class: 'mb-3 font-semibold' },
            message([
              'All data properties',
              'Toutes les propriétés de données',
              'Todas las propiedades de datos',
            ]),
          ),
          h(DataValuesEditor, {
            modelValue: props.data,
            schema: props.schema,
            locale: props.locale,
            'onUpdate:modelValue': (value) => emit('change', value),
          }),
        ]),
      ])
  },
})
