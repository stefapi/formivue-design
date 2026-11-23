// formivue/setters — ReactionsSetter (port de l'ère) : trigger « Configurer » +
// dialog — panneau FormCollapse (deps/state/run) sur les bindings réelles de
// @formivue-design/formivue-vue (carte Materials), tableau des dépendances
// (ArrayTable), PathSelector + FieldPropertySetter + TypeView locaux,
// MonacoInput (vue-settings-form, loader framework-agnostic).
//
// Écarts vs ère (documentés au suivi) : FormCollapse.createFormCollapse →
// defaultOpenKeys local (écart phase 4 assumé) ; destroyOnClose → contenu du
// dialog non monté à fermé (reka) ; le form est recréé à chaque ouverture ;
// les vnode React des titres deviennent des chaînes résolues GlobalRegistry
// (patchSchemaCompile du fork ne préserve pas les vnodes) ; showSearch/
// addonBefore/ellipsis antd élagués (V1, pile headless).
// Fix vs ère : le schéma du dialog était une CONSTANTE module — ses
// message() (en-têtes de panels, colonnes, placeholders) se figeaient à
// l'import dans la langue du navigateur et ne suivaient pas
// setDesignerLanguage. Factory createReactionsSchema() mémoïsée par
// langue, lue au rendu (GlobalRegistry observable → traquée par
// l'observer → le dialog suit le changement de langue).
import { defineComponent, h, shallowRef, type PropType } from 'vue'
import { clone, uid } from '@formivue/shared'
import { createForm, isVoidField, type Form } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import type { ISchema } from '@formivue/json-schema'
import { observer } from '@formivue/reactive-vue'
import { GlobalRegistry } from '@formivue-design/core'
import { TextWidget, usePrefix } from '@formivue-design/vue'
import { Button, Dialog, Tooltip } from '@formivue-design/vue-ui'
import { Materials } from '@formivue-design/formivue-vue'
import { MonacoInput } from '@formivue-design/vue-settings-form'
import { PathSelector } from './PathSelector'
import { FieldPropertySetter } from './FieldPropertySetter'
import { FulfillRunHelper } from './helpers'
import { initDeclaration } from './declarations'
import type { IReaction } from './types'

export interface IReactionsSetterProps {
  value?: IReaction
  onChange?: (value: IReaction) => void
}

const message = (token: string) =>
  GlobalRegistry.getDesignerMessage(
    `SettingComponents.ReactionsSetter.${token}`,
  )

// Tag antd + Tooltip → maison tokens (V1)
const TypeView = observer(
  defineComponent({
    name: 'DReactionTypeView',
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<any>, default: undefined },
    },
    setup(props) {
      return () => {
        const text = String(props.value ?? '')
        const tag = h(
          'span',
          {
            class:
              'inline-flex max-w-full items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground',
          },
          text.length <= 26 ? text : `${text.substring(0, 24)}...`,
        )
        if (text.length <= 26) return tag
        return h(
          Tooltip,
          { content: text },
          {
            default: () => [tag],
            content: () => [
              h('code', {}, [
                h(
                  'pre',
                  {
                    class:
                      'm-0 whitespace-pre-wrap p-0 text-xs text-foreground',
                  },
                  text,
                ),
              ]),
            ],
          },
        )
      }
    },
  }) as any,
)

const M = Materials as any

const fields = createSchemaField({
  components: {
    FormCollapse: M.FormCollapse,
    Input: M.Input,
    Select: M.Select,
    FormItem: M.FormItem,
    TypeView,
    PathSelector,
    FieldPropertySetter,
    ArrayTable: M.ArrayTable,
    MonacoInput,
  },
})

const FieldStateProperties = [
  'value',
  'initialValue',
  'inputValue',
  'inputValues',
  'modified',
  'initialized',
  'title',
  'description',
  'mounted',
  'unmounted',
  'active',
  'visited',
  'loading',
  'errors',
  'warnings',
  'successes',
  'feedbacks',
  'valid',
  'invalid',
  'pattern',
  'display',
  'disabled',
  'readOnly',
  'readPretty',
  'visible',
  'hidden',
  'editable',
  'validateStatus',
  'validating',
]

const FieldStateValueTypes: Record<string, string> = {
  modified: 'boolean',
  initialized: 'boolean',
  title: 'string',
  description: 'string',
  mounted: 'boolean',
  unmounted: 'boolean',
  active: 'boolean',
  visited: 'boolean',
  loading: 'boolean',
  errors: 'string[]',
  warnings: 'string[]',
  successes: 'string[]',
  feedbacks: `Array<
  triggerType?: 'onInput' | 'onFocus' | 'onBlur'
  type?: 'error' | 'success' | 'warning'
  code?:
    | 'ValidateError'
    | 'ValidateSuccess'
    | 'ValidateWarning'
    | 'EffectError'
    | 'EffectSuccess'
    | 'EffectWarning'
  messages?: string[]
>
`,
  valid: 'boolean',
  invalid: 'boolean',
  pattern: "'editable' | 'disabled' | 'readOnly' | 'readPretty'",
  display: "'visible' | 'hidden' | 'none'",
  disabled: 'boolean',
  readOnly: 'boolean',
  readPretty: 'boolean',
  visible: 'boolean',
  hidden: 'boolean',
  editable: 'boolean',
  validateStatus: "'error' | 'warning' | 'success' | 'validating'",
  validating: 'boolean',
}

// Factory (et non constante module) : les message() se résolvent à
// l'appel — mémoïsée par langue au rendu (voir getReactionsSchema).
const createReactionsSchema = (): ISchema =>
  ({
    type: 'object',
    properties: {
      reactions: {
        type: 'void',
        'x-component': 'FormCollapse',
        'x-component-props': {
          defaultOpenKeys: ['deps', 'state'],
          class: 'mb-2',
        },
        properties: {
          deps: {
            type: 'void',
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': {
              key: 'deps',
              header: message('relationsFields'),
            },
            properties: {
              dependencies: {
                type: 'array',
                default: [{}],
                'x-component': 'ArrayTable',
                items: {
                  type: 'object',
                  properties: {
                    sourceColumn: {
                      type: 'void',
                      'x-component': 'ArrayTable.Column',
                      'x-component-props': {
                        title: message('sourceField'),
                        width: 240,
                      },
                      properties: {
                        source: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'PathSelector',
                          'x-component-props': {
                            placeholder: message('pleaseSelect'),
                          },
                        },
                      },
                    },
                    propertyColumn: {
                      type: 'void',
                      'x-component': 'ArrayTable.Column',
                      'x-component-props': {
                        title: message('sourceProperty'),
                        width: 200,
                      },
                      properties: {
                        property: {
                          type: 'string',
                          default: 'value',
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          enum: FieldStateProperties,
                        },
                      },
                    },
                    nameColumn: {
                      type: 'void',
                      'x-component': 'ArrayTable.Column',
                      'x-component-props': {
                        title: message('variableName'),
                        width: 200,
                      },
                      properties: {
                        name: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-validator': {
                            pattern: /^[$_a-zA-Z]+[$_a-zA-Z0-9]*$/,
                            message: message('variableNameValidateMessage'),
                          },
                          'x-component': 'Input',
                          'x-component-props': {
                            placeholder: message('pleaseInput'),
                          },
                          'x-reactions': (field: any) => {
                            if (isVoidField(field)) return
                            field.query('.source').take((source: any) => {
                              if (isVoidField(source)) return
                              if (
                                source.value &&
                                !field.value &&
                                !field.modified
                              ) {
                                field.value =
                                  source.inputValues[1]?.props?.name ||
                                  `v_${uid()}`
                              }
                            })
                          },
                        },
                      },
                    },
                    typeColumn: {
                      type: 'void',
                      'x-component': 'ArrayTable.Column',
                      'x-component-props': {
                        title: message('variableType'),
                        width: 200,
                        align: 'center',
                      },
                      properties: {
                        type: {
                          type: 'string',
                          default: 'any',
                          'x-decorator': 'FormItem',
                          'x-component': 'TypeView',
                          'x-reactions': (field: any) => {
                            if (isVoidField(field)) return
                            const property = field
                              .query('.property')
                              .get('inputValues')
                            if (!property) return
                            property[0] = property[0] || 'value'
                            field.query('.source').take((source: any) => {
                              if (isVoidField(source)) return
                              if (source.value) {
                                if (
                                  property[0] === 'value' ||
                                  property[0] === 'initialValue' ||
                                  property[0] === 'inputValue'
                                ) {
                                  field.value =
                                    source.inputValues[1]?.props?.type || 'any'
                                } else if (property[0] === 'inputValues') {
                                  field.value = `any[]`
                                } else if (property[0]) {
                                  field.value =
                                    FieldStateValueTypes[property[0]]
                                } else {
                                  field.value = 'any'
                                }
                              }
                            })
                          },
                        },
                      },
                    },
                    operationsColumn: {
                      type: 'void',
                      'x-component': 'ArrayTable.Column',
                      'x-component-props': {
                        title: message('operations'),
                        align: 'center',
                        width: 80,
                      },
                      properties: {
                        remove: {
                          type: 'void',
                          'x-component': 'ArrayTable.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  addRelationField: {
                    type: 'void',
                    title: message('addRelationField'),
                    'x-component': 'ArrayTable.Addition',
                    'x-component-props': {
                      class: 'mt-2',
                    },
                  },
                },
              },
            },
          },
          state: {
            type: 'void',
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': {
              key: 'state',
              header: message('propertyReactions'),
            },
            properties: {
              'fulfill.state': {
                'x-component': 'FieldPropertySetter',
              },
            },
          },
          run: {
            type: 'void',
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': {
              key: 'run',
              header: message('actionReactions'),
            },
            properties: {
              'fulfill.run': {
                'x-component': 'MonacoInput',
                'x-component-props': {
                  width: '100%',
                  height: 400,
                  language: 'typescript',
                  helpCode: FulfillRunHelper,
                  options: {
                    minimap: {
                      enabled: false,
                    },
                  },
                },
                'x-reactions': (field: any) => {
                  const deps = field.query('dependencies').value()
                  if (Array.isArray(deps)) {
                    field.componentProps.extraLib = `
                  declare var $deps : {
                    ${deps.map(({ name, type }: any) => {
                      if (!name) return ''
                      return `${name}?:${type || 'any'},`
                    })}
                  }
                  `
                  }
                },
              },
            },
          },
        },
      },
    },
  }) as ISchema

export const ReactionsSetter = observer(
  defineComponent({
    name: 'DReactionsSetter',
    inheritAttrs: false,
    props: {
      value: {
        type: Object as PropType<IReaction>,
        default: undefined,
      },
      onChange: {
        type: null as unknown as PropType<(value: IReaction) => void>,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const prefix = usePrefix('reactions-setter')
      // Schéma mémoïsé PAR LANGUE : getDesignerLanguage() lit l'observable
      // GlobalRegistry au rendu — l'observer retraque à chaque changement
      // de langue et la factory rebuild les titres/colonnes/placeholders.
      let schemaLang: string | undefined
      let schemaCache: ISchema | undefined
      const getReactionsSchema = () => {
        const lang = GlobalRegistry.getDesignerLanguage()
        if (!schemaCache || schemaLang !== lang) {
          schemaLang = lang
          schemaCache = createReactionsSchema()
        }
        return schemaCache
      }
      // shallowRef : le form formivue ne doit pas être enveloppé par reactive Vue
      const formRef = shallowRef<Form | null>(null)
      const openModal = () => {
        formRef.value = createForm({ values: clone(props.value) })
        // L’autocomplétion de Monaco se charge indépendamment du formulaire.
        void initDeclaration().catch(() => {})
      }
      const closeModal = () => {
        formRef.value = null
      }
      return () => [
        h(
          Button,
          {
            block: true,
            ...attrs,
            onClick: openModal,
          },
          {
            default: () => [
              h(TextWidget, {
                token: 'SettingComponents.ReactionsSetter.configureReactions',
              }),
            ],
          },
        ),
        h(
          Dialog,
          {
            open: formRef.value !== null,
            title: String(message('configureReactions')),
            style: { width: '70%' },
            'onUpdate:open': (open: boolean) => {
              if (!open) closeModal()
            },
          },
          {
            default: () => [
              h(
                'div',
                {
                  class: [
                    prefix,
                    'max-h-[calc(100dvh-9rem)] w-full overflow-auto',
                  ].join(' '),
                },
                [
                  formRef.value
                    ? h(
                        FormProvider as any,
                        { form: formRef.value },
                        {
                          default: () => [
                            h(fields.SchemaField as any, {
                              schema: getReactionsSchema(),
                            }),
                          ],
                        },
                      )
                    : null,
                ],
              ),
            ],
            footer: () => [
              h(
                Button,
                {
                  'aria-label':
                    String(
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.Common.cancel',
                      ) ?? '',
                    ) || 'Cancel',
                  onClick: closeModal,
                },
                {
                  default: () =>
                    h(TextWidget, {
                      token: 'SettingComponents.Common.cancel',
                      defaultMessage: 'Cancel',
                    }),
                },
              ),
              h(
                Button,
                {
                  type: 'primary',
                  'aria-label':
                    String(
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.Common.ok',
                      ) ?? '',
                    ) || 'OK',
                  onClick: () => {
                    formRef.value?.submit((values: any) => {
                      props.onChange?.(values)
                    })
                    closeModal()
                  },
                },
                {
                  default: () =>
                    h(TextWidget, {
                      token: 'SettingComponents.Common.ok',
                      defaultMessage: 'OK',
                    }),
                },
              ),
            ],
          },
        ),
      ]
    },
  }) as any,
)
