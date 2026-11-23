import { Table } from '@formivue-design/vue-ui'
import VisSingleContainer from '@unovis/vue/containers/single-container'
import {
  defineAsyncComponent,
  defineComponent,
  h,
  type PropType,
  type VNode,
} from 'vue'
import type { ChartName } from './appearance'
import { createChart, type ChartOptions } from './base'

export interface ChartView {
  plot?: VNode
  headers: string[]
  records: string[][]
  message?: string
}

export const tip = (...lines: string[]) => {
  const element = document.createElement('div')
  element.className =
    'whitespace-pre-line rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md'
  element.textContent = lines.join('\n')
  return element
}

export const single = (
  height: number,
  data: unknown,
  children: () => VNode[],
  key?: string,
) => h(VisSingleContainer, { height, duration: 0, data, key }, children)

function figure(options: ChartOptions, view: ChartView) {
  return h(
    'figure',
    { class: 'm-0 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2' },
    [
      h('figcaption', { class: 'text-sm font-medium' }, options.label),
      view.plot
        ? h(
            'div',
            {
              'aria-hidden': true,
              class: 'min-w-0',
              style: {
                '--vis-tooltip-background-color': 'transparent',
                '--vis-tooltip-border-color': 'transparent',
                '--vis-tooltip-padding': '0',
              },
            },
            [view.plot],
          )
        : null,
      view.message || !view.plot
        ? h(
            'p',
            { class: 'text-sm text-muted-foreground' },
            view.message || options.emptyText,
          )
        : null,
      view.records.length
        ? h('details', { class: 'min-w-0 text-xs' }, [
            h(
              'summary',
              { class: 'w-fit cursor-pointer text-muted-foreground' },
              options.dataLabel,
            ),
            h(Table, {
              'aria-label': options.dataLabel,
              columns: view.headers.map((title, index) => ({
                key: String(index),
                title,
              })),
              dataSource: view.records.map((record, key) => ({
                ...Object.fromEntries(
                  record.map((cell, index) => [index, cell]),
                ),
                key,
              })),
            }),
          ])
        : null,
    ],
  )
}

export function createSpecialChart(
  name: ChartName,
  load: () => Promise<(options: ChartOptions) => ChartView>,
) {
  const renderer = defineAsyncComponent(async () => {
    const build = await load()
    return defineComponent({
      props: {
        options: { type: Object as PropType<ChartOptions>, required: true },
      },
      setup(props) {
        return () => figure(props.options, build(props.options))
      },
    })
  })
  return createChart(name, (options) => h(renderer, { options }))
}
