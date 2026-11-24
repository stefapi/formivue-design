import {
  createFormDocument,
  createFormDocumentProject,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { TreeNode } from '@formivue-design/core'
import { expect, test, vi } from 'vitest'
import { useDocumentProject } from '../service/document-project'

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
    const model = useDocumentProject(storageKey, {}, preview)
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

    const restored = useDocumentProject(storageKey, {}, preview)
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
    const model = useDocumentProject(storage, {}, preview)
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
    const restored = useDocumentProject(storage, {}, preview)
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
    const model = useDocumentProject(storage, {}, preview)
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
    model.edit(serialized)
    const restored = useDocumentProject(storage, {}, preview)
    restored.restorePreview()
    expect(preview).toHaveBeenLastCalledWith(applied)
    expect(restored.hasDraft.value).toBe(true)
    expect(parseFormDocuments(restored.files.value)).toEqual(imported)
    restored.apply(imported)
    restored.choose('Historical')
    const historical = parseFormDocuments(
      JSON.parse(JSON.stringify(restored.files.value)),
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
    restored.generate(canvas(true))
    expect(restored.reconciliation.value).toBeUndefined()
    expect(parseFormDocuments(restored.files.value)).toEqual(historical)
  } finally {
    localStorage.removeItem(storage)
  }
})
