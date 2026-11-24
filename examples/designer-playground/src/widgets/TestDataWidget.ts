import { createForm, onFormValuesChange } from '@formivue/core'
import { isEqual } from '@formivue/shared'
import {
  copyJson,
  pointerSegments,
  projectDocumentRows,
  valueAt,
  type JsonObject,
} from '@formivue/json-schema'
import type { TreeNode } from '@formivue-design/core'
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
  type Component,
  type PropType,
} from 'vue'
import { exampleLocale, message } from '../../../shared/language'
import { PreviewWidget } from './PreviewWidget'

export const TestDataWidget = defineComponent({
  name: 'TestDataWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    compiled: Object as PropType<ReturnType<typeof compileFormDocuments>>,
    data: { type: Object as PropType<JsonObject>, required: true },
    schema: {
      type: Object as PropType<FormDocuments['dataSchema']>,
      required: true,
    },
    materials: Object as PropType<Record<string, Component>>,
  },
  emits: { change: (data: JsonObject) => !!data },
  setup(props, { emit }) {
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
        props.compiled
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
              h(PreviewWidget, {
                tree: props.tree,
                materials: props.materials,
                draft: { form, compiled: props.compiled, scope },
              }),
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
            locale: exampleLocale.value,
            'onUpdate:modelValue': (value) => emit('change', value),
          }),
        ]),
      ])
  },
})
