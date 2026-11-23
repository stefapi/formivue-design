import {
  defineComponent,
  h,
  inject,
  provide,
  ref,
  toRef,
  type InjectionKey,
  type PropType,
  type Ref,
} from 'vue'

const overlayTargetKey: InjectionKey<Readonly<Ref<HTMLElement | undefined>>> =
  Symbol('Advanced overlay target')

export const useAdvancedOverlayTarget = () =>
  inject(overlayTargetKey, undefined)

export const AdvancedPreviewFrame = defineComponent({
  name: 'AdvancedPreviewFrame',
  setup(_, { slots }) {
    const target = ref<HTMLElement>()
    provide(overlayTargetKey, target)
    return () =>
      h('div', { class: 'relative isolate h-full min-h-0 min-w-0' }, [
        h('div', { class: 'h-full min-w-0 overflow-auto' }, slots.default?.()),
        h('div', {
          ref: target,
          class: 'pointer-events-none absolute inset-0 z-10',
          'data-advanced-overlay-frame': '',
        }),
      ])
  },
})

export const AdvancedOverlayTarget = defineComponent({
  name: 'AdvancedOverlayTarget',
  props: { target: Object as PropType<HTMLElement> },
  setup(props, { slots }) {
    provide(overlayTargetKey, toRef(props, 'target'))
    return () => slots.default?.()
  },
})
