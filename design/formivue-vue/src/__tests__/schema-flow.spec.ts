import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { test, expect } from 'vitest'
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider, type ISchema } from '@formivue/vue'
import type { ITreeNode } from '@formivue-design/core'
import {
  transformToSchema,
  type IFormivueSchema,
} from '@formivue-design/formivue-transformer'
import { Materials } from '../index'

test('a serialized designer export preserves layout, panel defaults and reactions in the runtime', async () => {
  const field = (
    name: string,
    props: ISchema,
    children: ITreeNode[] = [],
  ): ITreeNode => ({
    id: name,
    componentName: 'Field',
    props: { ...props, name },
    children,
  })

  const input = (title: string): ISchema => ({
    type: 'string',
    title,
    'x-component': 'Input',
    'x-decorator': 'FormItem',
  })

  const tree: ITreeNode = {
    id: 'form',
    componentName: 'Form',
    props: { layout: 'horizontal', labelWidth: 120 },
    children: [
      field('company', input('Company')),
      field(
        'tabs',
        {
          type: 'void',
          'x-component': 'FormTab',
          'x-component-props': { activeKey: 'details' },
        },
        [
          field('overview', {
            type: 'void',
            'x-component': 'FormTab.TabPane',
            'x-component-props': { tab: 'Overview' },
          }),
          field(
            'details',
            {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': { tab: 'Details' },
            },
            [
              field('reference', {
                ...input('Reference'),
                'x-reactions': {
                  dependencies: ['company'],
                  fulfill: {
                    state: { visible: '{{ $deps[0] === "Formivue" }}' },
                  },
                },
              }),
            ],
          ),
        ],
      ),
    ],
  }

  const exported: IFormivueSchema = JSON.parse(
    JSON.stringify(transformToSchema(tree)),
  )
  const form = createForm()
  const { SchemaField } = createSchemaField({ components: Materials })
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(FormProvider, { form }, () =>
          h(Materials.FormLayout, exported.form ?? {}, () =>
            h(SchemaField, { schema: exported.schema }),
          ),
        ),
    }),
    { attachTo: document.body },
  )

  try {
    expect(wrapper.get('[data-layout="horizontal"] label').text()).toBe(
      'Company',
    )
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe(
      'Details',
    )
    expect(wrapper.findAll('input')).toHaveLength(1)

    await wrapper.get('input').setValue('Formivue')
    expect(wrapper.findAll('label').map((label) => label.text())).toEqual([
      'Company',
      'Reference',
    ])
    await wrapper.findAll('input')[1].setValue('R-42')
    expect(await form.submit()).toEqual({
      company: 'Formivue',
      reference: 'R-42',
    })
  } finally {
    wrapper.unmount()
  }
})

test('exported date and time fields submit ISO strings and ranges', async () => {
  const picker = (name: string, component: string, props: ISchema) => ({
    id: name,
    componentName: 'Field',
    props: {
      type: component.endsWith('.RangePicker') ? 'string[]' : 'string',
      title: name,
      name,
      'x-decorator': 'FormItem',
      'x-component': component,
      ...props,
    },
    children: [],
  })
  const tree: ITreeNode = {
    id: 'schedule',
    componentName: 'Form',
    props: {},
    children: [
      {
        id: 'schedule-card',
        componentName: 'Field',
        props: { type: 'void', 'x-component': 'Card', title: 'Schedule' },
        children: [
          picker('date', 'DatePicker', {
            default: '2026-11-21T08:30',
            'x-component-props': { showTime: true, locale: 'fr-FR' },
          }),
          picker('days', 'DatePicker.RangePicker', {
            default: ['2026-11-21', '2026-11-24'],
            'x-component-props': {
              locale: 'fr-FR',
              placeholder: 'Choisir les dates',
            },
          }),
          picker('time', 'TimePicker', { default: '08:30:00' }),
          picker('hours', 'TimePicker.RangePicker', {
            default: ['08:30:00', '17:00:00'],
            'x-component-props': { locale: 'fr-FR' },
          }),
        ],
      },
    ],
  }
  const exported: IFormivueSchema = JSON.parse(
    JSON.stringify(transformToSchema(tree)),
  )
  const form = createForm()
  const { SchemaField } = createSchemaField({ components: Materials })
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(FormProvider, { form }, () =>
          h(SchemaField, { schema: exported.schema }),
        ),
    }),
    { attachTo: document.body },
  )

  const clickDay = async (calendar: string, day: string) => {
    document
      .querySelector<HTMLElement>(
        `[data-slot="${calendar}-trigger"][data-value="${day}"]:not([data-outside-view])`,
      )!
      .click()
    await wrapper.vm.$nextTick()
  }
  try {
    const date = wrapper.get('button[id="schedule-card.date"]')
    expect(date.text()).toBe('21 novembre 2026')
    await date.trigger('click')
    await clickDay('calendar', '2026-11-22')
    expect(form.values.date).toBe('2026-11-22T08:30')
    await wrapper
      .get('[data-slot="date-picker-field"] input[type="time"]')
      .setValue('09:15')

    const days = wrapper.get('button[id="schedule-card.days"]')
    await days.trigger('click')
    await clickDay('range-calendar', '2026-11-23')
    await clickDay('range-calendar', '2026-11-25')
    await days.trigger('click')

    await wrapper.get('input[id="schedule-card.time"]').setValue('09:30:45')
    await wrapper.get('input[aria-label="Heure de fin"]').setValue('18:45:10')
    expect(await form.submit()).toEqual({
      date: '2026-11-22T09:15',
      days: ['2026-11-23', '2026-11-25'],
      time: '09:30:45',
      hours: ['08:30:00', '18:45:10'],
    })
  } finally {
    wrapper.unmount()
  }
})
