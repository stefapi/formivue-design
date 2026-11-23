// @formivue-design/vue-ui — primitives — Menu (sur le DropdownMenu shadcn-vue).
// items {key,label,disabled?,divider?} ; emit select(key). Trigger par slot.
import { defineComponent, h, type PropType } from 'vue'
import { DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import {
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
} from '../ui/dropdown-menu'

export interface IMenuItem {
  key: string
  label?: string
  disabled?: boolean
  divider?: boolean
}

export const Menu = defineComponent({
  name: 'DMenu',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    items: { type: Array as PropType<IMenuItem[]>, default: () => [] },
  },
  emits: ['select', 'update:open'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        DropdownMenuRoot,
        { open: props.open },
        {
          default: () => [
            h(
              DropdownMenuTrigger,
              { ...attrs, asChild: true },
              { default: () => slots.default?.() },
            ),
            h(
              UiDropdownMenuContent,
              {},
              {
                default: () =>
                  props.items.map((item) =>
                    item.divider
                      ? h(UiDropdownMenuSeparator, { key: item.key })
                      : h(
                          UiDropdownMenuItem,
                          {
                            key: item.key,
                            value: item.key,
                            disabled: item.disabled,
                            onSelect: () => emit('select', item.key),
                          },
                          { default: () => item.label },
                        ),
                  ),
              },
            ),
          ],
        },
      )
  },
})
