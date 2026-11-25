import { TreeNode } from '@formivue-design/core'
import { isDataField } from '@formivue/core'
import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
  type UiDocumentNode,
} from '@formivue-design/formivue-transformer'
import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { DocumentEditorWidget } from '@formivue-design/data-model/ui'
import { PreviewWidget } from '../widgets/PreviewWidget'

const tree = () => new TreeNode({ componentName: 'Form' })
const field = (
  key: string,
  component: string,
  overrides: Partial<UiDocumentNode> = {},
): UiDocumentNode => ({
  id: key,
  key,
  kind: 'field',
  component,
  bind: '/' + key,
  field: { 'x-decorator': 'FormItem' },
  ...overrides,
})

test('edits constraints graphically and applies them after a three-document round trip', async () => {
  const documents: FormDocuments = {
    ui: {
      version: 1,
      nodes: [
        field('price', 'NumberPicker'),
        field('code', 'Input'),
        field('status', 'Select'),
        field('locked', 'NumberPicker'),
        field('secret', 'Input', { field: { 'x-pattern': 'readPretty' } }),
      ],
    },
    dataSchema: {
      type: 'object',
      properties: {
        price: { type: 'number' },
        code: { $ref: '#/$defs/code' },
        status: { type: ['number', 'string'] },
        locked: { type: 'number' },
        secret: { type: 'string', writeOnly: true },
      },
      $defs: { code: { type: 'string' } },
    },
    data: { price: 0.3, code: 'AB😀', status: 1, locked: 0, secret: 'private' },
  }
  const apply = vi.fn()
  const editor = mount(DocumentEditorWidget, {
    props: { documents, tree: tree(), onApply: apply, onCanvas: vi.fn() },
  })
  const button = (text: string) =>
    editor.findAll('button').find((button) => button.text() === text)
  const control = (text: string) =>
    editor
      .findAll('label')
      .find((label) =>
        [...label.element.childNodes].some(
          (child) =>
            child.nodeType === Node.TEXT_NODE &&
            child.textContent.trim() === text,
        ),
      )
      .get('input, select, textarea')
  const node = () => control('Schema node')

  try {
    await editor
      .get('select[aria-label="JSON document"]')
      .setValue('dataSchema')
    await node().setValue('/properties/price')
    await control('Exclusive minimum').setValue('0.1')
    await control('Maximum').setValue('0.4')
    await control('Maximum').setValue('')
    await control('Maximum').setValue('0.5')
    await control('Multiple of').setValue('0.1')
    await node().setValue('/properties/code')
    await button('Open reference').trigger('click')
    await control('Regular expression').setValue('[')
    expect(editor.text()).toContain('Invalid regular expression')
    await control('Regular expression').setValue('^[A-Z]{2}.+$')
    await control('Minimum length').setValue('3')
    await control('Maximum length').setValue('3')
    await control('Pattern sample').setValue('AB😀')
    expect(editor.text()).toContain('Sample matches')
    await node().setValue('/properties/status')
    await button('Add allowed value').trigger('click')
    await editor.get('input[aria-label="Allowed values 1"]').setValue('1')
    await button('Add allowed value').trigger('click')
    await editor
      .get('select[aria-label="Allowed values 2 · Type"]')
      .setValue('string')
    await editor.get('input[aria-label="Allowed values 2"]').setValue('1')
    await node().setValue('/properties/locked')
    await control('Number').setValue(false)
    await control('Integer').setValue(true)
    await control('Read only').setValue('true')
    await control('Deprecated').setValue('true')
    await button('Apply to preview').trigger('click')
    const draft = apply.mock.calls[0][0] as FormDocuments
    const imported = parseFormDocuments(stringifyFormDocuments(draft))
    expect(imported.dataSchema.properties).toMatchObject({
      price: {
        type: 'number',
        exclusiveMinimum: 0.1,
        maximum: 0.5,
        multipleOf: 0.1,
      },
      status: { enum: [1, '1'] },
      locked: { type: 'integer', readOnly: true, deprecated: true },
    })
    expect(imported.dataSchema.$defs).toMatchObject({
      code: { minLength: 3, maxLength: 3, pattern: '^[A-Z]{2}.+$' },
    })
    expect(imported.data).toEqual(documents.data)

    const document = createFormDocument(imported)
    const view = mount(PreviewWidget, { props: { document, tree: tree() } })
    try {
      expect(
        document.schema.properties.price['x-component-props'],
      ).toMatchObject({
        min: 0.2,
        max: 0.5,
        step: 0.1,
        allowInvalid: true,
      })
      expect(document.schema.properties.status.enum).toEqual([1, '1'])
      expect(
        document.schema.properties.locked['x-component-props'].precision,
      ).toBe(0)
      const numbers = view.findAll('input[role="spinbutton"]')
      expect(numbers[0].attributes('aria-valuemin')).toBe('0.2')
      expect(numbers[1].element.hasAttribute('readonly')).toBe(true)
      expect(view.text()).toContain('Deprecated')
      expect(view.text()).not.toContain('private')
      const code = view.get<HTMLInputElement>('#code')
      const codeField = document.form.query('code').take()
      if (!isDataField(codeField)) throw new Error('Expected a data field')
      await code.setValue('XY😀')
      await vi.waitFor(() => expect(document.exportData().code).toBe('XY😀'))
      await code.setValue('XY')
      await vi.waitFor(() =>
        expect(document.issues).toContainEqual(
          expect.objectContaining({ path: '/code' }),
        ),
      )
      expect(codeField.selfErrors.length).toBeGreaterThan(0)
      await code.setValue('XY😀')
      await vi.waitFor(() => expect(codeField.selfErrors).toEqual([]))
      document.form.setValuesIn('price', 0.15)
      await expect(document.form.submit()).rejects.toThrow('/price')
    } finally {
      view.unmount()
      document.dispose()
    }
  } finally {
    editor.unmount()
  }
})

test('rejects incompatible form options and empty numeric domains', () => {
  const documents: FormDocuments = {
    ui: {
      version: 1,
      nodes: [
        field('status', 'Select', {
          options: [{ label: 'Active', value: 'active' }],
        }),
        field('number', 'NumberPicker'),
      ],
    },
    dataSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['closed'] },
        number: { type: 'integer', exclusiveMinimum: 1, exclusiveMaximum: 2 },
      },
    },
    data: {},
  }
  expect(() => createFormDocument(documents)).toThrow(
    expect.objectContaining({
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: '/status',
          code: 'incompatible_ui_option',
        }),
        expect.objectContaining({
          path: '/number',
          code: 'empty_numeric_range',
        }),
      ]),
    }),
  )
})

test('projects collection limits and new-row defaults after reimport', async () => {
  const rows = (key: string): UiDocumentNode => ({
    id: key,
    key,
    kind: 'array',
    component: 'ArrayTable',
    bind: '/' + key,
    item: {
      id: key + 'Item',
      key: 'item',
      kind: 'object',
      children: [
        {
          id: key + 'Column',
          key: 'qtyColumn',
          kind: 'void',
          component: 'ArrayTable.Column',
          children: [field('qty', 'NumberPicker', { id: key + 'Qty' })],
        },
      ],
    },
    children: [
      {
        id: key + 'Add',
        key: 'add',
        kind: 'void',
        component: 'ArrayTable.Addition',
        props: { title: 'Add ' + key },
      },
    ],
  })
  const items = {
    type: 'object',
    properties: { qty: { type: 'integer', default: 0 } },
  }
  const raw: FormDocuments = {
    ui: { version: 1, nodes: [rows('editable'), rows('fixed')] },
    dataSchema: {
      type: 'object',
      properties: {
        editable: { type: 'array', maxItems: 1, items },
        fixed: { type: 'array', readOnly: true, items },
      },
    },
    data: { editable: [], fixed: [{ qty: 7 }] },
  }
  const document = createFormDocument(
    parseFormDocuments(stringifyFormDocuments(raw)),
  )
  const view = mount(PreviewWidget, { props: { document, tree: tree() } })
  try {
    const add = view
      .findAll('button')
      .find((button) => button.text() === 'Add editable')
    expect(
      view.findAll('button').some((button) => button.text() === 'Add fixed'),
    ).toBe(false)
    expect(document.exportData().editable).toEqual([])
    await add.trigger('click')
    await vi.waitFor(() =>
      expect(document.exportData().editable).toEqual([{ qty: 0 }]),
    )
    expect(add.element.disabled).toBe(true)
    expect(document.exportData().fixed).toEqual([{ qty: 7 }])
  } finally {
    view.unmount()
    document.dispose()
  }
})
