// @formivue-design/vue-ui — composite — Cascader (maison, V3 backlog levé) :
// sélection d'un chemin dans un arbre d'options, une colonne par niveau dans
// un Popover. Valeur = tableau des valeurs du chemin (contrat antd).
// `changeOnSelect` : chaque niveau cliqué devient la valeur (sinon seule une
// feuille valide). a11y : colonnes role=listbox, options role=option
// (aria-selected), navigation clavier ↑/↓ dans une colonne, → ouvre le
// niveau suivant, ← revient au précédent, Entrée valide.
import { defineComponent, h, nextTick, ref, type PropType } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { UiButton } from '../ui/button'
import { UiPopover } from '../ui/tooltip'
import { cn } from '../lib/utils'
import {
  renderTriggerContent,
  resolveValuePath,
  comboboxTriggerClass,
  type ITreeOption,
} from './shared'

export type ICascaderOption = ITreeOption

export const Cascader = defineComponent({
  name: 'DCascader',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<ICascaderOption[]>, default: () => [] },
    value: {
      type: Array as PropType<(string | number)[]>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(value: (string | number)[]) => void>,
      default: undefined,
    },
    placeholder: { type: String, default: undefined },
    changeOnSelect: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    separator: { type: String, default: ' / ' },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const open = ref(false)
    // chemin en cours de navigation (peut différer de la valeur validée)
    const activePath = ref<(string | number)[]>([])
    const panel = ref<HTMLElement>()

    const commit = (path: (string | number)[]) => {
      emit('update:value', path)
      props.onChange?.(path)
    }
    const setOpen = (next: boolean) => {
      open.value = next
      if (next) {
        activePath.value = [...(props.value ?? [])]
        nextTick(() =>
          panel.value
            ?.querySelector<HTMLElement>(
              '[role="option"][aria-selected="true"], [role="option"]',
            )
            ?.focus(),
        )
      }
    }
    const pick = (level: number, option: ICascaderOption) => {
      if (option.disabled) return
      const path = [...activePath.value.slice(0, level), option.value]
      activePath.value = path
      const isLeaf = !option.children?.length
      if (isLeaf) {
        commit(path)
        open.value = false
      } else if (props.changeOnSelect) {
        commit(path)
      }
      if (!isLeaf)
        nextTick(() =>
          panel.value
            ?.querySelector<HTMLElement>(
              `[data-level="${level + 1}"] [role="option"]`,
            )
            ?.focus(),
        )
    }
    const onOptionKeydown =
      (level: number, option: ICascaderOption) => (e: KeyboardEvent) => {
        const target = e.currentTarget as HTMLElement
        const siblings = Array.from(
          target.parentElement?.querySelectorAll<HTMLElement>(
            '[role="option"]',
          ) ?? [],
        )
        const index = siblings.indexOf(target)
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          siblings[Math.min(siblings.length - 1, index + 1)]?.focus()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          siblings[Math.max(0, index - 1)]?.focus()
        } else if (e.key === 'ArrowRight' && option.children?.length) {
          e.preventDefault()
          pick(level, option)
        } else if (e.key === 'ArrowLeft' && level > 0) {
          e.preventDefault()
          panel.value
            ?.querySelector<HTMLElement>(
              `[data-level="${level - 1}"] [aria-selected="true"]`,
            )
            ?.focus()
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // feuille : pick valide et ferme ; nœud : pick navigue (et valide
          // en changeOnSelect, où Entrée ferme aussi)
          pick(level, option)
          if (option.children?.length && props.changeOnSelect)
            open.value = false
        }
      }

    return () => {
      const selected = resolveValuePath(props.options, props.value)
      const label = selected.map((option) => option.label).join(props.separator)
      // colonnes : racine + enfants de chaque niveau actif
      const columns: ICascaderOption[][] = [props.options]
      resolveValuePath(props.options, activePath.value).forEach((option) => {
        if (option.children?.length) columns.push(option.children)
      })
      return h(
        UiPopover,
        {
          open: open.value,
          'onUpdate:open': setOpen,
          align: 'start',
          class: 'w-auto max-w-[90vw] p-0',
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
                'data-slot': 'cascader',
                disabled: props.disabled,
                'aria-haspopup': 'listbox',
                'aria-expanded': open.value,
                class: comboboxTriggerClass(!label, attrs.class),
              },
              {
                default: () =>
                  renderTriggerContent({
                    label,
                    placeholder: props.placeholder,
                    clearable: props.allowClear && !props.disabled,
                    onClear: () => commit([]),
                  }),
              },
            ),
          content: () =>
            h(
              'div',
              { ref: panel, class: 'flex max-h-64 overflow-x-auto' },
              columns.map((column, level) =>
                h(
                  'ul',
                  {
                    key: level,
                    role: 'listbox',
                    'data-level': level,
                    'aria-label': `Level ${level + 1}`,
                    class: cn(
                      'min-w-36 overflow-y-auto p-1',
                      level > 0 && 'border-l border-border',
                    ),
                  },
                  column.map((option) => {
                    const active = activePath.value[level] === option.value
                    return h(
                      'li',
                      {
                        key: String(option.value),
                        role: 'option',
                        tabindex: -1,
                        'aria-selected': active,
                        'aria-disabled': option.disabled || undefined,
                        class: cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm outline-none select-none',
                          'hover:bg-accent focus-visible:bg-accent',
                          active && 'bg-primary/10 text-primary',
                          option.disabled && 'pointer-events-none opacity-50',
                        ),
                        onClick: () => pick(level, option),
                        onKeydown: onOptionKeydown(level, option),
                      },
                      [
                        h('span', { class: 'truncate' }, option.label),
                        option.children?.length
                          ? h(ChevronRight, { class: 'size-3.5 opacity-60' })
                          : null,
                      ],
                    )
                  }),
                ),
              ),
            ),
        },
      )
    }
  },
})
