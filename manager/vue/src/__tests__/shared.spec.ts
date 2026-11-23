import { isReactive, reactive } from 'vue'
import { createForm } from '../'

test('createForm returns an un reactive form instance.', () => {
  const form = createForm()
  expect(isReactive(reactive(form as any))).toBeFalsy()
})
