import { TreeNode } from '@formivue-design/core'
import {
  compileFormDocuments,
  createDocumentContractRegistry,
  createFormDocument,
  createFormDocumentProject,
  createFormDocumentVariant,
  exportFormDocumentVariant,
  reconcileFormDocumentProject,
  renameFormDocumentProperty,
  moveFormDocumentProperty,
  prepareFormDocumentReconciliation,
  parseFormDocuments,
  stringifyFormDocuments,
  splitFormSchema,
  transformToFormDocuments,
  type FormDocuments,
  type UiDocumentNode,
} from '@formivue-design/formivue-transformer'
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
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
const contracts = createDocumentContractRegistry([
  advancedDocumentContracts,
  chartDocumentContracts,
])
const createDocument = (documents: FormDocuments) =>
  createFormDocument(documents, { contracts })

function filteredDocuments() {
  const initial = documents()
  const filters = [
    {
      column: 'ordered',
      operation: 'dateRange',
      valueBinding: { path: '/selection/period' },
    },
    {
      column: 'status',
      operation: 'matches',
      valueBinding: { path: '/selection/status' },
    },
  ]
  initial.ui.nodes.unshift(
    makeNode('selection', {
      kind: 'object',
      bind: '/selection',
      children: [
        makeNode('period', {
          kind: 'field',
          component: 'DatePicker.RangePicker',
          bind: '/period',
        }),
        makeNode('status', {
          kind: 'field',
          component: 'Select',
          bind: '/status',
          options: [
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
          ],
        }),
      ],
    }),
  )
  const chart = initial.ui.nodes.find(({ id }) => id === 'chart')
  chart.props.filters = filters
  initial.ui.nodes.push(
    makeNode('donut', {
      component: 'DonutChart',
      props: { xKey: 'status', valueKey: 'amount', filters },
      bindings: { rows: { path: '/sales' } },
    }),
  )
  initial.dataSchema.properties.selection = {
    type: 'object',
    properties: {
      period: {
        type: 'array',
        items: { type: 'string', format: 'date' },
      },
      status: { type: 'string', enum: ['paid', 'pending'] },
    },
  }
  const definitions = initial.dataSchema.$defs as Record<
    string,
    { properties: Record<string, object> }
  >
  Object.assign(definitions.sale.properties, {
    ordered: { type: 'string', format: 'date' },
    status: { type: 'string', enum: ['paid', 'pending'] },
  })
  initial.data.selection = {
    period: ['2026-01-01', '2026-01-31'],
    status: 'paid',
  }
  initial.data.sales = [
    {
      id: '1',
      month: 'January',
      ordered: '2026-01-01',
      status: 'paid',
      amount: 10,
    },
    {
      id: '2',
      month: 'January',
      ordered: '2026-01-08',
      status: 'pending',
      amount: 5,
    },
    {
      id: '3',
      month: 'February',
      ordered: '2026-02-01',
      status: 'pending',
      amount: 20,
    },
    {
      id: '4',
      month: 'February',
      ordered: '2026-02-02',
      status: 'paid',
      amount: 30,
    },
  ]
  return initial
}

describe('separate UI, schema and data documents', () => {
  test('uses a session-local contract to migrate and compile a custom component', () => {
    const registry = createDocumentContractRegistry([
      {
        name: 'meter',
        components: {
          Meter: {
            kind: 'field',
            types: ['number'],
            bindings: { unit: { required: true, types: ['string'] } },
          },
        },
      },
    ])
    const migrated = splitFormSchema(
      {
        schema: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              default: 12,
              'x-component': 'Meter',
              'x-component-props': { unit: 'kg' },
            },
          },
        },
      },
      undefined,
      { contracts: registry },
    )
    const [node] = migrated.ui.nodes
    const unitPath = `/${node.id}-unit`
    expect(node.bindings).toEqual({ unit: { path: unitPath } })
    const compiled = compileFormDocuments(migrated, { contracts: registry })
    expect(compiled.diagnostics).toEqual([])
    expect(compiled.dependencies).toEqual([
      {
        componentId: node.id,
        property: 'bind',
        path: ['amount'],
        types: ['number'],
      },
      {
        componentId: node.id,
        property: 'unit',
        path: [unitPath.slice(1)],
        types: ['string'],
      },
    ])
    expect(compiled.schema.properties.amount['x-component-props']).toEqual({
      unit: `{{ $document.read("${unitPath}") }}`,
    })
    expect(() => compileFormDocuments(migrated)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: 'missing_component_contract',
            componentId: node.id,
            severity: 'warning',
          }),
          expect.objectContaining({
            code: 'missing_binding_types',
            property: 'unit',
            severity: 'error',
          }),
        ]),
      }),
    )

    node.bindings.unit.path = '/missing'
    expect(() =>
      compileFormDocuments(migrated, { contracts: registry }),
    ).toThrow(
      expect.objectContaining({
        issues: [
          expect.objectContaining({
            code: 'missing_data_path',
            componentId: node.id,
            path: '/missing',
            property: 'unit',
            severity: 'error',
          }),
        ],
      }),
    )
  })

  test('rejects an extension that redeclares a standard contract', () => {
    expect(() =>
      createDocumentContractRegistry([
        {
          name: 'duplicate',
          components: { Input: { kind: 'field', types: ['string'] } },
        },
      ]),
    ).toThrow(
      expect.objectContaining({
        issues: [
          expect.objectContaining({
            code: 'duplicate_component_contract',
            path: '/extensions/duplicate/Input',
            severity: 'error',
          }),
        ],
      }),
    )
  })

  test('the advanced contract resolves branch dependencies during migration and compilation', () => {
    const registry = createDocumentContractRegistry([advancedDocumentContracts])
    const migrated = splitFormSchema(
      {
        schema: {
          type: 'object',
          properties: {
            route: {
              type: 'string',
              default: 'skip',
              'x-component': 'Input',
            },
            step: {
              type: 'void',
              'x-component': 'StepperStep',
              'x-component-props': {
                branches: [{ path: 'route', equals: 'skip', next: 'review' }],
              },
            },
          },
        },
      },
      undefined,
      { contracts: registry },
    )
    const [branch] = migrated.ui.nodes[1].props.branches as { path: string }[]
    expect(branch.path).toBe('/route')
    const compiled = compileFormDocuments(migrated, { contracts: registry })
    expect(compiled.dependencies).toContainEqual({
      componentId: migrated.ui.nodes[1].id,
      property: 'branches[0].path',
      path: ['route'],
      types: ['string'],
    })
    expect(
      compiled.schema.properties.step['x-component-props'].branches,
    ).toEqual([{ path: ['route'], equals: 'skip', next: 'review' }])
    branch.path = '/unknown'
    expect(() =>
      compileFormDocuments(migrated, { contracts: registry }),
    ).toThrow(
      expect.objectContaining({
        issues: [
          expect.objectContaining({
            code: 'missing_data_path',
            component: 'StepperStep',
            property: 'branches[0].path',
            path: '/unknown',
          }),
        ],
      }),
    )
  })

  test('generates the schema for objects, editable rows and display-only columns from ui.json', () => {
    const initial = documents()
    initial.ui.nodes.push(
      makeNode('preferences', {
        kind: 'object',
        component: 'Object',
        bind: '/preferences',
        children: [
          makeNode('detail', {
            kind: 'field',
            component: 'Switch',
            bind: '/detail',
            field: { title: 'Show details' },
          }),
        ],
      }),
    )
    const uiJson = JSON.stringify(initial.ui)
    const project = createFormDocumentProject(JSON.parse(uiJson), { contracts })
    expect(project.base.ui).toEqual(initial.ui)
    expect(project.base.dataSchema.properties).toMatchObject({
      preferences: {
        type: 'object',
        properties: { detail: { type: 'boolean', title: 'Show details' } },
      },
      sales: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: ['string', 'number'] },
            month: { type: 'string' },
            amount: { type: 'number' },
          },
        },
      },
    })
    const variant = createFormDocumentVariant(project, 'Generated')
    const exported = exportFormDocumentVariant(variant, 'Generated', {
      contracts,
    })
    expect(parseFormDocuments(stringifyFormDocuments(exported))).toEqual(
      project.base,
    )
  })

  test('round-trips independent variants with renamed columns and row keys', async () => {
    const measures = {
      getComputedTextLength: () => 24,
      getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
    }
    for (const [key, value] of Object.entries(measures))
      Object.defineProperty(SVGElement.prototype, key, {
        configurable: true,
        value,
      })

    const initial = parseFormDocuments(stringifyFormDocuments(documents()))
    initial.dataSchema.properties.secondary =
      initial.dataSchema.properties.sales
    initial.data.secondary = [{ id: 'extra', month: 'March', amount: 99 }]
    const project = createFormDocumentVariant(
      createFormDocumentProject(initial, { contracts }),
      'API',
    )
    const renamed = renameFormDocumentProperty(
      project,
      'API',
      {
        path: ['sales', null, 'month'],
        key: 'period',
      },
      { contracts },
    )
    expect(renamed.impact).toEqual({
      from: '/sales/*/month',
      to: '/sales/*/period',
      componentIds: ['month', 'table', 'chart'],
    })
    const withId = renameFormDocumentProperty(
      renamed.project,
      'API',
      {
        path: ['sales', null, 'id'],
        key: 'sale_id',
      },
      { contracts },
    ).project
    const duplicated = createFormDocumentVariant(withId, 'Copy', 'API')
    const withNewAmount = renameFormDocumentProperty(
      duplicated,
      'Copy',
      {
        path: ['sales', null, 'amount'],
        key: 'sales_amount',
      },
      { contracts },
    ).project
    const api = exportFormDocumentVariant(withNewAmount, 'API', { contracts })
    const copy = exportFormDocumentVariant(withNewAmount, 'Copy', { contracts })
    expect(exportFormDocumentVariant(project, 'API', { contracts })).toEqual(
      initial,
    )
    expect(api.data.sales[0]).toEqual({
      sale_id: 'jan',
      period: 'January',
      amount: 10,
    })
    expect(copy.data.sales[0]).toEqual({
      sale_id: 'jan',
      period: 'January',
      sales_amount: 10,
    })
    expect(copy.data.secondary).toEqual(initial.data.secondary)
    expect(copy.dataSchema.$defs).toEqual(initial.dataSchema.$defs)
    expect(copy.dataSchema.properties.sales).toMatchObject({
      items: {
        allOf: [
          {
            required: ['sale_id', 'period', 'sales_amount'],
            properties: { period: { minLength: 1 } },
          },
        ],
      },
    })
    expect(copy.ui.nodes[0].rowKey).toBe('sale_id')
    expect(copy.ui.nodes[0].item.children[0].children[0]).toMatchObject({
      id: 'month',
      key: 'month',
      bind: '/period',
    })
    expect(copy.ui.nodes[2].props).toMatchObject({
      xKey: 'period',
      series: [{ key: 'sales_amount' }],
    })

    const portable = parseFormDocuments(stringifyFormDocuments(copy))
    const imported = createFormDocumentVariant(
      createFormDocumentProject(portable, { contracts }),
      'Imported',
    )
    expect(
      exportFormDocumentVariant(imported, 'Imported', { contracts }),
    ).toEqual(copy)
    const document = createDocument(portable)
    const view = mount(PreviewWidget, {
      props: { tree: tree(), materials, document },
    })
    try {
      const inputs = () =>
        view.findAll<HTMLInputElement>('.dn-array-table input')
      await vi.waitFor(() =>
        expect(inputs().map(({ element }) => element.value)).toEqual([
          'January',
          'February',
        ]),
      )
      const jan = document.form.query(['sales', '0', 'period']).take()
      expect(view.get('figure tbody').text()).toContain('January10')
      document.replaceData({
        ...portable.data,
        sales: [
          ...(portable.data.sales as Array<Record<string, string | number>>),
        ].reverse(),
      })
      await vi.waitFor(() => expect(inputs()[1].element.value).toBe('January'))
      expect(document.form.query(['sales', '1', 'period']).take()).toBe(jan)
      await inputs()[1].setValue('Edited January')
      await vi.waitFor(() =>
        expect(view.get('figure tbody').text()).toContain('Edited January10'),
      )
      const published = document.exportData()
      document.replaceData({
        ...published,
        sales: [(published.sales as Array<Record<string, string | number>>)[1]],
      })
      await vi.waitFor(() =>
        expect(inputs().map(({ element }) => element.value)).toEqual([
          'Edited January',
        ]),
      )
    } finally {
      view.unmount()
      document.dispose()
      for (const key of Object.keys(measures))
        Reflect.deleteProperty(SVGElement.prototype, key)
    }
  })

  test('keeps two charts and their tables filtered after renaming and reimport', async () => {
    const initial = filteredDocuments()
    const generated = createFormDocumentProject(initial.ui, { contracts })
    expect(generated.base.dataSchema.properties.selection).toMatchObject({
      properties: {
        period: { type: 'array', items: { type: 'string' } },
        status: { enum: ['paid', 'pending'] },
      },
    })
    const project = createFormDocumentVariant(
      createFormDocumentProject(initial, { contracts }),
      'API',
    )
    const renamed = [
      { path: ['sales', null, 'status'], key: 'state' },
      { path: ['sales', null, 'amount'], key: 'net' },
      { path: ['selection', 'status'], key: 'selected' },
    ].reduce(
      (current, rename) =>
        renameFormDocumentProperty(current, 'API', rename, { contracts })
          .project,
      project,
    )
    const exported = exportFormDocumentVariant(renamed, 'API', { contracts })
    const files = stringifyFormDocuments(exported)
    const imported = parseFormDocuments(files)
    for (const id of ['chart', 'donut']) {
      const node = imported.ui.nodes.find((node) => node.id === id)
      expect(node.bindings.rows).toEqual({ path: '/sales' })
      expect(node.props.filters).toEqual([
        {
          column: 'ordered',
          operation: 'dateRange',
          valueBinding: { path: '/selection/period' },
        },
        {
          column: 'state',
          operation: 'matches',
          valueBinding: { path: '/selection/selected' },
        },
      ])
    }
    expect(files.ui).not.toContain('{{')
    const compiled = compileFormDocuments(imported, { contracts })
    expect(compiled.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          componentId: 'chart',
          property: 'filters[1].column',
          path: ['sales', null, 'state'],
        }),
        expect.objectContaining({
          componentId: 'donut',
          property: 'filters[1].valueBinding',
          path: ['selection', 'selected'],
        }),
      ]),
    )

    const measures = {
      getComputedTextLength: () => 24,
      getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
    }
    for (const [key, value] of Object.entries(measures))
      Object.defineProperty(SVGElement.prototype, key, {
        configurable: true,
        value,
      })
    const document = createDocument(imported)
    const view = mount(PreviewWidget, {
      props: { tree: tree(), materials, document },
    })
    const chartTables = () =>
      view
        .findAll('figure')
        .map((figure) =>
          figure
            .findAll('tbody tr')
            .map((row) => row.findAll('td').map((cell) => cell.text())),
        )
    try {
      expect(view.find('button[data-slot="range-picker"]').exists()).toBe(true)
      expect(view.get('button[role="combobox"]').text()).toContain('Paid')
      await vi.waitFor(() => {
        expect(chartTables()).toEqual([[['January', '10']], [['paid', '10']]])
        expect(view.findAll('figure svg').length).toBeGreaterThanOrEqual(2)
      })
      document.form.setValuesIn(['selection', 'selected'], 'pending')
      await vi.waitFor(() =>
        expect(chartTables()).toEqual([[['January', '5']], [['pending', '5']]]),
      )
      document.form.setValuesIn(
        ['selection', 'period'],
        ['2026-02-01', '2026-02-28'],
      )
      await vi.waitFor(() =>
        expect(chartTables()).toEqual([
          [['February', '20']],
          [['pending', '20']],
        ]),
      )
      expect(document.exportData().sales).toEqual(imported.data.sales)
      expect(view.findAll('.dn-array-table tbody tr')).toHaveLength(4)
      expect(
        view.findAll('table[aria-label="Data table"] tbody tr'),
      ).toHaveLength(4)
      document.form.setValuesIn(['sales', '2', 'net'], 25)
      await vi.waitFor(() =>
        expect(chartTables()).toEqual([
          [['February', '25']],
          [['pending', '25']],
        ]),
      )
      expect(document.exportData().sales[0]).toEqual(imported.data.sales[0])
    } finally {
      view.unmount()
      document.dispose()
      for (const key of Object.keys(measures))
        Reflect.deleteProperty(SVGElement.prototype, key)
    }
  })

  test('moves root and row fields and recalculates filtered chart and table data after import', async () => {
    const initial = filteredDocuments()
    const rowSchema = (
      initial.dataSchema.$defs as Record<string, FormDocuments['dataSchema']>
    ).sale
    initial.dataSchema.properties.sales = { type: 'array', items: rowSchema }
    delete initial.dataSchema.$defs
    initial.ui.nodes.find(({ id }) => id === 'heading').key = 'headingBadge'
    const sales = initial.ui.nodes.find(({ id }) => id === 'sales')
    sales.item.children.push(
      makeNode('amountColumn', {
        component: 'ArrayTable.Column',
        props: { title: 'Amount' },
        children: [
          makeNode('amount', {
            kind: 'field',
            component: 'NumberPicker',
            bind: '/amount',
          }),
        ],
      }),
    )
    initial.ui.nodes.push(
      makeNode('profile', {
        kind: 'object',
        bind: '/profile',
        children: [
          makeNode('profileName', {
            kind: 'field',
            component: 'Input',
            bind: '/owner',
          }),
        ],
      }),
      makeNode('headingInput', {
        kind: 'field',
        component: 'Input',
        bind: '/heading',
      }),
    )
    initial.dataSchema.properties.profile = {
      type: 'object',
      properties: { owner: { type: 'string' } },
    }
    initial.data.profile = { owner: 'Alice' }
    const project = createFormDocumentVariant(
      createFormDocumentProject(initial, { contracts }),
      'API',
    )
    const heading = moveFormDocumentProperty(
      project,
      'API',
      { path: ['heading'], to: ['profile', 'heading'] },
      { contracts },
    )
    expect(heading.impact.createdObjects).toEqual([])
    const filter = moveFormDocumentProperty(
      heading.project,
      'API',
      { path: ['selection', 'status'], to: ['choices', 'status'] },
      { contracts },
    )
    const amount = moveFormDocumentProperty(
      filter.project,
      'API',
      {
        path: ['sales', null, 'amount'],
        to: ['sales', null, 'metrics', 'amount'],
      },
      { contracts },
    )
    expect(amount.impact.createdObjects).toEqual(['/sales/*/metrics'])
    expect(amount.impact.componentIds).toEqual(
      expect.arrayContaining(['amount', 'chart', 'donut', 'table']),
    )
    const status = moveFormDocumentProperty(
      amount.project,
      'API',
      {
        path: ['sales', null, 'status'],
        to: ['sales', null, 'metrics', 'status'],
      },
      { contracts },
    )
    const portable = parseFormDocuments(
      stringifyFormDocuments(
        exportFormDocumentVariant(status.project, 'API', { contracts }),
      ),
    )
    expect(portable.data.profile).toEqual({ owner: 'Alice', heading: 'Sales' })
    expect(portable.data.heading).toBeUndefined()
    expect(portable.data.sales[0]).toMatchObject({
      id: '1',
      metrics: { amount: 10, status: 'paid' },
    })
    expect(portable.data.sales[0]).not.toHaveProperty('amount')
    expect(
      portable.ui.nodes.find(({ id }) => id === 'chart').bindings.rows,
    ).toEqual({
      path: '/sales',
      columnPaths: { amount: '/metrics/amount', status: '/metrics/status' },
    })
    expect(
      portable.ui.nodes.find(({ id }) => id === 'chart').props.filters[1],
    ).toMatchObject({
      valueBinding: { path: '/choices/status' },
    })
    expect(exportFormDocumentVariant(project, 'API', { contracts })).toEqual(
      initial,
    )

    const measures = {
      getComputedTextLength: () => 24,
      getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
    }
    for (const [key, value] of Object.entries(measures))
      Object.defineProperty(SVGElement.prototype, key, {
        configurable: true,
        value,
      })
    const document = createDocument(portable)
    const view = mount(PreviewWidget, {
      props: { tree: tree(), materials, document },
    })
    try {
      expect(document.form.query(['profile', 'heading']).take()).toBeDefined()
      const cell = document.form
        .query(['sales', '0', 'metrics', 'amount'])
        .take()
      expect(cell).toBeDefined()
      const chart = () => view.get('figure tbody').text()
      const table = () =>
        view.get('table[aria-label="Data table"] tbody').text()
      await vi.waitFor(() => expect(chart()).toContain('January10'))
      document.form.setValuesIn(['sales', '0', 'metrics', 'amount'], 25)
      await vi.waitFor(() => {
        expect(chart()).toContain('January25')
        expect(table()).toContain('January25')
      })
      document.form.setValuesIn(['choices', 'status'], 'pending')
      await vi.waitFor(() => expect(chart()).toContain('January5'))
      const baseline = document.exportData()
      const rows = baseline.sales as unknown[]
      document.replaceData({
        ...baseline,
        sales: [rows[1], rows[0], ...rows.slice(2)],
      })
      await vi.waitFor(() =>
        expect(
          document.form.query(['sales', '1', 'metrics', 'amount']).take(),
        ).toBe(cell),
      )
      document.replaceData({
        ...document.exportData(),
        sales: [rows[0], ...rows.slice(2)],
      })
      await vi.waitFor(() =>
        expect(view.findAll('.dn-array-table tbody tr')).toHaveLength(3),
      )
      expect(document.exportData().sales[0]).toMatchObject({
        id: '1',
        metrics: { amount: 25 },
      })
    } finally {
      view.unmount()
      document.dispose()
      for (const key of Object.keys(measures))
        Reflect.deleteProperty(SVGElement.prototype, key)
    }
  })

  test('refuses collisions, cross-row moves and shared schema changes atomically', () => {
    const initial = documents()
    initial.dataSchema.properties.copy = initial.dataSchema.properties.sales
    initial.data.copy = initial.data.sales
    initial.data.metadata = { heading: 'Keep this value' }
    const project = createFormDocumentVariant(
      createFormDocumentProject(initial, { contracts }),
      'API',
    )
    const changes = [
      {
        path: ['heading'],
        to: ['sales'],
        code: 'schema_key_collision',
        issue: '/sales',
      },
      {
        path: ['heading'],
        to: ['metadata', 'heading'],
        code: 'data_key_collision',
        issue: '/metadata/heading',
      },
      {
        path: ['sales', null, 'amount'],
        to: ['copy', null, 'amount'],
        code: 'cross_record_move',
        issue: '/copy/*/amount',
      },
      {
        path: ['sales', null, 'amount'],
        to: ['sales', null, 'metrics', 'amount'],
        code: 'shared_schema_move',
        issue: '/sales/*',
      },
    ]
    for (const { path, to, code, issue } of changes) {
      expect(() =>
        moveFormDocumentProperty(project, 'API', { path, to }, { contracts }),
      ).toThrow(
        expect.objectContaining({
          issues: expect.arrayContaining([
            expect.objectContaining({ code, path: issue }),
          ]),
        }),
      )
      expect(exportFormDocumentVariant(project, 'API', { contracts })).toEqual(
        initial,
      )
    }
  })

  test('replays a variant move after the canvas renames a chart measure in a row', async () => {
    const initial = documents()
    const row = (
      initial.dataSchema.$defs as Record<string, FormDocuments['dataSchema']>
    ).sale
    initial.dataSchema.properties.sales = { type: 'array', items: row }
    delete initial.dataSchema.$defs
    initial.ui.nodes[0].item.children.push(
      makeNode('amountColumn', {
        component: 'ArrayTable.Column',
        children: [
          makeNode('amount', {
            kind: 'field',
            component: 'NumberPicker',
            bind: '/amount',
          }),
        ],
      }),
    )
    const base = createFormDocumentProject(initial, { contracts })
    const variant = createFormDocumentVariant(base, 'API')
    const moved = moveFormDocumentProperty(
      variant,
      'API',
      {
        path: ['sales', null, 'amount'],
        to: ['sales', null, 'metrics', 'amount'],
      },
      { contracts },
    ).project
    const canvas = renameFormDocumentProperty(
      createFormDocumentVariant(base, 'Canvas'),
      'Canvas',
      {
        path: ['sales', null, 'amount'],
        key: 'subtotal',
      },
      { contracts },
    ).project
    const revised = exportFormDocumentVariant(canvas, 'Canvas', { contracts })
    const review = prepareFormDocumentReconciliation(moved, revised, {
      contracts,
    })
    expect(review.changes).toMatchObject([
      { componentId: 'amount', kind: 'rename' },
    ])
    const result = review.resolve()
    expect(result.diagnostics).toEqual([])
    const imported = parseFormDocuments(
      stringifyFormDocuments(
        exportFormDocumentVariant(result.project, 'API', { contracts }),
      ),
    )
    expect(imported.data.sales[0]).toMatchObject({
      id: 'jan',
      metrics: { amount: 10 },
    })
    const chart = imported.ui.nodes.find(({ id }) => id === 'chart')
    expect(chart.props.series).toEqual([{ key: 'subtotal' }])
    expect(chart.bindings.rows.columnPaths).toEqual({
      subtotal: '/metrics/amount',
    })
    const document = createDocument(imported)
    try {
      const projected = () =>
        document.scope.$document.read('/sales', [], {
          subtotal: ['metrics', 'amount'],
        })
      expect(projected()[0]).toMatchObject({ subtotal: 10 })
      document.form.setValuesIn(['sales', '0', 'metrics', 'amount'], 24)
      await vi.waitFor(() =>
        expect(projected()[0]).toMatchObject({ subtotal: 24 }),
      )
    } finally {
      document.dispose()
    }
  })

  test('normalizes legacy filter expressions on import and diagnoses incompatible chart bindings', () => {
    const initial = filteredDocuments()
    const chart = initial.ui.nodes.find(({ id }) => id === 'chart')
    chart.props.filters[1] = {
      column: 'status',
      operation: 'matches',
      value: '{{ $form.getValuesIn(["selection","status"]) }}',
    }
    const imported = parseFormDocuments(stringifyFormDocuments(initial))
    const document = createDocument(imported)
    try {
      expect(
        document.exportDocuments().ui.nodes.find(({ id }) => id === 'chart')
          .props.filters[1],
      ).toEqual({
        column: 'status',
        operation: 'matches',
        valueBinding: { path: '/selection/status' },
      })
    } finally {
      document.dispose()
    }

    chart.props.filters[0].valueBinding.path = '/selection/status'
    chart.props.filters[1].column = 'missing'
    const donut = initial.ui.nodes.find(({ id }) => id === 'donut')
    donut.props.filters = [
      {
        column: 'status',
        operation: 'matches',
        valueBinding: { path: '/selection/missing' },
      },
    ]
    expect(() => compileFormDocuments(initial, { contracts })).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_chart_filter',
            path: '/selection/status',
            property: 'filters[0].valueBinding',
          }),
          expect.objectContaining({
            code: 'incompatible_column',
            path: '/sales/*/missing',
            property: 'filters[1].column',
          }),
          expect.objectContaining({
            code: 'missing_data_path',
            path: '/selection/missing',
            property: 'filters[0].valueBinding',
          }),
        ]),
      }),
    )
  })

  test('reports rename collisions and reconciles compatible edits to the canvas', () => {
    const initial = documents()
    initial.data.sales[0].code = 'collision'
    const project = createFormDocumentVariant(
      createFormDocumentProject(initial, { contracts }),
      'API',
    )
    for (const [key, code] of [
      ['amount', 'schema_key_collision'],
      ['code', 'data_key_collision'],
    ]) {
      expect(() =>
        renameFormDocumentProperty(
          project,
          'API',
          { path: ['sales', null, 'month'], key },
          { contracts },
        ),
      ).toThrow(
        expect.objectContaining({
          issues: [expect.objectContaining({ code })],
        }),
      )
    }
    expect(exportFormDocumentVariant(project, 'API', { contracts })).toEqual(
      initial,
    )
    const candidate = renameFormDocumentProperty(
      project,
      'API',
      { path: ['sales', null, 'month'], key: 'period' },
      { contracts },
    ).project
    const revised = structuredClone(initial)
    revised.ui.nodes[2].props.label = 'Revised chart'
    const reconciled = reconcileFormDocumentProject(candidate, revised, {
      contracts,
    })
    expect(reconciled.diagnostics).toEqual([])
    expect(
      exportFormDocumentVariant(reconciled.project, 'API', { contracts }).ui
        .nodes[2].props,
    ).toMatchObject({ label: 'Revised chart', xKey: 'period' })

    const incompatible = structuredClone(revised)
    incompatible.ui.nodes[0].item.children[0].children[0].bind = '/otherMonth'
    const definitions = incompatible.dataSchema.$defs as {
      sale: { properties: Record<string, { type: string }> }
    }
    definitions.sale.properties.otherMonth = {
      type: 'string',
    }
    const rejected = reconcileFormDocumentProject(candidate, incompatible, {
      contracts,
    })
    expect(rejected.project).toBe(candidate)
    expect(rejected.diagnostics).toMatchObject([
      {
        variant: 'API',
        issues: [{ code: 'changed_ui_binding', componentId: 'month' }],
      },
    ])

    const rootRename = renameFormDocumentProperty(
      project,
      'API',
      {
        path: ['heading'],
        key: 'title',
      },
      { contracts },
    )
    const rootDocuments = parseFormDocuments(
      stringifyFormDocuments(
        exportFormDocumentVariant(rootRename.project, 'API', { contracts }),
      ),
    )
    expect(rootDocuments.data.title).toBe('Sales')
    expect(rootDocuments.dataSchema.required).toContain('title')
    expect(rootDocuments.ui.nodes[3].bindings.text.path).toBe('/title')
  })

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
    const document = createDocument(
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
    expect(() => createDocument(missing)).toThrow(/BarChart.*\/missing/u)
    const wrong = documents()
    wrong.ui.nodes[2].props.series = [{ key: 'month' }]
    expect(() => createDocument(wrong)).toThrow(
      /Column "month" must have type number/u,
    )
    const column = documents()
    column.ui.nodes[1].props.columns = [{ key: 'missing' }]
    expect(() => createDocument(column)).toThrow(/DataTable.*Column "missing"/u)
    const initial = documents()
    const session = createDocument(initial)
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
    for (const { palette, registry, renderers } of [
      { palette: standard, registry: undefined, renderers: Standard.Materials },
      {
        palette: advanced,
        registry: createDocumentContractRegistry([advancedDocumentContracts]),
        renderers: { ...Standard.Materials, ...AdvancedMaterials },
      },
      {
        palette: charts,
        registry: createDocumentContractRegistry([chartDocumentContracts]),
        renderers: { ...Standard.Materials, ...ChartMaterials },
      },
    ]) {
      for (const resource of palette) {
        const root = new TreeNode({
          componentName: 'Form',
          children: resource.node.children.map((node) => node.serialize()),
        })
        const migrated = transformToFormDocuments(root, undefined, {
          contracts: registry,
        })
        const session = createFormDocument(
          parseFormDocuments(stringifyFormDocuments(migrated)),
          {
            contracts: registry,
            hasComponent: (name) =>
              name
                .split('.')
                .reduce((value, key) => value?.[key], renderers as any) != null,
          },
        )
        expect(session.diagnostics).toEqual([])
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
    const session = createDocument(initial)
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
    const session = createDocument({
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
    const session = createDocument(initial)
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
    expect(() => createDocument(timeline)).toThrow(/TimelineChart.*dateOrder/u)
  })

  test('rejects cyclic Sankey flows, duplicate DataTable keys and unavailable branch choices', () => {
    const initial = documents()
    initial.dataSchema.properties.route = { type: 'string', enum: ['review'] }
    initial.data.route = 'review'
    initial.ui.nodes.push(
      makeNode('step', {
        component: 'QuestionnaireStep',
        props: { branches: [{ path: '/route', equals: 'skip', next: 'end' }] },
      }),
    )
    const hasIssue = (code: string, path: string) =>
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ code, path }),
        ]),
      })
    expect(() => compileFormDocuments(initial, { contracts })).toThrow(
      hasIssue('incompatible_branch_value', '/route'),
    )
    initial.ui.nodes.pop()
    const table = initial.ui.nodes.find(({ id }) => id === 'table')
    table.props.rowKey = 'month'
    initial.data.sales[1].month = 'January'
    expect(() => createDocument(initial)).toThrow(
      hasIssue('duplicate_table_row_key', '/sales/1/month'),
    )

    initial.dataSchema.properties.links = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          value: { type: 'number' },
        },
      },
    }
    initial.data.links = [{ from: 'A', to: 'B', value: 2 }]
    initial.data.sales[1].month = 'February'
    initial.ui.nodes.push(
      makeNode('sankey', {
        component: 'SankeyChart',
        props: { sourceKey: 'from', targetKey: 'to', valueKey: 'value' },
        bindings: { rows: { path: '/links' } },
      }),
    )
    const document = createDocument(initial)
    try {
      expect(() =>
        document.applyPatch({
          baseRevision: 0,
          revision: 1,
          operations: [
            {
              op: 'add',
              path: '/links/-',
              value: { from: 'B', to: 'A', value: 2 },
            },
          ],
        }),
      ).toThrow(hasIssue('cyclic_chart_flow', '/links'))
      expect(document.exportData().links).toEqual(initial.data.links)
    } finally {
      document.dispose()
    }
  })

  test('applies three independently edited documents from the JSON panel', async () => {
    const apply = vi.fn()
    const view = mount(DocumentEditorWidget, {
      props: {
        tree: tree(),
        documents: documents(),
        contracts,
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
