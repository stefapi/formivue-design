// formivue/setters — ValidatorSetter (port de l'ère) : FoldItem (vue-settings-form)
// — Base : Select des formats prédéfinis ; Extra : l'éditeur de règles
// (ArrayItems interne sur le champ x-validator courant).
//
// Port clé (documenté au suivi) : l'ère enveloppait `<ArrayItems/>` dans un
// SchemaContext.Provider portant ValidatorSchema — le fork expose
// SchemaOptionsSymbol/Symbol publics, le setter **provide** le registre
// settings étendu d'ArrayItems (les noms « ArrayItems.* » du schéma résolvent
// par FormPath.getIn(components, name) dans ReactiveField) et passe le
// schéma au composant (prop `schema`, équivalent fonctionnel du Provider).
// Les chemins des sous-champs (x-validator.0.drawer.triggerType…) restent
// ceux d'ère : buildFieldPath saute les voids, DrawerSetter/FormItem/Select/
// ValueInput résolvent dans le registre settings du panneau hôte.
import {
  computed,
  defineComponent,
  h,
  inject,
  provide,
  type PropType,
} from 'vue'
import type { Ref } from 'vue'
import type { ArrayField } from '@formivue/core'
import { SchemaOptionsSymbol, useField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import type { ISchema } from '@formivue/json-schema'
import { GlobalRegistry } from '@formivue-design/core'
import { Select } from '@formivue-design/vue-ui'
import { FoldItem } from '@formivue-design/vue-settings-form'
import { ArrayItems } from '../ArrayItems'

export interface IValidatorSetterProps {
  value?: any
  onChange?: (value: any) => void
}

// titres des champs de règle : résolus à la construction depuis les locales
// settings.x-validator.* (en production le useLocales du panneau écrase avec
// les mêmes valeurs — le setter reste autonome en isolation, écart port
// documenté au suivi ; tokens d'ère)
const vmsg = (token: string) =>
  GlobalRegistry.getDesignerMessage(`settings.x-validator.${token}`)

const ValidatorSchema: ISchema = {
  type: 'array',
  items: {
    type: 'object',
    'x-decorator': 'ArrayItems.Item',
    'x-decorator-props': { type: 'divide' },
    properties: {
      sortable: {
        type: 'void',
        'x-component': 'ArrayItems.SortHandle',
      },
      drawer: {
        type: 'void',
        // titre via locale settings.* (useLocales du panneau en production —
        // résolu ici aussi pour l'isolement, même token d'ère)
        title: GlobalRegistry.getDesignerMessage('settings.x-validator.drawer'),
        'x-component': 'DrawerSetter',
        properties: {
          triggerType: {
            type: 'string',
            title: vmsg('triggerType.title'),
            enum: ['onInput', 'onFocus', 'onBlur'],
            'x-decorator': 'FormItem',
            'x-component': 'Select',
          },
          validator: {
            type: 'string',
            title: vmsg('validator.title'),
            'x-decorator': 'FormItem',
            'x-component': 'ValueInput',
            'x-component-props': {
              include: ['EXPRESSION'],
            },
          },
          message: {
            type: 'string',
            title: vmsg('message.title'),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          format: {
            type: 'string',
            title: vmsg('format.title'),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              allowClear: true,
            },
          },
          pattern: {
            type: 'string',
            title: vmsg('pattern'),
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': {
              prefix: '/',
              suffix: '/',
            },
          },
          len: {
            type: 'string',
            title: vmsg('len'),
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
          },
          max: {
            type: 'string',
            title: vmsg('max'),
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
          },
          min: {
            type: 'string',
            title: vmsg('min'),
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
          },
          exclusiveMaximum: {
            type: 'string',
            title: vmsg('exclusiveMaximum'),
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
          },
          exclusiveMinimum: {
            type: 'string',
            title: vmsg('exclusiveMinimum'),
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
          },
          whitespace: {
            type: 'string',
            title: vmsg('whitespace'),
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
          required: {
            type: 'string',
            title: vmsg('required'),
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
        },
      },
      moveDown: {
        type: 'void',
        'x-component': 'ArrayItems.MoveDown',
      },
      moveUp: {
        type: 'void',
        'x-component': 'ArrayItems.MoveUp',
      },
      remove: {
        type: 'void',
        'x-component': 'ArrayItems.Remove',
      },
    },
  },
  properties: {
    addValidatorRules: {
      type: 'void',
      title: GlobalRegistry.getDesignerMessage(
        'settings.x-validator.addValidatorRules',
      ),
      'x-component': 'ArrayItems.Addition',
      'x-component-props': {
        class: 'mb-2',
      },
    },
  },
} as ISchema

export const ValidatorSetter = observer(
  defineComponent({
    name: 'DValidatorSetter',
    inheritAttrs: false,
    props: {
      value: { type: null as unknown as PropType<any>, default: undefined },
      onChange: {
        type: null as unknown as PropType<(value: any) => void>,
        default: undefined,
      },
    },
    setup(props) {
      const fieldRef = useField() as unknown as Ref<ArrayField>
      // registre étendu : le registre settings du panneau hôte + ArrayItems
      // (interne) — les noms du ValidatorSchema résolvent chez les descendants
      const optionsRef = inject(SchemaOptionsSymbol, null)
      provide(
        SchemaOptionsSymbol,
        computed(() => {
          const options = (optionsRef?.value ?? {}) as any
          return {
            ...options,
            components: {
              ...(options.components ?? {}),
              ArrayItems,
            },
          }
        }),
      )
      return () =>
        h(
          FoldItem as any,
          { label: fieldRef.value?.title as any },
          {
            default: () => [
              h(
                FoldItem.Base as any,
                {},
                {
                  default: () => [
                    h(Select as any, {
                      value: Array.isArray(props.value)
                        ? undefined
                        : props.value,
                      onChange: props.onChange,
                      placeholder: GlobalRegistry.getDesignerMessage(
                        'SettingComponents.ValidatorSetter.pleaseSelect',
                      ),
                      options: GlobalRegistry.getDesignerMessage(
                        'SettingComponents.ValidatorSetter.formats',
                      ),
                    }),
                  ],
                },
              ),
              h(
                FoldItem.Extra as any,
                {},
                {
                  default: () => [
                    h(ArrayItems as any, {
                      schema: ValidatorSchema,
                    }),
                  ],
                },
              ),
            ],
          },
        )
    },
  }) as any,
)
