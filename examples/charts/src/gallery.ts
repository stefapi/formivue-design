import type { ChartName } from '@formivue-design/charts-runtime'
import { localize, type Message } from '../../shared/language'
import { galleryCopy } from './copy'

type SampleProps = {
  rows: Record<string, string | number>[]
} & Record<string, unknown>

export function chartPropsForLanguage(props: SampleProps) {
  const { rows, ...mapping } = localize(props, galleryCopy)
  return {
    ...mapping,
    rows: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          localize(key, galleryCopy),
          value,
        ]),
      ),
    ),
  }
}

interface ChartSample {
  name: ChartName
  props: SampleProps
  description: Message
}

const cartesian = {
  rows: [
    { Mois: 'Jan.', Ventes: 124, Objectif: 140 },
    { Mois: 'Fév.', Ventes: 163, Objectif: 150 },
    { Mois: 'Mars', Ventes: 148, Objectif: 160 },
    { Mois: 'Avril', Ventes: 209, Objectif: 185 },
  ],
  xKey: 'Mois',
  series: [{ key: 'Ventes' }, { key: 'Objectif' }],
}
const channels = {
  rows: [
    { Mois: 'Jan.', Web: 124, Boutique: 92 },
    { Mois: 'Fév.', Web: 163, Boutique: 115 },
    { Mois: 'Mars', Web: 148, Boutique: 130 },
    { Mois: 'Avril', Web: 209, Boutique: 142 },
  ],
  xKey: 'Mois',
  series: [{ key: 'Web' }, { key: 'Boutique' }],
}
const shares = {
  rows: [
    { Canal: 'Web', Commandes: 48 },
    { Canal: 'Boutique', Commandes: 31 },
    { Canal: 'Partenaires', Commandes: 21 },
  ],
  xKey: 'Canal',
  valueKey: 'Commandes',
}
const hierarchy = {
  rows: [
    { Région: 'Europe', Pays: 'France', Commandes: 54 },
    { Région: 'Europe', Pays: 'Espagne', Commandes: 30 },
    { Région: 'Europe', Pays: 'Belgique', Commandes: 24 },
    { Région: 'Amérique du Nord', Pays: 'Canada', Commandes: 36 },
    { Région: 'Amérique du Nord', Pays: 'États-Unis', Commandes: 28 },
  ],
  xKey: 'Pays',
  groupKey: 'Région',
  valueKey: 'Commandes',
}
const journeys = {
  rows: [
    { Origine: 'Recherche', Destination: 'Catalogue', Visites: 52 },
    { Origine: 'Newsletter', Destination: 'Catalogue', Visites: 30 },
    { Origine: 'Catalogue', Destination: 'Panier', Visites: 55 },
    { Origine: 'Catalogue', Destination: 'Sortie', Visites: 27 },
    { Origine: 'Panier', Destination: 'Commande', Visites: 39 },
    { Origine: 'Panier', Destination: 'Sortie', Visites: 16 },
  ],
  sourceKey: 'Origine',
  targetKey: 'Destination',
  valueKey: 'Visites',
}

export const chartGroups: {
  id: string
  label: Message
  charts: ChartSample[]
}[] = [
  {
    id: 'cartesian',
    label: ['Cartesian', 'Cartésiens', 'Cartesianos'],
    charts: [
      {
        name: 'BarChart',
        props: cartesian,
        description: [
          'Sales and targets by month.',
          'Ventes et objectifs par mois.',
          'Ventas y objetivos por mes.',
        ],
      },
      {
        name: 'StackedBarChart',
        props: channels,
        description: [
          'Each channel’s contribution to the monthly total.',
          'Contribution des canaux au total mensuel.',
          'Contribución de cada canal al total mensual.',
        ],
      },
      {
        name: 'LineChart',
        props: cartesian,
        description: [
          'Sales and targets over time.',
          'Évolution des ventes et des objectifs.',
          'Evolución de las ventas y los objetivos.',
        ],
      },
      {
        name: 'AreaChart',
        props: channels,
        description: [
          'Volume over time by channel.',
          'Évolution du volume par canal.',
          'Evolución del volumen por canal.',
        ],
      },
      {
        name: 'ScatterChart',
        props: {
          rows: [
            [40, 4],
            [55, 9],
            [65, 7],
            [85, 14],
            [115, 15],
            [130, 22],
            [155, 24],
          ].map(([Visites, Commandes]) => ({ Visites, Commandes })),
          xKey: 'Visites',
          valueKey: 'Commandes',
        },
        description: [
          'Relationship between visits and orders.',
          'Relation entre visites et commandes.',
          'Relación entre visitas y pedidos.',
        ],
      },
      {
        name: 'BoxplotChart',
        props: {
          rows: Object.entries({
            Express: [1, 1, 2, 2, 4],
            Standard: [2, 3, 4, 5, 6],
            Relais: [3, 4, 5, 5, 7],
          }).flatMap(([Mode, Jours]) =>
            Jours.map((Délai) => ({ Mode, Délai })),
          ),
          xKey: 'Mode',
          valueKey: 'Délai',
        },
        description: [
          'Distribution of delivery times in days.',
          'Distribution des délais de livraison, en jours.',
          'Distribución de los plazos de entrega en días.',
        ],
      },
      {
        name: 'TimelineChart',
        props: {
          rows: [
            { Tâche: 'Cadrage', Début: '2026-02-02', Fin: '2026-02-06' },
            { Tâche: 'Conception', Début: '2026-02-04', Fin: '2026-02-11' },
            { Tâche: 'Validation', Début: '2026-02-10', Fin: '2026-02-16' },
          ],
          xKey: 'Tâche',
          startKey: 'Début',
          endKey: 'Fin',
        },
        description: [
          'Schedule for three overlapping tasks.',
          'Calendrier de trois tâches qui se chevauchent.',
          'Calendario de tres tareas que se solapan.',
        ],
      },
      {
        name: 'HeatmapChart',
        props: {
          rows: ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.'].flatMap((Jour, i) =>
            ['Matin', 'Midi', 'Soir'].map((Créneau, j) => ({
              Jour,
              Créneau,
              Visites: [
                12, 30, 20, 22, 37, 24, 20, 42, 28, 25, 38, 36, 35, 50, 39,
              ][i * 3 + j],
            })),
          ),
          xKey: 'Jour',
          groupKey: 'Créneau',
          valueKey: 'Visites',
          colorScale: 'green',
        },
        description: [
          'Visits by day and time slot.',
          'Fréquentation par jour et par créneau.',
          'Visitas por día y franja horaria.',
        ],
      },
    ],
  },
  {
    id: 'shares',
    label: ['Proportions', 'Proportions', 'Proporciones'],
    charts: [
      {
        name: 'PieChart',
        props: shares,
        description: [
          'Share of orders by channel.',
          'Part des commandes par canal.',
          'Proporción de pedidos por canal.',
        ],
      },
      {
        name: 'DonutChart',
        props: { ...shares, centerLabel: 'Commandes' },
        description: [
          'Distribution with a label in the middle.',
          'Répartition avec un libellé au centre.',
          'Distribución con una etiqueta central.',
        ],
      },
      {
        name: 'NestedDonutChart',
        props: hierarchy,
        description: [
          'Each ring shows a level, from region to country.',
          'Chaque anneau représente un niveau, de la région au pays.',
          'Cada anillo representa un nivel, de la región al país.',
        ],
      },
      {
        name: 'TreemapChart',
        props: hierarchy,
        description: [
          'Orders by country, grouped by region.',
          'Commandes par pays, regroupées par région.',
          'Pedidos por país, agrupados por región.',
        ],
      },
      {
        name: 'RadialBarChart',
        props: { ...shares, scaleMax: 60 },
        description: [
          'Channels compared on a common scale.',
          'Canaux comparés sur une échelle commune.',
          'Canales comparados en una escala común.',
        ],
      },
      {
        name: 'CircularBarChart',
        props: shares,
        description: [
          'Order volumes shown as circular bars.',
          'Volume des commandes en barres circulaires.',
          'Volumen de pedidos en barras circulares.',
        ],
      },
    ],
  },
  {
    id: 'flows',
    label: ['Flows and networks', 'Flux et réseaux', 'Flujos y redes'],
    charts: [
      {
        name: 'SankeyChart',
        props: journeys,
        description: [
          'Visitor journeys from catalog to order.',
          'Parcours des visiteurs du catalogue à la commande.',
          'Recorrido de los visitantes del catálogo al pedido.',
        ],
      },
      {
        name: 'NetworkGraph',
        props: journeys,
        description: [
          'Directed connections between journey stages.',
          'Connexions orientées entre les étapes du parcours.',
          'Conexiones dirigidas entre las etapas del recorrido.',
        ],
      },
      {
        name: 'ChordChart',
        props: journeys,
        description: [
          'Strength of relationships between stages.',
          'Intensité des relations entre les étapes.',
          'Intensidad de las relaciones entre etapas.',
        ],
      },
    ],
  },
  {
    id: 'maps',
    label: ['Maps', 'Cartes', 'Mapas'],
    charts: [
      {
        name: 'PointMap',
        props: {
          rows: [
            { Ville: 'Paris', Latitude: 48.86, Longitude: 2.35, Commandes: 24 },
            {
              Ville: 'Dakar',
              Latitude: 14.69,
              Longitude: -17.45,
              Commandes: 15,
            },
            {
              Ville: 'Montréal',
              Latitude: 45.5,
              Longitude: -73.57,
              Commandes: 18,
            },
          ],
          xKey: 'Ville',
          latitudeKey: 'Latitude',
          longitudeKey: 'Longitude',
          valueKey: 'Commandes',
        },
        description: [
          'Orders associated with three cities.',
          'Commandes associées à trois villes.',
          'Pedidos asociados a tres ciudades.',
        ],
      },
      {
        name: 'ChoroplethMap',
        props: {
          rows: [
            { Pays: 'FR', Commandes: 60 },
            { Pays: 'ES', Commandes: 22 },
            { Pays: 'CA', Commandes: 42 },
            { Pays: 'BR', Commandes: 35 },
            { Pays: 'DE', Commandes: 50 },
          ],
          xKey: 'Pays',
          valueKey: 'Commandes',
          colorScale: 'green',
        },
        description: [
          'Order volume by country.',
          'Volume des commandes par pays.',
          'Volumen de pedidos por país.',
        ],
      },
      {
        name: 'FlowMap',
        props: {
          rows: [
            {
              Route: 'Paris – Dakar',
              Latitude: 48.86,
              Longitude: 2.35,
              DestLat: 14.69,
              DestLon: -17.45,
              Envois: 22,
            },
            {
              Route: 'Paris – Montréal',
              Latitude: 48.86,
              Longitude: 2.35,
              DestLat: 45.5,
              DestLon: -73.57,
              Envois: 30,
            },
          ],
          xKey: 'Route',
          latitudeKey: 'Latitude',
          longitudeKey: 'Longitude',
          destinationLatitudeKey: 'DestLat',
          destinationLongitudeKey: 'DestLon',
          valueKey: 'Envois',
        },
        description: [
          'Shipping routes from Paris.',
          'Itinéraires des expéditions depuis Paris.',
          'Rutas de envío desde París.',
        ],
      },
    ],
  },
]
