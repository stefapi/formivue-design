import {
  computed,
  defineComponent,
  inject,
  type ExtractPropTypes,
  type PropType,
  type VNode,
} from 'vue'
import { appearanceProps, chartAppearance, type ChartName } from './appearance'
import type { ChartSeries } from './categorical-data'
import type { DatePeriod } from './date-period'
import { filterChartRows, type ChartFilter } from './filters'
import {
  ChartLocaleKey,
  chartLabels,
  chartLanguageIndex,
  chartTitles,
} from './locale'

const palette = ['#2563eb', '#0d9488', '#d97706', '#9333ea', '#db2777']
const chartColor = (index: number) => {
  const slot = index % palette.length
  return `var(--chart-${slot + 1}, ${palette[slot]})`
}
const numberStyles = {
  decimal: { style: 'decimal' },
  euro: { style: 'currency', currency: 'EUR' },
  percent: { style: 'percent' },
} satisfies Record<string, Intl.NumberFormatOptions>

const chartProps = {
  rows: {
    type: Array as PropType<Record<string, unknown>[]>,
    default: () => [],
  },
  filters: { type: Array as PropType<ChartFilter[]>, default: () => [] },
  xKey: { type: String, default: '' },
  series: { type: Array as PropType<ChartSeries[]>, default: () => [] },
  groupKey: { type: String, default: '' },
  valueKey: { type: String, default: '' },
  sourceKey: { type: String, default: '' },
  targetKey: { type: String, default: '' },
  startKey: { type: String, default: '' },
  endKey: { type: String, default: '' },
  latitudeKey: { type: String, default: '' },
  longitudeKey: { type: String, default: '' },
  destinationLatitudeKey: { type: String, default: '' },
  destinationLongitudeKey: { type: String, default: '' },
  aggregation: { type: String as PropType<'sum' | 'mean'>, default: 'sum' },
  categoryOrder: {
    type: String as PropType<'source' | 'ascending' | 'descending'>,
    default: 'source',
  },
  valueFormat: {
    type: String as PropType<'auto' | keyof typeof numberStyles>,
    default: 'auto',
  },
  decimalPlaces: { type: Number, default: 2 },
  height: { type: Number, default: 240 },
  label: String,
  dataLabel: String,
  emptyText: String,
  locale: String,
}

export const categoricalProps = {
  datePeriod: { type: String as PropType<DatePeriod>, default: 'none' },
  countRows: Boolean,
}

export type ChartOptions = ExtractPropTypes<typeof chartProps> &
  Partial<
    ExtractPropTypes<typeof appearanceProps & typeof categoricalProps>
  > & {
    valueLabel: (value?: number) => string
    formatAxis: boolean
    color: (index: number) => string
  }

export function createChart(
  name: ChartName,
  render: (options: ChartOptions) => VNode,
  categoryProps: Partial<typeof categoricalProps> = {},
) {
  return defineComponent({
    name,
    props: {
      ...chartProps,
      ...categoryProps,
      ...(Object.fromEntries(
        chartAppearance[name].map((key) => [key, appearanceProps[key]]),
      ) as Partial<typeof appearanceProps>),
    },
    setup(props) {
      const inheritedLocale = inject(ChartLocaleKey, undefined)
      const locale = computed(() => {
        const preferred =
          props.locale ??
          inheritedLocale?.value ??
          globalThis.navigator?.language
        try {
          return Intl.getCanonicalLocales(preferred)[0]
        } catch {
          return undefined
        }
      })
      const numberFormatter = computed(() => {
        if (props.countRows) return
        const mode = props.valueFormat
        if (mode !== 'decimal' && mode !== 'euro' && mode !== 'percent') return
        const digits = Number.isFinite(props.decimalPlaces)
          ? Math.min(20, Math.max(0, Math.trunc(props.decimalPlaces)))
          : 2
        const options = {
          ...numberStyles[mode],
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }
        return new Intl.NumberFormat(locale.value, options)
      })
      return () => {
        const format = numberFormatter.value
        const valueLabel = (value: number | undefined) =>
          value === undefined
            ? '–'
            : (format?.format(value) ?? value.toString())
        const height = Math.max(80, Number(props.height) || 240)
        const language = chartLanguageIndex(locale.value)
        return render({
          ...props,
          locale: locale.value,
          rows: filterChartRows(
            Array.isArray(props.rows) ? props.rows : [],
            props.filters,
          ),
          height,
          label: props.label || chartTitles[name][language],
          dataLabel: props.dataLabel || chartLabels.dataLabel[language],
          emptyText: props.emptyText || chartLabels.emptyText[language],
          valueLabel,
          formatAxis: !!format,
          color: chartColor,
        })
      }
    },
  })
}
