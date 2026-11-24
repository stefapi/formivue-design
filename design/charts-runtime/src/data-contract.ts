import { countryCode } from './shared/country'
import {
  validateChartRows as validateRows,
  type MappingOptions,
} from './shared/mapping'
import type { ChartName } from './shared/appearance'

export { chartDataColumns, chartColumnProperties } from './shared/mapping'
export { chartAppearance } from './shared/appearance'
export { default as chartDataContracts } from './chart-data-contracts.json'
export { periodStart } from './shared/date-period'

export function validateChartRows(
  name: ChartName,
  props: MappingOptions,
  rows: Record<string, unknown>[],
) {
  return validateRows(name, props, rows, countryCode)
}
