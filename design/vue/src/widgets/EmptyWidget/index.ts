import cls from 'classnames'
import {
  Comment,
  Fragment,
  Text,
  defineComponent,
  h,
  type PropType,
  type VNode,
} from 'vue'
import { useTree, usePrefix } from '../../hooks'
import { observer } from '@formivue/reactive-vue'
import { IconWidget } from '../IconWidget'
import { TextWidget } from '../TextWidget'

// `props.children ? children : renderEmpty()` d'ère : un slot Vue renvoie
// toujours un tableau (truthy, même vide ou fait de commentaires `v-if`) —
// on ne considère que le contenu réellement rendu.
const hasRenderableContent = (nodes?: VNode[]): boolean =>
  !!nodes?.some((node) => {
    if (node == null || typeof node === 'boolean') return false
    if (node.type === Comment) return false
    if (node.type === Text) return String(node.children ?? '').trim() !== ''
    if (node.type === Fragment)
      return hasRenderableContent(node.children as VNode[])
    return true
  })

export interface IEmptyWidgetProps {
  dragTipsDirection?: 'left' | 'right'
}

export const EmptyWidget = observer(
  defineComponent({
    name: 'EmptyWidget',
    props: {
      dragTipsDirection: {
        type: String as PropType<'left' | 'right'>,
        default: 'left',
      },
    },
    setup(props, { slots }) {
      const tree = useTree()
      const prefix = usePrefix('empty')
      const renderEmpty = () => {
        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          [
            h('div', { class: 'animations flex flex-wrap justify-center' }, [
              h(IconWidget, {
                infer:
                  props.dragTipsDirection === 'left'
                    ? 'DragLeftSourceAnimation'
                    : 'DragRightSourceAnimation',
                size: 240,
              }),
              h(IconWidget, { infer: 'BatchDragAnimation', size: 240 }),
            ]),
            h(
              'div',
              {
                class:
                  'hotkeys-list text-center leading-[30px] text-muted-foreground',
              },
              [
                h('div', { key: 0 }, [
                  h(TextWidget, {
                    token: 'tools.selection',
                    defaultMessage: 'Selection ',
                  }),
                  h(IconWidget, { infer: 'Command' }),
                  ' + Click / ',
                  h(IconWidget, { infer: 'Shift' }),
                  ' + Click / ',
                  h(IconWidget, { infer: 'Command' }),
                  ' + A',
                ]),
                h('div', { key: 1 }, [
                  h(TextWidget, {
                    token: 'tools.copy',
                    defaultMessage: 'Copy ',
                  }),
                  h(IconWidget, { infer: 'Command' }),
                  ' + C / ',
                  h(TextWidget, {
                    token: 'tools.paste',
                    defaultMessage: 'Paste ',
                  }),
                  h(IconWidget, { infer: 'Command' }),
                  ' + V',
                ]),
                h('div', { key: 2 }, [
                  h(TextWidget, {
                    token: 'tools.delete',
                    defaultMessage: 'Delete ',
                  }),
                  h(IconWidget, { infer: 'Delete' }),
                ]),
              ],
            ),
          ],
        )
      }
      return () => {
        if (!tree?.children?.length) {
          const content = slots.default?.()
          return h(
            'div',
            {
              // structure d'ère (EmptyWidget/styles.less) : overlay absolu
              // centré, pointer-events none, fond empty
              class: cls(
                prefix,
                'absolute inset-0 flex h-full w-full items-center justify-center bg-background pointer-events-none',
              ),
            },
            [hasRenderableContent(content) ? content : renderEmpty()],
          )
        }
        return null
      }
    },
  }),
)
