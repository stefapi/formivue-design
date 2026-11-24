import {
  chartLabels,
  chartTitles,
  type ChartName,
} from '@formivue-design/charts-runtime'
import { materialLocales, type LocaleText } from './shared'

type SettingLabels = Parameters<typeof materialLocales>[1]

const choice = (
  title: LocaleText,
  ...labels: LocaleText[]
): SettingLabels[string] => {
  const message = (index: 0 | 1 | 2) => ({
    title: title[index],
    dataSource: labels.map((label) => label[index]),
  })
  return [message(0), message(1), message(2)]
}

const settings: SettingLabels = {
  rows: ['Data source', 'Source des données', 'Fuente de datos'],
  xKey: ['Category column', 'Colonne de catégories', 'Columna de categorías'],
  sourceKey: ['Source column', 'Colonne de départ', 'Columna de origen'],
  targetKey: [
    'Destination column',
    'Colonne de destination',
    'Columna de destino',
  ],
  startKey: [
    'Start date column',
    'Colonne de date de début',
    'Columna de fecha de inicio',
  ],
  endKey: [
    'End date column',
    'Colonne de date de fin',
    'Columna de fecha de fin',
  ],
  latitudeKey: ['Latitude column', 'Colonne de latitude', 'Columna de latitud'],
  longitudeKey: [
    'Longitude column',
    'Colonne de longitude',
    'Columna de longitud',
  ],
  destinationLatitudeKey: [
    'Destination latitude',
    'Latitude de destination',
    'Latitud de destino',
  ],
  destinationLongitudeKey: [
    'Destination longitude',
    'Longitude de destination',
    'Longitud de destino',
  ],
  datePeriod: choice(
    ['Group dates by', 'Regrouper les dates par', 'Agrupar fechas por'],
    ['No period', 'Aucun regroupement', 'Sin agrupar'],
    ['Day', 'Jour', 'Día'],
    ['Week (Monday)', 'Semaine (lundi)', 'Semana (lunes)'],
    ['Month', 'Mois', 'Mes'],
  ),
  countRows: ['Count rows', 'Compter les lignes', 'Contar filas'],
  categoryOrder: [
    {
      title: 'Category order',
      dataSource: ['Source order', 'Ascending', 'Descending'],
    },
    {
      title: 'Ordre des catégories',
      dataSource: ['Ordre de la source', 'Croissant', 'Décroissant'],
    },
    {
      title: 'Orden de categorías',
      dataSource: ['Orden de origen', 'Ascendente', 'Descendente'],
    },
  ],
  groupKey: [
    'Group column',
    'Colonne de regroupement',
    'Columna de agrupación',
  ],
  valueKey: ['Value column', 'Colonne de valeurs', 'Columna de valores'],
  aggregation: [
    { title: 'Aggregation', dataSource: ['Sum', 'Mean'] },
    { title: 'Agrégation', dataSource: ['Somme', 'Moyenne'] },
    { title: 'Agregación', dataSource: ['Suma', 'Media'] },
  ],
  series: ['Series', 'Séries', 'Series'],
  valueFormat: [
    {
      title: 'Value format',
      dataSource: ['Automatic', 'Euros', 'Percentage', 'Decimal'],
    },
    {
      title: 'Format des valeurs',
      dataSource: ['Automatique', 'Euros', 'Pourcentage', 'Décimal'],
    },
    {
      title: 'Formato de valores',
      dataSource: ['Automático', 'Euros', 'Porcentaje', 'Decimal'],
    },
  ],
  decimalPlaces: [
    'Decimal places',
    'Nombre de décimales',
    'Número de decimales',
  ],

  groupGap: [
    'Gap between groups (%)',
    'Espacement des groupes (%)',
    'Separación entre grupos (%)',
  ],
  barGap: [
    'Gap between bars (%)',
    'Espacement des barres (%)',
    'Separación entre barras (%)',
  ],
  barRadius: [
    'Corner radius (px)',
    'Rayon des coins (px)',
    'Radio de las esquinas (px)',
  ],
  barMaxWidth: [
    'Maximum bar width (px)',
    'Largeur maximale des barres (px)',
    'Ancho máximo de las barras (px)',
  ],
  lineWidth: [
    'Line width (px)',
    'Épaisseur du trait (px)',
    'Grosor de la línea (px)',
  ],
  curve: choice(
    [
      'Line interpolation',
      'Interpolation du tracé',
      'Interpolación de la línea',
    ],
    ['Smooth', 'Lissée', 'Suave'],
    ['Linear', 'Linéaire', 'Lineal'],
    ['Stepped', 'En escalier', 'Escalonada'],
  ),
  showPoints: ['Show points', 'Afficher les points', 'Mostrar puntos'],
  pointSize: [
    'Point size (px)',
    'Taille des points (px)',
    'Tamaño de los puntos (px)',
  ],
  fillOpacity: [
    'Fill opacity (%)',
    'Opacité du remplissage (%)',
    'Opacidad del relleno (%)',
  ],
  showOutline: [
    'Show top line',
    'Afficher le contour supérieur',
    'Mostrar el contorno superior',
  ],
  sliceGap: [
    'Gap between segments (°)',
    'Espacement des segments (°)',
    'Separación entre segmentos (°)',
  ],
  sliceRadius: [
    'Segment corner radius (px)',
    'Rayon des coins des segments (px)',
    'Radio de las esquinas de los segmentos (px)',
  ],
  ringWidth: [
    'Ring width (px)',
    'Épaisseur de l’anneau (px)',
    'Grosor del anillo (px)',
  ],
  centerLabel: ['Center text', 'Texte au centre', 'Texto central'],
  pointShape: choice(
    ['Point shape', 'Forme des points', 'Forma de los puntos'],
    ['Circle', 'Cercle', 'Círculo'],
    ['Square', 'Carré', 'Cuadrado'],
    ['Diamond', 'Losange', 'Rombo'],
    ['Triangle', 'Triangle', 'Triángulo'],
    ['Cross', 'Croix', 'Cruz'],
    ['Star', 'Étoile', 'Estrella'],
  ),
  boxWidth: [
    'Maximum box width (px)',
    'Largeur maximale des boîtes (px)',
    'Ancho máximo de las cajas (px)',
  ],
  rowHeight: [
    'Lane height (px)',
    'Hauteur des bandes (px)',
    'Altura de las filas (px)',
  ],
  showRowLabels: [
    'Show lane labels',
    'Afficher les libellés des bandes',
    'Mostrar las etiquetas de las filas',
  ],
  roundIntervals: [
    'Round interval ends',
    'Arrondir les extrémités des intervalles',
    'Redondear extremos de los intervalos',
  ],
  nodeWidth: [
    'Node width (px)',
    'Largeur des nœuds (px)',
    'Ancho de los nodos (px)',
  ],
  nodePadding: [
    'Gap between nodes (px)',
    'Espacement des nœuds (px)',
    'Separación entre nodos (px)',
  ],
  nodeAlign: choice(
    ['Node alignment', 'Alignement des nœuds', 'Alineación de los nodos'],
    ['Justified', 'Justifié', 'Justificado'],
    ['Left', 'À gauche', 'A la izquierda'],
    ['Center', 'Centré', 'Centrado'],
    ['Right', 'À droite', 'A la derecha'],
  ),
  graphLayout: choice(
    ['Node layout', 'Disposition des nœuds', 'Disposición de los nodos'],
    ['Circular', 'Circulaire', 'Circular'],
    ['Concentric', 'Concentrique', 'Concéntrica'],
    ['Force-directed', 'Par forces', 'Por fuerzas'],
  ),
  nodeSize: [
    'Node size (px)',
    'Taille des nœuds (px)',
    'Tamaño de los nodos (px)',
  ],
  showNodeLabels: [
    'Show node labels',
    'Afficher les libellés des nœuds',
    'Mostrar las etiquetas de los nodos',
  ],
  showArrows: ['Show arrows', 'Afficher les flèches', 'Mostrar flechas'],
  linkWidth: [
    'Link width (px)',
    'Épaisseur des liens (px)',
    'Grosor de los enlaces (px)',
  ],
  cellGap: [
    'Cell gap (px)',
    'Espacement des cellules (px)',
    'Separación entre celdas (px)',
  ],
  cellRadius: [
    'Cell corner radius (px)',
    'Rayon des coins des cellules (px)',
    'Radio de las esquinas de las celdas (px)',
  ],
  showGridLabels: [
    'Show row and column labels',
    'Afficher les libellés des lignes et colonnes',
    'Mostrar etiquetas de filas y columnas',
  ],
  colorScale: choice(
    ['Color scale', 'Échelle de couleurs', 'Escala de colores'],
    ['Automatic', 'Automatique', 'Automática'],
    ['Blue', 'Bleu', 'Azul'],
    ['Green', 'Vert', 'Verde'],
    ['Orange', 'Orange', 'Naranja'],
  ),
  tileGap: [
    'Gap between tiles (px)',
    'Espacement des tuiles (px)',
    'Separación entre teselas (px)',
  ],
  tileRadius: [
    'Tile corner radius (px)',
    'Rayon des coins des tuiles (px)',
    'Radio de las esquinas de las teselas (px)',
  ],
  showGroupLabels: [
    'Show parent groups',
    'Afficher les libellés des groupes parents',
    'Mostrar las etiquetas de los grupos principales',
  ],
  layerGap: [
    'Gap between rings (px)',
    'Espacement des anneaux (px)',
    'Separación entre anillos (px)',
  ],
  showSegmentLabels: [
    'Show segment labels',
    'Afficher les libellés des segments',
    'Mostrar etiquetas de los segmentos',
  ],
  trackWidth: [
    'Track width (px)',
    'Épaisseur des pistes (px)',
    'Grosor de las pistas (px)',
  ],
  trackGap: [
    'Gap between tracks (px)',
    'Espacement des pistes (px)',
    'Separación entre pistas (px)',
  ],
  scaleMax: ['Scale maximum', 'Maximum de l’échelle', 'Máximo de la escala'],
  petalGap: [
    'Gap between petals (px)',
    'Espacement des pétales (px)',
    'Separación entre pétalos (px)',
  ],
  innerRadius: [
    'Inner radius (px)',
    'Rayon intérieur (px)',
    'Radio interior (px)',
  ],
  showTracks: [
    'Show background tracks',
    'Afficher les pistes de fond',
    'Mostrar pistas de fondo',
  ],
  markerSize: [
    'Marker radius (px)',
    'Rayon des marqueurs (px)',
    'Radio de los marcadores (px)',
  ],
  showPointLabels: [
    'Show point labels',
    'Afficher les libellés des points',
    'Mostrar etiquetas de los puntos',
  ],
  fitToData: [
    'Fit map to the data',
    'Cadrer la carte sur les données',
    'Ajustar el mapa a los datos',
  ],
  reverseColorScale: [
    'Reverse color scale',
    'Inverser l’échelle de couleurs',
    'Invertir la escala de colores',
  ],
  label: ['Chart title', 'Titre du graphique', 'Título del gráfico'],
  height: ['Height', 'Hauteur', 'Altura'],
  dataLabel: ['Data table label', 'Libellé du tableau', 'Etiqueta de la tabla'],
  emptyText: ['Empty message', 'Message sans données', 'Mensaje sin datos'],
}

const withPlaceholder = (
  titles: SettingLabels[string],
  placeholders: LocaleText,
): SettingLabels[string] => {
  const message = (index: 0 | 1 | 2) => ({
    title: String(titles[index]),
    placeholder: placeholders[index],
  })
  return [message(0), message(1), message(2)]
}

export function chartLocales(
  name: ChartName,
  schema: { properties: Record<string, unknown> },
  overrides: SettingLabels = {},
) {
  const title = chartTitles[name]
  const localSettings = {
    ...settings,
    label: withPlaceholder(settings.label, title),
    dataLabel: withPlaceholder(settings.dataLabel, chartLabels.dataLabel),
    emptyText: withPlaceholder(settings.emptyText, chartLabels.emptyText),
    ...overrides,
  }
  return materialLocales(
    title,
    Object.fromEntries(
      Object.keys(schema.properties).map((key) => [key, localSettings[key]]),
    ),
  )
}
