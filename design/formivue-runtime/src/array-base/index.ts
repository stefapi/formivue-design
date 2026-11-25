import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  type InjectionKey,
  type PropType,
  type Ref,
} from 'vue'
import type { ArrayField } from '@formivue/core'
import { observer } from '@formivue/reactive-vue'
import { Schema, useField, useFieldSchema } from '@formivue/vue'
import { clone, isPlainObj, isUndef } from '@formivue/shared'
import {
  Plus,
  Trash2 as Delete,
  Copy,
  ArrowUp as Up,
  ArrowDown as Down,
  GripVertical as Menu,
} from '@lucide/vue'
import { Button } from '@formivue-design/vue-ui'
import cls from 'classnames'
import { useArrayMessage } from './messages'

export interface IArrayBaseAdditionProps {
  title?: string
  method?: 'push' | 'unshift'
  defaultValue?: any
  [key: string]: any
}
export interface IArrayBaseOperationProps {
  title?: string
  index?: number
  [key: string]: any
}

export interface IArrayBaseContext {
  field: Ref<ArrayField>
  schema: Ref<Schema>
  props: Ref<IArrayBaseProps>
}

export interface IArrayBaseItemProps {
  index: number
  record: ((index: number) => Record<string, any>) | Record<string, any>
}

export interface IArrayBaseProps {
  disabled?: boolean
  minItems?: number
  maxItems?: number
  itemDefault?: unknown
  addLabel?: string
  onAdd?: (index: number) => void
  onCopy?: (index: number) => void
  onRemove?: (index: number) => void
  onMoveDown?: (index: number) => void
  onMoveUp?: (index: number) => void
}

const ArrayBaseContext: InjectionKey<IArrayBaseContext> =
  Symbol('ArrayBaseContext')

const ItemContext: InjectionKey<IArrayBaseItemProps> = Symbol('ItemContext')

const takeRecord = (val: any, index?: number) =>
  typeof val === 'function' ? val(index) : val

export const useArray = () => inject(ArrayBaseContext, null)

const isItemIndex = (items: unknown, index?: number): index is number =>
  Array.isArray(items) &&
  index !== undefined &&
  Number.isInteger(index) &&
  index >= 0 &&
  index < items.length

const useIndexRef = () => {
  const ctx = inject(ItemContext, null)
  return computed(() => (ctx ? ctx.index : undefined))
}

export const useIndex = (index?: number) => {
  const ctx = inject(ItemContext, null)
  return ctx ? ctx.index : index
}

export const useRecord = (record?: any) => {
  const ctx = inject(ItemContext, null)
  return takeRecord(ctx ? ctx.record : record, ctx?.index)
}

const getSchemaDefaultValue = (schema: Schema) => {
  if (schema?.default !== undefined) return clone(schema.default)
  if (schema?.type === 'array') return []
  if (schema?.type === 'object') return {}
  if (schema?.type === 'void') {
    for (const key in schema.properties) {
      const value = getSchemaDefaultValue(schema.properties[key])
      if (value !== undefined && value !== null) return value
    }
  }
}

const getDefaultValue = (defaultValue: any, schema: Schema) => {
  if (defaultValue !== undefined && defaultValue !== null)
    return clone(defaultValue)
  if (Array.isArray(schema?.items))
    return getSchemaDefaultValue(schema?.items[0])
  return getSchemaDefaultValue(schema?.items as any)
}

// opérations communes : bouton texte + icône, no-op si le tableau est
// désactivé (mode designer — port du contrat `disabled` d'ère).
const ArrayOperation = (
  name: 'Copy' | 'Remove' | 'MoveDown' | 'MoveUp',
  icon: any,
  run: (ctx: {
    array: IArrayBaseContext
    index: number
    props: Record<string, any>
    e: MouseEvent
  }) => void,
) =>
  observer(
    defineComponent({
      name: `DArrayBase${name}`,
      inheritAttrs: false,
      props: {
        title: { type: String, default: undefined },
        index: { type: Number, default: undefined },
      },
      setup(props, { attrs }) {
        const array = useArray()
        const index = useIndexRef()
        const arrayMessage = useArrayMessage()
        return () => {
          if (!array) return null
          if (array.field.value?.pattern !== 'editable') return null
          const items = array.field.value.value
          const rowIndex = index.value ?? props.index
          const designer = array.field.value.form.props.designable
          const disabled =
            array.props.value.disabled ||
            attrs.disabled === true ||
            !isItemIndex(items, rowIndex) ||
            (name === 'Copy' && items.length >= array.props.value.maxItems) ||
            (name === 'Remove' && items.length <= array.props.value.minItems) ||
            (name === 'MoveUp' && rowIndex === 0) ||
            (name === 'MoveDown' && rowIndex === items.length - 1)
          return h(
            Button,
            {
              // bouton icône : nom accessible obligatoire (axe button-name)
              'aria-label': props.title ?? arrayMessage(name) ?? name,
              ...attrs,
              disabled: disabled && !designer,
              'aria-disabled': disabled || undefined,
              type: 'text',
              size: 'small',
              class: cls(
                'text-muted-foreground hover:text-foreground size-7 px-1',
                props.title && 'w-auto',
                attrs.class as string,
              ),
              onClick: (e: MouseEvent) => {
                e.stopPropagation()
                if (disabled) return
                if ((attrs as any).onClick) {
                  ;(attrs as any).onClick(e)
                  if (e.defaultPrevented) return
                }
                run({
                  array,
                  index: rowIndex,
                  props: { ...props, ...attrs },
                  e,
                })
              },
            },
            {
              default: () => [
                isUndef(attrs.icon) ? h(icon, { 'aria-hidden': 'true' }) : null,
                props.title,
              ],
            },
          )
        }
      },
    }) as any,
  )

export const ArrayBase = defineComponent({
  name: 'DArrayBase',
  inheritAttrs: false,
  props: {
    disabled: { type: Boolean, default: undefined },
    minItems: Number,
    maxItems: Number,
    itemDefault: {
      type: null as unknown as PropType<unknown>,
      default: undefined,
    },
    addLabel: { type: String, default: undefined },
    onAdd: { type: Function, default: undefined },
    onCopy: { type: Function, default: undefined },
    onRemove: { type: Function, default: undefined },
    onMoveDown: { type: Function, default: undefined },
    onMoveUp: { type: Function, default: undefined },
  },
  setup(props, { slots }) {
    const fieldRef = useField() as Ref<ArrayField>
    const schemaRef = useFieldSchema()
    provide(ArrayBaseContext, {
      field: fieldRef,
      schema: schemaRef as Ref<Schema>,
      props: computed(() => ({ ...props }) as IArrayBaseProps),
    })
    return () => slots.default?.()
  },
}) as any

export const ArrayBaseItem = defineComponent({
  name: 'DArrayBaseItem',
  props: {
    index: { type: Number, required: true },
    record: {
      type: [Object, Function] as PropType<IArrayBaseItemProps['record']>,
      default: null,
    },
  },
  setup(props, { slots }) {
    provide(ItemContext, {
      get index() {
        return props.index
      },
      get record() {
        return props.record
      },
    })
    return () => slots.default?.()
  },
}) as any

ArrayBase.Item = ArrayBaseItem
ArrayBase.Addition = observer(
  defineComponent({
    name: 'DArrayBaseAddition',
    inheritAttrs: false,
    props: {
      title: { type: String, default: undefined },
      method: {
        type: String as PropType<'push' | 'unshift'>,
        default: undefined,
      },
      defaultValue: { type: null, default: undefined },
    },
    setup(props, { attrs }) {
      const selfRef = useField() as any
      const array = useArray()
      return () => {
        if (!array) return null
        const pattern = array.field.value?.pattern
        if (pattern !== 'editable' && pattern !== 'disabled') return null
        const title =
          props.title ||
          selfRef.value?.title ||
          array.props.value.addLabel ||
          'Add'
        const size = array.field.value?.value?.length ?? 0
        const disabled =
          array.props.value.disabled ||
          pattern === 'disabled' ||
          size >= array.props.value.maxItems
        return h(
          Button,
          {
            ...attrs,
            type: 'default',
            disabled:
              (disabled && !array.field.value?.form.props.designable) ||
              attrs.disabled === true,
            'aria-disabled': disabled || undefined,
            class: cls(
              'border-border border-dashed w-full',
              attrs.class as string,
            ),
            onClick: (e: MouseEvent) => {
              if (disabled || attrs.disabled === true) return
              if ((attrs as any).onClick) {
                ;(attrs as any).onClick(e)
                if (e.defaultPrevented) return
              }
              const schemaDefault = array.props.value.itemDefault
              const defaultValue =
                props.defaultValue === undefined && schemaDefault !== undefined
                  ? clone(schemaDefault)
                  : getDefaultValue(
                      isPlainObj(schemaDefault) &&
                        isPlainObj(props.defaultValue)
                        ? { ...schemaDefault, ...props.defaultValue }
                        : props.defaultValue,
                      array.schema.value,
                    )
              if (props.method === 'unshift') {
                array.field.value?.unshift?.(defaultValue)
                array.props.value?.onAdd?.(0)
              } else {
                array.field.value?.push?.(defaultValue)
                array.props.value?.onAdd?.(
                  (array?.field.value?.value?.length ?? 1) - 1,
                )
              }
            },
          },
          {
            default: () => [
              isUndef(attrs.icon) ? h(Plus, { 'aria-hidden': 'true' }) : null,
              title,
            ],
          },
        )
      }
    },
  }) as any,
)

ArrayBase.Copy = ArrayOperation('Copy', Copy, ({ array, index }) => {
  const value = clone(array?.field.value?.value?.[index])
  const distIndex = index + 1
  array.field.value?.insert?.(distIndex, value)
  array.props.value?.onCopy?.(distIndex)
})

ArrayBase.Remove = ArrayOperation('Remove', Delete, ({ array, index }) => {
  array.field.value?.remove?.(index)
  array.props.value?.onRemove?.(index)
})

ArrayBase.MoveDown = ArrayOperation('MoveDown', Down, ({ array, index }) => {
  array.field.value?.moveDown?.(index)
  array.props.value?.onMoveDown?.(index)
})

ArrayBase.MoveUp = ArrayOperation('MoveUp', Up, ({ array, index }) => {
  array.field.value?.moveUp?.(index)
  array.props.value?.onMoveUp?.(index)
})

ArrayBase.Index = defineComponent({
  name: 'DArrayBaseIndex',
  setup(_, { attrs }) {
    const index = useIndexRef()
    return () =>
      h(
        'span',
        {
          ...attrs,
          class: cls('text-muted-foreground text-sm', attrs.class as string),
        },
        `#${(index.value ?? 0) + 1}.`,
      )
  },
}) as any

ArrayBase.SortHandle = observer(
  defineComponent({
    name: 'DArrayBaseSortHandle',
    inheritAttrs: false,
    setup(_, { attrs }) {
      const array = useArray()
      const arrayMessage = useArrayMessage()
      const index = useIndexRef()
      let pointer: { id: number; startY: number } | undefined
      return () => {
        if (!array) return null
        if (array.field.value?.pattern !== 'editable') return null
        const field = array.field.value
        const rowIndex = index.value
        const enabled =
          !array.props.value.disabled && isItemIndex(field.value, rowIndex)
        const label = arrayMessage('sort') ?? 'Reorder row'
        return h(
          'button',
          {
            ...attrs,
            type: 'button',
            'aria-label': label,
            'aria-keyshortcuts': enabled ? 'ArrowUp ArrowDown' : undefined,
            'aria-disabled': !enabled || undefined,
            tabindex: enabled ? undefined : -1,
            title: label,
            class: cls(
              'text-muted-foreground inline-flex size-7 items-center justify-center rounded-sm',
              enabled &&
                'cursor-grab touch-none hover:bg-muted active:cursor-grabbing',
              attrs.class as string,
            ),
            onPointerdown: (event: PointerEvent) => {
              const handle = event.currentTarget as HTMLElement
              if (!enabled || event.button !== 0 || !handle.closest('tr'))
                return
              event.preventDefault()
              event.stopPropagation()
              pointer = { id: event.pointerId, startY: event.clientY }
              handle.focus({ preventScroll: true })
              handle.setPointerCapture(event.pointerId)
            },
            onPointerup: (event: PointerEvent) => {
              if (!pointer || pointer.id !== event.pointerId) return
              const { startY } = pointer
              pointer = undefined
              if (!enabled || Math.abs(event.clientY - startY) < 5) return
              const handle = event.currentTarget as HTMLElement
              const origin = handle.closest('tr')
              const target = handle.ownerDocument
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest('tr')
              if (
                !target ||
                !origin ||
                target.parentElement !== origin.parentElement
              )
                return
              const destination = target.sectionRowIndex
              if (
                destination !== rowIndex &&
                isItemIndex(field.value, destination)
              ) {
                field.move(rowIndex, destination)
              }
            },
            onLostpointercapture: () => {
              pointer = undefined
            },
            onKeydown: (event: KeyboardEvent) => {
              if (
                !enabled ||
                (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
              )
                return
              event.preventDefault()
              event.stopPropagation()
              const destination = rowIndex + (event.key === 'ArrowUp' ? -1 : 1)
              if (isItemIndex(field.value, destination)) {
                const handle = event.currentTarget as HTMLElement
                field.move(rowIndex, destination)
                nextTick(() => handle.focus({ preventScroll: true }))
              }
            },
          },
          [h(Menu, { 'aria-hidden': 'true', class: 'size-4' })],
        )
      }
    },
  }) as any,
)

ArrayBase.useArray = useArray
ArrayBase.useIndex = useIndex
ArrayBase.useRecord = useRecord

export const ArrayBaseMixin = {
  mixin: (target: any) => {
    target.Item = ArrayBase.Item
    target.Index = ArrayBase.Index
    target.SortHandle = ArrayBase.SortHandle
    target.Addition = ArrayBase.Addition
    target.Copy = ArrayBase.Copy
    target.Remove = ArrayBase.Remove
    target.MoveDown = ArrayBase.MoveDown
    target.MoveUp = ArrayBase.MoveUp
    target.useArray = ArrayBase.useArray
    target.useIndex = ArrayBase.useIndex
    target.useRecord = ArrayBase.useRecord
    return target
  },
}
