import {
  computed,
  defineComponent,
  h,
  ref,
  type Component,
  type PropType,
} from 'vue'
import type { TreeNode } from '@formivue-design/core'
import { DataSchemaEditor } from '@formivue-design/data-schema-editor'
import {
  compileFormDocuments,
  parseFormDocuments,
  type CompileFormDocumentOptions,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  compileDataValidator,
  DocumentValidationError,
  isJsonObject,
  type JsonObject,
} from '@formivue/json-schema'
import { Button } from '@formivue-design/vue-ui'
import { exampleLocale, message, type Message } from '../../../shared/language'
import { documentError } from '../../../shared/document-messages'
import type { DocumentProject } from '../service/document-project'
import { TestDataWidget } from './TestDataWidget'

const schemaTab: Message = ['Schema', 'Schéma', 'Esquema']
const testTab: Message = ['Test data', 'Données d’essai', 'Datos de prueba']
const baseName: Message = ['Base model', 'Modèle de base', 'Modelo base']
const selectClass =
  'min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm'

function parsed<T>(read: () => T) {
  try {
    return { value: read(), error: undefined }
  } catch (error) {
    return { value: undefined, error }
  }
}

function readObject<T>(source: string, path: string): T {
  try {
    const candidate = JSON.parse(source)
    if (isJsonObject(candidate)) return candidate as T
  } catch {
    // The user can fix or replace the draft in the JSON view.
  }
  throw new DocumentValidationError([
    { path, code: 'invalid_json_object', message: 'Expected a JSON object' },
  ])
}

const action = (
  label: Message,
  onClick: () => void,
  disabled = false,
  primary = false,
) =>
  h(
    Button,
    { size: 'small', type: primary ? 'primary' : 'default', onClick, disabled },
    () => message(label),
  )

const RenameProperty = defineComponent({
  props: {
    path: { type: Array as PropType<(string | null)[]>, required: true },
    model: { type: Object as PropType<DocumentProject>, required: true },
  },
  setup(props) {
    const key = ref('')
    const error = ref<unknown>()
    const review = ref<ReturnType<DocumentProject['reviewRename']>>()
    return () =>
      h('div', { class: 'grid gap-2 rounded-md border p-2' }, [
        h(
          'form',
          {
            class: 'flex flex-wrap items-end gap-2',
            onSubmit(event: Event) {
              event.preventDefault()
              error.value = undefined
              review.value = undefined
              try {
                review.value = props.model.reviewRename({
                  path: props.path,
                  key: key.value.trim(),
                })
              } catch (cause) {
                error.value = cause
              }
            },
          },
          [
            h('label', { class: 'grid gap-1 text-sm' }, [
              message(['JSON key', 'Clé JSON', 'Clave JSON']),
              h('input', {
                class: selectClass,
                value: key.value,
                placeholder: props.path[props.path.length - 1],
                onInput(event: Event) {
                  key.value = (event.target as HTMLInputElement).value
                  error.value = undefined
                  review.value = undefined
                },
              }),
            ]),
            h(
              'button',
              {
                class:
                  'rounded-md border px-3 py-1 text-sm disabled:opacity-50',
                type: 'submit',
                disabled:
                  !key.value.trim() ||
                  key.value.trim() === props.path[props.path.length - 1],
              },
              message([
                'Review rename',
                'Examiner le renommage',
                'Revisar el cambio de nombre',
              ]),
            ),
          ],
        ),
        review.value
          ? h('div', { class: 'flex flex-wrap items-center gap-2 text-sm' }, [
              h('p', { class: 'break-all', role: 'status' }, [
                review.value.impact.from,
                ' → ',
                review.value.impact.to,
                ' · ',
                message(
                  [
                    'Linked components: {count}',
                    'Composants liés : {count}',
                    'Componentes vinculados: {count}',
                  ],
                  { count: review.value.impact.componentIds.length },
                ),
              ]),
              action(
                [
                  'Confirm rename',
                  'Confirmer le renommage',
                  'Confirmar el cambio de nombre',
                ],
                () => {
                  const confirmed = review.value.confirm()
                  review.value = undefined
                  if (!confirmed)
                    error.value = new DocumentValidationError([
                      {
                        path: '/',
                        code: 'stale_rename',
                        message: 'The draft changed. Review the rename again.',
                      },
                    ])
                },
              ),
            ])
          : null,
        error.value
          ? h(
              'p',
              { role: 'alert', class: 'text-sm text-destructive' },
              documentError(error.value),
            )
          : null,
      ])
  },
})

export const DataModelWidget = defineComponent({
  name: 'DataModelWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    model: { type: Object as PropType<DocumentProject>, required: true },
    options: {
      type: Object as PropType<CompileFormDocumentOptions>,
      required: true,
    },
    materials: Object as PropType<Record<string, Component>>,
    demoHref: String,
    onGenerate: { type: Function as PropType<() => void>, required: true },
    onJson: { type: Function as PropType<() => void>, required: true },
    onNavigate: {
      type: Function as PropType<(id?: string) => void>,
      required: true,
    },
    componentLabel: {
      type: Function as PropType<(id: string) => string | undefined>,
      required: true,
    },
  },
  setup(props) {
    const tab = ref<'schema' | 'data'>('schema')
    const name = ref('')
    const error = ref<unknown>()
    const applied = ref(false)
    const files = props.model.files
    const schemaSource = computed(() => files.value?.dataSchema)
    const uiSource = computed(() => files.value?.ui)
    const dataSource = computed(() => files.value?.data)
    const schema = computed(() =>
      parsed(() =>
        readObject<FormDocuments['dataSchema']>(
          schemaSource.value,
          '/dataSchema',
        ),
      ),
    )
    const ui = computed(() =>
      parsed(() => readObject<FormDocuments['ui']>(uiSource.value, '/ui')),
    )
    const data = computed(() =>
      parsed(() => readObject<JsonObject>(dataSource.value, '/data')),
    )
    const validation = computed(() =>
      schema.value.value
        ? parsed(() => compileDataValidator(schema.value.value))
        : { error: schema.value.error, value: undefined },
    )
    const compiled = computed(() =>
      ui.value.value && validation.value.value
        ? parsed(() =>
            compileFormDocuments(
              { ui: ui.value.value, dataSchema: schema.value.value },
              props.options,
            ),
          )
        : { value: undefined, error: ui.value.error },
    )
    const dataIssues = computed(() => {
      if (data.value.error) return data.value.error
      const candidate = data.value.value
      const issues = validation.value.value?.(candidate) ?? []
      if (!issues.length && compiled.value.value)
        issues.push(...compiled.value.value.validateBindings(candidate))
      return issues.length ? new DocumentValidationError(issues) : undefined
    })
    const blocked = computed(() => !compiled.value.value || !!dataIssues.value)
    const run = (work: () => void) => {
      error.value = undefined
      applied.value = false
      try {
        work()
      } catch (cause) {
        error.value = cause
      }
    }
    function update(part: 'dataSchema' | 'data', value: object) {
      props.model.edit({
        ...files.value,
        [part]: JSON.stringify(value, null, 2),
      })
      error.value = undefined
      applied.value = false
    }
    const issue = (heading: Message, error: unknown) =>
      error
        ? h(
            'div',
            {
              class:
                'rounded border border-destructive/40 p-2 text-sm text-destructive',
              role: 'alert',
            },
            [
              h('strong', message(heading)),
              h(
                'p',
                { class: 'whitespace-pre-wrap break-words' },
                documentError(error),
              ),
            ],
          )
        : null
    return () => {
      const project = props.model.project.value
      const selected = props.model.selected.value
      const dependencies = compiled.value.value?.dependencies ?? []
      return h(
        'section',
        {
          class:
            'data-model-view flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-y-auto p-3',
          'data-click-stop-propagation': 'true',
        },
        [
          h(
            'header',
            { class: 'flex flex-wrap items-center justify-between gap-2' },
            [
              h(
                'h2',
                { class: 'text-lg font-semibold' },
                message(['Data model', 'Modèle de données', 'Modelo de datos']),
              ),
              h('div', { class: 'flex flex-wrap gap-2' }, [
                action(
                  ['Back to canvas', 'Retour au canevas', 'Volver al lienzo'],
                  () => props.onNavigate(),
                ),
                action(
                  ['JSON documents', 'Documents JSON', 'Documentos JSON'],
                  props.onJson,
                ),
                props.demoHref
                  ? h(
                      'a',
                      {
                        href: props.demoHref,
                        class: 'rounded-md border px-2 py-1 text-sm',
                      },
                      message([
                        'Variants demo',
                        'Démo des variantes',
                        'Demo de variantes',
                      ]),
                    )
                  : null,
              ]),
            ],
          ),
          h('div', { class: 'flex flex-wrap items-end gap-2' }, [
            action(
              [
                'Generate from canvas',
                'Générer depuis le canevas',
                'Generar desde el lienzo',
              ],
              () => run(props.onGenerate),
            ),
            project &&
              h('label', { class: 'grid gap-1 text-sm' }, [
                message(['Variant', 'Variante', 'Variante']),
                h(
                  'select',
                  {
                    class: selectClass,
                    value: selected,
                    'aria-label': message(['Variant', 'Variante', 'Variante']),
                    onChange: (event: Event) =>
                      run(() =>
                        props.model.choose(
                          (event.target as HTMLSelectElement).value,
                        ),
                      ),
                  },
                  [
                    h('option', { value: '' }, message(baseName)),
                    ...project.variants.map(({ name }) =>
                      h('option', { key: name, value: name }, name),
                    ),
                  ],
                ),
              ]),
            project &&
              h('label', { class: 'grid gap-1 text-sm' }, [
                message([
                  'Variant name',
                  'Nom de la variante',
                  'Nombre de la variante',
                ]),
                h('input', {
                  class: selectClass,
                  value: name.value,
                  onInput: (event: Event) => {
                    name.value = (event.target as HTMLInputElement).value
                  },
                }),
              ]),
            ...(project
              ? [
                  action(
                    ['Create variant', 'Créer une variante', 'Crear variante'],
                    () =>
                      run(() => {
                        props.model.addVariant(name.value, false)
                        name.value = ''
                      }),
                    !name.value.trim(),
                  ),
                  selected
                    ? action(
                        [
                          'Duplicate variant',
                          'Dupliquer la variante',
                          'Duplicar variante',
                        ],
                        () =>
                          run(() => {
                            props.model.addVariant(name.value, true)
                            name.value = ''
                          }),
                        !name.value.trim(),
                      )
                    : null,
                ]
              : []),
          ]),
          props.model.storageError.value
            ? h(
                'p',
                { role: 'alert', class: 'text-sm text-destructive' },
                message([
                  'Local storage is unavailable',
                  'Le stockage local est indisponible',
                  'El almacenamiento local no está disponible',
                ]),
              )
            : null,
          issue(['Project', 'Projet', 'Proyecto'], error.value),
          files.value
            ? [
                h(
                  'div',
                  { class: 'flex flex-wrap items-center gap-2 border-b pb-2' },
                  [
                    ...(
                      [
                        ['schema', schemaTab],
                        ['data', testTab],
                      ] as const
                    ).map(([key, label]) =>
                      h(
                        Button,
                        {
                          size: 'small',
                          type: tab.value === key ? 'primary' : 'default',
                          'aria-pressed': tab.value === key,
                          onClick: () => {
                            tab.value = key
                          },
                        },
                        () => message(label),
                      ),
                    ),
                    action(
                      [
                        'Apply to preview',
                        'Appliquer à l’aperçu',
                        'Aplicar a la vista previa',
                      ],
                      () =>
                        run(() => {
                          props.model.apply(parseFormDocuments(files.value))
                          applied.value = true
                        }),
                      blocked.value,
                      true,
                    ),
                    props.model.hasDraft.value
                      ? h(
                          'span',
                          { class: 'text-sm text-muted-foreground' },
                          message(['Draft', 'Brouillon', 'Borrador']),
                        )
                      : null,
                    applied.value &&
                      h(
                        'span',
                        { role: 'status', class: 'text-sm' },
                        message([
                          'Variant applied',
                          'Variante appliquée',
                          'Variante aplicada',
                        ]),
                      ),
                  ],
                ),
                issue(
                  [
                    'Schema validation',
                    'Validation du schéma',
                    'Validación del esquema',
                  ],
                  validation.value.error,
                ),
                issue(
                  [
                    'UI compatibility',
                    'Compatibilité avec l’interface',
                    'Compatibilidad con la interfaz',
                  ],
                  compiled.value.error,
                ),
                issue(
                  [
                    'Test data validation',
                    'Validation des données d’essai',
                    'Validación de los datos de prueba',
                  ],
                  dataIssues.value,
                ),
                tab.value === 'schema' && schema.value.value
                  ? h(
                      DataSchemaEditor,
                      {
                        key: selected,
                        tree: true,
                        modelValue: schema.value.value,
                        locale: exampleLocale.value,
                        dependencies,
                        componentLabel: props.componentLabel,
                        onNavigate: (id) => props.onNavigate(id),
                        'onUpdate:modelValue': (value) =>
                          update('dataSchema', value),
                      },
                      {
                        inspector: ({
                          path,
                          pointer,
                        }: {
                          path?: (string | null)[]
                          pointer: string
                        }) =>
                          selected &&
                          typeof path?.[path.length - 1] === 'string'
                            ? h(RenameProperty, {
                                key: pointer,
                                model: props.model,
                                path,
                              })
                            : null,
                      },
                    )
                  : tab.value === 'data' &&
                      schema.value.value &&
                      data.value.value
                    ? h(TestDataWidget, {
                        key: selected,
                        tree: props.tree,
                        data: data.value.value,
                        schema: schema.value.value,
                        compiled: compiled.value.value,
                        materials: props.materials,
                        onChange: (data) => update('data', data),
                      })
                    : null,
              ]
            : null,
        ],
      )
    }
  },
})
