// Phase 3.6 — suites @formivue-design/vue : contrat des composables (noms d'ère,
// résolution context/globals, effets de cycle de vie).
import { describe, expect, test, vi } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import { mount } from '@vue/test-utils'
import {
  Designer,
  Layout,
  Workspace,
  DesignerComponentsContext,
  TreeNodeContext,
  WorkspaceContext,
  useComponents,
  useCursor,
  useDesigner,
  useHistory,
  useLayout,
  useMoveHelper,
  useNodeIdProps,
  useOperation,
  useOutline,
  usePosition,
  usePrefix,
  useRegistry,
  useScreen,
  useSelected,
  useSelectedNode,
  useCurrentNode,
  useSelection,
  useTheme,
  useTransformHelper,
  useTree,
  useTreeNode,
  useViewport,
  useWorkbench,
  useWorkspace,
  type IEffects,
} from '../index'
import { createDesigner, GlobalRegistry, TreeNode } from '@formivue-design/core'
import { globalThisPolyfill } from '@formivue-design/shared'

// Host minimal : capture le résultat d'un composable dans une variable
const capture = (composable: () => any, into: { value: any }) =>
  defineComponent({
    setup() {
      into.value = composable()
      return () => h('div')
    },
  })

describe('@formivue-design/vue — hooks (composables)', () => {
  test('useDesigner : sans contexte → undefined ; dans <Designer> → engine fournie', async () => {
    const engine = createDesigner()
    const mountSpy = vi.spyOn(engine, 'mount')
    const unmountSpy = vi.spyOn(engine, 'unmount')

    const alone: { value: any } = { value: null }
    const wrapperAlone = mount(capture(() => useDesigner(), alone))
    expect(alone.value).toBeNull() // pas de global, pas de contexte → null (parité useContext d'ère)
    wrapperAlone.unmount()

    const inside: { value: any } = { value: null }
    const wrapper = mount(Designer, {
      props: { engine },
      slots: {
        default: () => h(capture(() => useDesigner(), inside)),
      },
    })
    expect(inside.value).toBe(engine)
    expect(mountSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(unmountSpy).toHaveBeenCalledTimes(1)
  })

  test('useDesigner(effects) : appelé au montage avec engine, cleanup à la destruction', () => {
    const engine = createDesigner()
    const cleanup = vi.fn()
    const effects: IEffects = (e) => {
      expect(e).toBe(engine)
      return cleanup
    }
    const wrapper = mount(Designer, {
      props: { engine },
      slots: {
        default: () => h(capture(() => useDesigner(effects), { value: null })),
      },
    })
    expect(cleanup).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  test('useLayout/usePrefix/useTheme/usePosition dans <Layout> (défauts dn-/light/fixed)', () => {
    const captured: { value: any } = { value: null }
    const wrapper = mount(Layout, {
      slots: {
        default: () =>
          h(
            capture(
              () => [
                useLayout(),
                usePrefix('viewport'),
                useTheme(),
                usePosition(),
              ],
              captured,
            ),
          ),
      },
    })
    const [layout, prefix, theme, position] = captured.value
    expect(layout.prefixCls).toBe('dn-')
    expect(prefix).toBe('dn-viewport')
    expect(theme).toBe('light')
    expect(position).toBe('fixed')
    expect(wrapper.find('.dn-app').exists()).toBe(true)
    expect(wrapper.find('.dn-light').exists()).toBe(true)
    wrapper.unmount()
  })

  test('usePrefix suit prefixCls personnalisé', () => {
    const captured: { value: any } = { value: null }
    const wrapper = mount(Layout, {
      props: { prefixCls: 'xx-' },
      slots: {
        default: () => h(capture(() => usePrefix('icon'), captured)),
      },
    })
    expect(captured.value).toBe('xx-icon')
    wrapper.unmount()
  })

  test('useRegistry → GlobalRegistry', () => {
    const captured: { value: any } = { value: null }
    const wrapper = mount(capture(() => useRegistry(), captured))
    expect(captured.value).toBe(GlobalRegistry)
    wrapper.unmount()
  })

  test('useWorkspace/useTree/useOperation/useViewport/useOutline/useHistory/useSelection/useMoveHelper/useTransformHelper dans <Workspace>', () => {
    const engine = createDesigner()
    const captured: { value: any } = { value: null }
    const wrapper = mount(Designer, {
      props: { engine },
      slots: {
        default: () =>
          h(Workspace, null, {
            default: () =>
              h(
                capture(
                  () => [
                    useWorkspace(),
                    useTree(),
                    useOperation(),
                    useViewport(),
                    useOutline(),
                    useHistory(),
                    useSelection(),
                    useMoveHelper(),
                    useTransformHelper(),
                  ],
                  captured,
                ),
              ),
          }),
      },
    })
    const [
      workspace,
      tree,
      operation,
      viewport,
      outline,
      history,
      selection,
      moveHelper,
      transformHelper,
    ] = captured.value
    expect(workspace?.id).toBe('index')
    const ws = engine.workbench.findWorkspaceById('index')
    expect(tree).toBe(ws.operation.tree)
    expect(operation).toBe(ws.operation)
    expect(viewport).toBe(ws.viewport)
    expect(outline).toBe(ws.outline)
    expect(history).toBe(ws.history)
    expect(selection).toBe(ws.operation.selection)
    expect(moveHelper).toBe(ws.operation.moveHelper)
    expect(transformHelper).toBe(ws.operation.transformHelper)
    wrapper.unmount()
  })

  test('useCursor/useScreen/useWorkbench → parties de engine', () => {
    const engine = createDesigner()
    const captured: { value: any } = { value: null }
    const wrapper = mount(Designer, {
      props: { engine },
      slots: {
        default: () =>
          h(
            capture(() => [useCursor(), useScreen(), useWorkbench()], captured),
          ),
      },
    })
    const [cursor, screen, workbench] = captured.value
    expect(cursor).toBe(engine.cursor)
    expect(screen).toBe(engine.screen)
    expect(workbench).toBe(engine.workbench)
    wrapper.unmount()
  })

  test('useTreeNode/useComponents injectés (TreeNodeContext/DesignerComponentsContext)', () => {
    const node = { id: 'n1' } as any
    const components = { Card: {} as any }
    const captured: { value: any } = { value: null }
    const wrapper = mount(
      capture(() => [useTreeNode(), useComponents()], captured),
      {
        global: {
          provide: {
            [TreeNodeContext as any]: node,
            [DesignerComponentsContext as any]: components,
          },
        },
      },
    )
    const [treeNode, comps] = captured.value
    expect(treeNode).toBe(node)
    expect(comps).toBe(components)
    wrapper.unmount()
  })

  test('useNodeIdProps : attr du moteur + id du TreeNodeContext', () => {
    const node = { id: 'root' } as any
    const captured: { value: any } = { value: null }
    const wrapper = mount(
      capture(() => useNodeIdProps(), captured),
      {
        global: {
          provide: {
            [TreeNodeContext as any]: node,
          },
        },
      },
    )
    expect(captured.value).toEqual({ 'data-designer-node-id': 'root' })
    wrapper.unmount()
  })

  test('useWorkspace : fallback global __FORMIVUEDESIGN_WORKSPACE__', () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'global-ws' })
    const ws = engine.workbench.findWorkspaceById('global-ws')
    ;(globalThisPolyfill as any)['__FORMIVUEDESIGN_WORKSPACE__'] = ws
    const captured: { value: any } = { value: null }
    const wrapper = mount(capture(() => useWorkspace(), captured))
    expect(captured.value).toBe(ws)
    delete (globalThisPolyfill as any)['__FORMIVUEDESIGN_WORKSPACE__']
    wrapper.unmount()
    engine.unmount()
  })

  test('useSelected/useSelectedNode/useCurrentNode résolvent la sélection courante', () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace({ id: 'index' })
    const tree = engine.workbench.currentWorkspace.operation.tree
    const field = new TreeNode({ id: 'field-1', componentName: 'Field' })
    tree.append(field)
    engine.workbench.currentWorkspace.operation.selection.select(field)

    const captured: { value: any } = { value: null }
    const wrapper = mount(Designer, {
      props: { engine },
      slots: {
        default: () =>
          h(Workspace, null, {
            default: () =>
              h(
                capture(
                  () => [useSelected(), useSelectedNode(), useCurrentNode()],
                  captured,
                ),
              ),
          }),
      },
    })
    const [selected, selectedNode, currentNode] = captured.value
    expect(selected).toEqual(['field-1'])
    expect(selectedNode?.id).toBe('field-1')
    expect(currentNode).toBe(selectedNode) // alias deprecated conservé
    wrapper.unmount()
  })

  test('WorkspaceContext fourni par <Workspace> (id/titre)', () => {
    const Probe = defineComponent({
      setup() {
        const ctx = inject(WorkspaceContext, null)
        return () => h('div', { id: 'probe' }, [ctx?.id, '|', ctx?.title])
      },
    })
    const wrapper = mount(Workspace, {
      props: { id: 'page1', title: 'Page 1' },
      slots: { default: () => h(Probe) },
    })
    expect(wrapper.get('#probe').text()).toBe('page1|Page 1')
    wrapper.unmount()
  })
})
