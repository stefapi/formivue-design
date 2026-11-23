import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { requestIdle } from '@formivue-design/shared'
import { autorun } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import { TextWidget, IconWidget } from '../widgets'
import { usePrefix, useWorkbench } from '../hooks'
import cls from 'classnames'

export interface ISettingPanelProps {
  title?: any
  extra?: any
}

export const SettingsPanel = observer(
  defineComponent({
    name: 'SettingsPanel',
    props: {
      title: { type: [String, Object], default: undefined },
      extra: { type: null, default: undefined },
    },
    setup(props, { slots }) {
      const prefix = usePrefix('settings-panel')
      const workbench = useWorkbench()
      const innerVisible = ref(true)
      const pinning = ref(false)
      const visible = ref(true)

      const syncInnerVisible = () => {
        if (visible.value || workbench?.type === 'FORMIVUEDESIGN') {
          if (!innerVisible.value) {
            requestIdle(() => {
              requestAnimationFrame(() => {
                innerVisible.value = true
              })
            })
          }
        } else {
          innerVisible.value = false
        }
      }

      onMounted(() => {
        const disposer = autorun(syncInnerVisible)
        onBeforeUnmount(() => disposer())
      })

      return () => {
        if (workbench?.type !== 'FORMIVUEDESIGN') return null
        if (!visible.value) {
          return h(
            'div',
            {
              // structure d'ère : opener flottant au milieu du bord droit
              class: cls(
                prefix + '-opener',
                'absolute right-0 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[3px] border border-border bg-card text-muted-foreground shadow-[0_0_6px_rgba(0,0,0,0.1)]',
              ),
              onClick: () => {
                visible.value = true
              },
            },
            [h(IconWidget, { infer: 'Setting', size: 20 })],
          )
        }
        // structure d'ère (panels/styles.less) : colonne 300px à droite,
        // box-content ; pinning → absolute collé au bord
        return h(
          'div',
          {
            class: cls(
              prefix,
              'box-content flex h-full w-[300px] shrink-0 grow-0 flex-col select-none border-l border-border bg-card relative z-[2]',
              pinning.value &&
                'absolute right-0 top-0 z-10 border-l-transparent shadow-[2px_5px_10px_rgba(102,102,102,0.52)]',
              { pinning: pinning.value },
            ),
          },
          [
            h(
              'div',
              {
                class: cls(
                  prefix + '-header',
                  'flex justify-between border-b border-border px-1.75 py-3.5 text-base leading-[18px] text-muted-foreground',
                ),
              },
              [
                h('div', { class: prefix + '-header-title text-xl' }, [
                  h(TextWidget, { token: props.title }),
                ]),
                h(
                  'div',
                  { class: prefix + '-header-actions flex items-center gap-2' },
                  [
                    h('div', { class: prefix + '-header-extra' }, [
                      slots.extra ? slots.extra() : props.extra,
                    ]),
                    !pinning.value &&
                      h(IconWidget, {
                        infer: 'PushPinOutlined',
                        class:
                          prefix +
                          '-header-pin transition-transform duration-150 hover:scale-110',
                        onClick: () => {
                          pinning.value = !pinning.value
                        },
                      }),
                    pinning.value &&
                      h(IconWidget, {
                        infer: 'PushPinFilled',
                        class:
                          prefix +
                          '-pin-filled transition-transform duration-150 hover:scale-110',
                        onClick: () => {
                          pinning.value = !pinning.value
                        },
                      }),
                    h(IconWidget, {
                      infer: 'Close',
                      class:
                        prefix +
                        '-header-close transition-transform duration-150 hover:rotate-90',
                      onClick: () => {
                        visible.value = false
                      },
                    }),
                  ],
                ),
              ],
            ),
            h(
              'div',
              {
                // a11y (V8/axe scrollable-region-focusable) : région
                // scrollable accessible au clavier
                tabindex: '0',
                class: cls(
                  prefix + '-body',
                  'h-full grow-[2] shrink-[2] overflow-y-auto',
                ),
              },
              innerVisible.value ? slots.default?.() : undefined,
            ),
          ],
        )
      }
    },
  }),
)
