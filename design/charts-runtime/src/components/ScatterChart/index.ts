import { createSpecialChart } from '../../shared/special-view'

export const ScatterChart = createSpecialChart(
  'ScatterChart',
  async () => (await import('./plot')).plot,
)
