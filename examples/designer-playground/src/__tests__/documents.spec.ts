import { TreeNode } from '@formivue-design/core'
import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  transformToFormDocuments,
  type FormDocuments,
  type UiDocumentNode,
} from '@formivue-design/formivue-transformer'
import * as Standard from '@formivue-design/formivue-vue'
import { AdvancedSources } from '@formivue-design/shadcn-advanced-designer'
import { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'
import { ChartSources } from '@formivue-design/charts-designer'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, test, vi } from 'vitest'
import { PreviewWidget } from '../widgets/PreviewWidget'
import { DocumentEditorWidget } from '../widgets/DocumentEditorWidget'

const makeNode = (
  key: string,
  node: Partial<UiDocumentNode> = {},
): UiDocumentNode => ({
  id: key,
  key,
  kind: 'void',
  ...node,
})

const documents = (): FormDocuments => ({
  ui: {
    version: 1,
    nodes: [
      makeNode('sales', {
        kind: 'array',
        component: 'ArrayTable',
        bind: '/sales',
        rowKey: 'id',
        item: makeNode('item', {
          kind: 'object',
          children: [
            makeNode('monthColumn', {
              component: 'ArrayTable.Column',
              props: { title: 'Month' },
              children: [
                makeNode('month', {
                  kind: 'field',
                  component: 'Input',
                  bind: '/month',
                }),
              ],
            }),
          ],
        }),
      }),
      makeNode('table', {
        component: 'DataTable',
        props: {
          columns: [
            { key: 'month', title: 'Month' },
            { key: 'amount', title: 'Amount' },
          ],
        },
        bindings: { rows: { path: '/sales' } },
      }),
      makeNode('chart', {
        component: 'BarChart',
        props: { xKey: 'month', series: [{ key: 'amount' }] },
        bindings: { rows: { path: '/sales' } },
      }),
      makeNode('heading', {
        component: 'Badge',
        bindings: { text: { path: '/heading' } },
      }),
    ],
  },
  dataSchema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['sales', 'heading'],
    properties: {
      heading: { type: 'string' },
      sales: {
        type: 'array',
        items: { $ref: '#/$defs/sale' },
      },
    },
    $defs: {
      sale: {
        type: 'object',
        required: ['id', 'month', 'amount'],
        properties: {
          id: { type: 'string' },
          month: { type: 'string', minLength: 1 },
          amount: { type: 'number' },
        },
      },
    },
  },
  data: {
    heading: 'Sales',
    sales: [
      { id: 'jan', month: 'January', amount: 10 },
      { id: 'feb', month: 'February', amount: 20 },
    ],
  },
})

const tree = () => new TreeNode({ componentName: 'Form' })
const materials = { ...AdvancedMaterials, ...ChartMaterials }

describe('separate UI, schema and data documents', () => {
  test('imports, validates and updates the rendered arrays, table and chart without resetting edits', async () => {
    Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
      configurable: true,
      value(this: SVGElement) {
        return (this.textContent?.length ?? 0) * 6
      },
    })
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 24, height: 12 }),
    })
    const initial = documents()
    const document = createFormDocument(
      parseFormDocuments(stringifyFormDocuments(initial)),
    )
    expect(document.exportDocuments()).toEqual(initial)
    const view = mount(PreviewWidget, {
      props: { tree: tree(), materials, document },
      attachTo: window.document.body,
    })
    try {
      const inputs = () =>
        view.findAll<HTMLInputElement>('.dn-array-table input')
      const chart = () => view.get('figure tbody').text()
      await vi.waitFor(() => expect(chart()).toContain('10'))
      const january = inputs()[0]
      january.element.focus()
      await january.setValue('Jan draft')
      await vi.waitFor(() => expect(chart()).toContain('Jan draft'))
      document.applyPatch({
        baseRevision: 0,
        revision: 1,
        operations: [{ op: 'replace', path: '/sales/1/amount', value: 25 }],
      })
      await vi.waitFor(() => expect(chart()).toContain('25'))
      expect(
        view
          .findAll('table')
          .some((table) => table.text().includes('February25')),
      ).toBe(true)
      expect(january.element.value).toBe('Jan draft')
      expect(document.revision).toBe(1)

      const fields = document.form
      const monthField = fields.query(['sales', '0', 'month']).take()
      document.replaceData(
        {
          heading: 'Refreshed',
          sales: [
            { id: 'feb', month: 'February', amount: 30 },
            { id: 'jan', month: 'January', amount: 10 },
          ],
        },
        2,
      )
      await nextTick()
      expect(inputs().map(({ element }) => element.value)).toEqual([
        'February',
        'Jan draft',
      ])
      expect(inputs()[1].element).toBe(january.element)
      expect(window.document.activeElement).toBe(january.element)
      expect(fields.query(['sales', '1', 'month']).take()).toBe(monthField)
      expect(view.text()).toContain('Refreshed')
      expect(document.form).toBe(fields)
      expect(document.conflicts).toEqual([])

      document.applyPatch({
        baseRevision: 2,
        revision: 3,
        operations: [
          { op: 'replace', path: '/sales/1/month', value: 'January server' },
        ],
      })
      await nextTick()
      expect(document.conflicts).toEqual(['/sales/1/month'])
      expect(inputs()[1].element.value).toBe('Jan draft')
      expect(document.exportDocuments().data.sales[1]).toMatchObject({
        month: 'January server',
      })
      await expect(fields.submit()).rejects.toThrow('Unresolved edit conflict')
    } finally {
      view.unmount()
      document.dispose()
      Reflect.deleteProperty(SVGElement.prototype, 'getComputedTextLength')
      Reflect.deleteProperty(SVGElement.prototype, 'getBBox')
    }
  })

  test('rejects invalid paths, mismatched types, failed patches and invalid snapshots atomically', () => {
    const missing = documents()
    missing.ui.nodes[2].bindings.rows.path = '/missing'
    expect(() => createFormDocument(missing)).toThrow(/BarChart.*\/missing/u)
    const wrong = documents()
    wrong.ui.nodes[2].props.series = [{ key: 'month' }]
    expect(() => createFormDocument(wrong)).toThrow(
      /Column "month" must have type number/u,
    )
    const column = documents()
    column.ui.nodes[1].props.columns = [{ key: 'missing' }]
    expect(() => createFormDocument(column)).toThrow(
      /DataTable.*Column "missing"/u,
    )
    const initial = documents()
    const session = createFormDocument(initial)
    expect(() =>
      session.applyPatch({
        baseRevision: 0,
        revision: 1,
        operations: [
          { op: 'replace', path: '/heading', value: 'Should be atomic' },
          { op: 'replace', path: '/sales/0/amount', value: 'bad' },
        ],
      }),
    ).toThrow('/sales/0/amount')
    expect(() =>
      session.applyPatch({ baseRevision: 5, revision: 6, operations: [] }),
    ).toThrow('current revision is 0')
    expect(() =>
      session.applyPatch({
        baseRevision: 0,
        revision: 1,
        operations: [
          { op: 'replace', path: '/heading', value: 'Should be atomic' },
          { op: 'test', path: '/heading', value: 'Wrong' },
        ],
      }),
    ).toThrow('Patch test failed')
    expect(() => session.replaceData({ heading: 'Missing sales' })).toThrow(
      '/sales',
    )
    expect(session.revision).toBe(0)
    expect(session.exportDocuments()).toEqual(initial)
    session.dispose()
  })

  test('validates all palette resources after migrating the legacy designer export', () => {
    const standard = [
      Standard.Input,
      Standard.Password,
      Standard.NumberPicker,
      Standard.Rate,
      Standard.Slider,
      Standard.Select,
      Standard.TreeSelect,
      Standard.Cascader,
      Standard.Transfer,
      Standard.Checkbox,
      Standard.Radio,
      Standard.DatePicker,
      Standard.TimePicker,
      Standard.Upload,
      Standard.Switch,
      Standard.ObjectContainer,
      Standard.Card,
      Standard.FormGrid,
      Standard.FormTab,
      Standard.FormLayout,
      Standard.FormCollapse,
      Standard.Space,
      Standard.ArrayCards,
      Standard.ArrayTable,
      Standard.Text,
    ].flatMap((source) => source.Resource)
    const advanced = Object.values(AdvancedSources)
      .flat()
      .flatMap((source) => source.Resource)
    const charts = Object.values(ChartSources)
      .flat()
      .flatMap((source) => source.Resource)
    for (const palette of [standard, advanced, charts]) {
      for (const resource of palette) {
        const root = new TreeNode({
          componentName: 'Form',
          children: resource.node.children.map((node) => node.serialize()),
        })
        const migrated = transformToFormDocuments(root)
        const session = createFormDocument(
          parseFormDocuments(stringifyFormDocuments(migrated)),
          {
            hasComponent: (name) =>
              name.split('.').reduce((value, key) => value?.[key], {
                ...Standard.Materials,
                ...materials,
              } as any) != null,
          },
        )
        expect(session.exportDocuments()).toEqual(migrated)
        session.dispose()
      }
    }
  })

  test('retains invalid draft values while valid remote data keeps updating', async () => {
    const initial = documents()
    initial.ui.nodes = initial.ui.nodes.filter(
      (node) => node.component !== 'BarChart',
    )
    const session = createFormDocument(initial)
    const first = mount(PreviewWidget, {
      props: { tree: tree(), materials, document: session },
    })
    await first.get('.dn-array-table input').setValue('')
    await expect(session.form.validate()).rejects.toThrow('/sales/0/month')
    session.replaceData({ ...initial.data, heading: 'New heading' }, 1)
    await nextTick()
    expect(first.text()).toContain('New heading')
    expect(
      first.get<HTMLInputElement>('.dn-array-table input').element.value,
    ).toBe('')
    expect(session.exportDocuments().data.sales[0]).toMatchObject({
      month: 'January',
    })
    first.unmount()
    const second = mount(PreviewWidget, {
      props: { tree: tree(), materials, document: session },
    })
    try {
      const input = second.get<HTMLInputElement>('.dn-array-table input')
      expect(input.element.value).toBe('')
      await input.setValue('January adjusted')
      await vi.waitFor(() =>
        expect(second.text()).toContain('January adjusted'),
      )
      await expect(session.form.submit()).resolves.toMatchObject({
        sales: [{ month: 'January adjusted' }, { month: 'February' }],
      })
    } finally {
      second.unmount()
      session.dispose()
    }
  })

  test('keeps a number being typed when the same value refreshes before blur', async () => {
    const session = createFormDocument({
      ui: {
        version: 1,
        nodes: [
          makeNode('amount', {
            kind: 'field',
            component: 'NumberPicker',
            bind: '/amount',
          }),
        ],
      },
      dataSchema: {
        type: 'object',
        properties: { amount: { type: 'number' } },
      },
      data: { amount: 10 },
    })
    const view = mount(PreviewWidget, {
      props: { tree: tree(), document: session },
      attachTo: window.document.body,
    })
    try {
      const input = view.get<HTMLInputElement>('input[role="spinbutton"]')
      input.element.focus()
      input.element.value = '17'
      await input.trigger('input')
      expect(session.form.values.amount).toBe(10)
      session.replaceData({ amount: 12 })
      await nextTick()
      expect(input.element.value).toBe('17')
      expect(session.conflicts).toEqual(['/amount'])
      await input.trigger('blur')
      expect(session.form.values.amount).toBe(17)
      expect(session.exportData().amount).toBe(12)
    } finally {
      view.unmount()
      session.dispose()
    }
  })

  test('checks enum values and graph-specific rules before accepting a revision', () => {
    const initial = documents()
    const row = initial.dataSchema.$defs as Record<
      string,
      { properties: Record<string, object> }
    >
    row.sale.properties.month = {
      type: 'string',
      enum: ['January', 'February'],
    }
    const session = createFormDocument(initial)
    expect(() =>
      session.applyPatch({
        baseRevision: 0,
        revision: 1,
        operations: [{ op: 'replace', path: '/sales/0/month', value: 'March' }],
      }),
    ).toThrow('/sales/0/month')
    session.dispose()

    const timeline = documents()
    timeline.ui.nodes = [
      makeNode('timeline', {
        component: 'TimelineChart',
        props: { xKey: 'label', startKey: 'start', endKey: 'end' },
        bindings: { rows: { path: '/events' } },
      }),
    ]
    timeline.dataSchema = {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              start: { type: 'number' },
              end: { type: 'number' },
            },
          },
        },
      },
    }
    timeline.data = { events: [{ label: 'Event', start: 5, end: 1 }] }
    expect(() => createFormDocument(timeline)).toThrow(
      /TimelineChart.*dateOrder/u,
    )
  })

  test('applies three independently edited documents from the JSON panel', async () => {
    const apply = vi.fn()
    const view = mount(DocumentEditorWidget, {
      props: {
        tree: tree(),
        documents: documents(),
        onApply: apply,
        onCanvas: vi.fn(),
      },
    })
    try {
      await view.get('select').setValue('data')
      const changed = { ...documents().data, heading: 'Imported' }
      await view.get('textarea').setValue(JSON.stringify(changed))
      await view
        .findAll('button')
        .find((button) => button.text() === 'Apply to preview')
        .trigger('click')
      expect(apply).toHaveBeenCalledWith({ ...documents(), data: changed })
    } finally {
      view.unmount()
    }
  })
})
