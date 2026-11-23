// vue-settings-form — SchemaField (port de l'ère) : createSchemaField du
// fork (@formivue/vue), composants = éditeurs locaux (ce package) + bindings
// réelles de @formivue-design/formivue-vue (carte Materials : Input/Select/
// DatePicker/FormGrid/FormTab/FormCollapse/ArrayTable…) pour le rendu des
// schémas de settings. Écarts documentés au suivi : 'ArrayItems' (ère
// @formivue/antd) n'a pas d'équivalent fork et n'est référencé par aucun
// schema porté — écarté ; les setters référencés par nom
// (DataSourceSetter/ReactionsSetter/ValidatorSetter, phase 6) sont résolus
// via le registre étendu par `components` (props de SettingsForm).
import { createSchemaField } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'
import {
  SizeInput,
  ColorInput,
  ImageInput,
  BackgroundImageInput,
  PositionInput,
  CornerInput,
  MonacoInput,
  ValueInput,
  BoxStyleSetter,
  BorderStyleSetter,
  BorderRadiusStyleSetter,
  BackgroundStyleSetter,
  BoxShadowStyleSetter,
  FontStyleSetter,
  DisplayStyleSetter,
  FlexStyleSetter,
  DrawerSetter,
  CollapseItem,
} from './components'

const M = Materials as any

const fields = createSchemaField({
  components: {
    FormItem: M.FormItem,
    CollapseItem,
    Input: M.Input,
    'Input.TextArea': M.Input?.TextArea,
    ValueInput,
    SizeInput,
    ColorInput,
    ImageInput,
    MonacoInput,
    PositionInput,
    CornerInput,
    BackgroundImageInput,
    BackgroundStyleSetter,
    BoxStyleSetter,
    BorderStyleSetter,
    BorderRadiusStyleSetter,
    DisplayStyleSetter,
    BoxShadowStyleSetter,
    FlexStyleSetter,
    FontStyleSetter,
    DrawerSetter,
    NumberPicker: M.NumberPicker,
    DatePicker: M.DatePicker,
    TimePicker: M.TimePicker,
    Select: M.Select,
    Checkbox: M.Checkbox,
    'Checkbox.Group': M.Checkbox?.Group,
    Radio: M.Radio,
    'Radio.Group': M.Radio?.Group ?? M.Radio,
    Slider: M.Slider,
    Switch: M.Switch,
    Space: M.Space,
    FormLayout: M.FormLayout,
    FormGrid: M.FormGrid,
    FormTab: M.FormTab,
    FormCollapse: M.FormCollapse,
    ArrayTable: M.ArrayTable,
  },
})

// parité d'ère : l'export public est le COMPOSANT SchemaField (le fork
// retourne la carte des champs — SchemaField.SchemaField est la racine)
export const SchemaField = fields.SchemaField as any
