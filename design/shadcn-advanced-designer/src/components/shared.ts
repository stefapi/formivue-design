import { defineComponent, h, type Component } from 'vue'
import {
  createBehavior,
  createResource,
  GlobalRegistry,
  TreeNode,
  type ITreeNode,
} from '@formivue-design/core'
import { DroppableWidget, useTreeNode, type DnFC } from '@formivue-design/vue'
import {
  createFieldSchema,
  createVoidFieldSchema,
} from '@formivue-design/formivue-vue'
import { observer } from '@formivue/reactive-vue'
import type { ISchema } from '@formivue/json-schema'

import {
  designerLanguages,
  type LocaleText,
  type materialLocales,
} from '../locales/shared'

type FieldType = 'string' | 'array' | 'void'

interface MaterialOptions {
  name: string
  icon?: Component
  type?: FieldType
  component: Component
  schema: ISchema
  locales: ReturnType<typeof materialLocales>
  props?: Record<string, unknown>
  fieldProps?: Partial<ISchema>
  children?: ITreeNode[]
  parent?: string
  child?: string
  droppable?: boolean
}

export const materialNode = (
  name: string,
  props: Record<string, unknown> = {},
  options: {
    type?: FieldType
    fields?: Partial<ISchema>
    children?: ITreeNode[]
  } = {},
): ITreeNode => ({
  componentName: 'Field',
  props: {
    type: options.type ?? 'void',
    'x-component': name,
    'x-component-props': props,
    ...options.fields,
  },
  children: options.children,
})

export function createMaterial(options: MaterialOptions) {
  const { name, schema, locales, child, parent, type = 'void' } = options
  const Target = options.component
  const Canvas = defineComponent({
    name: `Design${name}`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(Target, attrs, slots)
    },
  }) as DnFC
  Canvas.Behavior = createBehavior({
    name,
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === name,
    designerProps: {
      droppable: !!(child || options.droppable),
      ...(parent
        ? { allowDrop: (target) => target.props['x-component'] === parent }
        : {}),
      ...(child
        ? {
            allowAppend: (_, nodes) =>
              nodes?.every((node) => node.props['x-component'] === child),
          }
        : {}),
      propsSchema: (type === 'void'
        ? createVoidFieldSchema
        : createFieldSchema)(schema),
    },
    designerLocales: locales,
  })
  if (!parent) {
    Canvas.Resource = createResource({
      icon: options.icon
        ? h(options.icon, {
            class: 'size-6 shrink-0 text-muted-foreground',
            'aria-hidden': true,
          })
        : undefined,
      title: Object.fromEntries(
        designerLanguages.map((locale) => [locale, locales[locale].title]),
      ),
      elements: [
        materialNode(name, options.props, {
          type,
          fields:
            type === 'void'
              ? options.fieldProps
              : {
                  title: locales['en-US'].title,
                  'x-decorator': 'FormItem',
                  ...options.fieldProps,
                },
          children: options.children,
        }),
      ],
    })
  }
  return Canvas
}

interface CanvasContainerOptions {
  label: LocaleText
  heading?: string
  description?: string
  trigger?: string
  layout?: 'slides' | 'split' | 'scroll'
  child?: { name: string; label: LocaleText }
  droppable?: boolean
}

const localeIndex = () => {
  const language = GlobalRegistry.getDesignerLanguage().split('-')[0]
  return language === 'fr' ? 1 : language === 'es' ? 2 : 0
}

export const canvasContainer = (options: CanvasContainerOptions) =>
  observer(
    defineComponent({
      name: 'AdvancedCanvasContainer',
      inheritAttrs: false,
      setup(_, { attrs, slots }) {
        const node = useTreeNode()
        const { label, heading, description, trigger, child, layout } = options

        return () => {
          const language = localeIndex()
          const sections = node?.children ?? []
          const columns =
            layout === 'split' && attrs.direction !== 'vertical'
              ? sections
                  .map((section) => {
                    const size = Number(
                      section.props['x-component-props']?.defaultSize,
                    )
                    const weight =
                      Number.isFinite(size) && size > 0
                        ? size
                        : 100 / sections.length
                    return `minmax(0, ${weight}fr)`
                  })
                  .join(' ')
              : undefined
          const triggerText = trigger && attrs[trigger]
          const caption = description && attrs[description]
          const height =
            attrs.height ??
            (layout === 'scroll'
              ? 240
              : attrs.direction === 'vertical'
                ? 320
                : undefined)
          const sectionStyle =
            (layout === 'scroll' || layout === 'split') && height != null
              ? { height: `${Math.max(40, Number(height))}px` }
              : undefined

          return h(
            DroppableWidget,
            {
              className: [
                '@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 rounded-md border bg-card p-3 text-card-foreground',
                attrs.class,
              ]
                .filter(Boolean)
                .join(' '),
              style: attrs.style,
              placeholder: false,
            },
            {
              default: () => [
                h(
                  'div',
                  {
                    class:
                      'flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2',
                  },
                  [
                    h('div', { class: 'min-w-0 flex-1 basis-28' }, [
                      h(
                        'div',
                        {
                          class: 'text-sm font-medium wrap-anywhere',
                          'data-content-editable': heading
                            ? `x-component-props.${heading}`
                            : undefined,
                        },
                        String((heading && attrs[heading]) || label[language]),
                      ),
                      caption
                        ? h(
                            'p',
                            {
                              class:
                                'mt-1 text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground',
                            },
                            String(caption),
                          )
                        : null,
                    ]),
                    child
                      ? h(
                          'button',
                          {
                            type: 'button',
                            class:
                              'max-w-full rounded-md border px-2 py-1 text-xs wrap-anywhere hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                            onClick: (event: MouseEvent) => {
                              event.stopPropagation()
                              node?.append(
                                new TreeNode(
                                  materialNode(child.name, {
                                    title: child.label[language],
                                  }),
                                ),
                              )
                            },
                          },
                          `+ ${child.label[language]}`,
                        )
                      : null,
                    triggerText
                      ? h(
                          'span',
                          {
                            class:
                              'max-w-full rounded-md border px-2 py-1 text-xs wrap-anywhere text-muted-foreground',
                          },
                          String(triggerText),
                        )
                      : null,
                  ],
                ),
                sections.length
                  ? h(
                      'div',
                      {
                        class: [
                          'grid min-w-0 content-start gap-2',
                          sectionStyle && 'overflow-auto',
                          layout === 'scroll' && 'rounded-md border p-2',
                          columns && '@md:grid-cols-[var(--advanced-columns)]',
                          layout === 'slides'
                            ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]'
                            : 'grid-cols-[minmax(0,1fr)]',
                        ],
                        style: [
                          columns
                            ? { '--advanced-columns': columns }
                            : undefined,
                          sectionStyle,
                        ],
                      },
                      slots.default?.(),
                    )
                  : !child && options.droppable !== false
                    ? h(
                        'div',
                        {
                          class:
                            'dn-droppable-placeholder grid min-h-14 min-w-0 place-items-center rounded-md border border-dashed bg-muted/40 p-2 text-center text-xs wrap-anywhere text-muted-foreground',
                          style: sectionStyle,
                        },
                        [
                          'Drop a component here',
                          'Déposer un composant ici',
                          'Soltar un componente aquí',
                        ][language],
                      )
                    : null,
              ],
            },
          )
        }
      },
    }),
  )
