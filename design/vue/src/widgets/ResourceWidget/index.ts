import { defineComponent, h, ref, isVNode, type PropType } from 'vue'
import {
  isResourceHost,
  isResourceList,
  IResourceLike,
  IResource,
} from '@formivue-design/core'
import { isFn } from '@formivue-design/shared'
import { observer } from '@formivue/reactive-vue'
import { usePrefix } from '../../hooks'
import { IconWidget } from '../IconWidget'
import { TextWidget } from '../TextWidget'
import cls from 'classnames'

export type SourceMapper = (resource: IResource) => any

export interface IResourceWidgetProps {
  title?: any
  sources?: IResourceLike[]
  className?: string
  defaultExpand?: boolean
  columns?: 2 | 3
  onActivate?: (resource: IResource) => void
  children?: SourceMapper | any
}

// Port §1.5 : children mapper → slot default recevant la source
// (slots.default?.(source)) — le contenu statique ignore l'argument.
export const ResourceWidget = observer(
  defineComponent({
    name: 'ResourceWidget',
    props: {
      title: { type: [String, Object], default: undefined },
      sources: {
        type: Array as PropType<IResourceLike[]>,
        default: () => [],
      },
      className: { type: String, default: undefined },
      defaultExpand: { type: Boolean, default: true },
      columns: { type: Number as PropType<2 | 3>, default: 3 },
      onActivate: Function as PropType<(resource: IResource) => void>,
    },
    setup(props, { slots }) {
      const prefix = usePrefix('resource')
      const expand = ref(props.defaultExpand)
      const renderNode = (source: IResource) => {
        const { node, icon, title, thumb, span } = source
        const activate = props.onActivate
        return h(
          activate ? 'button' : 'div',
          {
            class: cls(
              prefix + '-item',
              'relative flex min-h-[4.25rem] min-w-0 cursor-grab select-none flex-col items-center justify-center gap-1.5 bg-background p-2 text-foreground transition-colors duration-100',
              'hover:text-primary hover:z-[1] hover:shadow-[0_0_10px_rgba(0,0,0,0.1)]',
              activate &&
                'focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            ),
            style: {
              gridColumnStart: `span ${Math.min(span || 1, props.columns)}`,
            },
            key: node.id,
            'data-designer-source-id': node.id,
            ...(activate
              ? { type: 'button', onClick: () => activate(source) }
              : {}),
          },
          [
            thumb &&
              h('img', { class: prefix + '-item-thumb', src: thumb, alt: '' }),
            icon &&
              h(
                'span',
                {
                  class:
                    prefix +
                    '-item-icon grid size-6 shrink-0 place-items-center text-muted-foreground',
                  'aria-hidden': 'true',
                },
                [
                  isVNode(icon)
                    ? icon
                    : isFn(icon)
                      ? h(icon as any)
                      : h(IconWidget, { infer: icon, size: 24 }),
                ],
              ),
            h(
              'span',
              {
                class:
                  prefix +
                  '-item-text my-auto min-w-0 max-w-full wrap-anywhere text-center text-xs leading-[1.2]',
              },
              [
                h(TextWidget, {
                  token: title || node.children[0]?.getMessage('title'),
                }),
              ],
            ),
          ],
        )
      }
      return () => {
        const sources = props.sources.reduce<IResource[]>((buf, source) => {
          if (isResourceList(source)) {
            return buf.concat(source)
          } else if (isResourceHost(source)) {
            return buf.concat((source as any).Resource)
          }
          return buf
        }, [])
        const { columns } = props
        const lastRowItems = sources.reduce((length, source) => {
          const span = Math.min(source.span || 1, columns)
          const next = length + span
          return (next > columns ? span : next) % columns
        }, 0)
        return h(
          'div',
          {
            class: cls(prefix, props.className, 'overflow-hidden', {
              expand: expand.value,
            }),
          },
          [
            h(
              'button',
              {
                type: 'button',
                'aria-expanded': expand.value,
                class: cls(
                  prefix + '-header',
                  'flex w-full cursor-pointer items-center border-b border-border bg-muted px-2 py-[5px] text-start text-[13px] text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                ),
                onClick: (event: MouseEvent) => {
                  event.stopPropagation()
                  expand.value = !expand.value
                },
              },
              [
                h(
                  'span',
                  {
                    class: cls(
                      prefix + '-header-expand',
                      'mr-[3px] text-xs transition-transform duration-150',
                      expand.value ? 'rotate-0' : '-rotate-90',
                    ),
                  },
                  [h(IconWidget, { infer: 'Expand', size: 10 })],
                ),
                h('span', { class: prefix + '-header-content' }, [
                  h(TextWidget, { token: props.title }),
                ]),
              ],
            ),
            h(
              'div',
              {
                class: cls(
                  prefix + '-content-wrapper',
                  'flex justify-center bg-background',
                ),
              },
              [
                h(
                  'div',
                  {
                    class: cls(
                      prefix + '-content',
                      'w-full gap-px border-b border-border bg-border',
                      columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
                      expand.value ? 'grid' : 'hidden',
                    ),
                  },
                  [
                    ...sources.map((source) =>
                      slots.default
                        ? slots.default(source)
                        : renderNode(source),
                    ),
                    lastRowItems
                      ? h('div', {
                          class: cls(prefix + '-item-remain', 'bg-background'),
                          style: {
                            gridColumnStart: `span ${columns - lastRowItems}`,
                          },
                        })
                      : null,
                  ],
                ),
              ],
            ),
          ],
        )
      }
    },
  }),
)
