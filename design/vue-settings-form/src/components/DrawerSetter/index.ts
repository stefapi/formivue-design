// vue-settings-form — DrawerSetter (port de l'ère) : trigger plein bloc +
// tiroir téléporté dans le wrapper du panneau de settings
// (settings-form-wrapper), header retour + corps FormLayout.
// createPortal → Teleport ; animate.css d'ère écarté (V1) → transition
// CSS maison (translate 150ms, même tempo que le setTimeout d'ère).
import {
  defineComponent,
  h,
  onMounted,
  ref,
  type PropType,
  type VNode,
} from 'vue'
import { Teleport } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useField } from '@formivue/vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Button, FormLayout } from '@formivue-design/vue-ui'
import cls from 'classnames'

export interface IDrawerSetterProps {
  text?: string | VNode
  triggerProps?: Record<string, any>
}

export const DrawerSetter = observer(
  defineComponent({
    name: 'DDrawerSetter',
    inheritAttrs: false,
    props: {
      text: {
        type: [String, Object] as PropType<string | VNode>,
        default: undefined,
      },
      triggerProps: { type: Object, default: undefined },
    },
    setup(props, { slots }) {
      const field = useField<any>()
      const visible = ref(false)
      const remove = ref(false)
      const root = ref<Element>()
      const prefix = usePrefix('drawer-setter')
      const formWrapperCls = usePrefix('settings-form-wrapper')
      onMounted(() => {
        const wrapper = document.querySelector('.' + formWrapperCls)
        if (wrapper) {
          root.value = wrapper
        }
      })

      const handleClose = () => {
        remove.value = true
        setTimeout(() => {
          visible.value = false
          remove.value = false
        }, 150)
      }

      return () => {
        const text = props.text || field.value?.title
        return [
          h(
            Button,
            {
              // ordre d'ère : triggerProps étalé APRÈS onClick (il peut surcharger)
              block: true,
              onClick: () => {
                visible.value = true
              },
              ...(props.triggerProps as any),
            },
            { default: () => text },
          ),
          root.value && visible.value
            ? h(
                Teleport as any,
                { to: root.value },
                // Teleport est un built-in : children en tableau (pas de slots)
                [
                  h(
                    'div',
                    {
                      class: cls(
                        prefix,
                        'fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-border bg-background text-foreground shadow-lg',
                        { 'pointer-events-none': remove.value },
                      ),
                      style: {
                        transform: remove.value
                          ? 'translateX(100%)'
                          : 'translateX(0)',
                        transition: 'transform 150ms ease',
                      },
                    },
                    [
                      h(
                        'button',
                        {
                          type: 'button',
                          'aria-label':
                            String(
                              GlobalRegistry.getDesignerMessage(
                                'SettingComponents.DrawerSetter.close',
                              ) ?? '',
                            ) || 'Close',
                          class: cls(
                            prefix + '-header',
                            'flex w-full cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-sm',
                          ),
                          onClick: () => {
                            handleClose()
                          },
                        },
                        [
                          h(IconWidget, { infer: 'Return', size: 18 }),
                          h('span', { class: prefix + '-header-text' }, [text]),
                        ],
                      ),
                      h(
                        'div',
                        {
                          class: cls(
                            prefix + '-body',
                            'flex-1 overflow-auto p-3',
                          ),
                        },
                        [
                          h(
                            FormLayout,
                            {
                              labelWidth: 120,
                              labelAlign: 'left',
                            },
                            { default: () => slots.default?.() },
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              )
            : null,
        ]
      }
    },
  }) as any,
)
