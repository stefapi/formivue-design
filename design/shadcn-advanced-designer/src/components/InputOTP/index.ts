import { KeyRoundIcon } from '@lucide/vue'
import { InputOTP as RuntimeInputOTP } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { InputOTP as InputOTPSchema } from '../../schemas/InputOTP'
import { InputOTP as InputOTPLocales } from '../../locales/InputOTP'

export const InputOTP = createMaterial({
  name: 'InputOTP',
  icon: KeyRoundIcon,
  type: 'string',
  component: RuntimeInputOTP,
  props: { length: 6 },
  schema: InputOTPSchema,
  locales: InputOTPLocales,
})
