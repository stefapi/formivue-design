// formivue/setters — DataSourceSetter (port de l'ère) : trigger « Configurer »
// + dialog (reka-ui Dialog vue-ui) — arbre gauche / propriétés droite.
// Modal antd → Dialog headless : footer OK/Cancel maison (les locales antd
// pack disparaissent — V1, labels littéraux documentés), width 65% par
// attr style (le Dialog px par défaut), treeDataSource observable re-créé à
// chaque OUVERTURE (sémantique useMemo [value, modalVisible] d'ère — le
// contenu du dialog ne monte qu'ouvert), commit OK → transformDataToValue.
import {
  defineComponent,
  h,
  ref,
  shallowRef,
  type CSSProperties,
  type PropType,
} from 'vue'
import { observable } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import type { Form } from '@formivue/core'
import { TextWidget, usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Button, Dialog } from '@formivue-design/vue-ui'
import cls from 'classnames'
import { DataSettingPanel } from './DataSettingPanel'
import { TreePanel } from './TreePanel'
import { transformDataToValue, transformValueToData } from './shared'
import type { IDataSourceItem, ITreeDataSource } from './types'

export interface IDataSourceSetterProps {
  className?: string
  style?: CSSProperties
  onChange: (dataSource: IDataSourceItem[]) => void
  value: IDataSourceItem[]
  allowTree?: boolean
  allowExtendOption?: boolean
  defaultOptionValue?: {
    label: string
    value: any
  }[]
  effects?: (form: Form<any>) => void
}

export const DataSourceSetter = observer(
  defineComponent({
    name: 'DDataSourceSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
      value: {
        type: Array as PropType<IDataSourceItem[]>,
        default: () => [],
      },
      onChange: {
        type: null as unknown as PropType<
          (dataSource: IDataSourceItem[]) => void
        >,
        required: true,
      },
      allowTree: { type: Boolean, default: true },
      allowExtendOption: { type: Boolean, default: true },
      defaultOptionValue: {
        type: Array as PropType<{ label: string; value: any }[]>,
        default: undefined,
      },
      effects: {
        type: null as unknown as PropType<(form: Form<any>) => void>,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const prefix = usePrefix('data-source-setter')
      const modalVisible = ref(false)
      // observable d'ère — recréé à chaque ouverture (montage du contenu)
      // shallowRef : un ref() profond « vue-reactifie » le proxy observable
      // formivue (isObservable → faux → createForm clone → write-through mort)
      const treeDataSourceRef = shallowRef<ITreeDataSource | null>(null)
      const openModal = () => {
        treeDataSourceRef.value = observable({
          dataSource: transformValueToData(props.value ?? []),
          selectedKey: '',
        })
        modalVisible.value = true
      }
      const closeModal = () => {
        modalVisible.value = false
      }
      return () => {
        const treeDataSource = treeDataSourceRef.value
        return [
          h(
            Button,
            {
              block: true,
              ...attrs,
              class: cls((attrs as any).class, props.className),
              style: props.style,
              onClick: openModal,
            },
            {
              default: () => [
                h(TextWidget, {
                  token:
                    'SettingComponents.DataSourceSetter.configureDataSource',
                }),
              ],
            },
          ),
          h(
            Dialog,
            {
              open: modalVisible.value,
              style: { width: '65%' },
              'onUpdate:open': (open: boolean) => {
                if (!open) closeModal()
              },
            },
            {
              title: () => [
                h(TextWidget, {
                  token:
                    'SettingComponents.DataSourceSetter.configureDataSource',
                }),
              ],
              default: () =>
                modalVisible.value && treeDataSource
                  ? [
                      h(
                        'div',
                        {
                          class: cls(
                            prefix,
                            'flex w-full justify-around rounded-md border border-border',
                          ),
                        },
                        [
                          h(
                            'div',
                            {
                              class: 'relative w-2/5 border-r border-border',
                            },
                            [
                              h(TreePanel as any, {
                                treeDataSource,
                                allowTree: props.allowTree,
                                defaultOptionValue: props.defaultOptionValue,
                              }),
                            ],
                          ),
                          h('div', { class: 'w-3/5' }, [
                            h(DataSettingPanel as any, {
                              treeDataSource,
                              allowExtendOption: props.allowExtendOption,
                              effects: props.effects,
                            }),
                          ]),
                        ],
                      ),
                    ]
                  : [],
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
                      if (treeDataSource) {
                        props.onChange?.(
                          transformDataToValue(treeDataSource.dataSource),
                        )
                      }
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
      }
    },
  }) as any,
)
