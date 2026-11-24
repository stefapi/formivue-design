import {
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
  type FormDocumentJson,
} from '@formivue-design/formivue-transformer'
import { exampleLocale } from '../../../shared/language'
import { t } from './copy'
import ui from './documents/ui.json?raw'
import dataSchema from './documents/data.schema.json?raw'
import data from './documents/data.json?raw'

const initialFiles = { ui, dataSchema, data } satisfies FormDocumentJson

interface Shop {
  id: string
  boutique: string
  ventes: number
  objectif: number
}

function shops(data: FormDocuments['data']): Shop[] {
  // The simulated feed updates the shop document shipped with this example.
  const rows = data.boutiques
  if (
    !Array.isArray(rows) ||
    !rows.length ||
    rows.some(
      (row) =>
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row) ||
        typeof row.id !== 'string' ||
        typeof row.boutique !== 'string' ||
        !Number.isSafeInteger(row.ventes) ||
        !Number.isSafeInteger(row.objectif),
    )
  )
    throw new Error(t('feedShape'))
  return rows as unknown as Shop[]
}

export function createSalesDemo(initial = parseFormDocuments(initialFiles)) {
  let remote = shops(initial.data)
  const session = createFormDocument(initial)

  function send(index: number, amount: number | string) {
    const baseRevision = session.revision
    const result = session.applyPatch({
      baseRevision,
      revision: baseRevision + 1,
      operations: [
        { op: 'replace', path: `/boutiques/${index}/ventes`, value: amount },
      ],
    })
    remote = remote.map((row, position) =>
      position === index ? { ...row, ventes: Number(amount) } : row,
    )
    return result
  }

  return {
    session,
    publishPatch() {
      const index = session.revision % remote.length
      const shop = remote[index]
      const increment = 140 + 30 * (session.revision % 5)
      const result = send(index, shop.ventes + increment)
      return {
        ...result,
        detail: () =>
          `${shop.boutique} · +${new Intl.NumberFormat(exampleLocale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(increment)}`,
      }
    },
    publishSnapshot() {
      // Rotate the feed order so row identity and any draft are easy to see.
      const rotated = [...remote.slice(1), remote[0]].map((shop, index) => ({
        ...shop,
        ventes: shop.ventes + (index + 1) * 60,
      }))
      const result = session.replaceData({
        boutiques: rotated.map((shop) => ({ ...shop })),
      })
      remote = rotated
      return { ...result, detail: () => t('rotated') }
    },
    rejectPatch() {
      return send(0, 'montant inconnu')
    },
    simulateConflict() {
      const shop = remote[0]
      const path = ['boutiques', '0', 'ventes']
      const local = session.form.getValuesIn(path)
      if (local === shop.ventes && !session.form.query(path).get('active')) {
        session.form.setValuesIn(path, shop.ventes + 320)
      }
      const increment = local === shop.ventes + 640 ? 641 : 640
      const result = send(0, shop.ventes + increment)
      return {
        ...result,
        detail: () => t('doubleEdit', { shop: shop.boutique }),
      }
    },
    applyData(data: FormDocuments['data']) {
      const rows = shops(data)
      const result = session.replaceData(data)
      remote = rows
      return result
    },
    files() {
      return stringifyFormDocuments(session.exportDocuments())
    },
  }
}
