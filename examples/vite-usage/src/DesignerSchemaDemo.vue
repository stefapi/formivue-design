<template>
  <DemoSection
    id="demo-designer-schema"
    :index="5"
    kicker="Designer · JSON Schema"
    title="Render a designer form"
    :apis="['Materials', 'createSchemaField', 'x-component-props']"
    :code="JSON.stringify(exportedForm, null, 2)"
  >
    <template #description>
      This form uses the same components as the designer preview. Try the nested
      choices, panel defaults and repeating-list controls. The inspector shows
      the values managed by Formivue.
    </template>

    <FormProvider :form="form">
      <FormLayout v-bind="exportedForm.form">
        <SchemaField :schema="exportedForm.schema" />
      </FormLayout>
    </FormProvider>

    <template #aside>
      <StateInspector :form="form" title="designerForm" />
    </template>
  </DemoSection>
</template>

<script setup lang="ts">
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider, type ISchema } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'
import DemoSection from './ui/DemoSection.vue'
import StateInspector from './ui/StateInspector.vue'

const form = createForm()
const { FormLayout } = Materials
const { SchemaField } = createSchemaField({ components: Materials })

const block = (
  component: string,
  props: Record<string, unknown> = {},
  properties?: ISchema['properties'],
): ISchema => ({
  type: 'void',
  'x-component': component,
  'x-component-props': props,
  properties,
})

const input = (title: string): ISchema => ({
  type: 'string',
  title,
  'x-decorator': 'FormItem',
  'x-component': 'Input',
})

const regions = [
  {
    label: 'Europe',
    value: 'europe',
    children: [
      {
        label: 'France',
        value: 'fr',
        children: [
          { label: 'Brittany', value: 'brittany' },
          { label: 'Normandy', value: 'normandy' },
        ],
      },
    ],
  },
]

const rowFields = { name: input('Name'), city: input('City') }

const controls = (list: string) => ({
  copy: block(`${list}.Copy`),
  remove: block(`${list}.Remove`),
  up: block(`${list}.MoveUp`),
  down: block(`${list}.MoveDown`),
})

const exportedForm = {
  form: {
    layout: 'vertical' as const,
    style: { display: 'flex', flexDirection: 'column', gap: '16px' },
  },
  schema: {
    type: 'object',
    properties: {
      layout: block(
        'FormLayout',
        { layout: 'horizontal', labelAlign: 'left', labelWidth: 105 },
        {
          card: block(
            'Card',
            { title: 'Location and rating' },
            {
              grid: block(
                'FormGrid',
                { maxColumns: 2, minWidth: 220, columnGap: 16, rowGap: 8 },
                {
                  location: block(
                    'FormGrid.GridColumn',
                    { gridSpan: 1 },
                    {
                      tree: {
                        type: 'string',
                        title: 'Region tree',
                        enum: regions,
                        'x-decorator': 'FormItem',
                        'x-component': 'TreeSelect',
                        'x-component-props': { treeDefaultExpandAll: true },
                      },
                      cascade: {
                        type: 'array',
                        title: 'Region path',
                        enum: regions,
                        'x-decorator': 'FormItem',
                        'x-component': 'Cascader',
                      },
                    },
                  ),
                  rating: block(
                    'FormGrid.GridColumn',
                    { gridSpan: 1 },
                    {
                      score: {
                        type: 'number',
                        title: 'Score',
                        default: 0,
                        'x-decorator': 'FormItem',
                        'x-component': 'Slider',
                        'x-component-props': {
                          min: -5,
                          max: 5,
                          step: 0.25,
                          showValue: false,
                        },
                      },
                    },
                  ),
                },
              ),
            },
          ),
        },
      ),
      space: block(
        'Space',
        { direction: 'vertical', size: 'middle' },
        {
          tabs: block(
            'FormTab',
            { activeKey: 'details' },
            {
              overview: block(
                'FormTab.TabPane',
                { tab: 'Overview' },
                {
                  note: block('Text', {
                    content: 'An exported form can be rendered directly.',
                  }),
                },
              ),
              details: block(
                'FormTab.TabPane',
                { tab: 'Details' },
                {
                  note: block('Text', {
                    format: 'text',
                    content: 'First line\n\nSecond line',
                  }),
                },
              ),
            },
          ),
          panels: block(
            'FormCollapse',
            { accordion: true, defaultOpenKeys: ['instructions'] },
            {
              notes: block(
                'FormCollapse.CollapsePanel',
                { header: 'Notes' },
                {
                  note: block('Text', {
                    content: 'Open this panel to close Instructions.',
                  }),
                },
              ),
              instructions: block(
                'FormCollapse.CollapsePanel',
                { header: 'Instructions' },
                {
                  note: block('Text', {
                    format: 'html',
                    content:
                      '<p>Edit <strong>any record</strong> below.</p><ul><li>Add or duplicate an item.</li><li>Use the table handle to reorder rows.</li></ul>',
                  }),
                },
              ),
            },
          ),
        },
      ),
      cards: {
        type: 'array',
        'x-component': 'ArrayCards',
        'x-component-props': {
          title: 'Contact card',
          style: { display: 'flex', flexDirection: 'column', gap: '12px' },
        },
        default: [{ name: 'Alice', city: 'Rennes' }],
        items: {
          type: 'object',
          properties: { ...rowFields, ...controls('ArrayCards') },
        },
        properties: {
          add: block('ArrayCards.Addition', {
            title: 'Add a contact card',
            method: 'unshift',
          }),
        },
      },
      table: {
        type: 'array',
        'x-component': 'ArrayTable',
        default: [
          { name: 'Bruno', city: 'Caen' },
          { name: 'Camille', city: 'Nantes' },
        ],
        items: {
          type: 'object',
          properties: {
            sort: block(
              'ArrayTable.Column',
              { title: 'Reorder' },
              {
                handle: block('ArrayTable.SortHandle'),
              },
            ),
            details: block(
              'ArrayTable.Column',
              { title: 'Contact details', style: { padding: '8px' } },
              rowFields,
            ),
            actions: block(
              'ArrayTable.Column',
              { title: 'Actions', align: 'right' },
              controls('ArrayTable'),
            ),
          },
        },
        properties: {
          add: block('ArrayTable.Addition', {
            title: 'Add a table row',
            defaultValue: { city: 'Paris' },
          }),
        },
      },
    },
  } satisfies ISchema,
}
</script>
