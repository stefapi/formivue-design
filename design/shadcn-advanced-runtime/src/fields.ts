import { computed, defineComponent, h, isVNode, type PropType } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  PinInputInput,
  PinInputRoot,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
  ToggleGroupItem,
  ToggleGroupRoot,
} from 'reka-ui'
import { CheckIcon, ChevronsUpDownIcon, XIcon } from '@lucide/vue'
import { useAdvancedOverlayTarget } from './overlay'

type ChoiceValue = string | number
export interface AdvancedOption {
  value: ChoiceValue
  label?: string
  disabled?: boolean
}

const optionsProp = {
  type: Array as PropType<AdvancedOption[]>,
  default: () => [],
}
const textInput =
  'min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
const inputFrame =
  'flex min-h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2 shadow-xs focus-within:ring-2 focus-within:ring-ring/50'
const optionLabel = (option: AdvancedOption) =>
  option.label ?? String(option.value)

const ComboboxControl = defineComponent({
  name: 'Combobox',
  inheritAttrs: false,
  props: {
    value: [String, Number] as PropType<ChoiceValue>,
    options: optionsProp,
    disabled: Boolean,
    readOnly: Boolean,
    placeholder: { type: String, default: 'Search options…' },
    emptyText: { type: String, default: 'No matching options' },
  },
  emits: ['change'],
  setup(props, { attrs, emit }) {
    const overlayTarget = useAdvancedOverlayTarget()
    const selected = computed(() =>
      props.options.find((option) => option.value === props.value),
    )
    return () => {
      const { class: className, style, ...inputAttrs } = attrs
      return h(
        ComboboxRoot,
        {
          class: ['relative min-w-0', className],
          style,
          modelValue: selected.value ?? null,
          by: 'value',
          disabled: props.disabled || props.readOnly,
          openOnClick: true,
          'onUpdate:modelValue': (option) =>
            emit('change', (option as AdvancedOption)?.value),
        },
        () => [
          h(ComboboxAnchor, { class: inputFrame }, () => [
            h(ComboboxInput, {
              ...inputAttrs,
              'aria-label': inputAttrs['aria-label'] ?? 'Search options',
              placeholder: props.placeholder,
              displayValue: (option) =>
                option ? optionLabel(option as AdvancedOption) : '',
              class: [textInput, 'flex-1 py-1'],
            }),
            h(
              ComboboxTrigger,
              {
                'aria-label': 'Show options',
                class: 'shrink-0 rounded-sm p-1 text-muted-foreground',
              },
              () =>
                h(ChevronsUpDownIcon, { class: 'size-4', 'aria-hidden': true }),
            ),
          ]),
          h(ComboboxPortal, { to: overlayTarget?.value }, () =>
            h(
              ComboboxContent,
              {
                position: 'popper',
                sideOffset: 4,
                collisionPadding: 8,
                class:
                  'pointer-events-auto z-50 w-(--reka-combobox-trigger-width) rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
              },
              () => [
                h(
                  ComboboxEmpty,
                  { class: 'p-2 text-sm text-muted-foreground' },
                  () => props.emptyText,
                ),
                h(
                  ComboboxViewport,
                  {
                    class:
                      'max-h-[min(15rem,var(--reka-combobox-content-available-height))] overflow-y-auto',
                  },
                  () =>
                    props.options.map((option) =>
                      h(
                        ComboboxItem,
                        {
                          key: option.value,
                          value: option,
                          disabled: option.disabled,
                          class:
                            'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50',
                        },
                        () => [
                          h(
                            'span',
                            { class: 'min-w-0 flex-1 wrap-anywhere' },
                            optionLabel(option),
                          ),
                          h(ComboboxItemIndicator, {}, () =>
                            h(CheckIcon, {
                              class: 'size-4',
                              'aria-hidden': true,
                            }),
                          ),
                        ],
                      ),
                    ),
                ),
              ],
            ),
          ),
        ],
      )
    }
  },
})

const TagsInputControl = defineComponent({
  name: 'TagsInput',
  inheritAttrs: false,
  props: {
    value: { type: Array as PropType<string[]>, default: () => [] },
    disabled: Boolean,
    readOnly: Boolean,
    placeholder: { type: String, default: 'Add a tag…' },
    max: Number,
    delimiter: { type: String, default: ',' },
  },
  emits: ['change'],
  setup(props, { attrs, emit }) {
    return () => {
      const { class: className, style, ...inputAttrs } = attrs
      return h(
        TagsInputRoot,
        {
          class: [inputFrame, 'min-w-0 flex-wrap py-1', className],
          style,
          modelValue: props.value ?? [],
          disabled: props.disabled || props.readOnly,
          max: props.max > 0 ? props.max : undefined,
          delimiter: props.delimiter,
          addOnPaste: true,
          'onUpdate:modelValue': (tags) => emit('change', tags),
        },
        () => [
          ...(props.value ?? []).map((tag) =>
            h(
              TagsInputItem,
              {
                key: tag,
                value: tag,
                class:
                  'inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-sm text-secondary-foreground data-[state=active]:outline-ring',
              },
              () => [
                h(TagsInputItemText, { class: 'min-w-0 wrap-anywhere' }),
                h(
                  TagsInputItemDelete,
                  {
                    'aria-label': `Remove ${tag}`,
                    class:
                      'shrink-0 rounded-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  },
                  () => h(XIcon, { class: 'size-3', 'aria-hidden': true }),
                ),
              ],
            ),
          ),
          h(TagsInputInput, {
            ...inputAttrs,
            'aria-label': inputAttrs['aria-label'] ?? 'Tags',
            placeholder: props.placeholder,
            class: [textInput, 'min-h-7 w-0 min-w-[min(6rem,100%)] flex-1'],
          }),
        ],
      )
    }
  },
})

const InputOTPControl = defineComponent({
  name: 'InputOTP',
  inheritAttrs: false,
  props: {
    value: String,
    length: { type: Number, default: 6 },
    disabled: Boolean,
    readOnly: Boolean,
    mask: Boolean,
  },
  emits: ['change'],
  setup(props, { attrs, emit }) {
    return () => {
      const { id, 'aria-label': label = 'One-time code', ...groupAttrs } = attrs
      const length = Math.max(1, Math.min(12, Math.trunc(props.length) || 6))
      return h(
        PinInputRoot,
        {
          ...groupAttrs,
          role: 'group',
          'aria-label': label,
          class: ['flex flex-wrap gap-1.5', groupAttrs.class],
          modelValue: (props.value ?? '').split('').slice(0, length),
          disabled: props.disabled || props.readOnly,
          mask: props.mask,
          otp: true,
          type: 'number',
          'onUpdate:modelValue': (characters) =>
            emit('change', characters.join('')),
        },
        () =>
          Array.from({ length }, (_, index) =>
            h(PinInputInput, {
              key: index,
              index,
              id: index === 0 ? id : undefined,
              'aria-label': `${label} ${index + 1} / ${length}`,
              class:
                'size-9 rounded-md border border-input bg-background text-center text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50',
            }),
          ),
      )
    }
  },
})

const ToggleGroupControl = defineComponent({
  name: 'ToggleGroup',
  inheritAttrs: false,
  props: {
    value: [String, Number, Array] as PropType<ChoiceValue | ChoiceValue[]>,
    options: optionsProp,
    multiple: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
  },
  emits: ['change'],
  setup(props, { attrs, emit }) {
    return () => {
      const selected = Array.isArray(props.value)
        ? props.value
        : props.value == null
          ? []
          : [props.value]
      const keys = selected.map((value) => JSON.stringify(value))
      const { id, ...groupAttrs } = attrs
      return h(
        ToggleGroupRoot,
        {
          ...groupAttrs,
          'aria-label': groupAttrs['aria-label'] ?? 'Options',
          class: [
            'inline-flex min-w-0 max-w-full flex-wrap gap-1 rounded-md',
            attrs.class,
          ],
          type: props.multiple ? 'multiple' : 'single',
          modelValue: props.multiple ? keys : (keys[0] ?? ''),
          disabled: props.disabled || props.readOnly,
          'onUpdate:modelValue': (value) => {
            const selectedKeys = Array.isArray(value)
              ? value
              : value
                ? [value]
                : []
            const selectedOptions = selectedKeys.flatMap((key) => {
              const option = props.options.find(
                (item) => JSON.stringify(item.value) === key,
              )
              return option ? [option.value] : []
            })
            emit(
              'change',
              props.multiple ? selectedOptions : selectedOptions[0],
            )
          },
        },
        () =>
          props.options.map((option, index) =>
            h(
              ToggleGroupItem,
              {
                key: option.value,
                id: index === 0 ? id : undefined,
                value: JSON.stringify(option.value),
                disabled: option.disabled,
                class:
                  'inline-flex min-h-9 min-w-0 max-w-full items-center justify-center rounded-md border border-input px-3 py-1 text-sm font-medium wrap-anywhere hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground disabled:opacity-50',
              },
              () =>
                h(
                  'span',
                  { class: 'min-w-0 wrap-anywhere' },
                  optionLabel(option),
                ),
            ),
          ),
      )
    }
  },
})

const ReadValue = defineComponent({
  inheritAttrs: false,
  props: {
    value: [String, Number, Array] as PropType<ChoiceValue | ChoiceValue[]>,
    options: optionsProp,
    mask: Boolean,
  },
  setup(props) {
    return () => {
      const values = Array.isArray(props.value) ? props.value : [props.value]
      const label = values
        .flatMap((value) =>
          value == null
            ? []
            : [
                optionLabel(
                  props.options.find((option) => option.value === value) ?? {
                    value,
                  },
                ),
              ],
        )
        .join(', ')
      return h(
        'span',
        { class: 'text-sm wrap-anywhere' },
        props.mask ? '•'.repeat(label.length) : label || '—',
      )
    }
  },
})

function titleText(title: unknown): string | undefined {
  if (typeof title === 'string') return title
  if (Array.isArray(title))
    return title.map(titleText).filter(Boolean).join(' ') || undefined
  if (isVNode(title)) return titleText(title.children)
}

const labelFromField = mapProps((props, field) => ({
  'aria-label': props['aria-label'] ?? titleText(field.title),
}))
const optionsFromField = mapProps((props, field) => ({
  options:
    'dataSource' in field && field.dataSource?.length
      ? field.dataSource.map((option) =>
          typeof option === 'object' && option !== null
            ? option
            : { value: option },
        )
      : props['options'],
}))

export const Combobox = connect(
  ComboboxControl,
  labelFromField,
  optionsFromField,
  mapReadPretty(ReadValue),
)
export const TagsInput = connect(
  TagsInputControl,
  labelFromField,
  mapReadPretty(ReadValue),
)
export const InputOTP = connect(
  InputOTPControl,
  labelFromField,
  mapReadPretty(ReadValue),
)
export const ToggleGroup = connect(
  ToggleGroupControl,
  labelFromField,
  optionsFromField,
  mapReadPretty(ReadValue),
)
