import { ListFilterIcon } from '@lucide/vue'
import { Combobox as RuntimeCombobox } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { Combobox as ComboboxSchema } from '../../schemas/Combobox'
import { Combobox as ComboboxLocales } from '../../locales/Combobox'
import { sampleChoices } from '../sampleChoices'

export const Combobox = createMaterial({
  name: 'Combobox',
  icon: ListFilterIcon,
  type: 'string',
  component: RuntimeCombobox,
  fieldProps: { enum: sampleChoices },
  schema: ComboboxSchema,
  locales: ComboboxLocales,
})
