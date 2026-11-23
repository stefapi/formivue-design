import { CircleUserRoundIcon } from '@lucide/vue'
import { Avatar as RuntimeAvatar } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { Avatar as AvatarSchema } from '../../schemas/Avatar'
import { Avatar as AvatarLocales } from '../../locales/Avatar'

export const Avatar = createMaterial({
  name: 'Avatar',
  icon: CircleUserRoundIcon,
  component: RuntimeAvatar,
  props: { alt: 'Avatar', fallback: 'FV', size: 40 },
  schema: AvatarSchema,
  locales: AvatarLocales,
})
