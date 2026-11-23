// formivue/setters — ReactionsSetter FieldPropertySetter (port de l'ère) :
// sélecteur de propriété de champ ($self.<prop> = (expression)) + éditeur
// Monaco (language javascript.expression). Menu vertical antd → **liste
// maison** (boutons + aria-current, tokens V6 — aucun menu vertical headless
// n'existe ; DropdownMenu reka ne rend pas une colonne navigable).
// useState → ref + watch, useRef → closures (recette des phases 4-5).
import { computed, defineComponent, h, ref, type PropType } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { isPlainObj, reduce } from '@formivue/shared'
import { MonacoInput } from '@formivue-design/vue-settings-form'
import { TextWidget, usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import cls from 'classnames'
import { FieldProperties } from './properties'

export interface IFieldProperty {
  [key: string]: string
}

export interface IFieldPropertySetterProps {
  extraLib?: string
  value?: IFieldProperty
  onChange?: (value: IFieldProperty) => void
}

const template = (code: string) => {
  if (!code) return
  return code.trim()
}

const parseExpression = (expression: string) => {
  if (!expression) return ''
  return String(expression).match(/^\{\{([\s\S]*)\}\}$/)?.[1] || ''
}

const filterEmpty = (value: object) => {
  return reduce(
    value,
    (buf: Record<string, string>, value: string, key: string) => {
      if (!value || value === '{{}}') return buf
      buf[key] = value
      return buf
    },
    {},
  )
}

export const FieldPropertySetter = observer(
  defineComponent({
    name: 'DFieldPropertySetter',
    inheritAttrs: false,
    props: {
      extraLib: { type: String, default: undefined },
      value: {
        type: Object as PropType<IFieldProperty>,
        default: undefined,
      },
      onChange: {
        type: null as unknown as PropType<(value: IFieldProperty) => void>,
        default: undefined,
      },
    },
    setup(props) {
      const prefix = usePrefix('field-property-setter')
      const selectKeys = ref<string[]>(['visible'])
      const value = computed(() => ({ ...(props.value as IFieldProperty) }))
      const currentProperty = computed(() =>
        FieldProperties.find((item) => item.key === selectKeys.value[0]),
      )
      return () =>
        h('div', { class: cls(prefix, 'flex w-full gap-2') }, [
          // liste des propriétés — port du Menu vertical antd
          h(
            'nav',
            {
              'aria-label':
                String(
                  GlobalRegistry.getDesignerMessage(
                    'SettingComponents.ReactionsSetter.fieldProperties',
                  ) ?? '',
                ) || 'Field properties',
              class:
                'flex h-[300px] w-[200px] shrink-0 flex-col gap-0.5 overflow-y-auto overflow-x-hidden rounded-md border border-border p-1 pr-1',
            },
            FieldProperties.map((key, index) => {
              if (isPlainObj(key)) {
                const active = selectKeys.value[0] === key.key
                return h(
                  'button',
                  {
                    key: key.key ?? index,
                    type: 'button',
                    class: cls(
                      'w-full rounded-sm px-2 py-1 text-left text-sm transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                    ),
                    'aria-current': active ? 'true' : undefined,
                    onClick: () => {
                      selectKeys.value = [key.key]
                    },
                  },
                  [
                    h(TextWidget, {
                      token: `SettingComponents.ReactionsSetter.${
                        key.token || key.key
                      }`,
                    }),
                  ],
                )
              }
              return h(
                'button',
                {
                  key: String(key),
                  type: 'button',
                  class: cls(
                    'w-full rounded-sm px-2 py-1 text-left text-sm transition-colors',
                    selectKeys.value[0] === key
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  ),
                  'aria-current':
                    selectKeys.value[0] === key ? 'true' : undefined,
                  onClick: () => {
                    selectKeys.value = [String(key)]
                  },
                },
                [
                  h(TextWidget, {
                    token: `SettingComponents.ReactionsSetter.${key}`,
                  }),
                ],
              )
            }),
          ),
          h(
            'div',
            {
              class: cls(
                prefix + '-coder-wrapper',
                'relative flex min-w-0 flex-1 flex-col',
              ),
            },
            [
              h(
                'div',
                {
                  class: cls(
                    prefix + '-coder-start',
                    'mb-1 flex h-[31px] items-center text-lg font-light text-foreground opacity-95',
                  ),
                },
                [
                  `$self.${selectKeys.value[0]} = (`,
                  h(
                    'span',
                    {
                      class: 'ml-2 text-sm font-normal text-muted-foreground',
                    },
                    [
                      '// ',
                      h(TextWidget, {
                        token:
                          'SettingComponents.ReactionsSetter.expressionValueTypeIs',
                      }),
                      ' `',
                      (currentProperty.value as any)?.type,
                      '`',
                    ],
                  ),
                ],
              ),
              h('div', { class: cls(prefix + '-coder', 'min-w-0 flex-1') }, [
                h(MonacoInput as any, {
                  key: selectKeys.value[0],
                  language: 'javascript.expression',
                  extraLib: props.extraLib,
                  helpCode: template((currentProperty.value as any)?.helpCode),
                  value: parseExpression(
                    (value.value as any)[selectKeys.value[0]],
                  ),
                  options: {
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                    minimap: {
                      enabled: false,
                    },
                  },
                  onChange: (expression: string) => {
                    props.onChange?.(
                      filterEmpty({
                        ...value.value,
                        [selectKeys.value[0]]: `{{${expression}}}`,
                      }),
                    )
                  },
                }),
              ]),
              h(
                'div',
                {
                  class: cls(
                    prefix + '-coder-end',
                    'my-1 flex h-[31px] items-center text-lg font-light text-foreground opacity-95',
                  ),
                },
                ')',
              ),
            ],
          ),
        ])
    },
  }) as any,
)
