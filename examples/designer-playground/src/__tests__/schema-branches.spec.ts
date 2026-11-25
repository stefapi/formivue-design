import {
  compileDataValidator,
  DocumentValidationError,
} from '@formivue/json-schema'
import {
  compileFormDocuments,
  createDocumentContractRegistry,
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
import { expect, test } from 'vitest'
import { documentError } from '../../../shared/document-messages'

const contracts = createDocumentContractRegistry([chartDocumentContracts])
const fixture = (): FormDocuments => ({
  ui: {
    version: 1,
    nodes: [
      {
        id: 'sales',
        key: 'sales',
        kind: 'array',
        bind: '/sales',
        component: 'ArrayTable',
        item: {
          id: 'row',
          key: 'row',
          kind: 'object',
          children: [
            {
              id: 'amount',
              key: 'amount',
              kind: 'field',
              bind: '/amount',
              component: 'NumberPicker',
            },
          ],
        },
      },
      {
        id: 'chart',
        key: 'chart',
        kind: 'void',
        component: 'BarChart',
        bindings: { rows: { path: '/sales' } },
        props: { xKey: 'name', series: [{ key: 'amount' }] },
      },
    ],
  },
  data: {
    sales: [
      { name: 'Lyon', amount: 12 },
      { name: 'Paris', amount: 1 },
    ],
  },
  dataSchema: {
    type: 'object',
    properties: { sales: { type: 'array', items: { $dynamicRef: '#row' } } },
    $defs: {
      row: {
        $dynamicAnchor: 'row',
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: {
            allOf: [
              { type: 'integer', minimum: 1 },
              { minimum: 2 },
              { minimum: 0 },
            ],
          },
        },
        if: { properties: { name: { const: 'Lyon' } }, required: ['name'] },
        then: { properties: { amount: { minimum: 10 } } },
      },
    },
  },
})

test('a conditional assertion keeps its row path after a chart document is reimported', () => {
  const documents = fixture()
  documents.data.sales[1].amount = 2
  const imported = parseFormDocuments(stringifyFormDocuments(documents))
  const session = createFormDocument(imported, { contracts })
  try {
    const row = session.schema.properties.sales.items as typeof session.schema
    const field = row.properties.amount
    expect(field['x-component-props'].min).toBe(2)
    expect(() =>
      session.replaceData({ sales: [{ name: 'Lyon', amount: 4 }] }),
    ).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: '/sales/0/amount' }),
        ]),
      }),
    )
    expect(session.exportData()).toEqual(imported.data)
    session.replaceData({ sales: [{ name: 'Paris', amount: 4 }] })
    expect(session.exportData().sales).toEqual([{ name: 'Paris', amount: 4 }])
  } finally {
    session.dispose()
  }

  const row = (imported.dataSchema.$defs as Record<string, { then: object }>)
    .row
  row.then = { properties: { amount: { type: 'string' } } }
  expect(() => compileFormDocuments(imported, { contracts })).toThrow(
    expect.objectContaining({
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: '/sales/*/amount',
          componentId: 'amount',
          code: 'incompatible_data_type',
        }),
        expect.objectContaining({
          path: '/sales/*/amount',
          componentId: 'chart',
          code: 'incompatible_column',
        }),
      ]),
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

test('validates tuple evaluation, remote dynamic anchors, field diagnostics and the format profile', () => {
  const validate = compileDataValidator({
    type: 'array',
    prefixItems: [{ type: 'string' }],
    contains: { type: 'integer' },
    unevaluatedItems: false,
  })
  expect(validate(['start', 4])).toEqual([])
  expect(validate(['start', 4, 'extra'])).toEqual([
    expect.objectContaining({ path: '/2' }),
  ])
  const remote = compileDataValidator(
    { $dynamicRef: 'https://example.test/row#number' },
    {
      resources: {
        'https://example.test/row': {
          $dynamicAnchor: 'number',
          type: 'number',
        },
      },
    },
  )
  expect(remote(0)).toEqual([])
  expect(remote('0')).not.toEqual([])
  expect(compileDataValidator({ format: 'date' })('invalid')).not.toEqual([])
  expect(
    compileDataValidator({ format: 'date' }, { format: 'annotate' })('invalid'),
  ).toEqual([])
  expect(compileDataValidator({ multipleOf: 1e-8 })(1.5e-8)).not.toEqual([])
  expect(compileDataValidator({ multipleOf: 1e-8 })(3e-8)).toEqual([])
})

test.each(['standard', 'dialect'])(
  'shows one conditional constant error with both values (%s)',
  (mode) => {
    const schema = {
      type: 'object',
      properties: {
        account: { type: 'string', if: true, then: { const: 'toto' } },
        amount:
          mode === 'dialect'
            ? { type: 'number', multipleOf: 2 }
            : { type: 'number' },
      },
    }
    const validate = compileDataValidator(schema, {
      includeConstantValues: true,
    })
    const issues = validate({ account: 'ACME-01', amount: 2 })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      path: '/account',
      constantMismatch: { expected: 'toto', actual: 'ACME-01' },
    })
    expect(documentError(new DocumentValidationError(issues))).toBe(
      '/account: Expected "toto", current value "ACME-01".',
    )
    expect(validate({ account: 'toto', amount: 2 })).toEqual([])
    if (mode === 'standard') {
      expect(
        compileDataValidator(schema)({ account: 'ACME-01', amount: 2 }),
      ).toEqual([
        { path: '/account', message: 'must be equal to constant' },
        { path: '/account', message: 'must match "then" schema' },
      ])
    }
  },
)

test.each(['standard', 'dialect'])(
  'explains rejected values and preserves their JSON types (%s)',
  (mode) => {
    const schema = {
      type: 'object',
      required: ['owner'],
      properties: {
        status: { if: true, then: { enum: ['draft', 2, false, null] } },
        amount:
          mode === 'dialect' ? { minimum: 10, multipleOf: 1 } : { minimum: 10 },
        code: { minLength: 4 },
        contact: { format: 'email' },
        active: { type: ['boolean', 'number'] },
        names: { type: 'object', propertyNames: { enum: ['preferred'] } },
        tags: { type: 'array', contains: { const: 'green' }, minContains: 2 },
      },
    }
    const validate = compileDataValidator(schema, {
      includeValidationDetails: true,
    })
    const data = {
      status: '2',
      amount: 3,
      code: 'ab',
      contact: 'invalid',
      active: 'yes',
      names: { other: 42 },
      tags: ['red'],
    }
    const messages = documentError(
      new DocumentValidationError(validate(data)),
    ).split('\n')
    expect(messages).toHaveLength(8)
    expect(messages).toEqual(
      expect.arrayContaining([
        '/status: Current value "2". Allowed values: "draft", 2, false, null.',
        '/amount: Must be at least 10. Current value 3.',
        '/code: At least 4 characters expected. Current value "ab".',
        '/contact: Must use the format "email". Current value "invalid".',
        '/active: Expected a boolean / a number. Current value "yes".',
        '/owner: This field is required. No value was entered.',
        '/names/other: Current value "other". Allowed values: "preferred".',
        '/tags: At least 2 matching items expected for the rule {"const":"green"}. Current value ["red"].',
      ]),
    )
    expect(
      validate({
        status: 2,
        amount: 10,
        code: 'abcd',
        contact: 'a@example.test',
        active: true,
        owner: 'example',
        names: { preferred: 42 },
        tags: ['green', 'green'],
      }),
    ).toEqual([])
  },
)
