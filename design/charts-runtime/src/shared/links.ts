import type { VNode } from 'vue'
import { categoryOrder, hasFlowCycle, pairs } from './special-data'
import { tip, single, type ChartView } from './special-view'
import type { ChartOptions } from './base'

export interface LinkDatum {
  source: { id: string }
  target: { id: string }
  value: number
}

interface LinkPlot {
  linkValue: (link: { value: number }) => number
  nodeLabel: (node: { id: string }) => string
  nodeColor: (node: { color: string }) => string
  linkTip: (link: LinkDatum) => HTMLElement
}

export function linksChart(
  options: ChartOptions,
  { acyclic, countRows }: { acyclic?: boolean; countRows?: boolean },
  render: (plot: LinkPlot) => VNode[],
): ChartView {
  const { sourceKey, targetKey, valueKey, height, valueLabel, color } = options
  const links = pairs(
    valueKey ? options : { ...options, aggregation: 'sum' },
    sourceKey,
    targetKey,
    countRows && !valueKey ? 1 : undefined,
  )
    .filter(({ value }) => value > 0)
    .map(({ id, first, second, value }) => ({
      id,
      source: first,
      target: second,
      value,
    }))
  const nodeIds = new Set(
    links.flatMap(({ source, target }) => [source, target]),
  )
  const nodes = categoryOrder(nodeIds, options.categoryOrder).map(
    (id, index) => ({ id, color: color(index) }),
  )
  const data = { nodes, links }
  const cyclic = acyclic && hasFlowCycle(links)
  const linkValue = (link: { value: number }) => link.value
  const nodeLabel = (node: { id: string }) => node.id
  const nodeColor = (node: { color: string }) => node.color
  const linkTip = (link: LinkDatum) =>
    tip(`${link.source.id} → ${link.target.id}`, valueLabel(link.value))
  return {
    headers: [sourceKey, targetKey, valueKey || 'Count'],
    records: links.map(({ source, target, value }) => [
      source,
      target,
      valueLabel(value),
    ]),
    message: cyclic
      ? 'The Sankey diagram requires flows without cycles.'
      : undefined,
    plot:
      !cyclic && links.length
        ? single(height, data, () =>
            render({ linkValue, nodeLabel, nodeColor, linkTip }),
          )
        : undefined,
  }
}
