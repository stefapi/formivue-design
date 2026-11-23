import { connect, mapProps } from '@formivue/vue'
import { isVoidField } from '@formivue/core'
import Button from './Button.vue'
import Input from './Input.vue'
import Space from './Space.vue'
import FormItemBase from './FormItemBase.vue'

/**
 * Form component library built on reka-ui + tailwind, following the
 * conventions expected by @formivue/vue: a component only needs to support
 * `value`/`onChange` to be bound to a field.
 */
const FormItem = connect(
  FormItemBase,
  mapProps(
    { validateStatus: true, title: 'label', required: true },
    (props, field) => ({
      help: !isVoidField(field)
        ? field.selfErrors.length
          ? field.selfErrors
          : undefined
        : undefined,
      extra: field.description,
    }),
  ),
)

export { Button, Input, Space, FormItem, FormItemBase }
