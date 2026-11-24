// Phase 7.3 — a11y (V8, cible 0) : axe-core sur le playground Vue complet —
// vue FORMIVUEDESIGN (studio assemblé comme main.ts : sources, canvas Form avec
// champs déposés, panneau de propriétés rempli) puis vue PREVIEW (bindings
// réelles de la carte Materials). Recette fork/vue-ui : Axe.run(document.body)
// + filtre des violations à nœuds réels ; le fond masqué par les modals reka
// est rendu inert au niveau APP (note 6.7 — useInertBackground dans app.ts,
// ici simplement hérité du montage réel de l'App).
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { TreeNode } from '@formivue-design/core'
import { App } from '../app'
import {
  AdvancedDesignerComponents,
  AdvancedSources,
} from '@formivue-design/shadcn-advanced-designer'
import {
  AdvancedMaterials,
  AdvancedPreviewFrame,
} from '@formivue-design/shadcn-advanced-runtime'
import {
  ChartDesignerComponents,
  ChartSettingsComponents,
  ChartSources,
} from '@formivue-design/charts-designer'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import { createDocumentContractRegistry } from '@formivue-design/formivue-transformer'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'

// le loader monaco n'est pas consommé sur les vues auditées (JSONTREE/MARKUP
// hors périmètre) — mais le module s'importe au chargement d'app : mock pour
// garantir qu'aucun init CDN ne parte en jsdom (leçon phase 6 : le mock
// exige que le module soit résoluble depuis le package testé —
// @monaco-editor/loader est dep de vue-settings-form, le consommateur).
vi.mock('@monaco-editor/loader', () => ({
  default: {
    init: vi.fn(() => Promise.resolve({ editor: {}, languages: {} })),
    config: vi.fn(),
  },
}))

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms))

const mounted: any[] = []
afterEach(() => {
  while (mounted.length) {
    const { wrapper, engine } = mounted.pop()
    try {
      wrapper?.unmount()
    } catch {}
    try {
      engine?.unmount()
    } catch {}
  }
  document.body.innerHTML = ''
  localStorage.removeItem('formivue-vue-schema')
  localStorage.removeItem('formivue-vue-schema-advanced')
})

const runAxe = async () => {
  const { default: Axe } = await import('axe-core')
  // sémantique modale applicative (note 6.7) : reka masque les fonds des
  // dialogs par aria-hidden sans inert — l'App l'applique (useInertBackground)
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
          nodes: v.nodes.length,
          html: v.nodes.map(
            (n: any) => (n.html || '') + ' ||TARGET:' + (n.target?.[0] || ''),
          ),
        })),
        null,
        2,
      ),
    )
  }
  expect(real).toEqual([])
}

describe('playground formivue-vue — a11y (V8)', () => {
  beforeAll(() => {
    // #root attendu par useInertBackground + montage de l'App
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)
  })

  test('the sidebar opens the data model in place of the component palette', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    mounted.push({ wrapper, engine: (globalThis as any).engine })
    const modelTab = wrapper.get('button[role="tab"]:last-child')
    expect(modelTab.text()).toBe('Data model')
    expect(wrapper.find('[data-designer-source-id]').exists()).toBe(true)

    await modelTab.trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('.data-model-view').exists()).toBe(true),
    )
    expect(modelTab.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('.dn-composite-panel-tabs-content').exists()).toBe(
      false,
    )

    const workspaceButton = (label: string) =>
      wrapper
        .findAll('.dn-workspace-panel button')
        .find((button) => button.text() === label)!
    await workspaceButton('JSON documents').trigger('click')
    await vi.waitFor(() =>
      expect(workspaceButton('Back to data model')).toBeDefined(),
    )
    await workspaceButton('Back to data model').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('.data-model-view').exists()).toBe(true),
    )
    expect(modelTab.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[data-designer-source-id]').exists()).toBe(false)

    await modelTab.trigger('click')
    await wrapper.get('button[role="tab"]:first-child').trigger('click')
    expect(wrapper.find('.data-model-view').exists()).toBe(false)
    expect(wrapper.find('.dn-viewport').exists()).toBe(true)
    expect(wrapper.find('[data-designer-source-id]').exists()).toBe(true)
  })

  test('vue FORMIVUEDESIGN : studio complet + champs déposés + panneau rempli = 0 violation', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    mounted.push({ wrapper })
    await delay(150)

    // champs réels dans le canvas (même forme que les resources déposées au
    // M1) : Field/Input décoré FormItem, conteneur Card, Select, DatePicker —
    // le panneau de propriétés exige une sélection pour se remplir
    const engine = (globalThis as any).engine
    const workspace = engine.workbench.ensureWorkspace({ id: 'form' })
    const tree = workspace.operation.tree
    tree.append(
      new TreeNode({
        id: 'fld-name',
        componentName: 'Field',
        props: {
          type: 'string',
          title: 'Customer Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      }),
      new TreeNode({
        id: 'card-1',
        componentName: 'Field',
        props: { type: 'void', 'x-component': 'Card', title: 'Card' },
        children: [
          new TreeNode({
            id: 'fld-date',
            componentName: 'Field',
            props: {
              type: 'string',
              title: 'Date',
              'x-decorator': 'FormItem',
              'x-component': 'DatePicker',
              'x-component-props': {
                placeholder: 'Select a delivery date',
                showTime: true,
              },
            },
          }),
        ],
      }),
    )
    workspace.operation.selection.select('fld-name')
    await delay(600)

    expect(
      wrapper
        .get('nav[aria-label="Designer mode"] [aria-current="page"]')
        .text(),
    ).toBe('Standard')
    expect(wrapper.text()).not.toContain('Advanced inputs')
    expect(document.querySelector('.dn-viewport')).toBeTruthy()
    expect(document.querySelector('.dn-settings-panel')).toBeTruthy()
    expect(
      document.querySelectorAll('[data-designer-source-id]').length,
    ).toBeGreaterThan(10)
    expect(wrapper.get('.dn-viewport [data-slot="date-picker"]').text()).toBe(
      'Select a delivery date',
    )
    expect(
      wrapper
        .get('.dn-viewport [data-slot="date-picker-field"] input[type="time"]')
        .attributes('disabled'),
    ).toBeDefined()
    await runAxe()

    // vue PREVIEW : bindings réelles (panneau + canvas coupés par le
    // workbench.type — réaction observée, pas supposée)
    const previewBtn = document
      .querySelector('[aria-label="Preview"]')
      ?.closest('button')
    ;(previewBtn as HTMLElement)?.click()
    await delay(600)
    await nextTick()
    expect((globalThis as any).engine.workbench.type).toBe('PREVIEW')
    expect(document.querySelector('.dn-settings-panel')).toBeNull()
    expect(document.querySelector('.dn-viewport')).toBeNull()
    await wrapper.get('[data-slot="date-picker"]').trigger('click')
    await nextTick()
    expect(document.querySelector('[data-slot="calendar-grid"]')).toBeTruthy()
    await runAxe()

    engine.workbench.setWorkbenchType('JSONTREE')
    const documents = 'select[aria-label="JSON document"]'
    await vi.waitFor(() => expect(wrapper.find(documents).exists()).toBe(true))
    await wrapper.get(documents).setValue('data')
    await wrapper
      .get('textarea[aria-label="data.json"]')
      .setValue(JSON.stringify({ 'fld-name': 'Imported customer' }))
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Apply to preview')
      .trigger('click')
    await runAxe()
    engine.workbench.setWorkbenchType('PREVIEW')
    await vi.waitFor(() => {
      expect(
        wrapper
          .findAll('input')
          .some((input) => input.element.value === 'Imported customer'),
      ).toBe(true)
    })

    wrapper.unmount()
    engine.unmount()
  }, 30000)

  test('advanced palette, editable steps and preview share the same materials', async () => {
    const wrapper = mount(App, {
      attachTo: document.body,
      props: {
        advanced: {
          components: {
            ...AdvancedDesignerComponents,
            ...ChartDesignerComponents,
          },
          settings: ChartSettingsComponents,
          chartSources: ChartSources,
          materials: { ...AdvancedMaterials, ...ChartMaterials },
          previewFrame: AdvancedPreviewFrame,
          sources: AdvancedSources,
          documentContracts: createDocumentContractRegistry([
            advancedDocumentContracts,
            chartDocumentContracts,
          ]),
        },
      },
    })
    const engine = (globalThis as any).engine
    mounted.push({ wrapper, engine })
    await delay(150)
    expect(
      wrapper
        .get('nav[aria-label="Designer mode"] [aria-current="page"]')
        .text(),
    ).toBe('Advanced')
    expect(wrapper.text()).toContain('Advanced inputs')
    expect(wrapper.text()).toContain('Questionnaire')
    const advancedTiles = wrapper.findAll(
      '.dn-advanced-resource [data-designer-source-id]',
    )
    expect(advancedTiles).toHaveLength(15)
    const chartTiles = wrapper.findAll(
      '.dn-chart-resource [data-designer-source-id]',
    )
    expect(chartTiles).toHaveLength(20)
    expect(chartTiles.some((tile) => tile.text() === 'Sankey')).toBe(true)
    expect(
      advancedTiles.every((tile) =>
        tile.find('svg[aria-hidden="true"]').exists(),
      ),
    ).toBe(true)
    const paletteLabels = wrapper
      .findAll('[data-designer-source-id]')
      .map((source) => source.text())
    for (const name of ['Accordion', 'Collapse', 'Progress', 'Alert']) {
      expect(paletteLabels).not.toContain(name)
    }

    const tree = engine.workbench.ensureWorkspace({ id: 'form' }).operation.tree
    const [resource] = AdvancedDesignerComponents.Questionnaire.Resource
    const [questionnaire] = tree.append(resource.node.children[0])
    await delay(100)
    const canvas = wrapper.get('.dn-viewport')
    expect(canvas.text()).toContain('Question 1')
    const firstStepId = questionnaire.children[0].id
    expect(
      canvas.findAll(`[data-designer-node-id="${firstStepId}"]`),
    ).toHaveLength(1)
    await canvas
      .findAll('button')
      .find((button) => button.text() === '+ Question')
      .trigger('click')
    expect(questionnaire.children).toHaveLength(2)
    questionnaire.children[0].append(
      new TreeNode({
        componentName: 'Field',
        props: {
          name: 'tags',
          type: 'array',
          title: 'Keywords',
          'x-decorator': 'FormItem',
          'x-component': 'TagsInput',
        },
      }),
    )
    await delay(100)
    expect(canvas.find('input[aria-label="Keywords"]').exists()).toBe(true)
    await runAxe()

    await wrapper.get('[aria-label="Preview"]').trigger('click')
    await delay(200)
    expect(engine.workbench.type).toBe('PREVIEW')
    const field = wrapper.get('input[aria-label="Keywords"]')
    await field.setValue('alpha')
    await field.trigger('keydown', { key: 'Enter' })
    expect(wrapper.text()).toContain('alpha')
    await runAxe()
  }, 30000)
})
