import { TagsIcon } from '@lucide/vue'
import { TagsInput as RuntimeTagsInput } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { TagsInput as TagsInputSchema } from '../../schemas/TagsInput'
import { TagsInput as TagsInputLocales } from '../../locales/TagsInput'

export const TagsInput = createMaterial({
  name: 'TagsInput',
  icon: TagsIcon,
  type: 'array',
  fieldProps: { items: { type: 'string' } },
  component: RuntimeTagsInput,
  schema: TagsInputSchema,
  locales: TagsInputLocales,
})
