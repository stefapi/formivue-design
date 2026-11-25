import {
  ArrayBase as RuntimeArrayBase,
  ArrayBaseMixin,
} from '@formivue-design/formivue-runtime'
import { withDesignerArrayMessages } from '../common/runtime'

export {
  ArrayBaseItem,
  ArrayBaseMixin,
  useArray,
  useIndex,
  useRecord,
  type IArrayBaseAdditionProps,
  type IArrayBaseContext,
  type IArrayBaseItemProps,
  type IArrayBaseOperationProps,
  type IArrayBaseProps,
} from '@formivue-design/formivue-runtime'
export { arrayMessage } from '../common/runtime'

export const ArrayBase = ArrayBaseMixin.mixin(
  withDesignerArrayMessages(RuntimeArrayBase),
)
