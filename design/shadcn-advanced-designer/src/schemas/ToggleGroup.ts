import { componentSchema, editor } from './shared'

export const ToggleGroup = componentSchema({
  multiple: editor('Switch', undefined, {
    'x-reactions': {
      fulfill: {
        run: `
          const multiple = $self.value === true
          const value = $form.getValuesIn('default')
          $form.setValuesIn('type', multiple ? 'array' : 'string')
          if (multiple) {
            $form.setValuesIn('items', { anyOf: [{ type: 'string' }, { type: 'number' }] })
            if (value != null && !Array.isArray(value)) $form.setValuesIn('default', [value])
          } else {
            $form.deleteValuesIn('items')
            if (Array.isArray(value)) $form.setValuesIn('default', value[0])
          }
        `,
      },
    },
  }),
})
