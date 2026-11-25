// Phase 3.6 — suites @formivue-design/vue : montage isolé des widgets (chromes).
// Locales du package enregistrées à l'import de '../index' (effet de bord
// volontaire, parité avec l'ère `import './locales'`).
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  CompositePanel,
  Designer,
  DroppableWidget,
  EmptyWidget,
  GhostWidget,
  HistoryWidget,
  IconWidget,
  Layout,
  NodeActionsWidget,
  NodePathWidget,
  NodeTitleWidget,
  OutlineTreeWidget,
  ResourceWidget,
  SettingsPanel,
  StudioPanel,
  TextWidget,
  ToolbarPanel,
  ViewToolsWidget,
  ViewportPanel,
  Workspace,
  WorkspacePanel,
  ComponentTreeWidget,
  DesignerToolsWidget,
  ViewPanel,
  TreeNodeContext,
  DesignerEngineContext,
} from '../index'
import {
  createDesigner,
  createResource,
  createBehavior,
  GlobalRegistry,
  ScreenType,
  CursorStatus,
  CursorDragType,
  TreeNode,
  WorkbenchTypes,
} from '@formivue-design/core'

const RootBehavior = createBehavior({
  name: 'Root',
  selector: 'Root',
  designerProps: { droppable: true },
  designerLocales: {
    'en-US': { title: 'Root' },
  },
})

const CardBehavior = createBehavior({
  name: 'Card',
  selector: 'Card',
  designerProps: { droppable: true },
  designerLocales: {
    'en-US': { title: 'Card' },
  },
})

GlobalRegistry.registerDesignerBehaviors([RootBehavior, CardBehavior])

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

describe('@formivue-design/vue — widgets', () => {
  beforeAll(() => {
    GlobalRegistry.setDesignerLanguage('en-US')
  })

  // IconWidget --------------------------------------------------------------

  test('IconWidget : icône du registre (composant h()) rendue en svg', () => {
    const wrapper = mount(IconWidget, { props: { infer: 'Page', size: 20 } })
    const svg = wrapper.get('svg')
    expect(svg.attributes('viewBox')).toBe('0 0 1024 1024')
    expect(svg.attributes('aria-hidden')).toBe('true')
    // fallthrough attrs : height/width/fill transportés sur la racine svg
    expect(svg.attributes('height')).toBe('20')
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('fill')).toBe('currentColor')
    wrapper.unmount()
  })

  test('IconWidget : chaîne inconnue → <img src>', () => {
    const wrapper = mount(IconWidget, {
      props: { infer: '//example.com/x.svg' },
    })
    expect(wrapper.get('img').attributes('src')).toBe('//example.com/x.svg')
    wrapper.unmount()
  })

  test('IconWidget : icône-thème {light,dark} suit le thème du layout', () => {
    const Logo = {
      light: '//cdn/light.svg',
      dark: '//cdn/dark.svg',
    }
    const WithLayout = defineComponent({
      components: { IconWidget },
      setup() {
        return () =>
          h(
            Layout,
            { theme: 'dark' },
            {
              default: () => h(IconWidget, { infer: Logo as any }),
            },
          )
      },
    })
    const wrapper = mount(WithLayout)
    expect(wrapper.get('img').attributes('src')).toBe('//cdn/dark.svg')
    wrapper.unmount()
    const WithLayout2 = defineComponent({
      components: { IconWidget },
      setup() {
        return () =>
          h(
            Layout,
            { theme: 'light' },
            {
              default: () => h(IconWidget, { infer: Logo as any }),
            },
          )
      },
    })
    const wrapper2 = mount(WithLayout2)
    expect(wrapper2.get('img').attributes('src')).toBe('//cdn/light.svg')
    wrapper2.unmount()
  })

  test('IconWidget : sans infer → rien', () => {
    const wrapper = mount(IconWidget)
    expect(wrapper.find('span').exists()).toBe(false)
    wrapper.unmount()
  })

  test('IconWidget : title/aria pass-through + cursor pointer sur onClick', () => {
    const wrapper = mount(IconWidget, {
      props: { infer: 'Page' },
      attrs: { title: 'the page', onClick: () => {} },
    })
    const span = wrapper.get('span')
    expect(span.attributes('title')).toBe('the page')
    expect(span.attributes('style')).toContain('pointer')
    wrapper.unmount()
  })

  // TextWidget --------------------------------------------------------------

  test('TextWidget : token résolu via locales du package (en-US)', () => {
    const wrapper = mount(TextWidget, { props: { token: 'panels.Component' } })
    expect(wrapper.text()).toBe('Component')
    wrapper.unmount()
  })

  test('TextWidget : slot vnode (children element d’ère) rendu tel quel', () => {
    const Host = defineComponent({
      components: { TextWidget },
      setup() {
        return () =>
          h(TextWidget, null, { default: () => h('b', 'Bold content') })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.get('b').text()).toBe('Bold content')
    wrapper.unmount()
  })

  test('TextWidget : objet locales multi-langues', () => {
    const wrapper = mount(TextWidget, {
      props: {
        token: { 'en-US': 'Hello', 'fr-FR': 'Bonjour' } as any,
      },
    })
    expect(wrapper.text()).toBe('Hello')
    wrapper.unmount()
  })

  test('TextWidget : defaultMessage quand le token résout à vide (lang absente)', () => {
    const wrapper = mount(TextWidget, {
      props: {
        token: { 'fr-FR': 'Bonjour' } as any, // pas de en-US → takeLocale = undefined
        defaultMessage: 'Fallback',
      },
    })
    expect(wrapper.text()).toBe('Fallback')
    wrapper.unmount()
  })

  test('TextWidget : token non résolu → rendu brut (sémantique d’ère)', () => {
    const wrapper = mount(TextWidget, {
      props: { token: 'unknown.token' },
    })
    expect(wrapper.text()).toBe('unknown.token')
    wrapper.unmount()
  })

  // NodeTitleWidget ----------------------------------------------------------

  test('NodeTitleWidget : title du behavior + fallback componentName', () => {
    const node = new TreeNode({ id: 'card-1', componentName: 'Card' })
    const wrapper = mount(NodeTitleWidget, { props: { node } })
    expect(wrapper.text()).toBe('Card')
    wrapper.unmount()
    const unknown = new TreeNode({ id: 'x', componentName: 'Whatever' })
    const wrapper2 = mount(NodeTitleWidget, { props: { node: unknown } })
    expect(wrapper2.text()).toBe('Whatever')
    wrapper2.unmount()
  })

  test('NodeTitleWidget : déballage $$ResourceNode$$', () => {
    const inner = new TreeNode({ id: 'src', componentName: 'Card' })
    const resource = new TreeNode({
      id: 'res',
      componentName: '$$ResourceNode$$',
    })
    resource.children = [inner]
    const wrapper = mount(NodeTitleWidget, { props: { node: resource } })
    expect(wrapper.text()).toBe('Card')
    wrapper.unmount()
  })

  // ResourceWidget ------------------------------------------------------------

  test('ResourceWidget : sources rendues avec data-designer-source-id + expansion', async () => {
    const Input = createResource({
      title: { 'en-US': 'Input' },
      icon: 'InputSource',
      elements: [{ componentName: 'Field', props: { 'x-component': 'Input' } }],
    })
    const Host = defineComponent({
      components: { ResourceWidget },
      setup() {
        return () =>
          h(ResourceWidget, {
            title: 'sources.Inputs',
            sources: [Input],
            defaultExpand: false,
          })
      },
    })
    // usePrefix requiert un Layout : on wrappe
    const WithLayout = defineComponent({
      components: { Host },
      setup() {
        return () => h(Layout, null, { default: () => h(Host) })
      },
    })
    const wrapper2 = mount(WithLayout)
    const source = wrapper2.get('[data-designer-source-id]')
    expect(source.attributes('data-designer-source-id')).toBeTruthy()
    expect(wrapper2.text()).toContain('Input')
    // replié par défaut : contenu présent mais fermé visuellement (classe expand absente)
    expect(wrapper2.find('.dn-resource.expand').exists()).toBe(false)
    await wrapper2.get('.dn-resource-header').trigger('click')
    expect(wrapper2.find('.dn-resource.expand').exists()).toBe(true)
    wrapper2.unmount()
  })

  // HistoryWidget --------------------------------------------------------------

  test('HistoryWidget : entrées rendues + goTo rembobine le tree', async () => {
    const engine = createDesigner()
    const ws = engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = ws.operation.tree
    const field = new TreeNode({ id: 'f1', componentName: 'Field' })
    tree.append(field)
    await vi.waitFor(() => expect(ws.history.list()).toHaveLength(2))

    const wrapper = mount(
      defineComponent({
        components: { HistoryWidget, Designer, Workspace },
        setup() {
          return () =>
            h(Designer, { engine } as any, {
              default: () =>
                h(Workspace, null, { default: () => h(HistoryWidget) }),
            })
        },
      }),
    )
    const items = wrapper.findAll('.dn-history-item')
    expect(items).toHaveLength(2)
    expect(items[items.length - 1].text()).toContain('Append Node')

    // le premier item = default_state : y aller retire le champ
    await items[0].trigger('click')
    expect(tree.findById('f1')).toBeUndefined()
    // dernier item = après l'append
    await wrapper.findAll('.dn-history-item').at(-1).trigger('click')
    expect(tree.findById('f1')).toBeDefined()
    wrapper.unmount()
  })

  // NodeActionsWidget ---------------------------------------------------------

  test('NodeActionsWidget : activeShown masque hors sélection ; Action rend un lien', () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const node = new TreeNode({ id: 'f1', componentName: 'Field' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(node)

    const Host = defineComponent({
      components: { NodeActionsWidget },
      setup() {
        return () =>
          h(Layout, null, {
            default: () =>
              h(
                NodeActionsWidget,
                { activeShown: true },
                {
                  default: () =>
                    h(NodeActionsWidget.Action, {
                      title: 'Delete',
                      icon: 'Delete',
                    }),
                },
              ),
          })
      },
    })
    const wrapper = mount(Host, {
      // le contexte TreeNode est fourni par TreeNodeWidget en production
      global: {
        provide: {
          [TreeNodeContext as any]: node,
          [DesignerEngineContext as any]: engine,
        },
      },
    })
    expect(wrapper.find('.dn-node-actions').exists()).toBe(false)
    wrapper.unmount()

    engine.workbench.currentWorkspace.operation.selection.select(node)
    const wrapper2 = mount(Host, {
      global: {
        provide: {
          [TreeNodeContext as any]: node,
          [DesignerEngineContext as any]: engine,
        },
      },
    })
    expect(wrapper2.get('.dn-node-actions').exists()).toBe(true)
    const link = wrapper2.get('a.dn-node-actions-item')
    expect(link.attributes('data-click-stop-propagation')).toBe('true')
    expect(link.text()).toBe('Delete')
    wrapper2.unmount()
    engine.unmount()
  })

  // DroppableWidget ------------------------------------------------------------

  test('DroppableWidget : placeholder NodeTitleWidget quand vide, children sinon', () => {
    const node = new TreeNode({ id: 'box', componentName: 'Card' })
    const wrapper = mount(DroppableWidget, {
      props: { node, height: 40, placeholder: true },
      slots: { default: () => h('div', 'content') },
    })
    expect(wrapper.find('.dn-droppable-placeholder').exists()).toBe(true)
    expect(wrapper.text()).toContain('Card')
    wrapper.unmount()

    const withChild = new TreeNode({ id: 'box2', componentName: 'Card' })
    withChild.children = [new TreeNode({ id: 'c', componentName: 'Field' })]
    const wrapper2 = mount(DroppableWidget, {
      props: { node: withChild },
      slots: { default: () => h('div', 'content') },
    })
    expect(wrapper2.find('.dn-droppable-placeholder').exists()).toBe(false)
    expect(wrapper2.text()).toContain('content')
    wrapper2.unmount()
  })

  // EmptyWidget / GhostWidget ----------------------------------------------------

  test('EmptyWidget : rendu quand le tree est vide, null sinon', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const Host = defineComponent({
      components: { EmptyWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, { default: () => h(EmptyWidget) }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.dn-empty').exists()).toBe(true)
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(new TreeNode({ id: 'f', componentName: 'Field' }))
    await nextTick()
    expect(wrapper.find('.dn-empty').exists()).toBe(false)
    wrapper.unmount()
    engine.unmount()
  })

  test('GhostWidget : visible uniquement en drag avec moving nodes', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const ws = engine.workbench.currentWorkspace
    const tree = ws.operation.tree
    const field = new TreeNode({ id: 'ghost-field', componentName: 'Field' })
    tree.append(field)

    const Host = defineComponent({
      components: { GhostWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, { default: () => h(GhostWidget) }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.dn-ghost').exists()).toBe(false)

    ws.operation.moveHelper.dragStart({ dragNodes: [field] })
    engine.cursor.setStatus(CursorStatus.Dragging)
    engine.cursor.setDragType(CursorDragType.Move)
    engine.cursor.setPosition({
      topClientX: 100,
      topClientY: 100,
      clientX: 100,
      clientY: 100,
      pageX: 100,
      pageY: 100,
    } as any)
    await nextTick()
    await nextTick()
    const ghost = wrapper.find('.dn-ghost')
    expect(ghost.exists()).toBe(true)
    expect(ghost.text()).toContain('Field')
    engine.cursor.setStatus(CursorStatus.Normal)
    ws.operation.moveHelper.dragEnd()
    wrapper.unmount()
    engine.unmount()
  })

  // ComponentTreeWidget ---------------------------------------------------------

  test('ComponentTreeWidget/TreeNodeWidget : rend le tree via matériaux + attrs moteur', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(new TreeNode({ id: 'card-1', componentName: 'TestCard' }))
    const card = tree.findById('card-1')
    card.append(new TreeNode({ id: 'field-1', componentName: 'TestField' }))

    const components = {
      TestCard,
      TestField: defineComponent({
        name: 'TestField',
        inheritAttrs: false,
        setup(_props, { attrs }) {
          return () => h('input', { ...attrs, class: 'test-field' })
        },
      }),
    }

    const Host = defineComponent({
      components: { ComponentTreeWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, {
                default: () =>
                  h(ComponentTreeWidget, {
                    components: components as any,
                  }),
              }),
          })
      },
    })
    const wrapper = mount(Host)
    const root = wrapper.get('.dn-component-tree')
    expect(root.attributes('data-designer-node-id')).toBe(tree.id)
    const cardEl = wrapper.get('[data-designer-node-id="card-1"]')
    expect(cardEl.classes()).toContain('test-card')
    expect(
      wrapper.get('[data-designer-node-id="field-1"].test-field'),
    ).toBeTruthy()
    wrapper.unmount()
    engine.unmount()
  })

  // OutlineTreeWidget -----------------------------------------------------------

  test('OutlineTreeWidget : nodes rendus avec data-designer-outline-node-id', () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    tree.append(new TreeNode({ id: 'card-1', componentName: 'Card' }))

    const Host = defineComponent({
      components: { OutlineTreeWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, {
                default: () => h(OutlineTreeWidget, { renderTitle: undefined }),
              }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(
      wrapper.get('[data-designer-outline-node-id="card-1"]').exists(),
    ).toBe(true)
    expect(
      wrapper.get('[data-designer-outline-node-id="card-1"]').text(),
    ).toContain('Card')
    wrapper.unmount()
    engine.unmount()
  })

  // NodePathWidget ----------------------------------------------------------------

  test('NodePathWidget : fil d’ariane des parents du node sélectionné', () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    const card = new TreeNode({ id: 'card-1', componentName: 'Card' })
    tree.append(card)
    const field = new TreeNode({ id: 'field-1', componentName: 'Field' })
    card.append(field)
    engine.workbench.currentWorkspace.operation.selection.select(field)

    const Host = defineComponent({
      components: { NodePathWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, { default: () => h(NodePathWidget) }),
          })
      },
    })
    const wrapper = mount(Host)
    const links = wrapper.findAll('a')
    expect(links.length).toBe(3) // Root → Card → Field (getParents d'ère)
    expect(links[0].text()).toBe('Root')
    expect(links[1].text()).toBe('Card')
    expect(links[2].text()).toBe('Field')
    wrapper.unmount()
    engine.unmount()
  })

  // ViewToolsWidget / DesignerToolsWidget ------------------------------------------

  test('ViewToolsWidget : bascule workbench.type', async () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { ViewToolsWidget, Designer },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () => h(ViewToolsWidget),
          })
      },
    })
    const wrapper = mount(Host)
    const jsonBtn = wrapper.get('[aria-label="JSON tree view"]')
    await jsonBtn.trigger('click')
    expect(engine.workbench.type).toBe('JSONTREE')
    await wrapper.get('[aria-label="Preview"]').trigger('click')
    expect(engine.workbench.type).toBe('PREVIEW')
    await wrapper.get('[aria-label="FormivueDesign view"]').trigger('click')
    expect(engine.workbench.type).toBe('FORMIVUEDESIGN')
    wrapper.unmount()
    engine.unmount()
  })

  test('DesignerToolsWidget : undo/redo désactivés à vide, screen type piloté', async () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { DesignerToolsWidget, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, { default: () => h(DesignerToolsWidget) }),
          })
      },
    })
    const wrapper = mount(Host)
    const undo = wrapper.get('[aria-label="Undo"]')
    expect((undo.element as HTMLButtonElement).disabled).toBe(true)
    expect(
      (wrapper.get('[aria-label="Redo"]').element as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    await wrapper.get('[aria-label="Responsive screen"]').trigger('click')
    expect(engine.screen.type).toBe(ScreenType.Responsive)
    await wrapper.get('[aria-label="PC screen"]').trigger('click')
    expect(engine.screen.type).toBe(ScreenType.PC)
    await wrapper.get('[aria-label="Mobile screen"]').trigger('click')
    expect(engine.screen.type).toBe(ScreenType.Mobile)
    // flip visible en mode mobile
    expect(wrapper.get('[aria-label="Flip mobile screen"]').exists()).toBe(true)
    wrapper.unmount()
    engine.unmount()
  })

  // Panels --------------------------------------------------------------------

  test('StudioPanel : role main + logo/actions en slots', () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { StudioPanel, Designer },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(
                StudioPanel,
                {},
                {
                  logo: () => h('div', 'LOGO'),
                  actions: () => h('div', 'ACTIONS'),
                  default: () => h('div', 'BODY'),
                },
              ),
          })
      },
    })
    const wrapper = mount(Host)
    const main = wrapper.get('[role=main]')
    expect(main.text()).toContain('LOGO')
    expect(main.text()).toContain('ACTIONS')
    expect(main.text()).toContain('BODY')
    wrapper.unmount()
    engine.unmount()
  })

  test('CompositePanel : items du slot, bascule d’onglet, contenu rendu', async () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { CompositePanel, Designer },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(
                CompositePanel,
                {},
                {
                  default: () => [
                    h(
                      CompositePanel.Item,
                      { title: 'panels.Component', icon: 'Component' },
                      () => 'PANEL-A',
                    ),
                    h(
                      CompositePanel.Item,
                      { title: 'panels.History', icon: 'History' },
                      () => 'PANEL-B',
                    ),
                  ],
                },
              ),
          })
      },
    })
    const wrapper = mount(Host)
    const panes = wrapper.findAll('.dn-composite-panel-tabs-pane')
    expect(panes.length).toBe(2)
    expect(wrapper.text()).toContain('PANEL-A')
    await panes[1].trigger('click')
    expect(wrapper.text()).toContain('PANEL-B')
    // re-clic sur l'onglet actif → panneau refermé
    await wrapper.findAll('.dn-composite-panel-tabs-pane')[1].trigger('click')
    expect(wrapper.text()).not.toContain('PANEL-B')
    wrapper.unmount()
    engine.unmount()
  })

  test('SettingsPanel : opener après fermeture, body en FORMIVUEDESIGN', async () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { SettingsPanel, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, {
                default: () =>
                  h(
                    SettingsPanel,
                    { title: 'panels.PropertySettings' },
                    { default: () => h('div', 'SETTINGS-BODY') },
                  ),
              }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.text()).toContain('SETTINGS-BODY')
    await wrapper.get('.dn-settings-panel-header-close').trigger('click')
    expect(wrapper.text()).not.toContain('SETTINGS-BODY')
    expect(wrapper.find('.dn-settings-panel-opener').exists()).toBe(true)
    await wrapper.get('.dn-settings-panel-opener').trigger('click')
    expect(wrapper.text()).toContain('SETTINGS-BODY')
    wrapper.unmount()
    engine.unmount()
  })

  test('WorkspacePanel/ToolbarPanel/ViewportPanel : structure', () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: {
        WorkspacePanel,
        ToolbarPanel,
        ViewportPanel,
        Designer,
      },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(WorkspacePanel, null, {
                default: () => [
                  h(ToolbarPanel, null, { default: () => 'TOOLS' }),
                  h(ViewportPanel, null, { default: () => 'VIEW' }),
                ],
              }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.get('.dn-workspace-panel').exists()).toBe(true)
    const items = wrapper.findAll('.dn-workspace-panel-item')
    expect(items.length).toBe(2)
    expect(wrapper.text()).toContain('TOOLS')
    expect(wrapper.text()).toContain('VIEW')
    wrapper.unmount()
    engine.unmount()
  })

  test('ViewPanel FORMIVUEDESIGN : Viewport monté + slot render-prop {tree, onChange}', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const received: any[] = []
    const Host = defineComponent({
      components: { ViewPanel, Designer, Workspace },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, {
                default: () =>
                  h(
                    ViewPanel,
                    { type: 'FORMIVUEDESIGN' as WorkbenchTypes },
                    {
                      default: ({ tree }: any) => {
                        received.push(tree)
                        return h('div', { class: 'canvas' }, tree?.id)
                      },
                    },
                  ),
              }),
          })
      },
    })
    const wrapper = mount(Host)
    expect(wrapper.find('.dn-viewport').exists()).toBe(true)
    expect(wrapper.get('.canvas').text()).toBeTruthy()
    const tree = engine.workbench.currentWorkspace.operation.tree
    expect(received[0]).toBe(tree)
    wrapper.unmount()
    engine.unmount()
  })
})
