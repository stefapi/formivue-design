import { createSpecialChart } from '../../shared/special-view'

export const PointMap = createSpecialChart('PointMap', async () => {
  const { mapChart } = await import('../../shared/geography')
  return (options) => mapChart({ ...options, type: 'map' })
})
