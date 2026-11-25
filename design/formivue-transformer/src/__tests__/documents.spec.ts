import {
  compileFormDocuments,
  createDocumentContractRegistry,
  createFormDocument,
  parseFormDocuments,
  splitFormSchema,
  stringifyFormDocuments,
  type FormDocuments,
  type UiDocumentNode,
} from '@formivue-design/formivue-transformer'
import { expect, test } from 'vitest'

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
  expect(() => compileFormDocuments(migrated, { contracts: registry })).toThrow(
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

test('projects authored names for oneOf choices after transport', () => {
  const documents = parseFormDocuments(
    stringifyFormDocuments({
      ui: {
        version: 1,
        nodes: [
          {
            id: 'status',
            key: 'status',
            component: 'Select',
            bind: '/status',
            kind: 'field',
            field: { title: 'Canvas title' },
          },
        ],
      },
      dataSchema: {
        type: 'object',
        properties: {
          status: {
            title: 'Data title',
            oneOf: [
              { const: 'open', title: 'Open' },
              { const: 'closed', title: 'Closed' },
            ],
          },
        },
      },
      data: { status: 'open' },
    }),
  )
  const session = createFormDocument(documents)
  try {
    expect(session.schema.properties.status).toMatchObject({
      title: 'Data title',
      enum: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
      ],
    })
  } finally {
    session.dispose()
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
