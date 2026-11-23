import { createSpecialChart } from '../../shared/special-view'

export const HeatmapChart = createSpecialChart('HeatmapChart', async () => {
  const { matrixChart } = await import('../../shared/matrix')
  return matrixChart
})
