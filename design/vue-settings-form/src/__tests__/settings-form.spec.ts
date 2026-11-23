// Phase 5.2/5.4 — spec panneau : intégration SettingsForm × moteur × bindings
// formivue-vue. Sélection → form (write-through node.props observable, vérifié
// fork : getValidFormValues garde la référence) → éditeurs → valeurs ; effets
// useLocales (titres depuis les tokens settings.*) et useSnapshot (debounce
// 1 s → operation.snapshot) ; registre étendu par `components` (setters par
// nom, contrat d'ère) ; re-création du form à la sélection (clé = node.id).
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  createBehavior,
  createDesigner,
  GlobalRegistry,
  TreeNode,
} from '@formivue-design/core'
import { Designer } from '@formivue-design/vue'
import { AllSchemas, FormCollapse } from '@formivue-design/formivue-vue'
import { SettingsForm } from '../index'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

let seed = 0

// behavior de test : designerProps.propsSchema + locales settings.*
const fieldBehavior = (propsSchema: any) => {
  const name = `TestField-${seed++}`
  return {
    name,
    behavior: createBehavior({
      name,
      selector: (node: any) => node.componentName === name,
      designerProps: { propsSchema },
      designerLocales: {
        'en-US': {
          settings: {
            title: { title: 'Title' },
            required: { title: 'Required' },
            'style.width': { title: 'Width' },
          },
        },
      },
    }),
    componentName: name,
  }
}

const mountPanel = (engine: any, props: any = {}) => {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          Designer as any,
          { engine },
          {
            default: () => h(SettingsForm as any, { ...props }),
          },
        ),
    }),
    { attachTo: document.body },
  )
  return { wrapper, engine }
}

const engineWith = (componentName: string, props: any) => {
  const engine = createDesigner()
  // le Workbench du studio crée le workspace au montage — en test isolé on
  // l'assure à la main (recette studio.spec)
  engine.workbench.ensureWorkspace()
  const tree = engine.workbench.currentWorkspace.operation.tree
  const node = new TreeNode({ id: 'field-1', componentName, props })
  tree.append(node)
  return { engine, node }
}

const mounted: any[] = []
afterEach(() => {
  while (mounted.length) {
    const x = mounted.pop()
    try {
      x?.wrapper?.unmount()
    } catch {}
    try {
      x?.engine?.unmount()
    } catch {}
  }
})
const register = (x: any) => {
  mounted.push(x)
  return x
}

describe('@formivue-design/vue-settings-form — SettingsForm (panneau)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('sans sélection : placeholder vide, aucun éditeur', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine } = engineWith(componentName, {})
    const panel = register(mountPanel(engine))
    await nextTick()
    await delay(600)
    expect(panel.wrapper.text()).toContain('No properties')
    expect(panel.wrapper.find('input').exists()).toBe(false)
  })

  test('sélection → form monté : label localisé (useLocales) + valeur du node', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine, node } = engineWith(componentName, { title: 'Nom' })
    const panel = register(mountPanel(engine))
    engine.workbench.currentWorkspace.operation.selection.select(node)
    // l'observer de SettingsForm est schedulé via requestIdle (d'ère) —
    // laisser le temps réel s'écouler pour le re-rendu
    await nextTick()
    await delay(600)
    // label via token settings.title.title → field.title → FormItem label
    expect(panel.wrapper.text()).toContain('Title')
    const input = panel.wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('Nom')
  })

  test('l’accordéon propose ses panneaux et limite le choix en mode exclusif', async () => {
    GlobalRegistry.setDesignerBehaviors([FormCollapse.Behavior])
    const { engine, node } = engineWith('Field', {
      type: 'void',
      'x-component': 'FormCollapse',
    })
    const addPanel = (
      id: string,
      header: string,
      name?: string,
      key?: string,
    ) =>
      node.append(
        new TreeNode({
          id,
          componentName: 'Field',
          props: {
            type: 'void',
            name,
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': key ? { header, key } : { header },
          },
        }),
      )
    addPanel('panel-1', 'First', 'first')
    addPanel('panel-2', 'Second', 'second', 'custom')
    const { wrapper } = register(mountPanel(engine))
    engine.workbench.currentWorkspace.operation.selection.select(node)
    const boxes = () => wrapper.findAll('[role="checkbox"]')
    await vi.waitFor(() => expect(boxes()).toHaveLength(2))
    expect(wrapper.text()).toContain('Panels open by default')
    await boxes()[0].trigger('click')
    await boxes()[1].trigger('click')
    const settings = () => node.props['x-component-props']
    expect(settings().defaultOpenKeys).toEqual(['first', 'custom'])

    addPanel('panel-3', 'Third')
    await vi.waitFor(() => expect(boxes()).toHaveLength(3))
    const toggle = wrapper
      .findAll('[data-slot="form-item"]')
      .find((row) => row.text().includes('One panel at a time'))!
      .get('[role="switch"]')
    await toggle.trigger('click')
    expect(settings().accordion).toBe(true)
    await vi.waitFor(() =>
      expect(boxes().map((box) => box.attributes('aria-checked'))).toEqual([
        'true',
        'false',
        'false',
      ]),
    )
    await boxes()[2].trigger('click')
    expect(settings().defaultOpenKeys).toEqual(['panel-3'])
    await boxes()[2].trigger('click')
    expect(settings().defaultOpenKeys).toEqual([])
  })

  test('édition → form.values + node.props (write-through observable)', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine, node } = engineWith(componentName, { title: 'Nom' })
    const panel = register(mountPanel(engine))
    engine.workbench.currentWorkspace.operation.selection.select(node)
    // l'observer de SettingsForm est schedulé via requestIdle (d'ère) —
    // laisser le temps réel s'écouler pour le re-rendu
    await nextTick()
    await delay(600)
    await panel.wrapper.find('input').setValue('Renommé')
    await nextTick()
    // write-through : le form vit sur node.props (observable) — l'édition du
    // panneau écrit DANS les props du node (canvas live, contrat d'ère).
    expect(node.props.title).toBe('Renommé')
  })

  test('useSnapshot : édition → operation.snapshot(update:node:props) après 1 s', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine, node } = engineWith(componentName, {})
    const operation = engine.workbench.currentWorkspace.operation
    const snapshot = vi.spyOn(operation, 'snapshot')
    const panel = register(mountPanel(engine))
    engine.workbench.currentWorkspace.operation.selection.select(node)
    // l'observer de SettingsForm est schedulé via requestIdle (d'ère) —
    // laisser le temps réel s'écouler pour le re-rendu
    await nextTick()
    await delay(600)
    await panel.wrapper.find('input').setValue('X')
    await delay(1300)
    expect(snapshot).toHaveBeenCalledWith('update:node:props')
  })

  test('registre components : les setters référencés PAR NOM sont résolus', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        enum: { 'x-decorator': 'FormItem', 'x-component': 'DataSourceSetter' },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine, node } = engineWith(componentName, {})
    const DataSourceSetter = defineComponent({
      name: 'StubDataSourceSetter',
      setup: () => () => h('button', { type: 'button' }, 'DATA-SOURCE-STUB'),
    })
    const panel = register(
      mountPanel(engine, { components: { DataSourceSetter } }),
    )
    engine.workbench.currentWorkspace.operation.selection.select(node)
    // l'observer de SettingsForm est schedulé via requestIdle (d'ère) —
    // laisser le temps réel s'écouler pour le re-rendu
    await nextTick()
    await delay(600)
    expect(panel.wrapper.text()).toContain('DATA-SOURCE-STUB')
  })

  test('re-création du form au changement de sélection (clé = node.id)', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const engine = createDesigner()
    engine.workbench.ensureWorkspace()
    const tree = engine.workbench.currentWorkspace.operation.tree
    const nodeA = new TreeNode({
      id: 'a',
      componentName,
      props: { title: 'A' },
    })
    const nodeB = new TreeNode({
      id: 'b',
      componentName,
      props: { title: 'B' },
    })
    tree.append(nodeA, nodeB)
    const panel = register(mountPanel(engine))
    const selection = engine.workbench.currentWorkspace.operation.selection
    selection.select(nodeA)
    await nextTick()
    await delay(600)
    expect((panel.wrapper.get('input').element as HTMLInputElement).value).toBe(
      'A',
    )
    selection.select(nodeB)
    await nextTick()
    await delay(600)
    // form re-créé (sémantique useMemo d'ère) : les valeurs repartent du node
    expect((panel.wrapper.get('input').element as HTMLInputElement).value).toBe(
      'B',
    )
  })

  test('CSSStyle complet (9 setters + FoldItem/CollapseItem) : monte sans warning', async () => {
    const { behavior, componentName } = fieldBehavior({
      type: 'object',
      properties: AllSchemas.CSSStyle.properties,
    })
    GlobalRegistry.registerDesignerBehaviors([{ Behavior: behavior } as any])
    const { engine, node } = engineWith(componentName, {
      style: {
        margin: '4px 8px',
        display: 'flex',
        border: { borderStyle: 'solid' },
      },
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const panel = register(mountPanel(engine))
    engine.workbench.currentWorkspace.operation.selection.select(node)
    // l'observer de SettingsForm est schedulé via requestIdle (d'ère) —
    // laisser le temps réel s'écouler pour le re-rendu
    await nextTick()
    await delay(600)
    // les setters de style rendent (FoldItem, radios display, positionInput…)
    expect(panel.wrapper.findAll('button').length).toBeGreaterThan(0)
    const vueWarnings = [...warn.mock.calls, ...error.mock.calls].map((c) =>
      String(c[0]),
    )
    expect(vueWarnings.filter((m) => /\[Vue warn\]/.test(m))).toEqual([])
    warn.mockRestore()
    error.mockRestore()
  })
})
