// @formivue-design/vue-ui — composite — Table (sur le Table shadcn-vue :
// sémantique + classes registry).
// columns {key,title,width?,align?} + dataSource + rowKey ; cellules par slot
// de colonne (scope { record, value, index }) sinon texte brut.
import { defineComponent, h, type PropType, type VNode } from 'vue'
import {
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHead,
  UiTableHeader,
  UiTableRow,
} from '../ui/table'
import { cn } from '../lib/utils'

export interface ITableColumn {
  key: string
  // title : texte ou VNode (les titres éditable in-canvas du designer
  // passent un div data-content-editable — additif phase 4 formivue-vue)
  title: string | VNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

export const Table = defineComponent({
  name: 'DTable',
  inheritAttrs: false,
  props: {
    columns: { type: Array as PropType<ITableColumn[]>, default: () => [] },
    dataSource: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => [],
    },
    rowKey: {
      type: [String, Function] as PropType<
        string | ((r: Record<string, any>, index: number) => string)
      >,
      default: 'key',
    },
  },
  emits: ['rowClick'],
  setup(props, { attrs, slots, emit }) {
    const keyOf = (r: Record<string, any>, i: number) =>
      typeof props.rowKey === 'function'
        ? props.rowKey(r, i)
        : String(r?.[props.rowKey] ?? i)
    return () =>
      h(
        UiTable,
        { ...attrs, class: cn('text-sm', attrs.class as string) },
        {
          default: () => [
            h(
              UiTableHeader,
              {},
              {
                default: () =>
                  h(
                    UiTableRow,
                    {},
                    {
                      default: () =>
                        props.columns.map((c) =>
                          h(
                            UiTableHead,
                            {
                              key: c.key,
                              scope: 'col',
                              class: cn(
                                'h-9 px-2 font-medium text-muted-foreground',
                                c.align === 'center' && 'text-center',
                                c.align === 'right' && 'text-right',
                              ),
                              style: c.width
                                ? {
                                    width:
                                      typeof c.width === 'number'
                                        ? `${c.width}px`
                                        : `${c.width}`,
                                  }
                                : undefined,
                            },
                            { default: () => c.title },
                          ),
                        ),
                    },
                  ),
              },
            ),
            h(
              UiTableBody,
              {},
              {
                default: () =>
                  props.dataSource.length === 0 || props.columns.length === 0
                    ? h(
                        UiTableRow,
                        {},
                        {
                          default: () =>
                            h(
                              UiTableCell,
                              {
                                colspan: Math.max(1, props.columns.length),
                                class: 'p-4 text-center text-muted-foreground',
                              },
                              { default: () => slots.empty?.() ?? 'No data' },
                            ),
                        },
                      )
                    : props.dataSource.map((r, i) =>
                        h(
                          UiTableRow,
                          {
                            key: keyOf(r, i),
                            class: 'cursor-pointer',
                            onClick: () => emit('rowClick', r),
                          },
                          {
                            default: () =>
                              props.columns.map((c) =>
                                h(
                                  UiTableCell,
                                  {
                                    key: c.key,
                                    class: cn(
                                      'px-2 py-1.5',
                                      c.align === 'center' && 'text-center',
                                      c.align === 'right' && 'text-right',
                                    ),
                                  },
                                  {
                                    default: () =>
                                      slots[c.key]
                                        ? slots[c.key]?.({
                                            record: r,
                                            value: r?.[c.key],
                                            index: i,
                                          })
                                        : (r?.[c.key] ?? ''),
                                  },
                                ),
                              ),
                          },
                        ),
                      ),
              },
            ),
          ],
        },
      )
  },
})
