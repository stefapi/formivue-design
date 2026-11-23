import VisLine from '@unovis/vue/components/line'
import VisScatter from '@unovis/vue/components/scatter'
import { h } from 'vue'
import { createCategoricalChart } from '../../shared/categorical'

export const LineChart = createCategoricalChart(
  'LineChart',
  ({ x, y, colors }, { curve, lineWidth, showPoints, pointSize }) => [
    h(VisLine, {
      x,
      y,
      color: (_, index) => colors[index],
      curveType: curve ?? 'monotoneX',
      lineWidth: lineWidth ?? 2,
    }),
    ...(showPoints
      ? [h(VisScatter, { x, y, color: colors, size: pointSize ?? 5 })]
      : []),
  ],
)
