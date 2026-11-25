import {
  compileFormDocuments,
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  transformToTreeNode,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { expect, test } from 'vitest'

const plain = (): FormDocuments => ({
  ui: {
    version: 1,
    nodes: [
      {
        id: 'sample',
        key: 'sample',
        kind: 'field',
        component: 'Input',
        bind: '/sample',
      },
    ],
  },
  dataSchema: { type: 'object', properties: { sample: { type: 'string' } } },
  data: { sample: '{{ a literal value }}' },
})

const restricted = expect.objectContaining({
  issues: [expect.objectContaining({ code: 'untrusted_rendering' })],
})

test('requires a caller to explicitly trust JavaScript reactions', () => {
  const documents = plain()
  const reactions = [{ fulfill: { run: 'void 0' } }]
  documents.ui.nodes[0].field = { 'x-reactions': reactions }
  const files = stringifyFormDocuments(documents)
  expect(() => parseFormDocuments(files)).toThrow(restricted)
  expect(() => createFormDocument(documents)).toThrow(restricted)
  const session = createFormDocument(
    parseFormDocuments(files, { trusted: true }),
    { trusted: true },
  )
  try {
    expect(session.schema.properties.sample['x-reactions']).toEqual(reactions)
    expect(session.exportData()).toEqual(documents.data)
  } finally {
    session.dispose()
  }
  expect(() => createFormDocument(documents)).toThrow(restricted)
})

test('keeps declarative bindings and data strings', () => {
  const documents = plain()
  documents.ui.nodes[0].bindings = {
    placeholder: { path: '/sample', types: ['string'] },
  }
  const session = createFormDocument(
    parseFormDocuments(stringifyFormDocuments(documents)),
  )
  try {
    expect(
      session.schema.properties.sample['x-component-props'].placeholder,
    ).toContain('$document.read')
    expect(session.scope.$document.read('/sample')).toBe(documents.data.sample)
  } finally {
    session.dispose()
  }
})

test.each([
  { props: { placeholder: '{{ 1 + 1 }}' } },
  { props: { innerHTML: '<b>example</b>' } },
  { props: { onChange: 'callback' } },
  { field: { 'x-linkages': [] } },
  { field: { 'x-content': { template: '<b>example</b>' } } },
  { bindings: { innerHTML: { path: '/sample', types: ['string'] } } },
])('rejects executable rendering settings in the compiler (%j)', (metadata) => {
  const documents = plain()
  Object.assign(documents.ui.nodes[0], metadata)
  expect(() => compileFormDocuments(documents)).toThrow(restricted)
})

test('applies the same trust policy to the legacy schema import', () => {
  const serialized = {
    schema: {
      properties: {
        sample: {
          type: 'string',
          'x-reactions': [{ fulfill: { run: 'void 0' } }],
        },
      },
    },
  }
  expect(() => transformToTreeNode(serialized)).toThrow(restricted)
  expect(
    transformToTreeNode(serialized, { trusted: true }).children[0].props[
      'x-reactions'
    ],
  ).toEqual(serialized.schema.properties.sample['x-reactions'])
})
