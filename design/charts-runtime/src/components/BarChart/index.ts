import VisGroupedBar from '@unovis/vue/components/grouped-bar'
import { h } from 'vue'
import { createCategoricalChart } from '../../shared/categorical'

export const BarChart = createCategoricalChart(
  'BarChart',
  ({ x, y, colors }, { groupGap, barGap, barRadius }) =>
    h(VisGroupedBar, {
      x,
      y,
      color: colors,
      dataStep: 1,
      groupMaxWidth: 100,
      groupPadding: (groupGap ?? 20) / 100,
      barPadding: (barGap ?? 10) / 100,
      roundedCorners: barRadius ?? 2,
      barMinHeight: 0,
    }),
)
