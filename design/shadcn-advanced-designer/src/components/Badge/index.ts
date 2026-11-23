import { BadgeIcon } from '@lucide/vue'
import { Badge as RuntimeBadge } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { Badge as BadgeSchema } from '../../schemas/Badge'
import { Badge as BadgeLocales } from '../../locales/Badge'

export const Badge = createMaterial({
  name: 'Badge',
  icon: BadgeIcon,
  component: RuntimeBadge,
  props: { text: 'Badge', variant: 'default' },
  schema: BadgeSchema,
  locales: BadgeLocales,
})
