import { editor, jsonArray, jsonScalar, type PropertySchema } from './shared'

const nextStep: PropertySchema = {
  anyOf: [{ type: 'string' }, { type: 'null' }],
}

export const flowProperties = {
  label: editor('Input'),
  previousText: editor('Input'),
  nextText: editor('Input'),
  initialStep: editor('Input'),
  finishText: editor('Input'),
  completedText: editor('Input'),
  validationText: editor('Input'),
  onSubmit: editor('ValueInput', { include: ['EXPRESSION'] }),
}

export const stepProperties = {
  title: editor('Input'),
  description: editor('Input.TextArea'),
  next: editor(
    'ValueInput',
    { include: ['TEXT', 'JSON'] },
    {
      ...nextStep,
      type: undefined,
    },
  ),
  branches: jsonArray({
    type: 'object',
    required: ['path', 'equals', 'next'],
    properties: {
      path: { type: 'string' },
      equals: jsonScalar,
      next: nextStep,
    },
  }),
  fields: jsonArray({ type: 'string' }),
}
