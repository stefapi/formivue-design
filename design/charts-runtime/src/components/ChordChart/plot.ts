import VisChord, {
  VisChordDiagramSelectors,
} from '@unovis/vue/components/chord-diagram'
import VisTooltip from '@unovis/vue/components/tooltip'
import { h } from 'vue'
import { linksChart } from '../../shared/links'
import { radians } from '../../shared/appearance'
import type { ChartOptions } from '../../shared/base'

export function plot(options: ChartOptions) {
  return linksChart(
    options,
    {},
    ({ linkValue, nodeLabel, nodeColor, linkTip }) => [
      h(VisChord, {
        linkValue,
        nodeLabel: options.showNodeLabels ? nodeLabel : undefined,
        nodeColor,
        nodeWidth: options.nodeWidth ?? 15,
        padAngle: options.sliceGap == null ? 0.02 : radians(options.sliceGap),
      }),
      h(VisTooltip, {
        triggers: {
          [VisChordDiagramSelectors.link]: (ribbon: {
            data: Parameters<typeof linkTip>[0]
          }) => linkTip(ribbon.data),
        },
      }),
    ],
  )
}
