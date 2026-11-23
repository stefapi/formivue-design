// Phase 5.2 — spec éditeurs : montage isolé des composants du panneau
// (SizeInput/ValueInput polymorphes, ColorInput, Corner/Position, FoldItem,
// CollapseItem, InputItems, BoxStyleSetter, DrawerSetter).
// Recettes : Layout @formivue-design/vue pour usePrefix (cf. widgets.spec phase 3),
// pointerup pour les options reka, setValue pour les inputs form-friendly.
import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { GlobalRegistry } from '@formivue-design/core'
import { Layout } from '@formivue-design/vue'
import { FieldSymbol } from '@formivue/vue'
import {
  BoxStyleSetter,
  ColorInput,
  parseColor,
  toRgbaString,
  CollapseItem,
  CornerInput,
  DrawerSetter,
  FoldItem,
  ImageInput,
  InputItems,
  PositionInput,
  SizeInput,
  ValueInput,
} from '../index'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mounted: any[] = []
afterEach(() => {
  while (mounted.length) {
    try {
      mounted.pop()?.unmount()
    } catch {}
  }
  document.body.innerHTML = ''
})
const register = (w: any) => {
  mounted.push(w)
  return w
}

// usePrefix exige un Layout (recette widgets.spec) — tous les montages
// isolés passent par ici. `fieldAddress` fournit un contexte FieldSymbol
// factice (FoldItem key l'état expand par adresse de champ — isolation des
// tests via adresses uniques).
let fieldSeed = 0
const mountInLayout = (
  child: () => any,
  options: { attachTo?: HTMLElement } = {},
  fieldAddress?: string,
) =>
  register(
    mount(
      defineComponent({
        setup() {
          if (fieldAddress) {
            provide(
              FieldSymbol,
              ref({
                address: { toString: () => fieldAddress },
                title: 'Field',
              } as any),
            )
          }
          return () =>
            h(Layout, { prefixCls: 'dn-' }, { default: () => child() })
        },
      }),
      options,
    ) as any,
  )

const editor = (component: any, props: any, fieldAddress?: string) =>
  mountInLayout(() => h(component, { ...props }), {}, fieldAddress)

describe('vue-settings-form — éditeurs', () => {
  test('ImageInput intègre le fichier local quand aucun serveur n’est configuré', async () => {
    const onChange = vi.fn()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    try {
      const wrapper = editor(ImageInput, { onChange })
      const input = wrapper.get('input[type="file"]')
      Object.defineProperty(input.element, 'files', {
        value: [new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })],
      })
      await input.trigger('change')
      await vi.waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          'data:image/svg+xml;base64,PHN2Zy8+',
        ),
      )
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  test('SizeInput : valeur px → NumberPicker, cycle % → onChange transformé', async () => {
    const onChange = vi.fn()
    const wrapper = editor(SizeInput as any, {
      value: '10px',
      onChange,
      exclude: ['inherit', 'auto'],
    })
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('10')
    // le contrôleur affiche le type courant (px)
    const controller = wrapper.findAll('button').at(-1)!
    expect(controller.text()).toContain('px')
    // cycle → % : la valeur mémorisée du type cible (vide → 0%)
    await controller.trigger('click')
    await nextTick()
    expect(onChange).toHaveBeenCalledWith('0%')
    // saisie : reka NumberField ne consomme pas l'event input natif sous
    // VTU — le clavier est la voie testable (recette controls.spec phase 2)
    const kb = wrapper.find('input')
    await kb.trigger('focus')
    await kb.trigger('keydown', { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('11%')
  })

  test('ValueInput : TEXT → Input + onChange brut', async () => {
    const onChange = vi.fn()
    const wrapper = editor(ValueInput as any, { value: 'hello', onChange })
    await nextTick()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'hello',
    )
    await wrapper.find('input').setValue('world')
    expect(onChange).toHaveBeenCalledWith('world')
  })

  test('ValueInput : BOOLEAN → Select True/False, sélection → onChange(bool)', async () => {
    const onChange = vi.fn()
    const wrapper = editor(ValueInput as any, { value: true, onChange })
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(false)
    const trigger = wrapper.get('[role="combobox"]')
    expect(trigger.text()).toContain('True')
    await trigger.trigger('pointerdown')
    await nextTick()
    const options = [...document.querySelectorAll('[role="option"]')]
    expect(options.length).toBe(2)
    options[1].dispatchEvent(new PointerEvent('pointerup'))
    await nextTick()
    expect(onChange).toHaveBeenCalledWith(false)
  })

  test('ValueInput : NUMBER → NumberPicker', async () => {
    const onChange = vi.fn()
    const wrapper = editor(ValueInput as any, { value: -42, onChange })
    await nextTick()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      '-42',
    )
    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(-41)
  })

  test('ValueInput : EXPRESSION → bouton token localisé', async () => {
    const wrapper = editor(ValueInput as any, {
      value: '{{abc}}',
      onChange: () => {},
    })
    await nextTick()
    // le token de locale est résolu (locales du package enregistrées)
    expect(wrapper.text()).toContain('Expression')
  })

  test('ValueInput : valeurs de liste éditables en JSON, avec validation', async () => {
    const onChange = vi.fn()
    const wrapper = editor(ValueInput as any, {
      value: [{ name: 'Initial' }],
      onChange,
      include: ['JSON', 'EXPRESSION'],
      jsonType: 'array',
    })
    const input = wrapper.get('textarea')
    expect(JSON.parse((input.element as HTMLTextAreaElement).value)).toEqual([
      { name: 'Initial' },
    ])
    await input.setValue('[{')
    expect(input.attributes('aria-invalid')).toBe('true')
    await input.setValue('{}')
    expect(wrapper.text()).toContain('JSON array')
    expect(onChange).not.toHaveBeenCalled()
    await input.setValue('[{"name":"Modifié"}]')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(onChange).toHaveBeenCalledWith([{ name: 'Modifié' }])
  })

  test('ColorInput : champ texte brut + palette (hex, présélection, opacité, clavier) → rgba()', async () => {
    const onChange = vi.fn()
    const wrapper = editor(ColorInput as any, {
      value: '#ff0000',
      onChange,
    })
    const input = wrapper.find('input[placeholder="Color"]')
    await input.setValue('#00ff00')
    expect(onChange).toHaveBeenCalledWith('#00ff00')
    // la palette vit dans le Popover (portail) : ouverture
    await wrapper.get('button[aria-label="Pick a color"]').trigger('click')
    await nextTick()
    const hex = document.querySelector(
      'input[aria-label="Hex"]',
    ) as HTMLInputElement
    expect(hex).toBeTruthy()
    // la palette reflète la valeur courante
    expect(hex.value).toBe('FF0000')
    // saisie hex → rgba(…) — format de valeur d'ère (SketchPicker) conservé
    hex.value = '#010203'
    hex.dispatchEvent(new Event('change'))
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith('rgba(1,2,3,1)')
    // couleur prédéfinie
    ;(
      document.querySelector('button[aria-label="#4A90E2"]') as HTMLElement
    ).click()
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith('rgba(74,144,226,1)')
    // opacité en %
    const alpha = document.querySelector(
      'input[aria-label="Opacity percent"]',
    ) as HTMLInputElement
    alpha.value = '50'
    alpha.dispatchEvent(new Event('change'))
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith('rgba(74,144,226,0.5)')
    // curseur d'opacité au clavier (a11y : role slider)
    const alphaSlider = document.querySelector(
      '[role="slider"][aria-label="Opacity"]',
    ) as HTMLElement
    alphaSlider.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    await nextTick()
    expect(onChange).toHaveBeenLastCalledWith('rgba(74,144,226,0.51)')
  })

  test('parseColor / toRgbaString : formats hex courts, longs, alpha, rgba()', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 })
    expect(parseColor('#11223380')).toEqual({ r: 17, g: 34, b: 51, a: 0.5 })
    expect(parseColor('rgba(1, 2, 3, 0.4)')).toEqual({
      r: 1,
      g: 2,
      b: 3,
      a: 0.4,
    })
    expect(parseColor('rgb(10 20 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 })
    expect(parseColor('not a color')).toBeNull()
    expect(toRgbaString({ r: 1, g: 2, b: 3, a: 0.333 })).toBe(
      'rgba(1,2,3,0.33)',
    )
  })

  test('CornerInput : défaut all, clic topLeft → onChange', async () => {
    const onChange = vi.fn()
    const wrapper = editor(CornerInput as any, { onChange })
    const topLeft = wrapper.get('button[aria-label="topLeft"]')
    expect(topLeft.attributes('aria-pressed')).toBe('false')
    expect(
      wrapper.get('button[aria-label="all"]').attributes('aria-pressed'),
    ).toBe('true')
    await topLeft.trigger('click')
    expect(onChange).toHaveBeenCalledWith('topLeft')
    expect(
      wrapper.get('button[aria-label="topLeft"]').attributes('aria-pressed'),
    ).toBe('true')
  })

  test('PositionInput : défaut center, clic left → onChange', async () => {
    const onChange = vi.fn()
    const wrapper = editor(PositionInput as any, { onChange })
    expect(
      wrapper.get('button[aria-label="center"]').attributes('aria-pressed'),
    ).toBe('true')
    await wrapper.get('button[aria-label="left"]').trigger('click')
    expect(onChange).toHaveBeenCalledWith('left')
  })

  test('FoldItem : Base visible, Extra au repli, toggle expand', async () => {
    const wrapper = mountInLayout(() =>
      h(FoldItem as any, { label: 'Margin' } as any, {
        default: () => [
          h(FoldItem.Base as any, null, {
            default: () => [h('div', { class: 'base-slot' }, 'BASE')],
          }),
          h(FoldItem.Extra as any, null, {
            default: () => [h('div', { class: 'extra-slot' }, 'EXTRA')],
          }),
        ],
      }),
    )
    await nextTick()
    expect(wrapper.find('.base-slot').exists()).toBe(true)
    expect(wrapper.find('.extra-slot').exists()).toBe(false)
    // toggle : le titre bascule l'expand (ExpandedMap par adresse)
    await wrapper.get(`[class*="fold-item-title"]`).trigger('click')
    await nextTick()
    expect(wrapper.find('.extra-slot').exists()).toBe(true)
    expect(wrapper.find('.base-slot').exists()).toBe(true)
  })

  test('CollapseItem : defaultExpand=false → contenu caché, header bascule', async () => {
    const wrapper = mountInLayout(() =>
      h(
        CollapseItem as any,
        { defaultExpand: false },
        { default: () => [h('div', { class: 'inner' }, 'CONTENU')] },
      ),
    )
    expect(wrapper.find('.inner').exists()).toBe(true)
    expect(wrapper.get('.dn-collapse-item-content').classes()).toContain(
      'hidden',
    )
    await wrapper.get('button[aria-expanded]').trigger('click')
    await nextTick()
    expect(
      wrapper.get('button[aria-expanded]').attributes('aria-expanded'),
    ).toBe('true')
    expect(wrapper.get('.dn-collapse-item-content').classes()).not.toContain(
      'hidden',
    )
  })

  test("InputItems.Item : lit width du contexte + rend l'icône", () => {
    const wrapper = mountInLayout(() =>
      h(InputItems as any, { width: '50%' } as any, {
        default: () => [
          h(
            InputItems.Item as any,
            { icon: 'Top' },
            { default: () => [h('div', { class: 'ctrl' }, 'X')] },
          ),
        ],
      }),
    )
    const item = wrapper.get('.dn-input-items-item')
    expect(item.attributes('style')).toContain('width: 50%')
    expect(wrapper.find('.ctrl').exists()).toBe(true)
  })

  test('BoxStyleSetter : all → « v v v v », top → remplacement ciblé', async () => {
    const onChange = vi.fn()
    // valeur uniforme → l'éditeur « all » part d'une valeur définie (2px)
    const wrapper = editor(
      BoxStyleSetter as any,
      {
        value: '2px 2px 2px 2px',
        onChange,
      },
      `box-${fieldSeed++}`,
    )
    // base = SizeInput « all » ; l'extra (4 SizeInput) est replié
    const inputs = () => wrapper.findAll('input')
    expect(inputs().length).toBe(1)
    // saisie clavier (reka NumberField, recette phase 2) : 2px + step → partout
    const base = inputs()[0]
    await base.trigger('focus')
    await base.trigger('keydown', { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('3px 3px 3px 3px')
    // déplie → 4 éditeurs positionnels
    await wrapper.get(`[class*="fold-item-title"]`).trigger('click')
    await nextTick()
    expect(inputs().length).toBe(5)
    // top (1er de l'extra, valeur init 2px) → +step remplace le 1er segment
    const top = inputs()[1]
    await top.trigger('focus')
    await top.trigger('keydown', { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('3px 2px 2px 2px')
  })

  test('DrawerSetter : trigger + tiroir téléporté dans le wrapper, fermeture', async () => {
    const wrapper = mountInLayout(
      () =>
        h('div', { class: 'dn-settings-form-wrapper' }, [
          h(DrawerSetter as any, {
            text: 'Configurer',
            triggerProps: { type: 'primary' },
          }),
        ]),
      { attachTo: document.body },
    )
    await nextTick()
    const trigger = wrapper.get('button')
    expect(trigger.text()).toContain('Configurer')
    await trigger.trigger('click')
    await nextTick()
    // le tiroir est téléporté dans le wrapper (pas dans le trigger)
    const drawer = document.querySelector('.dn-drawer-setter')
    expect(drawer).toBeTruthy()
    expect(drawer!.textContent).toContain('Configurer')
    // fermeture : header → démontage après l'animation (150 ms)
    ;(drawer as HTMLElement).querySelector('button')!.click()
    await delay(200)
    expect(document.querySelector('.dn-drawer-setter')).toBeNull()
  })
})
