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
