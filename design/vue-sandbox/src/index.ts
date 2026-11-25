// @formivue-design/vue-sandbox — port de @formivue-design/react-sandbox (ét. 3.4).
// Same-origin preview for trusted assets and content. The frame shares the
// host designer and workspace through direct references.
import {
  createApp,
  defineComponent,
  h,
  onMounted,
  ref,
  type App,
  type PropType,
} from 'vue'
import { isFn, globalThisPolyfill } from '@formivue-design/shared'
import {
  useDesigner,
  useWorkspace,
  useLayout,
  usePrefix,
} from '@formivue-design/vue'

export interface ISandboxProps {
  style?: any
  cssAssets?: string[]
  jsAssets?: string[]
  scope?: any
}

// composable — à appeler dans setup (l'ère le faisait depuis le rendu React)
export const useSandbox = (props: ISandboxProps) => {
  const frameRef = ref<HTMLIFrameElement>(null)
  const appCls = usePrefix('app')
  const designer = useDesigner()
  const workspace = useWorkspace()
  const layout = useLayout()
  const cssAssets = props.cssAssets || []
  const jsAssets = props.jsAssets || []
  const getCSSVar = (name: string) => {
    return getComputedStyle(
      document.querySelector(`.${appCls}`),
    ).getPropertyValue(name)
  }
  onMounted(() => {
    if (frameRef.value && workspace) {
      const styles = cssAssets
        ?.map?.((css) => {
          return `<link media="all" rel="stylesheet" href="${css}" />`
        })
        .join('\n')
      const scripts = jsAssets
        ?.map?.((js) => {
          return `<script src="${js}" type="text/javascript" ></script>`
        })
        .join('\n')
      const contentWindow = frameRef.value.contentWindow as any
      const contentDocument = frameRef.value.contentDocument
      contentWindow['__FORMIVUEDESIGN_SANDBOX_SCOPE__'] = props.scope
      contentWindow['__FORMIVUEDESIGN_LAYOUT__'] = layout
      contentWindow['__FORMIVUEDESIGN_ENGINE__'] = designer
      contentWindow['__FORMIVUEDESIGN_WORKSPACE__'] = workspace
      contentWindow['Formivue'] = (globalThisPolyfill as any)['Formivue']
      contentWindow['FormivueDesign'] = (globalThisPolyfill as any)[
        'FormivueDesign'
      ]
      contentDocument.open()
      contentDocument.write(`
      <!DOCTYPE html>
        <head>
          ${styles}
        </head>
        <style>
          html{
            overflow: overlay;
          }
          ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          ::-webkit-scrollbar-thumb {
            background-color:${getCSSVar('--dn-scrollbar-color')};
            border-radius: 0;
            transition: all .25s ease-in-out;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: ${getCSSVar('--dn-scrollbar-hover-color')};
          }
          body{
            margin:0;
            padding:0;
            overflow-anchor: none;
            user-select:none;
            background-color:${
              layout?.theme === 'light' ? '#fff' : 'transparent'
            } !important;
          }
          html{
            overflow-anchor: none;
          }
          .inherit-cusor * {
            cursor: inherit !important;
          }
        </style>
        <body>
          <div id="__SANDBOX_ROOT__"></div>
          ${scripts}
        </body>
      </html>
      `)
      contentDocument.close()
    }
  })
  return frameRef
}

let sandboxApp: App = null

if ((globalThisPolyfill as any).frameElement) {
  // l'iframe hôte retirée → l'app sandbox ne peut plus être démontée par le
  // parent : démontage explicite à l'unload (l'ère : unmountComponentAtNode)
  globalThisPolyfill.addEventListener('unload', () => {
    sandboxApp?.unmount()
  })
}

export const useSandboxScope = () => {
  return (globalThisPolyfill as any)['__FORMIVUEDESIGN_SANDBOX_SCOPE__']
}

// ReactDOM.render(render(scope), root) → createApp({ render }).mount(root)
export const renderSandboxContent = (render: (scope?: any) => any) => {
  if (isFn(render)) {
    sandboxApp?.unmount()
    sandboxApp = createApp({
      render: () => render(useSandboxScope()) as any,
    })
    sandboxApp.mount(document.getElementById('__SANDBOX_ROOT__'))
  }
}

export const Sandbox = defineComponent({
  name: 'Sandbox',
  inheritAttrs: false,
  props: {
    cssAssets: { type: Array as PropType<string[]>, default: undefined },
    jsAssets: { type: Array as PropType<string[]>, default: undefined },
    scope: { type: null, default: undefined },
  },
  setup(props, { attrs }) {
    const frameRef = useSandbox({
      cssAssets: props.cssAssets,
      jsAssets: props.jsAssets,
      scope: props.scope,
    })
    const { style, ...iframeProps } = attrs as any
    return () =>
      h('iframe', {
        ...iframeProps,
        ref: frameRef,
        style: {
          height: '100%',
          width: '100%',
          border: 'none',
          display: 'block',
          ...style,
        },
      })
  },
})
