// vue-settings-form — ValueInput (port de l'ère) : éditeur polymorphe des
// valeurs de propriétés — TEXT (Input), EXPRESSION (Popover + MonacoInput),
// BOOLEAN (Select True/False), NUMBER (NumberPicker). antd → vue-ui ; les
// composants internes reçoivent { value, onChange } du poly-input.
import {
  defineComponent,
  h,
  ref,
  watch,
  type Component,
  type PropType,
} from 'vue'
import { createPolyInput } from '../PolyInput'
import {
  Input,
  Popover,
  Button,
  Select,
  Textarea,
  NumberPicker,
} from '@formivue-design/vue-ui'
import { MonacoInput } from '../MonacoInput'
import { TextWidget } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { isPlainObj } from '@formivue/shared'

const STARTTAG_REX =
  /<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/

const EXPRESSION_REX = /^\{\{([\s\S]*)\}\}$/

const isNumber = (value: any) => typeof value === 'number'

const isBoolean = (value: any) => typeof value === 'boolean'

const isExpression = (value: any) => {
  return typeof value === 'string' && EXPRESSION_REX.test(value)
}

const isRichText = (value: any) => {
  return typeof value === 'string' && STARTTAG_REX.test(value)
}

const isNormalText = (value: any) => {
  return typeof value === 'string' && !isExpression(value) && !isRichText(value)
}

const takeNumber = (value: any) => {
  if (typeof value === 'number') return value
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2) ?? ''
  } catch {
    return ''
  }
}

const JsonInput = defineComponent({
  name: 'DValueInputJson',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<unknown>, default: undefined },
    onChange: {
      type: Function as PropType<(value: unknown) => void>,
      default: undefined,
    },
    jsonType: { type: String as PropType<'array'>, default: undefined },
  },
  setup(props, { attrs }) {
    let committed = formatJson(props.value)
    const draft = ref(committed)
    const error = ref<'invalidJson' | 'expectedArray'>()
    watch(
      () => props.value,
      (value) => {
        const next = formatJson(value)
        if (next === committed) return
        committed = next
        draft.value = next
        error.value = undefined
      },
    )
    const update = (source: string) => {
      draft.value = source
      let parsed: unknown
      try {
        if (source.trim()) parsed = JSON.parse(source)
      } catch {
        error.value = 'invalidJson'
        return
      }
      if (
        props.jsonType === 'array' &&
        parsed !== undefined &&
        !Array.isArray(parsed)
      ) {
        error.value = 'expectedArray'
        return
      }
      error.value = undefined
      committed = formatJson(parsed)
      props.onChange?.(parsed)
    }
    return () =>
      h('div', { class: 'w-full min-w-0' }, [
        h(Textarea, {
          ...attrs,
          rows: 4,
          spellcheck: false,
          value: draft.value,
          'aria-invalid': error.value ? true : undefined,
          onChange: update,
        }),
        error.value
          ? h(
              'p',
              { role: 'status', class: 'mt-1 text-xs text-destructive' },
              GlobalRegistry.getDesignerMessage(
                `SettingComponents.ValueInput.${error.value}`,
              ),
            )
          : null,
      ])
  },
})

// EXPRESSION d'ère : Popover (trigger click) → MonacoInput ; le
// bouton porte le token de locale « SettingComponents.ValueInput.expression ».
const ExpressionInput: Component = defineComponent({
  name: 'DValueInputExpression',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<any>, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(Popover, { class: 'w-[min(27rem,calc(100vw-2rem))]' } as any, {
        content: () =>
          h(
            'div',
            {
              style: {
                width: '100%',
                height: '200px',
              },
            },
            [
              h(MonacoInput as any, {
                ...props,
                language: 'javascript.expression',
                options: { automaticLayout: true },
              }),
            ],
          ),
        default: () =>
          h(
            Button,
            { block: true },
            {
              default: () =>
                h(TextWidget, {
                  token: 'SettingComponents.ValueInput.expression',
                }),
            },
          ),
      })
  },
}) as any

// BOOLEAN d'ère : Select options [{True,true},{False,false}] (valeurs
// booléennes conservées).
const BooleanInput: Component = defineComponent({
  name: 'DValueInputBoolean',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<any>, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(Select as any, {
        ...props,
        options: [
          {
            label:
              GlobalRegistry.getDesignerMessage(
                'SettingComponents.ValueInput.true',
              ) || 'True',
            value: true,
          },
          {
            label:
              GlobalRegistry.getDesignerMessage(
                'SettingComponents.ValueInput.false',
              ) || 'False',
            value: false,
          },
        ],
      })
  },
}) as any

export const ValueInput: Component = createPolyInput([
  {
    type: 'TEXT',
    icon: 'Text',
    component: Input,
    checker: isNormalText,
  },
  {
    type: 'EXPRESSION',
    icon: 'Expression',
    component: ExpressionInput,
    checker: isExpression,
    toInputValue: (value) => {
      if (!value || value === '{{}}') return
      const matched = String(value).match(EXPRESSION_REX)
      return matched?.[1] || value || ''
    },
    toChangeValue: (value) => {
      if (!value || value === '{{}}') return
      const matched = String(value).match(EXPRESSION_REX)
      return `{{${matched?.[1] || value || ''}}}`
    },
  },
  {
    type: 'BOOLEAN',
    icon: 'Boolean',
    component: BooleanInput,
    checker: isBoolean,
    toInputValue: (value) => {
      return !!value
    },
    toChangeValue: (value) => {
      return !!value
    },
  },
  {
    type: 'NUMBER',
    icon: 'Number',
    component: NumberPicker,
    checker: isNumber,
    toInputValue: takeNumber,
    toChangeValue: takeNumber,
  },
  {
    type: 'JSON',
    icon: 'JSON',
    component: JsonInput,
    checker: (value: unknown) => Array.isArray(value) || isPlainObj(value),
  },
] as any) as any
