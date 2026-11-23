import { createSpecialChart } from '../../shared/special-view'

export const BoxplotChart = createSpecialChart(
  'BoxplotChart',
  async () => (await import('./plot')).plot,
)
