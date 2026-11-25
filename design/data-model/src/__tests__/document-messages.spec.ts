import {
  compileDataValidator,
  DocumentValidationError,
} from '@formivue/json-schema'
import { createDocumentMessages } from '@formivue-design/data-model/ui'
import { expect, test } from 'vitest'

const { documentError } = createDocumentMessages()

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
