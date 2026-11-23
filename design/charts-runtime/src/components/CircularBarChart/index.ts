import { createSpecialChart } from '../../shared/special-view'

export const CircularBarChart = createSpecialChart(
  'CircularBarChart',
  async () => {
    const { weightedChart } = await import('../../shared/weighted')
    return (options) => weightedChart({ ...options, type: 'circular-bar' })
  },
)
