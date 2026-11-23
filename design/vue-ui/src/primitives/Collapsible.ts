// @formivue-design/vue-ui — primitives — Collapsible / Tabs (sur le Collapsible
// et le Tabs shadcn-vue).
// Formes « assemblées » prêtes à l'emploi (un seul composant, pas la famille
// Root/Trigger/Content) — consommées par FormCollapse/FormTab et les settings.
import { defineComponent, h, type PropType, type VNode } from 'vue'
import { CollapsibleRoot, TabsRoot } from 'reka-ui'
import {
  UiCollapsibleContent,
  UiCollapsibleTrigger,
  UiTabsContent,
  UiTabsList,
  UiTabsTrigger,
} from '../ui/tabs'

export const Collapsible = defineComponent({
  name: 'DCollapsible',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
  },
  emits: ['update:open'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        CollapsibleRoot,
        {
          ...attrs,
          open: props.open,
          'onUpdate:open': (v: boolean) => emit('update:open', v),
        },
        {
          default: () => [
            h(
              UiCollapsibleTrigger,
              {},
              {
                default: () => (slots.title ? slots.title() : props.title),
              },
            ),
            h(UiCollapsibleContent, {}, { default: () => slots.default?.() }),
          ],
        },
      )
  },
})

export interface ITabItem {
  key: string
  // label : texte ou VNode (les titres éditable in-canvas du designer passent
  // un span data-content-editable — additif phase 4 formivue-vue)
  label: string | VNode
  disabled?: boolean
}

export const Tabs = defineComponent({
  name: 'DTabs',
  inheritAttrs: false,
  props: {
    tabs: { type: Array as PropType<ITabItem[]>, default: () => [] },
    modelValue: { type: String, default: undefined },
    designerActions: { type: Object as PropType<VNode>, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        TabsRoot,
        {
          ...attrs,
          modelValue: props.modelValue ?? props.tabs[0]?.key,
          'onUpdate:modelValue': (k: string) => emit('update:modelValue', k),
        },
        {
          default: () => [
            h(
              UiTabsList,
              {},
              {
                default: () =>
                  props.tabs.map((t) =>
                    h(
                      UiTabsTrigger,
                      { key: t.key, value: t.key, disabled: t.disabled },
                      { default: () => t.label },
                    ),
                  ),
              },
            ),
            ...props.tabs.map((t) =>
              h(
                UiTabsContent,
                { key: t.key, value: t.key },
                {
                  // contrat conservé : slot default scopé par onglet ({ key })
                  default: () =>
                    props.modelValue === t.key
                      ? (slots.default as any)?.({ key: t.key })
                      : null,
                },
              ),
            ),
            props.designerActions,
          ],
        },
      )
  },
})
