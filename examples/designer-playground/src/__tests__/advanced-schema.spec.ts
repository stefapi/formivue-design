import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { TreeNode } from '@formivue-design/core'
import {
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'
import { Materials } from '@formivue-design/formivue-vue'
import {
  AdvancedDesignerComponents,
  AdvancedLocales,
  AdvancedSchemas,
  AdvancedSources,
} from '@formivue-design/shadcn-advanced-designer'
import { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'
import {
  ChartDesignerComponents,
  ChartLocales,
  ChartSchemas,
  ChartSources,
} from '@formivue-design/charts-designer'
import {
  ChartMaterials,
  loadChartMappingDiagnostics,
  type ChartName,
} from '@formivue-design/charts-runtime'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { defineComponent, h } from 'vue'

const flow =
  'label previousText nextText initialStep finishText completedText validationText onSubmit'
const step = 'title description next branches fields'
const panel = 'title description triggerText closeText defaultOpen'
const schemaProperties = {
  Avatar: 'src alt fallback size',
  Badge: 'text variant',
  Carousel: 'label previousText nextText loop',
  CarouselSlide: 'title',
  Combobox: 'placeholder emptyText',
  DataTable:
    'columns rows rowKey pageSize searchable label previousText nextText searchLabel emptyText',
  Drawer: panel,
  HoverCard: 'triggerText title message href',
  InputOTP: 'length mask',
  Questionnaire: flow,
  QuestionnaireStep: step,
  Resizable: 'direction height handleLabel',
  ResizablePanel: 'title defaultSize minSize maxSize',
  ScrollArea: 'height label',
  Sheet: panel + ' side',
  Stepper: flow,
  StepperStep: step,
  TagsInput: 'placeholder max delimiter',
  ToggleGroup: 'multiple',
}

type ComponentName = keyof typeof schemaProperties

describe('advanced schema contract', () => {
  test('the designer, property schemas, locales and runtime expose the same components', () => {
    const expected = Object.keys(schemaProperties).sort()
    for (const registry of [
      AdvancedDesignerComponents,
      AdvancedSchemas,
      AdvancedLocales,
      AdvancedMaterials,
    ]) {
      expect(Object.keys(registry).sort()).toEqual(expected)
    }
  })

  test.each(Object.entries(schemaProperties) as [ComponentName, string][])(
    '%s declares and translates each schema property',
    (name, expected) => {
      const schema = AdvancedSchemas[name]
      const keys = expected.split(' ').sort()
      expect(Object.keys(schema.properties).sort()).toEqual(keys)
      const designerProps = AdvancedDesignerComponents[name].Behavior[0]
        .designerProps as { propsSchema: { properties: Record<string, any> } }
      expect(
        designerProps.propsSchema.properties['component-group'].properties[
          'x-component-props'
        ],
      ).toBe(schema)
      for (const setting of Object.values(schema.properties)) {
        expect(
          setting.type || ('anyOf' in setting && setting.anyOf),
        ).toBeTruthy()
        expect(setting['x-component']).toBeTruthy()
      }
      for (const locale of Object.values(AdvancedLocales[name])) {
        expect(
          Object.keys(locale.settings['x-component-props']).sort(),
        ).toEqual(keys)
      }
    },
  )

  test('all palette resources retain their keys through JSON export and import', () => {
    const sources = Object.values(AdvancedSources).flat()
    expect(sources).toHaveLength(15)
    const root = new TreeNode({
      id: 'advanced-form',
      componentName: 'Form',
      children: sources.map((source) =>
        source.Resource[0].node.children[0].serialize(),
      ),
    })
    const visit = (node: TreeNode) => {
      const name = node.props['x-component'] as ComponentName
      expect(AdvancedMaterials[name], name).toBeTruthy()
      for (const key of Object.keys(node.props['x-component-props'] ?? {})) {
        expect(
          AdvancedSchemas[name].properties,
          `${name}.${key}`,
        ).toHaveProperty(key)
      }
      node.children.forEach(visit)
    }
    const questionnaire = root.children.find(
      (node) => node.props['x-component'] === 'Questionnaire',
    )
    questionnaire.props['x-component-props'].onSubmit = '{{submit}}'
    Object.assign(questionnaire.children[0].props['x-component-props'], {
      next: null,
      branches: [{ path: 'choice', equals: false, next: null }],
      fields: ['approval'],
    })
    root.children.forEach(visit)
    const exported = JSON.parse(JSON.stringify(transformToSchema(root)))
    const restored = new TreeNode(
      transformToTreeNode(exported, { trusted: true }),
    )
    expect(JSON.parse(JSON.stringify(transformToSchema(restored)))).toEqual(
      exported,
    )
    const tags = restored.children.find(
      (node) => node.props['x-component'] === 'TagsInput',
    )
    expect(tags.props.items).toEqual({ type: 'string' })
    expect(tags.children).toHaveLength(0)
  })

  test('rows, columns and flow settings declare their nested JSON keys', () => {
    const { rows, columns } = AdvancedSchemas.DataTable.properties
    expect(rows.items).toMatchObject({
      type: 'object',
      additionalProperties: {
        anyOf: expect.arrayContaining([{ type: 'null' }]),
      },
    })
    expect(columns.items).toMatchObject({
      type: 'object',
      required: ['key', 'title'],
      properties: {
        key: { type: 'string' },
        title: { type: 'string' },
        sortable: { type: 'boolean' },
      },
    })
    for (const { properties } of [
      AdvancedSchemas.QuestionnaireStep,
      AdvancedSchemas.StepperStep,
    ]) {
      expect(properties.next.anyOf).toEqual([
        { type: 'string' },
        { type: 'null' },
      ])
      expect(properties.fields.items).toEqual({ type: 'string' })
      expect(properties.branches.items).toMatchObject({
        required: ['path', 'equals', 'next'],
        properties: {
          path: { type: 'string' },
          equals: {
            anyOf: expect.arrayContaining([
              { type: 'null' },
              { type: 'boolean' },
            ]),
          },
          next: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        },
      })
    }
  })

  test('changing the Toggle Group mode exports a matching schema and default', async () => {
    const { SchemaField } = createSchemaField({ components: Materials })
    const form = createForm<Record<string, unknown>>({
      values: {
        type: 'string',
        default: 'a',
        'x-component-props': {},
      },
    })
    const schema = {
      type: 'object',
      properties: { 'x-component-props': AdvancedSchemas.ToggleGroup },
    }
    const view = mount(
      defineComponent({
        setup: () => () =>
          h(FormProvider, { form }, () => h(SchemaField, { schema })),
      }),
    )
    try {
      const toggle = view.get('button[role="switch"]')
      await toggle.trigger('click')
      await flushPromises()
      expect(form.values).toMatchObject({
        type: 'array',
        default: ['a'],
        items: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        'x-component-props': { multiple: true },
      })
      const tree = new TreeNode({
        id: 'root',
        componentName: 'Form',
        children: [
          {
            id: 'choices',
            componentName: 'Field',
            props: { ...form.values, 'x-component': 'ToggleGroup' },
          },
        ],
      })
      const exported = JSON.parse(JSON.stringify(transformToSchema(tree)))
      expect(transformToTreeNode(exported).children[0].props.items).toEqual(
        form.values.items,
      )
      await toggle.trigger('click')
      await flushPromises()
      expect(form.values.type).toBe('string')
      expect(form.values.default).toBe('a')
      expect(form.values).not.toHaveProperty('items')
    } finally {
      view.unmount()
    }
  })
})

describe('chart schema contract', () => {
  const appearance = {
    BarChart: 'groupGap barGap barRadius',
    StackedBarChart: 'barMaxWidth barGap barRadius',
    LineChart: 'curve lineWidth showPoints pointSize',
    AreaChart: 'curve fillOpacity showOutline lineWidth',
    PieChart: 'sliceGap sliceRadius',
    DonutChart: 'ringWidth sliceGap sliceRadius centerLabel',
    ScatterChart: 'pointShape pointSize',
    BoxplotChart: 'boxWidth barRadius',
    TimelineChart: 'rowHeight lineWidth roundIntervals showRowLabels',
    SankeyChart: 'nodeAlign nodeWidth nodePadding',
    NetworkGraph: 'graphLayout nodeSize linkWidth showNodeLabels showArrows',
    ChordChart: 'nodeWidth sliceGap showNodeLabels',
    HeatmapChart: 'colorScale cellGap cellRadius showGridLabels',
    TreemapChart: 'tileGap tileRadius showGroupLabels',
    NestedDonutChart: 'layerGap showSegmentLabels centerLabel',
    RadialBarChart: 'scaleMax trackWidth trackGap showTracks centerLabel',
    CircularBarChart: 'scaleMax petalGap innerRadius sliceRadius showTracks',
    PointMap: 'markerSize showPointLabels fitToData',
    ChoroplethMap: 'colorScale reverseColorScale',
    FlowMap: 'linkWidth markerSize showPointLabels fitToData',
  } satisfies Record<keyof typeof ChartSchemas, string>
  const appearanceKeys = new Set(
    Object.values(appearance).flatMap((keys) => keys.split(' ')),
  )

  test('each palette material has a dedicated schema, locale and runtime component', () => {
    const keys = Object.keys(ChartDesignerComponents).sort()
    expect(keys).toHaveLength(20)
    expect(new Set(Object.values(ChartMaterials)).size).toBe(keys.length)
    for (const registry of [ChartLocales, ChartSchemas, ChartMaterials]) {
      expect(Object.keys(registry).sort()).toEqual(keys)
    }
    const sources = Object.values(ChartSources).flat()
    const root = new TreeNode({
      componentName: 'Form',
      children: sources.map((source) =>
        source.Resource[0].node.children[0].serialize(),
      ),
    })
    expect(
      root.children.map((node) => node.props['x-component']).sort(),
    ).toEqual(keys)
    const exported = JSON.parse(JSON.stringify(transformToSchema(root)))
    expect(
      JSON.parse(
        JSON.stringify(transformToSchema(transformToTreeNode(exported))),
      ),
    ).toEqual(exported)
    for (const node of root.children) {
      const name = node.props['x-component'] as keyof typeof ChartSchemas
      const schema = ChartSchemas[name]
      expect(Object.keys(schema.properties)).not.toContain('chartType')
      for (const props of [schema.properties, ChartMaterials[name].props]) {
        expect(
          Object.keys(props)
            .filter((key) => appearanceKeys.has(key))
            .sort(),
          name,
        ).toEqual(appearance[name].split(' ').sort())
      }
      expect(
        ChartDesignerComponents[name].Behavior[0].designerProps,
      ).toMatchObject({
        propsSchema: {
          properties: {
            'component-group': { properties: { 'x-component-props': schema } },
          },
        },
      })
      for (const locale of Object.values(ChartLocales[name])) {
        expect(
          Object.keys(locale.settings['x-component-props']).sort(),
        ).toEqual(Object.keys(schema.properties).sort())
      }
      for (const key of Object.keys(node.props['x-component-props'])) {
        expect(schema.properties).toHaveProperty(key)
      }
    }
  })

  test('every numeric chart setting has a default hint', () => {
    for (const [name, schema] of Object.entries(ChartSchemas)) {
      for (const [key, field] of Object.entries(schema.properties)) {
        if (field['x-component'] !== 'NumberPicker') continue
        expect(
          field['x-component-props']?.placeholder,
          `${name}.${key}`,
        ).toBeTruthy()
      }
    }
  })

  test('chart mapping diagnostics accept the sample data for every chart type', async () => {
    const sources = Object.values(ChartSources).flat()
    for (const source of sources) {
      const field = source.Resource[0].node.children[0].props
      const inspect = await loadChartMappingDiagnostics(
        field['x-component'] as ChartName,
      )
      const options = field['x-component-props']
      expect(inspect(options, options.rows), field['x-component']).toEqual({
        missingColumns: [],
        incomplete: false,
        ignored: 0,
        examples: [],
      })
    }
  })

  test('chart mapping diagnostics apply positivity to aggregated slices', async () => {
    const inspect = await loadChartMappingDiagnostics('PieChart')
    const options = { xKey: 'category', valueKey: 'value' }
    const rows = [
      { category: 'Kept', value: 8 },
      { category: 'Kept', value: -2 },
      { category: 'Excluded', value: 1 },
      { category: 'Excluded', value: -1 },
    ]
    expect(inspect(options, rows)).toMatchObject({
      ignored: 2,
      examples: [
        { row: 3, column: 'value', reason: 'positiveTotal' },
        { row: 4, column: 'value', reason: 'positiveTotal' },
      ],
    })
    rows[3].value = 2
    expect(inspect(options, rows).ignored).toBe(0)
  })

  test('choropleth mapping diagnostics recognize the country codes of the bundled map', async () => {
    const inspect = await loadChartMappingDiagnostics('ChoroplethMap')
    expect(
      inspect({ xKey: 'country', valueKey: 'value' }, [
        { country: ' fr ', value: 1 },
        { country: 'ZZ', value: 1 },
      ]),
    ).toMatchObject({
      ignored: 1,
      examples: [{ row: 2, column: 'country', value: 'ZZ', reason: 'country' }],
    })
  })
})
