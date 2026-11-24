// @formivue-design/vue-ui — primitives — Select (sur le Select shadcn-vue :
// Trigger ChevronDown + Content popover + Item Check).
// options {label,value} ; valeur primitive ou tableau si multiple.
import { defineComponent, h, type PropType } from 'vue'
import {
  UiSelectContent,
  UiSelectGroup,
  UiSelectItem,
  UiSelectTrigger,
  UiSelectValue,
} from '../ui/select'
import { SelectRoot } from 'reka-ui'
import { cn } from '../lib/utils'

export interface ISelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

// Les schémas d'ère utilisent des valeurs ''/null comme option « hériter /
// réinitialiser » (ex. enum: ['editable', 'disabled', 'readOnly', ''] —
// contrat antd Select) ; reka interdit les SelectItem à valeur '' ou absente.
// Traduction sentinelle ↔ valeur d'ère aux frontières du SelectRoot.
const EMPTY_SENTINEL = '__dn_select_empty__'
const NULL_SENTINEL = '__dn_select_null__'
const toRekaValue = (v: string | number) => {
  if (v === '') return EMPTY_SENTINEL
  if (v == null) return NULL_SENTINEL
  return v
}
const fromRekaValue = (v: string | number) => {
  if (v === EMPTY_SENTINEL) return ''
  if (v === NULL_SENTINEL) return null
  return v
}

export const Select = defineComponent({
  name: 'DSelect',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<ISelectOption[]>, default: () => [] },
    value: {
      type: [String, Number, Array] as PropType<
        string | number | (string | number)[]
      >,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<
        (value: string | number | (string | number)[]) => void
      >,
      default: undefined,
    },
    // valeur affichée tant que `value` est indéfinie (defaultValue antd d'ère,
    // ex. x-display « visible » / x-pattern « editable » des settings)
    defaultValue: {
      type: [String, Number, Array] as PropType<
        string | number | (string | number)[]
      >,
      default: undefined,
    },
    multiple: { type: Boolean, default: false },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const current = () =>
      props.value === undefined ? props.defaultValue : props.value
    const selectedLabel = () => {
      const v = current()
      if (v === undefined) return props.placeholder
      if (Array.isArray(v)) {
        const labels = v
          .map((x) => props.options.find((o) => o.value === x)?.label)
          .filter(Boolean)
        return labels.length ? labels.join(', ') : props.placeholder
      }
      return (
        props.options.find((o) => o.value === v)?.label ?? props.placeholder
      )
    }
    return () =>
      h(
        SelectRoot,
        {
          multiple: props.multiple,
          disabled: props.disabled || props.readOnly,
          modelValue: Array.isArray(current())
            ? (current() as (string | number)[]).map((x) => toRekaValue(x))
            : toRekaValue(current() as string | number),
          'onUpdate:modelValue': (v: string | number | (string | number)[]) => {
            const restored = Array.isArray(v)
              ? v.map((x) => fromRekaValue(x))
              : fromRekaValue(v)
            emit('update:value', restored as any)
            props.onChange?.(restored as any)
          },
        },
        {
          default: () => [
            h(
              UiSelectTrigger,
              {
                // attrs (id injecté par le FormItem, aria-*, data-*) suivent
                // vers le TRIGGER — SelectRoot (reka) ne rend aucun élément,
                // un fallthrough y perdrait l'association label↔contrôle
                ...attrs,
                // a11y (V8/axe) : un role=combobox ne peut être nommé par son
                // contenu — aria-label explicite quand on a un label
                // sélectionné ou un placeholder ; sinon on l'omet pour que le
                // <label for> du FormItem (id injecté, fix 6.4) nomme le
                // contrôle
                ...(selectedLabel() ? { 'aria-label': selectedLabel() } : {}),
                size: 'sm',
                class: cn('w-full', attrs.class),
              },
              {
                default: () =>
                  h(
                    UiSelectValue,
                    {},
                    {
                      // label résolu maison : le texte de l'option sélectionnée
                      // (les items ne vivent que dans le contenu ouvert)
                      default: () => selectedLabel(),
                    },
                  ),
              },
            ),
            h(
              UiSelectContent,
              {},
              {
                default: () =>
                  h(
                    UiSelectGroup,
                    {},
                    {
                      default: () =>
                        props.options.map((o) =>
                          h(
                            UiSelectItem,
                            {
                              key: String(o.value),
                              // sentinelle : reka interdit '' (hériter d'ère)
                              value: toRekaValue(o.value),
                              disabled: o.disabled,
                            },
                            { default: () => o.label },
                          ),
                        ),
                    },
                  ),
              },
            ),
          ],
        },
      )
  },
})
