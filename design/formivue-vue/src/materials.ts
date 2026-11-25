import {
  ArrayBaseMixin,
  Materials as RuntimeMaterials,
} from '@formivue-design/formivue-runtime'
import { withDesignerArrayMessages } from './common/runtime'
import {
  Checkbox,
  DatePicker,
  Input,
  NumberPicker,
  Password,
  Radio,
  Select,
  Slider,
  Switch,
  Text,
  TimePicker,
  Rate,
  TreeSelect,
  Cascader,
  Transfer,
  Upload,
} from './components'
import {
  ComposedPreviewText,
  PreviewText,
} from '@formivue-design/formivue-runtime'

const ArrayCards = ArrayBaseMixin.mixin(
  withDesignerArrayMessages(RuntimeMaterials.ArrayCards),
)
const ArrayTable = Object.assign(
  ArrayBaseMixin.mixin(withDesignerArrayMessages(RuntimeMaterials.ArrayTable)),
  { Column: RuntimeMaterials.ArrayTable.Column },
)

export const Materials = {
  ...RuntimeMaterials,
  Input,
  Password,
  NumberPicker,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
  DatePicker,
  TimePicker,
  Rate,
  TreeSelect,
  Cascader,
  Transfer,
  Upload,
  Text,
  ArrayCards,
  ArrayTable,
}

export type SchemaMaterials = typeof Materials

export { ComposedPreviewText as PreviewTextCompose, PreviewText }
