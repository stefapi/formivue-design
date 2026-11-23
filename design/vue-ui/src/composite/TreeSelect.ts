// @formivue-design/vue-ui — composite — TreeSelect (maison, V3 backlog levé) :
// sélection dans un arbre d'options déroulé dans un Popover. Simple
// (valeur scalaire, fermeture au choix) ou `multiple` (treeCheckable antd :
// cases à cocher, valeur tableau, cocher un parent coche sa descendance).
// Recherche optionnelle (filtre les branches dont un nœud correspond).
// a11y : role=tree / treeitem (aria-level, aria-expanded, aria-selected),
// clavier ↑/↓, → déplie, ← replie, Entrée / Espace sélectionne.
import { computed, defineComponent, h, nextTick, ref, type PropType } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { UiButton } from '../ui/button'
import { UiCheckbox } from '../ui/checkbox'
import { UiInput } from '../ui/input'
import { UiPopover } from '../ui/tooltip'
import { cn } from '../lib/utils'
import {
  findOptionPath,
  flattenOptions,
  renderTriggerContent,
  comboboxTriggerClass,
  type ITreeOption,
} from './shared'

export type ITreeSelectOption = ITreeOption

type TValue = string | number

const descendants = (option: ITreeSelectOption): TValue[] =>
  (option.children ?? []).flatMap((child) => [
    child.value,
    ...descendants(child),
  ])

const filterTree = (
  options: ITreeSelectOption[],
  keyword: string,
): ITreeSelectOption[] =>
  options.flatMap((option) => {
    const children = filterTree(option.children ?? [], keyword)
    const matched = String(option.label).toLowerCase().includes(keyword)
    if (matched) return [option]
    return children.length ? [{ ...option, children }] : []
  })

export const TreeSelect = defineComponent({
  name: 'DTreeSelect',
  inheritAttrs: false,
  props: {
    options: {
      type: Array as PropType<ITreeSelectOption[]>,
      default: () => [],
    },
    value: {
      type: [String, Number, Array] as PropType<TValue | TValue[]>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(value: TValue | TValue[]) => void>,
      default: undefined,
    },
    multiple: { type: Boolean, default: false },
    placeholder: { type: String, default: undefined },
    allowClear: { type: Boolean, default: true },
    showSearch: { type: Boolean, default: false },
    treeDefaultExpandAll: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const open = ref(false)
    const keyword = ref('')
    const expanded = ref<Set<TValue>>(new Set())
    const panel = ref<HTMLElement>()

    const values = computed<TValue[]>(() => {
      const value = props.value
      if (value === undefined || value === null || value === '') return []
      return Array.isArray(value) ? value : [value]
    })

    const commit = (next: TValue | TValue[]) => {
      emit('update:value', next)
      props.onChange?.(next)
    }

    const setOpen = (next: boolean) => {
      open.value = next
      if (!next) return
      keyword.value = ''
      // déplie tout (option) ou les ancêtres des valeurs sélectionnées
      expanded.value = new Set(
        props.treeDefaultExpandAll
          ? flattenOptions(props.options)
              .filter((option) => option.children?.length)
              .map((option) => option.value)
          : values.value.flatMap(
              (value) =>
                findOptionPath(props.options, value)
                  ?.slice(0, -1)
                  .map((option) => option.value) ?? [],
            ),
      )
      nextTick(() =>
        panel.value
          ?.querySelector<HTMLElement>(
            '[role="treeitem"][aria-selected="true"], [role="treeitem"]',
          )
          ?.focus(),
      )
    }

    const toggleExpand = (option: ITreeSelectOption, force?: boolean) => {
      const next = new Set(expanded.value)
      const shouldOpen = force ?? !next.has(option.value)
      if (shouldOpen) next.add(option.value)
      else next.delete(option.value)
      expanded.value = next
    }

    const select = (option: ITreeSelectOption) => {
      if (option.disabled) return
      if (!props.multiple) {
        commit(option.value)
        open.value = false
        return
      }
      const group = [option.value, ...descendants(option)]
      const checked = values.value.includes(option.value)
      const next = checked
        ? values.value.filter((value) => !group.includes(value))
        : Array.from(new Set([...values.value, ...group]))
      commit(next)
    }

    const onItemKeydown = (option: ITreeSelectOption) => (e: KeyboardEvent) => {
      const items = Array.from(
        panel.value?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
      )
      const index = items.indexOf(e.currentTarget as HTMLElement)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        items[Math.min(items.length - 1, index + 1)]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        items[Math.max(0, index - 1)]?.focus()
      } else if (e.key === 'ArrowRight' && option.children?.length) {
        e.preventDefault()
        toggleExpand(option, true)
      } else if (e.key === 'ArrowLeft' && option.children?.length) {
        e.preventDefault()
        toggleExpand(option, false)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        select(option)
      }
    }

    const renderNodes = (
      options: ITreeSelectOption[],
      level: number,
      forceExpand: boolean,
    ): any[] =>
      options.flatMap((option) => {
        const hasChildren = !!option.children?.length
        const isOpen = forceExpand || expanded.value.has(option.value)
        const checked = values.value.includes(option.value)
        const row = h(
          'li',
          {
            key: String(option.value),
            role: 'treeitem',
            tabindex: -1,
            'aria-level': level,
            'aria-expanded': hasChildren ? isOpen : undefined,
            'aria-selected': checked,
            'aria-disabled': option.disabled || undefined,
            class: cn(
              'flex cursor-pointer items-center gap-1 rounded-sm py-1 pr-2 text-sm outline-none select-none',
              'hover:bg-accent focus-visible:bg-accent',
              checked && !props.multiple && 'bg-primary/10 text-primary',
              option.disabled && 'pointer-events-none opacity-50',
            ),
            style: { paddingLeft: `${(level - 1) * 16 + 4}px` },
            onClick: () => select(option),
            onKeydown: onItemKeydown(option),
          },
          [
            h(
              'span',
              {
                class: cn(
                  'inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground',
                  !hasChildren && 'invisible',
                ),
                onClick: (e: Event) => {
                  e.stopPropagation()
                  toggleExpand(option)
                },
              },
              [
                h(ChevronRight, {
                  class: cn(
                    'size-3.5 transition-transform',
                    isOpen && 'rotate-90',
                  ),
                }),
              ],
            ),
            props.multiple
              ? // case shadcn (reka Checkbox) : reflet visuel de l'état —
                // la sélection passe par la ligne treeitem (aria-selected),
                // la case n'est ni tabulable ni cliquable en propre
                h(UiCheckbox, {
                  modelValue: checked,
                  tabindex: -1,
                  'aria-hidden': 'true',
                  class: 'pointer-events-none mr-1',
                })
              : null,
            h('span', { class: 'truncate' }, option.label),
          ],
        )
        return [
          row,
          ...(hasChildren && isOpen
            ? renderNodes(option.children!, level + 1, forceExpand)
            : []),
        ]
      })

    return () => {
      const labels = values.value.map((value) => {
        const path = findOptionPath(props.options, value)
        return path?.[path.length - 1]?.label ?? String(value)
      })
      const label = labels.join(', ')
      const search = keyword.value.trim().toLowerCase()
      const visible = search ? filterTree(props.options, search) : props.options
      return h(
        UiPopover,
        {
          open: open.value,
          'onUpdate:open': setOpen,
          align: 'start',
          class: 'w-(--reka-popover-trigger-width) min-w-56 p-1',
        },
        {
          default: () =>
            h(
              UiButton,
              {
                ...attrs,
                // recette Combobox de shadcn-vue : Button outline + role=combobox
                variant: 'outline',
                role: 'combobox',
                'data-slot': 'tree-select',
                disabled: props.disabled,
                'aria-haspopup': 'tree',
                'aria-expanded': open.value,
                class: comboboxTriggerClass(!label, attrs.class),
              },
              {
                default: () =>
                  renderTriggerContent({
                    label,
                    placeholder: props.placeholder,
                    clearable: props.allowClear && !props.disabled,
                    onClear: () =>
                      commit(props.multiple ? [] : (undefined as any)),
                  }),
              },
            ),
          content: () =>
            h('div', { ref: panel }, [
              props.showSearch
                ? h(UiInput, {
                    type: 'search',
                    'aria-label': 'Search',
                    placeholder: 'Search',
                    value: keyword.value,
                    class: 'mb-1 h-7',
                    onInput: (e: Event) => {
                      keyword.value = (e.target as HTMLInputElement).value
                    },
                  })
                : null,
              visible.length
                ? h(
                    'ul',
                    {
                      role: 'tree',
                      'aria-multiselectable': props.multiple || undefined,
                      class: 'max-h-64 overflow-y-auto',
                    },
                    renderNodes(visible, 1, !!search),
                  )
                : h(
                    'div',
                    {
                      class: 'py-4 text-center text-sm text-muted-foreground',
                    },
                    'No data',
                  ),
            ]),
        },
      )
    }
  },
})
