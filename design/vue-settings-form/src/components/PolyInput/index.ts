// vue-settings-form — PolyInput / createPolyInput (port de l'ère) :
// un éditeur « polymorphe » — un bouton cycle les types (px / % / auto…),
// chaque type fournit son composant + ses transformations de valeur.
// React.createElement → h() ; useState → ref + watch ; useRef → closure.
import {
  defineComponent,
  h,
  ref,
  watch,
  type Component,
  type PropType,
} from 'vue'
import { observer } from '@formivue/reactive-vue'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Button } from '@formivue-design/vue-ui'
import cls from 'classnames'

export interface IInput {
  style?: any
  className?: string
  value: any
  onChange: (value: any) => void
  exclude?: string[]
  include?: string[]
}

export interface IPolyType {
  type: string
  title?: string
  icon?: string
  component?: Component
  checker: (value: any) => boolean
  toInputValue?: (value: any) => any
  toChangeValue?: (value: any) => any
}

export type PolyTypes = IPolyType[]

const isValid = (val: any) => val !== undefined && val !== null

const getEventValue = (event: any) => {
  if (event?.target) {
    if (isValid(event.target.value)) return event.target.value
    if (isValid(event.target.checked)) return event.target.checked
    return
  }
  return event
}

const createTypes = (
  types: PolyTypes,
  exclude: string[],
  include: string[],
) => {
  return types.filter(({ type }) => {
    if (Array.isArray(include) && include.length) {
      return include.includes(type)
    }
    if (Array.isArray(exclude) && exclude.length) {
      return !exclude.includes(type)
    }
    return true
  })
}

export function createPolyInput(polyTypes: PolyTypes = []): Component {
  return observer(
    defineComponent({
      name: 'DPolyInput',
      inheritAttrs: false,
      props: {
        value: { type: null as unknown as PropType<any>, default: undefined },
        onChange: {
          type: null as unknown as PropType<(value: any) => void>,
          default: undefined,
        },
        exclude: {
          type: Array as PropType<string[]>,
          default: undefined,
        },
        include: {
          type: Array as PropType<string[]>,
          default: undefined,
        },
      },
      setup(props, { attrs }) {
        const prefix = usePrefix('poly-input')
        const types = createTypes(polyTypes, props.exclude, props.include)
        const current = ref(types[0]?.type)
        // typesValue d'ère (useRef) : mémoire des saisies par type — la
        // bascule de type restitue la dernière valeur saisie du type cible.
        const typesValue: Record<string, any> = {}
        watch(
          () => props.value,
          () => {
            types?.forEach(({ checker, type }) => {
              if (checker(props.value)) {
                current.value = type
              }
            })
          },
          { immediate: true },
        )

        const type = () => types?.find(({ type }) => type === current.value)

        const getNextType = () => {
          const currentIndex = types?.findIndex(
            ({ type }) => type === current.value,
          )
          const nextIndex =
            currentIndex + 1 > types?.length - 1 ? 0 : currentIndex + 1
          return types[nextIndex]
        }

        const transformOnChangeValue = (value: any, type: IPolyType) => {
          return type?.toChangeValue ? type?.toChangeValue(value) : value
        }

        return () => {
          const currentType = type()
          const component = currentType?.component
          return h(
            'div',
            {
              class: cls(
                prefix,
                'flex w-full items-center',
                attrs.class as string,
              ),
              style: attrs.style as any,
            },
            [
              component &&
                h(
                  'div',
                  {
                    class: cls(
                      prefix + '-content',
                      'mr-0.5 flex min-w-0 grow-[2] [&>*]:w-full',
                    ),
                  },
                  [
                    h(component as any, {
                      ...attrs,
                      value: currentType?.toInputValue
                        ? currentType?.toInputValue(props.value)
                        : props.value,
                      onChange: (event: any) => {
                        const value = getEventValue(event)
                        typesValue[currentType?.type] = value
                        props.onChange?.(
                          transformOnChangeValue(value, currentType),
                        )
                      },
                    }),
                  ],
                ),
              h(
                Button,
                {
                  class: cls(
                    prefix + '-controller',
                    'h-7 shrink-0 grow-0 px-2 font-normal',
                  ),
                  // a11y (V8, règle 7) : le switcher de type peut ne rendre
                  // qu'une icône (ValueInput) — nom accessible par le type
                  'aria-label': `${
                    GlobalRegistry.getDesignerMessage(
                      'SettingComponents.PolyInput.changeValueType',
                    ) || 'Change value type'
                  } (${currentType?.title || currentType?.type})`,
                  style: {
                    width: !component ? '100%' : 'auto',
                  },
                  block: true,
                  onClick: () => {
                    const nextType = getNextType()
                    if (nextType === currentType) return
                    current.value = nextType?.type
                    props.onChange?.(
                      transformOnChangeValue(
                        typesValue[nextType?.type],
                        nextType,
                      ),
                    )
                  },
                },
                {
                  default: () =>
                    currentType?.icon
                      ? h(IconWidget, { infer: currentType.icon })
                      : currentType?.title || currentType?.type,
                },
              ),
            ],
          )
        }
      },
    }) as any,
  ) as any
}
