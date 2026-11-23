// formivue/setters — ArrayItems (port **interne** de la binding @formivue/antd
// 2.3.7 sur la pile headless) : x-component des champs tableaux des schémas
// des setters — DataSettingPanel (« map »), ValidatorSetter (« x-validator »).
//
// Réutilise ArrayBase de @formivue-design/formivue-vue (Addition/Remove/MoveUp/
// MoveDown/Index/Copy — V1 : **pas de dnd-kit**, le SortHandle est un grip
// purement visuel, le tri passe par les boutons). Réécrit sur RecursionField
// du fork (@formivue/vue) : les noms pointés « ArrayItems.* » des schémas
// résolvent par FormPath.getIn(components, 'ArrayItems.Item') → statics.
//
// Écart vs ère (documenté au suivi) : la prop `schema` remplace le
// SchemaContext.Provider d'ère (ValidatorSetter rend son propre schéma de
// rangées) ; le conteneur sortable (react-sortable) disparaît (V1).
//
// NON exporté par l'entrée publique — interne au package (baseline
// @formivue-design/formivue-setters = 6 exports, diff:api ∅), résolu par nom dans
// les registres des SchemaField locaux et via provide(SchemaOptionsSymbol).
import { computed, defineComponent, h, markRaw, type PropType } from 'vue'
import type { ArrayField } from '@formivue/core'
import { isArr } from '@formivue/shared'
import { Schema, type ISchema } from '@formivue/json-schema'
import { useField, useFieldSchema, RecursionField } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import type { Ref } from 'vue'
import { ArrayBase } from '@formivue-design/formivue-vue'
import cls from 'classnames'

// Item : décorant de rangée (x-decorator="ArrayItems.Item") — ère rendait une
// div `formivue-array-items-item` ; type 'divide' → séparateur (tokens V6).
export const ArrayItemsItem = defineComponent({
  name: 'DArrayItemsItem',
  inheritAttrs: false,
  props: {
    type: {
      type: String as PropType<'card' | 'divide'>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: cls(
            (attrs as any).class,
            'mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-2 py-1.5',
            props.type === 'divide'
              ? 'border border-dashed border-border'
              : 'border border-border',
          ),
        },
        slots.default?.(),
      )
  },
})

export const ArrayItems = observer(
  defineComponent({
    name: 'DArrayItems',
    inheritAttrs: false,
    props: {
      // surcharge de schéma (port du SchemaContext.Provider d'ère) — sans
      // elle, le schéma du champ courant (useFieldSchema) fait foi
      schema: { type: Object as PropType<ISchema>, default: undefined },
    },
    setup(props, { attrs }) {
      const fieldRef = useField() as unknown as Ref<ArrayField>
      const fieldSchemaRef = useFieldSchema() as Ref<Schema>
      const schemaRef = computed<Schema | null>(() => {
        if (props.schema) return markRaw(new Schema(props.schema))
        return fieldSchemaRef?.value ?? null
      })
      const dataSource = () => {
        const value = fieldRef.value?.value
        return isArr(value) ? value.slice() : []
      }
      return () => {
        const schema = schemaRef.value
        if (!schema) return null
        const items = (isArr(schema.items) ? schema.items[0] : schema.items) as
          Schema | undefined
        // addition : property marquée x-component *Addition (port
        // useAddition d'ère — RecursionField name=key → champ void hôte du
        // bouton, path sans les voids → pas de pollution des valeurs)
        const addition = schema.reduceProperties<unknown, any>(
          (addition, additionSchema, key) => {
            if (
              String(additionSchema['x-component'] ?? '').indexOf('Addition') >
              -1
            ) {
              return h(RecursionField as any, {
                key: String(key),
                schema: additionSchema,
                name: key,
              })
            }
            return addition
          },
          null,
        )
        const rows = dataSource().map((_, index) =>
          h(
            ArrayBase.Item,
            {
              key: index,
              index,
              record: () => (fieldRef.value?.value as any[])?.[index],
            },
            {
              default: () =>
                items
                  ? [
                      h(RecursionField as any, {
                        schema: items,
                        name: index,
                      }),
                    ]
                  : [],
            },
          ),
        )
        return h(
          ArrayBase as any,
          { ...attrs },
          { default: () => [...rows, addition] },
        )
      }
    },
  }) as any,
)

// statics — les noms « ArrayItems.* » des schémas d'ère résolvent via
// FormPath.getIn(components, name) (mécanique ReactiveField du fork)
ArrayItems.Item = ArrayItemsItem
ArrayItems.SortHandle = (ArrayBase as any).SortHandle
ArrayItems.MoveUp = (ArrayBase as any).MoveUp
ArrayItems.MoveDown = (ArrayBase as any).MoveDown
ArrayItems.Remove = (ArrayBase as any).Remove
ArrayItems.Addition = (ArrayBase as any).Addition
ArrayItems.Copy = (ArrayBase as any).Copy
ArrayItems.Index = (ArrayBase as any).Index
