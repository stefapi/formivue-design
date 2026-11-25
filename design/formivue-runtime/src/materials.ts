import { Card, FormLayout, Space } from '@formivue-design/vue-ui'
import { ArrayCards } from './components/ArrayCards'
import { ArrayTable } from './components/ArrayTable'
import { FormCollapseBinding } from './components/FormCollapse'
import { FormGridBinding } from './components/FormGrid'
import { FormItem } from './components/FormItem'
import { FormTabBinding } from './components/FormTab'
import { Text } from './components/Text'
import { Cascader } from './fields/Cascader'
import { Checkbox } from './fields/Checkbox'
import { DatePicker } from './fields/DatePicker'
import { Input } from './fields/Input'
import { NumberPicker } from './fields/NumberPicker'
import { Password } from './fields/Password'
import { Radio } from './fields/Radio'
import { Rate } from './fields/Rate'
import { Select } from './fields/Select'
import { Slider } from './fields/Slider'
import { Switch } from './fields/Switch'
import { TimePicker } from './fields/TimePicker'
import { Transfer } from './fields/Transfer'
import { TreeSelect } from './fields/TreeSelect'
import { Upload } from './fields/Upload'
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
  Card,
  Space,
  FormLayout,
  FormGrid: FormGridBinding,
  FormTab: FormTabBinding,
  FormCollapse: FormCollapseBinding,
  ArrayCards,
  ArrayTable,
  PreviewText,
}

export type SchemaMaterials = typeof Materials

export { ComposedPreviewText as PreviewTextCompose, PreviewText }
