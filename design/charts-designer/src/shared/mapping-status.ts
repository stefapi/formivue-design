import { observer } from '@formivue/reactive-vue'
import {
  loadChartMappingDiagnostics,
  type ChartName,
  type MappingExample,
} from '@formivue-design/charts-runtime'
import { defineComponent, h, shallowRef, watch, type PropType } from 'vue'
import type { LocaleText } from '../locales/shared'
import type { chartSource } from './source'
import { text } from './settings-language'

const reasons: Record<MappingExample['reason'], LocaleText> = {
  record: [
    'Expected a row object',
    'Objet attendu pour la ligne',
    'Se esperaba un objeto de fila',
  ],
  label: [
    'Missing or invalid label',
    'Libellé vide ou invalide',
    'Etiqueta vacía o no válida',
  ],
  number: ['Expected a number', 'Nombre attendu', 'Se esperaba un número'],
  date: ['Invalid date', 'Date invalide', 'Fecha no válida'],
  dateOrder: [
    'End must be after start',
    'La fin doit être postérieure au début',
    'El fin debe ser posterior al inicio',
  ],
  latitude: [
    'Expected a latitude between −90 and 90',
    'Latitude attendue entre −90 et 90',
    'Se esperaba una latitud entre −90 y 90',
  ],
  longitude: [
    'Expected a longitude between −180 and 180',
    'Longitude attendue entre −180 et 180',
    'Se esperaba una longitud entre −180 y 180',
  ],
  country: [
    'Country code not recognized by the map',
    'Code pays absent de la carte',
    'Código de país no reconocido por el mapa',
  ],
  positiveTotal: [
    'The aggregated value must be positive',
    'La valeur agrégée doit être positive',
    'El valor agregado debe ser positivo',
  ],
  finiteTotal: [
    'The aggregated value is outside the supported numeric range',
    'La valeur agrégée dépasse la plage numérique prise en charge',
    'El valor agregado está fuera del rango numérico admitido',
  ],
}

function displayValue(value: unknown) {
  if (value == null || value === '') return '–'
  if (typeof value === 'string') {
    const preview = value.length > 60 ? `${value.slice(0, 60)}…` : value
    return JSON.stringify(preview)
  }
  return ['number', 'boolean'].includes(typeof value) ? String(value) : '…'
}

type Inspector = Awaited<ReturnType<typeof loadChartMappingDiagnostics>>

export const ChartMappingStatus = observer(
  defineComponent({
    name: 'ChartMappingStatus',
    props: {
      name: { type: String as PropType<ChartName>, required: true },
      mapping: {
        type: Object as PropType<Parameters<Inspector>[0]>,
        required: true,
      },
      source: {
        type: Object as PropType<ReturnType<typeof chartSource>>,
        required: true,
      },
      declaredColumns: Array as PropType<string[]>,
    },
    setup(props) {
      const inspector = shallowRef<Inspector>()
      const unavailable = shallowRef(false)
      watch(
        () => props.name,
        async (name, _, onCleanup) => {
          let current = true
          onCleanup(() => {
            current = false
          })
          inspector.value = undefined
          unavailable.value = false
          try {
            const inspect = await loadChartMappingDiagnostics(name)
            if (current) inspector.value = inspect
          } catch {
            if (current) unavailable.value = true
          }
        },
        { immediate: true },
      )

      return () => {
        const rows = props.source.rows
        const report = inspector.value?.(
          props.mapping,
          rows,
          props.declaredColumns,
        )
        const messages = []
        if (props.source.unresolved || unavailable.value)
          messages.push(
            h(
              'p',
              text([
                'Mapping diagnostics are unavailable for this source in the designer.',
                'Le diagnostic de cette source est indisponible dans le designer.',
                'El diagnóstico de esta fuente no está disponible en el diseñador.',
              ]),
            ),
          )
        else if (report) {
          if (report.missingColumns.length)
            messages.push(
              h('p', [
                text([
                  'Columns not found',
                  'Colonnes introuvables',
                  'Columnas no encontradas',
                ]),
                ' — ',
                report.missingColumns.join(', '),
              ]),
            )
          if (report.incomplete)
            messages.push(
              h(
                'p',
                text([
                  'Select the required columns to check the rows.',
                  'Sélectionnez les colonnes requises pour vérifier les lignes.',
                  'Seleccione las columnas obligatorias para comprobar las filas.',
                ]),
              ),
            )
          if (report.ignored) {
            const { ignored, examples } = report
            messages.push(
              h(
                'p',
                text([
                  `Rows ignored by the chart (${ignored} of ${rows.length})`,
                  `Lignes ignorées par le graphique (${ignored} sur ${rows.length})`,
                  `Filas ignoradas por el gráfico (${ignored} de ${rows.length})`,
                ]),
              ),
              h(
                'ul',
                { class: 'list-disc space-y-1 ps-4' },
                examples.map((example) => {
                  const { row, column, value, reason } = example
                  return h('li', { key: row }, [
                    `${text(['Row', 'Ligne', 'Fila'])} ${row}`,
                    column ? ` · ${column} (${displayValue(value)})` : '',
                    ` · ${text(reasons[reason])}`,
                  ])
                }),
              ),
            )
          }
        }
        return messages.length
          ? h(
              'div',
              {
                'aria-label': text([
                  'Mapping diagnostics',
                  'Diagnostic du mapping',
                  'Diagnóstico del mapeo',
                ]),
                class: 'grid gap-1 break-words rounded-md border p-2 text-xs',
                role: 'status',
              },
              messages,
            )
          : null
      }
    },
  }),
)
