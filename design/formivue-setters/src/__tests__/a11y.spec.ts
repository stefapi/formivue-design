// Phase 6.4 (V8) — a11y : axe-core sur les TROIS setters rendus (dialog
// DataSource ouvert, dialog Reactions ouvert avec contenu, ValidatorSetter
// via un SchemaField settings). Cible 0 violation (règle 7 : correction, pas
// constat). Recette a11y.spec des phases 2/5 : Axe.run(document.body).
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createForm } from '@formivue/core'
import { FormProvider } from '@formivue/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { SchemaField } from '@formivue-design/vue-settings-form'
import { DataSourceSetter, ReactionsSetter, ValidatorSetter } from '../index'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// loader mocké (recette 5.3 — aucun CDN en test)
const fakeMonaco: any = {
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      getModel: vi.fn(() => ({
        setValue: vi.fn(),
        getValue: () => '',
      })),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      deltaDecorations: vi.fn(() => []),
      dispose: vi.fn(),
    })),
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
  vi.unstubAllGlobals()
})

const runAxe = async () => {
  const { default: Axe } = await import('axe-core')
  // modal sémantique : reka masque le fond du dialog via aria-hidden
  // (package aria-hidden, sans inert) — rendre le fond non focusable est un
  // comportement APPLICATIF (le playground l'appliquera en 7.3) ; on
  // l'instrumente ici pour n'auditer que le code du repo.
  document.querySelectorAll('body > [aria-hidden="true"]').forEach((el) => {
    // attribut (jsdom ne reflète pas el.inert — axe audite l'attribut)
    el.setAttribute('inert', '')
    ;(el as HTMLElement).inert = true
  })
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
      'violations axe :',
      JSON.stringify(
        real.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        null,
        2,
      ),
    )
  }
  return real
}

describe('a11y (V8) — formivue/setters : axe-core = 0 violation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve('declare module "@formivue/core"{}'),
        }),
      ) as any,
    )
  })

  test('DataSourceSetter : dialog ouvert (arbre + propriétés) → 0 violation', async () => {
    const wrapper = register(
      mount(DataSourceSetter as any, {
        props: {
          value: [
            { label: 'Option A', value: 'a' },
            {
              label: 'Group',
              value: 'g',
              children: [{ label: 'Child', value: 'c' }],
            },
          ],
          onChange: vi.fn(),
        },
        attachTo: document.body,
      }),
    )
    await wrapper.get('button').trigger('click')
    await nextTick()
    await delay(100)
    // sélection d'un nœud → panneau des propriétés rendu
    ;(
      [...document.body.querySelectorAll('[role="treeitem"]')] as HTMLElement[]
    )[0].click()
    await nextTick()
    await delay(100)
    expect(await runAxe()).toEqual([])
  })

  test('ReactionsSetter : dialog ouvert (panels + tableau + Monaco) → 0 violation', async () => {
    const wrapper = register(
      mount(ReactionsSetter as any, {
        props: {
          value: {
            dependencies: [
              {
                source: 'aa',
                property: 'value',
                name: 'aa1',
                type: 'string',
              },
            ],
          },
          onChange: vi.fn(),
        },
        attachTo: document.body,
      }),
    )
    await wrapper.get('button').trigger('click')
    await nextTick()
    await delay(600)
    expect(document.body.textContent).toContain('Associated Fields')
    expect(await runAxe()).toEqual([])
  })

  test('ValidatorSetter : FoldItem + règles + drawer → 0 violation', async () => {
    document.title = 'setters a11y'
    document.documentElement.lang = 'en'
    const form = createForm({ values: { 'x-validator': [{ format: 'url' }] } })
    register(
      mount(
        defineComponent({
          setup() {
            return () =>
              // landmark main (l'app réelle le fournit — recette phases 2/5)
              h('main', [
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
                ),
              ])
          },
        }) as any,
        { attachTo: document.body },
      ),
    )
    await nextTick()
    await delay(200)
    // replié par défaut (contrat d'ère) : on déplie pour couvrir rangées +
    // drawer + opérations dans le scan axe
    const title = document.body.querySelector(
      '[class*="fold-item-title"]',
    ) as HTMLElement
    title?.click()
    await nextTick()
    await delay(200)
    // une règle → rangée + drawer trigger + ops maison
    expect(document.body.textContent).toContain('Edit Rules')
    expect(await runAxe()).toEqual([])
  })
})
