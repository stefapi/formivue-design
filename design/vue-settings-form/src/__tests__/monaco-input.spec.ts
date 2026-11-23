// Phase 5.3 — spec MonacoInput : le loader @monaco-editor/loader est MOCKÉ
// (aucun CDN en test) — on vérifie le wrapper Vue maison (create/setValue/
// dispose/onMount), les thèmes/config (initMonaco), la validation babel
// (markers severity 8), le submit debounce 1 s et l'extraLib.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { Layout } from '@formivue-design/vue'

// le faux éditeur adosse sa valeur à un store (getValue/setValue cohérents —
// le vrai monaco rend la valeur de création, le faux doit aussi)
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
      // enums référencées par initMonaco (config d'ère)
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

// format() charge prettier depuis le CDN — mocké ici (réseau interdit en test)
vi.mock('../components/MonacoInput/format', () => ({
  format: vi.fn(async (_language: string, source: string) => source),
}))

import { MonacoInput } from '../index'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mounted: any[] = []
afterEach(() => {
  while (mounted.length) {
    try {
      mounted.pop()?.unmount()
    } catch {}
  }
  fakeEditorValue.current = ''
  fakeEditor.listeners.length = 0
  document.body.innerHTML = ''
})
const register = (w: any) => {
  mounted.push(w)
  return w
}

const mountInput = (props: any = {}) =>
  register(
    mount(
      defineComponent({
        setup: () => () =>
          h(
            Layout,
            { prefixCls: 'dn-' },
            {
              default: () => h(MonacoInput as any, { ...props }),
            },
          ),
      }),
      { attachTo: document.body },
    ) as any,
  )

describe('vue-settings-form — MonacoInput (loader mocké)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('loader statique exposé (contrat MonacoInput.loader)', () => {
    expect((MonacoInput as any).loader).toBeDefined()
    expect((MonacoInput as any).loader.init).toBeDefined()
  })

  test('montage → initMonaco (thèmes + compilateur TS) + create + onMount', async () => {
    const onMount = vi.fn()
    mountInput({ language: 'javascript.expression', value: 'a.b', onMount })
    await delay(10)
    expect(fakeMonaco.editor.defineTheme).toHaveBeenCalledWith(
      'monokai',
      expect.anything(),
    )
    expect(fakeMonaco.editor.defineTheme).toHaveBeenCalledWith(
      'chrome-devtools',
      expect.anything(),
    )
    expect(
      fakeMonaco.languages.typescript.typescriptDefaults.setCompilerOptions,
    ).toHaveBeenCalled()
    expect(onMount).toHaveBeenCalledWith(fakeEditor, fakeMonaco)
    expect(fakeMonaco.editor.create).toHaveBeenCalled()
  })

  test('valeur initiale → format au montage → setValue (loaded)', async () => {
    mountInput({ language: 'json', value: '{"a":1}' })
    await delay(10)
    // format (mocké) puis setValue du contenu formaté + classe loaded
    expect(fakeEditor.setValue).toHaveBeenCalledWith('{"a":1}')
    expect(document.querySelector('.dn-monaco-input')!.className).toContain(
      'loaded',
    )
  })

  test('a JSON edit submits without changing Monaco decorations during its content event', async () => {
    const onChange = vi.fn()
    mountInput({ language: 'json', onChange })
    await vi.waitFor(() => expect(fakeEditor.listeners).toHaveLength(1))
    fakeEditor.setValue('{"updated":true}')
    fakeEditor.listeners[0]()
    await vi.waitFor(
      () => expect(onChange).toHaveBeenCalledWith('{"updated":true}'),
      { timeout: 2500 },
    )
    expect(fakeEditor.deltaDecorations).not.toHaveBeenCalled()
  })

  test("frappe invalide → markers severity 8, PAS de submit (contrat d'ère)", async () => {
    const onChange = vi.fn()
    mountInput({ language: 'typescript.expression', onChange })
    await delay(10)
    // frappe invalide : le handler de contenu appelle onChangeHandler
    const handler = fakeEditor.listeners[0]
    fakeEditor.setValue('((( ')
    handler(fakeEditor.getValue())
    // validate TS debounce 240 ms
    await delay(300)
    // markers d'erreur babel (severity 8 = MarkerSeverity.Error)
    expect(fakeMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
      expect.anything(),
      'typescript.expression',
      [
        expect.objectContaining({
          severity: 8,
          startLineNumber: expect.any(Number),
          message: expect.any(String),
        }),
      ],
    )
    // contrat d'ère : une frappe INVALIDE ne soumet PAS (le catch ne
    // calls pas submit — la valeur est retenue jusqu'à validation)
    await delay(1100)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('frappe valide → markers vidés + submit', async () => {
    const onChange = vi.fn()
    mountInput({ language: 'typescript.expression', onChange })
    await delay(10)
    const handler = fakeEditor.listeners[0]
    fakeEditor.setValue('a + b')
    handler(fakeEditor.getValue())
    await delay(300)
    expect(fakeMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
      expect.anything(),
      'typescript.expression',
      [],
    )
    await delay(1100)
    expect(onChange).toHaveBeenCalledWith('a + b')
  })

  test('extraLib → addExtraLib(uid.d.ts) + dispose au démontage', async () => {
    mountInput({ language: 'typescript', extraLib: 'declare const x: number' })
    await delay(10)
    expect(
      fakeMonaco.languages.typescript.typescriptDefaults.addExtraLib,
    ).toHaveBeenCalledWith(
      'declare const x: number',
      expect.stringMatching(/\.d\.ts$/),
    )
    // démontage : l'éditeur est disposé
    mounted.pop()?.unmount()
    expect(fakeEditor.dispose).toHaveBeenCalled()
  })

  test('helpLink → documentation MDN sur GitHub', async () => {
    const wrapper = mountInput({ language: 'javascript.expression' })
    await delay(10)
    const link = wrapper.get(`.${'dn-monaco-input'}-helper a`)
    expect(link.attributes('href')).toMatch(
      /^https:\/\/github\.com\/mdn\/content\//,
    )
  })

  test('helpCode → 2e éditeur (lecture seule)', async () => {
    mountInput({
      language: 'json',
      helpCode: '{"help":true}',
    })
    await delay(10)
    expect(fakeMonaco.editor.create).toHaveBeenCalledTimes(2)
    expect(fakeMonaco.editor.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: '{"help":true}', readOnly: true }),
    )
  })
})
