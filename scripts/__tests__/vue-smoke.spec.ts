// Phase 1.5 du plan vue — smoke du câblage
// Vue : le dist ESM du manager intégré (`@formivue/vue` + `@formivue/reactive-vue`
// en workspace:*) doit s'exécuter depuis CE repo, en jsdom :
//   1. monter FormProvider + Field (binding v3, template runtime inutile — h()) ;
//   2. réagir à la saisie : input → field.onInput → form.values (pipeline réactif
//      du manager : observer reactive-vue → $forceUpdate) ;
//   3. exposer observer (@formivue/reactive-vue) sur un composant maison.
// Aucun alias source : on prouve le CÂBLAGE (node_modules → workspace:* →
// manager/ → dist).
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { observable } from '@formivue/reactive'
import { observer } from '@formivue/reactive-vue'
import { createForm, FormProvider, Field, useField } from '@formivue/vue'

const Input = defineComponent({
  props: { value: null },
  setup(props: { value?: unknown }) {
    const fieldRef = useField()
    return () => {
      const field = fieldRef.value
      return h('input', {
        class: 'test-input',
        value: (props.value ?? field?.value ?? '') as string,
        'data-testid': field?.path.toString(),
        onInput: (e: Event) =>
          field?.onInput((e.target as HTMLInputElement).value),
      })
    }
  },
})

describe('câblage Vue (@formivue/vue + @formivue/reactive-vue du manager)', () => {
  test('FormProvider + Field montent depuis le dist ESM du manager (jsdom)', async () => {
    const form = createForm()
    const wrapper = mount(FormProvider, {
      props: { form },
      slots: {
        default: () =>
          h(Field, {
            name: 'aa',
            component: [Input],
          } as Record<string, unknown>),
      },
    })
    expect(form.mounted).toBeTruthy()
    expect(form.query('aa').take()?.mounted).toBeTruthy()

    const input = wrapper.get('input')
    await input.setValue('123')
    expect(input.element.value).toBe('123')
    expect(form.values.aa).toBe('123')
    wrapper.unmount()
  })

  test('observer (@formivue/reactive-vue) suit un observable formivue', async () => {
    const obs = observable({ count: 0 })
    const Counter = observer(
      defineComponent({
        setup() {
          return () => h('div', obs.count)
        },
      }),
    )
    const wrapper = mount(Counter)
    expect(wrapper.text()).toBe('0')
    obs.count = 1
    await nextTick()
    expect(wrapper.text()).toBe('1')
    wrapper.unmount()
  })
})
