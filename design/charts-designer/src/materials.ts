import * as components from './components'

export const ChartDesignerComponents = components
export const ChartSources = {
  CartesianCharts: [
    components.BarChart,
    components.StackedBarChart,
    components.LineChart,
    components.AreaChart,
    components.ScatterChart,
    components.BoxplotChart,
    components.TimelineChart,
    components.HeatmapChart,
  ],
  ProportionCharts: [
    components.PieChart,
    components.DonutChart,
    components.NestedDonutChart,
    components.TreemapChart,
    components.RadialBarChart,
    components.CircularBarChart,
  ],
  FlowCharts: [
    components.SankeyChart,
    components.NetworkGraph,
    components.ChordChart,
  ],
  GeographicCharts: [
    components.PointMap,
    components.ChoroplethMap,
    components.FlowMap,
  ],
}
