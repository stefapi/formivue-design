// Phase 2.2 — controls : Checkbox, Radio, Switch, Slider, NumberPicker, Select.
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import {
  Checkbox,
  FormItemBase,
  FormLayout,
  NumberPicker,
  Radio,
  Select,
  Slider,
  Switch,
} from '../index'

describe('@formivue-design/vue-ui — form controls (contrat value/onChange)', () => {
  test('Checkbox : role=checkbox + click -> onChange(true)', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Checkbox, {
      props: { value: false, onChange, label: 'Accepter' },
    })
    const box = wrapper.get('[role="checkbox"]')
    expect(box.attributes('aria-checked')).toBe('false')
    expect(wrapper.text()).toContain('Accepter')
    await box.trigger('click')
    expect(onChange).toHaveBeenCalledWith(true)
    expect(wrapper.emitted('update:value')?.[0]).toEqual([true])
  })

  test('Radio : options -> role=radio + sélection', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Radio, {
      props: {
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        value: 'a',
        onChange,
      },
    })
    expect(wrapper.findAll('[role="radio"]').length).toBe(2)
    expect(
      wrapper.findAll('[role="radio"]')[0].attributes('aria-checked'),
    ).toBe('true')
    await wrapper.findAll('[role="radio"]')[1].trigger('click')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  test('Switch : role=switch + click -> onChange', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Switch, { props: { value: false, onChange } })
    const sw = wrapper.get('[role="switch"]')
    expect(sw.attributes('aria-checked')).toBe('false')
    await sw.trigger('click')
    expect(onChange).toHaveBeenCalledWith(true)
  })

  test('Slider : role=slider + aria-valuenow/min/max', async () => {
    const wrapper = mount(Slider, {
      props: { value: 40, min: 0, max: 100, step: 5 },
    })
    await nextTick()
    const thumb = wrapper.get('[role="slider"]')
    expect(thumb.attributes('aria-valuenow')).toBe('40')
    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
    expect(wrapper.get('[data-slot="slider-value"]').text()).toBe('40')
    expect(wrapper.get('[data-slot="slider-range"]').classes()).toContain(
      'absolute',
    )
    await wrapper.setProps({ showValue: false })
    expect(wrapper.find('[data-slot="slider-value"]').exists()).toBe(false)
    expect(thumb.attributes('aria-valuenow')).toBe('40')
  })

  test('Slider : borne la valeur affichée et sécurise les réglages invalides', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Slider, {
      props: { value: 100, min: -10, max: 10, step: 0, onChange },
      attrs: { id: 'volume', 'aria-label': 'Volume' },
    })
    await nextTick()
    const thumb = wrapper.get('[role="slider"]')
    expect(thumb.attributes('id')).toBe('volume')
    expect(thumb.attributes('aria-label')).toBe('Volume')
    expect(thumb.attributes('aria-valuenow')).toBe('10')
    await thumb.trigger('keydown', { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(9)
    await wrapper.setProps({ max: -10 })
    expect(thumb.attributes('aria-disabled')).toBe('true')
    expect(thumb.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[data-slot="slider-value"]').text()).toBe('—')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('Slider : respecte la lecture seule', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Slider, {
      props: {
        value: -0.5,
        min: -2,
        max: 2,
        step: 0.25,
        readOnly: true,
        onChange,
      },
    })
    const thumb = wrapper.get('[role="slider"]')
    expect(thumb.attributes('aria-disabled')).toBe('true')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
    expect(wrapper.get('[data-slot="slider-value"]').text()).toBe('-0.5')
  })

  test('NumberPicker : spinbutton + clavier ↑ -> onChange', async () => {
    const onChange = vi.fn()
    const wrapper = mount(NumberPicker, {
      props: { value: 5, step: 1, onChange },
    })
    expect(wrapper.get('input').exists()).toBe(true)
    // pressed-hold (pointer) inopérant sous VTU/jsdom — le clavier est la voie
    // testable (et a11y) : focus input + ArrowUp = +step
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(6)
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(4)
  })

  test('Select : trigger combobox + ouverture + sélection', async () => {
    document.body.innerHTML = ''
    const onChange = vi.fn()
    const wrapper = mount(Select, {
      props: {
        options: [
          { label: 'Rouge', value: 'red' },
          { label: 'Vert', value: 'green' },
        ],
        value: 'red',
        onChange,
      },
      attachTo: document.body,
    })
    const trigger = wrapper.get('[role="combobox"]')
    // label résolu maison (les options ne vivent que dans le contenu ouvert)
    expect(trigger.text()).toContain('Rouge')
    await trigger.trigger('pointerdown')
    await nextTick()
    // contenu porté au body (portail) → interrogation du document.
    // reka sélectionne l'option sur pointerup (pas click).
    const options = [...document.querySelectorAll('[role="option"]')]
    expect(options.length).toBe(2)
    options[1].dispatchEvent(new PointerEvent('pointerdown'))
    options[1].dispatchEvent(new PointerEvent('pointerup'))
    await nextTick()
    expect(onChange).toHaveBeenCalledWith('green')
    wrapper.unmount()
  })

  test('Select multiple : onChange(tableau)', async () => {
    document.body.innerHTML = ''
    const onChange = vi.fn()
    const wrapper = mount(Select, {
      props: {
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        multiple: true,
        value: [],
        onChange,
      },
      attachTo: document.body,
    })
    const trigger = wrapper.get('[role="combobox"]')
    await trigger.trigger('pointerdown')
    await nextTick()
    const options = [...document.querySelectorAll('[role="option"]')]
    options[0].dispatchEvent(new PointerEvent('pointerdown'))
    options[0].dispatchEvent(new PointerEvent('pointerup'))
    await nextTick()
    expect(onChange).toHaveBeenCalledWith(['a'])
    wrapper.unmount()
  })

  test('Radio optionType=button : groupe segmenté, radios conservés (a11y)', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Radio, {
      props: {
        optionType: 'button',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        value: 'a',
        onChange,
      },
    })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.length).toBe(2)
    expect(radios[0].classes()).toContain('sr-only')
    expect(wrapper.find('[role="radiogroup"]').classes()).toContain(
      'rounded-md',
    )
    await wrapper.findAll('label')[1].trigger('click')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  test('Select defaultValue : affichée tant que value est indéfinie', async () => {
    const options = [
      { label: 'Visible', value: 'visible' },
      { label: 'Hidden', value: 'hidden' },
    ]
    const wrapper = mount(Select, {
      props: { options, defaultValue: 'visible' },
    })
    expect(wrapper.get('[role="combobox"]').text()).toContain('Visible')
    await wrapper.setProps({ value: 'hidden' })
    expect(wrapper.get('[role="combobox"]').text()).toContain('Hidden')
    wrapper.unmount()
  })

  test('Select : affiche le libellé de l’option héritée par défaut', async () => {
    const wrapper = mount(Select, {
      props: {
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Inherit', value: null },
        ],
        defaultValue: null,
      },
    })
    const trigger = wrapper.get('[role="combobox"]')
    expect(trigger.text()).toContain('Inherit')
    await wrapper.setProps({ value: 'horizontal' })
    expect(trigger.text()).toContain('Horizontal')
    await wrapper.setProps({ value: null })
    expect(trigger.text()).toContain('Inherit')
  })

  test('FormItemBase horizontal : labelWidth du FormLayout, tooltip, data-slot', () => {
    const wrapper = mount(FormLayout, {
      props: { layout: 'horizontal', labelWidth: 120, labelAlign: 'left' },
      slots: {
        default: () =>
          h(
            FormItemBase,
            { label: 'Nom', tooltip: 'Aide' },
            { default: () => h('input') },
          ),
      },
    })
    const item = wrapper.get('[data-slot="form-item"]')
    expect(item.attributes('data-layout')).toBe('horizontal')
    const label = wrapper.get('[data-slot="form-item-label"]')
    expect(label.attributes('style')).toContain('width: 120px')
    expect(label.attributes('title')).toBe('Aide')
    expect(label.classes()).toContain('text-left')
    expect(wrapper.find('[data-slot="form-item-control"] input').exists()).toBe(
      true,
    )
  })

  test('FormLayout imbriqué : suit le parent et garde l’aide sous le contrôle', async () => {
    const wrapper = mount(FormLayout, {
      props: { layout: 'horizontal' },
      slots: {
        default: () =>
          h(FormLayout, null, {
            default: () =>
              h(
                FormItemBase,
                { label: 'X', extra: h('span', 'Aide du champ') },
                { default: () => h('input') },
              ),
          }),
      },
    })
    expect(wrapper.findAll('form').length).toBe(1)
    const item = wrapper.get('[data-slot="form-item"]')
    const input = item.get('input').element
    const controlColumn = item.get('[data-slot="form-item-control"]').element
      .parentElement
    expect(item.attributes('data-layout')).toBe('horizontal')
    expect(item.get('label').element.nextElementSibling).toBe(controlColumn)
    expect(controlColumn.querySelector('p')?.textContent).toBe('Aide du champ')

    await wrapper.setProps({ layout: 'vertical' })
    expect(item.attributes('data-layout')).toBe('vertical')
    expect(item.get('input').element).toBe(input)
  })
})
