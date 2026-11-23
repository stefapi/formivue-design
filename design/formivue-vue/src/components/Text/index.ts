import { computed, defineComponent, h, type PropType } from 'vue'
import { createBehavior, createResource } from '@formivue-design/core'
import { useTreeNode, type DnFC } from '@formivue-design/vue'
import DOMPurify from 'dompurify'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'
import cls from 'classnames'

export interface IFormivueDesignTextProps {
  value?: string
  content?: string
  format?: 'text' | 'html'
  mode?: 'normal' | 'h1' | 'h2' | 'h3' | 'p'
  style?: Record<string, any>
  className?: string
}

const HTML_TAGS = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'dd',
  'del',
  'div',
  'dl',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]

const HTML_CLASSES = [
  '[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:ps-5',
  '[&_p+p]:mt-2 [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:ps-3',
  '[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold',
]

export const Text: DnFC<IFormivueDesignTextProps> = defineComponent({
  name: 'DText',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    content: { type: String, default: undefined },
    format: {
      type: String as PropType<IFormivueDesignTextProps['format']>,
      default: 'text',
    },
    mode: {
      type: String as PropType<IFormivueDesignTextProps['mode']>,
      default: undefined,
    },
    className: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    const node = useTreeNode()
    const content = computed(() => props.value || props.content || '')
    const html = computed(() => {
      if (props.format !== 'html' || !DOMPurify.isSupported) return undefined
      return DOMPurify.sanitize(content.value, {
        ALLOWED_TAGS: HTML_TAGS,
        ALLOWED_ATTR: [
          'href',
          'title',
          'lang',
          'dir',
          'colspan',
          'rowspan',
          'scope',
          'start',
          'reversed',
        ],
        ALLOW_DATA_ATTR: false,
      })
    })

    const preventLinkNavigation = (event: MouseEvent) => {
      if ((event.target as Element)?.closest?.('a')) event.preventDefault()
    }

    return () => {
      const isHtml = props.format === 'html'
      const markup = html.value
      const tag =
        !isHtml && props.mode && props.mode !== 'normal' ? props.mode : 'div'
      return h(
        tag,
        {
          ...attrs,
          class: cls(
            'dn-text',
            props.className,
            isHtml && HTML_CLASSES,
            attrs.class,
          ),
          style: [
            {
              whiteSpace: markup === undefined ? 'pre-wrap' : undefined,
              overflowWrap: 'anywhere',
            },
            attrs.style,
          ],
          'data-content-editable': isHtml
            ? undefined
            : 'x-component-props.content',
          innerHTML: markup,
          onClickCapture:
            isHtml && node ? preventLinkNavigation : attrs.onClickCapture,
        },
        markup === undefined ? content.value : undefined,
      )
    }
  },
}) as any

Text.Behavior = createBehavior({
  name: 'Text',
  extends: ['Field'],
  selector: (node) => node.props['x-component'] === 'Text',
  designerProps: {
    propsSchema: createVoidFieldSchema(AllSchemas.Text),
  },
  designerLocales: AllLocales.Text,
})

Text.Resource = createResource({
  icon: 'TextSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'string',
        'x-component': 'Text',
      },
    },
  ],
})
