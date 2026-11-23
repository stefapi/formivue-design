// Le décorateur FormItem headless (FormItemBase + id) : asterisk (marque
// requise), labelFor (association) — les autres props sont dérivées de
// l'état du champ (label=title, help=selfErrors, extra=description).
import type { ISchema } from '@formivue/json-schema'

export const FormItem: ISchema = {
  type: 'object',
  properties: {
    asterisk: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    labelFor: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}
