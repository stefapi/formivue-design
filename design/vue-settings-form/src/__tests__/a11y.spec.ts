// Phase 5.2 (V8) — a11y : axe-core sur le panneau de settings monté
// (état vide + état rempli : schéma CSSStyle complet → les 9 setters).
// Règle 7 du plan : a11y = correction, pas constat — cible 0.
// Recette vue-ui a11y.spec : Axe.run(document.body) + violations à nœuds
// réels ; le landmark `main` est fourni par l'app réelle (StudioPanel 6.4).
// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  createBehavior,
  createDesigner,
  GlobalRegistry,
  TreeNode,
} from '@formivue-design/core'
import { Designer } from '@formivue-design/vue'
import { AllSchemas } from '@formivue-design/formivue-vue'
import { SettingsForm } from '../index'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const runAxe = async () => {
  const { default: Axe } = await import('axe-core')
  const results = await new Promise<any>((resolve, reject) => {
    Axe.run(document.body, {}, (err: unknown, r: unknown) =>
      err ? reject(err) : resolve(r),
    )
  })
  const violations = results.violations as Array<{
    id: string
    nodes: unknown[]
  }>
  const real = violations.filter((v) => v.nodes.length > 0)
  if (real.length > 0) {
    console.error(
      'violations axe :',
      JSON.stringify(
        real.map((v) => ({
          id: v.id,
          nodes: (v.nodes as any[]).slice(0, 4).map((n) => ({
            html: String(n.html ?? '').slice(0, 160),
            target: n.target,
          })),
        })),
        null,
        1,
      ),
    )
  }
  return real
}

let seed = 5000

const engineWithSchema = (propsSchema: any, nodeProps: any = {}) => {
  const name = `A11yField-${seed++}`
  // host { Behavior } — la forme attendue par le registre (un tableau nu est
  // ignoré silencieusement — piège documenté au suivi)
  GlobalRegistry.registerDesignerBehaviors([
    {
      Behavior: createBehavior({
        name,
        selector: (node: any) => node.componentName === name,
        designerProps: { propsSchema },
        designerLocales: {
          'en-US': {
            settings: {
              title: { title: 'Title' },
              required: { title: 'Required' },
              // tokens CSSStyle (recette locales Component.ts du fork) —
              // les titres des setters de style en dépendent (useLocales)
              style: {
                width: 'Width',
                height: 'Height',
                display: 'Display',
                background: 'Background',
                boxShadow: 'Box Shadow',
                font: 'Font',
                margin: 'Margin',
                padding: 'Padding',
                borderRadius: 'Radius',
                border: 'Border',
                opacity: 'Opacity',
              },
            },
          },
        },
      }),
    } as any,
  ])
  const engine = createDesigner()
  engine.workbench.ensureWorkspace()
  const tree = engine.workbench.currentWorkspace.operation.tree
  const node = new TreeNode({
    id: 'a11y-node',
    componentName: name,
    props: nodeProps,
  })
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
  document.body.innerHTML = ''
})

describe('@formivue-design/vue-settings-form — a11y (axe, cible 0)', () => {
  test('panneau vide : 0 violation', async () => {
    document.title = 'settings a11y'
    document.documentElement.lang = 'en'
    const { engine } = engineWithSchema({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h(
              Designer as any,
              { engine },
              {
                default: () => h(SettingsForm as any),
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    mounted.push({ wrapper, engine })
    await nextTick()
    await delay(600)
    expect((await runAxe()).map((v) => v.id)).toEqual([])
  })

  test('panneau rempli (CSSStyle, 9 setters + FoldItem) : 0 violation', async () => {
    document.title = 'settings a11y'
    document.documentElement.lang = 'en'
    const { engine, node } = engineWithSchema(
      {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          required: {
            type: 'boolean',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
          ...AllSchemas.CSSStyle.properties,
        },
      },
      { style: { margin: '4px 8px', display: 'flex' } },
    )
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('main', [
            h(
              Designer as any,
              { engine },
              {
                default: () => h(SettingsForm as any),
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    mounted.push({ wrapper, engine })
    engine.workbench.currentWorkspace.operation.selection.select(node)
    await nextTick()
    await delay(650)
    // le panneau rend bien des éditeurs avant l'audit
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
    expect((await runAxe()).map((v) => v.id)).toEqual([])
  })
})
