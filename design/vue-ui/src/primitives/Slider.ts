// @formivue-design/vue-ui — primitives — Slider (sur le Slider shadcn-vue).
import { defineComponent, h, type PropType } from 'vue'
import { UiSlider } from '../ui/slider'

export const Slider = defineComponent({
  name: 'DSlider',
  inheritAttrs: false,
  props: {
    value: { type: [Number, String], default: undefined },
    // form-friendly (additif, pattern formivue x-component-props) : une
    // valeur initiale SCALAIRE est acceptée (reka SliderRoot attend un
    // tableau — absorbé ici au lieu de fuir en warning de prop)
    defaultValue: {
      type: [Number, Array] as PropType<number | number[]>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(value: number) => void>,
      default: undefined,
    },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    showValue: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () => {
      const initial = Array.isArray(props.defaultValue)
        ? props.defaultValue[0]
        : props.defaultValue
      const min = Number.isFinite(props.min) ? props.min : 0
      const max = Number.isFinite(props.max) ? props.max : 100
      const validRange = max > min && Number.isFinite(max - min)
      const value = props.value ?? initial
      const number =
        typeof value === 'string' && value.trim() !== '' ? Number(value) : value
      const current =
        typeof number === 'number' && Number.isFinite(number)
          ? Math.min(max, Math.max(min, number))
          : min
      const disabled = props.disabled || props.readOnly || !validRange
      const valueText = validRange ? String(current) : '—'
      return h(UiSlider, {
        ...attrs,
        modelValue: [validRange ? current : 0],
        valueText: props.showValue ? valueText : undefined,
        min: validRange ? min : 0,
        max: validRange ? max : 100,
        step: Number.isFinite(props.step) && props.step > 0 ? props.step : 1,
        disabled,
        'aria-invalid': validRange ? attrs['aria-invalid'] : true,
        'onUpdate:modelValue': (v: number[]) => {
          const val = v?.[0]
          if (!disabled && Number.isFinite(val)) {
            emit('update:value', val)
            props.onChange?.(val)
          }
        },
      })
    }
  },
})
