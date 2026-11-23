import type { SankeyNodeAlign } from '@unovis/ts/components/sankey/types'
import type { PropType } from 'vue'

export const appearanceProps = {
  barGap: Number,
  groupGap: Number,
  barRadius: Number,
  barMaxWidth: Number,
  lineWidth: Number,
  curve: String,
  showPoints: { type: Boolean, default: true },
  pointSize: Number,
  fillOpacity: Number,
  showOutline: { type: Boolean, default: true },
  sliceGap: Number,
  sliceRadius: Number,
  ringWidth: Number,
  centerLabel: String,
  pointShape: String,
  boxWidth: Number,
  rowHeight: Number,
  showRowLabels: { type: Boolean, default: true },
  roundIntervals: Boolean,
  nodeWidth: Number,
  nodePadding: Number,
  nodeAlign: String as PropType<SankeyNodeAlign>,
  graphLayout: String,
  nodeSize: Number,
  showNodeLabels: { type: Boolean, default: true },
  showArrows: { type: Boolean, default: true },
  linkWidth: Number,
  cellGap: Number,
  cellRadius: Number,
  showGridLabels: { type: Boolean, default: true },
  colorScale: String,
  tileGap: Number,
  tileRadius: Number,
  showGroupLabels: Boolean,
  layerGap: Number,
  showSegmentLabels: { type: Boolean, default: true },
  trackWidth: Number,
  trackGap: Number,
  scaleMax: Number,
  petalGap: Number,
  innerRadius: Number,
  showTracks: { type: Boolean, default: true },
  markerSize: Number,
  showPointLabels: { type: Boolean, default: true },
  fitToData: Boolean,
  reverseColorScale: Boolean,
}

type AppearanceKey = keyof typeof appearanceProps

export const chartAppearance = {
  BarChart: ['groupGap', 'barGap', 'barRadius'],
  StackedBarChart: ['barMaxWidth', 'barGap', 'barRadius'],
  LineChart: ['curve', 'lineWidth', 'showPoints', 'pointSize'],
  AreaChart: ['curve', 'fillOpacity', 'showOutline', 'lineWidth'],
  PieChart: ['sliceGap', 'sliceRadius'],
  DonutChart: ['ringWidth', 'sliceGap', 'sliceRadius', 'centerLabel'],
  ScatterChart: ['pointShape', 'pointSize'],
  BoxplotChart: ['boxWidth', 'barRadius'],
  TimelineChart: ['rowHeight', 'lineWidth', 'roundIntervals', 'showRowLabels'],
  SankeyChart: ['nodeAlign', 'nodeWidth', 'nodePadding'],
  NetworkGraph: [
    'graphLayout',
    'nodeSize',
    'linkWidth',
    'showNodeLabels',
    'showArrows',
  ],
  ChordChart: ['nodeWidth', 'sliceGap', 'showNodeLabels'],
  HeatmapChart: ['colorScale', 'cellGap', 'cellRadius', 'showGridLabels'],
  TreemapChart: ['tileGap', 'tileRadius', 'showGroupLabels'],
  NestedDonutChart: ['layerGap', 'showSegmentLabels', 'centerLabel'],
  RadialBarChart: [
    'scaleMax',
    'trackWidth',
    'trackGap',
    'showTracks',
    'centerLabel',
  ],
  CircularBarChart: [
    'scaleMax',
    'petalGap',
    'innerRadius',
    'sliceRadius',
    'showTracks',
  ],
  PointMap: ['markerSize', 'showPointLabels', 'fitToData'],
  ChoroplethMap: ['colorScale', 'reverseColorScale'],
  FlowMap: ['linkWidth', 'markerSize', 'showPointLabels', 'fitToData'],
} satisfies Record<string, AppearanceKey[]>

export type ChartName = keyof typeof chartAppearance

const scales = new Map<string, [string, string, string]>([
  ['blue', ['#dbeafe', '#60a5fa', '#1e3a8a']],
  ['green', ['#dcfce7', '#4ade80', '#14532d']],
  ['orange', ['#ffedd5', '#fb923c', '#7c2d12']],
])

export const colorRange = (scale?: string) => scales.get(scale ?? '')

export const radians = (degrees = 0) => (degrees * Math.PI) / 180
