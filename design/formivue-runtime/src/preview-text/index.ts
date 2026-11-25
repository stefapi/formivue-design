// formivue/vue — preview-text (port adaptatif de l'ère @formivue/antd : la
// valeur en lecture, sans antd — tokens shadcn, `N/A` comme placeholder).
// Variantes : Input (base), NumberPicker, DatePicker, TimePicker (aliases)
// + Select (résout les labels depuis field.dataSource / props.options).
import { defineComponent, h, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useField } from '@formivue/vue'
import { isArr, isValid } from '@formivue/shared'
import cls from 'classnames'
import { Rate as DRate } from '@formivue-design/vue-ui'
import { derived } from '../shared'

const takePlaceholder = (value: any, placeholder?: string) =>
  isValid(value) && value !== '' ? value : (placeholder ?? 'N/A')

export const PreviewText = defineComponent({
  name: 'DPreviewText',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<any>, default: undefined },
    placeholder: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: cls(
            'text-foreground flex flex-wrap items-center gap-2 text-sm',
            attrs.class as string,
          ),
        },
        slots.default?.() ?? [
          h(
            'span',
            { class: 'text-sm' },
            String(takePlaceholder(props.value, props.placeholder)),
          ),
        ],
      )
  },
})

// variante Select : labels résolus (dataSource du champ ou options du prop),
// multiples rendus en liste de badges.
const PreviewTextSelect = observer(
  defineComponent({
    name: 'DPreviewTextSelect',
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<any>, default: undefined },
      options: { type: Array, default: () => [] },
      placeholder: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      const fieldRef = useField() as any
      const labels = derived(() => {
        const dataSource: any[] = fieldRef.value?.dataSource?.length
          ? fieldRef.value.dataSource
          : isArr(props.options)
            ? (props.options as any[])
            : []
        const value = props.value
        if (!isValid(value) || value === '')
          return [takePlaceholder(value, props.placeholder)]
        const values = isArr(value) ? value : [value]
        return values
          .map(
            (val) =>
              dataSource.find((item) => item?.value === val)?.label ?? val,
          )
          .map((label) => String(label))
      })
      return () =>
        h(
          'div',
          {
            ...attrs,
            class: cls(
              'text-foreground flex flex-wrap items-center gap-2 text-sm',
              attrs.class as string,
            ),
          },
          labels.value.map((label: string, key: number) =>
            h(
              'span',
              {
                key,
                class:
                  'bg-secondary text-secondary-foreground rounded-sm px-1.5 py-0.5 text-xs',
              },
              label,
            ),
          ),
        )
    },
  }),
)

// libellés résolus dans un arbre d'options (TreeSelect : valeur(s) feuille,
// Cascader : chemin de valeurs joint par le séparateur)
const findTreeLabel = (options: any[] = [], value: any): any => {
  for (const option of options) {
    if (option?.value === value) return option.label
    const found = findTreeLabel(option?.children, value)
    if (found !== undefined) return found
  }
  return undefined
}

const badges = (attrs: any, labels: string[]) =>
  h(
    'div',
    {
      ...attrs,
      class: cls(
        'text-foreground flex flex-wrap items-center gap-2 text-sm',
        attrs.class as string,
      ),
    },
    labels.map((label, key) =>
      h(
        'span',
        {
          key,
          class:
            'bg-secondary text-secondary-foreground rounded-sm px-1.5 py-0.5 text-xs',
        },
        label,
      ),
    ),
  )

const useOptions = (props: any) => {
  const fieldRef = useField() as any
  return () =>
    fieldRef.value?.dataSource?.length
      ? fieldRef.value.dataSource
      : isArr(props.options)
        ? props.options
        : []
}

const PreviewTextTreeSelect = observer(
  defineComponent({
    name: 'DPreviewTextTreeSelect',
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<any>, default: undefined },
      options: { type: Array, default: () => [] },
      placeholder: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      const options = useOptions(props)
      return () => {
        const value = props.value
        if (!isValid(value) || value === '' || (isArr(value) && !value.length))
          return badges(attrs, [takePlaceholder(undefined, props.placeholder)])
        const values = isArr(value) ? value : [value]
        return badges(
          attrs,
          values.map((val) => String(findTreeLabel(options(), val) ?? val)),
        )
      }
    },
  }),
)

const PreviewTextCascader = observer(
  defineComponent({
    name: 'DPreviewTextCascader',
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<any>, default: undefined },
      options: { type: Array, default: () => [] },
      placeholder: { type: String, default: undefined },
      separator: { type: String, default: ' / ' },
    },
    setup(props, { attrs }) {
      const options = useOptions(props)
      return () => {
        const path: any[] = isArr(props.value) ? props.value : []
        if (!path.length)
          return h(PreviewText, { ...attrs, placeholder: props.placeholder })
        let level: any[] = options()
        const labels = path.map((val) => {
          const option = level?.find((item: any) => item?.value === val)
          level = option?.children ?? []
          return String(option?.label ?? val)
        })
        return h(PreviewText, {
          ...attrs,
          value: labels.join(props.separator),
        })
      }
    },
  }),
)

const PreviewTextRange = defineComponent({
  name: 'DPreviewTextRange',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<any>, default: undefined },
    placeholder: { type: null as unknown as PropType<any>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const [start, end] = isArr(props.value) ? props.value : []
      return h(PreviewText, {
        ...attrs,
        value: start || end ? `${start || 'N/A'} ~ ${end || 'N/A'}` : undefined,
      })
    }
  },
})

const PreviewTextRate = defineComponent({
  name: 'DPreviewTextRate',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h(DRate, { ...attrs, readOnly: true })
  },
})

const PreviewTextUpload = defineComponent({
  name: 'DPreviewTextUpload',
  inheritAttrs: false,
  props: {
    value: { type: null as unknown as PropType<any>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const files: any[] = isArr(props.value) ? props.value : []
      if (!files.length) return h(PreviewText, attrs)
      return h(
        'ul',
        {
          ...attrs,
          class: cls('flex flex-col gap-1 text-sm', attrs.class as string),
        },
        files.map((file, key) =>
          h('li', { key }, [
            file?.url
              ? h(
                  'a',
                  {
                    href: file.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    class: 'text-primary hover:underline',
                  },
                  file.name ?? file.url,
                )
              : h('span', {}, file?.name ?? ''),
          ]),
        ),
      )
    }
  },
})

export type IComposedPreviewText = typeof PreviewText & {
  Input?: typeof PreviewText
  Select?: typeof PreviewTextSelect
  NumberPicker?: typeof PreviewText
  DatePicker?: typeof PreviewText
  TimePicker?: typeof PreviewText
  TreeSelect?: typeof PreviewTextTreeSelect
  Cascader?: typeof PreviewTextCascader
  Transfer?: typeof PreviewTextSelect
  Rate?: typeof PreviewTextRate
  Upload?: typeof PreviewTextUpload
  DateRangePicker?: typeof PreviewTextRange
  TimeRangePicker?: typeof PreviewTextRange
}

// PreviewText composé : variantes d'ère en propriétés statiques (contrat
// @formivue/antd — PreviewText.Input, PreviewText.Select…).
export const ComposedPreviewText: IComposedPreviewText = PreviewText as any
export type ComposedPreviewText = IComposedPreviewText

ComposedPreviewText.Input = PreviewText
ComposedPreviewText.Select = PreviewTextSelect
ComposedPreviewText.NumberPicker = PreviewText
ComposedPreviewText.DatePicker = PreviewText
ComposedPreviewText.TimePicker = PreviewText
ComposedPreviewText.TreeSelect = PreviewTextTreeSelect
ComposedPreviewText.Cascader = PreviewTextCascader
ComposedPreviewText.Transfer = PreviewTextSelect
ComposedPreviewText.Rate = PreviewTextRate
ComposedPreviewText.Upload = PreviewTextUpload
ComposedPreviewText.DateRangePicker = PreviewTextRange
ComposedPreviewText.TimeRangePicker = PreviewTextRange
