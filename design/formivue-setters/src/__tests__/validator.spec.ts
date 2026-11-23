// Phase 6.3/6.4 — spec ValidatorSetter : monté comme x-component du champ
// x-validator d'un SchemaField settings (registre étendu par `components`,
// contrat d'ère) — FoldItem (Select formats) + ArrayItems interne
// (règles : drawer DrawerSetter, MoveUp/MoveDown/Remove, Addition).
// Le drawer téléporte dans .settings-form-wrapper (fixture en body).
// Le loader monaco est MOCKÉ (aucun CDN en test — recette monaco-input.spec).
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createForm } from '@formivue/core'
import { FormProvider } from '@formivue/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { SchemaField } from '@formivue-design/vue-settings-form'
import { ValidatorSetter } from '../index'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// loader mocké — le faux éditeur adosse sa valeur à un store (recette 5.3)
const fakeEditorValue = { current: '' }
const fakeEditor: any = {
  getValue: vi.fn(() => fakeEditorValue.current),
  setValue: vi.fn((v: string) => {
    fakeEditorValue.current = v
  }),
  getModel: vi.fn(() => ({
    setValue: vi.fn((v: string) => {
      fakeEditorValue.current = v
    }),
    getValue: () => fakeEditorValue.current,
  })),
  onDidChangeModelContent: vi.fn((cb: any) => {
    fakeEditor.listeners.push(cb)
    return { dispose: vi.fn() }
  }),
  deltaDecorations: vi.fn(() => []),
  dispose: vi.fn(),
  listeners: [] as any[],
}
const fakeMonaco: any = {
  editor: {
    create: vi.fn((_: any, options: any) => {
      fakeEditorValue.current = options?.value ?? ''
      return fakeEditor
    }),
    defineTheme: vi.fn(),
    setModelMarkers: vi.fn(),
  },
  languages: {
    typescript: {
      typescriptDefaults: {
        setCompilerOptions: vi.fn(),
        setDiagnosticsOptions: vi.fn(),
        addExtraLib: vi.fn(() => ({ dispose: vi.fn() })),
      },
      ScriptTarget: { Latest: 99 },
      ModuleResolutionKind: { NodeJs: 1 },
      ModuleKind: { CommonJS: 1 },
      JsxEmit: { React: 1 },
    },
    registerDocumentFormattingEditProvider: vi.fn(),
  },
  Range: class Range {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number,
    ) {}
  },
}
vi.mock('@monaco-editor/loader', () => ({
  default: {
    init: vi.fn(() => Promise.resolve(fakeMonaco)),
    config: vi.fn(),
  },
}))

const mounted: any[] = []
const register = (x: any) => {
  mounted.push(x)
  return x
}
afterEach(() => {
  while (mounted.length) {
    try {
      mounted.pop()?.unmount()
    } catch {}
  }
  document.body.innerHTML = ''
})

const mountSetter = (value: any) => {
  const form = createForm({ values: { 'x-validator': value } })
  const wrapper = register(
    mount(
      defineComponent({
        setup() {
          return () =>
            h(
              FormProvider as any,
              { form },
              {
                default: () =>
                  h(SchemaField as any, {
                    schema: {
                      type: 'object',
                      properties: {
                        'x-validator': {
                          type: 'array',
                          'x-component': 'ValidatorSetter',
                        },
                      },
                    },
                    components: { ValidatorSetter },
                  }),
              },
            )
        },
      }) as any,
      { attachTo: document.body },
    ),
  )
  return { wrapper, form }
}

const bodyText = () => document.body.textContent ?? ''
const bodyButtons = () => [...document.body.querySelectorAll('button')]

// le FoldItem rend l'Extra uniquement déplié (défaut replié, contrat d'ère) ;
// le titre bascule l'expand (recette editors.spec 5.2)
const expandFold = async () => {
  // ExpandedMap persiste l'état par adresse de champ — ne PAS re-plier un
  // fold déjà ouvert (les tests partagent l'adresse x-validator)
  if (document.body.textContent?.includes('Edit Rules')) return
  if (document.body.textContent?.includes('Add Validator Rules')) return
  const title = document.body.querySelector(
    '[class*="fold-item-title"]',
  ) as HTMLElement
  title.click()
  await nextTick()
  await delay(50)
}

describe('ValidatorSetter — FoldItem + ArrayItems interne (x-validator)', () => {
  beforeEach(() => {
    // layout global minimal (Designer en production) : usePrefix → dn-*
    ;(globalThis as any).__FORMIVUEDESIGN_LAYOUT__ = { prefixCls: 'dn-' }
    // le DrawerSetter téléporte dans le wrapper du panneau (contrat d'ère —
    // classe = usePrefix('settings-form-wrapper') = dn-settings-form-wrapper)
    const wrapper = document.createElement('div')
    wrapper.className = 'dn-settings-form-wrapper'
    document.body.appendChild(wrapper)
  })

  test('Base : Select des formats (options ValidatorFormats, valeur/onChange)', async () => {
    const { form } = mountSetter('url')
    await nextTick()
    await delay(50)
    // placeholder ou valeur sélectionnée ; options = formats d'ère
    const trigger = document.body.querySelector(
      '[role="combobox"]',
    ) as HTMLElement
    expect(trigger).toBeTruthy()
    // valeur string d'ère (format simple) → label résolu
    expect(trigger.textContent).toContain('URL')
    // ouverture reka : pointerdown (leçon phase 2)
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    await delay(100)
    const options = [
      ...document.body.querySelectorAll('[role="option"]'),
    ] as HTMLElement[]
    expect(options.map((o) => o.textContent)).toContain('Email')
    const email = options.find((o) => o.textContent === 'Email')!
    email.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    email.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await nextTick()
    await delay(200)
    // write-through : le format sélectionné écrit dans form.values
    expect((form.values as any)['x-validator']).toBe('email')
  })

  test('Extra : Addition → règle, drawer réglages (champs ère), ops maison', async () => {
    const { form } = mountSetter([])
    await nextTick()
    await delay(50)
    await expandFold()
    // pas de rangée : tableau vide → juste l'addition
    expect(bodyText()).not.toContain('Edit Rules')
    const add = bodyButtons().find((b) =>
      b.textContent?.includes('Add Validator Rules'),
    ) as HTMLElement
    expect(add).toBeTruthy()
    add.click()
    await nextTick()
    await delay(200)
    expect((form.values as any)['x-validator']).toEqual([{}])
    // une règle → trigger DrawerSetter par rangée + tri maison + remove
    expect(bodyText()).toContain('Edit Rules')
    // Les opérations ArrayBase portent un libellé accessible.
    const rowButtons = bodyButtons().filter((b) =>
      ['Move up', 'Move down', 'Remove'].includes(
        b.getAttribute('aria-label') ?? '',
      ),
    )
    expect(rowButtons.length).toBeGreaterThanOrEqual(3)
    // ouverture du drawer (téléporté dans .dn-settings-form-wrapper)
    const drawerTrigger = bodyButtons().find((b) =>
      b.textContent?.includes('Edit Rules'),
    ) as HTMLElement
    drawerTrigger.click()
    await nextTick()
    await delay(300)
    // champs de règle d'ère (locales settings.x-validator.* via propsSchema)
    expect(bodyText()).toContain('Trigger Type')
    expect(bodyText()).toContain('Custom Validator')
    expect(bodyText()).toContain('Error Message')
    expect(bodyText()).toContain('Format')
    expect(bodyText()).toContain('RegExp')
    expect(
      bodyButtons().some((b) => b.getAttribute('aria-label') === 'Close'),
    ).toBe(true)
  })

  test('Remove d’une règle → valeur vidée', async () => {
    const { form } = mountSetter([{ format: 'url' }])
    await nextTick()
    await delay(50)
    await expandFold()
    const remove = bodyButtons().filter(
      (b) => b.getAttribute('aria-label') === 'Remove',
    )
    // les Remove des rangées (le Select formats n'en a pas)
    expect(remove.length).toBeGreaterThanOrEqual(1)
    ;(remove[remove.length - 1] as HTMLElement).click()
    await nextTick()
    await delay(200)
    expect((form.values as any)['x-validator']).toEqual([])
  })
})
