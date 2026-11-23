// @formivue-design/vue-ui — bloc form — FormItemBase (pattern fork
// docs/ui/FormItemBase.vue, adapté) : label / help / extra / required /
// validateStatus. Classes tokens shadcn (destructive pour les erreurs).
// a11y : `for`/`id` associent label et contrôle (fix 6.4 de la migration v3 porté).
import {
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  type VNode,
} from 'vue'
import { FormLayoutKey, type IFormLayoutContext } from './context'
import { cn } from '../lib/utils'

export const FormItemBase = defineComponent({
  name: 'DFormItemBase',
  inheritAttrs: false,
  props: {
    // label : texte ou VNode (titres éditables in-canvas du designer)
    label: {
      type: [String, Object] as PropType<string | VNode>,
      default: undefined,
    },
    labelFor: { type: String, default: undefined },
    id: { type: String, default: undefined },
    help: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    extra: {
      type: [String, Object] as PropType<string | VNode>,
      default: undefined,
    },
    // aide du label (tooltipLayout « text » d'ère) : soulignement pointillé +
    // infobulle native au survol
    tooltip: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    validateStatus: {
      type: [Boolean, String] as PropType<
        boolean | 'error' | 'success' | 'warning' | 'validating'
      >,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    const injectedLayout = inject(FormLayoutKey, {}) as IFormLayoutContext
    const layout = computed<IFormLayoutContext>(() => injectedLayout)
    const isError = computed(
      () =>
        props.validateStatus === true ||
        (Array.isArray(props.help) ? props.help.length > 0 : !!props.help) ||
        props.validateStatus === 'error',
    )
    return () => {
      const vertical = layout.value.layout !== 'horizontal'
      const labelWidth = layout.value.labelWidth
      const labelClass = [
        'text-sm leading-none font-medium text-foreground select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        vertical ? 'mb-1.5 block' : 'shrink-0 py-1.5 pr-2',
        !vertical &&
          (layout.value.labelAlign === 'left' ? 'text-left' : 'text-right'),
        !vertical && labelWidth === undefined && 'w-28',
      ]
      return h(
        'div',
        {
          ...attrs,
          // marqueurs data-slot : stylage contextuel (panneau de propriétés)
          'data-slot': 'form-item',
          'data-layout': vertical ? 'vertical' : 'horizontal',
          class: [
            'mb-4',
            !vertical && 'flex items-start',
            '[&:has(>div>[data-slot=form-item-control]>[data-array-inline])]:align-top',
            vertical
              ? '[&:has(>div>[data-slot=form-item-control]>[data-array-inline])]:inline-block'
              : '[&:has(>div>[data-slot=form-item-control]>[data-array-inline])]:inline-flex',
            attrs.class as string,
          ],
          'data-validate-status':
            props.validateStatus === undefined
              ? undefined
              : props.validateStatus === true
                ? 'error'
                : props.validateStatus === false
                  ? 'success'
                  : props.validateStatus,
        },
        [
          props.label
            ? h(
                'label',
                {
                  for: props.labelFor ?? props.id,
                  'data-slot': 'form-item-label',
                  title: props.tooltip,
                  class: cn(
                    labelClass,
                    props.tooltip &&
                      'cursor-help underline decoration-dotted underline-offset-4',
                  ),
                  style:
                    !vertical && labelWidth !== undefined
                      ? {
                          width:
                            typeof labelWidth === 'number'
                              ? `${labelWidth}px`
                              : labelWidth,
                        }
                      : undefined,
                },
                [
                  props.label,
                  props.required
                    ? h('span', {
                        class: 'text-destructive ml-0.5',
                        'aria-hidden': 'true',
                      })
                    : null,
                ],
              )
            : null,
          h('div', { class: vertical ? undefined : 'min-w-0 flex-1' }, [
            h('div', { 'data-slot': 'form-item-control' }, slots.default?.()),
            isError.value
              ? h(
                  'p',
                  {
                    id: props.id ? `${props.id}-help` : undefined,
                    class: 'mt-1 text-xs text-destructive',
                  },
                  Array.isArray(props.help) ? props.help.join(' ') : props.help,
                )
              : props.extra
                ? h(
                    'p',
                    { class: 'mt-1 text-xs text-muted-foreground' },
                    props.extra,
                  )
                : null,
          ]),
        ],
      )
    }
  },
})
