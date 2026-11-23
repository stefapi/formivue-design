// formivue/vue — Materials : la carte de composants prête pour createSchemaField
// (vue PREVIEW du designer + scénario de charge 4.5). Les bindings réelles
// distinctes du matériau designer (grid/tab/collapse/arrays) y sont exposées
// sous leurs noms de schéma ('FormGrid', 'ArrayTable'…).
import {
  Card as DCard,
  FormLayout as DFormLayout,
  Space as DSpace,
} from '@formivue-design/vue-ui'
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
import { FormGridBinding } from './components/FormGrid/binding'
import { FormTabBinding } from './components/FormTab/binding'
import { FormCollapseBinding } from './components/FormCollapse/binding'
import { ArrayCards as ArrayCardsBinding } from './components/ArrayCards/binding'
import { ArrayTable as ArrayTableBinding } from './components/ArrayTable/binding'
import { FormItem } from './components/FormItem'
import { ComposedPreviewText, PreviewText } from './preview-text'

export const Materials = {
  FormItem,
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
  Card: DCard,
  Space: DSpace,
  FormLayout: DFormLayout,
  FormGrid: FormGridBinding,
  FormTab: FormTabBinding,
  FormCollapse: FormCollapseBinding,
  ArrayCards: ArrayCardsBinding,
  ArrayTable: ArrayTableBinding,
  PreviewText,
}

export type SchemaMaterials = typeof Materials

export { ComposedPreviewText as PreviewTextCompose, PreviewText }
