// formivue/setters — DataSourceSetter DataSettingPanel (port de l'ère) : le
// panneau droit — édition des paires clé/valeur du nœau sélectionné.
//
// `<Form form={form} labelWidth={60}>` antd → FormProvider (fork) +
// FormLayout vue-ui ; ArrayItems @formivue/antd → **ArrayItems interne**
// (statics résolues par le registre du SchemaField LOCAL — createSchemaField
// du package). Le form vit dans un sous-composant **keyé par
// [selectedKey, dataSource.length]** (sémantique useMemo d'ère : re-créé à
// chaque changement de sélection) ; values = le nœud de l'arbre
// (observable) → write-through dans treeDataSource.dataSource (OK du dialog
// relit via transformDataToValue, contrat d'ère).
// Titres de schéma : TextWidget d'ère (vnode React) → chaînes résolues via
// GlobalRegistry (les vnodes ne survivent pas à patchSchemaCompile du fork —
// écart de forme documenté, la locale fait foi).
import { defineComponent, h, type PropType } from 'vue'
import { createForm, type Form as FormCore } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { GlobalRegistry } from '@formivue-design/core'
import { IconWidget, TextWidget } from '@formivue-design/vue'
import { Button, FormLayout } from '@formivue-design/vue-ui'
import { ValueInput } from '@formivue-design/vue-settings-form'
import { Materials } from '@formivue-design/formivue-vue'
import { ArrayItems } from '../ArrayItems'
import { Header } from './Header'
import { findTreeNode } from './shared'
import type { ITreeDataSource } from './types'

export interface IDataSettingPanelProps {
  treeDataSource: ITreeDataSource
  allowExtendOption?: boolean
  effects?: (form: FormCore<any>) => void
}

const fields = createSchemaField({
  components: {
    FormItem: Materials.FormItem,
    Input: Materials.Input,
    ValueInput,
    ArrayItems,
  },
})

const message = (token: string) =>
  GlobalRegistry.getDesignerMessage(
    `SettingComponents.DataSourceSetter.${token}`,
  )

// corps keyé : form re-créé à chaque [selectedKey, dataSource.length]
const DataSettingForm = observer(
  defineComponent({
    name: 'DDataSettingForm',
    inheritAttrs: false,
    props: {
      values: { type: Object, required: true },
      allowExtendOption: { type: Boolean, default: true },
      effects: {
        type: null as unknown as PropType<(form: FormCore<any>) => void>,
        default: undefined,
      },
    },
    setup(props) {
      const form = createForm({
        values: props.values,
        effects: props.effects,
      })
      const addKeyValuePair = () => {
        form.setFieldState('map', (state) => {
          state.value.push({})
        })
      }
      const schema = {
        type: 'object',
        properties: {
          map: {
            type: 'array',
            'x-component': 'ArrayItems',
            items: {
              type: 'object',
              'x-decorator': 'ArrayItems.Item',
              'x-decorator-props': { type: 'divide' },
              properties: {
                label: {
                  type: 'string',
                  title: message('label'),
                  'x-decorator': 'FormItem',
                  name: 'label',
                  'x-component': 'Input',
                  'x-disabled': !props.allowExtendOption,
                },
                value: {
                  type: 'string',
                  title: message('value'),
                  'x-decorator': 'FormItem',
                  name: 'value',
                  'x-component': 'ValueInput',
                },
                remove: props.allowExtendOption
                  ? {
                      type: 'void',
                      name: 'remove',
                      'x-component': 'ArrayItems.Remove',
                    }
                  : undefined,
              },
            },
          },
        },
      }
      return () =>
        [
          h(Header, {
            title: h(TextWidget, {
              token: 'SettingComponents.DataSourceSetter.nodeProperty',
            }),
            extra: props.allowExtendOption
              ? h(
                  Button,
                  {
                    type: 'text',
                    onClick: addKeyValuePair,
                  },
                  {
                    default: () => [
                      h(IconWidget, { infer: 'Add' }),
                      h(TextWidget, {
                        token:
                          'SettingComponents.DataSourceSetter.addKeyValuePair',
                      }),
                    ],
                  },
                )
              : null,
          }),
          h(
            'div',
            {
              class: 'h-[300px] max-h-[300px] overflow-auto p-1',
            },
            [
              h(
                FormProvider as any,
                { form },
                {
                  default: () =>
                    h(
                      FormLayout as any,
                      { labelWidth: 60 },
                      {
                        default: () =>
                          h(fields.SchemaField as any, {
                            schema,
                          }),
                      },
                    ),
                },
              ),
            ],
          ),
        ].filter((node) => node !== null && node !== undefined)
    },
  }) as any,
)

export const DataSettingPanel = observer(
  defineComponent({
    name: 'DDataSettingPanel',
    inheritAttrs: false,
    props: {
      treeDataSource: {
        type: Object as PropType<ITreeDataSource>,
        required: true,
      },
      allowExtendOption: { type: Boolean, default: true },
      effects: {
        type: null as unknown as PropType<(form: FormCore<any>) => void>,
        default: undefined,
      },
    },
    setup(props: {
      treeDataSource: ITreeDataSource
      allowExtendOption?: boolean
      effects?: (form: FormCore<any>) => void
    }) {
      return () => {
        const { dataSource, selectedKey } = props.treeDataSource
        const values = selectedKey && findTreeNode(dataSource, selectedKey)
        if (!values) {
          return [
            h(Header, {
              title: h(TextWidget, {
                token: 'SettingComponents.DataSourceSetter.nodeProperty',
              }),
              extra: null,
            }),
            h(
              'div',
              {
                class:
                  'flex h-[300px] items-center justify-center p-2 text-sm text-muted-foreground',
              },
              [
                h(TextWidget, {
                  token: 'SettingComponents.DataSourceSetter.pleaseSelectNode',
                }),
              ],
            ),
          ]
        }
        // form re-créé par sélection/taille (clé — sémantique useMemo d'ère)
        return h(DataSettingForm as any, {
          key: `${selectedKey}:${dataSource.length}`,
          values,
          allowExtendOption: props.allowExtendOption,
          effects: props.effects,
        })
      }
    },
  }) as any,
)
