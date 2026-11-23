import { createSpecialChart } from '../../shared/special-view'

export const TimelineChart = createSpecialChart(
  'TimelineChart',
  async () => (await import('./plot')).plot,
)
