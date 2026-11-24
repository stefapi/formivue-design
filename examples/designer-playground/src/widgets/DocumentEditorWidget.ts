import { defineComponent, h, ref, type PropType } from 'vue'
import type { ITreeNode, TreeNode } from '@formivue-design/core'
import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  transformToFormDocuments,
  type FormDocumentJson,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { Button } from '@formivue-design/vue-ui'
import { message } from '../../../shared/language'
import { documentError } from '../../../shared/document-messages'
import { SchemaEditorWidget } from './SchemaEditorWidget'

const files = {
  ui: 'ui.json',
  dataSchema: 'data.schema.json',
  data: 'data.json',
} satisfies Record<keyof FormDocuments, string>

export const DocumentEditorWidget = defineComponent({
  name: 'DocumentEditorWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    documents: Object as PropType<FormDocuments>,
    onApply: {
      type: Function as PropType<
        (documents: FormDocuments) => readonly string[] | void
      >,
      required: true,
    },
    onCanvas: { type: Function as PropType<() => void>, required: true },
    onChange: Function as PropType<(tree: ITreeNode) => void>,
  },
  setup(props) {
    const part = ref<keyof FormDocuments | 'legacy'>('ui')
    const contents = ref<FormDocumentJson>({ ui: '', dataSchema: '', data: '' })
    const error = ref('')
    const setDocuments = (read: () => FormDocuments) => {
      try {
        contents.value = stringifyFormDocuments(read())
        error.value = ''
      } catch (cause) {
        error.value = documentError(cause)
      }
    }
    setDocuments(() => props.documents ?? transformToFormDocuments(props.tree))

    const download = (key: keyof FormDocuments) => {
      try {
        createFormDocument(parseFormDocuments(contents.value)).dispose()
        error.value = ''
      } catch (cause) {
        error.value = documentError(cause)
        return
      }
      const url = URL.createObjectURL(
        new Blob([contents.value[key]], { type: 'application/json' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = files[key]
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }

    return () => {
      const selected = part.value
      return h('section', { class: 'flex h-full min-h-0 flex-col gap-3 p-3' }, [
        h('div', { class: 'flex flex-wrap items-center gap-2' }, [
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
              h(
                'option',
                { value: 'legacy' },
                message(['Formivue JSON', 'JSON Formivue', 'JSON de Formivue']),
              ),
            ],
          ),
          ...(selected === 'legacy'
            ? []
            : [
                h(
                  Button,
                  {
                    size: 'small',
                    onClick: () =>
                      setDocuments(
                        () =>
                          props.documents ??
                          transformToFormDocuments(props.tree),
                      ),
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
                      contents.value[selected] = await file.text()
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
                            ? message(
                                [
                                  'Remote updates overlap local edits: {paths}',
                                  'Des mises à jour distantes touchent la saisie : {paths}',
                                  'Las actualizaciones remotas afectan a los cambios locales: {paths}',
                                ],
                                { paths: conflicts.join(', ') },
                              )
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
                            setDocuments(() =>
                              transformToFormDocuments(props.tree),
                            )
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
          ? h(
              'div',
              { class: 'min-h-0 flex-1' },
              h(SchemaEditorWidget, {
                tree: props.tree,
                onChange: props.onChange,
              }),
            )
          : h('textarea', {
              key: selected,
              'aria-label': files[selected],
              spellcheck: false,
              value: contents.value[selected],
              class:
                'min-h-0 flex-1 resize-none rounded border border-input bg-background p-3 font-mono text-sm',
              onInput: (event: Event) => {
                contents.value[selected] = (
                  event.target as HTMLTextAreaElement
                ).value
              },
            }),
      ])
    }
  },
})
