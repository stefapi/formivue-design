import {
  createDocumentContractRegistry,
  createFormDocument,
  createFormDocumentProject,
  materializeFormDocumentVariant,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { ChartSources } from '@formivue-design/charts-designer'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import { TreeNode } from '@formivue-design/core'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'
import { DataTable } from '@formivue-design/shadcn-advanced-designer'
import { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'
import { pointerSegments, type JsonObject } from '@formivue/json-schema'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import {
  useDocumentProject,
  type DocumentProjectOptions,
} from '@formivue-design/data-model'
import { localProjectPersistence } from '../service'
import { DataModelWidget } from '../widgets/DataModelWidget'
import { PreviewWidget } from '../widgets/PreviewWidget'

function openProject(
  key: string,
  documentOptions: DocumentProjectOptions['documentOptions'],
  applyPreview: DocumentProjectOptions['applyPreview'],
) {
  return useDocumentProject({
    documentOptions,
    applyPreview,
    persistence: localProjectPersistence(key),
  })
}

const svgMeasurements = {
  getComputedTextLength: () => 24,
  getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
  getTotalLength: () => 100,
  getPointAtLength: (length: number) => ({ x: length, y: 0 }),
}
beforeAll(() => {
  for (const [key, value] of Object.entries(svgMeasurements))
    Object.defineProperty(SVGElement.prototype, key, {
      configurable: true,
      value,
    })
})
afterAll(async () => {
  // Unovis throttles tooltip positioning for 500 ms, including after unmount.
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (const key of Object.keys(svgMeasurements))
    Reflect.deleteProperty(SVGElement.prototype, key)
})

const displayResources = [...Object.values(ChartSources).flat(), DataTable]
  .flatMap((chart) => chart.Resource)
  .map(({ node }) => ({
    component: node.children[0].props['x-component'],
    children: node.children.map((child) => child.serialize()),
  }))

test.each(displayResources)(
  'restores $component rows at their generated and variant paths',
  async ({ component, children }) => {
    const storage = 'test-formivue-rows-path-' + component
    const options = {
      contracts: createDocumentContractRegistry([
        chartDocumentContracts,
        advancedDocumentContracts,
      ]),
    }
    const emptyCanvas = new TreeNode({ componentName: 'Form' })
    const canvas = new TreeNode({ componentName: 'Form', children })
    const model = openProject(storage, options, vi.fn())
    try {
      model.generate(emptyCanvas)
      model.addVariant('API', false)
      model.generate(canvas)
      expect(model.reconciliation.value).toBeUndefined()
      const original = parseFormDocuments(model.files.value)
      const [key] = pointerSegments(original.ui.nodes[0].bindings.rows.path)
      expect(original.data[key]).not.toHaveLength(0)

      const deleted = parseFormDocuments(model.files.value)
      delete deleted.dataSchema.properties[key]
      delete deleted.data[key]
      model.edit(stringifyFormDocuments(deleted))
      model.generate(canvas)
      expect(parseFormDocuments(model.files.value)).toEqual(original)

      const columns = (
        original.dataSchema.properties[key] as FormDocuments['dataSchema']
      ).items as FormDocuments['dataSchema']
      const [column] = Object.keys(columns.properties)
      expect(
        model.reviewMove({ path: [key], to: ['metrics', 'series'] }).confirm(),
      ).toBe(true)
      expect(
        model
          .reviewRename({
            path: ['metrics', 'series', null, column],
            key: 'primary',
          })
          .confirm(),
      ).toBe(true)
      const moved = parseFormDocuments(model.files.value)
      model.apply(moved)
      const edited = parseFormDocuments(model.files.value)
      const metrics = edited.dataSchema.properties
        .metrics as FormDocuments['dataSchema']
      delete metrics.properties.series
      delete (edited.data.metrics as JsonObject).series
      model.edit(stringifyFormDocuments(edited))
      model.generate(canvas)
      const restored = parseFormDocuments(model.files.value)
      expect(restored).toEqual(moved)
      const document = createFormDocument(restored, options)
      const view = mount(PreviewWidget, {
        props: {
          tree: canvas,
          materials: { ...ChartMaterials, ...AdvancedMaterials },
          document,
        },
      })
      try {
        const rows =
          component === 'DataTable' ? 'table tbody tr' : 'figure tbody tr'
        await vi.waitFor(() =>
          expect(view.findAll(rows).length).toBeGreaterThan(0),
        )
      } finally {
        view.unmount()
        document.dispose()
      }
    } finally {
      localStorage.removeItem(storage)
    }
  },
)

test.each([false, true])(
  'restores a deleted field from the applied variant (draft move: %s)',
  (moved) => {
    const storage = 'test-formivue-restore-variant-settings-' + moved
    const canvas = new TreeNode({
      componentName: 'Form',
      children: [
        {
          id: 'account',
          componentName: 'Field',
          props: {
            name: 'account',
            type: 'string',
            default: 'BASE-1',
            'x-component': 'Input',
          },
        },
      ],
    })
    const model = openProject(storage, {}, (documents) =>
      createFormDocument(documents).dispose(),
    )
    const rule = { type: 'string', pattern: '^[A-Z]+-[0-9]+$', readOnly: true }
    try {
      model.generate(canvas)
      model.addVariant('Customer API', false)
      expect(
        model.reviewRename({ path: ['account'], key: 'customer_id' }).confirm(),
      ).toBe(true)
      const applied = parseFormDocuments(model.files.value)
      applied.dataSchema.properties.customer_id = rule
      applied.dataSchema.required = ['customer_id']
      applied.data.customer_id = 'API-1'
      model.apply(applied)
      if (moved)
        expect(
          model
            .reviewMove({ path: ['customer_id'], to: ['customer', 'id'] })
            .confirm(),
        ).toBe(true)
      const draft = parseFormDocuments(model.files.value)
      const parentSchema = moved
        ? (draft.dataSchema.properties.customer as FormDocuments['dataSchema'])
        : draft.dataSchema
      const parentData = (
        moved ? draft.data.customer : draft.data
      ) as JsonObject
      const key = moved ? 'id' : 'customer_id'
      delete parentSchema.properties[key]
      delete parentSchema.required
      parentData[key] = 'TEST-42'
      model.edit(stringifyFormDocuments(draft))

      model.generate(canvas)
      expect(model.reconciliation.value).toBeUndefined()
      const restored = parseFormDocuments(model.files.value)
      const restoredParent = moved
        ? (restored.dataSchema.properties
            .customer as FormDocuments['dataSchema'])
        : restored.dataSchema
      expect(restoredParent.properties[key]).toEqual(rule)
      expect(restoredParent.required).toEqual([key])
      expect(restored.data).toEqual(draft.data)
      createFormDocument(restored).dispose()
    } finally {
      localStorage.removeItem(storage)
    }
  },
)

test('reconciles generated chart rows and restores deleted chart fields in drafts', async () => {
  const storage = 'test-formivue-chart-reconciliation'
  const options = {
    contracts: createDocumentContractRegistry([chartDocumentContracts]),
  }
  const rows = [{ city: 'Lyon', sales: 12 }]
  const customRows = [{ city: 'Paris', sales: 30 }]
  const rowsKey = 'sales-chart-rows'
  const rowsSchema = {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      properties: { city: { type: 'string' }, sales: { type: 'number' } },
    },
  } as const
  const canvas = new TreeNode({ componentName: 'Form' })
  let editor: VueWrapper | undefined
  try {
    const model = openProject(storage, options, vi.fn())
    model.generate(canvas)
    model.addVariant('API', false)
    model.edit({ ...model.files.value, data: '{"draftNote":"Keep me"}' })
    model.addVariant('Back office', false)
    const custom = parseFormDocuments(model.files.value)
    custom.dataSchema.properties[rowsKey] = rowsSchema
    custom.data[rowsKey] = customRows
    model.apply(custom)
    model.addVariant('Archive', false)
    model.choose('')

    const updated = new TreeNode({
      componentName: 'Form',
      children: [
        {
          id: 'report',
          componentName: 'Field',
          props: { name: 'report', type: 'object' },
          children: [
            {
              id: 'sales-chart',
              componentName: 'Field',
              props: {
                type: 'void',
                'x-component': 'BarChart',
                'x-component-props': {
                  rows,
                  xKey: 'city',
                  series: [{ key: 'sales' }],
                },
              },
            },
          ],
        },
      ],
    })
    model.generate(updated)
    model.reconciliation.value.selectChoice('Archive', 'report', 'defer')
    editor = mount(DataModelWidget, {
      props: {
        tree: updated,
        model,
        options,
        onGenerate: () => model.generate(updated),
        onImport: vi.fn(),
        onJson: vi.fn(),
        onNavigate: vi.fn(),
        componentLabel: vi.fn(),
      },
    })
    const button = (label: string) =>
      editor.findAll('button').find((button) => button.text() === label)
    await button('Apply reconciliation').trigger('click')
    expect(editor.text()).toContain('Variants reconciled')
    const { base, variants } = model.project.value
    const [api, backOffice, archive] = variants
    expect(api.dataSchema.properties[rowsKey]).toEqual(
      base.dataSchema.properties[rowsKey],
    )
    expect(api.data[rowsKey]).toEqual(rows)
    expect(backOffice.dataSchema.properties[rowsKey]).toEqual(rowsSchema)
    expect(backOffice.data[rowsKey]).toEqual(customRows)
    expect(archive.dataSchema.properties).not.toHaveProperty(rowsKey)
    expect(archive.data).not.toHaveProperty(rowsKey)

    await editor
      .get(`button[aria-label="Delete · ${rowsKey}"]`)
      .trigger('click')
    expect(editor.text()).not.toContain('Variants reconciled')
    expect(button('Apply to preview').attributes('disabled')).toBeDefined()

    model.choose('API')
    const draft = parseFormDocuments(model.files.value)
    expect(draft.data).toMatchObject({ draftNote: 'Keep me', [rowsKey]: rows })
    expect(draft.ui.nodes[0].children[0].bindings.rows.path).toBe('/' + rowsKey)
    createFormDocument(draft, options).dispose()

    // Removing a field in the schema editor leaves the test data intact.
    for (const name of ['', 'API']) {
      model.choose(name)
      const edited = parseFormDocuments(model.files.value)
      delete edited.dataSchema.properties[rowsKey]
      if (name) edited.data[rowsKey] = customRows
      else delete edited.data[rowsKey]
      model.edit(stringifyFormDocuments(edited))
    }
    await button('Generate from canvas').trigger('click')
    expect(model.reconciliation.value).toBeUndefined()
    expect(button('Apply to preview').attributes('disabled')).toBeUndefined()
    for (const name of ['', 'API']) {
      model.choose(name)
      const restored = parseFormDocuments(model.files.value)
      expect(restored.dataSchema.properties[rowsKey]).toEqual(
        base.dataSchema.properties[rowsKey],
      )
      expect(restored.data[rowsKey]).toEqual(name ? customRows : rows)
      createFormDocument(restored, options).dispose()
    }

    const incompatible = parseFormDocuments(model.files.value)
    incompatible.dataSchema.properties[rowsKey] = { type: 'string' }
    const incompatibleDraft = stringifyFormDocuments(incompatible)
    model.edit(incompatibleDraft)
    updated.append(
      new TreeNode({
        id: 'description',
        componentName: 'Field',
        props: { name: 'description', type: 'string', 'x-component': 'Input' },
      }),
    )
    model.generate(updated)
    const review = model.reconciliation.value
    const blocked = review.check(review.choices)
    expect(blocked.diagnostics.map(({ variant }) => variant)).toEqual(['API'])
    expect(blocked.diagnostics[0].issues).toContainEqual(
      expect.objectContaining({
        code: 'incompatible_rows',
        path: '/' + rowsKey,
      }),
    )
    expect(blocked.confirm()).toBe(false)
    expect(model.files.value).toEqual(incompatibleDraft)
  } finally {
    editor?.unmount()
    localStorage.removeItem(storage)
  }
})

test('reopens unconfirmed reconciliation choices from a project archive', () => {
  const sourceKey = 'test-reconciliation-archive-source'
  const targetKey = 'test-reconciliation-archive-target'
  const preview = vi.fn()
  const canvas = (changed: boolean) =>
    new TreeNode({
      componentName: 'Form',
      children: [
        {
          id: 'amount',
          componentName: 'Field',
          props: changed
            ? {
                name: 'amount',
                type: 'string',
                default: 'pending',
                'x-component': 'Input',
              }
            : {
                name: 'amount',
                type: 'number',
                default: 45,
                'x-component': 'NumberPicker',
              },
        },
      ],
    })
  try {
    const model = openProject(sourceKey, {}, preview)
    model.generate(canvas(false))
    model.addVariant('Adopt', false)
    model.addVariant('Retain', false)
    model.choose('Adopt')
    model.edit({ ...model.files.value, data: '{"amount":75}' })
    const draft = model.files.value
    const proposed = canvas(true)
    model.generate(proposed)
    model.reconciliation.value.selectChoice('Adopt', 'amount', 'adopt')
    const source = model.exportArchive(proposed.serialize())

    const target = openProject(targetKey, {}, preview)
    const archive = target.readArchive(source)
    const tree = new TreeNode(archive.canvas)
    target.importArchive(archive, tree)
    expect(target.selected.value).toBe('Adopt')
    expect(target.files.value).toEqual(draft)
    expect(target.project.value).toEqual(model.project.value)
    expect(target.project.value.base.data).toEqual({ amount: 45 })
    expect(preview).not.toHaveBeenCalled()

    const reloaded = openProject(targetKey, {}, preview)
    reloaded.restoreReconciliation(tree)
    const review = reloaded.reconciliation.value
    expect(review.choices).toEqual({
      Adopt: { amount: 'adopt' },
      Retain: { amount: 'retain' },
    })
    expect(review.stale).toBe(false)
    const result = review.check(review.choices)
    expect(result.diagnostics).toEqual([])
    expect(result.confirm()).toBe(true)
    expect(reloaded.reconciliation.value).toBeUndefined()
    expect(parseFormDocuments(reloaded.files.value).data).toEqual({
      amount: 'pending',
      amount_previous: 75,
    })
    reloaded.choose('Retain')
    expect(parseFormDocuments(reloaded.files.value).ui.nodes[0].component).toBe(
      'NumberPicker',
    )
    expect(
      reloaded.readArchive(reloaded.exportArchive(tree.serialize())).state
        .pendingReconciliation,
    ).toBeUndefined()

    proposed.children[0].setProps({ name: 'revised_amount' })
    const staleArchive = target.readArchive(
      model.exportArchive(proposed.serialize()),
    )
    target.importArchive(staleArchive, new TreeNode(staleArchive.canvas))
    const stale = target.reconciliation.value
    expect(stale.choices).toEqual(review.choices)
    expect(stale.stale).toBe(true)
    expect(stale.check(stale.choices).confirm()).toBe(false)
    expect(target.files.value).toEqual(draft)
    target.cancelReconciliation()
    expect(
      target.readArchive(target.exportArchive(staleArchive.canvas)).state
        .pendingReconciliation,
    ).toBeUndefined()
  } finally {
    localStorage.removeItem(sourceKey)
    localStorage.removeItem(targetKey)
  }
})

test('restores pending path changes and invalid JSON beside the last applied variant', () => {
  const storageKey = 'test-formivue-document-project'
  const base: FormDocuments = {
    ui: {
      version: 1,
      nodes: [
        {
          id: 'price-field',
          key: 'price',
          kind: 'field',
          component: 'NumberPicker',
          bind: '/price',
        },
      ],
    },
    dataSchema: { type: 'object', properties: { price: { type: 'number' } } },
    data: { price: 50 },
  }
  const preview = vi.fn((documents: FormDocuments) =>
    createFormDocument(documents).dispose(),
  )
  localStorage.removeItem(storageKey)
  try {
    const model = openProject(storageKey, {}, preview)
    model.install(createFormDocumentProject(base))
    model.addVariant('API', false)
    const review = model.reviewRename({ path: ['price'], key: 'total' })
    expect(review.impact.componentIds).toEqual(['price-field'])
    expect(review.confirm()).toBe(true)
    const renamed = parseFormDocuments(model.files.value)
    expect(renamed.data).toEqual({ total: 50 })
    model.apply(renamed)

    expect(
      model.reviewRename({ path: ['total'], key: 'amount' }).confirm(),
    ).toBe(true)
    expect(
      model
        .reviewMove({ path: ['amount'], to: ['billing', 'amount'] })
        .confirm(),
    ).toBe(true)
    model.edit({ ...model.files.value, data: '{ invalid JSON' })
    model.choose('')
    expect(parseFormDocuments(model.files.value)).toEqual(base)
    model.choose('API')

    const restored = openProject(storageKey, {}, preview)
    restored.restorePreview()
    expect(preview).toHaveBeenLastCalledWith(renamed)
    expect(restored.selected.value).toBe('API')
    expect(restored.files.value.data).toBe('{ invalid JSON')
    const prepared = parseFormDocuments({
      ...restored.files.value,
      data: '{"billing":{"amount":75}}',
    })
    expect(prepared.ui.nodes[0].bind).toBe('/billing/amount')
    restored.apply(prepared)
    expect(restored.hasDraft.value).toBe(false)
    expect(preview).toHaveBeenLastCalledWith(prepared)
    restored.addVariant('Copy', true)
    expect(parseFormDocuments(restored.files.value)).toEqual(prepared)
    restored.choose('')
    expect(restored.files.value).toEqual(stringifyFormDocuments(base))
  } finally {
    localStorage.removeItem(storageKey)
  }
})

test('reconciles a canvas rename while transporting moved variant data and its independent draft', () => {
  const storage = 'test-formivue-variant-reconciliation'
  const preview = vi.fn((documents: FormDocuments) =>
    createFormDocument(documents).dispose(),
  )
  const canvas = (name: string, component = 'NumberPicker') =>
    new TreeNode({
      componentName: 'Form',
      children: [
        {
          id: 'price-canvas-field',
          componentName: 'Field',
          props: {
            name,
            title: 'Order price',
            type: component === 'Input' ? 'string' : 'number',
            default: component === 'Input' ? '50' : 50,
            'x-component': component,
          },
        },
      ],
    })
  localStorage.removeItem(storage)
  try {
    const model = openProject(storage, {}, preview)
    model.generate(canvas('price'))
    model.addVariant('Portable', false)
    model.reviewMove({ path: ['price'], to: ['billing', 'price'] }).confirm()
    const applied = parseFormDocuments(model.files.value)
    const billing = applied.dataSchema.properties
      .billing as FormDocuments['dataSchema']
    billing.properties.price = { type: 'number', minimum: 10 }
    applied.data = { billing: { price: 60 } }
    model.apply(applied)
    model.addVariant('Follow', true)
    model.choose('Portable')
    const draft = parseFormDocuments(model.files.value)
    const draftBilling = draft.dataSchema.properties
      .billing as FormDocuments['dataSchema']
    draftBilling.properties.price = {
      type: 'number',
      minimum: 10,
      maximum: 90,
      description: 'Pending change',
    }
    draft.data = { billing: { price: 75 } }
    model.edit(stringifyFormDocuments(draft))
    const previous = model.project.value

    model.generate(canvas('subtotal', 'Input'))
    const typeReview = model.reconciliation.value
    expect(typeReview.changes).toMatchObject([
      { kind: 'type', to: ['subtotal'] },
    ])
    expect(typeReview.choices.Portable['price-canvas-field']).toBe('retain')
    expect(typeReview.check(typeReview.choices).diagnostics).toEqual([])
    model.cancelReconciliation()
    expect(model.project.value).toBe(previous)
    expect(parseFormDocuments(model.files.value)).toEqual(draft)

    model.generate(canvas('subtotal'))
    const review = model.reconciliation.value
    expect(review.changes).toMatchObject([
      {
        kind: 'rename',
        componentId: 'price-canvas-field',
        from: ['price'],
        to: ['subtotal'],
      },
    ])
    expect(review.choices.Portable['price-canvas-field']).toBe('keep')
    const ready = review.check({
      ...review.choices,
      Follow: { 'price-canvas-field': 'follow' },
    })
    expect(ready.diagnostics).toEqual([])
    expect(model.project.value).toBe(previous)
    expect(ready.confirm()).toBe(true)
    expect(model.project.value.base.ui.nodes[0].bind).toBe('/subtotal')
    expect(model.project.value.variants[0]).toMatchObject({
      renames: [{ path: ['subtotal'], to: ['billing', 'price'] }],
      data: { billing: { price: 60 } },
    })
    expect(model.project.value.variants[1]).toMatchObject({
      data: { billing: { subtotal: 60 } },
      dataSchema: {
        properties: { billing: { properties: { subtotal: { minimum: 10 } } } },
      },
    })
    expect(model.hasDraft.value).toBe(true)
    const json = model.files.value
    const transported = parseFormDocuments(JSON.parse(JSON.stringify(json)))
    expect(transported.data).toEqual(draft.data)
    expect(transported.dataSchema).toEqual(draft.dataSchema)
    expect(transported.ui.nodes[0]).toMatchObject({
      id: 'price-canvas-field',
      bind: '/billing/price',
    })
    const runtime = createFormDocument(transported)
    try {
      expect(runtime.form.getValuesIn(['billing', 'price'])).toBe(75)
      expect(runtime.schema).toMatchObject({
        properties: {
          billing: {
            properties: {
              price: { 'x-component-props': { min: 10, max: 90 } },
            },
          },
        },
      })
    } finally {
      runtime.dispose()
    }
    model.edit(JSON.parse(JSON.stringify(json)))
    const restored = openProject(storage, {}, preview)
    restored.restorePreview()
    expect(preview).toHaveBeenCalledTimes(2)
    expect(preview).toHaveBeenLastCalledWith(applied)
    expect(restored.hasDraft.value).toBe(true)
    expect(parseFormDocuments(restored.files.value)).toEqual(transported)
  } finally {
    localStorage.removeItem(storage)
  }
})

test('resolves additions, removals and type changes independently across exported variants', () => {
  const storage = 'test-formivue-structural-reconciliation'
  const importedStorage = storage + '-imported'
  const preview = vi.fn((documents: FormDocuments) =>
    createFormDocument(documents).dispose(),
  )
  const canvas = (changed: boolean) =>
    new TreeNode({
      componentName: 'Form',
      children: [
        {
          id: 'amount',
          componentName: 'Field',
          props: changed
            ? {
                name: 'amount',
                type: 'string',
                default: 'pending',
                'x-component': 'Input',
              }
            : {
                name: 'amount',
                type: 'number',
                default: 50,
                'x-component': 'NumberPicker',
              },
        },
        {
          id: changed ? 'status' : 'reference',
          componentName: 'Field',
          props: changed
            ? {
                name: 'status',
                type: 'string',
                default: 'open',
                'x-component': 'Input',
              }
            : {
                name: 'reference',
                type: 'string',
                default: 'A-10',
                'x-component': 'Input',
              },
        },
      ],
    })
  try {
    const model = openProject(storage, {}, preview)
    model.generate(canvas(false))
    model.addVariant('API', false)
    expect(
      model
        .reviewMove({ path: ['amount'], to: ['billing', 'amount'] })
        .confirm(),
    ).toBe(true)
    const applied = parseFormDocuments(model.files.value)
    const billing = applied.dataSchema.properties
      .billing as FormDocuments['dataSchema']
    billing.properties.amount = { type: 'number', minimum: 10 }
    billing.properties.amount_previous = { type: 'number' }
    billing.additionalProperties = false
    applied.dataSchema.properties.status = { type: 'number', maximum: 20 }
    applied.data = {
      billing: { amount: 60, amount_previous: 42 },
      reference: 'A-11',
      status: 7,
    }
    model.apply(applied)
    model.addVariant('Historical', true)
    model.choose('API')
    const draft = parseFormDocuments(model.files.value)
    const draftBilling = draft.dataSchema.properties
      .billing as FormDocuments['dataSchema']
    draftBilling.properties.amount = {
      type: 'number',
      minimum: 10,
      maximum: 90,
    }
    draft.data = {
      ...draft.data,
      billing: { amount: 75, amount_previous: 42 },
      reference: 'A-12',
    }
    model.edit(stringifyFormDocuments(draft))

    model.generate(canvas(true))
    const review = model.reconciliation.value
    expect(
      review.changes.map(({ kind, componentId }) => [kind, componentId]),
    ).toEqual([
      ['type', 'amount'],
      ['removed', 'reference'],
      ['added', 'status'],
    ])
    const blocked = review.check({
      API: { amount: 'adopt', reference: 'detach', status: 'add' },
      Historical: { amount: 'retain', reference: 'retain', status: 'defer' },
    })
    expect(blocked.diagnostics).toMatchObject([
      { variant: 'API', issues: [{ path: '/status' }] },
    ])
    expect(blocked.confirm()).toBe(false)
    expect(parseFormDocuments(model.files.value)).toEqual(draft)
    const resolution = review.check({
      API: { amount: 'adopt', reference: 'detach', status: 'separate' },
      Historical: { amount: 'retain', reference: 'retain', status: 'defer' },
    })
    expect(resolution.diagnostics).toEqual([])
    expect(resolution.confirm()).toBe(true)

    const serialized = JSON.parse(JSON.stringify(model.files.value))
    const imported = parseFormDocuments(serialized)
    expect(
      imported.ui.nodes.map(({ bind, component }) => [bind, component]),
    ).toEqual([
      ['/billing/amount', 'Input'],
      ['/status_canvas', 'Input'],
    ])
    expect(imported.data).toEqual({
      billing: {
        amount: 'pending',
        amount_previous: 42,
        amount_previous_2: 75,
      },
      reference: 'A-12',
      status: 7,
      status_canvas: 'open',
    })
    expect(imported.dataSchema).toMatchObject({
      properties: {
        billing: {
          additionalProperties: false,
          properties: {
            amount_previous_2: { type: 'number', minimum: 10, maximum: 90 },
          },
        },
        status: { maximum: 20 },
      },
    })
    createFormDocument(imported).dispose()
    expect(model.hasDraft.value).toBe(true)
    const api = model.project.value.variants.find(({ name }) => name === 'API')
    expect(api.data).toMatchObject({
      billing: { amount_previous_2: 60 },
      reference: 'A-11',
    })
    expect(api.dataSchema).toMatchObject({
      properties: {
        billing: { properties: { amount_previous_2: { minimum: 10 } } },
      },
    })
    model.choose('Historical')
    expect(
      model
        .reviewRename({ path: ['reference'], key: 'draft_reference' })
        .confirm(),
    ).toBe(true)
    const historicalDraft = model.files.value
    const invalidDraft = { ...historicalDraft, data: '{ invalid JSON' }
    model.edit(invalidDraft)
    model.choose('')
    const baseDraft = {
      ...model.files.value,
      dataSchema: '{ unfinished schema',
    }
    model.edit(baseDraft)
    model.choose('API')

    const tree = canvas(true)
    const snapshot = tree.serialize()
    const archive = model.exportArchive(snapshot)
    const target = openProject(importedStorage, {}, preview)
    const decoded = target.readArchive(archive)
    expect(decoded.canvas).toEqual(snapshot)
    expect(decoded.state.project).toEqual(model.project.value)
    expect(target.project.value).toBeUndefined()
    const unsupported = JSON.parse(archive)
    unsupported.version++
    expect(() => target.readArchive(JSON.stringify(unsupported))).toThrow(
      /Unsupported project archive/,
    )
    expect(target.project.value).toBeUndefined()
    target.importArchive(decoded)
    const restored = openProject(importedStorage, {}, preview)
    restored.restorePreview()
    expect(preview).toHaveBeenLastCalledWith(applied)
    expect(restored.selected.value).toBe('API')
    expect(restored.hasDraft.value).toBe(true)
    expect(parseFormDocuments(restored.files.value)).toEqual(imported)
    restored.choose('')
    expect(restored.files.value).toEqual(baseDraft)
    restored.choose('Historical')
    expect(restored.files.value).toEqual(invalidDraft)
    expect(() => {
      const invalid = JSON.parse(archive)
      invalid.state.project.variants[0].renames = [{ path: [], key: 'bad' }]
      restored.readArchive(JSON.stringify(invalid))
    }).toThrow('/state/project/variants/0/renames/0')
    expect(restored.files.value).toEqual(invalidDraft)

    const historical = materializeFormDocumentVariant(
      restored.project.value,
      'Historical',
    )
    expect(
      historical.ui.nodes.map(({ bind, component }) => [bind, component]),
    ).toEqual([
      ['/billing/amount', 'NumberPicker'],
      ['/reference', 'Input'],
    ])
    expect(historical.dataSchema).toEqual(applied.dataSchema)
    expect(historical.data).toEqual(applied.data)
    createFormDocument(historical).dispose()

    restored.edit(historicalDraft)
    const repaired = parseFormDocuments(restored.files.value)
    expect(repaired.ui.nodes[1].bind).toBe('/draft_reference')
    restored.apply(repaired)
    expect(restored.hasDraft.value).toBe(false)
    expect(restored.project.value.variants[1].renames).toContainEqual({
      path: ['reference'],
      key: 'draft_reference',
    })
    restored.generate(new TreeNode(decoded.canvas))
    expect(restored.reconciliation.value).toBeUndefined()
    expect(parseFormDocuments(restored.files.value)).toEqual(repaired)
    restored.choose('API')
    expect(parseFormDocuments(restored.files.value)).toEqual(imported)
  } finally {
    localStorage.removeItem(storage)
    localStorage.removeItem(importedStorage)
  }
})
