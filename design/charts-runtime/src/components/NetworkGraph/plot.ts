import VisGraph, { VisGraphSelectors } from '@unovis/vue/components/graph'
import VisTooltip from '@unovis/vue/components/tooltip'
import { h } from 'vue'
import { linksChart } from '../../shared/links'
import type { ChartOptions } from '../../shared/base'

export function plot(options: ChartOptions) {
  return linksChart(
    options,
    { countRows: true },
    ({ nodeLabel, nodeColor, linkTip }) => [
      h(VisGraph, {
        layoutType: options.graphLayout ?? 'circular',
        nodeLabel: options.showNodeLabels ? nodeLabel : undefined,
        nodeSize: options.nodeSize ?? 30,
        nodeFill: nodeColor,
        linkArrow: options.showArrows,
        linkWidth: options.linkWidth ?? 1,
        disableDrag: true,
        disableZoom: true,
      }),
      h(VisTooltip, { triggers: { [VisGraphSelectors.link]: linkTip } }),
    ],
  )
}
