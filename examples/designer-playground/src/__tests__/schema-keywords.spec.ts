import {
  DataSchemaEditor,
  DataValuesEditor,
} from '@formivue-design/data-schema-editor'
import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'

type Schema = FormDocuments['dataSchema']

test('inserts a typed example explicitly in test data', async () => {
  const view = mount(DataValuesEditor, {
    props: {
      modelValue: { sample: 'kept' },
      schema: {
        type: 'object',
        properties: { sample: { $ref: '#examples' } },
        $defs: { sample: { $anchor: 'examples', examples: [false, null] } },
      },
    },
  })
  try {
    await view.get('[aria-label="Data path"]').setValue('/sample')
    expect(view.emitted('update:modelValue')).toBeUndefined()
    await view.get('[aria-label="Use a schema example"]').setValue('0')
    expect(view.emitted('update:modelValue')).toEqual([[{ sample: false }]])
  } finally {
    view.unmount()
  }
})
const portable = (dataSchema: Schema) =>
  parseFormDocuments(
    stringifyFormDocuments({
      ui: { version: 1, nodes: [] },
      dataSchema,
      data: {},
    }),
  )

function editor(schema: Schema = {}) {
  const wrapper = mount(DataSchemaEditor, {
    props: {
      modelValue: schema,
      tree: true,
      'onUpdate:modelValue': (value: Schema) =>
        wrapper.setProps({ modelValue: value }),
    },
  })
  return {
    wrapper,
    schema: () => wrapper.props('modelValue'),
    node: (pointer: string) =>
      wrapper.get(`button[data-schema-node="${pointer}"]`).trigger('click'),
    button: (label: string) =>
      wrapper.findAll('button').find((button) => button.text() === label),
    roundTrip() {
      const draft = wrapper.props('modelValue')
      const documents = portable({
        type: 'object',
        properties: { sample: draft },
      })
      const session = createFormDocument(documents)
      expect(session.exportDocuments().dataSchema).toEqual(documents.dataSchema)
      session.dispose()
    },
  }
}

test.each([
  ['minimum', 1, 2],
  ['maximum', 10, 12],
  ['exclusiveMinimum', 1, 2],
  ['exclusiveMaximum', 10, 12],
  ['multipleOf', 1, 2],
  ['minLength', 1, 2],
  ['maxLength', 4, 6],
  ['minProperties', 1, 2],
  ['maxProperties', 3, 4],
  ['minItems', 1, 2],
  ['maxItems', 5, 6],
  ['minContains', 1, 2],
  ['maxContains', 5, 6],
  ['pattern', '^A', '^B'],
  ['format', 'uri', 'email'],
  ['title', 'Alpha', 'Beta'],
  ['description', 'Alpha', 'Beta'],
  ['contentEncoding', 'base64', 'base16'],
  ['contentMediaType', 'application/json', 'text/plain'],
  ['$comment', 'first', 'second'],
  ['$anchor', 'alpha', 'beta'],
  ['$dynamicAnchor', 'alpha', 'beta'],
] as const)(
  'adds, edits, round-trips and removes %s',
  async (key, first, second) => {
    const view = editor()
    try {
      const control = view.wrapper.get(`[data-schema-keyword="${key}"]`)
      for (const value of [first, second]) {
        await control.setValue(String(value))
        expect(view.schema()[key]).toBe(value)
      }
      view.roundTrip()
      await control.setValue('')
      expect(view.schema()).not.toHaveProperty(key)
    } finally {
      view.wrapper.unmount()
    }
  },
)

test.each(['readOnly', 'writeOnly', 'deprecated', 'uniqueItems'] as const)(
  'round-trips both values of %s and removes it',
  async (key) => {
    const view = editor()
    try {
      const control = view.wrapper.get(`[data-schema-keyword="${key}"]`)
      for (const value of [true, false]) {
        await control.setValue(String(value))
        expect(view.schema()[key]).toBe(value)
        view.roundTrip()
      }
      await control.setValue('')
      expect(view.schema()).not.toHaveProperty(key)
    } finally {
      view.wrapper.unmount()
    }
  },
)

test.each([
  ['items', ''],
  ['contains', ''],
  ['unevaluatedItems', ''],
  ['additionalProperties', ''],
  ['propertyNames', ''],
  ['unevaluatedProperties', ''],
  ['not', ''],
  ['if', ''],
  ['then', ''],
  ['else', ''],
  ['contentSchema', ''],
  ['allOf', '0'],
  ['anyOf', '0'],
  ['oneOf', '0'],
  ['prefixItems', '0'],
  ['properties', 'child'],
  ['patternProperties', '^child'],
  ['dependentSchemas', 'trigger'],
  ['$defs', 'child'],
])(
  'creates, replaces, navigates and removes the %s subschema',
  async (key, name) => {
    const view = editor()
    try {
      const group = () =>
        view.wrapper.get(`fieldset[data-schema-keyword="${key}"]`)
      const input = group().find('input')
      if (input.exists()) await input.setValue(name)
      await group().get(`[data-add-schema="${key}"]`).trigger('click')
      const form = () => view.wrapper.get('select[aria-label="Schema form"]')
      await form().setValue('true')
      await form().setValue('false')
      const value = name === '' ? view.schema()[key] : view.schema()[key][name]
      expect(value).toBe(false)
      view.roundTrip()
      await view.node('')
      await group().get('[data-remove-schema]').trigger('click')
      expect(view.schema()).not.toHaveProperty(key)
    } finally {
      view.wrapper.unmount()
    }
  },
)

test.each([
  [
    '$schema',
    'https://json-schema.org/draft/2020-12/schema',
    'https://json-schema.org/draft/2020-12/schema#',
  ],
  ['$id', 'https://example.test/first', 'https://example.test/second'],
  ['$ref', '#/$defs/first', '#/$defs/second'],
  ['$dynamicRef', '#first', '#second'],
])('round-trips %s and its selected resource', async (key, first, second) => {
  const view = editor({
    type: 'object',
    $defs: {
      first: { $dynamicAnchor: 'first', type: 'object' },
      second: { $dynamicAnchor: 'second', type: 'object' },
    },
  })
  try {
    const control = view.wrapper.get(`[data-schema-keyword="${key}"]`)
    await control.setValue(first)
    expect(view.schema()[key]).toBe(first)
    await control.setValue(second)
    const session = createFormDocument(portable(view.schema()))
    expect(session.exportDocuments().dataSchema[key]).toBe(second)
    session.dispose()
    if (key === '$ref' || key === '$dynamicRef') {
      await view
        .button(key === '$ref' ? 'Open reference' : 'Open dynamic reference')
        .trigger('click')
      expect(
        view.wrapper
          .get('[data-schema-node="/$defs/second"]')
          .attributes('aria-current'),
      ).toBe('true')
      await view.node('')
    }
    await control.setValue('')
    expect(view.schema()).not.toHaveProperty(key)
  } finally {
    view.wrapper.unmount()
  }
})

test('round-trips required dependencies and vocabulary declarations', async () => {
  const view = editor({ type: 'object' })
  try {
    for (const key of ['required', 'dependentRequired', '$vocabulary']) {
      const section = () => view.wrapper.get(`[data-schema-keyword="${key}"]`)
      await section()
        .get('input')
        .setValue(
          key === '$vocabulary'
            ? 'https://json-schema.org/draft/2020-12/vocab/core'
            : 'test',
        )
      await section().get(`[data-add-schema="${key}"]`).trigger('click')
      if (key === 'dependentRequired') {
        await section().get('[aria-label="Name"]').setValue('other')
        await section()
          .get('[data-add-schema="dependentRequired/test"]')
          .trigger('click')
        expect(view.schema().dependentRequired).toEqual({ test: ['other'] })
      }
      if (key === '$vocabulary')
        await section().get('input[type="checkbox"]').setValue(false)

      const documents = portable(view.schema())
      if (key === 'required') documents.data.test = true
      const session = createFormDocument(documents)
      session.dispose()
      await section().get('[data-remove-schema]').trigger('click')
      expect(view.schema()).not.toHaveProperty(key)
    }
  } finally {
    view.wrapper.unmount()
  }
})

test('round-trips multi-types and typed enum, const, default and examples', async () => {
  const view = editor()
  try {
    const label = (name: string) =>
      view.wrapper
        .findAll('label')
        .find((field) => field.text() === name)
        .get('input')
    await label('String').setValue(true)
    await label('Null').setValue(true)
    expect(view.schema().type).toEqual(['string', 'null'])
    await label('Null').setValue(false)
    await label('String').setValue(false)
    for (const [key, add, value, remove] of [
      ['enum', 'Add allowed value', 'Allowed values 1', 'Remove value'],
      ['const', 'Set value', 'Constant', 'Clear value'],
      ['default', 'Set value', 'Default value', 'Clear value'],
      ['examples', 'Add example', 'Examples 1', 'Remove value'],
    ]) {
      const choices = view.wrapper
        .findAll('button')
        .filter((button) => button.text() === add)
      await choices[key === 'default' ? 1 : 0].trigger('click')
      await view.wrapper
        .get(`select[aria-label="${value} · Type"]`)
        .setValue('number')
      await view.wrapper.get(`input[aria-label="${value}"]`).setValue('3')
      expect(view.schema()[key]).toEqual(
        key === 'enum' || key === 'examples' ? [3] : 3,
      )
      view.roundTrip()
      await view.button(remove).trigger('click')
      expect(view.schema()).not.toHaveProperty(key)
    }
  } finally {
    view.wrapper.unmount()
  }
})
