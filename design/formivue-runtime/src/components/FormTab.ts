// formivue/vue — FormTab binding réelle (port @formivue/antd simplifié pile
// headless : TabPanes depuis les properties du schéma, contenu par
// RecursionField, Tabs vue-ui ; le FeedbackBadge antd disparaît — V1).
import { defineComponent, h, ref } from 'vue'
import { Schema } from '@formivue/json-schema'
import { useField, useFieldSchema, RecursionField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { Tabs } from '@formivue-design/vue-ui'
import { derived } from '../shared'

interface ITabSource {
  name: string
  props: Record<string, any>
  schema: Schema
}

const useTabs = () => {
  const tabsField = useField() as any
  const schema = useFieldSchema()
  return derived<ITabSource[]>(() => {
    const tabs: ITabSource[] = []
    const currentSchema = schema.value as any
    if (!currentSchema?.mapProperties) return tabs
    currentSchema.mapProperties((schema: Schema, name: string) => {
      const field = tabsField.value
        ?.query?.(tabsField.value.address.concat(name))
        ?.take?.()
      const display = field?.display ?? schema['x-display']
      if (display === 'none' || display === 'hidden') return
      if (String(schema['x-component'] ?? '').indexOf('TabPane') > -1) {
        tabs.push({
          name,
          props: {
            key: schema?.['x-component-props']?.key || name,
            ...schema?.['x-component-props'],
          },
          schema,
        })
      }
    })
    return tabs
  })
}

export const FormTabBinding = observer(
  defineComponent({
    name: 'FormivueFormTab',
    inheritAttrs: false,
    props: {
      activeKey: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      const tabs = useTabs()
      const selectedKey = ref<string>()
      return () => {
        const currentTabs = tabs.value
        const requestedKey = selectedKey.value ?? props.activeKey
        const activeKey =
          currentTabs.find((tab) => tab.props.key === requestedKey)?.props
            .key ?? currentTabs[0]?.props.key
        return h(
          Tabs,
          {
            ...attrs,
            tabs: currentTabs.map((tab) => ({
              key: tab.props.key,
              label: String(tab.props.tab ?? tab.name),
            })),
            modelValue: activeKey,
            'onUpdate:modelValue': (key: string) => {
              selectedKey.value = key
            },
          },
          {
            default: ({ key }: { key: string }) => {
              const tab = currentTabs.find((item) => item.props.key === key)
              if (!tab) return null
              return h(
                'div',
                { style: [{ padding: '20px 0' }, tab.props.style] },
                [h(RecursionField, { schema: tab.schema, name: tab.name })],
              )
            },
          },
        )
      }
    },
  }) as any,
)

// TabPane : Fragment transparent — les enfants vivent dans les properties.
export const TabPane = defineComponent({
  name: 'FormivueFormTabPane',
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})

FormTabBinding.TabPane = TabPane
