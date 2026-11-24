import {
  createFormDocumentProject,
  createFormDocumentVariant,
  renameFormDocumentProperty,
  transformToFormDocuments,
  transformToTreeNode,
  type CompileFormDocumentOptions,
} from '@formivue-design/formivue-transformer'
import type { Engine } from '@formivue-design/core'
import { message } from '../../../shared/language'

const field = (
  id: string,
  component: string,
  title: string,
  value: unknown,
) => ({
  type: typeof value,
  title,
  default: value,
  'x-designable-id': 'variant-demo-' + id,
  'x-component': component,
  'x-decorator': 'FormItem',
})

export function createVariantsDemo(
  engine: Engine,
  options: CompileFormDocumentOptions,
) {
  engine.setCurrentTree(
    transformToTreeNode({
      schema: {
        type: 'object',
        properties: {
          account: field(
            'account',
            'Input',
            message(['Account code', 'Code du compte', 'Código de cuenta']),
            'ACME-01',
          ),
          amount: field(
            'amount',
            'NumberPicker',
            message([
              'Order amount',
              'Montant de la commande',
              'Importe del pedido',
            ]),
            40,
          ),
          note: field(
            'note',
            'Input',
            message(['Order note', 'Note de commande', 'Nota del pedido']),
            'Standard',
          ),
        },
      },
    }),
  )
  const initial = transformToFormDocuments(
    engine.getCurrentTree(),
    undefined,
    options,
  )
  const project = createFormDocumentProject(initial, options)
  const customer = message(['Customer API', 'API client', 'API de clientes'])
  const backOffice = message(['Back office', 'Back-office', 'Administración'])
  const withCustomer = createFormDocumentVariant(project, customer)
  const withTwo = createFormDocumentVariant(withCustomer, backOffice)
  const first = renameFormDocumentProperty(
    withTwo,
    customer,
    { path: ['account'], key: 'customer_id' },
    options,
  ).project
  const second = renameFormDocumentProperty(
    first,
    backOffice,
    { path: ['amount'], key: 'order_total' },
    options,
  ).project
  return {
    ...second,
    variants: second.variants.map((variant) => {
      const properties = variant.dataSchema.properties
      const rules =
        variant.name === customer
          ? {
              customer_id: {
                type: 'string',
                pattern: '^[A-Z]+-[0-9]+$',
                readOnly: true,
              },
              amount: { type: 'number', minimum: 10, maximum: 500 },
            }
          : {
              order_total: { type: 'integer', minimum: 0, maximum: 1000 },
              note: { type: 'string', maxLength: 32 },
            }
      return {
        ...variant,
        dataSchema: {
          ...variant.dataSchema,
          properties: { ...properties, ...rules },
        },
      }
    }),
  }
}
