import {
  createFormDocument,
  createFormDocumentProject,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { expect, test, vi } from 'vitest'
import { useDocumentProject } from '../service/document-project'

test('restores pending renames and invalid JSON beside the last applied variant', () => {
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
      data: '{"amount":75}',
    })
    expect(prepared.ui.nodes[0].bind).toBe('/amount')
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
