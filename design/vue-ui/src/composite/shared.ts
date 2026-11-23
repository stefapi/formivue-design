// @formivue-design/vue-ui — composite — utilitaires partagés des sélecteurs
// arborescents (Cascader, TreeSelect) : déclencheur au gabarit du Select
// shadcn, options en arbre {label,value,children?,disabled?}.
import { h } from 'vue'
import { ChevronDown, X } from '@lucide/vue'
import { cn } from '../lib/utils'

export interface ITreeOption {
  label: string
  value: string | number
  children?: ITreeOption[]
  disabled?: boolean
}

// déclencheur au gabarit Combobox shadcn-vue (Button outline, libellé à
// gauche, chevron à droite) — classes complémentaires au UiButton
export const comboboxTriggerClass = (empty: boolean, extra?: unknown) =>
  cn(
    'group h-8 w-full min-w-0 justify-between px-2 font-normal',
    empty && 'text-muted-foreground',
    extra as string,
  )

// contenu du déclencheur : libellé (ou placeholder), croix d'effacement au
// survol si une valeur existe, chevron
export const renderTriggerContent = (options: {
  label?: string
  placeholder?: string
  clearable?: boolean
  onClear?: () => void
}) => [
  h(
    'span',
    { class: 'min-w-0 flex-1 truncate text-left' },
    options.label || options.placeholder || '',
  ),
  options.clearable && options.label
    ? h(
        'span',
        {
          role: 'button',
          tabindex: -1,
          'aria-label': 'Clear',
          class:
            'text-muted-foreground hover:text-foreground hidden shrink-0 group-hover:inline-flex',
          onPointerdown: (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
          },
          onClick: (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            options.onClear?.()
          },
        },
        [h(X, { class: 'size-3.5' })],
      )
    : null,
  h(ChevronDown, {
    class: cn(
      'size-4 shrink-0 opacity-50',
      options.clearable && options.label && 'group-hover:hidden',
    ),
  }),
]

// chemin d'options (racine → nœud) menant à une valeur
export const findOptionPath = (
  options: ITreeOption[] = [],
  value: string | number,
): ITreeOption[] | undefined => {
  for (const option of options) {
    if (option.value === value) return [option]
    const sub = findOptionPath(option.children, value)
    if (sub) return [option, ...sub]
  }
  return undefined
}

// options correspondant à un chemin de valeurs (Cascader)
export const resolveValuePath = (
  options: ITreeOption[] = [],
  path: (string | number)[] = [],
): ITreeOption[] => {
  const resolved: ITreeOption[] = []
  let level = options
  for (const value of path) {
    const option = level?.find((item) => item.value === value)
    if (!option) break
    resolved.push(option)
    level = option.children ?? []
  }
  return resolved
}

export const flattenOptions = (options: ITreeOption[] = []): ITreeOption[] =>
  options.flatMap((option) => [option, ...flattenOptions(option.children)])
