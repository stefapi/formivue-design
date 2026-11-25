import { TreeNode } from '@formivue-design/core'
import type { FormDocuments } from '@formivue-design/formivue-transformer'
import {
  hasSameFormDocumentDefinition,
  useDocumentPreview,
} from '@formivue-design/data-model'
import { DocumentEditorWidget } from '@formivue-design/data-model/ui'
import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'

const documents = (): FormDocuments => ({
  ui: {
    version: 1,
    nodes: [
      {
        id: 'heading',
        key: 'heading',
        kind: 'field',
        component: 'Input',
        bind: '/heading',
      },
    ],
  },
  dataSchema: {
    type: 'object',
    required: ['heading'],
    properties: { heading: { type: 'string' } },
  },
  data: { heading: 'Sales' },
})

test('keeps the preview form and reports conflicts on a data-only update', () => {
  const preview = useDocumentPreview()
  const initial = documents()
  try {
    preview.apply(initial)
    const active = preview.document.value!
    active.form.setValuesIn('heading', 'Local heading')

    const next = active.exportDocuments()
    next.data.heading = 'Imported heading'
    expect(preview.apply(next)).toEqual(['/heading'])
    expect(preview.document.value).toBe(active)
    expect(active.form.getValuesIn('heading')).toBe('Local heading')

    const changed = active.exportDocuments()
    changed.dataSchema.properties.heading = { type: 'string', minLength: 1 }
    preview.apply(changed)
    expect(preview.document.value).not.toBe(active)
  } finally {
    preview.clear()
  }
})

test('preserves local input when the JSON object members are reordered', () => {
  const preview = useDocumentPreview()
  const original = documents()
  try {
    preview.apply(original)
    const active = preview.document.value!
    active.form.setValuesIn('heading', 'Unsaved heading')

    preview.apply({
      ...original,
      ui: { nodes: original.ui.nodes, version: 1 },
      dataSchema: {
        properties: original.dataSchema.properties,
        required: original.dataSchema.required,
        type: 'object',
      },
    })

    expect(preview.document.value).toBe(active)
    expect(active.form.getValuesIn('heading')).toBe('Unsaved heading')
  } finally {
    preview.clear()
  }
})

test('detects a change in array order in the form definition', () => {
  const original = documents()
  original.ui.nodes.push({
    id: 'note',
    key: 'note',
    kind: 'void',
    component: 'Text',
  })
  expect(
    hasSameFormDocumentDefinition(original, {
      ...original,
      ui: { ...original.ui, nodes: [...original.ui.nodes].reverse() },
    }),
  ).toBe(false)
})

test('keeps the current preview when archive replacement fails', () => {
  const preview = useDocumentPreview()
  try {
    const original = documents()
    preview.apply(original)
    const active = preview.document.value
    const installCanvas = vi.fn(() => {
      throw new Error('Canvas could not be installed')
    })

    expect(() =>
      preview.replace({ ...original, data: {} }, installCanvas),
    ).toThrow()
    expect(installCanvas).not.toHaveBeenCalled()
    expect(() => preview.replace(original, installCanvas)).toThrow(
      'Canvas could not be installed',
    )
    expect(preview.document.value).toBe(active)
  } finally {
    preview.clear()
  }
})

test('applies three independently edited documents from the JSON panel', async () => {
  const apply = vi.fn()
  const view = mount(DocumentEditorWidget, {
    props: {
      tree: new TreeNode({ componentName: 'Form' }),
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
