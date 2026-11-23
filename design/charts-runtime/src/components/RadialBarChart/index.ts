import { createSpecialChart } from '../../shared/special-view'

export const RadialBarChart = createSpecialChart('RadialBarChart', async () => {
  const { weightedChart } = await import('../../shared/weighted')
  return (options) => weightedChart({ ...options, type: 'radial-bar' })
})
