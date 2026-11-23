// @formivue-design/vue-ui — design-system-lite du designer Vue (phase 2, V2).
// Headless reka-ui + classes Tailwind 4 (scannées côté consommateur via
// `@source`— cf. README). Zéro dépendance formivue ici : le câblage aux champs
// (@formivue/vue connect/mapProps) est fait par les packages consommateurs.
//
// Contrat commun « form-friendly » : `value` + `onChange(value)` suffisent
// à brancher un composant sur un champ formivue (pattern fork docs/ui).

// primitives — chrome
export { Button } from './primitives/Button'
export { Input, Textarea, Password } from './primitives/Input'
export { Checkbox } from './primitives/Checkbox'
export { Radio, Switch, type IRadioOption } from './primitives/Radio'
export { Slider } from './primitives/Slider'
export { NumberPicker } from './primitives/NumberPicker'
export { Rate } from './primitives/Rate'
export { Select, type ISelectOption } from './primitives/Select'
export { Tooltip, Popover } from './primitives/Tooltip'
export { Dialog } from './primitives/Dialog'
export { Menu, type IMenuItem } from './primitives/Menu'
export { Collapsible, Tabs, type ITabItem } from './primitives/Collapsible'

// composite — données
export { Tree, type ITreeItem } from './composite/Tree'
export { Table, type ITableColumn } from './composite/Table'
export {
  DatePicker,
  TimePicker,
  DateRangePicker,
  TimeRangePicker,
} from './composite/DatePicker'
export { Cascader, type ICascaderOption } from './composite/Cascader'
export { TreeSelect, type ITreeSelectOption } from './composite/TreeSelect'
export { Transfer, type ITransferOption } from './composite/Transfer'
export {
  Upload,
  UploadDragger,
  type IUploadFile,
  type UploadStatus,
} from './composite/Upload'

// bloc form
export { FormItemBase } from './form/FormItemBase'
export { Space, Card } from './form/Space'
export { FormLayout } from './form/FormLayout'
export { FormLayoutKey, type IFormLayoutContext } from './form/context'
export { FormCollapse, FormTab } from './form/FormCollapse'
