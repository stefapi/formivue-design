import VisStackedBar from '@unovis/vue/components/stacked-bar'
import { h } from 'vue'
import { createCategoricalChart } from '../../shared/categorical'

export const StackedBarChart = createCategoricalChart(
  'StackedBarChart',
  ({ x, y, colors }, { barMaxWidth, barGap, barRadius }) =>
    h(VisStackedBar, {
      x,
      y,
      color: colors,
      dataStep: 1,
      barMaxWidth: barMaxWidth ?? 100,
      barPadding: (barGap ?? 20) / 100,
      roundedCorners: barRadius ?? 2,
      barMinHeight: 0,
    }),
  true,
)
