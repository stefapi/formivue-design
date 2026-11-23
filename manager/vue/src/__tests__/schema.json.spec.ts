import { createForm, Field } from '@formivue/core'
import { observer } from '@formivue/reactive-vue'
import { Schema } from '@formivue/json-schema'
import { fireEvent, render, waitFor } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { FormProvider, createSchemaField, RecursionField } from '../'
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '../'

const Input = defineComponent({
  name: 'Input',
  props: ['value'],
  setup(props, { attrs }) {
    return () =>
      h('input', {
        class: 'input',
        value: props.value,
        'data-testid': 'input',
        onInput: attrs.onChange ?? attrs.onInput,
      })
  },
})

const Input2 = defineComponent({
  name: 'Input2',
  props: ['value'],
  setup(props, { attrs }) {
    return () =>
      h('input', {
        class: 'input2',
        value: props.value,
        'data-testid': 'input2',
        onInput: attrs.onChange ?? attrs.onInput,
      })
  },
})

const FormItem = defineComponent({
  name: 'FormItem',
  props: ['label'],
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-testid': 'formitem',
          style: {
            width: '300px',
            height: '30px',
            background: 'yellow',
          },
        },
        [props.label || 'unknown ', slots.default?.()],
      )
  },
})

const ArrayItems = observer(
  defineComponent({
    setup() {
      const fieldRef = useField<Field>()
      const schemaRef = useFieldSchema()

      return () => {
        const field = fieldRef.value
        const schema = schemaRef.value
        const items = field.value?.map?.((item, index) => {
          return h(RecursionField, { schema: schema.items, name: index })
        })
        return h('div', { 'data-testid': 'array-items' }, [items])
      }
    },
  }),
)

const Previewer = defineComponent({
  name: 'Previewer',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'previewer' }, slots.default?.())
  },
})

const Previewer2 = defineComponent({
  name: 'Previewer2',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'previewer2' }, slots.content?.({}))
  },
})

const Previewer3 = defineComponent({
  name: 'Previewer3',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'previewer3' }, [
        slots.default?.({
          slotProp: '123',
        }),
      ])
  },
})

const Previewer4 = defineComponent({
  name: 'Previewer4',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'previewer4' }, [
        slots.content?.({
          slotProp: '123',
        }),
      ])
  },
})

const Previewer5 = defineComponent({
  name: 'Previewer5',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'previewer5' }, slots.append?.())
  },
})

describe('json schema field', () => {
  test('string field', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              default: '123',
              'x-component': 'Input',
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('input')).toBeVisible()
    expect((queryByTestId('input') as HTMLInputElement).value).toEqual('123')
  })

  test('object field', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'object',
              properties: {
                string: {
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('input')).toBeVisible()
  })
})

describe('x-content', () => {
  test('default slot', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Previewer,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer',
              'x-content': '123',
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer')).toBeVisible()
    expect(queryByTestId('previewer').textContent).toEqual('123')
  })

  test('default slot with component', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer',
              'x-content': Content,
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer')).toBeVisible()
    expect(queryByTestId('previewer').textContent).toEqual('123')
  })

  test('default slot with name default', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Previewer,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer',
              'x-content': {
                default: '123',
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer')).toBeVisible()
    expect(queryByTestId('previewer').textContent).toEqual('123')
  })

  test('default slot with name default and component', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer',
              'x-content': {
                default: Content,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer')).toBeVisible()
    expect(queryByTestId('previewer').textContent).toEqual('123')
  })

  test('named slot', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer2,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer2',
              'x-content': {
                content: Content,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer2')).toBeVisible()
    expect(queryByTestId('previewer2').textContent).toEqual('123')
  })

  test('named slot with scope', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer2,
      },
      scope: {
        Content,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer2',
              'x-content': {
                content: '{{Content}}',
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer2')).toBeVisible()
    expect(queryByTestId('previewer2').textContent).toEqual('123')
  })

  test('named slot in void field', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer2,
      },
      scope: {
        Content,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'void',
              'x-component': 'Previewer2',
              'x-content': {
                content: '{{Content}}',
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer2')).toBeVisible()
    expect(queryByTestId('previewer2').textContent).toEqual('123')
  })

  test('scoped slot', () => {
    const form = createForm()
    const Content = (_props: any, { attrs }: any) => h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        Previewer3,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer3',
              'x-content': Content,
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer3')).toBeVisible()
    expect(queryByTestId('previewer3').textContent).toEqual('123')
  })

  test('scoped slot with scope', () => {
    const form = createForm()
    const Content = (_props: any, { attrs }: any) => h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        Previewer3,
      },
      scope: {
        Content,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer3',
              'x-content': '{{Content}}',
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer3')).toBeVisible()
    expect(queryByTestId('previewer3').textContent).toEqual('123')
  })

  test('scoped slot with name default', () => {
    const form = createForm()
    const Content = (_props: any, { attrs }: any) => h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        Previewer3,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer3',
              'x-content': {
                default: Content,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer3')).toBeVisible()
    expect(queryByTestId('previewer3').textContent).toEqual('123')
  })

  test('scoped slot with name other', () => {
    const form = createForm()
    const Content = (_props: any, { attrs }: any) => h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        Previewer4,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer4',
              'x-content': {
                content: Content,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer4')).toBeVisible()
    expect(queryByTestId('previewer4').textContent).toEqual('123')
  })

  test('scoped slot with connect', () => {
    const form = createForm()
    const ConnectedComponent = connect(
      defineComponent({
        setup(_, { slots }) {
          return () =>
            h(
              'div',
              {
                'data-testid': 'ConnectedComponent',
              },
              [
                slots.default?.({
                  slotProp: '123',
                }),
              ],
            )
        },
      }),
      mapProps((props, _field) => {
        return {
          ...props,
        }
      }),
    )

    const scopeSlotComponent = (_props: any, { attrs }: any) =>
      h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        ConnectedComponent,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              name: 'ConnectedComponent',
              'x-component': 'ConnectedComponent',
              'x-content': {
                default: scopeSlotComponent,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('ConnectedComponent')).toBeVisible()
    expect(queryByTestId('ConnectedComponent').textContent).toEqual('123')
  })

  test('scoped slot with connect and readPretty', () => {
    const form = createForm()

    const ConnectedWithMapReadPretty = connect(
      defineComponent({
        setup(_, { slots }) {
          return () =>
            h(
              'div',
              {
                'data-testid': 'ConnectedWithMapReadPretty',
              },
              [
                slots.withMapReadPretty?.({
                  slotProp: '123',
                }),
              ],
            )
        },
      }),
      mapProps((props, _field) => {
        return {
          ...props,
        }
      }),
      mapReadPretty({
        render() {
          return h('div', 'read pretty')
        },
      }),
    )

    const scopeSlotComponent = (_props: any, { attrs }: any) =>
      h('span', attrs.slotProp)

    const { SchemaField } = createSchemaField({
      components: {
        ConnectedWithMapReadPretty,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              name: 'ConnectedWithMapReadPretty',
              'x-component': 'ConnectedWithMapReadPretty',
              'x-content': {
                withMapReadPretty: scopeSlotComponent,
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('ConnectedWithMapReadPretty')).toBeVisible()
    expect(queryByTestId('ConnectedWithMapReadPretty').textContent).toEqual(
      '123',
    )
  })

  test('slot compitible', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Previewer5,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Previewer5',
              'x-content': {
                append: '123',
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer5')).toBeVisible()
    expect(queryByTestId('previewer5').textContent).toEqual('123')
  })

  test('wrong x-content will be ignore', () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Previewer,
      },
    })
    const { queryAllByTestId, _container } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'object',
              properties: {
                input1: {
                  type: 'string',
                  'x-component': 'Previewer',
                  'x-content': {
                    default: {
                      someAttr: '123',
                    },
                  },
                },
                input2: {
                  type: 'string',
                  'x-component': 'Previewer',
                  'x-content': {
                    default: null,
                  },
                },
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    queryAllByTestId('previewer').forEach((el) => expect(el).toBeVisible())
    queryAllByTestId('previewer').forEach((el) =>
      expect(el.textContent).toEqual(''),
    )
  })
})

describe('x-slot', () => {
  test('x-slot works in void field properties', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer4,
        Content,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'void',
              'x-component': 'Previewer4',
              properties: {
                content: {
                  type: 'void',
                  'x-component': 'Content',
                  'x-slot': 'content',
                },
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer4')).toBeVisible()
    expect(queryByTestId('previewer4').textContent).toEqual('123')
  })
  test('x-slot works in object field properties', () => {
    const form = createForm()
    const Content = {
      render() {
        return h('span', '123')
      },
    }
    const { SchemaField } = createSchemaField({
      components: {
        Previewer4,
        Content,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'object',
              'x-component': 'Previewer4',
              properties: {
                content: {
                  type: 'void',
                  'x-component': 'Content',
                  'x-slot': 'content',
                },
              },
            }),
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          name="string"
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect(queryByTestId('previewer4')).toBeVisible()
    expect(queryByTestId('previewer4').textContent).toEqual('123')
  })
})

describe('scope', () => {
  test('scope in <SchemaField> prop', async () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
        Previewer,
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: {
              type: 'object',
              properties: {
                input1: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-reactions': {
                    target: 'input2',
                    fulfill: {
                      state: {
                        value: '{{ test }}',
                      },
                    },
                  },
                },
                input2: {
                  type: 'string',
                  'x-component': 'Input2',
                },
              },
            },
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          :schema="schema"
          :scope="{
            test: '123'
          }"
        />
      </FormProvider>`,
      }),
    )
    expect((queryByTestId('input2') as HTMLInputElement).value).toEqual('123')
  })

  test('scope in options of createSchemaField', async () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
        Previewer,
      },
      scope: {
        test: '123',
      },
    })
    const { queryByTestId } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: {
              type: 'object',
              properties: {
                input1: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-reactions': {
                    target: 'input2',
                    fulfill: {
                      state: {
                        value: '{{ test }}',
                      },
                    },
                  },
                },
                input2: {
                  type: 'string',
                  'x-component': 'Input2',
                },
              },
            },
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          :schema="schema"
        />
      </FormProvider>`,
      }),
    )
    expect((queryByTestId('input2') as HTMLInputElement).value).toEqual('123')
  })
})

describe('expression', () => {
  test('expression x-visible', async () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
        Previewer,
      },
    })

    const wrapper = mount(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: {
              type: 'object',
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
                input2: {
                  type: 'string',
                  'x-component': 'Input2',
                  'x-visible': '{{$form.values.input === "123"}}',
                },
              },
            },
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          :schema="schema"
        />
      </FormProvider>`,
      }),
      {
        attachTo: document.body,
      },
    )

    expect(wrapper.find('.input').exists()).toBeTruthy()
    expect(wrapper.find('.input2').exists()).not.toBeTruthy()

    form.values.input = '123'
    await waitFor(() => expect(wrapper.find('.input2').exists()).toBeTruthy())
    wrapper.unmount()
  })

  test('expression x-value', async () => {
    const form = createForm({
      values: {
        input: 1,
      },
    })
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
        Previewer,
      },
    })

    const wrapper = mount(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: {
              type: 'object',
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
                input2: {
                  type: 'string',
                  'x-component': 'Input2',
                  'x-value': '{{$form.values.input * 10}}',
                },
              },
            },
          }
        },
        template: `<FormProvider :form="form">
        <SchemaField
          :schema="schema"
        />
      </FormProvider>`,
      }),
      { attachTo: document.body },
    )

    expect((wrapper.find('.input2').element as HTMLInputElement).value).toEqual(
      '10',
    )
    form.values.input = 10
    await waitFor(() =>
      expect(
        (wrapper.find('.input2').element as HTMLInputElement).value,
      ).toEqual('100'),
    )
    wrapper.unmount()
  })
})

describe('schema controlled', () => {
  test('view update correctly when schema changed', async () => {
    const form = createForm({})
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
      },
    })
    const component = defineComponent({
      components: { FormProvider, SchemaField },
      data() {
        return {
          form,
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                'x-component': 'Input',
              },
              input2: {
                type: 'string',
                'x-component': 'Input2',
              },
            },
          },
        }
      },
      methods: {
        changeSchema() {
          this.schema = {
            type: 'object',
            properties: {
              input2: {
                type: 'string',
                'x-component': 'Input2',
              },
            },
          }
        },
      },
      template: `<FormProvider :form="form">
          <SchemaField
            :schema="schema"
          />
          <button @click="changeSchema()">changeSchema</button>
        </FormProvider>`,
    })
    const { queryByTestId, getByText } = render(component)

    expect(queryByTestId('input')).toBeVisible()
    expect(queryByTestId('input2')).toBeVisible()
    getByText('changeSchema').click()
    await waitFor(() => {
      expect(queryByTestId('input2')).toBeVisible()
      expect(queryByTestId('input')).toBeNull()
    })
  })
  test('view updated correctly with schema fragment changed', async () => {
    const form = createForm({})
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        Input2,
        ArrayItems,
      },
    })
    const frag1 = {
      type: 'object',
      properties: {
        input1: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    }
    const frag2 = {
      type: 'array',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        properties: {
          input2: {
            type: 'string',
            'x-component': 'Input2',
          },
        },
      },
    }
    const component = defineComponent({
      components: { FormProvider, SchemaField },
      data() {
        return {
          form,
          schema: {
            type: 'object',
            properties: {
              input: frag1,
            },
          },
        }
      },
      methods: {
        changeSchema() {
          this.form.clearFormGraph('input')
          this.form.deleteValuesIn('input')
          this.schema = {
            type: 'object',
            properties: {
              input: frag2,
            },
          }
        },
      },
      template: `<FormProvider :form="form">
          <SchemaField
            :schema="schema"
          />
          <button @click="changeSchema()">changeSchema</button>
        </FormProvider>`,
    })
    const { queryByTestId, getByText } = render(component)

    expect(queryByTestId('input')).toBeVisible()
    expect(queryByTestId('array-items')).toBeNull()
    getByText('changeSchema').click()
    await waitFor(() => {
      expect(queryByTestId('input')).toBeNull()
      expect(queryByTestId('array-items')).toBeVisible()
    })
  })
})

describe('x-decorator', () => {
  test('x-decorator-props', async () => {
    const form = createForm()
    const { SchemaField } = createSchemaField({
      components: {
        Input,
        FormItem,
      },
    })

    const atBlurFn = vi.fn()
    const onClickFn = vi.fn()
    const atClickFn = vi.fn()
    const { queryByTestId, getByText } = render(
      defineComponent({
        components: { FormProvider, SchemaField },
        data() {
          return {
            form,
            schema: new Schema({
              type: 'string',
              'x-component': 'Input',
              'x-component-props': {
                '@blur': function atBlur() {
                  atBlurFn()
                },
              },
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                label: 'Label ',
                onClick: function onClick() {
                  onClickFn()
                },
                '@click': function atClick() {
                  atClickFn()
                },
              },
            }),
          }
        },
        template: `
        <FormProvider :form="form">
          <SchemaField
            name="string"
            :schema="schema"
          />
        </FormProvider>`,
      }),
    )
    expect(queryByTestId('formitem')).toBeVisible()
    await fireEvent.click(getByText('Label'))
    expect(atClickFn).toBeCalledTimes(1)
    expect(onClickFn).toBeCalledTimes(0)
  })
})
