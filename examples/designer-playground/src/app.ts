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
  shallowRef,
  triggerRef,
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
  useWorkbench,
} from '@formivue-design/vue'
import { observer } from '@formivue/reactive-vue'
import { Button } from '@formivue-design/vue-ui'
import { message } from '../../shared/language'
import {
  createFormDocument,
  type DocumentContractRegistry,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
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
  DocumentEditorWidget,
  MarkupSchemaWidget,
} from './widgets'
import { loadInitialSchema, saveCanvasSnapshot, saveSchema } from './service'
import { useDocumentProject } from './service/document-project'
import type { DocumentProjectArchive } from './service/document-project-archive'
import { createVariantsDemo } from './service/variants-demo'
import { DataModelWidget } from './widgets/DataModelWidget'
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

const DataModelViewButton = observer(
  defineComponent({
    setup() {
      const workbench = useWorkbench()
      return () =>
        h(
          Button,
          {
            size: 'small',
            disabled: workbench.type === 'DATAMODEL',
            onClick: () => workbench.setWorkbenchType('DATAMODEL'),
          },
          () => message(['Data model', 'Modèle de données', 'Modelo de datos']),
        )
    },
  }),
)

export const App = defineComponent({
  name: 'FormivueDesignPlayground',
  props: {
    advanced: Object as PropType<AdvancedPlayground>,
  },
  setup(props) {
    const registry = { ...components, ...props.advanced?.components }
    const materials = { ...Materials, ...props.advanced?.materials }
    const documentOptions = {
      contracts: props.advanced?.documentContracts,
      hasComponent: (name: string) =>
        name
          .split('.')
          .reduce((value, key) => value?.[key], materials as any) != null,
    }
    const previewDocument = shallowRef<ReturnType<typeof createFormDocument>>()
    const clearDocument = () => {
      previewDocument.value?.dispose()
      previewDocument.value = undefined
    }
    onUnmounted(clearDocument)
    const applyDocument = (documents: FormDocuments) => {
      const current = previewDocument.value
      const currentDocuments = current?.exportDocuments()
      if (
        current &&
        JSON.stringify(currentDocuments.ui) === JSON.stringify(documents.ui) &&
        JSON.stringify(currentDocuments.dataSchema) ===
          JSON.stringify(documents.dataSchema)
      ) {
        const result = current.replaceData(documents.data)
        triggerRef(previewDocument)
        return result.conflicts
      } else {
        const next = createFormDocument(documents, documentOptions)
        clearDocument()
        previewDocument.value = next
      }
    }
    const advanced = !!props.advanced
    const url = new URL(window.location.href)
    const demo = url.searchParams.get('demo') === 'variants'
    const profile = demo ? 'variants-demo' : ''
    url.searchParams.set('demo', 'variants')
    const model = useDocumentProject(
      ['formivue-document-project', advanced ? 'advanced' : '', profile]
        .filter(Boolean)
        .join('-'),
      documentOptions,
      applyDocument,
    )
    const panes = ['workspace', 'palette', 'settings'] as const
    const activePane = ref<(typeof panes)[number]>('workspace')
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
    const openArchive = (archive: DocumentProjectArchive) => {
      const next = archive.state.applied
        ? createFormDocument(archive.state.applied, documentOptions)
        : undefined
      try {
        saveCanvasSnapshot(archive.canvas, advanced, profile)
        engine.setCurrentTree(archive.canvas)
        engine.workbench.currentWorkspace.operation.selection.clear()
      } catch (cause) {
        next?.dispose()
        throw cause
      }
      clearDocument()
      previewDocument.value = next
      model.importArchive(archive, engine.getCurrentTree())
    }
    onMounted(() => {
      const restored = loadInitialSchema(engine, advanced, profile)
      if (demo && !restored) {
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
      model.restoreReconciliation(engine.getCurrentTree())
      model.restorePreview()
      if (demo) engine.workbench.setWorkbenchType('DATAMODEL')
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
    return () =>
      h(
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
                        'aria-pressed': activePane.value === pane,
                        class:
                          'min-w-0 rounded-md px-2 py-2 text-sm font-medium wrap-anywhere aria-pressed:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                        onClick: () => {
                          activePane.value = pane
                          if (pane !== 'workspace')
                            engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
                        },
                      },
                      [h(TextWidget, { token: `advancedPanes.${pane}` })],
                    ),
                  ),
                ),
                h(CompositePanel, null, {
                  default: () => [
                    h(
                      CompositePanel.Item,
                      { title: 'panels.Component', icon: 'Component' },
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
                      { title: 'panels.OutlinedTree', icon: 'Outline' },
                      { default: () => h(OutlineTreeWidget) },
                    ),
                    h(
                      CompositePanel.Item,
                      { title: 'panels.History', icon: 'History' },
                      { default: () => h(HistoryWidget) },
                    ),
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
                              h(DataModelViewButton),
                            ],
                          }),
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
                                      h(DataModelWidget, {
                                        tree,
                                        model,
                                        options: documentOptions,
                                        materials: props.advanced?.materials,
                                        demoHref: demo ? undefined : url.href,
                                        onGenerate: () => {
                                          model.generate(tree)
                                          saveSchema(engine, advanced, profile)
                                        },
                                        onImport: openArchive,
                                        onJson: () =>
                                          engine.workbench.setWorkbenchType(
                                            'JSONTREE',
                                          ),
                                        onNavigate: navigateToCanvas,
                                        componentLabel: (id) => {
                                          const node = tree.find(
                                            (node: { id: string }) =>
                                              node.id === id,
                                          )
                                          return (
                                            node?.props.title ??
                                            node?.props.name ??
                                            node?.props['x-component']
                                          )
                                        },
                                      }),
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
                                      h(DocumentEditorWidget, {
                                        tree,
                                        onChange,
                                        contracts:
                                          props.advanced?.documentContracts,
                                        hasComponent:
                                          documentOptions.hasComponent,
                                        documents:
                                          previewDocument.value?.exportDocuments(),
                                        draft: model.files.value,
                                        onDraft: model.edit,
                                        onModel: () =>
                                          engine.workbench.setWorkbenchType(
                                            'DATAMODEL',
                                          ),
                                        onReload: model.project.value
                                          ? model.resetDraft
                                          : undefined,
                                        onApply: model.apply,
                                        onCanvas: () => {
                                          model.clearPreview()
                                          clearDocument()
                                        },
                                      }),
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
                                        materials: props.advanced?.materials,
                                        frame: props.advanced?.previewFrame,
                                        document: previewDocument.value,
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
  },
})
