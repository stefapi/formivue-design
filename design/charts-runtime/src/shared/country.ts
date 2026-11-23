import { WorldMapSimplestTopoJSON } from '@unovis/ts/maps'
import { label } from './row-data'

const countryCodes = new Set(
  WorldMapSimplestTopoJSON.objects.countries.geometries.map(({ id }) =>
    String(id),
  ),
)

export const countryCode = (value: unknown) => {
  const code = label(value)?.trim().toUpperCase()
  return countryCodes.has(code) ? code : undefined
}
