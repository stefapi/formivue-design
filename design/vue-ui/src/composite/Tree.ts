// @formivue-design/vue-ui — composite — Tree (reka-ui TreeRoot/TreeItem, récursif).
// items {key,label,children?,disabled?} ; emit select(key) ; expansion par clés,
// interne ou contrôlée, clavier/roving-focus par reka-ui.
// Pas d'équivalent shadcn-vue (Tree est une pièce maison V2) — styling aligné
// sur les tokens shadcn (accent/primary/muted) pour la cohérence de la couche.
// Additif phase 6 (formivue-setters) : `label` accepte un VNode (le TreePanel
// du DataSourceSetter rend un titre + actions par nœud) — string inchangée.
import {
  computed,
  defineComponent,
  h,
  ref,
  type PropType,
  type VNode,
} from 'vue'
import { ChevronRight } from '@lucide/vue'
import { TreeItem as RekaTreeItem, TreeRoot } from 'reka-ui'
import { cn } from '../lib/utils'

export interface ITreeItem {
  key: string
  label: string | VNode
  children?: ITreeItem[]
  disabled?: boolean
}

const TreeItemNode = defineComponent({
  name: 'DTreeItemNode',
  props: {
    item: { type: Object as PropType<ITreeItem>, required: true },
    level: { type: Number, required: true },
    expandedKeysRef: {
      type: Object as PropType<{ value: string[] }>,
      required: true,
    },
  },
  emits: ['select'],
  setup(props, { emit }) {
    return () => {
      const children = props.item.children ?? []
      const expanded = props.expandedKeysRef.value.includes(props.item.key)
      const toggle = () => {
        const set = new Set(props.expandedKeysRef.value)
        if (set.has(props.item.key)) {
          set.delete(props.item.key)
        } else {
          set.add(props.item.key)
        }
        props.expandedKeysRef.value = [...set]
      }
      return h(
        RekaTreeItem,
        {
          value: props.item,
          level: props.level,
          disabled: props.item.disabled,
          class: cn(
            'text-foreground relative cursor-pointer select-none rounded-sm text-sm outline-none',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            'data-[highlighted]:[&>div]:bg-accent data-[highlighted]:[&>div]:text-accent-foreground',
            'data-[selected]:[&>div]:bg-primary/10 data-[selected]:[&>div]:text-primary',
          ),
          onSelect: () => emit('select', props.item.key),
          onToggle: (e: Event) => {
            const ev = e as CustomEvent<{
              originalEvent: PointerEvent | KeyboardEvent
              isExpanded: boolean
            }>
            ev.preventDefault?.()
            if (children.length) toggle()
          },
        },
        {
          default: () => [
            h(
              'div',
              {
                class:
                  'flex min-w-0 items-center rounded-sm px-2 py-1 transition-colors',
              },
              [
                children.length
                  ? h(
                      'button',
                      {
                        type: 'button',
                        'aria-label': expanded ? 'collapse' : 'expand',
                        class:
                          'mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs text-muted-foreground outline-none hover:bg-accent hover:text-foreground',
                        onClick: (e: MouseEvent) => {
                          e.stopPropagation()
                          toggle()
                        },
                      },
                      [
                        h(ChevronRight, {
                          class: cn(
                            'size-3.5 transition-transform',
                            expanded && 'rotate-90',
                          ),
                          'aria-hidden': 'true',
                        }),
                      ],
                    )
                  : h('span', { class: 'mr-1 inline-block size-4 shrink-0' }),
                props.item.label,
              ],
            ),
            children.length && expanded
              ? h(
                  'ul',
                  { role: 'group', class: 'pl-4' },
                  children.map((c) =>
                    h(TreeItemNode, {
                      key: c.key,
                      item: c,
                      level: props.level + 1,
                      expandedKeysRef: props.expandedKeysRef,
                      onSelect: (k: string) => emit('select', k),
                    }),
                  ),
                )
              : null,
          ],
        },
      )
    }
  },
})

export const Tree = defineComponent({
  name: 'DTree',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<ITreeItem[]>, default: () => [] },
    selectedKey: { type: String, default: undefined },
    expandedKeys: { type: Array as PropType<string[]>, default: undefined },
    defaultExpandedKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    disabled: { type: Boolean, default: false },
  },
  emits: ['select', 'update:expandedKeys'],
  setup(props, { attrs, emit }) {
    const localExpanded = ref(props.defaultExpandedKeys)
    const expandedKeysRef = computed({
      get: () => props.expandedKeys ?? localExpanded.value,
      set: (keys) => {
        localExpanded.value = keys
        emit('update:expandedKeys', keys)
      },
    })
    const onSelect = (key: string) => emit('select', key)
    return () =>
      h(
        TreeRoot,
        {
          ...attrs,
          items: props.items,
          getKey: (i: ITreeItem) => i.key,
          getChildren: (i: ITreeItem) => i.children,
          modelValue: props.selectedKey
            ? { key: props.selectedKey }
            : undefined,
          disabled: props.disabled,
          expanded: expandedKeysRef.value,
          'onUpdate:expanded': (v: string[]) => {
            expandedKeysRef.value = v
          },
          class: cn('overflow-auto text-sm', attrs.class as string),
        },
        {
          default: () =>
            props.items.map((item) =>
              h(TreeItemNode, {
                key: item.key,
                item,
                level: 1,
                expandedKeysRef,
                onSelect,
              }),
            ),
        },
      )
  },
})
