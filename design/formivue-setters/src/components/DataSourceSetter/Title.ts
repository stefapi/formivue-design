// formivue/setters — DataSourceSetter Title (port de l'ère) : titre du nœud
// d'arbre (résolu depuis map : label/title/header, puis première valeur
// texte) + actions du nœud — Remove d'ère + **tri maison MoveUp/MoveDown**
// (V1 : le drag dnd-kit disparaît, le déplacement se fait entre frères).
// IconWidget → boutons nommés (règle 7 : a11y corrigée avant fusion).
import { defineComponent, h, type PropType } from 'vue'
import { clone, toArr } from '@formivue/shared'
import { observer } from '@formivue/reactive-vue'
import { IconWidget, TextWidget, usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Button } from '@formivue-design/vue-ui'
import { ArrowDown, ArrowUp } from '@lucide/vue'
import cls from 'classnames'
import { traverseTree } from './shared'
import type { INodeItem, ITreeDataSource } from './types'

export interface ITitleProps {
  item: INodeItem
  treeDataSource: ITreeDataSource
}

const getTitleValue = (dataSource: any): string | undefined => {
  const optionalKeys = ['label', 'title', 'header']
  let nodeTitle: string | undefined
  optionalKeys.some((key) => {
    const title = toArr(dataSource).find((item) => item.label === key)?.value
    if (title !== undefined) {
      nodeTitle = title
      return true
    }
    return false
  })
  if (nodeTitle === undefined) {
    toArr(dataSource || []).some((item) => {
      if (item.value && typeof item.value === 'string') {
        nodeTitle = item.value
        return true
      }
      return false
    })
  }
  return nodeTitle
}

export const Title = observer(
  defineComponent({
    name: 'DDataSourceSetterNodeTitle',
    inheritAttrs: false,
    props: {
      item: { type: Object as PropType<INodeItem>, required: true },
      treeDataSource: {
        type: Object as PropType<ITreeDataSource>,
        required: true,
      },
    },
    setup(props) {
      const prefix = usePrefix('data-source-setter-node-title')
      // ATTENTION : pas de computed() ici — Vue ne suit pas les observables
      // formivue (map est observable profond) ; la lecture se fait au rendu,
      // trackée par l'observer (recette des phases 3-5)
      const renderTitle = () => {
        const nodeTitle = getTitleValue(props.item?.map)
        if (nodeTitle === undefined)
          return h(TextWidget, {
            token: 'SettingComponents.DataSourceSetter.defaultTitle',
          })
        return nodeTitle + ''
      }
      // tri maison : localisation du nœud (tableau + index) puis échange
      const locate = () => {
        let location: { arr: INodeItem[]; index: number } | null = null
        traverseTree(props.treeDataSource.dataSource, (dataItem, i, arr) => {
          if (arr[i]?.key === props.item.key) {
            location = { arr, index: i }
          }
        })
        return location
      }
      const move = (offset: number) => {
        const location = locate()
        if (!location) return
        const { arr, index } = location
        const target = index + offset
        if (target < 0 || target >= arr.length) return
        const [node] = arr.splice(index, 1)
        arr.splice(target, 0, node)
      }
      const remove = () => {
        const newDataSource = clone(props.treeDataSource?.dataSource) as
          INodeItem[] | undefined
        traverseTree(newDataSource || [], (dataItem, i, data) => {
          if (toArr(data)[i]?.key === props.item.duplicateKey)
            toArr(data).splice(i, 1)
        })
        props.treeDataSource.dataSource = newDataSource || []
      }
      return () => {
        const selected = props.treeDataSource?.selectedKey === props.item.key
        return h(
          'div',
          {
            class: cls(
              prefix,
              'flex w-full items-center gap-1 rounded-sm px-1 py-0.5',
              selected && 'bg-primary/10',
            ),
          },
          [
            h('span', { class: 'mr-1 truncate text-sm' }, [renderTitle()]),
            h('span', { class: 'ml-auto flex shrink-0 items-center gap-0.5' }, [
              h(
                Button,
                {
                  type: 'text',
                  size: 'small',
                  'aria-label':
                    String(
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.DataSourceSetter.moveUp',
                      ) ?? '',
                    ) || 'Move up',
                  onClick: () => move(-1),
                },
                {
                  default: () => [
                    h(ArrowUp, { 'aria-hidden': 'true', class: 'size-3.5' }),
                  ],
                },
              ),
              h(
                Button,
                {
                  type: 'text',
                  size: 'small',
                  'aria-label':
                    String(
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.DataSourceSetter.moveDown',
                      ) ?? '',
                    ) || 'Move down',
                  onClick: () => move(1),
                },
                {
                  default: () => [
                    h(ArrowDown, { 'aria-hidden': 'true', class: 'size-3.5' }),
                  ],
                },
              ),
              h(
                Button,
                {
                  type: 'text',
                  size: 'small',
                  class: cls(prefix + '-icon'),
                  'aria-label':
                    String(
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.DataSourceSetter.remove',
                      ) ?? '',
                    ) || 'Remove',
                  onClick: () => remove(),
                },
                { default: () => [h(IconWidget, { infer: 'Remove' })] },
              ),
            ]),
          ],
        )
      }
    },
  }) as any,
)
