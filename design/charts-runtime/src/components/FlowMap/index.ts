import { createSpecialChart } from '../../shared/special-view'

export const FlowMap = createSpecialChart('FlowMap', async () => {
  const { mapChart } = await import('../../shared/geography')
  return (options) => mapChart({ ...options, type: 'flow-map' })
})
