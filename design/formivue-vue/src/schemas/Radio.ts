import type { ISchema } from '@formivue/json-schema'

// Le designer n'expose que Radio.Group (contrat d'ère) — les props antd
// (optionType/buttonStyle) disparaissent (V1).
export const Radio: ISchema & { Group?: ISchema } = {
  type: 'object',
  properties: {},
}

Radio.Group = {
  type: 'object',
  properties: {},
}
