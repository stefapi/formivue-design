import { defineComponent, h, useId, type PropType } from 'vue'
import {
  isDatePeriod,
  type ChartFilter,
  type ChartName,
  type ChartSeries,
} from '@formivue-design/charts-runtime'
import { useOperation } from '@formivue-design/vue'
import { ValueInput } from '@formivue-design/vue-settings-form'
import { Button, Table } from '@formivue-design/vue-ui'
import { observer } from '@formivue/reactive-vue'
import { ChartMappingStatus } from './mapping-status'
import { text } from './settings-language'
import {
  arrayTableColumns,
  arrayTableSources,
  chartFilterFields,
  chartColumns,
  chartSource,
  hasChartColumn,
} from './source'

const controlClass =
  'h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring'

const fieldValue = (event: Event) =>
  (event.target as HTMLInputElement | HTMLSelectElement).value

const selectedNode = (operation: ReturnType<typeof useOperation>) =>
  operation?.tree.findById(operation.selection.selected[0])

const currentSource = (operation: ReturnType<typeof useOperation>) => {
  const node = selectedNode(operation)
  return chartSource(
    node?.props['x-component-props']?.rows,
    arrayTableSources(node),
  )
}

const ChartRows = observer(
  defineComponent({
    name: 'ChartRows',
    inheritAttrs: false,
    props: { value: [Array, String] },
    emits: ['change'],
    setup(props, { attrs, emit }) {
      const operation = useOperation()
      return () => {
        const node = selectedNode(operation)
        const sources = arrayTableSources(node)
        const source = chartSource(props.value, sources)
        const columns = chartColumns(source).slice(0, 6)
        const preview = source.records.slice(0, 4)
        return h('div', { class: 'grid w-full min-w-0 gap-2' }, [
          h(
            'select',
            {
              ...attrs,
              class: controlClass,
              value: source.linked?.expression ?? '',
              onChange: (event: Event) =>
                emit('change', fieldValue(event) || []),
            },
            [
              h(
                'option',
                { value: '' },
                text([
                  'Custom data',
                  'Données personnalisées',
                  'Datos personalizados',
                ]),
              ),
              ...sources.map(({ expression, title }) =>
                h('option', { key: expression, value: expression }, title),
              ),
            ],
          ),
          source.linked
            ? null
            : h(ValueInput, {
                value: props.value,
                include: ['JSON', 'EXPRESSION'],
                jsonType: 'array',
                onChange: (value: unknown) => emit('change', value),
              }),
          node
            ? h(ChartMappingStatus, {
                name: node.props['x-component'] as ChartName,
                mapping: node.props['x-component-props'],
                source,
                declaredColumns: source.linked
                  ? arrayTableColumns(source.linked.node).map(
                      (field) => field.props.name || field.id,
                    )
                  : undefined,
              })
            : null,
          preview.length && columns.length
            ? h('div', { class: 'overflow-x-auto rounded-md border' }, [
                h(Table, {
                  'aria-label': text([
                    'Data preview',
                    'Aperçu des données',
                    'Vista previa de datos',
                  ]),
                  columns,
                  rowKey: (_, index) => String(index),
                  dataSource: preview.map((record) =>
                    Object.fromEntries(
                      columns.map(({ key }) => {
                        const value = record[key]
                        return [
                          key,
                          typeof value === 'object' || value == null
                            ? '–'
                            : String(value),
                        ]
                      }),
                    ),
                  ),
                }),
              ])
            : null,
        ])
      }
    },
  }),
)

const ChartAxis = observer(
  defineComponent({
    name: 'ChartAxis',
    inheritAttrs: false,
    props: { value: String, numeric: Boolean, allowDatePeriod: Boolean },
    emits: ['change'],
    setup(props, { attrs, emit }) {
      const list = useId()
      const operation = useOperation()
      return () => {
        const source = currentSource(operation)
        const columns = chartColumns(source)
        const matching = columns.find(({ key }) => key === props.value)
        const datesOnly =
          props.allowDatePeriod &&
          isDatePeriod(
            selectedNode(operation)?.props['x-component-props']?.datePeriod,
          )
        const choices = datesOnly
          ? columns.filter(({ date }) => date)
          : props.numeric
            ? columns.filter(({ numeric }) => numeric)
            : columns.sort((a, b) => Number(!!a.numeric) - Number(!!b.numeric))
        const warning =
          props.value && !hasChartColumn(source, props.value)
            ? text([
                'Column not found',
                'Colonne introuvable',
                'Columna no encontrada',
              ])
            : props.numeric && matching?.numeric === false
              ? text([
                  'Non-numeric values are skipped',
                  'Les valeurs non numériques sont ignorées',
                  'Se omiten los valores no numéricos',
                ])
              : ''
        return h('div', { class: 'grid w-full min-w-0 gap-1' }, [
          h('input', {
            ...attrs,
            class: controlClass,
            list,
            value: props.value ?? '',
            'aria-invalid': warning ? true : undefined,
            onInput: (event: Event) => emit('change', fieldValue(event)),
          }),
          h(
            'datalist',
            { id: list },
            choices.map(({ key, title }) =>
              h('option', { key, value: key }, title),
            ),
          ),
          warning
            ? h(
                'p',
                { class: 'text-xs text-destructive', role: 'status' },
                warning,
              )
            : null,
        ])
      }
    },
  }),
)

const ChartSeriesInput = observer(
  defineComponent({
    name: 'ChartSeriesInput',
    inheritAttrs: false,
    props: { value: Array as PropType<ChartSeries[]> },
    emits: ['change'],
    setup(props, { attrs, emit }) {
      const id = useId()
      const operation = useOperation()
      return () => {
        const source = currentSource(operation)
        const columns = chartColumns(source)
        const entries = Array.isArray(props.value) ? props.value : []
        const available = columns.filter(
          ({ key, numeric }) =>
            numeric && !entries.some((entry) => entry.key === key),
        )
        const add = (key: string) => {
          const column = available.find((column) => column.key === key)
          emit('change', [
            ...entries,
            column ? { key, title: column.title } : { key: '' },
          ])
        }
        const update = (index: number, patch: Partial<ChartSeries>) =>
          emit(
            'change',
            entries.map((entry, position) =>
              position === index ? { ...entry, ...patch } : entry,
            ),
          )

        return h('div', { class: 'grid w-full min-w-0 gap-2' }, [
          h(
            'select',
            {
              ...attrs,
              class: controlClass,
              value: '',
              onChange: (event: Event) => {
                const select = event.target as HTMLSelectElement
                add(
                  select.value.startsWith('column:')
                    ? select.value.slice(7)
                    : '',
                )
                select.value = ''
              },
            },
            [
              h(
                'option',
                { value: '', disabled: true },
                text(['Add a series', 'Ajouter une série', 'Añadir una serie']),
              ),
              ...available.map(({ key, title }) =>
                h('option', { key, value: `column:${key}` }, title),
              ),
              h(
                'option',
                { value: 'manual' },
                text([
                  'Enter a column key',
                  'Saisir une clé de colonne',
                  'Introducir una clave de columna',
                ]),
              ),
            ],
          ),
          h(
            'datalist',
            { id },
            columns
              .filter(({ numeric }) => numeric)
              .map(({ key, title }) => h('option', { key, value: key }, title)),
          ),
          ...entries.map((entry, index) => {
            const column = columns.find(({ key }) => key === entry.key)
            const invalid = source.records.slice(0, 50).filter((row) => {
              const value = row[entry.key]
              return (
                value != null &&
                (typeof value !== 'number' || !Number.isFinite(value))
              )
            }).length
            const warning =
              entry.key && !hasChartColumn(source, entry.key)
                ? text([
                    'Column not found',
                    'Colonne introuvable',
                    'Columna no encontrada',
                  ])
                : invalid || column?.numeric === false
                  ? text([
                      'Non-numeric values are skipped',
                      'Les valeurs non numériques sont ignorées',
                      'Se omiten los valores no numéricos',
                    ])
                  : ''
            return h(
              'fieldset',
              { key: index, class: 'grid min-w-0 gap-1 rounded-md border p-2' },
              [
                h(
                  'legend',
                  { class: 'px-1 text-xs' },
                  `${text(['Series', 'Série', 'Serie'])} ${index + 1}`,
                ),
                h('label', { class: 'grid gap-1 text-xs' }, [
                  text(['Column', 'Colonne', 'Columna']),
                  h('input', {
                    class: controlClass,
                    list: id,
                    value: entry.key,
                    'aria-invalid': warning ? true : undefined,
                    onInput: (event: Event) =>
                      update(index, { key: fieldValue(event) }),
                  }),
                ]),
                warning
                  ? h(
                      'p',
                      { class: 'text-xs text-destructive', role: 'status' },
                      warning,
                    )
                  : null,
                h('label', { class: 'grid gap-1 text-xs' }, [
                  text(['Label', 'Libellé', 'Etiqueta']),
                  h('input', {
                    class: controlClass,
                    value: entry.title ?? '',
                    onInput: (event: Event) =>
                      update(index, { title: fieldValue(event) }),
                  }),
                ]),
                h(
                  Button,
                  {
                    size: 'small',
                    variant: 'ghost',
                    onClick: () =>
                      emit(
                        'change',
                        entries.filter((_, position) => position !== index),
                      ),
                  },
                  () =>
                    text([
                      'Remove series',
                      'Supprimer la série',
                      'Eliminar serie',
                    ]),
                ),
              ],
            )
          }),
        ])
      }
    },
  }),
)

const ChartFilters = observer(
  defineComponent({
    name: 'ChartFilters',
    inheritAttrs: false,
    props: { value: Array as PropType<ChartFilter[]> },
    emits: ['change'],
    setup(props, { attrs, emit }) {
      const operation = useOperation()
      return () => {
        const fields = chartFilterFields(selectedNode(operation))
        const columns = chartColumns(currentSource(operation))
        const entries = Array.isArray(props.value) ? props.value : []
        const update = (index: number, patch: Partial<ChartFilter>) =>
          emit(
            'change',
            entries.map((entry, i) =>
              i === index ? { ...entry, ...patch } : entry,
            ),
          )
        return h('div', { class: 'grid w-full min-w-0 gap-2' }, [
          ...entries.map((entry, index) => {
            const value = typeof entry?.value === 'string' ? entry.value : ''
            const column = entry?.column ?? ''
            const choices =
              entry?.operation === 'dateRange'
                ? [...columns].sort(
                    (a, b) => Number(!!b.date) - Number(!!a.date),
                  )
                : columns
            return h(
              'div',
              { key: index, class: 'grid gap-1 rounded-md border p-2' },
              [
                h(
                  'select',
                  {
                    ...(index === 0 ? attrs : {}),
                    class: controlClass,
                    value,
                    'aria-label': text([
                      'Filter field',
                      'Champ de filtre',
                      'Campo de filtro',
                    ]),
                    onChange: (event: Event) => {
                      const value = fieldValue(event)
                      const field = fields.find(
                        ({ expression }) => expression === value,
                      )
                      update(index, {
                        value,
                        operation: field?.operation ?? 'matches',
                      })
                    },
                  },
                  [
                    h(
                      'option',
                      { value: '' },
                      text([
                        'Select a form field',
                        'Choisir un champ du formulaire',
                        'Elegir un campo del formulario',
                      ]),
                    ),
                    value &&
                    !fields.some(({ expression }) => expression === value)
                      ? h(
                          'option',
                          { value },
                          text([
                            'Field unavailable',
                            'Champ indisponible',
                            'Campo no disponible',
                          ]),
                        )
                      : null,
                    ...fields.map(({ expression, title }) =>
                      h(
                        'option',
                        { key: expression, value: expression },
                        title,
                      ),
                    ),
                  ],
                ),
                h(
                  'select',
                  {
                    class: controlClass,
                    value: column,
                    'aria-label': text([
                      'Filter column',
                      'Colonne à filtrer',
                      'Columna para filtrar',
                    ]),
                    onChange: (event: Event) =>
                      update(index, { column: fieldValue(event) }),
                  },
                  [
                    h(
                      'option',
                      { value: '' },
                      text([
                        'Select a column',
                        'Choisir une colonne',
                        'Elegir una columna',
                      ]),
                    ),
                    column && !columns.some(({ key }) => key === column)
                      ? h('option', { value: column }, column)
                      : null,
                    ...choices.map(({ key, title }) =>
                      h('option', { key, value: key }, title),
                    ),
                  ],
                ),
                h(
                  Button,
                  {
                    size: 'small',
                    variant: 'ghost',
                    onClick: () =>
                      emit(
                        'change',
                        entries.filter((_, i) => i !== index),
                      ),
                  },
                  () =>
                    text([
                      'Remove filter',
                      'Supprimer le filtre',
                      'Eliminar filtro',
                    ]),
                ),
              ],
            )
          }),
          h(
            Button,
            {
              ...(entries.length ? {} : attrs),
              size: 'small',
              variant: 'outline',
              disabled: !fields.length || !columns.length,
              onClick: () =>
                emit('change', [
                  ...entries,
                  { column: '', operation: 'matches' },
                ]),
            },
            () => text(['Add filter', 'Ajouter un filtre', 'Añadir filtro']),
          ),
        ])
      }
    },
  }),
)

export const ChartSettingsComponents = {
  ChartRows,
  ChartAxis,
  ChartSeriesInput,
  ChartFilters,
}
