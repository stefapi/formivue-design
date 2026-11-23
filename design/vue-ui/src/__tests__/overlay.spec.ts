// Phase 2.2 — overlay : Tooltip (trigger), Popover, Dialog, Menu (ouverts).
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { Button, Dialog, Menu, Popover, Tooltip } from '../index'

describe('@formivue-design/vue-ui — overlays', () => {
  test('Tooltip : trigger rendu via asChild', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'aide' },
      slots: { default: () => h(Button, () => 'Action') },
    })
    expect(wrapper.get('button').text()).toBe('Action')
  })

  test('Popover : open -> content + title (portail)', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(Popover, {
      props: { open: true, title: 'Titre pop' },
      slots: {
        default: () => h(Button, () => 'declencheur'),
        content: () => 'corps',
      },
    })
    await nextTick()
    expect(document.body.textContent).toContain('Titre pop')
    expect(document.body.textContent).toContain('corps')
    wrapper.unmount()
  })

  test('Dialog : open -> role=dialog + aria-labelledby + title + footer + close', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(Dialog, {
      props: { open: true, title: 'Confirmer' },
      slots: {
        default: () => 'corps du dialog',
        footer: () => h(Button, { type: 'primary' }, () => 'OK'),
      },
    })
    await nextTick()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dialog.textContent).toContain('Confirmer')
    expect(dialog.textContent).toContain('corps du dialog')
    expect(dialog.querySelector('[aria-label="Close"]')).toBeTruthy()
    wrapper.unmount()
  })

  test('Dialog : bouton close -> update:open(false)', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(Dialog, { props: { open: true, title: 'X' } })
    await nextTick()
    const close = document.querySelector('[aria-label="Close"]') as HTMLElement
    close.click()
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  test('Menu : open -> role=menu + items + select(key)', async () => {
    document.body.innerHTML = ''
    const wrapper = mount(Menu, {
      props: {
        open: true,
        items: [
          { key: 'copy', label: 'Copier' },
          { key: 'sep', divider: true },
          { key: 'del', label: 'Supprimer', disabled: true },
        ],
      },
      slots: { default: () => h(Button, () => 'Action') },
    })
    await nextTick()
    const menu = document.querySelector('[role="menu"]')
    expect(menu).toBeTruthy()
    expect(document.body.textContent).toContain('Copier')
    const items = [...document.querySelectorAll('[role="menuitem"]')]
    const enabled = items.find(
      (el) => el.getAttribute('data-disabled') !== 'true',
    ) as HTMLElement
    expect(enabled).toBeTruthy()
    enabled.click()
    await nextTick()
    expect(wrapper.emitted('select')?.[0]).toEqual(['copy'])
    wrapper.unmount()
  })
})
