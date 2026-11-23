import VisSankey, { VisSankeySelectors } from '@unovis/vue/components/sankey'
import VisTooltip from '@unovis/vue/components/tooltip'
import { h } from 'vue'
import { linksChart } from '../../shared/links'
import { SankeyNodeAlign } from '@unovis/ts/components/sankey/types'
import type { ChartOptions } from '../../shared/base'

export function plot(options: ChartOptions) {
  const alignment = options.nodeAlign
  const nodeAlign = Object.values(SankeyNodeAlign).includes(alignment)
    ? alignment
    : SankeyNodeAlign.Justify
  return linksChart(
    options,
    { acyclic: true },
    ({ linkValue, nodeLabel, nodeColor, linkTip }) => [
      h(VisSankey, {
        linkValue,
        label: nodeLabel,
        nodeColor,
        nodeAlign,
        nodeWidth: options.nodeWidth ?? 25,
        nodePadding: options.nodePadding ?? 2,
        enableZoom: false,
      }),
      h(VisTooltip, { triggers: { [VisSankeySelectors.link]: linkTip } }),
    ],
  )
}
