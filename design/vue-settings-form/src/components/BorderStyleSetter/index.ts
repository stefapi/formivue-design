// vue-settings-form — BorderStyleSetter (port de l'ère) : sélectionneur de
// position de bordure (PositionInput) + 5 triplets de champs
// (style/width/color) par position, pilotés par réactions formivue
// (display visible/hidden selon la position courante).
// useMemo d'ère ([field.value]) → observable + reaction formivue.
// Écart a11y (V8) : les options « lignes » décoratives d'ère (spans vides)
// deviennent des libellés texte (un combobox doit être nommable).
import {
  defineComponent,
  h,
  onBeforeUnmount,
  type CSSProperties,
  type PropType,
} from 'vue'
import { observer } from '@formivue/reactive-vue'
import { Field, useField } from '@formivue/vue'
import type { Field as FieldType } from '@formivue/core'
import { observable, reaction } from '@formivue/reactive'
import { camelCase } from '@formivue/shared'
import { usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Select as FormivueSelect } from '@formivue-design/formivue-vue'
import { FoldItem } from '../FoldItem'
import { ColorInput } from '../ColorInput'
import { SizeInput } from '../SizeInput'
import { PositionInput } from '../PositionInput'
import cls from 'classnames'

const Positions = ['center', 'top', 'right', 'bottom', 'left']

// Options localisées (résolues au rendu — la langue peut changer à chaud) ;
// les valeurs CSS (none/solid/dashed/dotted) restent inchangées.
const getBorderStyleOptions = () => [
  {
    label:
      GlobalRegistry.getDesignerMessage(
        'SettingComponents.BorderStyleSetter.none',
      ) || 'None',
    value: 'none',
  },
  {
    label:
      GlobalRegistry.getDesignerMessage(
        'SettingComponents.BorderStyleSetter.solid',
      ) || 'Solid',
    value: 'solid',
  },
  {
    label:
      GlobalRegistry.getDesignerMessage(
        'SettingComponents.BorderStyleSetter.dashed',
      ) || 'Dashed',
    value: 'dashed',
  },
  {
    label:
      GlobalRegistry.getDesignerMessage(
        'SettingComponents.BorderStyleSetter.dotted',
      ) || 'Dotted',
    value: 'dotted',
  },
]

const createBorderProp = (position: string, key: string) => {
  const insert = position === 'center' ? '' : `-${position}`
  return camelCase(`border${insert}-${key}`)
}

const parseInitPosition = (field: FieldType) => {
  const basePath = field.address.parent()
  for (let i = 0; i < Positions.length; i++) {
    const position = Positions[i]
    const stylePath = `${basePath}.${createBorderProp(position, 'style')}`
    const widthPath = `${basePath}.${createBorderProp(position, 'width')}`
    const colorPath = `${basePath}.${createBorderProp(position, 'color')}`
    if (
      field.query(stylePath).value() ||
      field.query(widthPath).value() ||
      field.query(colorPath).value()
    ) {
      return position
    }
  }
  return 'center'
}

export interface IBorderStyleSetterProps {
  className?: string
  style?: CSSProperties
}

export const BorderStyleSetter = observer(
  defineComponent({
    name: 'DBorderStyleSetter',
    inheritAttrs: false,
    props: {
      className: { type: String, default: undefined },
      style: { type: Object as PropType<CSSProperties>, default: undefined },
    },
    setup(props) {
      const field = useField<FieldType>()
      const prefix = usePrefix('border-style-setter')
      // observable d'ère, re-parse quand la valeur du champ change
      // (sémantique useMemo [field.value]) — suivi par l'observer au rendu.
      const currentPosition = observable({
        value: parseInitPosition(field.value as FieldType),
      })
      const dispose = reaction(
        () => field.value?.value,
        () => {
          currentPosition.value = parseInitPosition(field.value as FieldType)
        },
      )
      onBeforeUnmount(() => dispose())
      const createReaction = (position: string) => (field: FieldType) => {
        field.display =
          currentPosition.value === position ? 'visible' : 'hidden'
        if (position !== 'center') {
          const borderStyle = field.query('.borderStyle').value()
          const borderWidth = field.query('.borderWidth').value()
          const borderColor = field.query('.borderColor').value()
          if (borderStyle || borderWidth || borderColor) {
            field.value = undefined
          }
        }
      }
      return () =>
        h(
          FoldItem as any,
          { label: field.value?.title },
          {
            default: () => [
              h(
                FoldItem.Extra as any,
                {},
                {
                  default: () =>
                    h(
                      'div',
                      {
                        // d'ère : grille de position à gauche, colonne de
                        // contrôles (style / largeur / couleur) à droite
                        class: cls(prefix, 'flex', props.className),
                        style: props.style,
                      },
                      [
                        h(
                          'div',
                          {
                            class: cls(
                              prefix + '-position',
                              '-ml-2.5 shrink-0',
                            ),
                          },
                          [
                            h(PositionInput as any, {
                              value: currentPosition.value,
                              onChange: (value: string) => {
                                currentPosition.value = value
                              },
                            }),
                          ],
                        ),
                        h(
                          'div',
                          {
                            class: cls(
                              prefix + '-input',
                              'mb-2.5 min-w-0 flex-1',
                            ),
                          },
                          Positions.map((position, key) =>
                            h(
                              'div',
                              {
                                key,
                                // positions masquées (display hidden) : vides
                                class:
                                  'flex h-[110px] flex-col justify-between empty:hidden',
                              } as any,
                              [
                                h(Field as any, {
                                  name: createBorderProp(position, 'style'),
                                  basePath: field.value?.address?.parent(),
                                  dataSource: getBorderStyleOptions(),
                                  reactions: createReaction(position),
                                  component: [
                                    FormivueSelect as any,
                                    {
                                      placeholder:
                                        GlobalRegistry.getDesignerMessage(
                                          'SettingComponents.BorderStyleSetter.pleaseSelect',
                                        ) || 'Please Select',
                                    },
                                  ],
                                }),
                                h(Field as any, {
                                  name: createBorderProp(position, 'width'),
                                  basePath: field.value?.address?.parent(),
                                  reactions: createReaction(position),
                                  // a11y (V8) : pas de FormItem ici (layout brut du
                                  // setter) — le champ est nommé via aria-label
                                  component: [
                                    SizeInput as any,
                                    {
                                      exclude: ['auto'],
                                      'aria-label': `Border ${position} width`,
                                    },
                                  ],
                                }),
                                h(Field as any, {
                                  name: createBorderProp(position, 'color'),
                                  basePath: field.value?.address?.parent(),
                                  reactions: createReaction(position),
                                  component: [
                                    ColorInput,
                                    {
                                      'aria-label': `Border ${position} color`,
                                    },
                                  ],
                                }),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                },
              ),
            ],
          },
        )
    },
  }) as any,
)
