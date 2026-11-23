import type { InjectionKey, Ref } from 'vue'
import type { ChartName } from './appearance'

export const ChartLocaleKey: InjectionKey<Readonly<Ref<string>>> =
  Symbol('chart locale')

export const chartTitles = {
  AreaChart: ['Area', 'Aires', 'Áreas'],
  BarChart: ['Bar', 'Barres', 'Barras'],
  BoxplotChart: ['Box plot', 'Boîte à moustaches', 'Diagrama de caja'],
  ChordChart: ['Chord diagram', 'Diagramme en cordes', 'Diagrama de cuerdas'],
  ChoroplethMap: ['Choropleth', 'Carte choroplèthe', 'Mapa coroplético'],
  CircularBarChart: [
    'Circular bars',
    'Barres circulaires',
    'Barras circulares',
  ],
  DonutChart: ['Donut', 'Anneau', 'Anillo'],
  FlowMap: ['Flow map', 'Carte de flux', 'Mapa de flujos'],
  HeatmapChart: ['Heatmap', 'Carte de chaleur', 'Mapa de calor'],
  LineChart: ['Line', 'Courbes', 'Líneas'],
  NestedDonutChart: ['Nested donut', 'Anneaux imbriqués', 'Anillos anidados'],
  NetworkGraph: ['Network graph', 'Graphe de réseau', 'Grafo de red'],
  PieChart: ['Pie', 'Secteurs', 'Circular'],
  PointMap: ['Point map', 'Carte de points', 'Mapa de puntos'],
  RadialBarChart: ['Radial bars', 'Barres radiales', 'Barras radiales'],
  SankeyChart: ['Sankey', 'Sankey', 'Sankey'],
  ScatterChart: ['Scatter plot', 'Nuage de points', 'Dispersión'],
  StackedBarChart: ['Stacked bars', 'Barres empilées', 'Barras apiladas'],
  TimelineChart: ['Timeline', 'Frise chronologique', 'Cronología'],
  TreemapChart: ['Treemap', 'Treemap', 'Mapa de árbol'],
} as const satisfies Record<ChartName, readonly [string, string, string]>

export const chartLabels = {
  dataLabel: ['Chart data', 'Données du graphique', 'Datos del gráfico'],
  emptyText: [
    'No chart data',
    'Aucune donnée à afficher',
    'No hay datos para mostrar',
  ],
} as const

export const chartLanguageIndex = (locale?: string) => {
  const language = locale?.toLowerCase().split('-')[0]
  return language === 'fr' ? 1 : language === 'es' ? 2 : 0
}
