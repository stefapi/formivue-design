import VisArea from '@unovis/vue/components/area'
import { h } from 'vue'
import { createCategoricalChart } from '../../shared/categorical'

export const AreaChart = createCategoricalChart(
  'AreaChart',
  ({ x, y, colors }, { curve, fillOpacity, showOutline, lineWidth }) =>
    y.map((accessor, index) =>
      h(VisArea, {
        key: index,
        x,
        y: accessor,
        color: colors[index],
        opacity: (fillOpacity ?? 20) / 100,
        curveType: curve ?? 'monotoneX',
        line: showOutline,
        lineWidth: lineWidth ?? 2,
      }),
    ),
)
