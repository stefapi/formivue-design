import { createSpecialChart } from '../../shared/special-view'

export const ChoroplethMap = createSpecialChart('ChoroplethMap', async () => {
  const { mapChart } = await import('../../shared/geography')
  return (options) => mapChart({ ...options, type: 'choropleth' })
})
