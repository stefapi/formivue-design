// Phase 7 (7.1/7.3) — playground Vue du designer (critère M1, scénario 0.5) :
// port de formivue/antd/playground/main.tsx sur la pile Vue 3.5 headless (V1).
// `ReactDOM.render` → `createApp(...).mount()` ; les matériaux sont ceux de
// @formivue-design/formivue-vue (phase 4 ; les matériaux backlog V3
// TreeSelect/Cascader/Rate/Transfer/Upload + plages date/heure sont rétablis,
// palette alignée sur le playground antd d'ère) ;
// le panneau de propriétés consomme SettingsForm (phase 5) + les setters de
// la phase 6 résolus PAR NOM via la prop `components` (registre extensible) ;
// styles : entrée Tailwind fournie par main.ts (V6) — l'app elle-même est testable
// sans CSS.
import {
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
} from 'vue'
import {
  Designer,
  DesignerToolsWidget,
  ViewToolsWidget,
  Workspace,
  OutlineTreeWidget,
  ResourceWidget,
  HistoryWidget,
  StudioPanel,
  CompositePanel,
  WorkspacePanel,
  ToolbarPanel,
  ViewportPanel,
  ViewPanel,
  SettingsPanel,
  ComponentTreeWidget,
  TextWidget,
} from '@formivue-design/vue'
import { useObserver } from '@formivue/reactive-vue'
import type { DocumentContractRegistry } from '@formivue-design/formivue-transformer'
import { SettingsForm } from '@formivue-design/vue-settings-form'
import {
  createDesigner,
  GlobalRegistry,
  Shortcut,
  KeyCode,
  type IResource,
} from '@formivue-design/core'
import {
  DataSourceSetter,
  ReactionsSetter,
  ValidatorSetter,
} from '@formivue-design/formivue-setters'
import {
  Form,
  Materials,
  Field,
  Input,
  Select,
  Radio,
  Checkbox,
  Slider,
  NumberPicker,
  Password,
  DatePicker,
  TimePicker,
  Switch,
  Rate,
  TreeSelect,
  Cascader,
  Transfer,
  Upload,
  Text,
  Card,
  ArrayCards,
  ObjectContainer,
  ArrayTable,
  Space,
  FormTab,
  FormCollapse,
  FormLayout,
  FormGrid,
} from '@formivue-design/formivue-vue'
import {
  LogoWidget,
  ActionsWidget,
  PreviewWidget,
  SchemaEditorWidget,
  MarkupSchemaWidget,
} from './widgets'
import {
  loadInitialSchema,
  localProjectPersistence,
  saveCanvasSnapshot,
  saveSchema,
} from './service'
import {
  useDocumentProject,
  useDocumentPreview,
  type DocumentProjectArchive,
} from '@formivue-design/data-model'
import {
  DataModelWidget,
  DocumentEditorWidget,
} from '@formivue-design/data-model/ui'
import { exampleLocale, message } from '../../shared/language'
import { documentError } from './document-messages'
import { createVariantsDemo } from './service/variants-demo'
import type {
  AdvancedDesignerComponents,
  AdvancedSources,
} from '@formivue-design/shadcn-advanced-designer'
import type {
  AdvancedMaterials,
  AdvancedPreviewFrame,
} from '@formivue-design/shadcn-advanced-runtime'

import type {
  ChartDesignerComponents,
  ChartSettingsComponents,
  ChartSources,
} from '@formivue-design/charts-designer'
import type { ChartMaterials } from '@formivue-design/charts-runtime'

export interface AdvancedPlayground {
  components: typeof AdvancedDesignerComponents & typeof ChartDesignerComponents
  settings: typeof ChartSettingsComponents
  chartSources: typeof ChartSources
  materials: typeof AdvancedMaterials & typeof ChartMaterials
  previewFrame: typeof AdvancedPreviewFrame
  sources: typeof AdvancedSources
  documentContracts: DocumentContractRegistry
}
import { useInertBackground } from './inert'

// sémantique modale applicative (note 6.7 du suivi : reka masque le fond
// des dialogs par aria-hidden sans inert — le playground rend le fond inert)
useInertBackground()

GlobalRegistry.registerDesignerLocales({
  'en-US': {
    advancedPanes: {
      workspace: 'Workspace',
      palette: 'Components',
      dataModel: 'Data model',
      settings: 'Properties',
      label: 'Designer panels',
    },
    sources: {
      Inputs: 'Inputs',
      Layouts: 'Layouts',
      Arrays: 'Arrays',
      Displays: 'Displays',
      AdvancedInputs: 'Advanced inputs',
      AdvancedLayouts: 'Advanced layouts',
      AdvancedDisplays: 'Advanced displays',
      CartesianCharts: 'Cartesian charts',
      ProportionCharts: 'Proportions and hierarchies',
      FlowCharts: 'Flows and networks',
      GeographicCharts: 'Geographic charts',
    },
  },
  'fr-FR': {
    advancedPanes: {
      workspace: 'Espace de travail',
      palette: 'Composants',
      dataModel: 'Modèle de données',
      settings: 'Propriétés',
      label: 'Panneaux du designer',
    },
    sources: {
      Inputs: 'Entrées',
      Layouts: 'Disposition',
      Arrays: 'Listes',
      Displays: 'Affichage',
      AdvancedInputs: 'Champs avancés',
      AdvancedLayouts: 'Conteneurs avancés',
      AdvancedDisplays: 'Affichage avancé',
      CartesianCharts: 'Graphiques cartésiens',
      ProportionCharts: 'Proportions et hiérarchies',
      FlowCharts: 'Flux et réseaux',
      GeographicCharts: 'Cartes géographiques',
    },
  },
  'es-ES': {
    advancedPanes: {
      workspace: 'Área de trabajo',
      palette: 'Componentes',
      dataModel: 'Modelo de datos',
      settings: 'Propiedades',
      label: 'Paneles del diseñador',
    },
    sources: {
      Inputs: 'Entradas',
      Layouts: 'Disposición',
      Arrays: 'Listas',
      Displays: 'Presentación',
      AdvancedInputs: 'Campos avanzados',
      AdvancedLayouts: 'Contenedores avanzados',
      AdvancedDisplays: 'Presentación avanzada',
      CartesianCharts: 'Gráficos cartesianos',
      ProportionCharts: 'Proporciones y jerarquías',
      FlowCharts: 'Flujos y redes',
      GeographicCharts: 'Mapas geográficos',
    },
  },
})

// matériaux du canvas FORMIVUEDESIGN (les sources passent les instances, le
// ResourceWidget lit leur .Resource — même contrat d'ère)
const components = {
  Form,
  Field,
  Input,
  Select,
  Radio,
  Checkbox,
  Slider,
  NumberPicker,
  Password,
  DatePicker,
  TimePicker,
  Switch,
  Rate,
  TreeSelect,
  Cascader,
  Transfer,
  Upload,
  Text,
  Card,
  ArrayCards,
  ArrayTable,
  Space,
  FormTab,
  FormCollapse,
  FormGrid,
  FormLayout,
  ObjectContainer,
} as any

export const App = defineComponent({
  name: 'FormivueDesignPlayground',
  props: {
    advanced: Object as PropType<AdvancedPlayground>,
  },
  setup(props) {
    useObserver()
    const registry = { ...components, ...props.advanced?.components }
    const materials = { ...Materials, ...props.advanced?.materials }
    const trusted = ref(false)
    const restoreError = ref('')
    const documentOptions = {
      contracts: props.advanced?.documentContracts,
      get trusted() {
        return trusted.value
      },
      hasComponent: (name: string) =>
        name
          .split('.')
          .reduce(
            (value, key) =>
              Object.prototype.hasOwnProperty.call(value ?? {}, key)
                ? value[key]
                : undefined,
            materials as any,
          ) != null,
    }
    const preview = useDocumentPreview(documentOptions)
    onUnmounted(preview.clear)
    const advanced = !!props.advanced
    const url = new URL(window.location.href)
    const demo = url.searchParams.get('demo') === 'variants'
    const profile = demo ? 'variants-demo' : ''
    url.searchParams.set('demo', 'variants')
    const model = useDocumentProject({
      documentOptions,
      applyPreview: preview.apply,
      persistence: localProjectPersistence(
        ['formivue-document-project', advanced ? 'advanced' : '', profile]
          .filter(Boolean)
          .join('-'),
      ),
    })
    const panes = ['workspace', 'palette', 'dataModel', 'settings'] as const
    const activePane = ref<'workspace' | 'palette' | 'settings'>('workspace')
    const sidebarTab = ref('components')
    // useMemo(() => createDesigner(...), []) d'ère → création au setup
    const engine = createDesigner({
      shortcuts: [
        new Shortcut({
          codes: [
            [KeyCode.Meta, KeyCode.S],
            [KeyCode.Control, KeyCode.S],
          ],
          handler(ctx) {
            saveSchema(ctx.engine, advanced, profile)
          },
        }),
      ],
      rootComponentName: 'Form',
    })
    const openDataModel = () => {
      activePane.value = 'workspace'
      engine.workbench.setWorkbenchType('DATAMODEL')
    }
    const openArchive = (archive: DocumentProjectArchive) => {
      preview.replace(archive.state.applied, () => {
        saveCanvasSnapshot(archive.canvas, advanced, profile)
        engine.setCurrentTree(archive.canvas)
        engine.workbench.currentWorkspace.operation.selection.clear()
      })
      model.importArchive(archive, engine.getCurrentTree())
      restoreError.value = ''
    }
    const enableTrustedMode = () => {
      if (
        window.confirm(
          message([
            'Trusted documents can run JavaScript with access to this page. Enable this mode only for documents you trust. The setting lasts until you reload.',
            'Les documents approuvés peuvent exécuter du JavaScript avec accès à cette page. Activez ce mode uniquement pour des documents de confiance. Le réglage dure jusqu’au rechargement.',
            'Los documentos de confianza pueden ejecutar JavaScript con acceso a esta página. Activa este modo solo para documentos de confianza. El ajuste se mantiene hasta que recargues la página.',
          ]),
        )
      )
        trusted.value = true
    }
    onMounted(() => {
      const restored = loadInitialSchema(engine, advanced, profile, (error) => {
        restoreError.value = documentError(error)
      })
      if (demo && restored === false) {
        const project = createVariantsDemo(engine, documentOptions)
        if (!model.project.value) model.install(project)
        saveSchema(engine, advanced, profile)
      } else if (restored && !model.project.value && !model.files.value) {
        try {
          model.generate(engine.getCurrentTree())
        } catch {
          // Older canvas saves remain editable and generation can report incompatibilities.
        }
      }
      try {
        model.restoreReconciliation(engine.getCurrentTree())
        model.restorePreview()
      } catch (error) {
        restoreError.value = documentError(error)
      }
      if (demo) openDataModel()
    })
    const navigateToCanvas = async (id?: string) => {
      engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
      activePane.value = 'workspace'
      if (!id) return
      await nextTick()
      const { operation, viewport } = engine.workbench.currentWorkspace
      const node = operation.tree.find((node) => node.id === id)
      if (!node) return
      operation.selection.select(node)
      viewport.findElementById(id)?.scrollIntoView?.({ block: 'nearest' })
    }
    const addAdvancedSource = ({ node }: IResource) => {
      const workspace = engine.workbench.currentWorkspace
      if (!workspace || !node) return
      const { tree, selection } = workspace.operation
      const [added] = tree.append(...node.children)
      if (!added) return
      selection.select(added.id)
      activePane.value = 'workspace'
    }
    // hook de debug d'ère (exemples) — inspection du moteur depuis la console
    ;(window as any).engine = engine
    return () => {
      const viewingDataModel = engine.workbench.type === 'DATAMODEL'
      const sidebarProps = {
        activeKey: viewingDataModel ? 'dataModel' : sidebarTab.value,
        onChange: (key: string) => {
          if (key === 'dataModel') {
            openDataModel()
            return
          }
          sidebarTab.value = key
          if (viewingDataModel)
            engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
        },
      }
      return h(
        Designer,
        {
          engine,
          'data-advanced-pane': advanced ? activePane.value : undefined,
          'data-playground-pane': activePane.value,
        },
        {
          default: () =>
            h(StudioPanel, null, {
              logo: () => h(LogoWidget),
              actions: () => h(ActionsWidget, { advanced, profile }),
              default: () => [
                h(
                  'nav',
                  {
                    class: 'advanced-pane-navigation hidden',
                    'aria-label': GlobalRegistry.getDesignerMessage(
                      'advancedPanes.label',
                    ),
                  },
                  panes.map((pane) =>
                    h(
                      'button',
                      {
                        key: pane,
                        type: 'button',
                        'aria-pressed':
                          pane ===
                          (viewingDataModel ? 'dataModel' : activePane.value),
                        class:
                          'min-w-0 rounded-md px-2 py-2 text-sm font-medium wrap-anywhere aria-pressed:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                        onClick: () => {
                          if (pane === 'dataModel') {
                            openDataModel()
                            return
                          }
                          activePane.value = pane
                          if (pane !== 'workspace' || viewingDataModel)
                            engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
                        },
                      },
                      [h(TextWidget, { token: `advancedPanes.${pane}` })],
                    ),
                  ),
                ),
                h(CompositePanel, sidebarProps, {
                  default: () => [
                    h(
                      CompositePanel.Item,
                      {
                        key: 'components',
                        title: 'panels.Component',
                        icon: 'Component',
                      },
                      {
                        default: () => [
                          h(ResourceWidget, {
                            title: 'sources.Inputs',
                            columns: 2,
                            // ordre de la palette d'ère (playground antd)
                            sources: [
                              Input,
                              Password,
                              NumberPicker,
                              Rate,
                              Slider,
                              Select,
                              TreeSelect,
                              Cascader,
                              Transfer,
                              Checkbox,
                              Radio,
                              DatePicker,
                              TimePicker,
                              Upload,
                              Switch,
                              ObjectContainer,
                            ],
                          }),
                          h(ResourceWidget, {
                            title: 'sources.Layouts',
                            columns: 2,
                            sources: [
                              Card,
                              FormGrid,
                              FormTab,
                              FormLayout,
                              ...(advanced ? [] : [FormCollapse]),
                              Space,
                            ],
                          }),
                          h(ResourceWidget, {
                            title: 'sources.Arrays',
                            columns: 2,
                            sources: [ArrayCards, ArrayTable],
                          }),
                          h(ResourceWidget, {
                            title: 'sources.Displays',
                            columns: 2,
                            sources: [Text],
                          }),
                          ...(props.advanced
                            ? [
                                h(ResourceWidget, {
                                  title: 'sources.AdvancedInputs',
                                  className: 'dn-advanced-resource',
                                  columns: 2,
                                  sources: props.advanced.sources.inputs,
                                  onActivate: addAdvancedSource,
                                }),
                                h(ResourceWidget, {
                                  title: 'sources.AdvancedLayouts',
                                  className: 'dn-advanced-resource',
                                  columns: 2,
                                  sources: props.advanced.sources.layouts,
                                  onActivate: addAdvancedSource,
                                }),
                                h(ResourceWidget, {
                                  title: 'sources.AdvancedDisplays',
                                  className: 'dn-advanced-resource',
                                  columns: 2,
                                  sources: props.advanced.sources.displays,
                                  onActivate: addAdvancedSource,
                                }),
                                ...Object.entries(
                                  props.advanced.chartSources,
                                ).map(([group, sources]) =>
                                  h(ResourceWidget, {
                                    key: group,
                                    title: `sources.${group}`,
                                    className: 'dn-chart-resource',
                                    columns: 2,
                                    sources,
                                    defaultExpand: group === 'CartesianCharts',
                                    onActivate: addAdvancedSource,
                                  }),
                                ),
                              ]
                            : []),
                        ],
                      },
                    ),
                    h(
                      CompositePanel.Item,
                      {
                        key: 'outline',
                        title: 'panels.OutlinedTree',
                        icon: 'Outline',
                      },
                      { default: () => h(OutlineTreeWidget) },
                    ),
                    h(
                      CompositePanel.Item,
                      {
                        key: 'history',
                        title: 'panels.History',
                        icon: 'History',
                      },
                      { default: () => h(HistoryWidget) },
                    ),
                    h(CompositePanel.Item, {
                      key: 'dataModel',
                      title: 'advancedPanes.dataModel',
                      icon: 'DataTableSource',
                    }),
                  ],
                }),
                h(
                  Workspace,
                  { id: 'form' },
                  {
                    default: () =>
                      h(WorkspacePanel, null, {
                        default: () => [
                          h(ToolbarPanel, null, {
                            default: () => [
                              h(DesignerToolsWidget),
                              h(ViewToolsWidget, {
                                use: [
                                  'FORMIVUEDESIGN',
                                  'JSONTREE',
                                  'MARKUP',
                                  'PREVIEW',
                                ],
                              }),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  disabled: trusted.value,
                                  onClick: enableTrustedMode,
                                  class:
                                    'rounded border border-input px-2 py-1 text-xs',
                                },
                                trusted.value
                                  ? message([
                                      'Trusted JavaScript enabled',
                                      'JavaScript de confiance activé',
                                      'JavaScript de confianza activado',
                                    ])
                                  : message([
                                      'Enable trusted JavaScript',
                                      'Activer le JavaScript de confiance',
                                      'Activar JavaScript de confianza',
                                    ]),
                              ),
                            ],
                          }),
                          restoreError.value &&
                            h(
                              'p',
                              {
                                role: 'alert',
                                class: 'p-2 text-sm text-destructive',
                              },
                              restoreError.value,
                            ),
                          h(
                            ViewportPanel,
                            { style: { height: '100%' } },
                            {
                              default: () => [
                                h(
                                  ViewPanel,
                                  { type: 'DATAMODEL', scrollable: false },
                                  {
                                    default: ({ tree }: { tree: any }) =>
                                      h(
                                        DataModelWidget,
                                        {
                                          tree,
                                          model,
                                          options: documentOptions,
                                          locale: exampleLocale.value,
                                          demoHref: demo ? undefined : url.href,
                                          onGenerate: () => {
                                            model.generate(tree)
                                            saveSchema(
                                              engine,
                                              advanced,
                                              profile,
                                            )
                                          },
                                          onImport: openArchive,
                                          onJson: () =>
                                            engine.workbench.setWorkbenchType(
                                              'JSONTREE',
                                            ),
                                          onNavigate: navigateToCanvas,
                                        },
                                        {
                                          preview: (draft) =>
                                            h(PreviewWidget, {
                                              tree,
                                              draft,
                                              materials:
                                                props.advanced?.materials,
                                            }),
                                        },
                                      ),
                                  },
                                ),
                                h(
                                  ViewPanel,
                                  { type: 'FORMIVUEDESIGN' },
                                  {
                                    default: () =>
                                      h(ComponentTreeWidget, {
                                        components: registry,
                                      }),
                                  },
                                ),
                                h(
                                  ViewPanel,
                                  { type: 'JSONTREE', scrollable: false },
                                  {
                                    default: ({
                                      tree,
                                      onChange,
                                    }: {
                                      tree: any
                                      onChange: any
                                    }) =>
                                      h(
                                        DocumentEditorWidget,
                                        {
                                          tree,
                                          locale: exampleLocale.value,
                                          showVisualSchema: false,
                                          trusted: trusted.value,
                                          contracts: documentOptions.contracts,
                                          hasComponent:
                                            documentOptions.hasComponent,
                                          documents:
                                            preview.document.value?.exportDocuments(),
                                          draft: model.files.value,
                                          onDraft: model.edit,
                                          onModel: openDataModel,
                                          onReload: model.project.value
                                            ? model.resetDraft
                                            : undefined,
                                          onApply: model.apply,
                                          onCanvas: () => {
                                            model.clearPreview()
                                            preview.clear()
                                          },
                                        },
                                        {
                                          legacy: () => [
                                            h(SchemaEditorWidget, {
                                              tree,
                                              onChange,
                                              trusted: trusted.value,
                                            }),
                                          ],
                                        },
                                      ),
                                  },
                                ),
                                h(
                                  ViewPanel,
                                  { type: 'MARKUP', scrollable: false },
                                  {
                                    default: ({ tree }: { tree: any }) =>
                                      h(MarkupSchemaWidget, { tree, advanced }),
                                  },
                                ),
                                h(
                                  ViewPanel,
                                  { type: 'PREVIEW', scrollable: !advanced },
                                  {
                                    default: ({ tree }: { tree: any }) =>
                                      h(PreviewWidget, {
                                        tree,
                                        trusted: trusted.value,
                                        materials: props.advanced?.materials,
                                        frame: props.advanced?.previewFrame,
                                        document: preview.document.value,
                                      }),
                                  },
                                ),
                              ],
                            },
                          ),
                        ],
                      }),
                  },
                ),
                h(
                  SettingsPanel,
                  { title: 'panels.PropertySettings' },
                  {
                    default: () =>
                      h(SettingsForm, {
                        // setters de la phase 6, référencés PAR NOM par les
                        // behaviors de la phase 4 — résolus ici (registre d'ère)
                        components: {
                          DataSourceSetter,
                          ReactionsSetter,
                          ValidatorSetter,
                          ...props.advanced?.settings,
                        },
                      }),
                  },
                ),
              ],
            }),
        },
      )
    }
  },
})
