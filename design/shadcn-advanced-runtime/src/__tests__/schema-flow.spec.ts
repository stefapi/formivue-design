import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import {
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'
import { Materials } from '@formivue-design/formivue-vue'
import { TreeNode, type ITreeNode } from '@formivue-design/core'
import { AdvancedMaterials, AdvancedPreviewFrame, Badge } from '../index'

const { SchemaField } = createSchemaField({
  components: { ...Materials, ...AdvancedMaterials },
})

const field = (
  component: string,
  name: string,
  options: { props?: ITreeNode['props']; children?: ITreeNode[] } = {},
): ITreeNode => ({
  componentName: 'Field',
  props: { name, type: 'void', 'x-component': component, ...options.props },
  children: options.children,
})

const input = (name: string, title: string, component = 'Input') =>
  field(component, name, {
    props: {
      type: component === 'TagsInput' ? 'array' : 'string',
      title,
      required: true,
      'x-decorator': 'FormItem',
    },
  })

function renderExport(
  children: ITreeNode[],
  options?: Parameters<typeof createForm>[0],
  scope = {},
  { frame = false, trusted = false } = {},
) {
  const tree = new TreeNode({ componentName: 'Form', children })
  const exported = JSON.parse(JSON.stringify(transformToSchema(tree)))
  expect(
    transformToSchema(transformToTreeNode(exported, { trusted })).schema
      .properties,
  ).toMatchObject(exported.schema.properties)
  const form = createForm(options)
  const view = mount(
    defineComponent({
      setup() {
        const render = () =>
          h(FormProvider, { form }, () =>
            h(SchemaField, { schema: exported.schema, scope }),
          )
        return () => (frame ? h(AdvancedPreviewFrame, {}, render) : render())
      },
    }),
    { attachTo: document.body },
  )
  return { view, form }
}

describe('advanced schema bindings', () => {
  test('renders fallback badge text when the canvas supplies an empty slot', () => {
    const view = mount(Badge, {
      props: { text: 'Configured badge' },
      slots: { default: () => [] },
    })
    try {
      expect(view.text()).toBe('Configured badge')
    } finally {
      view.unmount()
    }
  })

  test.each(['Questionnaire', 'Stepper'])(
    '%s validates only its route and keeps answers after going back',
    async (component) => {
      const submit = vi.fn()
      const { view, form } = renderExport(
        [
          field(component, 'flow', {
            props: { 'x-component-props': { onSubmit: '{{submit}}' } },
            children: [
              field(`${component}Step`, 'intro', {
                props: {
                  'x-component-props': {
                    title: 'Start',
                    branches: [
                      { path: 'choice', equals: 'skip', next: 'review' },
                    ],
                  },
                },
                children: [input('choice', 'Choice')],
              }),
              field(`${component}Step`, 'details', {
                props: { 'x-component-props': { title: 'Details' } },
                children: [input('detailsValue', 'Details value')],
              }),
              field(`${component}Step`, 'review', {
                props: { 'x-component-props': { title: 'Review' } },
              }),
            ],
          }),
        ],
        undefined,
        { submit },
        { trusted: true },
      )
      const press = async (label: string) => {
        const button = view
          .findAll('button')
          .find((item) => item.text() === label)
        expect(button).toBeDefined()
        await button.trigger('click')
        await flushPromises()
      }
      try {
        expect(view.find('h3').text()).toBe('Start')
        await press('Next')
        expect(view.find('h3').text()).toBe('Start')
        await view
          .get('input[aria-label="Choice"], input[id="flow.intro.choice"]')
          .setValue('skip')
        await press('Next')
        expect(view.find('h3').text()).toBe('Review')
        await press('Previous')
        expect(form.values.choice).toBe('skip')
        expect(view.find('h3').text()).toBe('Start')
        await press('Next')
        await press('Finish')
        expect(submit).toHaveBeenCalledExactlyOnceWith({ choice: 'skip' })
        expect(view.get('[role="status"]').text()).toBe('Completed')
      } finally {
        view.unmount()
      }
    },
  )

  test('preserves nested fields in resizable panels, carousel slides and scroll areas', async () => {
    const { view, form } = renderExport([
      field('Resizable', 'layout', {
        children: [
          field('ResizablePanel', 'left', {
            children: [
              input('tags', 'Keywords', 'TagsInput'),
              field('ScrollArea', 'scroll', {
                children: [input('code', 'Code', 'InputOTP')],
              }),
            ],
          }),
          field('ResizablePanel', 'right', {
            children: [
              field('Carousel', 'carousel', {
                children: [
                  field('CarouselSlide', 'first', {
                    children: [input('firstValue', 'First field')],
                  }),
                  field('CarouselSlide', 'second', {
                    children: [input('secondValue', 'Second field')],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ])
    try {
      await flushPromises()
      const tag = view.get('input[aria-label="Keywords"]')
      await tag.setValue('alpha')
      await tag.trigger('keydown', { key: 'Enter' })
      expect(form.values.tags).toEqual(['alpha'])
      expect(view.text()).toContain('alpha')
      expect(form.query('layout.left.scroll.code').take()).toBeDefined()
      expect(view.find('input[aria-label="Code 1 / 6"]').exists()).toBe(true)
      await view
        .get('input[id="layout.right.carousel.second.secondValue"]')
        .setValue('kept')
      expect(form.values.secondValue).toBe('kept')
      expect(view.get('[role="separator"]').attributes('aria-label')).toBe(
        'Resize panels',
      )
    } finally {
      view.unmount()
    }
  })

  test.each([
    { component: 'Sheet', frame: false },
    { component: 'Sheet', frame: true },
    { component: 'Drawer', frame: false },
    { component: 'Drawer', frame: true },
  ])(
    '$component keeps its fields mounted as it opens and closes (preview frame: $frame)',
    async ({ component, frame }) => {
      const { view, form } = renderExport(
        [
          field(component, 'overlay', {
            props: {
              'x-component-props': {
                title: 'Panel',
                triggerText: 'Open panel',
              },
            },
            children: [input('answer', 'Answer')],
          }),
        ],
        undefined,
        {},
        { frame },
      )
      try {
        expect(form.query('overlay.answer').take()).toBeDefined()
        expect(document.body.querySelector('[role="dialog"]')).toBeNull()
        await view.get('button').trigger('click')
        await flushPromises()
        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
        expect(!!dialog.closest('[data-advanced-overlay-frame]')).toBe(frame)
        if (component === 'Sheet') {
          expect(dialog.classList.contains(frame ? 'absolute' : 'fixed')).toBe(
            true,
          )
          expect(dialog.classList.contains('relative')).toBe(false)
        }
        const answer = dialog.querySelector<HTMLInputElement>('input')
        answer.value = 'First answer'
        answer.dispatchEvent(new Event('input', { bubbles: true }))
        await flushPromises()
        expect(form.values.answer).toBe('First answer')
        dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]').click()
        await flushPromises()
        expect(document.body.querySelector('[role="dialog"]')).toBeNull()
        expect(view.get('input').element).toBe(answer)
        await view.get('button').trigger('click')
        await flushPromises()
        expect(document.body.querySelector('[role="dialog"] input')).toBe(
          answer,
        )
      } finally {
        view.unmount()
      }
    },
  )

  test('filters and selects a combobox option and preserves numeric toggle values', async () => {
    const options = [
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana' },
    ]
    const { view, form } = renderExport([
      field('Combobox', 'fruit', {
        props: { type: 'string', title: 'Fruit', enum: options },
      }),
      field('ToggleGroup', 'amount', {
        props: {
          type: 'array',
          title: 'Amount',
          enum: [
            { value: 0, label: 'None' },
            { value: 2, label: 'Two' },
          ],
          'x-component-props': { multiple: true },
        },
      }),
    ])
    try {
      const combobox = view.get('input[aria-label="Fruit"]')
      await combobox.setValue('Ban')
      await flushPromises()
      const matches =
        document.body.querySelectorAll<HTMLElement>('[role="option"]')
      expect(Array.from(matches, (option) => option.textContent)).toEqual([
        'Banana',
      ])
      matches[0].click()
      await flushPromises()
      expect(form.values.fruit).toBe('b')
      const toggles = view.findAll('button[aria-pressed]')
      expect(toggles).toHaveLength(2)
      await toggles[0].trigger('click')
      await toggles[1].trigger('click')
      expect(form.values.amount).toEqual([0, 2])
    } finally {
      view.unmount()
    }
  })
})
