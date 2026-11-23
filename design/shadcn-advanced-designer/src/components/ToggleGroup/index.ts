import { ToggleRightIcon } from '@lucide/vue'
import { ToggleGroup as RuntimeToggleGroup } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { ToggleGroup as ToggleGroupSchema } from '../../schemas/ToggleGroup'
import { ToggleGroup as ToggleGroupLocales } from '../../locales/ToggleGroup'
import { sampleChoices } from '../sampleChoices'

export const ToggleGroup = createMaterial({
  name: 'ToggleGroup',
  icon: ToggleRightIcon,
  type: 'string',
  component: RuntimeToggleGroup,
  fieldProps: { enum: sampleChoices },
  schema: ToggleGroupSchema,
  locales: ToggleGroupLocales,
})
