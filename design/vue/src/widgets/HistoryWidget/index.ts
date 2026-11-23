import { defineComponent, h } from 'vue'
import format from 'dateformat'
import { observer } from '@formivue/reactive-vue'
import { useWorkbench, usePrefix } from '../../hooks'
import { TextWidget } from '../TextWidget'
import cls from 'classnames'

export const HistoryWidget = observer(
  defineComponent({
    name: 'HistoryWidget',
    setup() {
      const workbench = useWorkbench()
      const prefix = usePrefix('history')
      return () => {
        const currentWorkspace =
          workbench?.activeWorkspace || workbench?.currentWorkspace
        if (!currentWorkspace) return null
        return h('div', { class: prefix }, [
          currentWorkspace.history.list().map((item, index) => {
            const type = (item as any).type || 'default_state'
            const token = type.replace(/:/g, '_')
            return h(
              'div',
              {
                // structure d'ère (HistoryWidget/styles.less) : item flex
                // space-between, hover/actif → fond panel actif (token muted)
                class: cls(
                  prefix + '-item',
                  'flex min-h-8 cursor-pointer items-center justify-between px-2.5 text-foreground hover:bg-muted/50',
                  currentWorkspace.history.current === index && 'bg-muted/50',
                  {
                    active: currentWorkspace.history.current === index,
                  },
                ),
                key: (item as any).timestamp,
                onClick: () => {
                  currentWorkspace.history.goTo(index)
                },
              },
              [
                h('span', { class: prefix + '-item-title' }, [
                  h(TextWidget, { token: `operations.${token}` }),
                ]),
                h('span', { class: prefix + '-item-timestamp text-[10px]' }, [
                  ' ',
                  format((item as any).timestamp, 'yy/mm/dd HH:MM:ss'),
                ]),
              ],
            )
          }),
        ])
      }
    },
  }),
)
