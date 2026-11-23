// Phase 6.1/6.4 — spec ReactionsSetter : PathSelector (arbre des chemins du
// formulaire designer — Tree maison, transformDataSource verbatim d'ère),
// FieldPropertySetter (liste maison + Monaco mocké), TypeView (tag + tooltip),
// dialog complet (FormCollapse + ArrayTable des dépendances + fulfill.run).
// Monaco et le chargement des déclarations sont simulés.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createDesigner, GlobalRegistry, TreeNode } from '@formivue-design/core'
import { Designer } from '@formivue-design/vue'
import { ReactionsSetter } from '../index'
import { FieldPropertySetter } from '../components/ReactionsSetter/FieldPropertySetter'
import {
  PathSelector,
  transformDataSource,
} from '../components/ReactionsSetter/PathSelector'
import { FieldProperties } from '../components/ReactionsSetter/properties'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// loader mocké (recette 5.3) — le faux éditeur adosse sa valeur à un store
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
      const x = mounted.pop()
      if (x?.wrapper) {
        x.wrapper.unmount?.()
      } else {
        x?.unmount?.()
      }
    } catch {}
    try {
      x?.engine?.unmount?.()
    } catch {}
  }
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

const bodyText = () => document.body.textContent ?? ''
const bodyButtons = () => [...document.body.querySelectorAll('button')]

// ---------------------------------------------------------------------------
// PathSelector — transformDataSource (port verbatim) + arbre des chemins
// ---------------------------------------------------------------------------
describe('PathSelector — transformDataSource (port verbatim ère)', () => {
  test('arbre des chemins relatifs/absolus depuis le nœud sélectionné', () => {
    const root = new TreeNode({
      id: 'form',
      componentName: 'Form',
      props: { type: 'object' },
    })
    root.append(
      new TreeNode({
        id: 'field-bb',
        componentName: 'Field',
        props: { name: 'bb', title: 'BB', type: 'string' },
      }),
    )
    const arrayNode = new TreeNode({
      id: 'array-1',
      componentName: 'Field',
      props: { name: 'rows', type: 'array' },
    })
    root.append(arrayNode)
    const cell1 = new TreeNode({
      id: 'cell-1',
      componentName: 'Field',
      props: { name: 'cell1', title: 'Cell 1', type: 'string' },
    })
    arrayNode.append(cell1)
    arrayNode.append(
      new TreeNode({
        id: 'cell-2',
        componentName: 'Field',
        props: { name: 'cell2', title: 'Cell 2', type: 'string' },
      }),
    )
    // courant = cell1 : exclu de l'arbre ; le tableau frère ne le CONTENANT
    // pas serait exclu (contrat d'ère transformChildren) — ici il le contient
    const dataSource = transformDataSource(cell1)
    expect(dataSource).toHaveLength(2)
    expect(dataSource[0].label).toBe('BB')
    expect(dataSource[0].value).toBe('bb')
    expect(dataSource[1].value).toBe('rows')
    // chemin relatif des frères de tableau (même profondeur → .name)
    expect(dataSource[1].children).toHaveLength(1)
    expect(dataSource[1].children[0].value).toBe('.cell2')
  })
})

describe('PathSelector — composant (contexte designer)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('trigger + arbre des chemins, sélection → onChange(path, node)', async () => {
    const engine = createDesigner()
    engine.workbench.ensureWorkspace()
    const tree = engine.workbench.currentWorkspace.operation.tree
    const root = new TreeNode({
      id: 'form',
      componentName: 'Form',
      props: { type: 'object' },
    })
    tree.append(root)
    const field = new TreeNode({
      id: 'field-1',
      componentName: 'Field',
      props: { name: 'aa', title: 'AA', type: 'string' },
    })
    root.append(field)
    const current = new TreeNode({
      id: 'field-2',
      componentName: 'Field',
      props: { name: 'bb', title: 'BB', type: 'string' },
    })
    root.append(current)
    engine.workbench.currentWorkspace.operation.selection.select(current)
    const onChange = vi.fn()
    register(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              Designer as any,
              { engine },
              {
                default: () =>
                  h(PathSelector as any, {
                    placeholder: 'Please Select',
                    onChange,
                  }),
              },
            ),
        }) as any,
        { attachTo: document.body },
      ),
    )
    await nextTick()
    await delay(50)
    const trigger = bodyButtons().find((b) =>
      b.textContent?.includes('Please Select'),
    ) as HTMLElement
    expect(trigger).toBeTruthy()
    trigger.click()
    await nextTick()
    await delay(300)
    // l'arbre des chemins exclut le nœud courant (BB) et rend les autres champs
    const items = [
      ...document.body.querySelectorAll('[role="treeitem"]'),
    ] as HTMLElement[]
    expect(items.map((i) => i.textContent)).toEqual(['AA'])
    items[0].click()
    await nextTick()
    await delay(100)
    expect(onChange).toHaveBeenCalledWith('aa', expect.any(TreeNode))
  })
})

// ---------------------------------------------------------------------------
// FieldPropertySetter — liste maison + Monaco mocké
// ---------------------------------------------------------------------------
describe('FieldPropertySetter — liste des propriétés + éditeur', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('liste ($self.<prop>), sélection, Monaco re-keyé sur la propriété', async () => {
    const onChange = vi.fn()
    register(
      mount(FieldPropertySetter as any, {
        props: {
          value: { visible: '{{true}}' },
          onChange,
        },
        attachTo: document.body,
      }),
    )
    await nextTick()
    await delay(50)
    const list = [
      ...document.body.querySelectorAll(
        'nav[aria-label="Field properties"] button',
      ),
    ]
    expect(list.length).toBe(FieldProperties.length)
    expect(list.map((b) => b.textContent)).toContain('Show/None')
    expect(list.map((b) => b.textContent)).toContain('Display')
    // visible actif par défaut (aria-current)
    const active = list.find(
      (b) => b.getAttribute('aria-current') === 'true',
    ) as HTMLElement
    expect(active.textContent).toContain('Show/None')
    // Monaco : l'éditeur principal rend l'expression parsée ({{true}} →
    // 'true') — le helpCode d'ère rend un éditeur latéral séparé
    const createValues = (fakeMonaco.editor.create as any).mock.calls.map(
      (c: any[]) => c[1]?.value,
    )
    expect(createValues).toContain('true')
    expect(
      createValues.some((v: string) => v.includes('$deps.VariableName')),
    ).toBe(true)
    // changer de propriété → Monaco re-créé (key) avec la nouvelle expression
    ;(
      list.find((b) => b.textContent?.includes('Display')) as HTMLElement
    ).click()
    await nextTick()
    await delay(50)
    expect(
      [
        ...document.body.querySelectorAll(
          'nav[aria-label="Field properties"] button',
        ),
      ].find((b) => b.getAttribute('aria-current') === 'true')?.textContent,
    ).toContain('Display')
  })
})

// ---------------------------------------------------------------------------
// ReactionsSetter — dialog complet (FormCollapse/ArrayTable/Monaco/declaration)
// ---------------------------------------------------------------------------
describe('ReactionsSetter — dialog (deps/state/run)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('export declare class Form {}'),
        }),
      ) as any,
    )
  })

  test('ouverture → panels + tableau des dépendances + fulfill.run, addition, OK → onChange', async () => {
    const onChange = vi.fn()
    const wrapper = register(
      mount(ReactionsSetter as any, {
        props: {
          value: {
            dependencies: [
              { source: 'aa', property: 'value', name: 'aa1', type: 'string' },
            ],
          },
          onChange,
        },
        attachTo: document.body,
      }),
    )
    expect(wrapper.get('button').text()).toContain('Configure')
    await wrapper.get('button').trigger('click')
    await nextTick()
    // panels d'ère (locales en-US)
    expect(bodyText()).toContain('Associated Fields')
    expect(bodyText()).toContain('Property Reactions')
    expect(bodyText()).toContain('Action Reactions')
    // le tableau des dépendances : colonnes d'ère + une ligne (value d'ère)
    expect(bodyText()).toContain('Source Field')
    expect(bodyText()).toContain('Field Property')
    expect(bodyText()).toContain('Variable Name')
    expect(bodyText()).toContain('Variable Type')
    expect(bodyText()).toContain('Operations')
    const rows = document.body.querySelectorAll('tbody tr')
    expect(rows.length).toBe(1)
    // type de la ligne : tag du type déduit (string)
    expect(bodyText()).toContain('string')
    // PathSelector par ligne : la ligne d'ère porte source 'aa' → le
    // trigger montre le chemin sélectionné
    expect(bodyButtons().some((b) => b.textContent?.trim() === 'aa')).toBe(true)
    // FieldPropertySetter (state) : liste des propriétés
    expect(
      document.body.querySelectorAll('nav[aria-label="Field properties"]')
        .length,
    ).toBeGreaterThanOrEqual(1)
    // addition → une dépendance de plus
    const add = bodyButtons().find((b) =>
      b.textContent?.includes('Add Associated Field'),
    ) as HTMLElement
    add.click()
    await nextTick()
    await delay(200)
    expect(document.body.querySelectorAll('tbody tr').length).toBe(2)
    // la nouvelle ligne (source vide) → placeholder du PathSelector
    expect(
      bodyButtons().some((b) => b.textContent?.includes('Please Select')),
    ).toBe(true)
    // OK → submit → onChange(values)
    const ok = bodyButtons().find((b) => b.textContent === 'OK') as HTMLElement
    ok.click()
    await nextTick()
    await delay(200)
    expect(onChange).toHaveBeenCalled()
    const values = onChange.mock.calls[0][0]
    expect(values.dependencies).toHaveLength(2)
    expect(values.dependencies[0]).toMatchObject({
      source: 'aa',
      property: 'value',
      name: 'aa1',
    })
  })

  test('affiche et enregistre le formulaire quand les déclarations sont inaccessibles', async () => {
    const fetchTypes = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchTypes)
    const onChange = vi.fn()
    const dependency = { source: 'aa', property: 'value', name: 'aa1' }
    const wrapper = register(
      mount(ReactionsSetter as any, {
        props: { value: { dependencies: [dependency] }, onChange },
        attachTo: document.body,
      }),
    )

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(fetchTypes).toHaveBeenCalled())
    expect(bodyText()).toContain('Associated Fields')
    expect(bodyText()).toContain('Property Reactions')
    expect(bodyText()).toContain('Action Reactions')

    bodyButtons()
      .find((button) => button.textContent === 'OK')!
      .click()
    await vi.waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        dependencies: [{ ...dependency, type: 'any' }],
      }),
    )
  })

  // Fix vs ère : le schéma du dialog était une constante module — figée dans
  // la langue du navigateur à l'import. La factory mémoïsée par langue
  // rebuild les titres de panels/colonnes au changement de langue.
  test('changement de langue à dialog ouvert → schéma rebâti (fix vs ère)', async () => {
    GlobalRegistry.setDesignerLanguage('fr-FR')
    const wrapper = register(
      mount(ReactionsSetter as any, {
        props: { value: {}, onChange: vi.fn() },
        attachTo: document.body,
      }),
    )
    await wrapper.get('button').trigger('click')
    await nextTick()
    await delay(600)
    // langage courant = fr → panels/colonnes en français
    expect(bodyText()).toContain('Champs associés')
    expect(bodyText()).toContain('Champ source')
    expect(bodyText()).toContain('Nom de la variable')
    // passage à l'anglais → le dialog suit (schéma mémoïsé par langue)
    GlobalRegistry.setDesignerLanguage('en-US')
    await nextTick()
    await delay(200)
    expect(bodyText()).toContain('Associated Fields')
    expect(bodyText()).toContain('Source Field')
    expect(bodyText()).not.toContain('Champs associés')
    expect(bodyText()).not.toContain('Champ source')
  })
})
