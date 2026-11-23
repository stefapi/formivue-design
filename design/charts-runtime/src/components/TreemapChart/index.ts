import { createSpecialChart } from '../../shared/special-view'

export const TreemapChart = createSpecialChart('TreemapChart', async () => {
  const { weightedChart } = await import('../../shared/weighted')
  return (options) => weightedChart({ ...options, type: 'treemap' })
})
