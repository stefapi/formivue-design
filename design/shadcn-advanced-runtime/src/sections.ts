import {
  computed,
  defineComponent,
  h,
  type PropType,
  type Slots,
  type VNode,
} from 'vue'
import { Schema } from '@formivue/json-schema'
import { RecursionField, useFieldSchema } from '@formivue/vue'
import type { FlowBranch } from '@formivue/flow'

export interface AdvancedSection {
  id: string
  title?: string
  description?: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
  next?: string | null
  branches?: FlowBranch[]
  fields?: string[]
}

export const sectionsProp = {
  type: Array as PropType<AdvancedSection[]>,
  default: () => [],
}

export function useSections(
  kind: string,
  props: { sections: AdvancedSection[] },
  slots: Slots,
  useIdAsTitle = true,
) {
  const schema = useFieldSchema()
  return computed(() => {
    const children = (
      schema.value ? Schema.getOrderProperties(schema.value) : []
    ).filter(
      ({ schema }) =>
        schema['x-component'] === kind &&
        !['none', 'hidden'].includes(schema['x-display']),
    )
    if (children.length) {
      return children.map(({ key, schema }) => {
        const section = schema['x-component-props']
        return {
          ...section,
          id: key,
          title:
            section?.title ?? schema.title ?? (useIdAsTitle ? key : undefined),
          render: () => h(RecursionField, { schema, name: key }),
        } as AdvancedSection & { render: () => VNode | VNode[] }
      })
    }
    return props.sections.map((section) => ({
      ...section,
      render: () => slots[section.id]?.() ?? slots.default?.({ section }),
    }))
  })
}

export const SectionContent = defineComponent({
  name: 'AdvancedSectionContent',
  setup(_, { slots }) {
    return () => slots.default?.()
  },
})
