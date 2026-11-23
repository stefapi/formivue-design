import { createSpecialChart } from '../../shared/special-view'

export const NestedDonutChart = createSpecialChart(
  'NestedDonutChart',
  async () => {
    const { weightedChart } = await import('../../shared/weighted')
    return (options) => weightedChart({ ...options, type: 'nested-donut' })
  },
)
