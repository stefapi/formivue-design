// Matériaux backlog V3 levés : Rate, Cascader, TreeSelect, Transfer, Upload /
// UploadDragger, DateRangePicker / TimeRangePicker (contrat value/onChange).
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  Cascader,
  DateRangePicker,
  Rate,
  TimeRangePicker,
  Transfer,
  TreeSelect,
  Upload,
  UploadDragger,
} from '../index'

const tree = [
  {
    label: 'Europe',
    value: 'eu',
    children: [
      {
        label: 'France',
        value: 'fr',
        children: [
          { label: 'Paris', value: 'paris' },
          { label: 'Lyon', value: 'lyon' },
        ],
      },
    ],
  },
  { label: 'Asie', value: 'asia' },
]

const portal = (selector: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(selector))

const flush = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
  await nextTick()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('@formivue-design/vue-ui — Rate', () => {
  test('clic → valeur, re-clic efface (allowClear), slider a11y', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Rate, { props: { value: 2, onChange } })
    const slider = wrapper.get('[role="slider"]')
    expect(slider.attributes('aria-valuenow')).toBe('2')
    expect(slider.attributes('aria-valuemax')).toBe('5')
    const stars = wrapper.findAll('[data-slot="rate"] > span')
    expect(stars).toHaveLength(5)
    await stars[3].trigger('click')
    expect(onChange).toHaveBeenLastCalledWith(4)
    await stars[1].trigger('click')
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  test('clavier : flèches par pas (demi en allowHalf), Home/End', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Rate, {
      props: { value: 2, allowHalf: true, count: 4, onChange },
    })
    const slider = wrapper.get('[role="slider"]')
    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(2.5)
    await slider.trigger('keydown', { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(4)
    await slider.trigger('keydown', { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  test('readOnly : aucun changement', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Rate, {
      props: { value: 3, readOnly: true, onChange },
    })
    await wrapper.findAll('[data-slot="rate"] > span')[0].trigger('click')
    expect(onChange).not.toHaveBeenCalled()
    expect(wrapper.get('[role="slider"]').attributes('tabindex')).toBe('-1')
  })
})

describe('@formivue-design/vue-ui — Cascader', () => {
  test('affiche le chemin, navigation par colonnes jusqu’à la feuille', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Cascader, {
      props: { options: tree, value: ['eu', 'fr', 'lyon'], onChange },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('Europe / France / Lyon')
    await wrapper.get('[data-slot="cascader"]').trigger('click')
    await flush()
    // colonnes ouvertes sur le chemin courant
    expect(portal('[role="listbox"]')).toHaveLength(3)
    portal('[role="option"]')
      .find((o) => o.textContent === 'Paris')!
      .click()
    await flush()
    expect(onChange).toHaveBeenLastCalledWith(['eu', 'fr', 'paris'])
    wrapper.unmount()
  })

  test('changeOnSelect : un nœud intermédiaire devient la valeur', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Cascader, {
      props: { options: tree, changeOnSelect: true, onChange },
      attachTo: document.body,
    })
    await wrapper.get('[data-slot="cascader"]').trigger('click')
    await flush()
    portal('[role="option"]')
      .find((o) => o.textContent === 'Europe')!
      .click()
    await flush()
    expect(onChange).toHaveBeenLastCalledWith(['eu'])
    wrapper.unmount()
  })
})

describe('@formivue-design/vue-ui — TreeSelect', () => {
  test('simple : choix d’un nœud → valeur scalaire', async () => {
    const onChange = vi.fn()
    const wrapper = mount(TreeSelect, {
      props: { options: tree, treeDefaultExpandAll: true, onChange },
      attachTo: document.body,
    })
    await wrapper.get('[data-slot="tree-select"]').trigger('click')
    await flush()
    const items = portal('[role="treeitem"]')
    expect(items.map((i) => i.getAttribute('aria-level'))).toEqual([
      '1',
      '2',
      '3',
      '3',
      '1',
    ])
    items.find((i) => i.textContent?.includes('Lyon'))!.click()
    await flush()
    expect(onChange).toHaveBeenLastCalledWith('lyon')
    wrapper.unmount()
  })

  test('multiple : cocher un parent coche sa descendance, libellés affichés', async () => {
    const onChange = vi.fn()
    const wrapper = mount(TreeSelect, {
      props: { options: tree, multiple: true, value: ['asia'], onChange },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('Asie')
    await wrapper.get('[data-slot="tree-select"]').trigger('click')
    await flush()
    portal('[role="treeitem"]')
      .find((i) => i.textContent?.includes('Europe'))!
      .click()
    expect(onChange).toHaveBeenLastCalledWith([
      'asia',
      'eu',
      'fr',
      'paris',
      'lyon',
    ])
    wrapper.unmount()
  })

  test('recherche : ne garde que les branches correspondantes', async () => {
    const wrapper = mount(TreeSelect, {
      props: { options: tree, showSearch: true },
      attachTo: document.body,
    })
    await wrapper.get('[data-slot="tree-select"]').trigger('click')
    await flush()
    const search = portal('input[type="search"]')[0] as HTMLInputElement
    search.value = 'lyo'
    search.dispatchEvent(new Event('input'))
    await flush()
    expect(portal('[role="treeitem"]').map((i) => i.textContent)).toEqual([
      'Europe',
      'France',
      'Lyon',
    ])
    wrapper.unmount()
  })
})

describe('@formivue-design/vue-ui — Transfer', () => {
  const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c', disabled: true },
  ]

  test('cocher puis transférer → valeur cible, tout cocher ignore les désactivés', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Transfer, {
      props: { options, value: [], onChange, titles: ['Gauche', 'Droite'] },
    })
    const [left] = wrapper.findAll('[role="group"]')
    expect(left.attributes('aria-label')).toBe('Gauche')
    // case shadcn (reka Checkbox, role=checkbox)
    const all = left.get('[role="checkbox"][aria-label="Select all Gauche"]')
    expect(all.attributes('aria-checked')).toBe('false')
    await all.trigger('click')
    expect(all.attributes('aria-checked')).toBe('true')
    await wrapper.get('button[aria-label="Move to target"]').trigger('click')
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  test('oneWay : retrait par la croix, pas de bouton retour', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Transfer, {
      props: { options, value: ['a', 'b'], oneWay: true, onChange },
    })
    expect(wrapper.find('button[aria-label="Move to source"]').exists()).toBe(
      false,
    )
    await wrapper.get('button[aria-label="Remove A"]').trigger('click')
    expect(onChange).toHaveBeenLastCalledWith(['b'])
  })
})

describe('@formivue-design/vue-ui — Upload', () => {
  const pick = async (wrapper: any, files: File[]) => {
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: files,
      configurable: true,
    })
    await input.trigger('change')
  }

  beforeEach(() => {
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:mock')
    ;(URL as any).revokeObjectURL = vi.fn()
  })

  test('sans action : fichier local « done », maxCount, retrait', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Upload, {
      props: { multiple: true, maxCount: 2, onChange },
    })
    await pick(wrapper, [
      new File(['1'], 'a.txt'),
      new File(['2'], 'b.txt'),
      new File(['3'], 'c.txt'),
    ])
    const files = onChange.mock.lastCall![0]
    expect(files.map((f: any) => f.name)).toEqual(['b.txt', 'c.txt'])
    expect(files.every((f: any) => f.status === 'done')).toBe(true)
    await wrapper.setProps({ value: files })
    await wrapper.get('button[aria-label="Remove b.txt"]').trigger('click')
    expect(onChange.mock.lastCall![0].map((f: any) => f.name)).toEqual([
      'c.txt',
    ])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  test('avec action : envoi XHR multipart puis statut done + url de la réponse', async () => {
    const sent: any[] = []
    class FakeXHR {
      upload: any = {}
      status = 200
      statusText = 'OK'
      responseText = '{"url":"https://cdn/x.txt"}'
      withCredentials = false
      onload: any
      onerror: any
      headers: Record<string, string> = {}
      open(method: string, url: string) {
        sent.push({ method, url })
      }
      setRequestHeader(k: string, v: string) {
        this.headers[k] = v
      }
      send(body: FormData) {
        sent.push({ body, headers: this.headers })
        this.onload()
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
    const onChange = vi.fn()
    const wrapper = mount(Upload, {
      props: {
        action: '/api/upload',
        name: 'doc',
        headers: { 'X-Token': 't' },
        data: { folder: 'f' },
        onChange,
      },
    })
    await pick(wrapper, [new File(['x'], 'x.txt')])
    expect(sent[0]).toEqual({ method: 'POST', url: '/api/upload' })
    expect((sent[1].body as FormData).get('doc')).toBeInstanceOf(File)
    expect((sent[1].body as FormData).get('folder')).toBe('f')
    expect(sent[1].headers).toEqual({ 'X-Token': 't' })
    const last = onChange.mock.lastCall![0][0]
    expect(last.status).toBe('done')
    expect(last.url).toBe('https://cdn/x.txt')
    vi.unstubAllGlobals()
  })

  test('Dragger : dépôt de fichier, zone focusable nommée', async () => {
    const onChange = vi.fn()
    const wrapper = mount(UploadDragger, {
      props: { textContent: 'Déposez ici', onChange },
    })
    const zone = wrapper.get('[role="button"]')
    expect(zone.attributes('aria-label')).toBe('Déposez ici')
    expect(zone.attributes('tabindex')).toBe('0')
    await zone.trigger('drop', {
      dataTransfer: {
        files: [new File(['d'], 'd.png', { type: 'image/png' })],
      },
    })
    expect(onChange.mock.lastCall![0][0].name).toBe('d.png')
  })
})

describe('@formivue-design/vue-ui — plages date / heure', () => {
  test('DateRangePicker : RangeCalendar shadcn — libellé localisé, sélection début puis fin', async () => {
    const onChange = vi.fn()
    const wrapper = mount(DateRangePicker, {
      props: { value: ['2026-01-10', '2026-01-20'], locale: 'en-US', onChange },
      attachTo: document.body,
    })
    const trigger = wrapper.get('[data-slot="range-picker"]')
    expect(trigger.text()).toContain('Jan 10, 2026 – Jan 20, 2026')
    await trigger.trigger('click')
    await flush()
    // deux mois affichés (recette shadcn : numberOfMonths 2)
    expect(portal('[data-slot="range-calendar-grid"]')).toHaveLength(2)
    const day = (iso: string) =>
      portal(`[data-slot="range-calendar-trigger"][data-value="${iso}"]`)[0]
    expect(day('2026-01-10').hasAttribute('data-selection-start')).toBe(true)
    expect(day('2026-01-20').hasAttribute('data-selection-end')).toBe(true)
    portal('[data-slot="range-calendar-next-button"]')[0].click()
    await flush()
    expect(
      portal('[data-slot="range-calendar-heading"]')[0].textContent,
    ).toContain('March')
    portal('[data-slot="range-calendar-prev-button"]')[0].click()
    await flush()
    day('2026-01-05').click()
    await flush()
    day('2026-01-08').click()
    await flush()
    expect(onChange).toHaveBeenLastCalledWith(['2026-01-05', '2026-01-08'])
    wrapper.unmount()
  })

  test('DateRangePicker showTime : heures de début / fin → YYYY-MM-DDTHH:mm', async () => {
    const onChange = vi.fn()
    const wrapper = mount(DateRangePicker, {
      props: {
        value: ['2026-03-01T08:00', '2026-03-02T18:30'],
        showTime: true,
        locale: 'en-US',
        onChange,
      },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('08:00')
    await wrapper.get('[data-slot="range-picker"]').trigger('click')
    await flush()
    const end = portal('input[aria-label="End time"]')[0] as HTMLInputElement
    expect(end.value).toBe('18:30')
    end.value = '19:45'
    end.dispatchEvent(new Event('change'))
    expect(onChange).toHaveBeenLastCalledWith([
      '2026-03-01T08:00',
      '2026-03-02T19:45',
    ])
    wrapper.unmount()
  })

  test('TimeRangePicker : inputs time ; tout vider → []', async () => {
    const onChange = vi.fn()
    const wrapper = mount(TimeRangePicker, {
      props: { value: ['08:00:00', ''], locale: 'fr-FR', onChange },
      attrs: { id: 'hours' },
    })
    const [start, end] = wrapper.findAll('input')
    expect(start.attributes('id')).toBe('hours')
    expect(end.attributes('min')).toBe('08:00:00')
    expect(end.attributes('aria-label')).toBe('Heure de fin')
    expect(start.attributes('type')).toBe('time')
    const showStartPicker = vi.fn()
    const showEndPicker = vi.fn()
    ;(start.element as HTMLInputElement).showPicker = showStartPicker
    ;(end.element as HTMLInputElement).showPicker = showEndPicker
    await start.trigger('click')
    expect(showStartPicker).toHaveBeenCalledTimes(1)
    expect(showEndPicker).not.toHaveBeenCalled()
    await end.trigger('click')
    expect(showStartPicker).toHaveBeenCalledTimes(1)
    expect(showEndPicker).toHaveBeenCalledTimes(1)

    await start.setValue('')
    await start.trigger('change')
    expect(onChange).toHaveBeenLastCalledWith([])
    wrapper.unmount()
  })
})
