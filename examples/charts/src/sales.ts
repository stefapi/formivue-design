import type { ISchema } from '@formivue/vue'

export const sampleSales = () => [
  { Mois: 'Jan.', Canal: 'Web', Montant: 320 },
  { Mois: 'Jan.', Canal: 'Web', Montant: 80 },
  { Mois: 'Jan.', Canal: 'Boutique', Montant: 260 },
  { Mois: 'Fév.', Canal: 'Web', Montant: 460 },
  { Mois: 'Fév.', Canal: 'Boutique', Montant: 340 },
  { Mois: 'Mars', Canal: 'Web', Montant: 520 },
  { Mois: 'Mars', Canal: 'Boutique', Montant: 410 },
]

const column = (title: string, properties: ISchema['properties']): ISchema => ({
  type: 'void',
  'x-component': 'ArrayTable.Column',
  'x-component-props': { title },
  properties,
})

export const tableSchema: ISchema = {
  type: 'object',
  properties: {
    sales: {
      type: 'array',
      'x-component': 'ArrayTable',
      items: {
        type: 'object',
        properties: {
          Mois: column('Mois', {
            Mois: {
              type: 'string',
              'x-component': 'Input',
              'x-component-props': { 'aria-label': 'Mois' },
            },
          }),
          Canal: column('Canal', {
            Canal: {
              type: 'string',
              'x-component': 'Input',
              'x-component-props': { 'aria-label': 'Canal' },
            },
          }),
          Montant: column('Montant', {
            Montant: {
              type: 'number',
              'x-component': 'NumberPicker',
              'x-component-props': { 'aria-label': 'Montant' },
            },
          }),
          actions: column('Actions', {
            up: {
              type: 'void',
              'x-component': 'ArrayTable.MoveUp',
              'x-component-props': { 'aria-label': 'Monter la ligne' },
            },
            down: {
              type: 'void',
              'x-component': 'ArrayTable.MoveDown',
              'x-component-props': { 'aria-label': 'Descendre la ligne' },
            },
            remove: {
              type: 'void',
              'x-component': 'ArrayTable.Remove',
              'x-component-props': { 'aria-label': 'Supprimer la ligne' },
            },
          }),
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayTable.Addition',
          'x-component-props': {
            title: 'Ajouter une vente',
            defaultValue: { Mois: 'Mars', Canal: 'Web', Montant: 100 },
          },
        },
      },
    },
  },
}

export const chartSchema: ISchema = {
  type: 'object',
  properties: {
    salesChart: {
      type: 'void',
      'x-component': 'BarChart',
      'x-component-props': {
        label: '{{ $exampleText("Ventes par mois et par canal") }}',
        locale: '{{ $exampleLocale() }}',
        rows: '{{ $salesChartRows($form.getValuesIn(["sales"]), $exampleText("Mois")) }}',
        xKey: '{{ $exampleText("Mois") }}',
        groupKey: 'Canal',
        valueKey: 'Montant',
        aggregation:
          '{{ $form.getValuesIn(["chartSettings", "aggregation"]) }}',
        valueFormat:
          '{{ $form.getValuesIn(["chartSettings", "valueFormat"]) }}',
        decimalPlaces:
          '{{ $form.getValuesIn(["chartSettings", "valueFormat"]) === "decimal" ? 2 : 0 }}',
        height: 275,
        emptyText:
          '{{ $exampleText("Ajoutez une vente pour afficher le graphique.") }}',
      },
    },
  },
}
