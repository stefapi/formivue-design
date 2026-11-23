// Phase 3.6 — suite d'intégration : montage du Studio complet (Designer >
// Workbench > StudioPanel > CompositePanel/WorkspacePanel/SettingsPanel),
// wiring des drivers du moteur (drag souris synthétique, sélection au clic),
// historique undo/redo via @formivue-design/core intact, locales.
import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  CompositePanel,
  ComponentTreeWidget,
  Designer,
  DesignerToolsWidget,
  OutlineTreeWidget,
  ResourceWidget,
  SettingsPanel,
  StudioPanel,
  TextWidget,
  ToolbarPanel,
  ViewPanel,
  ViewToolsWidget,
  ViewportPanel,
  Workbench,
  WorkspacePanel,
  HistoryWidget,
} from '../index'
import {
  createBehavior,
  createDesigner,
  createResource,
  GlobalRegistry,
  TreeNode,
} from '@formivue-design/core'

const CardBehavior = createBehavior({
  name: 'Card',
  selector: 'Card',
  designerProps: { droppable: true },
  designerLocales: { 'en-US': { title: 'Card' } },
})

const FieldBehavior = createBehavior({
  name: 'Field',
  selector: (node: any) => node.componentName === 'Field',
  designerProps: { droppable: false },
  designerLocales: { 'en-US': { title: 'Field' } },
})

GlobalRegistry.registerDesignerBehaviors([CardBehavior, FieldBehavior])
GlobalRegistry.registerDesignerLocales({
  'en-US': {
    sources: { Inputs: 'Inputs' },
  },
})

const TestCard = defineComponent({
  name: 'TestCard',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    return () =>
      h(
        'div',
        { ...attrs, class: ['test-card', attrs.class] },
        slots.default?.(),
      )
  },
})

const TestField = defineComponent({
  name: 'TestField',
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () => h('input', { ...attrs, class: 'test-field' })
  },
})

const InputSource = createResource({
  title: { 'en-US': 'Input' },
  icon: 'InputSource',
  elements: [
    {
      id: 'input-src',
      componentName: 'Field',
      props: { 'x-component': 'Input' },
    },
  ],
})

const components = {
  Card: TestCard,
  Field: TestField,
}

// Studio assemblé comme l'exemple d'ère (examples/basic)
const Studio = defineComponent({
  components: {
    Designer,
    Workbench,
    StudioPanel,
    CompositePanel,
    ResourceWidget,
    OutlineTreeWidget,
    HistoryWidget,
    WorkspacePanel,
    ToolbarPanel,
    DesignerToolsWidget,
    ViewToolsWidget,
    ViewportPanel,
    ViewPanel,
    ComponentTreeWidget,
    SettingsPanel,
  },
  props: { engine: { type: Object, required: true } },
  setup(props) {
    return () =>
      h(Designer, { engine: props.engine } as any, {
        default: () =>
          h(Workbench, null, {
            default: () =>
              h(StudioPanel, null, {
                logo: () => h('div', 'LOGO'),
                actions: () => h('div', 'ACTIONS'),
                default: () => [
                  h(
                    CompositePanel,
                    {},
                    {
                      default: () => [
                        h(
                          CompositePanel.Item,
                          { title: 'panels.Component', icon: 'Component' },
                          {
                            default: () =>
                              h(ResourceWidget, {
                                title: 'sources.Inputs',
                                sources: [InputSource],
                              }),
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
                    },
                  ),
                  h(WorkspacePanel, null, {
                    default: () => [
                      h(ToolbarPanel, null, {
                        default: () => [
                          h(DesignerToolsWidget),
                          h(ViewToolsWidget),
                        ],
                      }),
                      h(
                        ViewportPanel,
                        {},
                        {
                          default: () =>
                            h(
                              ViewPanel,
                              { type: 'FORMIVUEDESIGN' },
                              {
                                default: () =>
                                  h(ComponentTreeWidget, {
                                    components: components as any,
                                  }),
                              },
                            ),
                        },
                      ),
                    ],
                  }),
                  h(SettingsPanel, { title: 'panels.PropertySettings' }),
                ],
              }),
          }),
      })
  },
})

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms))

// les drivers du moteur s'attachent à document (partagé entre les tests du
// fichier) : tout échec interrompu ne doit pas fuiter d'état → nettoyage
// garanti via afterEach, quelle que soit la façon dont le test se termine
const mounted: { wrapper?: any; engine?: any }[] = []
const register = (wrapper: any, engine: any) => {
  mounted.push({ wrapper, engine })
  return wrapper
}
afterEach(async () => {
  while (mounted.length) {
    const { wrapper, engine } = mounted.pop()
    try {
      wrapper?.unmount()
    } catch {}
    try {
      engine?.unmount()
    } catch {}
  }
})

describe('@formivue-design/vue — studio (intégration)', () => {
  beforeAll(() => {
    GlobalRegistry.setDesignerLanguage('en-US')
  })

  test('le Studio complet monte : layout, panneaux, canvas, sources, outline', async () => {
    const engine = createDesigner()
    const wrapper = register(
      mount(Studio, { props: { engine }, attachTo: document.body }),
      engine,
    )

    // layout + panels
    expect(wrapper.find('.dn-app').exists()).toBe(true)
    expect(wrapper.get('[role=main]').text()).toContain('LOGO')
    expect(wrapper.findAll('.dn-composite-panel-tabs-pane').length).toBe(3)
    // ResourceWidget rend la source avec l'attr du moteur (id du node
    // resource — uid généré par le moteur, pas l'id de l'élément)
    expect(wrapper.get('[data-designer-source-id]').exists()).toBe(true)
    // Viewport monté (ViewPanel FORMIVUEDESIGN), canvas rend le tree racine
    expect(wrapper.find('.dn-viewport').exists()).toBe(true)
    const tree = engine.workbench.currentWorkspace.operation.tree
    expect(wrapper.get(`[data-designer-node-id="${tree.id}"]`).exists()).toBe(
      true,
    )
    // workspace créé par le Workbench
    expect(engine.workbench.currentWorkspace?.id).toBe('index')
    // l'outline vit dans le 2e onglet : on l'active puis on vérifie ses nodes
    await wrapper.findAll('.dn-composite-panel-tabs-pane')[1].trigger('click')
    await nextTick()
    expect(
      wrapper.get(`[data-designer-outline-node-id="${tree.id}"]`).exists(),
    ).toBe(true)
  })

  test('drivers : drag souris synthétique — source → cursor Dragging + moving nodes', async () => {
    const engine = createDesigner()
    const wrapper = register(
      mount(Studio, { props: { engine }, attachTo: document.body }),
      engine,
    )
    const source = wrapper.get('[data-designer-source-id]')

    // DragDropDriver : mousedown puis déplacement > 4px après > 10ms
    await source.trigger('mousedown', {
      button: 0,
      clientX: 10,
      clientY: 10,
      pageX: 10,
      pageY: 10,
    })
    expect(engine.cursor.status).toBe('NORMAL')
    await delay(20)
    await source.trigger('mousemove', {
      clientX: 60,
      clientY: 60,
      pageX: 60,
      pageY: 60,
    })
    // le premier move franchit le seuil de distance (DragStart) — un second
    // move fait passer le curseur en DRAGGING (useCursorEffect d'ère)
    await source.trigger('mousemove', {
      clientX: 70,
      clientY: 70,
      pageX: 70,
      pageY: 70,
    })
    expect(engine.cursor.status).toBe('DRAGGING')
    expect(engine.findMovingNodes().length).toBe(1)
    // findById sur un node source résout l'élément (children[0]) — l'ère
    // déplace l'ÉLÉMENT, NodeTitleWidget déballant $$ResourceNode$$
    expect(engine.findMovingNodes()[0].componentName).toBe('Field')

    // mouseup → DragStop → requestIdle → curseur normal, plus de moving nodes
    await source.trigger('mouseup', {
      clientX: 60,
      clientY: 60,
      pageX: 60,
      pageY: 60,
    })
    await delay()
    expect(engine.cursor.status).toBe('NORMAL')
    expect(engine.findMovingNodes().length).toBe(0)
  })

  test('drivers : clic canvas → sélection du node (MouseClickDriver)', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(new TreeNode({ id: 'card-1', componentName: 'Card' }))

    const wrapper = register(
      mount(Studio, { props: { engine }, attachTo: document.body }),
      engine,
    )
    const cardEl = wrapper.get('[data-designer-node-id="card-1"]')
    await cardEl.trigger('click', { clientX: 5, clientY: 5 })
    expect(
      engine.workbench.currentWorkspace.operation.selection.selected,
    ).toContain('card-1')
  })

  test('historique : undo/redo via HistoryWidget + moteur intact', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(new TreeNode({ id: 'card-1', componentName: 'Card' }))
    await delay()

    const wrapper = register(
      mount(Studio, { props: { engine }, attachTo: document.body }),
      engine,
    )
    // l'historique vit dans le 3e onglet du CompositePanel : on l'active
    const panes = wrapper.findAll('.dn-composite-panel-tabs-pane')
    await panes[2].trigger('click')
    await nextTick()
    const items = wrapper.findAll('.dn-history-item')
    expect(items.length).toBe(2) // default_state + append_node
    expect(items[1].text()).toContain('Append Node')

    // goTo le default_state → le node disparaît (undo manuel du panneau)
    await items[0].trigger('click')
    expect(tree.findById('card-1')).toBeUndefined()
    // goTo l'append → redo
    await wrapper.findAll('.dn-history-item')[1].trigger('click')
    expect(tree.findById('card-1')).toBeDefined()

    // history API directe du moteur (undo/redo des boutons DesignerToolsWidget)
    const history = engine.workbench.currentWorkspace.history
    history.undo()
    expect(tree.findById('card-1')).toBeUndefined()
    history.redo()
    expect(tree.findById('card-1')).toBeDefined()

    wrapper.unmount()
    engine.unmount()
  })

  test('locales : TextWidget consomme les registres du package (en-US)', () => {
    const engine = createDesigner()
    const wrapper = mount(
      defineComponent({
        components: { TextWidget, Designer },
        setup() {
          return () =>
            h(Designer, { engine } as any, {
              default: () => h(TextWidget, { token: 'panels.Component' }),
            })
        },
      }),
    )
    expect(wrapper.text()).toBe('Component')
  })

  test('workbench : bascule PREVIEW coupe le canvas (ViewPanel type-scopé)', async () => {
    const engine = createDesigner()
    const wrapper = register(
      mount(Studio, { props: { engine }, attachTo: document.body }),
      engine,
    )
    expect(wrapper.find('.dn-viewport').exists()).toBe(true)
    await wrapper.get('[aria-label="Preview"]').trigger('click')
    await nextTick()
    expect(engine.workbench.type).toBe('PREVIEW')
    // le ViewPanel FORMIVUEDESIGN ne rend plus (le panneau settings non plus)
    expect(wrapper.find('.dn-viewport').exists()).toBe(false)
    await wrapper.get('[aria-label="FormivueDesign view"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.dn-viewport').exists()).toBe(true)
    wrapper.unmount()
    engine.unmount()
  })
})
