import { createSpecialChart } from '../../shared/special-view'

export const SankeyChart = createSpecialChart(
  'SankeyChart',
  async () => (await import('./plot')).plot,
)
