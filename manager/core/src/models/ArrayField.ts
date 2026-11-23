import { isArr, move } from '@formivue/shared'
import { action, reaction } from '@formivue/reactive'
import {
  spliceArrayState,
  exchangeArrayState,
  cleanupArrayChildren,
} from '../shared/internals'
import { Field } from './Field'
import { Form } from './Form'
import { JSXComponent, IFieldProps, FormPathPattern } from '../types'

const hasIndex = (values: unknown, index: number) =>
  isArr(values) &&
  Number.isInteger(index) &&
  index >= 0 &&
  index < values.length

export class ArrayField<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
> extends Field<Decorator, Component, any, any[]> {
  displayName = 'ArrayField'

  constructor(
    address: FormPathPattern,
    props: IFieldProps<Decorator, Component>,
    form: Form,
    designable: boolean,
  ) {
    super(address, props, form, designable)
    this.makeAutoCleanable()
  }

  protected makeAutoCleanable() {
    this.disposers.push(
      reaction(
        () => this.value?.length,
        (newLength, oldLength) => {
          if (oldLength && !newLength) {
            cleanupArrayChildren(this, 0)
          } else if (newLength < oldLength) {
            cleanupArrayChildren(this, newLength)
          }
        },
      ),
    )
  }

  push = (...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = []
      }
      this.value.push(...items)
      return this.onInput(this.value)
    })
  }

  pop = () => {
    if (isArr(this.value)) return this.remove(this.value.length - 1)
  }

  insert = (index: number, ...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = []
      }
      if (items.length === 0) {
        return
      }
      spliceArrayState(this, {
        startIndex: index,
        insertCount: items.length,
      })
      this.value.splice(index, 0, ...items)
      return this.onInput(this.value)
    })
  }

  remove = (index: number) => {
    if (!hasIndex(this.value, index)) return
    return action(() => {
      spliceArrayState(this, {
        startIndex: index,
        deleteCount: 1,
      })
      this.value.splice(index, 1)
      return this.onInput(this.value)
    })
  }

  shift = () => this.remove(0)

  unshift = (...items: any[]) => {
    return action(() => {
      if (!isArr(this.value)) {
        this.value = []
      }
      spliceArrayState(this, {
        startIndex: 0,
        insertCount: items.length,
      })
      this.value.unshift(...items)
      return this.onInput(this.value)
    })
  }

  move = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      !hasIndex(this.value, fromIndex) ||
      !hasIndex(this.value, toIndex)
    )
      return
    return action(() => {
      move(this.value, fromIndex, toIndex)
      exchangeArrayState(this, {
        fromIndex,
        toIndex,
      })
      return this.onInput(this.value)
    })
  }

  moveUp = (index: number) => {
    if (!isArr(this.value)) return
    return this.move(index, index - 1 < 0 ? this.value.length - 1 : index - 1)
  }

  moveDown = (index: number) => {
    if (!isArr(this.value)) return
    return this.move(index, index + 1 >= this.value.length ? 0 : index + 1)
  }
}
