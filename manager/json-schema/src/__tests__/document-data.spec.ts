import { compileDataValidator } from '../document-data'
import { expect, test } from 'vitest'

test('validates tuple evaluation, remote dynamic anchors and the format profile', () => {
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
