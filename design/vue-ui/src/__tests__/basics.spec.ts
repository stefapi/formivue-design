// Phase 2.2/2.4 — basics : Button, Input, FormItemBase, Space, Card,
// FormLayout, FormCollapse, FormTab.
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import {
  Button,
  Card,
  FormCollapse,
  FormItemBase,
  FormLayout,
  FormTab,
  Input,
  Password,
  Space,
  Textarea,
} from '../index'

const Host = defineComponent({
  props: { layout: String },
  setup(props) {
    return () =>
      h(
        FormLayout,
        { layout: (props.layout ?? 'horizontal') as 'horizontal' },
        {
          default: () =>
            h(FormItemBase, { label: 'L' }, { default: () => h(Input) }),
        },
      )
  },
})

describe('@formivue-design/vue-ui — basics', () => {
  test('Button : type/slot/attrs', () => {
    const wrapper = mount(Button, {
      props: { type: 'primary' },
      attrs: { disabled: true },
      slots: { default: () => 'OK' },
    })
    const btn = wrapper.get('button')
    expect(btn.text()).toBe('OK')
    expect(btn.attributes('type')).toBe('button')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(btn.classes()).toContain('bg-primary')
  })

  test('Input : value -> onChange (contrat formivue)', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Input, { props: { value: 'a', onChange } })
    const input = wrapper.get('input')
    expect((input.element as HTMLInputElement).value).toBe('a')
    await input.setValue('hello')
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  test('Password/Textarea : types natifs', () => {
    const pwd = mount(Password, { props: { value: 'x' } })
    expect(pwd.get('input').attributes('type')).toBe('password')
    const ta = mount(Textarea, { props: { value: 'line' } })
    expect(ta.get('textarea').exists()).toBe(true)
  })

  test('FormItemBase : label/for/help/required (fix 6.4 porté)', () => {
    const wrapper = mount(FormItemBase, {
      props: { label: 'Nom', labelFor: 'fld', required: true, help: 'oops' },
      slots: { default: () => h(Input) },
    })
    const label = wrapper.get('label')
    expect(label.attributes('for')).toBe('fld')
    expect(label.text()).toContain('Nom')
    expect(label.find('span[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('oops')
  })

  test('FormItemBase : extra quand pas de help', () => {
    const wrapper = mount(FormItemBase, {
      props: { label: 'X', extra: 'info' },
    })
    expect(wrapper.text()).toContain('info')
  })

  test('Space : direction/size', () => {
    const wrapper = mount(Space, {
      props: { direction: 'vertical', size: 'large' },
      slots: { default: () => 'a' },
    })
    expect(wrapper.get('div').classes()).toContain('flex-col')
    expect(wrapper.get('div').classes()).toContain('gap-6')
  })

  test('Card : title + body + footer', () => {
    const wrapper = mount(Card, {
      props: { title: 'Carte' },
      slots: { default: () => 'body', footer: () => 'foot' },
    })
    // structure Card shadcn-vue : data-slot card-header/card-content/card-footer
    expect(wrapper.get('[data-slot=card-title]').text()).toBe('Carte')
    expect(wrapper.get('[data-slot=card-content]').text()).toBe('body')
    expect(wrapper.get('[data-slot=card-footer]').text()).toBe('foot')
  })

  test('FormLayout : provide + submit preventDefault -> FormItemBase horizontal', async () => {
    const wrapper = mount(Host)
    await nextTick()
    expect(wrapper.get('form').exists()).toBe(true)
    // layout horizontal -> item flex
    expect(wrapper.find('form > div').classes()).toContain('flex')
    await wrapper.get('form').trigger('submit')
    // preventDefault : pas de navigation/erreur jsdom
    expect(wrapper.html()).toContain('input')
  })

  test('FormCollapse : toggle activeKeys + slot par clé', async () => {
    const wrapper = mount(FormCollapse, {
      props: {
        collapses: [
          { key: 'a', title: 'Panneau A' },
          { key: 'b', title: 'Panneau B' },
        ],
        activeKeys: ['a'],
      },
      slots: { a: () => 'contenu-a', b: () => 'contenu-b' },
    })
    expect(wrapper.text()).toContain('contenu-a')
    expect(wrapper.text()).not.toContain('contenu-b')
    const headers = wrapper.findAll('button')
    expect(headers[0].attributes('aria-expanded')).toBe('true')
    await headers[0].trigger('click')
    expect(wrapper.emitted('update:activeKeys')?.[0]?.[0]).toEqual([])
    // activeKeys (controlled) n'a pas bougé : le 2e toggle part de ['a']
    await headers[1].trigger('click')
    expect(wrapper.emitted('update:activeKeys')?.[1]?.[0]).toEqual(['a', 'b'])
  })

  test('FormTab : rendu par onglet + changement', async () => {
    const wrapper = mount(FormTab, {
      props: {
        tabs: [
          { key: 'one', label: 'Un' },
          { key: 'two', label: 'Deux' },
        ],
        activeKey: 'one',
      },
      slots: { one: () => 'P1', two: () => 'P2' },
    })
    expect(wrapper.text()).toContain('P1')
    expect(wrapper.text()).not.toContain('P2')
    // reka TabsTrigger s'active sur mousedown (pas click) — cf. suivi phase 2
    await wrapper.findAll('[role="tab"]')[1].trigger('mousedown')
    expect(wrapper.emitted('update:activeKey')?.[0]).toEqual(['two'])
  })
})
