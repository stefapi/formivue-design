// vue-settings-form — SettingsForm (port de l'ère) : le panneau de
// propriétés. Sélection → form formivue (createForm, write-through sur
// node.props observable — vérifié fork) → rendu du propsSchema via
// SchemaField ; effets useLocales/useSnapshot + effects du consommateur.
//
// Port Vue : les hooks d'ère (appelés à chaque rendu React) se résolvent
// en (a) workbench au setup (inject stable), (b) dérivation au rendu des
// observables (operation/tree/selection — suivis par l'observer), (c) le
// form vit dans un sous-composant keyé par node.id (sémantique useMemo
// d'ère — re-création à chaque changement de sélection). Le scheduler
// requestIdle d'ère est conservé (observer options).
import { defineComponent, h, provide, type PropType } from 'vue'
import { createForm, onFieldInputValueChange } from '@formivue/core'
import type { Form } from '@formivue/core'
import { FormProvider } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { requestIdle, cancelIdle } from '@formivue-design/shared'
import {
  usePrefix,
  useWorkbench,
  IconWidget,
  NodePathWidget,
  TextWidget,
} from '@formivue-design/vue'
import { FormLayout } from '@formivue-design/vue-ui'
import { SchemaField } from './SchemaField'
import type { ISettingFormProps } from './types'
import { SettingsFormContext } from './shared/context'
import { useLocales, useSnapshot } from './effects'
import cls from 'classnames'

// Mise en forme d'ère (react-settings-form/styles.less + Form antd
// `labelWidth 120 / labelAlign left / wrapperAlign right / colon false`) :
// une ligne par propriété — label 120px à gauche, contrôle aligné à droite,
// filet de séparation, typo 13px, contrôles compacts (h-7).
const SETTINGS_FORM_CLASSES = [
  'px-5 text-[13px]',
  // lignes
  '[&_[data-slot=form-item]]:my-2 [&_[data-slot=form-item]]:pb-2',
  '[&_[data-slot=form-item]]:border-b [&_[data-slot=form-item]]:border-border',
  '[&_[data-slot=form-item][data-layout=horizontal]]:items-center',
  // labels
  '[&_[data-slot=form-item-label]]:text-[13px] [&_[data-slot=form-item-label]]:font-normal',
  '[&_[data-slot=form-item-label]]:leading-tight [&_[data-slot=form-item-label]]:text-foreground/85',
  // zone contrôle : alignée à droite
  '[&_[data-slot=form-item-control]]:flex [&_[data-slot=form-item-control]]:min-h-7',
  '[&_[data-slot=form-item-control]]:items-center [&_[data-slot=form-item-control]]:justify-end',
  // contrôles compacts
  '[&_[data-slot=input]]:h-7! [&_[data-slot=input]]:px-2 [&_[data-slot=input]]:text-[13px]!',
  '[&_[data-slot=input]]:shadow-none [&_[data-slot=textarea]]:text-[13px]!',
  '[&_[data-slot=textarea]]:min-h-14 [&_[data-slot=textarea]]:shadow-none',
  '[&_[data-slot=select-trigger]]:h-7! [&_[data-slot=select-trigger]]:w-full',
  '[&_[data-slot=select-trigger]]:text-[13px]! [&_[data-slot=select-trigger]]:shadow-none',
  '[&_[data-slot=number-field]]:w-full [&_[data-slot=number-field-content]]:h-7!',
  '[&_[data-slot=number-field-input]]:h-7! [&_[data-slot=number-field-input]]:text-[13px]!',
  '[&_[data-slot=button]]:h-7! [&_[data-slot=button]]:text-[13px]! [&_[data-slot=button]]:shadow-none',
].join(' ')

const GlobalState = {
  idleRequest: null as any,
}

// Corps keyé : form recréé par sélection (clé = node.id), FormProvider +
// FormLayout (labelWidth 120 / labelAlign left d'ère) + SchemaField.
const SettingsFormContent = observer(
  defineComponent({
    name: 'DSettingsFormContent',
    inheritAttrs: false,
    props: {
      node: { type: Object as PropType<any>, required: true },
      operation: { type: Object as PropType<any>, required: true },
      settingsProps: { type: Object as PropType<any>, required: true },
    },
    setup(props) {
      const prefix = usePrefix('settings-form')
      const node = props.node
      let previousName = node.props.name
      // form créé UNE fois par montage (la clé parent pilote la
      // re-création) — values: node.props (observable) → write-through.
      const form = createForm({
        initialValues: props.node?.designerProps?.defaultProps,
        values: props.node?.props,
        effects(form: Form) {
          onFieldInputValueChange('name', () => {
            node.notifyFieldRename(previousName)
            previousName = node.props.name
          })
          useLocales(props.node)
          useSnapshot(props.operation)
          props.settingsProps?.effects?.(form)
        },
      })
      return () =>
        h(
          'div',
          {
            class: cls(
              prefix,
              SETTINGS_FORM_CLASSES,
              props.settingsProps?.className,
            ),
            style: props.settingsProps?.style,
            key: props.node.id,
          },
          [
            h(
              FormProvider as any,
              { form },
              {
                default: () =>
                  h(
                    FormLayout,
                    {
                      layout: 'horizontal',
                      labelWidth: 120,
                      labelAlign: 'left',
                    },
                    {
                      default: () =>
                        h(SchemaField as any, {
                          schema: props.node?.designerProps?.propsSchema,
                          components: props.settingsProps?.components,
                          scope: {
                            $node: props.node,
                            ...props.settingsProps?.scope,
                          },
                        }),
                    },
                  ),
              },
            ),
          ],
        )
    },
  }) as any,
)

export const SettingsForm = observer(
  defineComponent({
    name: 'DSettingsForm',
    inheritAttrs: false,
    props: {
      uploadAction: { type: String, default: undefined },
      components: { type: Object, default: undefined },
      effects: {
        type: null as unknown as PropType<(form: Form) => void>,
        default: undefined,
      },
      scope: { type: null as unknown as PropType<any>, default: undefined },
    },
    setup(props, { attrs }) {
      const prefix = usePrefix('settings-form')
      const workbench = useWorkbench()
      // contexte d'ère (uploadAction…) — fourni aux éditeurs (ImageInput…)
      provide(SettingsFormContext, props as ISettingFormProps)
      return () => {
        const currentWorkspace =
          workbench?.activeWorkspace || workbench?.currentWorkspace
        const operation = currentWorkspace?.operation
        const tree = operation?.tree
        const selected = operation?.selection?.selected || []
        const node = tree?.findById?.(selected[0])
        const isEmpty = !(
          node &&
          node.designerProps?.propsSchema &&
          selected.length === 1
        )
        const render = () => {
          if (!isEmpty) {
            return h(SettingsFormContent as any, {
              key: node.id,
              node,
              operation,
              settingsProps: { ...attrs, ...props },
            })
          }
          // Empty antd d'ère → placeholder maison (V1 : plus d'antd)
          return h(
            'div',
            {
              class: cls(
                prefix + '-empty',
                'flex h-32 items-center justify-center text-sm text-muted-foreground',
              ),
            },
            [
              h(TextWidget, {
                token: 'SettingComponents.SettingsForm.noProperties',
                defaultMessage: 'No properties',
              }),
            ],
          )
        }
        return h(
          IconWidget.Provider as any,
          { tooltip: true },
          {
            default: () =>
              h(
                'div',
                {
                  // d'ère : colonne plein cadre, chemin du nœud fixe, contenu
                  // défilant
                  class: cls(
                    prefix + '-wrapper',
                    'relative flex h-full flex-col overflow-hidden',
                  ),
                },
                [
                  !isEmpty &&
                    h(NodePathWidget as any, {
                      workspaceId: currentWorkspace?.id,
                    }),
                  h(
                    'div',
                    {
                      class: cls(
                        prefix + '-content',
                        'min-h-0 grow overflow-y-auto overflow-x-hidden',
                      ),
                    },
                    [render()],
                  ),
                ],
              ),
          },
        )
      }
    },
  }) as any,
  {
    scheduler: (update: () => void) => {
      cancelIdle(GlobalState.idleRequest)
      GlobalState.idleRequest = requestIdle(update, {
        timeout: 500,
      })
    },
  },
)
