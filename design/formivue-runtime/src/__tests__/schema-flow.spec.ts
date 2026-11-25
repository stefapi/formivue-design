import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import type { ISchema } from '@formivue/json-schema'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-runtime'

test.each([
  ['en-US', 'Add card', 'Remove'],
  ['fr-FR', 'Ajouter une carte', 'Supprimer'],
])(
  'renders and submits a form with editable rows in %s',
  async (language, addLabel, removeLabel) => {
    const form = createForm({ initialValues: { contacts: [{ name: 'Ada' }] } })
    const schema: ISchema = {
      type: 'object',
      properties: {
        contacts: {
          type: 'array',
          'x-component': 'ArrayCards',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              remove: { type: 'void', 'x-component': 'ArrayCards.Remove' },
            },
          },
          properties: {
            add: { type: 'void', 'x-component': 'ArrayCards.Addition' },
          },
        },
      },
    }
    const exported = JSON.parse(JSON.stringify(schema)) as ISchema
    const { SchemaField } = createSchemaField({ components: Materials })
    const locale = vi
      .spyOn(navigator, 'language', 'get')
      .mockReturnValue(language)
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(FormProvider, { form }, () =>
            h(Materials.FormLayout, { layout: 'horizontal' }, () =>
              h(SchemaField, { schema: exported }),
            ),
          ),
      }),
    )

    try {
      expect(wrapper.get('[data-layout="horizontal"] label').text()).toBe(
        'Name',
      )
      const addition = wrapper
        .findAll('button')
        .find((button) => button.text().includes(addLabel))
      expect(addition).toBeDefined()
      await addition!.trigger('click')
      await wrapper.findAll('input')[1].setValue('Grace')
      await wrapper.get(`button[aria-label="${removeLabel}"]`).trigger('click')
      expect(await form.submit()).toEqual({ contacts: [{ name: 'Grace' }] })
    } finally {
      wrapper.unmount()
      locale.mockRestore()
    }
  },
)
