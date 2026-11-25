import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  useId,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import type { TreeNode } from '@formivue-design/core'
import { DataSchemaEditor } from '@formivue-design/data-schema-editor'
import {
  parseFormDocuments,
  type CompileFormDocumentOptions,
} from '@formivue-design/formivue-transformer'
import {
  DocumentValidationError,
  jsonPointer,
  pointerSegments,
} from '@formivue/json-schema'
import { Button } from '@formivue-design/vue-ui'
import { useDocumentDraftValidation } from '../document-draft-validation'
import { formDocumentFileNames } from '../document-files'
import type { DocumentProject } from '../document-project'
import type { DocumentProjectArchive } from '../document-project-archive'
import { createDocumentMessages, type Message } from './document-messages'
import { downloadJson } from './download-json'
import { TestDataWidget, type DraftFormPreview } from './TestDataWidget'
import { CanvasReconciliationWidget } from './CanvasReconciliationWidget'
import { ProjectArchiveWidget } from './ProjectArchiveWidget'

const schemaTab: Message = ['Schema', 'Schéma', 'Esquema']
const testTab: Message = ['Test data', 'Données d’essai', 'Datos de prueba']
const baseName: Message = ['Base model', 'Modèle de base', 'Modelo base']
const sourceTitle: Message = [
  'Schema source',
  'Source du schéma',
  'Código del esquema',
]
const selectClass =
  'min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm'

const createAction =
  (message: ReturnType<typeof createDocumentMessages>['message']) =>
  (label: Message, onClick: () => void, disabled = false, primary = false) =>
    h(
      Button,
      {
        size: 'small',
        type: primary ? 'primary' : 'default',
        onClick,
        disabled,
      },
      () => message(label),
    )

const RenameProperty = defineComponent({
  props: {
    locale: String,
    path: { type: Array as PropType<(string | null)[]>, required: true },
    model: { type: Object as PropType<DocumentProject>, required: true },
    objects: { type: Array as PropType<(string | null)[][]>, required: true },
    onConfirmed: { type: Function as PropType<() => void>, required: true },
    componentLabel: {
      type: Function as PropType<(id: string) => string | undefined>,
      required: true,
    },
  },
  setup(props) {
    const { message, documentError } = createDocumentMessages(
      () => props.locale,
    )
    const action = createAction(message)
    const key = ref('')
    const id = useId()
    const depth = props.path.lastIndexOf(null) + 1
    const parent = jsonPointer(props.path.slice(depth, -1) as string[]) || '/'
    const destination = ref(parent)
    const error = ref<unknown>()
    const review = ref<ReturnType<DocumentProject['reviewRename']>>()
    const reviewPanel = ref<HTMLElement>()
    let reviewTrigger: HTMLElement | undefined
    const formClass =
      'grid min-w-0 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'
    const submitClass =
      'h-8 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'
    const move = computed(
      () => 'createdObjects' in (review.value?.impact ?? {}),
    )
    const reviewChange = (event: Event, moving = false) => {
      event.preventDefault()
      reviewTrigger = (event as SubmitEvent).submitter ?? undefined
      error.value = undefined
      review.value = undefined
      try {
        review.value = moving
          ? props.model.reviewMove({
              path: props.path,
              to: [
                ...props.path.slice(0, depth),
                ...pointerSegments(
                  destination.value === '/' ? '' : destination.value,
                ),
                props.path[props.path.length - 1],
              ],
            })
          : props.model.reviewRename({
              path: props.path,
              key: key.value.trim(),
            })
        if (review.value) void nextTick(() => reviewPanel.value?.focus())
      } catch (cause) {
        error.value = cause
      }
    }
    const targets = computed(() =>
      props.objects.flatMap((path) =>
        path.lastIndexOf(null) + 1 === depth &&
        props.path
          .slice(0, depth)
          .every((segment, index) => segment === path[index])
          ? [jsonPointer(path.slice(depth) as string[]) || '/']
          : [],
      ),
    )
    return () =>
      h(
        'section',
        { class: 'grid min-w-0 gap-4 rounded-lg border bg-background p-4' },
        [
          h(
            'h3',
            { class: 'text-sm font-semibold' },
            message([
              'JSON key in this variant',
              'Clé JSON dans cette variante',
              'Clave JSON en esta variante',
            ]),
          ),
          h(
            'form',
            {
              class: formClass,
              onSubmit: (event: Event) => reviewChange(event),
            },
            [
              h(
                'label',
                { class: 'grid min-w-0 gap-1.5 text-sm font-medium' },
                [
                  message(['New key', 'Nouvelle clé', 'Nueva clave']),
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
                ],
              ),
              h(
                'button',
                {
                  class: submitClass,
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
          h('details', { class: 'min-w-0 border-t pt-3 text-sm' }, [
            h(
              'summary',
              { class: 'cursor-pointer font-medium' },
              message([
                'Move to another object',
                'Déplacer vers un autre objet',
                'Mover a otro objeto',
              ]),
            ),
            h(
              'form',
              {
                class: 'mt-3 ' + formClass,
                onSubmit: (event: Event) => reviewChange(event, true),
              },
              [
                h('label', { class: 'grid min-w-0 gap-1.5 font-medium' }, [
                  message([
                    'Destination object',
                    'Objet de destination',
                    'Objeto de destino',
                  ]),
                  h('input', {
                    class: selectClass,
                    value: destination.value,
                    list: id,
                    onInput(event: Event) {
                      destination.value = (
                        event.target as HTMLInputElement
                      ).value.trim()
                      error.value = undefined
                      review.value = undefined
                    },
                  }),
                ]),
                h(
                  'datalist',
                  { id },
                  [...new Set(['/', ...targets.value])].map((path) =>
                    h('option', { value: path }),
                  ),
                ),
                h(
                  'button',
                  {
                    class: submitClass,
                    type: 'submit',
                    disabled:
                      !destination.value || destination.value === parent,
                  },
                  message([
                    'Review move',
                    'Examiner le déplacement',
                    'Revisar el traslado',
                  ]),
                ),
              ],
            ),
            h(
              'p',
              { class: 'mt-2 text-xs text-muted-foreground' },
              message([
                'Choose an object or enter a path like /metrics. Use / for the current record.',
                'Choisissez un objet ou saisissez un chemin comme /indicateurs. Utilisez / pour l’enregistrement courant.',
                'Elige un objeto o escribe una ruta como /indicadores. Usa / para el registro actual.',
              ]),
            ),
          ]),
          review.value
            ? h(
                'div',
                {
                  ref: reviewPanel,
                  tabindex: -1,
                  class:
                    'grid min-w-0 gap-2 rounded-md border bg-muted/45 p-3 text-sm',
                },
                [
                  h('div', { class: 'grid min-w-0 gap-1', role: 'status' }, [
                    h('p', { class: 'font-mono text-xs break-all' }, [
                      review.value.impact.from,
                      ' → ',
                      review.value.impact.to,
                    ]),
                    h(
                      'p',
                      message(
                        [
                          'Linked components: {count}',
                          'Composants liés : {count}',
                          'Componentes vinculados: {count}',
                        ],
                        { count: review.value.impact.componentIds.length },
                      ),
                    ),
                  ]),
                  ...('createdObjects' in review.value.impact
                    ? [
                        review.value.impact.createdObjects.length
                          ? h(
                              'p',
                              { class: 'w-full break-all' },
                              message(
                                [
                                  'Objects to create: {paths}',
                                  'Objets à créer : {paths}',
                                  'Objetos por crear: {paths}',
                                ],
                                {
                                  paths:
                                    review.value.impact.createdObjects.join(
                                      ', ',
                                    ),
                                },
                              ),
                            )
                          : null,
                        h(
                          'ul',
                          { class: 'w-full space-y-1' },
                          review.value.impact.dependencies.map(
                            ({ componentId, property, path }) =>
                              h('li', { class: 'break-all' }, [
                                props.componentLabel(componentId) ??
                                  componentId,
                                ' · ',
                                property,
                                ' · ',
                                jsonPointer(path.map((part) => part ?? '*')),
                              ]),
                          ),
                        ),
                      ]
                    : []),
                  h('div', { class: 'flex flex-wrap items-center gap-2' }, [
                    action(
                      move.value
                        ? [
                            'Confirm move',
                            'Confirmer le déplacement',
                            'Confirmar el traslado',
                          ]
                        : [
                            'Confirm rename',
                            'Confirmer le renommage',
                            'Confirmar el cambio de nombre',
                          ],
                      () => {
                        const confirmed = review.value.confirm()
                        review.value = undefined
                        if (confirmed) props.onConfirmed()
                        else
                          error.value = new DocumentValidationError([
                            {
                              path: '/',
                              code: 'stale_rename',
                              message:
                                'The draft changed. Review the change again.',
                            },
                          ])
                      },
                      false,
                      true,
                    ),
                    action(['Cancel', 'Annuler', 'Cancelar'], () => {
                      review.value = undefined
                      reviewTrigger?.focus()
                    }),
                  ]),
                ],
              )
            : null,
          error.value
            ? h(
                'p',
                { role: 'alert', class: 'text-sm text-destructive' },
                documentError(error.value),
              )
            : null,
        ],
      )
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
    locale: String,
    demoHref: String,
    onGenerate: { type: Function as PropType<() => void>, required: true },
    onImport: {
      type: Function as PropType<(archive: DocumentProjectArchive) => void>,
      required: true,
    },
    onJson: { type: Function as PropType<() => void>, required: true },
    onNavigate: {
      type: Function as PropType<(id?: string) => void>,
      required: true,
    },
    componentLabel: Function as PropType<(id: string) => string | undefined>,
  },
  slots: Object as SlotsType<{
    preview?: (draft: DraftFormPreview) => VNodeChild
  }>,
  setup(props, { slots }) {
    const { message, documentError } = createDocumentMessages(
      () => props.locale,
    )
    const action = createAction(message)
    function componentLabel(id: string): string | undefined {
      if (props.componentLabel) return props.componentLabel(id)
      const node = props.tree.find((candidate) => candidate.id === id)
      return node?.props.title ?? node?.props.name ?? node?.props['x-component']
    }
    const tab = ref<'schema' | 'data'>('schema')
    const showSource = ref(true)
    const name = ref('')
    const error = ref<unknown>()
    const applied = ref(false)
    const files = props.model.files
    const reconciledFiles = shallowRef<typeof files.value>()
    const {
      schemaSource,
      schema,
      data,
      validation,
      compiled,
      dataIssues,
      blocked,
    } = useDocumentDraftValidation(files, () => props.options)
    const run = (work: () => void) => {
      error.value = undefined
      applied.value = false
      reconciledFiles.value = undefined
      try {
        work()
      } catch (cause) {
        error.value = cause
      }
    }
    onMounted(() => {
      if (!files.value) run(() => props.model.generate(props.tree))
    })
    function editSource(dataSchema: string) {
      props.model.edit({ ...files.value, dataSchema })
      error.value = undefined
      applied.value = false
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
      const validationIssues = [
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
      ].filter(Boolean)
      return h(
        'section',
        {
          class:
            'data-model-view flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-3 sm:p-5',
          'data-click-stop-propagation': 'true',
        },
        [
          h(
            'header',
            {
              class:
                'flex flex-wrap items-center justify-between gap-3 border-b pb-3',
            },
            [
              h(
                'h2',
                { class: 'text-xl font-semibold tracking-tight' },
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
            h('details', { class: 'data-model-project' }, [
              h(
                'summary',
                { class: 'cursor-pointer text-sm font-medium' },
                message([
                  'Project and variants',
                  'Projet et variantes',
                  'Proyecto y variantes',
                ]),
              ),
              h('div', { class: 'data-model-project-content' }, [
                h(ProjectArchiveWidget, {
                  tree: props.tree,
                  model: props.model,
                  locale: props.locale,
                  onImport: (archive) => {
                    props.onImport(archive)
                    name.value = ''
                    error.value = undefined
                    applied.value = false
                    reconciledFiles.value = undefined
                    tab.value = 'schema'
                  },
                }),
                h('div', { class: 'flex flex-wrap items-end gap-2' }, [
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
                          [
                            'Create variant',
                            'Créer une variante',
                            'Crear variante',
                          ],
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
              ]),
            ]),
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
          props.model.reconciliation.value
            ? h(CanvasReconciliationWidget, {
                review: props.model.reconciliation.value,
                locale: props.locale,
                componentLabel,
                onCancel: props.model.cancelReconciliation,
                onNavigate: props.onNavigate,
                onApplied: () => {
                  reconciledFiles.value = files.value
                },
              })
            : null,
          reconciledFiles.value && reconciledFiles.value === files.value
            ? h(
                'p',
                { role: 'status', class: 'text-sm' },
                message([
                  'Variants reconciled',
                  'Variantes réconciliées',
                  'Variantes conciliadas',
                ]),
              )
            : null,
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
                    tab.value === 'schema' &&
                      action(
                        showSource.value || !schema.value.value
                          ? ['Hide JSON', 'Masquer le JSON', 'Ocultar JSON']
                          : ['Show JSON', 'Afficher le JSON', 'Mostrar JSON'],
                        () => {
                          showSource.value = !showSource.value
                        },
                        !schema.value.value,
                      ),
                    h('span', { class: 'grow' }),
                    action(
                      [
                        'Apply to preview',
                        'Appliquer à l’aperçu',
                        'Aplicar a la vista previa',
                      ],
                      () =>
                        run(() => {
                          props.model.apply(
                            parseFormDocuments(files.value, props.options),
                          )
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
                validationIssues.length
                  ? h(
                      'details',
                      {
                        class:
                          'rounded-md border border-destructive/35 px-3 py-2 text-sm',
                      },
                      [
                        h(
                          'summary',
                          {
                            class:
                              'cursor-pointer font-medium text-destructive',
                          },
                          message([
                            'Validation issues',
                            'Erreurs de validation',
                            'Errores de validación',
                          ]),
                        ),
                        h(
                          'div',
                          { class: 'mt-2 grid gap-2' },
                          validationIssues,
                        ),
                      ],
                    )
                  : null,
                tab.value === 'schema'
                  ? h(
                      'div',
                      {
                        class: 'data-model-schema',
                        'data-show-source':
                          showSource.value || !schema.value.value,
                      },
                      [
                        schema.value.value
                          ? h(
                              DataSchemaEditor,
                              {
                                key: selected,
                                builder: true,
                                modelValue: schema.value.value,
                                locale: props.locale,
                                dependencies,
                                componentLabel,
                                onNavigate: (id) => props.onNavigate(id),
                                'onUpdate:modelValue': (value) =>
                                  update('dataSchema', value),
                              },
                              {
                                inspector: ({
                                  path,
                                  pointer,
                                  objects,
                                  close,
                                }: {
                                  path?: (string | null)[]
                                  pointer: string
                                  objects: (string | null)[][]
                                  close: () => void
                                }) =>
                                  selected &&
                                  typeof path?.[path.length - 1] === 'string'
                                    ? h(RenameProperty, {
                                        key: pointer,
                                        locale: props.locale,
                                        model: props.model,
                                        path,
                                        objects,
                                        onConfirmed: close,
                                        componentLabel,
                                      })
                                    : null,
                              },
                            )
                          : h(
                              'p',
                              {
                                role: 'status',
                                class:
                                  'rounded-lg border bg-muted/40 p-4 text-sm',
                              },
                              message([
                                'Correct the JSON source to resume visual editing.',
                                'Corrigez la source JSON pour reprendre l’édition visuelle.',
                                'Corrige el código JSON para continuar la edición visual.',
                              ]),
                            ),
                        showSource.value || !schema.value.value
                          ? h(
                              'section',
                              {
                                class: 'data-model-source',
                                'aria-label': message(sourceTitle),
                              },
                              [
                                h('div', { class: 'schema-builder-header' }, [
                                  h(
                                    'h3',
                                    { class: 'font-semibold' },
                                    message(sourceTitle),
                                  ),
                                  action(
                                    [
                                      'Download JSON',
                                      'Télécharger le JSON',
                                      'Descargar JSON',
                                    ],
                                    () =>
                                      downloadJson(
                                        formDocumentFileNames.dataSchema,
                                        files.value.dataSchema,
                                      ),
                                    !schema.value.value,
                                  ),
                                ]),
                                h('textarea', {
                                  class: 'data-model-source-code',
                                  'aria-label':
                                    formDocumentFileNames.dataSchema,
                                  'aria-invalid': schema.value.error
                                    ? 'true'
                                    : undefined,
                                  value: schemaSource.value,
                                  spellcheck: false,
                                  autocapitalize: 'off',
                                  wrap: 'off',
                                  onInput: (event: Event) =>
                                    editSource(
                                      (event.target as HTMLTextAreaElement)
                                        .value,
                                    ),
                                }),
                              ],
                            )
                          : null,
                      ],
                    )
                  : schema.value.value && data.value.value
                    ? h(
                        TestDataWidget,
                        {
                          key: selected,
                          data: data.value.value,
                          schema: schema.value.value,
                          compiled: compiled.value.value,
                          locale: props.locale,
                          onChange: (data) => update('data', data),
                        },
                        slots.preview ? { preview: slots.preview } : undefined,
                      )
                    : null,
              ]
            : null,
        ],
      )
    }
  },
})
