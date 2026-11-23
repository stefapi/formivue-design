import { defineComponent, h } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { useScreen, usePrefix, useTheme } from '../../hooks'

export const MobileBody = observer(
  defineComponent({
    name: 'MobileBody',
    setup(_props, { slots }) {
      const screen = useScreen()
      const theme = useTheme()
      const prefix = usePrefix('mobile-simulator-body')

      return () => {
        const landscape = Boolean(screen?.flip)
        const dark = theme === 'dark'
        const width = landscape ? 946.667 : 460
        const height = landscape ? 460 : 946.667
        return h(
          'div',
          {
            class: prefix,
            style: {
              display: 'grid',
              justifyItems: 'center',
              minWidth: `${width}px`,
            },
          },
          [
            h(
              'div',
              {
                class: prefix + '-wrapper',
                style: {
                  position: 'relative',
                  margin: '20px 0',
                  width: `${width}px`,
                  height: `${height}px`,
                  borderRadius: '60px',
                  background: dark ? '#20232b' : '#e6e8ed',
                  boxShadow: 'inset 0 0 0 2px #83889666, 0 8px 24px #00000026',
                },
              },
              [
                h('span', {
                  'aria-hidden': 'true',
                  style: {
                    position: 'absolute',
                    top: landscape ? '50%' : '53px',
                    left: landscape ? '53px' : '50%',
                    transform: 'translate(-50%, -50%)',
                    width: landscape ? '8px' : '44px',
                    height: landscape ? '44px' : '8px',
                    borderRadius: '999px',
                    background: dark ? '#5a5e68' : '#9499a4',
                  },
                }),
                h(
                  'div',
                  {
                    class: prefix + '-content',
                    style: {
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: landscape ? '736px' : '414px',
                      height: landscape ? '414px' : '736px',
                      background: dark ? '#111318' : '#fff',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    },
                  },
                  slots.default?.(),
                ),
              ],
            ),
          ],
        )
      }
    },
  }),
)
