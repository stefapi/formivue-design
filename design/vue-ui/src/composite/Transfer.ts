// @formivue-design/vue-ui — composite — Transfer (maison, V3 backlog levé) : deux
// listes (source / cible) à cases à cocher et boutons de transfert. Valeur =
// tableau des valeurs présentes dans la cible (targetKeys antd). Options
// {label,value,disabled?}. `oneWay` : la cible n'a pas de cases, chaque
// élément s'en retire par sa croix. Recherche et « tout cocher » par liste.
// Pas de Transfer dans shadcn-vue : assemblé avec ses pièces — Checkbox
// (reka, état indeterminate pour « tout cocher »), Button (icônes), Input.
// a11y : chaque liste est un groupe nommé, cases liées à leur libellé.
import { defineComponent, h, ref, useId, type PropType } from 'vue'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { UiButton } from '../ui/button'
import { UiCheckbox } from '../ui/checkbox'
import { UiInput } from '../ui/input'
import { cn } from '../lib/utils'

export interface ITransferOption {
  label: string
  value: string | number
  disabled?: boolean
}

type TValue = string | number

export const Transfer = defineComponent({
  name: 'DTransfer',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<ITransferOption[]>, default: () => [] },
    value: { type: Array as PropType<TValue[]>, default: undefined },
    onChange: {
      type: Function as PropType<(value: TValue[]) => void>,
      default: undefined,
    },
    titles: { type: Array as PropType<string[]>, default: undefined },
    operations: { type: Array as PropType<string[]>, default: undefined },
    showSearch: { type: Boolean, default: false },
    showSelectAll: { type: Boolean, default: true },
    oneWay: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const uid = useId()
    const checked = ref<{ left: TValue[]; right: TValue[] }>({
      left: [],
      right: [],
    })
    const keywords = ref({ left: '', right: '' })

    const commit = (next: TValue[]) => {
      emit('update:value', next)
      props.onChange?.(next)
    }
    const move = (to: 'left' | 'right', items?: TValue[]) => {
      const target = props.value ?? []
      const from = to === 'right' ? 'left' : 'right'
      const moving = items ?? checked.value[from]
      const next =
        to === 'right'
          ? [...target, ...moving.filter((v) => !target.includes(v))]
          : target.filter((v) => !moving.includes(v))
      checked.value = { ...checked.value, [from]: [] }
      commit(next)
    }

    const renderList = (side: 'left' | 'right', items: ITransferOption[]) => {
      const keyword = keywords.value[side].trim().toLowerCase()
      const shown = keyword
        ? items.filter((item) =>
            String(item.label).toLowerCase().includes(keyword),
          )
        : items
      const selectable = shown.filter((item) => !item.disabled)
      const selected = checked.value[side]
      const withBoxes = !(props.oneWay && side === 'right')
      const allChecked =
        selectable.length > 0 &&
        selectable.every((item) => selected.includes(item.value))
      const someChecked = selectable.some((item) =>
        selected.includes(item.value),
      )
      const title =
        props.titles?.[side === 'left' ? 0 : 1] ??
        (side === 'left' ? 'Source' : 'Target')
      const toggle = (value: TValue, on: boolean) => {
        const current = checked.value[side]
        checked.value = {
          ...checked.value,
          [side]: on ? [...current, value] : current.filter((v) => v !== value),
        }
      }
      return h(
        'div',
        {
          role: 'group',
          'aria-label': title,
          class:
            'flex h-56 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-input',
        },
        [
          // en-tête : tout cocher + compteur + titre
          h(
            'div',
            {
              class:
                'flex h-8 shrink-0 items-center gap-2 border-b border-input px-2 text-xs',
            },
            [
              withBoxes && props.showSelectAll
                ? h(UiCheckbox, {
                    'aria-label': `Select all ${title}`,
                    disabled: props.disabled || !selectable.length,
                    modelValue: allChecked
                      ? true
                      : someChecked
                        ? 'indeterminate'
                        : false,
                    'onUpdate:modelValue': (on: boolean | 'indeterminate') => {
                      checked.value = {
                        ...checked.value,
                        [side]:
                          on === true
                            ? selectable.map((item) => item.value)
                            : [],
                      }
                    },
                  })
                : null,
              h(
                'span',
                { class: 'text-muted-foreground' },
                withBoxes && selected.length
                  ? `${selected.length}/${items.length}`
                  : `${items.length}`,
              ),
              h('span', { class: 'ml-auto truncate font-medium' }, title),
            ],
          ),
          props.showSearch
            ? h('div', { class: 'shrink-0 p-1.5' }, [
                h(UiInput, {
                  type: 'search',
                  placeholder: 'Search',
                  'aria-label': `Search ${title}`,
                  value: keywords.value[side],
                  class: 'h-7 px-2 text-xs md:text-xs',
                  onInput: (e: Event) => {
                    keywords.value = {
                      ...keywords.value,
                      [side]: (e.target as HTMLInputElement).value,
                    }
                  },
                }),
              ])
            : null,
          shown.length
            ? h(
                'ul',
                { class: 'min-h-0 flex-1 overflow-y-auto p-1' },
                shown.map((item) => {
                  const id = `${uid}-${side}-${item.value}`
                  return h(
                    'li',
                    {
                      key: String(item.value),
                      class: cn(
                        'flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-accent',
                        item.disabled && 'opacity-50',
                      ),
                    },
                    withBoxes
                      ? [
                          h(UiCheckbox, {
                            id,
                            disabled: props.disabled || item.disabled,
                            modelValue: selected.includes(item.value),
                            'onUpdate:modelValue': (on: boolean) =>
                              toggle(item.value, on === true),
                          }),
                          h(
                            'label',
                            {
                              for: id,
                              class: cn(
                                'min-w-0 flex-1 cursor-pointer truncate',
                                item.disabled && 'cursor-not-allowed',
                              ),
                            },
                            item.label,
                          ),
                        ]
                      : [
                          h(
                            'span',
                            { class: 'min-w-0 flex-1 truncate' },
                            item.label,
                          ),
                          h(
                            UiButton,
                            {
                              variant: 'ghost',
                              size: 'icon-xs',
                              'aria-label': `Remove ${item.label}`,
                              disabled: props.disabled || item.disabled,
                              class: 'text-muted-foreground',
                              onClick: () => move('left', [item.value]),
                            },
                            { default: () => h(X) },
                          ),
                        ],
                  )
                }),
              )
            : h(
                'div',
                {
                  class:
                    'flex flex-1 items-center justify-center text-xs text-muted-foreground',
                },
                'No data',
              ),
        ],
      )
    }

    const moveButton = (
      to: 'left' | 'right',
      label: string,
      icon: typeof ChevronLeft,
      disabled: boolean,
    ) =>
      h(
        UiButton,
        {
          variant: 'outline',
          size: 'icon-sm',
          'aria-label': label,
          title: label,
          class: 'size-7',
          disabled,
          onClick: () => move(to),
        },
        { default: () => h(icon) },
      )

    return () => {
      const target = props.value ?? []
      const left = props.options.filter((item) => !target.includes(item.value))
      // ordre de la cible = ordre de la valeur
      const right = target
        .map((value) => props.options.find((item) => item.value === value))
        .filter(Boolean) as ITransferOption[]
      return h(
        'div',
        {
          ...attrs,
          'data-slot': 'transfer',
          class: cn(
            'flex w-full items-center gap-2',
            props.disabled && 'opacity-60',
            attrs.class as string,
          ),
        },
        [
          renderList('left', left),
          h('div', { class: 'flex shrink-0 flex-col gap-1.5' }, [
            moveButton(
              'right',
              props.operations?.[0] || 'Move to target',
              ChevronRight,
              props.disabled || !checked.value.left.length,
            ),
            props.oneWay
              ? null
              : moveButton(
                  'left',
                  props.operations?.[1] || 'Move to source',
                  ChevronLeft,
                  props.disabled || !checked.value.right.length,
                ),
          ]),
          renderList('right', right),
        ],
      )
    }
  },
})
