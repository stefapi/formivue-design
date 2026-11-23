import { createSpecialChart } from '../../shared/special-view'

export const ChordChart = createSpecialChart(
  'ChordChart',
  async () => (await import('./plot')).plot,
)
