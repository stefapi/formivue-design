// formivue/vue — FormCollapse binding réelle (port simplifié : CollapsePanels
// depuis les properties du schéma, contenu par RecursionField, FormCollapse
// vue-ui ; le createFormCollapse/model d'ère est remplacé par un état local
// + defaultOpenKeys — écart V1 documenté).
import { defineComponent, h, ref, type PropType } from 'vue'
import { Schema } from '@formivue/json-schema'
import { useFieldSchema, RecursionField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { FormCollapse as DFormCollapse } from '@formivue-design/vue-ui'
import { derived } from '../shared'

interface IPanelSource {
  name: string
  props: Record<string, any>
  schema: Schema
}

const usePanels = () => {
  const schema = useFieldSchema()
  return derived<IPanelSource[]>(() => {
    const panels: IPanelSource[] = []
    const currentSchema = schema.value as any
    if (!currentSchema?.mapProperties) return panels
    currentSchema.mapProperties((schema: Schema, name: string) => {
      if (String(schema['x-component'] ?? '').indexOf('CollapsePanel') > -1) {
        panels.push({
          name,
          props: {
            key: schema?.['x-component-props']?.key || name,
            ...schema?.['x-component-props'],
          },
          schema,
        })
      }
    })
    return panels
  })
}

export const FormCollapseBinding = observer(
  defineComponent({
    name: 'FormivueFormCollapse',
    inheritAttrs: false,
    props: {
      defaultOpenKeys: { type: Array as PropType<string[]>, default: () => [] },
      accordion: { type: Boolean, default: false },
    },
    setup(props, { attrs }) {
      const panels = usePanels()
      const activeKeys = ref<string[]>([...(props.defaultOpenKeys ?? [])])
      return () =>
        h(
          DFormCollapse,
          {
            ...attrs,
            accordion: props.accordion,
            collapses: panels.value.map((panel) => ({
              key: panel.props.key,
              title: String(panel.props.header ?? panel.name),
            })),
            activeKeys: activeKeys.value,
            'onUpdate:activeKeys': (keys: string[]) => {
              activeKeys.value = keys
            },
          },
          panels.value.reduce<Record<string, any>>((slots, panel) => {
            slots[panel.props.key] = () =>
              h('div', { style: panel.props.style }, [
                h(RecursionField, { schema: panel.schema, name: panel.name }),
              ])
            return slots
          }, {}),
        )
    },
  }) as any,
)

// CollapsePanel : Fragment transparent — les enfants vivent dans les
// properties du schéma.
export const CollapsePanel = defineComponent({
  name: 'FormivueFormCollapsePanel',
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

FormCollapseBinding.CollapsePanel = CollapsePanel
