import { defineComponent, h, reactive, type PropType } from 'vue'
import { Button, Input } from '@formivue-design/vue-ui'
import { observer } from '@formivue/reactive-vue'
import { CursorType, GlobalRegistry, ScreenType } from '@formivue-design/core'
import {
  useCursor,
  useHistory,
  useScreen,
  useWorkbench,
  usePrefix,
} from '../../hooks'
import { IconWidget } from '../IconWidget'
import cls from 'classnames'

type DesignerToolsType = 'HISTORY' | 'CURSOR' | 'SCREEN_TYPE'

export type IDesignerToolsWidgetProps = {
  className?: string
  style?: any
  use?: DesignerToolsType[]
}

// antd Button.Group/InputNumber → vue-ui Button/NumberPicker (V2) ;
// onPressEnter → keydown Enter sur la racine NumberField (bubbling).
export const DesignerToolsWidget = observer(
  defineComponent({
    name: 'DesignerToolsWidget',
    props: {
      className: { type: String, default: undefined },
      style: { type: Object, default: undefined },
      use: {
        type: Array as PropType<DesignerToolsType[]>,
        default: () => ['HISTORY', 'CURSOR', 'SCREEN_TYPE'],
      },
    },
    setup(props) {
      const screen = useScreen()
      const cursor = useCursor()
      const workbench = useWorkbench()
      const history = useHistory()
      const prefix = usePrefix('designer-tools')
      // brouillon de saisie des dimensions du simulateur responsive : la
      // valeur affichée est celle de l'écran ('100%' ou des pixels, comme
      // l'InputNumber antd d'ère) tant qu'on ne tape pas ; validée sur
      // Entrée ou à la sortie du champ.
      const draft = reactive<{ width?: string; height?: string }>({})
      const parseSize = (value?: string) => {
        const text = String(value ?? '').trim()
        if (!text) return undefined
        if (/^\d+(\.\d+)?(px)?$/i.test(text)) return parseFloat(text)
        return text
      }
      const commitSize = (key: 'width' | 'height') => {
        if (draft[key] === undefined) return
        const next = parseSize(draft[key])
        draft[key] = undefined
        if (next === undefined) return
        if (key === 'width') screen?.setSize(next, screen.height)
        else screen?.setSize(screen.width, next)
      }
      const renderSizeInput = (key: 'width' | 'height') =>
        h(Input, {
          'aria-label':
            (key === 'width'
              ? GlobalRegistry.getDesignerMessage('tools.screenWidth')
              : GlobalRegistry.getDesignerMessage('tools.screenHeight')) ||
            (key === 'width' ? 'Screen width' : 'Screen height'),
          class: 'h-7 w-[70px] px-1 text-center text-xs',
          value: draft[key] ?? String(screen?.[key] ?? ''),
          onChange: (value: string) => {
            draft[key] = value
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') commitSize(key)
            if (e.key === 'Escape') draft[key] = undefined
          },
          onBlur: () => commitSize(key),
        })

      const renderHistoryController = () => {
        if (!props.use.includes('HISTORY')) return null
        return h('div', { class: 'mr-5 flex items-center' }, [
          h(
            Button,
            {
              size: 'small',
              disabled: !history?.allowUndo,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.undo') || 'Undo',
              title: GlobalRegistry.getDesignerMessage('tools.undo') || 'Undo',
              onClick: () => {
                history?.undo()
              },
            },
            { default: () => h(IconWidget, { infer: 'Undo' }) },
          ),
          h(
            Button,
            {
              size: 'small',
              disabled: !history?.allowRedo,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.redo') || 'Redo',
              title: GlobalRegistry.getDesignerMessage('tools.redo') || 'Redo',
              onClick: () => {
                history?.redo()
              },
            },
            { default: () => h(IconWidget, { infer: 'Redo' }) },
          ),
        ])
      }

      const renderCursorController = () => {
        if (workbench?.type !== 'FORMIVUEDESIGN') return null
        if (!props.use.includes('CURSOR')) return null
        return h('div', { class: 'mr-5 flex items-center' }, [
          h(
            Button,
            {
              size: 'small',
              disabled: cursor?.type === CursorType.Normal,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.moveCursor') ||
                'Move cursor',
              title:
                GlobalRegistry.getDesignerMessage('tools.moveCursor') ||
                'Move cursor',
              onClick: () => {
                cursor?.setType(CursorType.Normal)
              },
            },
            { default: () => h(IconWidget, { infer: 'Move' }) },
          ),
          h(
            Button,
            {
              size: 'small',
              disabled: cursor?.type === CursorType.Selection,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.selectionCursor') ||
                'Selection cursor',
              title:
                GlobalRegistry.getDesignerMessage('tools.selectionCursor') ||
                'Selection cursor',
              onClick: () => {
                cursor?.setType(CursorType.Selection)
              },
            },
            { default: () => h(IconWidget, { infer: 'Selection' }) },
          ),
        ])
      }

      const renderResponsiveController = () => {
        if (!props.use.includes('SCREEN_TYPE')) return null
        if (screen?.type !== ScreenType.Responsive) return null
        return [
          renderSizeInput('width'),
          h(IconWidget, {
            size: 10,
            infer: 'Close',
            class: 'mx-1 text-muted-foreground',
          }),
          h('span', { class: 'mr-2.5 inline-flex' }, [
            renderSizeInput('height'),
          ]),
          (screen.width !== '100%' || screen.height !== '100%') &&
            h(
              Button,
              {
                size: 'small',
                style: { marginRight: '20px' },
                'aria-label':
                  GlobalRegistry.getDesignerMessage('tools.resetScreenSize') ||
                  'Reset screen size',
                title:
                  GlobalRegistry.getDesignerMessage('tools.resetScreenSize') ||
                  'Reset screen size',
                onClick: () => {
                  screen?.resetSize()
                },
              },
              { default: () => h(IconWidget, { infer: 'Recover' }) },
            ),
        ]
      }

      const renderScreenTypeController = () => {
        if (!props.use.includes('SCREEN_TYPE')) return null
        return h('div', { class: 'mr-5 flex items-center' }, [
          h(
            Button,
            {
              size: 'small',
              disabled: screen?.type === ScreenType.PC,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.pcScreen') ||
                'PC screen',
              title:
                GlobalRegistry.getDesignerMessage('tools.pcScreen') ||
                'PC screen',
              onClick: () => {
                screen?.setType(ScreenType.PC)
              },
            },
            { default: () => h(IconWidget, { infer: 'PC' }) },
          ),
          h(
            Button,
            {
              size: 'small',
              disabled: screen?.type === ScreenType.Mobile,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.mobileScreen') ||
                'Mobile screen',
              title:
                GlobalRegistry.getDesignerMessage('tools.mobileScreen') ||
                'Mobile screen',
              onClick: () => {
                screen?.setType(ScreenType.Mobile)
              },
            },
            { default: () => h(IconWidget, { infer: 'Mobile' }) },
          ),
          h(
            Button,
            {
              size: 'small',
              disabled: screen?.type === ScreenType.Responsive,
              'aria-label':
                GlobalRegistry.getDesignerMessage('tools.responsiveScreen') ||
                'Responsive screen',
              title:
                GlobalRegistry.getDesignerMessage('tools.responsiveScreen') ||
                'Responsive screen',
              onClick: () => {
                screen?.setType(ScreenType.Responsive)
              },
            },
            { default: () => h(IconWidget, { infer: 'Responsive' }) },
          ),
        ])
      }

      const renderMobileController = () => {
        if (!props.use.includes('SCREEN_TYPE')) return null
        if (screen?.type !== ScreenType.Mobile) return
        return h(
          Button,
          {
            size: 'small',
            style: { marginRight: '20px' },
            'aria-label':
              GlobalRegistry.getDesignerMessage('tools.flipMobileScreen') ||
              'Flip mobile screen',
            title:
              GlobalRegistry.getDesignerMessage('tools.flipMobileScreen') ||
              'Flip mobile screen',
            onClick: () => {
              screen?.setFlip(!screen.flip)
            },
          },
          {
            default: () =>
              h(IconWidget, {
                infer: 'Flip',
                style: {
                  transition: 'all .15s ease-in',
                  transform: screen.flip ? 'rotate(-90deg)' : '',
                },
              }),
          },
        )
      }

      return () =>
        h(
          'div',
          {
            style: props.style,
            // d'ère (DesignerToolsWidget/styles.less) : display flex, centré
            class: cls(prefix, 'flex items-center', props.className),
          },
          [
            renderHistoryController(),
            renderCursorController(),
            renderScreenTypeController(),
            renderMobileController(),
            renderResponsiveController(),
          ],
        )
    },
  }),
)
