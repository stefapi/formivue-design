import type { ISchema } from '@formivue/json-schema'

// Le designer n'expose que Checkbox.Group (contrat d'ère) — les props
// antd (autoFocus) disparaissent (V1).
export const Checkbox: ISchema & { Group?: ISchema } = {
  type: 'object',
  properties: {},
}

Checkbox.Group = {
  type: 'object',
  properties: {},
}
