/// <reference types="vite/client" />

// Phase 7 (7.1) — port Vue de l'exemple basic : même studio que l'ère
// (behaviors/resources inline, canvas Root/Field/Card custom via Content),
// createApp au lieu de ReactDOM.render, chromes antd → vue-ui, styles →
// entrée Tailwind de l'app (V6, styles.css) au lieu d'antd.css + ./style.css.
import { createApp, defineComponent, h, onMounted } from 'vue'
import {
  Designer,
  IconWidget,
  Workbench,
  ViewPanel,
  DesignerToolsWidget,
  ViewToolsWidget,
  OutlineTreeWidget,
  ResourceWidget,
  StudioPanel,
  CompositePanel,
  WorkspacePanel,
  ToolbarPanel,
  ViewportPanel,
  SettingsPanel,
  HistoryWidget,
  TextWidget,
} from '@formivue-design/vue'
import {
  SettingsForm,
  MonacoInput,
  setNpmCDNRegistry,
} from '@formivue-design/vue-settings-form'
import { observer } from '@formivue/reactive-vue'
import {
  createDesigner,
  createResource,
  createBehavior,
  GlobalRegistry,
} from '@formivue-design/core'
import { Button, Radio } from '@formivue-design/vue-ui'
// lucide a retiré les icônes de marque (@lucide/vue n'expose plus Github) :
// SVG inline du tracé d'origine lucide — mêmes attrs qu'une icône lucide.
const Github = defineComponent({
  name: 'LucideGithub',
  setup: () => () =>
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('path', {
          d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
        }),
        h('path', { d: 'M9 18c-4.51 2-5-2-7-2' }),
      ],
    ),
})
import { Content } from './content'
import './styles.css'

const RootBehavior = createBehavior({
  name: 'Root',
  selector: 'Root',
  designerProps: {
    droppable: true,
  },
  designerLocales: {
    'en-US': {
      title: 'Root',
    },
    'fr-FR': {
      title: 'Racine',
    },
    'es-ES': {
      title: 'Raíz',
    },
  },
})

const InputBehavior = createBehavior({
  name: 'Input',
  selector: (node) =>
    node.componentName === 'Field' && node.props['x-component'] === 'Input',
  designerProps: {
    propsSchema: {
      type: 'object',
      $namespace: 'Field',
      properties: {
        'field-properties': {
          type: 'void',
          'x-component': 'CollapseItem',
          title: 'Field Properties',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },

            hidden: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Switch',
            },
            default: {
              'x-decorator': 'FormItem',
              'x-component': 'ValueInput',
            },
            test: {
              type: 'void',
              title: 'Test',
              'x-decorator': 'FormItem',
              'x-component': 'DrawerSetter',
              'x-component-props': {
                text: 'Open Drawer',
              },
              properties: {
                test: {
                  type: 'string',
                  title: 'Test Input',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              },
            },
          },
        },

        'component-styles': {
          type: 'void',
          title: 'Style',
          'x-component': 'CollapseItem',
          properties: {
            'style.width': {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'SizeInput',
            },
            'style.height': {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'SizeInput',
            },
            'style.display': {
              'x-component': 'DisplayStyleSetter',
            },
            'style.background': {
              'x-component': 'BackgroundStyleSetter',
            },
            'style.boxShadow': {
              'x-component': 'BoxShadowStyleSetter',
            },
            'style.font': {
              'x-component': 'FontStyleSetter',
            },
            'style.margin': {
              'x-component': 'BoxStyleSetter',
            },
            'style.padding': {
              'x-component': 'BoxStyleSetter',
            },
            'style.borderRadius': {
              'x-component': 'BorderRadiusStyleSetter',
            },
            'style.border': {
              'x-component': 'BorderStyleSetter',
            },
          },
        },
      },
    },
  },
  designerLocales: {
    'en-US': {
      title: 'Input',
      settings: {
        title: 'Title',
        hidden: 'Hidden',
        default: 'Default Value',
        style: {
          width: 'Width',
          height: 'Height',
          display: 'Display',
          background: 'Background',
          boxShadow: 'Box Shadow',
          font: 'Font',
          margin: 'Margin',
          padding: 'Padding',
          borderRadius: 'Border Radius',
          border: 'Border',
        },
      },
    },
    'fr-FR': {
      title: 'Champ de saisie',
      settings: {
        title: 'Titre',
        hidden: 'Masqué',
        default: 'Valeur par défaut',
        style: {
          width: 'Largeur',
          height: 'Hauteur',
          display: 'Affichage',
          background: 'Arrière-plan',
          boxShadow: 'Ombre portée',
          font: 'Police',
          margin: 'Marge externe',
          padding: 'Marge interne',
          borderRadius: 'Rayon des coins',
          border: 'Bordure',
        },
      },
    },
    'es-ES': {
      title: 'Campo de entrada',
      settings: {
        title: 'Título',
        hidden: 'Oculto',
        default: 'Valor predeterminado',
        style: {
          width: 'Ancho',
          height: 'Alto',
          display: 'Visualización',
          background: 'Fondo',
          boxShadow: 'Sombra de caja',
          font: 'Fuente',
          margin: 'Margen externo',
          padding: 'Espaciado interno',
          borderRadius: 'Radio de los bordes',
          border: 'Borde',
        },
      },
    },
  },
})

const CardBehavior = createBehavior({
  name: 'Card',
  selector: 'Card',
  designerProps: {
    droppable: true,
    resizable: {
      width(node, element) {
        const width = Number(
          node.props?.style?.width ?? element.getBoundingClientRect().width,
        )
        return {
          plus: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.width = width + 10
          },
          minus: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.width = width - 10
          },
        }
      },
      height(node, element) {
        const height = Number(
          node.props?.style?.height ?? element.getBoundingClientRect().height,
        )
        return {
          plus: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.height = height + 10
          },
          minus: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.height = height - 10
          },
        }
      },
    },
    translatable: {
      x(node, element, diffX) {
        const left =
          parseInt(node.props?.style?.left ?? element?.style.left) || 0
        const rect = element.getBoundingClientRect()
        return {
          translate: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.position = 'absolute'
            node.props.style.width = rect.width
            node.props.style.height = rect.height
            node.props.style.left = left + parseInt(String(diffX)) + 'px'
          },
        }
      },
      y(node, element, diffY) {
        const top = parseInt(node.props?.style?.top ?? element?.style.top) || 0
        const rect = element.getBoundingClientRect()
        return {
          translate: () => {
            node.props = node.props || {}
            node.props.style = node.props.style || {}
            node.props.style.position = 'absolute'
            node.props.style.width = rect.width
            node.props.style.height = rect.height
            node.props.style.top = top + parseInt(String(diffY)) + 'px'
          },
        }
      },
    },
  },
  designerLocales: {
    'en-US': {
      title: 'Card',
    },
    'fr-FR': {
      title: 'Carte',
    },
    'es-ES': {
      title: 'Tarjeta',
    },
  },
})

GlobalRegistry.setDesignerBehaviors([RootBehavior, InputBehavior, CardBehavior])

const Input = createResource({
  title: {
    'en-US': 'Input',
    'fr-FR': 'Champ de saisie',
    'es-ES': 'Campo de entrada',
  },
  icon: 'InputSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        title: 'Input',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  ],
})

const Card = createResource({
  title: {
    'en-US': 'Card',
    'fr-FR': 'Carte',
    'es-ES': 'Tarjeta',
  },
  icon: 'CardSource',
  elements: [
    {
      componentName: 'Card',
      props: {
        title: 'Card',
      },
    },
  ],
})

GlobalRegistry.registerDesignerLocales({
  'en-US': {
    sources: {
      Inputs: 'Inputs',
      Displays: 'Displays',
      Feedbacks: 'Feedbacks',
    },
  },
  'fr-FR': {
    sources: {
      Inputs: 'Entrées',
      Displays: 'Affichage',
      Feedbacks: 'Retours',
    },
  },
  'es-ES': {
    sources: {
      Inputs: 'Entradas',
      Displays: 'Presentación',
      Feedbacks: 'Retroalimentación',
    },
  },
})

const Logo = defineComponent({
  name: 'Logo',
  setup() {
    return () =>
      h(IconWidget, {
        infer: 'Logo',
        role: 'img',
        'aria-label': 'Formivue',
        style: { margin: '4px 8px', height: '30px', width: '121px' },
      })
  },
})

const Actions = observer(
  defineComponent({
    name: 'Actions',
    setup() {
      const supportLocales = ['en-us', 'fr-fr', 'es-es']
      onMounted(() => {
        if (!supportLocales.includes(GlobalRegistry.getDesignerLanguage())) {
          GlobalRegistry.setDesignerLanguage('en-us')
        }
      })
      return () =>
        h('div', { class: 'mr-2 flex items-center gap-2' }, [
          h(Radio, {
            class: 'text-xs',
            options: [
              { label: 'English', value: 'en-us' },
              { label: 'Français', value: 'fr-fr' },
              { label: 'Español', value: 'es-es' },
            ],
            value: GlobalRegistry.getDesignerLanguage(),
            onChange: (value: string | number) =>
              GlobalRegistry.setDesignerLanguage(String(value)),
          }),
          h(
            'a',
            {
              href: 'https://github.com/stefapi/formivue-design',
              target: '_blank',
              class:
                'inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            },
            [h(Github, { class: 'size-4' }), 'Github'],
          ),
          h(Button, null, { default: () => h(TextWidget, { token: 'Save' }) }),
          h(
            Button,
            { type: 'primary' },
            { default: () => h(TextWidget, { token: 'Publish' }) },
          ),
        ])
    },
  }) as any,
)

const engine = createDesigner()
const App = defineComponent({
  name: 'BasicExampleApp',
  setup() {
    return () =>
      h(Designer, { engine } as any, {
        default: () =>
          h(Workbench, null, {
            default: () =>
              h(StudioPanel, null, {
                logo: () => h(Logo),
                actions: () => h(Actions),
                default: () => [
                  h(CompositePanel, null, {
                    default: () => [
                      h(
                        CompositePanel.Item,
                        { title: 'panels.Component', icon: 'Component' },
                        {
                          default: () => [
                            h(ResourceWidget, {
                              title: 'sources.Inputs',
                              sources: [Input, Card],
                            }),
                            h(ResourceWidget, {
                              title: 'sources.Displays',
                              sources: [Input, Card],
                            }),
                            h(ResourceWidget, {
                              title: 'sources.Feedbacks',
                              sources: [Input, Card],
                            }),
                          ],
                        },
                      ),
                      h(
                        CompositePanel.Item,
                        { title: 'panels.OutlinedTree', icon: 'Outline' },
                        { default: () => h(OutlineTreeWidget) },
                      ),
                      h(
                        CompositePanel.Item,
                        { title: 'panels.History', icon: 'History' },
                        { default: () => h(HistoryWidget) },
                      ),
                    ],
                  }),
                  h(WorkspacePanel, null, {
                    default: () => [
                      h(ToolbarPanel, null, {
                        default: () => [
                          h(DesignerToolsWidget),
                          h(ViewToolsWidget),
                        ],
                      }),
                      h(ViewportPanel, null, {
                        default: () => [
                          h(
                            ViewPanel,
                            { type: 'FORMIVUEDESIGN' },
                            {
                              default: () => h(Content),
                            },
                          ),
                          h(
                            ViewPanel,
                            { type: 'JSONTREE' },
                            {
                              default: () =>
                                h(
                                  'div',
                                  {
                                    style: {
                                      overflow: 'hidden',
                                      height: '100%',
                                    },
                                  },
                                  [
                                    h(MonacoInput as any, {
                                      language: 'javascript',
                                      helpCode: '//hello world',
                                      defaultValue:
                                        '<div><div>123123<div>123123<div>123123<div>123123</div></div></div></div></div>',
                                    }),
                                  ],
                                ),
                            },
                          ),
                        ],
                      }),
                    ],
                  }),
                  h(
                    SettingsPanel,
                    { title: 'panels.PropertySettings' },
                    {
                      default: () => h(SettingsForm),
                    },
                  ),
                ],
              }),
          }),
      })
  },
})

setNpmCDNRegistry(`${import.meta.env.BASE_URL}editor-assets`, 'monaco/vs')
createApp(App).mount('#root')
