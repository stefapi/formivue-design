import type { ISchema } from '@formivue/vue'

export const sampleSales = () => [
  { Date: '2026-01-05', Canal: 'Web', Montant: 320, Statut: 'paid' },
  { Date: '2026-01-12', Canal: 'Web', Montant: 80, Statut: 'pending' },
  { Date: '2026-01-21', Canal: 'Boutique', Montant: 260, Statut: 'paid' },
  { Date: '2026-02-08', Canal: 'Web', Montant: 460, Statut: 'paid' },
  { Date: '2026-02-19', Canal: 'Boutique', Montant: 340, Statut: 'pending' },
  { Date: '2026-03-03', Canal: 'Web', Montant: 520, Statut: 'pending' },
  { Date: '2026-03-18', Canal: 'Boutique', Montant: 410, Statut: 'paid' },
]

export const salesPeriods = [
  ['2026-01-01', '2026-01-31'],
  ['2026-02-01', '2026-02-28'],
  ['2026-03-01', '2026-03-31'],
] as const

export const salesStatuses = [
  { value: 'paid', label: 'Payée' },
  { value: 'pending', label: 'En attente' },
] as const

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
          Date: column('Date', {
            Date: {
              type: 'string',
              'x-component': 'DatePicker',
              'x-component-props': {
                'aria-label': 'Date',
                locale: '{{ $exampleLocale() }}',
              },
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
          Statut: column('Statut', {
            Statut: {
              type: 'string',
              enum: [...salesStatuses],
              'x-component': 'Select',
              'x-component-props': { 'aria-label': 'Statut' },
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
            defaultValue: {
              Date: '2026-03-23',
              Canal: 'Web',
              Montant: 100,
              Statut: 'pending',
            },
          },
        },
      },
    },
  },
}

const sharedChartProps = {
  locale: '{{ $exampleLocale() }}',
  rows: '{{ $salesChartRows($form.getValuesIn(["sales"])) }}',
  filters: [
    {
      column: 'Date',
      operation: 'dateRange',
      value: '{{ $form.getValuesIn(["chartSettings", "period"]) }}',
    },
    {
      column: 'Statut',
      operation: 'matches',
      value: '{{ $form.getValuesIn(["chartSettings", "status"]) }}',
    },
  ],
  aggregation: '{{ $form.getValuesIn(["chartSettings", "aggregation"]) }}',
  valueFormat: '{{ $form.getValuesIn(["chartSettings", "valueFormat"]) }}',
  decimalPlaces:
    '{{ $form.getValuesIn(["chartSettings", "valueFormat"]) === "decimal" ? 2 : 0 }}',
  height: 260,
  emptyText: '{{ $exampleText("Aucune vente pour cette sélection.") }}',
}

export const chartSchema: ISchema = {
  type: 'object',
  properties: {
    salesByMonth: {
      type: 'void',
      'x-component': 'BarChart',
      'x-component-props': {
        ...sharedChartProps,
        label: '{{ $exampleText("Ventes par mois et par canal") }}',
        xKey: '{{ $exampleText("Mois") }}',
        groupKey: '{{ $exampleText("Canal") }}',
        valueKey: '{{ $exampleText("Montant") }}',
        datePeriod: 'month',
        categoryOrder: 'ascending',
      },
    },
    salesByChannel: {
      type: 'void',
      'x-component': 'DonutChart',
      'x-component-props': {
        ...sharedChartProps,
        label: '{{ $exampleText("Ventes par canal") }}',
        xKey: '{{ $exampleText("Canal") }}',
        valueKey: '{{ $exampleText("Montant") }}',
      },
    },
  },
}
