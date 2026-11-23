import VisTooltip from '@unovis/vue/components/tooltip'
import VisMap, {
  VisTopoJSONMapSelectors,
} from '@unovis/vue/components/topojson-map'
import { WorldMapSimplestTopoJSON } from '@unovis/ts/maps'
import { h } from 'vue'
import { categoryOrder, pairs } from './special-data'
import { label, latitude, longitude, num, read } from './row-data'
import { countryCode } from './country'
import { tip, single, type ChartView } from './special-view'
import { colorRange } from './appearance'
import type { ChartOptions } from './base'

export function mapChart(
  options: ChartOptions & { type: 'map' | 'choropleth' | 'flow-map' },
): ChartView {
  const {
    type,
    xKey,
    latitudeKey,
    longitudeKey,
    destinationLatitudeKey,
    destinationLongitudeKey,
    height,
    valueKey,
    valueLabel,
    color,
  } = options
  const base = { topojson: WorldMapSimplestTopoJSON, disableZoom: true }
  if (type === 'choropleth') {
    const areas = pairs(options, xKey, '', undefined, countryCode)
    const codes = categoryOrder(
      new Set(areas.map(({ first }) => first)),
      options.categoryOrder,
    )
    const values = new Map(areas.map(({ first, value }) => [first, value]))
    const min = Math.min(...values.values())
    const max = Math.max(...values.values())
    type Area = (typeof areas)[number]
    const range = colorRange(options.colorScale)
    const areaColor = ({ value }: Area) => {
      const fraction = max === min ? 1 : (value - min) / (max - min)
      const intensity = options.reverseColorScale ? 1 - fraction : fraction
      const [light, , dark] = range ?? [
        'var(--background, white)',
        '',
        color(0),
      ]
      const percentage = Math.round(
        range ? 100 * intensity : 20 + 80 * intensity,
      )
      return `color-mix(in oklab, ${dark} ${percentage}%, ${light})`
    }
    return {
      headers: [xKey, valueKey],
      records: codes.map((code) => [code, valueLabel(values.get(code))]),
      plot: areas.length
        ? single(height, { areas }, () => [
            h(VisMap, {
              ...base,
              areaId: (area: Area) => area.first,
              areaColor,
            }),
            h(VisTooltip, {
              triggers: {
                [VisTopoJSONMapSelectors.feature]: ({
                  data,
                  properties,
                }: {
                  data?: Area
                  properties?: { name?: string }
                }) =>
                  data
                    ? tip(
                        properties?.name ?? data.first,
                        valueLabel(data.value),
                      )
                    : null,
              },
            }),
          ])
        : undefined,
    }
  }

  const coordinates = (
    row: ChartOptions['rows'][number],
    latKey: string,
    longKey: string,
  ) => {
    const lat = latitude(read(row, latKey))
    const lon = longitude(read(row, longKey))
    return lat !== undefined && lon !== undefined
      ? { latitude: lat, longitude: lon }
      : undefined
  }
  const flows = type === 'flow-map'
  const entries = options.rows.flatMap((row, index) => {
    const origin = coordinates(row, latitudeKey, longitudeKey)
    if (!origin) return []
    const destination = flows
      ? coordinates(row, destinationLatitudeKey, destinationLongitudeKey)
      : undefined
    if (flows && !destination) return []
    const id = String(index)
    const value = num(read(row, valueKey))
    return [
      {
        source: {
          id,
          title: label(read(row, xKey)) ?? String(index + 1),
          ...origin,
          value,
        },
        target: destination
          ? { id: `${id}-to`, title: '', ...destination, value: undefined }
          : undefined,
      },
    ]
  })
  type Point = (typeof entries)[number]['source']
  const points = entries.flatMap(({ source, target }) =>
    target ? [source, target] : [source],
  )
  // A fit extent with several identical coordinates has zero width and height.
  const mapFitToPoints =
    options.fitToData &&
    (points.length === 1 ||
      points.some(
        (point) =>
          point.latitude !== points[0].latitude ||
          point.longitude !== points[0].longitude,
      ))
  const links = flows
    ? entries.map(({ source, target }) => ({
        source: source.id,
        target: target.id,
      }))
    : []
  const pointTip = (datum: { properties: Point }) =>
    tip(
      datum.properties.title,
      ...(valueKey ? [valueLabel(datum.properties.value)] : []),
    )
  return {
    headers: [
      xKey || 'Point',
      latitudeKey,
      longitudeKey,
      ...(flows ? [destinationLatitudeKey, destinationLongitudeKey] : []),
      ...(valueKey ? [valueKey] : []),
    ],
    records: entries.map(({ source, target }) => [
      source.title,
      String(source.latitude),
      String(source.longitude),
      ...(target ? [String(target.latitude), String(target.longitude)] : []),
      ...(valueKey ? [valueLabel(source.value)] : []),
    ]),
    plot: points.length
      ? single(
          height,
          { points, links },
          () => [
            h(VisMap, {
              ...base,
              latitude: (point: Point) => point.latitude,
              longitude: (point: Point) => point.longitude,
              pointId: (point: Point) => point.id,
              mapFitToPoints,
              pointRadius: options.markerSize ?? 8,
              pointLabel: options.showPointLabels
                ? (point: Point) => point.title
                : undefined,
              pointColor: color(0),
              pointBottomLabel:
                valueKey && !flows && options.showPointLabels
                  ? (point: Point) => valueLabel(point.value)
                  : undefined,
              linkColor: color(0),
              linkWidth: options.linkWidth ?? 2,
              linkId: (link: { source: Point }) => link.source.id,
            }),
            h(VisTooltip, {
              triggers: flows
                ? {
                    [VisTopoJSONMapSelectors.link]: (link: { source: Point }) =>
                      tip(
                        link.source.title,
                        ...(valueKey ? [valueLabel(link.source.value)] : []),
                      ),
                  }
                : { [VisTopoJSONMapSelectors.point]: pointTip },
            }),
          ],
          mapFitToPoints ? 'points' : 'world',
        )
      : undefined,
  }
}
