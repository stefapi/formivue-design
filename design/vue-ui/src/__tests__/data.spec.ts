// Phase 2.3 — data : Tree, Table, DatePicker, TimePicker.
import { flushPromises, mount } from '@vue/test-utils'
import { DatePicker, Table, TimePicker, Tree } from '../index'

const treeItems = [
  {
    key: 'form',
    label: 'Form',
    children: [
      {
        key: 'input',
        label: 'Input',
        children: [{ key: 'input.name', label: 'Nom' }],
      },
      { key: 'select', label: 'Select' },
    ],
  },
]

describe('@formivue-design/vue-ui — composite data', () => {
  test('Tree : role=tree, expansion, select(key)', async () => {
    const wrapper = mount(Tree, {
      props: { items: treeItems, defaultExpandedKeys: [] },
      attachTo: document.body,
    })
    expect(wrapper.get('[role="tree"]').attributes('role')).toBe('tree')
    // replié : seulement la racine visible
    expect(wrapper.findAll('[role="treeitem"]').length).toBe(1)
    // déplier via le bouton expand
    const expand = wrapper.findAll('button[aria-label="expand"]')
    expect(expand.length).toBe(1)
    await expand[0].trigger('click')
    const items = wrapper.findAll('[role="treeitem"]')
    expect(items.length).toBe(3)
    // sélection -> emit select(key)
    await items[1].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['input'])
    wrapper.unmount()
  })

  test('Table : entêtes scope=col, cellules, empty, rowClick', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          { key: 'name', title: 'Nom' },
          { key: 'age', title: 'Âge', align: 'right' },
        ],
        dataSource: [
          { key: '1', name: 'Alice', age: 30 },
          { key: '2', name: 'Bob', age: 25 },
        ],
        rowKey: 'key',
      },
    })
    expect(wrapper.findAll('th[scope="col"]').length).toBe(2)
    expect(wrapper.findAll('tbody tr').length).toBe(2)
    expect(wrapper.findAll('td')[1].text()).toBe('30')
    await wrapper.findAll('tbody tr')[0].trigger('click')
    expect(wrapper.emitted('rowClick')?.[0]).toEqual([
      { key: '1', name: 'Alice', age: 30 },
    ])
    // empty state
    await wrapper.setProps({ dataSource: [] })
    expect(wrapper.text()).toContain('No data')
  })

  test('DatePicker : calendrier localisé, navigation clavier et valeur ISO', async () => {
    const onChange = vi.fn()
    const wrapper = mount(DatePicker, {
      props: { value: '2026-11-21', locale: 'fr-FR', onChange },
      attrs: { min: '2026-11-20', max: '2026-12-10' },
      attachTo: document.body,
    })
    const day = (value: string) =>
      document.querySelector<HTMLElement>(
        `[data-slot="calendar-trigger"][data-value="${value}"]:not([data-outside-view])`,
      )!
    try {
      const trigger = wrapper.get('[data-slot="date-picker"]')
      expect(trigger.text()).toBe('21 novembre 2026')
      await trigger.trigger('click')
      await flushPromises()
      expect(day('2026-11-19').getAttribute('aria-disabled')).toBe('true')
      expect(document.activeElement).toBe(day('2026-11-21'))

      day('2026-11-21').dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          bubbles: true,
        }),
      )
      await flushPromises()
      expect(document.activeElement).toBe(day('2026-11-22'))
      day('2026-11-22').dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
        }),
      )
      await flushPromises()
      expect(onChange).toHaveBeenCalledWith('2026-11-22')
      expect(wrapper.emitted('update:value')).toEqual([['2026-11-22']])
      expect(trigger.attributes('aria-expanded')).toBe('false')

      await wrapper.setProps({ value: '2026-11-22' })
      await trigger.trigger('click')
      await flushPromises()
      const month = document.querySelector<HTMLSelectElement>(
        'select[aria-label="Mois"]',
      )!
      month.value = '12'
      month.dispatchEvent(new Event('change'))
      await flushPromises()
      expect(day('2026-12-01')).toBeTruthy()

      document
        .querySelector<HTMLButtonElement>(
          '[data-slot="popover-content"] button[data-variant="ghost"]',
        )!
        .click()
      expect(onChange).toHaveBeenLastCalledWith('')
      await wrapper.setProps({ value: '', readOnly: true })
      expect(trigger.attributes('disabled')).toBeDefined()
      expect(trigger.text()).toBe('Choisir une date')
    } finally {
      wrapper.unmount()
    }
  })

  test('TimePicker : clic sur le champ, secondes et lecture seule', async () => {
    const onChange = vi.fn()
    const wrapper = mount(TimePicker, {
      props: { value: '10:30:00', onChange },
    })
    const input = wrapper.get('input[type="time"]')
    expect(input.attributes('step')).toBe('1')
    expect(input.classes()).not.toContain(
      '[&::-webkit-calendar-picker-indicator]:hidden',
    )
    const showPicker = vi.fn()
    ;(input.element as HTMLInputElement).showPicker = showPicker
    await input.trigger('click')
    expect(showPicker).toHaveBeenCalledTimes(1)

    await input.setValue('11:45:20')
    expect(onChange).toHaveBeenCalledWith('11:45:20')
    await wrapper.setProps({ readOnly: true })
    await input.trigger('click')
    expect(showPicker).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
