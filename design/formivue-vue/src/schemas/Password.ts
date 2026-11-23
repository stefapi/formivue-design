import type { ISchema } from '@formivue/json-schema'
import { Input } from './Input'

// Password = Input natif type=password — les props antd (checkStrength)
// disparaissent.
export const Password: ISchema = {
  type: 'object',
  properties: {
    ...(Input.properties as any),
  },
}
