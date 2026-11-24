import {
  createBehavior,
  createResource,
  GlobalRegistry,
} from '@formivue-design/core'
import { createVoidFieldSchema } from '@formivue-design/formivue-vue'
import { useTreeNode, type DnFC } from '@formivue-design/vue'
import type { ISchema } from '@formivue/json-schema'
import { observer } from '@formivue/reactive-vue'
import { defineComponent, h, type Component } from 'vue'
import { designerLanguages, type materialLocales } from '../locales/shared'
import {
  arrayTableSources,
  chartFilterDefaults,
  chartSource,
  updateChartLink,
} from './source'

export function createChartMaterial({
  name,
  icon,
  runtime,
  props,
  schema,
  locales,
}: {
  name: string
  icon: Component
  runtime: Component
  props: Record<string, unknown>
  schema: ISchema
  locales: ReturnType<typeof materialLocales>
}) {
  const Canvas = observer(
    defineComponent({
      name: `Design${name}`,
      inheritAttrs: false,
      setup(_, { attrs }) {
        const node = useTreeNode()
        return () => {
          const { records } = chartSource(attrs.rows, arrayTableSources(node))
          return h(runtime, {
            locale: GlobalRegistry.getDesignerLanguage(),
            ...attrs,
            rows: records,
            filters: chartFilterDefaults(attrs.filters, node),
          })
        }
      },
    }),
  ) as DnFC
  Canvas.Behavior = createBehavior({
    name,
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === name,
    designerProps: {
      droppable: false,
      propsSchema: createVoidFieldSchema(schema),
      onFieldRename: updateChartLink,
    },
    designerLocales: locales,
  })
  Canvas.Resource = createResource({
    icon: h(icon, {
      class: 'size-6 shrink-0 text-muted-foreground',
      'aria-hidden': true,
    }),
    title: Object.fromEntries(
      designerLanguages.map((locale) => [locale, locales[locale].title]),
    ),
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'void',
          'x-component': name,
          'x-component-props': props,
        },
      },
    ],
  })
  return Canvas
}
