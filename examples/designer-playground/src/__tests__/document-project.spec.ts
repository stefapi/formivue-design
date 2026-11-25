import {
  createDocumentContractRegistry,
  createFormDocument,
  parseFormDocuments,
  stringifyFormDocuments,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import { ChartSources } from '@formivue-design/charts-designer'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import { TreeNode } from '@formivue-design/core'
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'
import { DataTable } from '@formivue-design/shadcn-advanced-designer'
import { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'
import { pointerSegments, type JsonObject } from '@formivue/json-schema'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { useDocumentProject } from '@formivue-design/data-model'
import { localProjectPersistence } from '../service'
import { PreviewWidget } from '../widgets/PreviewWidget'

const svgMeasurements = {
  getComputedTextLength: () => 24,
  getBBox: () => ({ x: 0, y: 0, width: 24, height: 12 }),
  getTotalLength: () => 100,
  getPointAtLength: (length: number) => ({ x: length, y: 0 }),
}
beforeAll(() => {
  for (const [key, value] of Object.entries(svgMeasurements))
    Object.defineProperty(SVGElement.prototype, key, {
      configurable: true,
      value,
    })
})
afterAll(async () => {
  // Unovis throttles tooltip positioning for 500 ms, including after unmount.
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (const key of Object.keys(svgMeasurements))
    Reflect.deleteProperty(SVGElement.prototype, key)
})

const displayResources = [...Object.values(ChartSources).flat(), DataTable]
  .flatMap((chart) => chart.Resource)
  .map(({ node }) => ({
    component: node.children[0].props['x-component'],
    children: node.children.map((child) => child.serialize()),
  }))

test.each(displayResources)(
  'restores $component rows at their generated and variant paths',
  async ({ component, children }) => {
    const storage = 'test-formivue-rows-path-' + component
    const options = {
      contracts: createDocumentContractRegistry([
        chartDocumentContracts,
        advancedDocumentContracts,
      ]),
    }
    const emptyCanvas = new TreeNode({ componentName: 'Form' })
    const canvas = new TreeNode({ componentName: 'Form', children })
    const model = useDocumentProject({
      documentOptions: options,
      applyPreview: vi.fn(),
      persistence: localProjectPersistence(storage),
    })
    try {
      model.generate(emptyCanvas)
      model.addVariant('API', false)
      model.generate(canvas)
      expect(model.reconciliation.value).toBeUndefined()
      const original = parseFormDocuments(model.files.value)
      const [key] = pointerSegments(original.ui.nodes[0].bindings.rows.path)
      expect(original.data[key]).not.toHaveLength(0)

      const deleted = parseFormDocuments(model.files.value)
      delete deleted.dataSchema.properties[key]
      delete deleted.data[key]
      model.edit(stringifyFormDocuments(deleted))
      model.generate(canvas)
      expect(parseFormDocuments(model.files.value)).toEqual(original)

      const columns = (
        original.dataSchema.properties[key] as FormDocuments['dataSchema']
      ).items as FormDocuments['dataSchema']
      const [column] = Object.keys(columns.properties)
      expect(
        model.reviewMove({ path: [key], to: ['metrics', 'series'] }).confirm(),
      ).toBe(true)
      expect(
        model
          .reviewRename({
            path: ['metrics', 'series', null, column],
            key: 'primary',
          })
          .confirm(),
      ).toBe(true)
      const moved = parseFormDocuments(model.files.value)
      model.apply(moved)
      const edited = parseFormDocuments(model.files.value)
      const metrics = edited.dataSchema.properties
        .metrics as FormDocuments['dataSchema']
      delete metrics.properties.series
      delete (edited.data.metrics as JsonObject).series
      model.edit(stringifyFormDocuments(edited))
      model.generate(canvas)
      const restored = parseFormDocuments(model.files.value)
      expect(restored).toEqual(moved)
      const document = createFormDocument(restored, options)
      const view = mount(PreviewWidget, {
        props: {
          tree: canvas,
          materials: { ...ChartMaterials, ...AdvancedMaterials },
          document,
        },
      })
      try {
        const rows =
          component === 'DataTable' ? 'table tbody tr' : 'figure tbody tr'
        await vi.waitFor(() =>
          expect(view.findAll(rows).length).toBeGreaterThan(0),
        )
      } finally {
        view.unmount()
        document.dispose()
      }
    } finally {
      localStorage.removeItem(storage)
    }
  },
)
