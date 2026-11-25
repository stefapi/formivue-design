import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from 'vue'
import type { TreeNode } from '@formivue-design/core'
import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  transformToFormDocuments,
  type DocumentContractRegistry,
  type CompileFormDocumentOptions,
  type FormDocumentJson,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { Button } from '@formivue-design/vue-ui'
import { DataSchemaEditor } from '@formivue-design/data-schema-editor'
import { formDocumentFileNames as files } from '../document-files'
import { createDocumentMessages } from './document-messages'
import { downloadJson } from './download-json'

export const DocumentEditorWidget = defineComponent({
  name: 'DocumentEditorWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    contracts: Object as PropType<DocumentContractRegistry>,
    hasComponent: Function as PropType<
      CompileFormDocumentOptions['hasComponent']
    >,
    locale: String,
    showVisualSchema: { type: Boolean, default: true },
    documents: Object as PropType<FormDocuments>,
    draft: Object as PropType<FormDocumentJson>,
    onDraft: Function as PropType<(draft: FormDocumentJson) => void>,
    onReload: Function as PropType<() => void>,
    onModel: Function as PropType<() => void>,
    onApply: {
      type: Function as PropType<
        (documents: FormDocuments) => readonly string[] | void
      >,
      required: true,
    },
    onCanvas: { type: Function as PropType<() => void>, required: true },
  },
  slots: Object as SlotsType<{ legacy?: () => VNode[] }>,
  setup(props, { slots }) {
    const { message, documentError, conflictMessage } = createDocumentMessages(
      () => props.locale,
    )
    const part = ref<keyof FormDocuments | 'legacy'>('ui')
    const contents = ref<FormDocumentJson>({ ui: '', dataSchema: '', data: '' })
    const visualSchema = ref(true)
    const schema = computed<FormDocuments['dataSchema']>(() => {
      try {
        const value = JSON.parse(contents.value.dataSchema)
        if (value && typeof value === 'object' && !Array.isArray(value))
          return value
      } catch {
        // The JSON editor remains available while the source is incomplete.
      }
    })
    const error = ref('')
    let mounted = true
    onBeforeUnmount(() => {
      mounted = false
    })
    const canvasDocuments = () =>
      transformToFormDocuments(props.tree, undefined, {
        contracts: props.contracts,
      })
    const setDocuments = (read: () => FormDocuments) => {
      try {
        contents.value = stringifyFormDocuments(read())
        error.value = ''
      } catch (cause) {
        error.value = documentError(cause)
      }
    }
    setDocuments(() => props.documents ?? canvasDocuments())
    watch(
      () => props.draft,
      (draft) => {
        if (draft) contents.value = { ...draft }
      },
      { immediate: true },
    )
    const write = (key: keyof FormDocuments, value: string) => {
      contents.value = { ...contents.value, [key]: value }
      props.onDraft?.(contents.value)
    }

    const download = (key: keyof FormDocuments) => {
      try {
        const session = createFormDocument(parseFormDocuments(contents.value), {
          contracts: props.contracts,
          hasComponent: props.hasComponent,
        })
        try {
          const canonical = stringifyFormDocuments(session.exportDocuments())
          downloadJson(files[key], canonical[key])
        } finally {
          session.dispose()
        }
        error.value = ''
      } catch (cause) {
        error.value = documentError(cause)
        return
      }
    }

    return () => {
      const selected = part.value
      return h('section', { class: 'flex h-full min-h-0 flex-col gap-3 p-3' }, [
        h('div', { class: 'flex flex-wrap items-center gap-2' }, [
          props.onModel &&
            h(Button, { size: 'small', onClick: props.onModel }, () =>
              message([
                'Back to data model',
                'Retour au modèle de données',
                'Volver al modelo de datos',
              ]),
            ),
          h(
            'select',
            {
              'aria-label': message([
                'JSON document',
                'Document JSON',
                'Documento JSON',
              ]),
              class: 'rounded border border-input bg-background p-2 text-sm',
              value: selected,
              onChange: (event: Event) => {
                part.value = (event.target as HTMLSelectElement)
                  .value as typeof selected
              },
            },
            [
              ...Object.entries(files).map(([key, label]) =>
                h('option', { value: key }, label),
              ),
              slots.legacy &&
                h(
                  'option',
                  { value: 'legacy' },
                  message([
                    'Formivue JSON',
                    'JSON Formivue',
                    'JSON de Formivue',
                  ]),
                ),
            ],
          ),
          props.showVisualSchema && selected === 'dataSchema' && schema.value
            ? h(
                Button,
                {
                  size: 'small',
                  variant: 'outline',
                  onClick: () => {
                    visualSchema.value = !visualSchema.value
                  },
                },
                () =>
                  visualSchema.value
                    ? message([
                        'Edit JSON source',
                        'Éditer le JSON',
                        'Editar JSON',
                      ])
                    : message([
                        'Visual editor',
                        'Éditeur graphique',
                        'Editor visual',
                      ]),
              )
            : null,
          ...(selected === 'legacy'
            ? []
            : [
                h(
                  Button,
                  {
                    size: 'small',
                    onClick: () => {
                      if (props.onReload) props.onReload()
                      else {
                        setDocuments(() => props.documents ?? canvasDocuments())
                        props.onDraft?.(contents.value)
                      }
                      error.value = ''
                    },
                  },
                  () =>
                    message([
                      'Reload documents',
                      'Recharger les documents',
                      'Recargar documentos',
                    ]),
                ),
                h(
                  Button,
                  { size: 'small', onClick: () => download(selected) },
                  () => message(['Download', 'Télécharger', 'Descargar']),
                ),
                h('input', {
                  key: selected,
                  type: 'file',
                  accept: '.json,application/json',
                  'aria-label': message(
                    ['Import {file}', 'Importer {file}', 'Importar {file}'],
                    { file: files[selected] },
                  ),
                  class: 'max-w-52 text-sm',
                  onChange: async (event: Event) => {
                    const input = event.target as HTMLInputElement
                    const file = input.files?.[0]
                    if (!file) return
                    try {
                      const source = await file.text()
                      if (!mounted) return
                      write(selected, source)
                      error.value = ''
                    } catch (cause) {
                      error.value = documentError(cause)
                    }
                    input.value = ''
                  },
                }),
                h(
                  Button,
                  {
                    type: 'primary',
                    size: 'small',
                    onClick: () => {
                      try {
                        const conflicts = props.onApply(
                          parseFormDocuments(contents.value),
                        )
                        error.value =
                          conflicts && conflicts.length
                            ? conflictMessage(conflicts)
                            : ''
                      } catch (cause) {
                        error.value = documentError(cause)
                      }
                    },
                  },
                  () =>
                    message([
                      'Apply to preview',
                      'Appliquer à l’aperçu',
                      'Aplicar a la vista previa',
                    ]),
                ),
                ...(props.documents
                  ? [
                      h(
                        Button,
                        {
                          size: 'small',
                          onClick: () => {
                            props.onCanvas()
                            if (!props.onDraft) setDocuments(canvasDocuments)
                          },
                        },
                        () =>
                          message([
                            'Preview canvas',
                            'Aperçu du canevas',
                            'Vista previa del lienzo',
                          ]),
                      ),
                    ]
                  : []),
              ]),
        ]),
        error.value
          ? h(
              'p',
              {
                role: 'alert',
                class: 'whitespace-pre-wrap text-sm text-destructive',
              },
              error.value,
            )
          : null,
        selected === 'legacy'
          ? h('div', { class: 'min-h-0 flex-1' }, slots.legacy?.())
          : props.showVisualSchema &&
              selected === 'dataSchema' &&
              visualSchema.value &&
              schema.value
            ? h(DataSchemaEditor, {
                modelValue: schema.value,
                locale: props.locale,
                'onUpdate:modelValue': (value) => {
                  write('dataSchema', JSON.stringify(value, null, 2))
                  error.value = ''
                },
              })
            : h('textarea', {
                key: selected,
                'aria-label': files[selected],
                spellcheck: false,
                value: contents.value[selected],
                class:
                  'min-h-0 flex-1 resize-none rounded border border-input bg-background p-3 font-mono text-sm',
                onInput: (event: Event) => {
                  write(selected, (event.target as HTMLTextAreaElement).value)
                },
              }),
      ])
    }
  },
})
