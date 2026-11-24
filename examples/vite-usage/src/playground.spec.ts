// @vitest-environment jsdom
import { describe, test, expect } from 'vitest'
import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FormDemo from './FormDemo.vue'

describe('formivue playground — previimmo stack', () => {
  test('3 typical forms render and react', async () => {
    const wrapper = mount(FormDemo, { attachTo: document.body })
    await nextTick()

    // 1. object field: name present
    const inputNom = wrapper.find('input')
    expect(inputNom.exists()).toBe(true)
    await inputNom.setValue('Jean Dupont')
    const labels = wrapper.text()
    expect(labels).toContain('Tenant')

    // 2. array fields: 2 initial installments + push/remove
    expect(wrapper.findAll('li.flex').length).toBe(2)
    await wrapper.find('[data-testid="add-echeance"]').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Total')

    // 3. dynamic: reaction to select
    const select = wrapper.find('[data-testid="type-bail"]')
    await select.setValue('meuble')
    await nextTick()
    expect(wrapper.find('[data-testid="meuble-detail"]').exists()).toBe(true)

    wrapper.unmount()
  })

  test('changes example and schema labels without clearing the form', async () => {
    const wrapper = mount(FormDemo, { attachTo: document.body })
    const picker = wrapper.get('select[aria-label="Language"]')
    try {
      const name = wrapper.get<HTMLInputElement>('#demo-locataire input')
      await name.setValue('Camille Martin')
      await picker.setValue('fr')
      expect(wrapper.text()).toContain('Profil du locataire')
      expect(
        wrapper
          .get('#demo-designer-schema [role="tab"][aria-selected="true"]')
          .text(),
      ).toBe('Détails')
      await picker.setValue('es')
      expect(wrapper.text()).toContain('Perfil del inquilino')
      expect(
        wrapper
          .get('#demo-designer-schema [role="tab"][aria-selected="true"]')
          .text(),
      ).toBe('Detalles')
      expect(name.element.value).toBe('Camille Martin')
    } finally {
      await picker.setValue('en')
      localStorage.removeItem('formivue-example-language')
      wrapper.unmount()
    }
  })

  test('a11y — axe reports 0 violations on the playground', async () => {
    document.body.innerHTML = ''
    const { default: Axe } = await import('axe-core')
    const wrapper = mount(FormDemo, { attachTo: document.body })
    await nextTick()
    const results = await new Promise<any>((resolve, reject) => {
      Axe.run(document.body, {}, (err: unknown, r: unknown) =>
        err ? reject(err) : resolve(r),
      )
    })
    const violations = results.violations as Array<{
      id: string
      nodes: unknown[]
    }>
    const real = violations.filter((v) => v.nodes.length > 0)
    if (real.length > 0) {
      console.error(
        'violations axe:',
        real.map((v) => `${v.id} (${v.nodes.length})`).join(', '),
      )
    }
    expect(real).toEqual([])
    wrapper.unmount()
  })

  test('renders designer options through the standalone manager', async () => {
    const wrapper = mount(FormDemo, { attachTo: document.body })
    try {
      await nextTick()
      const demo = wrapper.get('#demo-designer-schema')
      expect(demo.get('[data-layout="horizontal"] label').text()).toBe(
        'Region tree',
      )
      expect(demo.get('[data-layout="vertical"] label').text()).toBe('Name')
      expect(
        (demo.get('.formivue-grid').element as HTMLElement).style.gap,
      ).toBe('8px 16px')
      expect(demo.get('[role="tab"][aria-selected="true"]').text()).toBe(
        'Details',
      )
      const text = demo.get('.dn-text')
      expect(text.text()).toContain('First line')
      expect(text.element.textContent).toContain('\n\n')
      expect((text.element as HTMLElement).style.whiteSpace).toBe('pre-wrap')
      expect(demo.get('.dn-text strong').text()).toBe('any record')

      const panel = (title: string) =>
        demo
          .findAll('button[aria-expanded]')
          .find((b) => b.text().includes(title))!
      expect(panel('Instructions').attributes('aria-expanded')).toBe('true')
      await panel('Notes').trigger('click')
      expect(panel('Instructions').attributes('aria-expanded')).toBe('false')
      expect(panel('Notes').attributes('aria-expanded')).toBe('true')

      const slider = demo.get('[role="slider"]')
      expect(slider.attributes('aria-valuenow')).toBe('0')
      expect(demo.find('[data-slot="slider-value"]').exists()).toBe(false)
      await slider.trigger('keydown', { key: 'ArrowRight' })
      expect(slider.attributes('aria-valuenow')).toBe('0.25')

      const clickChoice = async (selector: string, label: string) => {
        const choice = Array.from(document.querySelectorAll(selector)).find(
          (item) => item.textContent?.trim() === label,
        )
        expect(choice).toBeDefined()
        await new DOMWrapper(choice!).trigger('click')
      }
      const tree = demo.get('[data-slot="tree-select"]')
      await tree.trigger('click')
      await clickChoice('[role="treeitem"][aria-level="3"]', 'Brittany')
      expect(tree.text()).toContain('Brittany')
      const cascader = demo.get('[data-slot="cascader"]')
      await cascader.trigger('click')
      await clickChoice('[role="option"]', 'Europe')
      await clickChoice('[role="option"]', 'France')
      await clickChoice('[role="option"]', 'Normandy')
      expect(cascader.text()).toContain('Europe / France / Normandy')

      const cards = demo.get('.dn-array-cards')
      expect(cards.findAll('button[disabled]')).toHaveLength(2)
      await cards
        .findAll('button')
        .find((b) => b.text() === 'Add a contact card')!
        .trigger('click')
      expect(cards.findAll('input')).toHaveLength(4)
      expect(
        (cards.findAll('input')[2].element as HTMLInputElement).value,
      ).toBe('Alice')

      const table = demo.get('.dn-array-table')
      await table
        .get('button[aria-keyshortcuts]')
        .trigger('keydown', { key: 'ArrowDown' })
      expect(
        (table.get('tbody tr input').element as HTMLInputElement).value,
      ).toBe('Camille')
      await table
        .findAll('button')
        .find((b) => b.text() === 'Add a table row')!
        .trigger('click')
      const rows = table.findAll('tbody tr')
      expect(rows).toHaveLength(3)
      expect(
        (rows[2].findAll('input')[1].element as HTMLInputElement).value,
      ).toBe('Paris')
    } finally {
      wrapper.unmount()
    }
  })
})
