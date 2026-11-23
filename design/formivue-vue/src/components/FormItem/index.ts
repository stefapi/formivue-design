// formivue/vue — FormItem (binding réelle, décorateur des champs) : FormItemBase
// vue-ui + connect/mapProps (pattern fork docs/ui) + port du fix 6.4 —
// l'id (adresse du champ) est injecté sur le contrôle unique du slot pour
// l'association label↔contrôle (gate axe V8).
import {
  cloneVNode,
  defineComponent,
  h,
  isVNode,
  type PropType,
  type VNode,
} from 'vue'
import { connect, mapProps } from '@formivue/vue'
import { isVoidField } from '@formivue/core'
import { FormItemBase } from '@formivue-design/vue-ui'

const BaseFormItem = defineComponent({
  name: 'FormivueFormItem',
  inheritAttrs: false,
  props: {
    label: {
      type: [String, Object] as PropType<string | VNode>,
      default: undefined,
    },
    labelFor: { type: String, default: undefined },
    id: { type: String, default: undefined },
    help: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    extra: {
      type: [String, Object] as PropType<string | VNode>,
      default: undefined,
    },
    tooltip: { type: String, default: undefined },
    required: { type: Boolean, default: undefined },
    validateStatus: {
      type: [Boolean, String] as PropType<
        boolean | 'error' | 'success' | 'warning' | 'validating'
      >,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const id = props.labelFor ?? props.id
      const children = slots.default?.() ?? []
      const patched =
        id && children.length === 1 && isVNode(children[0])
          ? children.map((child) => cloneVNode(child, { id }, true))
          : children
      return h(
        FormItemBase,
        {
          ...attrs,
          label: props.label,
          labelFor: id,
          help: props.help,
          extra: props.extra,
          tooltip: props.tooltip,
          required: props.required,
          validateStatus: props.validateStatus,
        },
        { default: () => patched },
      )
    }
  },
})

export const FormItem = connect(
  BaseFormItem,
  mapProps((props: any, field: any) => {
    if (isVoidField(field)) {
      return {
        label: field?.title ?? props.label,
        extra: props.extra ?? field?.description,
      }
    }
    if (!field) return props
    const takeMessage = () => {
      if (field.validating) return undefined
      if (props.feedbackText) return props.feedbackText
      if (field.selfErrors.length) return field.selfErrors
      if (field.selfWarnings.length) return field.selfWarnings
      if (field.selfSuccesses.length) return field.selfSuccesses
    }
    const takeRequired = () => {
      if (props.asterisk !== undefined) return props.asterisk
      if (field.required && field.pattern !== 'readPretty') return true
      return false
    }
    return {
      label: props.label ?? field.title,
      help: takeMessage(),
      extra: props.extra ?? field.description,
      required: takeRequired(),
      validateStatus: field.validateStatus,
      labelFor: props.labelFor ?? field.address?.toString(),
    }
  }),
)
