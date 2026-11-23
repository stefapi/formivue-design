import {
  createDesigner,
  GlobalRegistry,
  TreeNode,
  type ITreeNode,
} from '@formivue-design/core'
import { transformToSchema } from '@formivue-design/formivue-transformer'
import {
  ArrayTable,
  Field,
  Form,
  Input,
  NumberPicker,
  Text,
} from '@formivue-design/formivue-vue'
import {
  DataSourceSetter,
  ReactionsSetter,
  ValidatorSetter,
} from '@formivue-design/formivue-setters'
import {
  AdvancedDesignerComponents,
  AdvancedSchemas,
} from '@formivue-design/shadcn-advanced-designer'
import {
  AdvancedMaterials,
  AdvancedPreviewFrame,
} from '@formivue-design/shadcn-advanced-runtime'
import {
  ComponentTreeWidget,
  Designer,
  ViewPanel,
  Workspace,
} from '@formivue-design/vue'
import { SettingsForm } from '@formivue-design/vue-settings-form'
import {
  ChartDesignerComponents,
  ChartDesignerLocale,
  ChartLocales,
  ChartSchemas,
  ChartSettingsComponents,
} from '@formivue-design/charts-designer'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import {
  DOMWrapper,
  flushPromises,
  mount,
  type VueWrapper,
} from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, type VNode } from 'vue'
import { PreviewWidget } from '../widgets/PreviewWidget'
import { SchemaEditorWidget } from '../widgets/SchemaEditorWidget'

// Keep the real expression editor, parser and commit path. Replace Monaco's
// browser adapter from vue-settings-form so the test can type in jsdom.
vi.mock(
  '../../../../design/vue-settings-form/node_modules/@monaco-editor/loader',
  () => ({
    default: {
      config: vi.fn(),
      init: async () => ({
        editor: {
          create: (host: HTMLElement, options: { value: string }) => {
            const input = document.createElement('textarea')
            input.setAttribute('data-monaco-test-input', '')
            input.value = options.value
            host.append(input)
            return {
              getModel: () => ({}),
              getValue: () => input.value,
              setValue: (value: string) => {
                input.value = value
              },
              onDidChangeModelContent: (change: () => void) =>
                input.addEventListener('input', change),
              deltaDecorations: () => [],
              dispose: () => input.remove(),
            }
          },
          defineTheme: vi.fn(),
          setModelMarkers: vi.fn(),
        },
        languages: {
          typescript: {
            typescriptDefaults: {
              setCompilerOptions: vi.fn(),
              setDiagnosticsOptions: vi.fn(),
            },
            ScriptTarget: {},
            ModuleResolutionKind: {},
            ModuleKind: {},
            JsxEmit: {},
          },
          registerDocumentFormattingEditProvider: vi.fn(),
        },
        Range: class {},
      }),
    },
  }),
)

const designerComponents = {
  ...AdvancedDesignerComponents,
  ...ChartDesignerComponents,
}
const schemas = { ...AdvancedSchemas, ...ChartSchemas }
const materials = { ...AdvancedMaterials, ...ChartMaterials }
type Name = keyof typeof schemas
type Values = Record<string, unknown>

let cleanups: (() => void)[]
beforeEach(() => {
  cleanups = []
  GlobalRegistry.setDesignerLanguage('en-us')
  GlobalRegistry.registerDesignerBehaviors({
    ArrayTable,
    Field,
    ...designerComponents,
  })
})
afterEach(() => {
  for (const cleanup of cleanups.reverse()) cleanup()
})

function designerFor(
  name: Name,
  setup?: (node: TreeNode, root: TreeNode) => void,
) {
  const engine = createDesigner({ rootComponentName: 'Form' })
  const { operation } = engine.workbench.ensureWorkspace({
    id: 'advanced-settings',
  })
  const root = operation.tree
  const [node] = root.append(
    designerComponents[name].Resource[0].node.children[0],
  )
  setup?.(node, root)
  const designer = mount(
    defineComponent({
      setup: () => () =>
        h(ChartDesignerLocale, null, () =>
          h(Designer, { engine }, () =>
            h(Workspace, { id: 'advanced-settings' }, () => [
              h(ViewPanel, { type: 'FORMIVUEDESIGN' }, () =>
                h(ComponentTreeWidget, {
                  components: {
                    Form,
                    Field,
                    ArrayTable,
                    Text,
                    Input,
                    NumberPicker,
                    ...designerComponents,
                  },
                }),
              ),
              h(
                ViewPanel,
                { type: 'JSONTREE', scrollable: false },
                {
                  default: ({
                    tree,
                    onChange,
                  }: {
                    tree: TreeNode
                    onChange: (tree: ITreeNode) => void
                  }) => h(SchemaEditorWidget, { tree, onChange }),
                },
              ),
              h(
                ViewPanel,
                { type: 'PREVIEW', scrollable: false },
                {
                  default: ({ tree }: { tree: TreeNode }) =>
                    h(PreviewWidget, {
                      tree,
                      materials,
                      frame: AdvancedPreviewFrame,
                    }),
                },
              ),
              h(SettingsForm, {
                components: {
                  DataSourceSetter,
                  ReactionsSetter,
                  ValidatorSetter,
                  ...ChartSettingsComponents,
                },
              }),
            ]),
          ),
        ),
    }),
    { attachTo: document.body },
  )
  cleanups.push(() => {
    designer.unmount()
    engine.unmount()
  })
  return { designer, engine, node, operation, root }
}

async function selectSetting(item: DOMWrapper<Element>, label: string) {
  await item.get('[role="combobox"]').trigger('pointerdown')
  await flushPromises()
  const option = [...document.body.querySelectorAll('[role="option"]')].find(
    (entry) => entry.textContent?.trim().toLowerCase() === label.toLowerCase(),
  )
  expect(option, `Option ${label}`).toBeDefined()
  option.dispatchEvent(new PointerEvent('pointerdown'))
  option.dispatchEvent(new PointerEvent('pointerup'))
  await flushPromises()
}

async function editSettings(
  studio: ReturnType<typeof designerFor>,
  node: TreeNode,
  name: Name,
  values: Values,
  partial = false,
) {
  const schema = schemas[name].properties
  expect(node.props['x-component']).toBe(name)
  if (!partial)
    expect(Object.keys(values).sort()).toEqual(Object.keys(schema).sort())
  studio.engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
  studio.operation.selection.select(node.id)
  for (const [key, value] of Object.entries(values)) {
    const path = `x-component-props.${key}`
    const definition = schema[key]
    const selector = `label[for$="${path}"]`
    await vi.waitFor(() =>
      expect(studio.designer.find(selector).exists(), path).toBe(true),
    )
    const item = new DOMWrapper(
      studio.designer.get(selector).element.closest('[data-slot="form-item"]'),
    )
    if (definition['x-component'] === 'Switch') {
      const toggle = item.get('[role="switch"]')
      if ((toggle.attributes('aria-checked') === 'true') !== value)
        await toggle.trigger('click')
    } else if (definition['x-component'] === 'Select') {
      const localized =
        ChartLocales[name as keyof typeof ChartLocales]?.['en-US'].settings[
          'x-component-props'
        ][key]
      const option =
        typeof localized === 'object'
          ? localized.dataSource?.[definition.enum?.indexOf(value)]
          : undefined
      await selectSetting(item, option ?? String(value))
    } else if (
      definition['x-component-props']?.include?.includes('EXPRESSION') &&
      typeof value === 'string' &&
      value.startsWith('{{')
    ) {
      const trigger = item.get('.dn-poly-input-content button')
      await trigger.trigger('click')
      expect(trigger.attributes('aria-expanded'), trigger.html()).toBe('true')
      await vi.waitFor(() =>
        expect(
          document.querySelector('[data-monaco-test-input]'),
        ).not.toBeNull(),
      )
      const editor = new DOMWrapper(
        document.querySelector<HTMLTextAreaElement>('[data-monaco-test-input]'),
      )
      await editor.setValue(value.slice(2, -2))
      await vi.waitFor(
        () => expect(node.props['x-component-props'][key]).toBe(value),
        { timeout: 2500 },
      )
      await editor.trigger('keydown', { key: 'Escape' })
    } else if (definition.type === 'array') {
      if (!item.find('textarea').exists()) {
        await item.get('.dn-poly-input-controller').trigger('click')
        await nextTick()
      }
      await item.get('textarea').setValue(JSON.stringify(value))
    } else if (typeof value === 'number') {
      const input = item.get('input')
      await input.setValue(String(value))
      await input.trigger('blur')
    } else {
      await item.get('input, textarea').setValue(value)
    }
    expect(node.props['x-component-props'][key], `${name}.${key}`).toEqual(
      value,
    )
  }
}

async function previewAfterImport(studio: ReturnType<typeof designerFor>) {
  const { designer, engine, root } = studio
  engine.workbench.setWorkbenchType('JSONTREE')
  await vi.waitFor(() =>
    expect(designer.find('[data-monaco-test-input]').exists()).toBe(true),
  )
  const editor = designer
    .getComponent(SchemaEditorWidget)
    .get<HTMLTextAreaElement>('[data-monaco-test-input]')
  const exported = editor.element.value
  expect(JSON.parse(exported)).toEqual(
    JSON.parse(JSON.stringify(transformToSchema(root))),
  )

  engine.setCurrentTree({ componentName: 'Form', id: root.id, children: [] })
  await nextTick()
  expect(root.children).toHaveLength(0)
  await editor.setValue(exported)
  await vi.waitFor(
    () =>
      expect(JSON.parse(JSON.stringify(transformToSchema(root)))).toEqual(
        JSON.parse(exported),
      ),
    { timeout: 2500 },
  )

  engine.workbench.setWorkbenchType('PREVIEW')
  await vi.waitFor(() =>
    expect(designer.findComponent(PreviewWidget).exists()).toBe(true),
  )
  return designer.findComponent(PreviewWidget)
}

function button(view: VueWrapper, label: string) {
  const match = view.findAll('button').find((entry) => entry.text() === label)
  expect(match, label).toBeDefined()
  return match
}

function child(
  name: string,
  component: string,
  fields: ITreeNode['props'] = {},
) {
  return new TreeNode({
    componentName: 'Field',
    props: { type: 'void', name, 'x-component': component, ...fields },
  })
}

function measureChartInJsdom() {
  const svg = SVGElement.prototype
  const measurements = {
    getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
    getTotalLength: () => 100,
    getPointAtLength: (length: number) => ({ x: length, y: 0 }),
    getComputedTextLength(this: SVGElement) {
      return (this.textContent?.length ?? 0) * 6
    },
  }
  for (const size of ['width', 'height']) {
    const svgRoot = SVGSVGElement.prototype
    if (Object.getOwnPropertyDescriptor(svgRoot, size)) continue
    Object.defineProperty(svgRoot, size, {
      configurable: true,
      get(this: SVGSVGElement) {
        return { baseVal: { value: Number(this.getAttribute(size)) } }
      },
    })
    cleanups.push(() => Reflect.deleteProperty(svgRoot, size))
  }
  for (const [key, value] of Object.entries(measurements)) {
    const original = Object.getOwnPropertyDescriptor(svg, key)
    Object.defineProperty(svg, key, { value, configurable: true })
    cleanups.push(() => {
      if (original) Object.defineProperty(svg, key, original)
      else Reflect.deleteProperty(svg, key)
    })
  }
  const getRect = HTMLElement.prototype.getBoundingClientRect
  const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
  bounds.mockImplementation(function (this: HTMLElement) {
    return this.matches('[data-vis-xy-container], [data-vis-single-container]')
      ? new DOMRect(0, 0, 480, 240)
      : getRect.call(this)
  })
  cleanups.push(() => bounds.mockRestore())
}

function appendSalesTable(
  root: TreeNode,
  rows: Record<string, string | number | null>[],
  columns: Record<string, { title: string; type: 'string' | 'number' }>,
) {
  const table = child('sales', 'ArrayTable', {
    type: 'array',
    title: 'Sales',
    default: rows,
  })
  const row = new TreeNode({
    componentName: 'Field',
    props: { type: 'object' },
  })
  for (const [key, { title, type }] of Object.entries(columns)) {
    const column = child(`${key}Column`, 'ArrayTable.Column', {
      'x-component-props': { title },
    })
    column.append(
      child(key, type === 'string' ? 'Input' : 'NumberPicker', { type, title }),
    )
    row.append(column)
  }
  const actions = child('actions', 'ArrayTable.Column', {
    'x-component-props': { title: 'Actions' },
  })
  actions.append(
    child('up', 'ArrayTable.MoveUp'),
    child('remove', 'ArrayTable.Remove'),
  )
  row.append(actions)
  table.append(row)
  root.append(table)
  return table
}

describe('advanced settings through the designer and JSON preview', () => {
  test('Avatar edits its image URL, alternative text, size and fallback', async () => {
    const studio = designerFor('Avatar')
    await editSettings(studio, studio.node, 'Avatar', {
      src: '/edited-avatar.png',
      alt: 'Edited profile',
      fallback: 'EP',
      size: 52,
    })
    const view = await previewAfterImport(studio)
    const avatar = view.get('[role="img"][aria-label="Edited profile"]')
    expect((avatar.element as HTMLElement).style.width).toBe('52px')
    expect((avatar.element as HTMLElement).style.height).toBe('52px')
    expect(avatar.get('img').attributes('src')).toBe('/edited-avatar.png')
    expect(avatar.text()).toContain('EP')
  })

  test('Badge edits text and variant', async () => {
    const studio = designerFor('Badge')
    await editSettings(studio, studio.node, 'Badge', {
      text: 'Edited badge',
      variant: 'outline',
    })
    const view = await previewAfterImport(studio)
    const badge = view.getComponent(AdvancedMaterials.Badge)
    expect(badge.text()).toBe('Edited badge')
    expect(badge.classes()).toContain('text-foreground')
  })

  test('Combobox edits the input hint and the empty result message', async () => {
    const studio = designerFor('Combobox')
    await editSettings(studio, studio.node, 'Combobox', {
      placeholder: 'Find an entry',
      emptyText: 'Nothing matched',
    })
    const view = await previewAfterImport(studio)
    await view
      .get('input[placeholder="Find an entry"]')
      .setValue('no such entry')
    await flushPromises()
    expect(view.text()).toContain('Nothing matched')
  })

  test('Tags Input edits its input hint, maximum and delimiter', async () => {
    const studio = designerFor('TagsInput')
    await editSettings(studio, studio.node, 'TagsInput', {
      placeholder: 'Type a keyword',
      max: 2,
      delimiter: ';',
    })
    const view = await previewAfterImport(studio)
    const input = view.get<HTMLInputElement>(
      'input[placeholder="Type a keyword"]',
    )
    for (const text of ['one', 'two', 'three']) {
      input.element.value = text + ';'
      input.element.dispatchEvent(
        new InputEvent('input', { data: ';', bubbles: true }),
      )
      await flushPromises()
    }
    expect(view.text()).toContain('one')
    expect(view.text()).toContain('two')
    expect(view.text()).not.toContain('three')
  })

  test('Input OTP edits its number of slots and masks them', async () => {
    const studio = designerFor('InputOTP')
    await editSettings(studio, studio.node, 'InputOTP', {
      length: 4,
      mask: true,
    })
    const view = await previewAfterImport(studio)
    expect(view.findAll('input[type="password"][aria-label]')).toHaveLength(4)
  })

  test('Toggle Group enables editing multiple selected options', async () => {
    const studio = designerFor('ToggleGroup')
    await editSettings(studio, studio.node, 'ToggleGroup', { multiple: true })
    expect(studio.node.props.type).toBe('array')
    const view = await previewAfterImport(studio)
    const choices = view.findAll('button[aria-pressed]')
    expect(choices).toHaveLength(2)
    await choices[0].trigger('click')
    await choices[1].trigger('click')
    expect(choices.map((item) => item.attributes('aria-pressed'))).toEqual([
      'true',
      'true',
    ])
  })

  test('Hover Card edits trigger text, link, title and message', async () => {
    const studio = designerFor('HoverCard')
    await editSettings(studio, studio.node, 'HoverCard', {
      triggerText: 'Show edited details',
      title: 'Information card',
      message: 'Edited card body',
      href: '/edited-details',
    })
    const view = await previewAfterImport(studio)
    const trigger = view.get('a[href="/edited-details"]')
    expect(trigger.text()).toBe('Show edited details')
    await trigger.trigger('focus')
    await vi.waitFor(() => {
      expect(view.text()).toContain('Information card')
      expect(view.text()).toContain('Edited card body')
    })
  })

  test('Hover Card opens its details before following a link on touchscreens', async () => {
    const matchMedia = window.matchMedia.bind(window)
    const media = vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const result = matchMedia(query)
      if (query === '(pointer: coarse)')
        Object.defineProperty(result, 'matches', { value: true })
      return result
    })
    cleanups.push(() => media.mockRestore())
    const studio = designerFor('HoverCard')
    await editSettings(studio, studio.node, 'HoverCard', {
      triggerText: 'View details',
      title: 'Touch details',
      message: 'Edited touch content',
      href: '/touch-details',
    })
    const view = await previewAfterImport(studio)
    expect(view.find('a[href="/touch-details"]').exists()).toBe(false)
    await button(view, 'View details').trigger('click')
    await vi.waitFor(() => {
      const details = view.get('[role="dialog"][aria-label="Touch details"]')
      expect(details.text()).toContain('Edited touch content')
      expect(details.get('a[href="/touch-details"]').text()).toBe(
        'View details',
      )
    })
  })

  test('Data Table edits its columns, rows, row keys, controls and messages', async () => {
    const studio = designerFor('DataTable')
    await editSettings(
      studio,
      studio.node,
      'DataTable',
      { searchable: false },
      true,
    )
    const withoutSearch = await previewAfterImport(studio)
    expect(withoutSearch.find('input[type="search"]').exists()).toBe(false)
    await editSettings(studio, studio.root.children[0], 'DataTable', {
      columns: [{ key: 'city', title: 'Edited city', sortable: false }],
      rows: [
        { recordId: 'r1', city: 'Annecy' },
        { recordId: 'r2', city: 'Brest' },
      ],
      rowKey: 'recordId',
      pageSize: 1,
      searchable: true,
      label: 'Edited results',
      previousText: 'Earlier results',
      nextText: 'More results',
      searchLabel: 'Filter by city',
      emptyText: 'No edited results',
    })
    const view = await previewAfterImport(studio)
    expect(view.get('table[aria-label="Edited results"] th').text()).toBe(
      'Edited city',
    )
    expect(view.find('th button').exists()).toBe(false)
    expect(view.findAll('tbody tr')).toHaveLength(1)
    const first = view.get('tbody tr')
    expect(first.text()).toBe('Annecy')
    expect(
      (first.element as HTMLElement & { __vnode: VNode }).__vnode.key,
    ).toBe('r1')
    expect(button(view, 'Earlier results').attributes('disabled')).toBeDefined()
    await button(view, 'More results').trigger('click')
    expect(view.get('tbody').text()).toBe('Brest')
    await button(view, 'Earlier results').trigger('click')
    expect(view.get('tbody').text()).toBe('Annecy')
    await view
      .get('input[aria-label="Filter by city"]')
      .setValue('missing city')
    expect(view.get('tbody').text()).toBe('No edited results')
  })

  test('Chart defaults are visible and translate on the canvas and after JSON import', async () => {
    measureChartInJsdom()
    GlobalRegistry.setDesignerLanguage('fr-fr')
    const studio = designerFor('SankeyChart')
    const { designer, node, operation } = studio
    operation.selection.select(node.id)
    const input = (key: string) =>
      designer.get<HTMLInputElement>(`input[id$="x-component-props.${key}"]`)
    await vi.waitFor(() => {
      expect(input('height').attributes('placeholder')).toBe('240')
      expect(input('nodeWidth').attributes('placeholder')).toBe('25')
      expect(input('nodePadding').attributes('placeholder')).toBe('2')
      expect(input('dataLabel').attributes('placeholder')).toBe(
        'Données du graphique',
      )
      expect(designer.get('figure summary').text()).toBe('Données du graphique')
    })
    expect(input('nodePadding').element.value).toBe('')
    expect(node.props['x-component-props']).not.toHaveProperty('nodePadding')
    await editSettings(studio, node, 'SankeyChart', { nodePadding: 6 }, true)
    await input('nodePadding').setValue('')
    await input('nodePadding').trigger('blur')
    expect(input('nodePadding').element.value).toBe('')
    expect(input('nodePadding').attributes('placeholder')).toBe('2')

    const view = await previewAfterImport(studio)
    await vi.waitFor(() =>
      expect(view.get('figure summary').text()).toBe('Données du graphique'),
    )
    GlobalRegistry.setDesignerLanguage('es-es')
    await vi.waitFor(() =>
      expect(view.get('figure summary').text()).toBe('Datos del gráfico'),
    )
  })

  test('Automatic chart titles follow the designer language and custom titles are kept', async () => {
    measureChartInJsdom()
    GlobalRegistry.setDesignerLanguage('fr-fr')
    const studio = designerFor('DonutChart')
    const { designer, node } = studio
    expect(designer.get('figure figcaption').text()).toBe('Anneau')
    GlobalRegistry.setDesignerLanguage('es-es')
    await vi.waitFor(() =>
      expect(designer.get('figure figcaption').text()).toBe('Anillo'),
    )

    await editSettings(
      studio,
      node,
      'DonutChart',
      { label: 'Ventes par secteur' },
      true,
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() =>
      expect(view.get('figure figcaption').text()).toBe('Ventes par secteur'),
    )
    GlobalRegistry.setDesignerLanguage('en-us')
    await vi.waitFor(() =>
      expect(view.get('figure summary').text()).toBe('Chart data'),
    )
    expect(view.get('figure figcaption').text()).toBe('Ventes par secteur')
  })

  test('Mapping diagnostics spot a deleted ArrayTable column and recover after JSON import', async () => {
    measureChartInJsdom()
    let tableNode: TreeNode
    const studio = designerFor('ScatterChart', (node, root) => {
      tableNode = appendSalesTable(
        root,
        [
          { period: 1, amount: 5, target: 8 },
          { period: 2, amount: 6, target: null },
          { period: 3, amount: 7, target: 12 },
        ],
        {
          period: { title: 'Period', type: 'number' },
          amount: { title: 'Amount', type: 'number' },
          target: { title: 'Target', type: 'number' },
        },
      )
      Object.assign(node.props['x-component-props'], {
        rows: '{{ $form.getValuesIn(["sales"]) }}',
        xKey: 'period',
        valueKey: 'amount',
      })
    })
    const { designer, node, operation } = studio
    const status = '[aria-label="Mapping diagnostics"]'
    operation.selection.select(node.id)
    await vi.waitFor(() =>
      expect(designer.find('figure svg').exists()).toBe(true),
    )
    expect(designer.find(status).exists()).toBe(false)

    tableNode.find((field) => field.props.name === 'amountColumn').remove()
    await vi.waitFor(() =>
      expect(designer.get(status).text()).toContain(
        'Columns not found — amount',
      ),
    )
    expect(designer.find('datalist option[value="amount"]').exists()).toBe(
      false,
    )

    await editSettings(
      studio,
      node,
      'ScatterChart',
      { valueKey: 'target' },
      true,
    )
    await vi.waitFor(() => {
      const diagnostic = designer.get(status).text()
      expect(diagnostic).not.toContain('Columns not found')
      expect(diagnostic).toContain('Rows ignored by the chart (1 of 3)')
      expect(diagnostic).toContain('Row 2 · target (–) · Expected a number')
      expect(designer.findAll('figure tbody tr')).toHaveLength(2)
    })

    const view = await previewAfterImport(studio)
    const plotted = () =>
      view
        .findAll('figure tbody tr')
        .map((row) => row.findAll('td').map((cell) => cell.text()))
    await vi.waitFor(() =>
      expect(plotted()).toEqual([
        ['1', '8'],
        ['3', '12'],
      ]),
    )
    const target = view
      .get('.dn-array-table')
      .findAll('tbody tr')[1]
      .get('td:nth-child(2) input[role="spinbutton"]')
    await target.setValue('10')
    await target.trigger('blur')
    await vi.waitFor(() =>
      expect(plotted()).toEqual([
        ['1', '8'],
        ['2', '10'],
        ['3', '12'],
      ]),
    )
    await vi.waitFor(() =>
      expect(view.findAll('figure svg g[class$="-point"]')).toHaveLength(3),
    )
  })

  test('Mapping diagnostics count every invalid JSON row and clear after the data is corrected', async () => {
    measureChartInJsdom()
    const valid = { task: 'Deployment', from: '2026-11-01', to: '2026-11-04' }
    const studio = designerFor('TimelineChart', (node) => {
      Object.assign(node.props['x-component-props'], {
        rows: [
          { ...valid, from: 'lundi' },
          { ...valid, to: '2026-10-30' },
          null,
          { ...valid, task: '' },
          valid,
        ],
        xKey: 'task',
        startKey: 'from',
        endKey: 'to',
      })
    })
    const { designer, node, operation } = studio
    const status = '[aria-label="Mapping diagnostics"]'
    operation.selection.select(node.id)
    await vi.waitFor(() => {
      const diagnostic = designer.get(status)
      expect(diagnostic.text()).toContain('Rows ignored by the chart (4 of 5)')
      expect(diagnostic.findAll('li').map((example) => example.text())).toEqual(
        [
          'Row 1 · from ("lundi") · Invalid date',
          'Row 2 · to ("2026-10-30") · End must be after start',
          'Row 3 · Expected a row object',
        ],
      )
      expect(designer.findAll('figure tbody tr')).toHaveLength(1)
    })

    await editSettings(
      studio,
      node,
      'TimelineChart',
      {
        rows: [
          {
            ...valid,
            task: 'Preparation',
            from: '2026-10-27',
            to: '2026-11-01',
          },
          valid,
        ],
      },
      true,
    )
    await vi.waitFor(() => {
      expect(designer.find(status).exists()).toBe(false)
      expect(designer.findAll('figure tbody tr')).toHaveLength(2)
    })
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      expect(
        view.findAll('figure tbody tr').map((row) => row.get('td').text()),
      ).toEqual(['Preparation', 'Deployment'])
      expect(view.find('figure svg').exists()).toBe(true)
    })
    studio.engine.workbench.setWorkbenchType('FORMIVUEDESIGN')
    operation.selection.select(studio.root.children[0].id)
    await vi.waitFor(() => {
      expect(
        designer.find('label[for$="x-component-props.rows"]').exists(),
      ).toBe(true)
      expect(designer.find(status).exists()).toBe(false)
    })
  })

  test('Chart maps an ArrayTable and follows edited, reordered and deleted rows after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('BarChart', (_, root) => {
      appendSalesTable(
        root,
        [
          { month: 'Jan', amount: 10, target: 20 },
          { month: 'Feb', amount: 0 },
          { month: 'Mar', amount: 30, target: 40 },
        ],
        {
          month: { title: 'Month', type: 'string' },
          amount: { title: 'Amount', type: 'number' },
          target: { title: 'Target', type: 'number' },
        },
      )
    })
    const { designer, node, operation } = studio
    operation.selection.select(node.id)
    const field = (name: string) => `[id$="x-component-props.${name}"]`
    await vi.waitFor(() =>
      expect(designer.find(`select${field('rows')}`).exists()).toBe(true),
    )
    const source = designer.get(`select${field('rows')}`)
    const binding = '{{ $form.getValuesIn(["sales"]) }}'
    expect(source.get(`option[value='${binding}']`).text()).toBe(
      'Sales (sales)',
    )
    await source.setValue(binding)
    expect(designer.get('table[aria-label="Data preview"]').text()).toContain(
      'Feb',
    )
    expect(designer.get('datalist option[value="month"]').text()).toBe('Month')
    await designer.get(`input${field('xKey')}`).setValue('month')
    await button(designer, 'Remove series').trigger('click')
    await button(designer, 'Remove series').trigger('click')
    const series = designer.get(`select${field('series')}`)
    expect(series.find('option[value="column:month"]').exists()).toBe(false)
    await series.setValue('column:amount')
    await series.setValue('column:target')
    expect(node.props['x-component-props']).toMatchObject({
      rows: binding,
      xKey: 'month',
      series: [
        { key: 'amount', title: 'Amount' },
        { key: 'target', title: 'Target' },
      ],
    })
    await vi.waitFor(() =>
      expect(designer.find('figure table').text()).toContain('Mar'),
    )

    const view = await previewAfterImport(studio)
    const points = () =>
      view
        .findAll('figure tbody tr')
        .map((row) => row.findAll('td').map((cell) => cell.text()))
    const table = view.get('.dn-array-table')
    const chart = view.get('figure')
    const bars = () =>
      chart
        .findAll('svg path[unovis-series-key]')
        .map((path) => path.attributes('d'))
    await vi.waitFor(() =>
      expect(points()).toEqual([
        ['Jan', '10', '20'],
        ['Feb', '0', '–'],
        ['Mar', '30', '40'],
      ]),
    )
    await vi.waitFor(() => expect(bars()).toHaveLength(6))
    const initialBars = bars()
    expect(initialBars.join(' ')).not.toContain('NaN')

    const february = table.findAll('tbody tr')[1]
    const amount = february.findAll<HTMLInputElement>(
      'input[role="spinbutton"]',
    )[0]
    await amount.setValue('17')
    await amount.trigger('blur')
    await vi.waitFor(() => expect(points()[1]).toEqual(['Feb', '17', '–']))
    await vi.waitFor(() => expect(bars()).not.toEqual(initialBars))
    const editedBars = bars()

    await february.get('button[aria-label="Move up"]').trigger('click')
    await vi.waitFor(() =>
      expect(points()).toEqual([
        ['Feb', '17', '–'],
        ['Jan', '10', '20'],
        ['Mar', '30', '40'],
      ]),
    )
    await vi.waitFor(() => expect(bars()).not.toEqual(editedBars))
    await table
      .findAll('tbody tr')[1]
      .get('button[aria-label="Remove"]')
      .trigger('click')
    await vi.waitFor(() =>
      expect(points()).toEqual([
        ['Feb', '17', '–'],
        ['Mar', '30', '40'],
      ]),
    )
    await vi.waitFor(() => expect(bars()).toHaveLength(4))
  })

  test.each([
    {
      aggregation: 'sum',
      option: 'Sum',
      initial: '40',
      edited: '60',
      removed: '50',
    },
    {
      aggregation: 'mean',
      option: 'Mean',
      initial: String(40 / 3),
      edited: '20',
      removed: '25',
    },
  ])(
    'Chart recalculates $aggregation from an ArrayTable after JSON import',
    async ({ aggregation, option, initial, edited, removed }) => {
      measureChartInJsdom()
      const studio = designerFor('BarChart', (_, root) => {
        appendSalesTable(
          root,
          [
            { month: 'Jan', channel: 'Web', amount: 10 },
            { month: 'Jan', channel: 'Web', amount: 25 },
            { month: 'Jan', channel: 'Web', amount: 5 },
            { month: 'Jan', channel: 'Web', amount: null },
            { month: 'Jan', channel: 'Shop', amount: 6 },
            { month: 'Feb', channel: 'Shop', amount: 0 },
          ],
          {
            month: { title: 'Month', type: 'string' },
            channel: { title: 'Channel', type: 'string' },
            amount: { title: 'Amount', type: 'number' },
          },
        )
      })
      const { designer, node, operation } = studio
      operation.selection.select(node.id)
      const setting = (key: string) => `label[for$="x-component-props.${key}"]`
      const item = (key: string) =>
        new DOMWrapper(
          designer.get(setting(key)).element.closest('[data-slot="form-item"]'),
        )
      await vi.waitFor(() =>
        expect(designer.find(setting('rows')).exists()).toBe(true),
      )
      expect(designer.find(setting('aggregation')).exists()).toBe(false)
      await item('rows')
        .get('select')
        .setValue('{{ $form.getValuesIn(["sales"]) }}')
      expect(item('groupKey').get('option[value="channel"]').text()).toBe(
        'Channel',
      )
      await item('groupKey').get('input').setValue('channel')
      expect(item('valueKey').get('option[value="amount"]').text()).toBe(
        'Amount',
      )
      expect(item('valueKey').find('option[value="channel"]').exists()).toBe(
        false,
      )
      await item('valueKey').get('input').setValue('amount')
      await selectSetting(item('aggregation'), option)
      expect(node.props['x-component-props']).toMatchObject({
        groupKey: 'channel',
        valueKey: 'amount',
        aggregation,
      })
      expect(designer.find(setting('series')).exists()).toBe(false)
      const values = (view: VueWrapper) =>
        view
          .findAll('figure tbody tr')
          .map((row) => row.findAll('td').map((cell) => cell.text()))
      const expected = [
        ['Jan', initial, '6'],
        ['Feb', '–', '0'],
      ]
      await vi.waitFor(() => expect(values(designer)).toEqual(expected))

      const view = await previewAfterImport(studio)
      const figure = view.get('figure')
      const table = view.get('.dn-array-table')
      const bars = () =>
        figure
          .findAll('svg path[unovis-series-key]')
          .map((bar) => bar.attributes('d'))
      expect(figure.findAll('th').map((cell) => cell.text())).toEqual([
        'month',
        'Web',
        'Shop',
      ])
      expect(values(view)).toEqual(expected)
      await vi.waitFor(() => expect(bars()).toHaveLength(4))
      const initialBars = bars()

      const amount = table
        .findAll('tbody tr')[1]
        .get('input[role="spinbutton"]')
      await amount.setValue('45')
      await amount.trigger('blur')
      await vi.waitFor(() =>
        expect(values(view)[0]).toEqual(['Jan', edited, '6']),
      )
      await vi.waitFor(() => expect(bars()).not.toEqual(initialBars))
      const editedBars = bars()

      await table
        .findAll('tbody tr')[0]
        .get('button[aria-label="Remove"]')
        .trigger('click')
      await vi.waitFor(() =>
        expect(values(view)).toEqual([
          ['Jan', removed, '6'],
          ['Feb', '–', '0'],
        ]),
      )
      await vi.waitFor(() => expect(bars()).not.toEqual(editedBars))
    },
  )

  test('Chart suggests columns from JSON and plots numeric points in a line chart', async () => {
    measureChartInJsdom()
    const studio = designerFor('LineChart')
    const { designer, node, operation } = studio
    operation.selection.select(node.id)
    await vi.waitFor(() =>
      expect(
        designer.find('label[for$="x-component-props.rows"]').exists(),
      ).toBe(true),
    )
    const field = (key: string) =>
      new DOMWrapper(
        designer
          .get(`label[for$="x-component-props.${key}"]`)
          .element.closest('[data-slot="form-item"]'),
      )
    await field('rows')
      .get('textarea')
      .setValue(
        JSON.stringify([
          { period: 'A', measure: null, note: 'draft' },
          { period: 'B', measure: 0 },
          { period: 'C', measure: 5 },
        ]),
      )
    expect(field('rows').get('table').text()).toContain('draft')
    await field('xKey').get('input').setValue('period')
    await button(designer, 'Remove series').trigger('click')
    await button(designer, 'Remove series').trigger('click')
    const series = field('series').get('select')
    expect(series.find('option[value="column:note"]').exists()).toBe(false)
    await series.setValue('column:measure')
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      const line = view.find('figure svg g[unovis-series-key] path[stroke][d]')
      expect(line.exists()).toBe(true)
      expect(line.attributes('d')).toMatch(/^M[^N]+L/)
    })
    expect(
      view.findAll('figure table tbody tr').map((row) => row.text()),
    ).toEqual(['A–', 'B0', 'C5'])
  })

  test.each([false, true])(
    'Chart keeps its ArrayTable mapping through field renames and JSON import (grouped: %s)',
    async (grouped) => {
      measureChartInJsdom()
      let sales: TreeNode
      const studio = designerFor('BarChart', (node, root) => {
        sales = appendSalesTable(
          root,
          [
            { month: 'Jan', channel: 'Web', amount: 10 },
            { month: 'Jan', channel: 'Web', amount: 15 },
            { month: 'Feb', channel: 'Web', amount: 20 },
          ],
          {
            month: { title: 'Month', type: 'string' },
            channel: { title: 'Channel', type: 'string' },
            amount: { title: 'Amount', type: 'number' },
          },
        )
        Object.assign(node.props['x-component-props'], {
          rows: '{{ $form.getValuesIn(["sales"]) }}',
          xKey: 'month',
          series: [{ key: 'amount', title: 'Revenue', color: '#2563eb' }],
          ...(grouped ? { groupKey: 'channel', valueKey: 'amount' } : {}),
        })
      })
      const { designer, node, operation } = studio
      const renameInSettings = async (field: TreeNode, name: string) => {
        operation.selection.select(field.id)
        const input = '.dn-settings-form input[id$=".name"]'
        await vi.waitFor(() =>
          expect(designer.find<HTMLInputElement>(input).element?.value).toBe(
            field.props.name,
          ),
        )
        await designer.get(input).setValue(name)
        expect(field.props.name).toBe(name)
      }
      await renameInSettings(sales, 'monthlySales')
      sales
        .find((field) => field.props.name === 'month')
        .setProps({ name: 'period' })
      sales
        .find((field) => field.props.name === 'channel')
        .setProps({ name: 'segment' })
      await renameInSettings(
        sales.find((field) => field.props.name === 'amount'),
        'revenue',
      )

      expect(node.props['x-component-props']).toMatchObject({
        rows: '{{ $form.getValuesIn(["monthlySales"]) }}',
        xKey: 'period',
        series: [{ key: 'revenue', title: 'Revenue', color: '#2563eb' }],
        ...(grouped ? { groupKey: 'segment', valueKey: 'revenue' } : {}),
      })
      expect(sales.props.default[0]).toEqual({
        period: 'Jan',
        segment: 'Web',
        revenue: 10,
      })
      const values = (view: VueWrapper) =>
        view
          .findAll('figure tbody tr')
          .map((row) => row.findAll('td').map((cell) => cell.text()))
      const expected = grouped
        ? [
            ['Jan', '25'],
            ['Feb', '20'],
          ]
        : [
            ['Jan', '10'],
            ['Jan', '15'],
            ['Feb', '20'],
          ]
      await vi.waitFor(() => expect(values(designer)).toEqual(expected))
      const view = await previewAfterImport(studio)
      expect(values(view)).toEqual(expected)
      const amount = view.get('.dn-array-table input[role="spinbutton"]')
      await amount.setValue('18')
      await amount.trigger('blur')
      await vi.waitFor(() =>
        expect(values(view)[0]).toEqual(['Jan', grouped ? '33' : '18']),
      )
    },
  )

  test.each([
    {
      format: 'euro',
      formatLabel: 'Euros',
      order: 'descending',
      orderLabel: 'Descending',
      categories: ['Q10', 'Q2', 'Q1'],
      digits: 2,
      options: {
        style: 'currency',
        currency: 'EUR',
      } satisfies Intl.NumberFormatOptions,
    },
    {
      format: 'percent',
      formatLabel: 'Percentage',
      order: 'ascending',
      orderLabel: 'Ascending',
      categories: ['Q1', 'Q2', 'Q10'],
      digits: 0,
      options: { style: 'percent' } satisfies Intl.NumberFormatOptions,
    },
    {
      format: 'decimal',
      formatLabel: 'Decimal',
      order: 'source',
      orderLabel: 'Source order',
      categories: ['Q2', 'Q10', 'Q1'],
      digits: 3,
      options: { style: 'decimal' } satisfies Intl.NumberFormatOptions,
    },
  ])(
    'Chart keeps $format formatting and $order category order after JSON import',
    async ({
      format,
      formatLabel,
      order,
      orderLabel,
      categories,
      digits,
      options,
    }) => {
      measureChartInJsdom()
      const input = { Q2: 0.5, Q10: 0.25, Q1: 1 }
      const rows = Object.entries(input).map(([quarter, value]) => ({
        quarter,
        value,
      }))
      const studio = designerFor('BarChart', (node) => {
        Object.assign(node.props['x-component-props'], {
          rows,
          xKey: 'quarter',
          series: [{ key: 'value', title: 'Value' }],
        })
        if (format === 'percent') {
          Object.assign(node.props['x-component-props'], {
            rows: rows.flatMap(({ quarter, value }) => [
              { quarter, value: value / 2, group: 'Value' },
              { quarter, value: value / 2, group: 'Value' },
            ]),
            groupKey: 'group',
            valueKey: 'value',
          })
        }
      })
      const { designer, node, operation } = studio
      operation.selection.select(node.id)
      const item = (key: string) =>
        new DOMWrapper(
          designer
            .get(`label[for$="x-component-props.${key}"]`)
            .element.closest('[data-slot="form-item"]'),
        )
      await vi.waitFor(() =>
        expect(
          designer
            .find('label[for$="x-component-props.categoryOrder"]')
            .exists(),
        ).toBe(true),
      )
      await selectSetting(item('categoryOrder'), orderLabel)
      await selectSetting(item('valueFormat'), formatLabel)
      await editSettings(
        studio,
        node,
        'BarChart',
        { decimalPlaces: digits },
        true,
      )
      expect(node.props['x-component-props']).toMatchObject({
        categoryOrder: order,
        valueFormat: format,
        decimalPlaces: digits,
      })

      const numberFormat = new Intl.NumberFormat(undefined, {
        ...options,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
      const tableValues = (view: VueWrapper) =>
        view
          .findAll('figure tbody tr')
          .map((row) =>
            row.findAll('td').map((cell) => cell.element.textContent),
          )
      const expected = categories.map((category) => [
        category,
        numberFormat.format(input[category]),
      ])
      await vi.waitFor(() => expect(tableValues(designer)).toEqual(expected))
      const view = await previewAfterImport(studio)
      expect(tableValues(view)).toEqual(expected)
      const figure = view.get('figure')
      const plot = figure.get('svg')
      vi.spyOn(plot.element, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 480, 240),
      )
      const ticks = () =>
        plot.findAll('g.tick').filter((tick) => tick.find('text').exists())
      const tickLabel = (tick: DOMWrapper<Element>) =>
        tick.get('text').element.textContent
      await vi.waitFor(() => {
        const labels = ticks().map(tickLabel)
        expect(labels.filter((label) => categories.includes(label))).toEqual(
          categories,
        )
        expect(labels).toContain(numberFormat.format(1))
      })
      const hovered = categories[1]
      const tick = ticks().find((tick) => tickLabel(tick) === hovered)
      const clientX = Number.parseFloat(
        tick.attributes('transform').slice('translate('.length),
      )
      await plot.trigger('mousemove', { clientX, clientY: 90 })
      await vi.waitFor(() => {
        const heading = figure.get('[data-vis-xy-container] strong')
        expect(heading.text()).toBe(hovered)
        expect(heading.element.parentElement.textContent).toContain(
          `Value: ${numberFormat.format(input[hovered])}`,
        )
      })
    },
  )

  test('Area retains grouped series and draws their fills after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('AreaChart', (node) => {
      Object.assign(node.props['x-component-props'], {
        rows: [
          { month: 'Jan', channel: 'Web', amount: 2 },
          { month: 'Feb', channel: 'Web', amount: 3 },
          { month: 'Jan', channel: 'Shop', amount: 4 },
          { month: 'Feb', channel: 'Shop', amount: 9 },
        ],
        groupKey: 'channel',
        valueKey: 'amount',
      })
    })
    const view = await previewAfterImport(studio)
    const figure = view.get('figure')
    expect(
      figure
        .get('ul')
        .findAll('li')
        .map((item) => item.text()),
    ).toEqual(['Web', 'Shop'])
    expect(
      figure
        .findAll('tbody tr')
        .map((row) => row.findAll('td').map((cell) => cell.text())),
    ).toEqual([
      ['Jan', '2', '4'],
      ['Feb', '3', '9'],
    ])
    await vi.waitFor(() => {
      const fills = figure
        .findAll<SVGPathElement>('svg path[unovis-series-key]')
        .filter((path) => path.element.style.opacity === '0.2')
      expect(fills).toHaveLength(2)
      expect(fills.every((path) => /^M.+Z$/.test(path.attributes('d')))).toBe(
        true,
      )
    })
  })

  test.each([
    { type: 'PieChart', option: 'Sum', aggregate: 20, edited: 30 },
    { type: 'DonutChart', option: 'Mean', aggregate: 10, edited: 15 },
  ])(
    'Chart $type preserves categories, aggregation and slices after JSON import',
    async ({ type, option, aggregate, edited }) => {
      measureChartInJsdom()
      const studio = designerFor(
        type as 'PieChart' | 'DonutChart',
        (node, root) => {
          appendSalesTable(
            root,
            [
              { month: 'B', amount: 7 },
              { month: 'A', amount: 15 },
              { month: 'A', amount: 5 },
              { month: 'C', amount: 0 },
              { month: 'D', amount: -4 },
            ],
            {
              month: { title: 'Month', type: 'string' },
              amount: { title: 'Amount', type: 'number' },
            },
          )
          Object.assign(node.props['x-component-props'], {
            rows: '{{ $form.getValuesIn(["sales"]) }}',
            valueFormat: 'euro',
            categoryOrder: 'ascending',
          })
        },
      )
      const { designer, node } = studio
      await editSettings(
        studio,
        node,
        type as 'PieChart' | 'DonutChart',
        { valueKey: 'amount' },
        true,
      )
      const label = (key: string) => `label[for$="x-component-props.${key}"]`
      expect(designer.find(label('groupKey')).exists()).toBe(false)
      expect(designer.find(label('series')).exists()).toBe(false)
      await selectSetting(
        new DOMWrapper(
          designer
            .get(label('aggregation'))
            .element.closest('[data-slot="form-item"]'),
        ),
        option,
      )
      const view = await previewAfterImport(studio)
      const figure = view.get('figure')
      const euro = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'EUR',
      })
      const rows = () =>
        figure
          .findAll('tbody tr')
          .map((row) =>
            row.findAll('td').map((cell) => cell.element.textContent),
          )
      expect(rows()).toEqual([
        ['A', euro.format(aggregate)],
        ['B', euro.format(7)],
        ['C', euro.format(0)],
        ['D', euro.format(-4)],
      ])
      expect(
        figure
          .get('ul')
          .findAll('li')
          .map((item) => item.text()),
      ).toEqual(['A', 'B'])
      expect(figure.find('g.tick').exists()).toBe(false)
      expect(figure.text()).toContain('Slices show positive values only.')

      const slices = () => figure.findAll('svg path[unovis-pattern-index]')
      await vi.waitFor(() => expect(slices()).toHaveLength(2))
      const arc = figure.get('svg path[unovis-pattern-index="0"]')
      const shape = arc.attributes('d')
      expect(shape).toMatch(/^M.+A/)
      expect(shape.includes('L0,0')).toBe(type === 'PieChart')
      await arc.trigger('mousemove', { clientX: 150, clientY: 90 })
      await vi.waitFor(() => {
        const heading = figure.get('[data-vis-single-container] strong')
        expect(heading.text()).toBe('A')
        expect(heading.element.parentElement.textContent).toContain(
          `amount: ${euro.format(aggregate)}`,
        )
      })

      const amount = view
        .get('.dn-array-table')
        .findAll('tbody tr')[1]
        .get('input[role="spinbutton"]')
      await amount.setValue('25')
      await amount.trigger('blur')
      await vi.waitFor(() =>
        expect(rows()[0]).toEqual(['A', euro.format(edited)]),
      )
      await vi.waitFor(() =>
        expect(
          figure.get('svg path[unovis-pattern-index="0"]').attributes('d'),
        ).not.toBe(shape),
      )
    },
  )

  test('Sankey maps ArrayTable links, combines duplicates and keeps cycles out of the layout after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('SankeyChart', (_, root) => {
      appendSalesTable(
        root,
        [
          { from: 'Web', to: 'Cart', amount: 10 },
          { from: 'Web', to: 'Cart', amount: 5 },
          { from: 'Cart', to: 'Paid', amount: 8 },
        ],
        {
          from: { title: 'From', type: 'string' },
          to: { title: 'To', type: 'string' },
          amount: { title: 'Amount', type: 'number' },
        },
      )
    })
    await editSettings(
      studio,
      studio.node,
      'SankeyChart',
      { sourceKey: 'from' },
      true,
    )
    const { designer, node } = studio
    await designer
      .get('select[id$="x-component-props.rows"]')
      .setValue('{{ $form.getValuesIn(["sales"]) }}')
    expect(designer.find('label[for$="x-component-props.xKey"]').exists()).toBe(
      false,
    )
    await editSettings(
      studio,
      node,
      'SankeyChart',
      { sourceKey: 'from', targetKey: 'to', valueKey: 'amount' },
      true,
    )
    studio.root
      .find((field) => field.props.name === 'from')
      .setProps({ name: 'origin' })
    expect(node.props['x-component-props'].sourceKey).toBe('origin')
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => expect(view.find('figure').exists()).toBe(true))
    const figure = view.get('figure')
    const tableValues = () =>
      figure
        .findAll('tbody tr')
        .map((row) => row.findAll('td').map((cell) => cell.text()))
    await vi.waitFor(() =>
      expect(
        figure
          .findAll('svg path[d]')
          .some((path) => path.attributes('d').includes('C')),
      ).toBe(true),
    )
    expect(tableValues()).toEqual([
      ['Web', 'Cart', '15'],
      ['Cart', 'Paid', '8'],
    ])
    const table = view.get('.dn-array-table')
    const amount = table.findAll('tbody tr')[1].get('input[role="spinbutton"]')
    await amount.setValue('12')
    await amount.trigger('blur')
    await vi.waitFor(() =>
      expect(tableValues()[0]).toEqual(['Web', 'Cart', '22']),
    )
    await table
      .findAll('tbody tr')[2]
      .get('td:nth-child(2) input')
      .setValue('Web')
    await vi.waitFor(() =>
      expect(figure.text()).toContain('requires flows without cycles'),
    )
    expect(figure.find('svg').exists()).toBe(false)
    expect(tableValues()[1]).toEqual(['Cart', 'Web', '8'])
  })

  const flowRows = [
    { a: 'A', b: 'B', value: 5 },
    { a: 'B', b: 'C', value: 3 },
  ]
  const categoryRows = [
    { a: 'A', b: 'Web', value: 5 },
    { a: 'B', b: 'Store', value: 3 },
  ]
  test.each([
    {
      type: 'StackedBarChart',
      props: {
        xKey: 'a',
        groupKey: 'b',
        valueKey: 'value',
        rows: categoryRows,
      },
      first: ['A', '5', '–'],
    },
    {
      type: 'ScatterChart',
      props: {
        xKey: 'x',
        valueKey: 'value',
        rows: [
          { x: 1, value: 5 },
          { x: 2, value: 3 },
        ],
      },
      first: ['1', '5'],
    },
    {
      type: 'BoxplotChart',
      props: {
        xKey: 'a',
        valueKey: 'value',
        rows: [1, 2, 3, 4, 5].map((value) => ({ a: 'A', value })),
      },
      first: ['A', '1', '2', '3', '4', '5'],
    },
    {
      type: 'TimelineChart',
      props: {
        xKey: 'a',
        startKey: 'start',
        endKey: 'end',
        rows: [
          { a: 'A', start: '2026-11-01', end: '2026-11-04' },
          { a: 'B', start: '2026-11-02', end: '2026-11-05' },
        ],
      },
      first: [
        'A',
        ...['2026-11-01', '2026-11-04'].map((date) =>
          new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeZone: 'UTC',
          }).format(Date.parse(date)),
        ),
      ],
    },
    {
      type: 'NetworkGraph',
      props: {
        sourceKey: 'a',
        targetKey: 'b',
        valueKey: 'value',
        rows: flowRows,
      },
      first: ['A', 'B', '5'],
    },
    {
      type: 'ChordChart',
      props: {
        sourceKey: 'a',
        targetKey: 'b',
        valueKey: 'value',
        rows: flowRows,
      },
      first: ['A', 'B', '5'],
    },
    {
      type: 'HeatmapChart',
      props: {
        xKey: 'a',
        groupKey: 'b',
        valueKey: 'value',
        rows: categoryRows,
      },
      first: ['A', 'Web', '5'],
    },
    {
      type: 'TreemapChart',
      props: {
        xKey: 'a',
        groupKey: 'b',
        valueKey: 'value',
        rows: categoryRows,
      },
      first: ['Web', 'A', '5'],
    },
    {
      type: 'NestedDonutChart',
      props: {
        xKey: 'a',
        groupKey: 'b',
        valueKey: 'value',
        rows: categoryRows,
      },
      first: ['Web', 'A', '5'],
    },
    {
      type: 'RadialBarChart',
      props: { xKey: 'a', valueKey: 'value', rows: categoryRows },
      first: ['A', '5'],
    },
    {
      type: 'CircularBarChart',
      props: { xKey: 'a', valueKey: 'value', rows: categoryRows },
      first: ['A', '5'],
    },
    {
      type: 'PointMap',
      props: {
        xKey: 'a',
        latitudeKey: 'lat',
        longitudeKey: 'lon',
        valueKey: 'value',
        rows: [{ a: 'Paris', lat: 48.86, lon: 2.35, value: 5 }],
      },
      first: ['Paris', '48.86', '2.35', '5'],
    },
    {
      type: 'ChoroplethMap',
      props: {
        xKey: 'country',
        valueKey: 'value',
        rows: [{ country: 'fr', value: 5 }],
      },
      first: ['FR', '5'],
    },
    {
      type: 'FlowMap',
      props: {
        xKey: 'a',
        latitudeKey: 'lat',
        longitudeKey: 'lon',
        destinationLatitudeKey: 'toLat',
        destinationLongitudeKey: 'toLon',
        valueKey: 'value',
        rows: [
          {
            a: 'Paris–Lisbon',
            lat: 48.86,
            lon: 2.35,
            toLat: 38.72,
            toLon: -9.14,
            value: 5,
          },
        ],
      },
      first: ['Paris–Lisbon', '48.86', '2.35', '38.72', '-9.14', '5'],
    },
  ])(
    'Chart $type renders mapped records and SVG after JSON import',
    async ({ type, props, first }) => {
      measureChartInJsdom()
      const studio = designerFor(type as keyof typeof ChartSchemas, (node) =>
        Object.assign(node.props['x-component-props'], props),
      )
      const view = await previewAfterImport(studio)
      await vi.waitFor(() => expect(view.find('figure').exists()).toBe(true))
      const figure = view.get('figure')
      expect(
        figure
          .get('tbody tr')
          .findAll('td')
          .map((cell) => cell.text()),
      ).toEqual(first)
      await vi.waitFor(() => {
        const svg = figure.get('svg')
        const marks = svg
          .findAll('path[d], circle[r], rect[width], line[x2]')
          .filter((mark) => !mark.element.closest('defs'))
        expect(marks.length).toBeGreaterThan(0)
        expect(
          marks.map((mark) => mark.attributes('d')).join(' '),
        ).not.toContain('NaN')
      })
    },
  )

  test('Line settings update the canvas and survive JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('LineChart', (node) =>
      Object.assign(node.props['x-component-props'], {
        rows: [
          { month: 'Jan', amount: 2 },
          { month: 'Feb', amount: 3 },
          { month: 'Mar', amount: 1 },
        ],
        xKey: 'month',
        series: [{ key: 'amount' }],
      }),
    )
    const mark = 'figure svg path[stroke-width="7"][d]'
    await editSettings(
      studio,
      studio.node,
      'LineChart',
      {
        curve: 'step',
        lineWidth: 7,
        showPoints: false,
      },
      true,
    )
    expect(
      studio.designer
        .find('label[for$="x-component-props.pointSize"]')
        .exists(),
    ).toBe(false)
    await vi.waitFor(() =>
      expect(studio.designer.get(mark).attributes('d')).toMatch(/^M[^C]+$/),
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      expect(view.get(mark).attributes('d')).toMatch(/^M[^C]+$/)
      expect(view.find('figure svg g[class*="point-group"]').exists()).toBe(
        false,
      )
    })
  })

  test('Donut keeps its center text and ring width after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('DonutChart')
    await editSettings(
      studio,
      studio.node,
      'DonutChart',
      {
        centerLabel: 'Revenue total',
        ringWidth: 12,
      },
      true,
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      const svg = view.get('figure svg')
      expect(svg.text()).toContain('Revenue total')
      const segment = svg.get('path[class*="segment"][d]').attributes('d')
      const radii = [...segment.matchAll(/A([\d.]+),/g)].map((match) =>
        Number(match[1]),
      )
      expect(Math.max(...radii) - Math.min(...radii)).toBeCloseTo(12)
    })
  })

  test('Sankey keeps its node width and flow values after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('SankeyChart', (node) =>
      Object.assign(node.props['x-component-props'], {
        rows: flowRows,
        sourceKey: 'a',
        targetKey: 'b',
        valueKey: 'value',
      }),
    )
    await editSettings(
      studio,
      studio.node,
      'SankeyChart',
      {
        nodeAlign: 'left',
        nodeWidth: 36,
      },
      true,
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      expect(view.findAll('figure svg rect[width="36"]')).toHaveLength(3)
      expect(view.get('figure tbody td:last-child').text()).toBe('5')
    })
  })

  test('Heatmap keeps its color scale and hides grid labels after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('HeatmapChart', (node) =>
      Object.assign(node.props['x-component-props'], {
        rows: categoryRows,
        xKey: 'a',
        groupKey: 'b',
        valueKey: 'value',
      }),
    )
    await editSettings(
      studio,
      studio.node,
      'HeatmapChart',
      {
        colorScale: 'green',
        showGridLabels: false,
      },
      true,
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      const svg = view.get('figure svg')
      const fills = svg
        .findAll<SVGPathElement>('path')
        .map((path) => path.element.style.fill)
      expect(fills).toContain('rgb(20, 83, 45)')
      expect(svg.find('text').exists()).toBe(false)
      expect(view.get('figure tbody tr').text()).toContain('Web')
    })
  })

  test('Point map reframes live and keeps its marker settings after JSON import', async () => {
    measureChartInJsdom()
    const studio = designerFor('PointMap')
    const feature = 'figure svg path[class$="-feature"][d]'
    await vi.waitFor(() =>
      expect(studio.designer.find(feature).exists()).toBe(true),
    )
    const world = studio.designer.get(feature).attributes('d')
    await editSettings(
      studio,
      studio.node,
      'PointMap',
      { fitToData: true },
      true,
    )
    await vi.waitFor(() =>
      expect(studio.designer.get(feature).attributes('d')).not.toBe(world),
    )
    const fitted = studio.designer.get(feature).attributes('d')
    expect(fitted).not.toContain('NaN')
    await editSettings(
      studio,
      studio.node,
      'PointMap',
      { fitToData: false },
      true,
    )
    await vi.waitFor(() =>
      expect(studio.designer.get(feature).attributes('d')).toBe(world),
    )
    await editSettings(
      studio,
      studio.node,
      'PointMap',
      {
        fitToData: true,
        markerSize: 12,
        showPointLabels: false,
      },
      true,
    )
    const view = await previewAfterImport(studio)
    await vi.waitFor(() => {
      expect(view.get(feature).attributes('d')).toBe(fitted)
      expect(
        view.get('figure svg path[class$="-point-shape"]').attributes('d'),
      ).toContain('a 12,12')
      expect(view.get('figure svg').text()).not.toContain('Paris')
      expect(view.get('figure tbody tr').text()).toContain('Paris')
    })
  })

  test('Carousel and slide edit labels and wrap between slides', async () => {
    const studio = designerFor('Carousel')
    await editSettings(studio, studio.node, 'Carousel', {
      label: 'Edited carousel',
      previousText: 'Back a slide',
      nextText: 'Forward a slide',
      loop: true,
    })
    await editSettings(studio, studio.node.children[0], 'CarouselSlide', {
      title: 'Edited slide',
    })
    const view = await previewAfterImport(studio)
    const carousel = view.get('section[aria-label="Edited carousel"]')
    expect(
      carousel.get('[aria-roledescription="slide"]').attributes('aria-label'),
    ).toBe('Edited slide')
    const previous = button(view, 'Back a slide')
    expect(previous.attributes('disabled')).toBeUndefined()
    const rail = carousel.get('[role="group"][aria-label="Edited carousel"]')
    const slides = rail.findAll('[aria-roledescription="slide"]')
    vi.spyOn(rail.element, 'getBoundingClientRect').mockReturnValue({
      left: 0,
    } as DOMRect)
    vi.spyOn(slides[1].element, 'getBoundingClientRect').mockReturnValue({
      left: 300,
    } as DOMRect)
    await previous.trigger('click')
    expect(rail.element.scrollLeft).toBe(300)
    expect(
      button(view, 'Forward a slide').attributes('disabled'),
    ).toBeUndefined()
  })

  test('Resizable edits orientation, height, panel title, sizes and handle label', async () => {
    const studio = designerFor('Resizable', (node) => {
      node.children[0].append(
        child('panelAnswer', 'Input', {
          type: 'string',
          title: 'Panel answer',
          'x-decorator': 'FormItem',
        }),
      )
    })
    await editSettings(studio, studio.node, 'Resizable', { height: 40 }, true)
    expect(
      studio.designer
        .find(
          `[data-designer-node-id="${studio.node.id}"] [style*="height: 40px"]`,
        )
        .exists(),
    ).toBe(true)
    const horizontal = await previewAfterImport(studio)
    expect(
      horizontal
        .find(
          '[data-panel-group][data-orientation="horizontal"][style*="height: 40px"]',
        )
        .exists(),
    ).toBe(true)

    const layout = studio.root.children[0]
    await editSettings(studio, layout, 'Resizable', {
      direction: 'vertical',
      height: 460,
      handleLabel: 'Edited divider',
    })
    await editSettings(studio, layout.children[0], 'ResizablePanel', {
      title: 'Edited panel',
      defaultSize: 40,
      minSize: 25,
      maxSize: 75,
    })
    const view = await previewAfterImport(studio)
    const group = view.get('[data-panel-group][data-orientation="vertical"]')
    expect((group.element as HTMLElement).style.height).toBe('460px')
    expect(group.text()).toContain('Edited panel')
    const answer = group.get<HTMLInputElement>('input[id$=".panelAnswer"]')
    await answer.setValue('Nested answer')
    expect(answer.element.value).toBe('Nested answer')
    const divider = group.get('[role="separator"][aria-label="Edited divider"]')
    await vi.waitFor(() => {
      expect(divider.attributes('aria-valuenow')).toBe('40')
      expect(divider.attributes('aria-valuemin')).toBe('25')
      expect(divider.attributes('aria-valuemax')).toBe('75')
    })
  })

  test('Scroll Area edits its height and region label', async () => {
    const studio = designerFor('ScrollArea')
    await editSettings(studio, studio.node, 'ScrollArea', {
      height: 170,
      label: 'Edited scrolling region',
    })
    const view = await previewAfterImport(studio)
    const region = view.get(
      '[role="region"][aria-label="Edited scrolling region"]',
    )
    expect(region.element.parentElement.style.height).toBe('170px')
  })

  test.each(['Sheet', 'Drawer'] as const)(
    '%s edits labels, open state and placement when supported',
    async (name) => {
      const studio = designerFor(name, (node) =>
        node.append(
          child('note', 'Text', {
            'x-component-props': { content: 'Nested edited panel content' },
          }),
        ),
      )
      await editSettings(studio, studio.node, name, {
        title: 'Edited panel heading',
        description: 'Edited panel description',
        triggerText: 'Open edited panel',
        closeText: 'Close edited panel',
        defaultOpen: true,
        ...(name === 'Sheet' ? { side: 'left' } : {}),
      })
      const view = await previewAfterImport(studio)
      await vi.waitFor(() =>
        expect(view.find('[role="dialog"]').exists()).toBe(true),
      )
      const dialog = view.get('[role="dialog"]')
      expect(dialog.text()).toContain('Edited panel heading')
      expect(dialog.text()).toContain('Edited panel description')
      expect(dialog.text()).toContain('Nested edited panel content')
      if (name === 'Sheet') expect(dialog.classes()).toContain('left-0')
      await dialog.get('[aria-label="Close edited panel"]').trigger('click')
      await flushPromises()
      expect(view.find('[role="dialog"]').exists()).toBe(false)
      await button(view, 'Open edited panel').trigger('click')
      expect(view.get('[role="dialog"]').text()).toContain(
        'Edited panel heading',
      )
    },
  )

  test.each(['Questionnaire', 'Stepper'] as const)(
    '%s and its steps edit navigation, branches, validation and submission',
    async (name) => {
      const step = `${name}Step` as const
      const studio = designerFor(name, (node, root) => {
        node.children[0].setProps({ name: 'intro' })
        const main = child('main', step, {
          'x-component-props': { title: 'Main question' },
        })
        main.append(
          child('branchAnswer', 'Input', {
            type: 'string',
            title: 'Branch answer',
            'x-decorator': 'FormItem',
          }),
        )
        node.append(
          main,
          child('extra', step, {
            'x-component-props': { title: 'Extra question' },
          }),
          child('review', step, { 'x-component-props': { title: 'Review' } }),
        )
        root.append(
          child('approval', 'Input', {
            type: 'string',
            title: 'External approval',
            'x-decorator': 'FormItem',
            required: true,
          }),
          child('submitted', 'Input', {
            type: 'string',
            title: 'Submission receipt',
            'x-decorator': 'FormItem',
          }),
        )
      })
      await editSettings(studio, studio.node, name, {
        label: 'Edited flow',
        previousText: 'Back in flow',
        nextText: 'Continue flow',
        initialStep: 'main',
        finishText: 'Submit flow',
        completedText: 'Flow submitted',
        validationText: 'Review these fields',
        onSubmit:
          '{{() => $form.setValuesIn("submitted", "Saved from expression")}}',
      })
      const current = studio.node.children.find(
        (node) => node.props.name === 'main',
      )
      await editSettings(studio, current, step, {
        title: 'Edited main question',
        description: 'Edited question explanation',
        next: 'review',
        branches: [{ path: 'branchAnswer', equals: 'extra', next: 'extra' }],
        fields: ['approval'],
      })
      const view = await previewAfterImport(studio)
      expect(view.get('section[aria-label="Edited flow"] h3').text()).toBe(
        'Edited main question',
      )
      expect(view.text()).toContain('Edited question explanation')
      await button(view, 'Continue flow').trigger('click')
      await vi.waitFor(() =>
        expect(view.find('[role="alert"]').text()).toBe('Review these fields'),
      )
      await view.get('input[id="approval"]').setValue('approved')
      await button(view, 'Continue flow').trigger('click')
      await flushPromises()
      expect(view.get('h3').text()).toBe('Review')
      await button(view, 'Back in flow').trigger('click')
      expect(view.get('h3').text()).toBe('Edited main question')
      await view.get('input[id$=".main.branchAnswer"]').setValue('extra')
      await button(view, 'Continue flow').trigger('click')
      await flushPromises()
      expect(view.get('h3').text()).toBe('Extra question')
      await button(view, 'Continue flow').trigger('click')
      await flushPromises()
      expect(view.get('h3').text()).toBe('Review')
      await button(view, 'Submit flow').trigger('click')
      await flushPromises()
      expect(view.get('[role="status"]').text()).toBe('Flow submitted')
      expect(
        view.get<HTMLInputElement>('input[id="submitted"]').element.value,
      ).toBe('Saved from expression')
    },
  )
})
