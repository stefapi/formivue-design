import { createSpecialChart } from '../../shared/special-view'

export const NetworkGraph = createSpecialChart(
  'NetworkGraph',
  async () => (await import('./plot')).plot,
)
