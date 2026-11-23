import type { ISchema } from '@formivue/json-schema'

// Switch headless : aucune prop exposée (les labels checkedChildren antd
// disparaissent — V1).
export const Switch: ISchema = {
  type: 'object',
  properties: {},
}
