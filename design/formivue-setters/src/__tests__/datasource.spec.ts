// Phase 6.2/6.4 — spec DataSourceSetter : transformations verbatim d'ère
// (aller-retour value ⇄ data), dialog arbre/propriétés (Tree maison + ArrayItems
// interne), sélection → form (write-through dans treeDataSource), tri maison
// MoveUp/MoveDown + Remove, ajout de nœud/paire, allowExtendOption.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { GlobalRegistry } from '@formivue-design/core'
import { DataSourceSetter } from '../index'
import {
  transformDataToValue,
  transformValueToData,
} from '../components/DataSourceSetter/shared'

GlobalRegistry.setDesignerLanguage('en-US')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

const mountSetter = (props: Record<string, any> = {}) => {
  const onChange = vi.fn()
  const wrapper = register(
    mount(DataSourceSetter as any, {
      props: { value: [], onChange, ...props },
      attachTo: document.body,
    }),
  )
  return { wrapper, onChange }
}

const openDialog = async (wrapper: any) => {
  await wrapper.get('button').trigger('click')
  await nextTick()
  await delay(50)
}

const bodyText = () => document.body.textContent ?? ''
const bodyButtons = () => [...document.body.querySelectorAll('button')]
const bodyTreeItems = () =>
  [...document.body.querySelectorAll('[role="treeitem"]')] as HTMLElement[]

describe('DataSourceSetter — transformations (port verbatim ère)', () => {
  test('transformValueToData : value → nœuds (map label/value + children)', () => {
    const data = transformValueToData([
      { label: 'A', value: 'a', children: [{ label: 'B', value: 'b' }] },
    ])
    expect(data).toHaveLength(1)
    expect(data[0].key).toBeTruthy()
    expect(data[0].duplicateKey).toBe(data[0].key)
    expect(data[0].map).toEqual([
      { label: 'label', value: 'A' },
      { label: 'value', value: 'a' },
    ])
    expect(data[0].children).toHaveLength(1)
    expect(data[0].children?.[0].map).toEqual([
      { label: 'label', value: 'B' },
      { label: 'value', value: 'b' },
    ])
  })

  test('aller-retour transformDataToValue(transformValueToData(value)) = value', () => {
    const value = [
      {
        label: 'A',
        value: 'a',
        children: [{ label: 'B', value: 'b', children: [] }],
      },
    ]
    expect(transformDataToValue(transformValueToData(value))).toEqual(value)
  })
})

describe('DataSourceSetter — dialog arbre + propriétés', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('trigger « Configure » + dialog : titres locaux, arbre des options', async () => {
    const { wrapper } = mountSetter({
      value: [{ label: 'Option A', value: 'a' }],
    })
    expect(wrapper.get('button').text()).toContain('Configure')
    await openDialog(wrapper)
    expect(bodyText()).toContain('Options Tree')
    expect(bodyText()).toContain('Node Property')
    expect(bodyText()).toContain('please select node from the tree on the left')
    expect(bodyText()).toContain('Option A')
    expect(bodyText()).toContain('Add Node')
  })

  test('sélection → form des paires (write-through), édition, OK → onChange', async () => {
    const { wrapper, onChange } = mountSetter({
      value: [{ label: 'Option A', value: 'a' }],
    })
    await openDialog(wrapper)
    expect(bodyTreeItems()).toHaveLength(1)
    bodyTreeItems()[0].click()
    await nextTick()
    await delay(50)
    // panneau droit : paires du nœud (label: 'label', value: 'Option A')
    expect(bodyText()).toContain('Add Key Value Pair')
    const inputs = [
      ...document.body.querySelectorAll('input'),
    ] as HTMLInputElement[]
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    expect(inputs[0].value).toBe('label')
    expect(inputs[1].value).toBe('Option A')
    // édition write-through : la valeur éditée remonte dans l'arbre
    inputs[1].value = 'Changed'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    await delay(50)
    expect(bodyText()).toContain('Changed')
    // OK → transformDataToValue → onChange
    const ok = bodyButtons().find((b) => b.textContent === 'OK')
    ok!.click()
    await nextTick()
    await delay(50)
    expect(onChange).toHaveBeenCalled()
    // era-exact : transformDataToValue émet children: [] sur les feuilles
    expect(onChange.mock.calls[0][0]).toEqual([
      { children: [], label: 'Changed', value: 'a' },
    ])
  })

  test('Add Node → nouveau nœud (titre Item N), Remove, tri maison MoveUp/MoveDown', async () => {
    const { wrapper, onChange } = mountSetter({
      value: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ],
    })
    await openDialog(wrapper)
    expect(bodyTreeItems()).toHaveLength(2)
    // tri maison : MoveDown du premier → ordre inversé à la racine
    const firstItem = bodyTreeItems()[0]
    const moveDown = [...firstItem.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Move down',
    ) as HTMLElement
    moveDown.click()
    await nextTick()
    await delay(50)
    expect(
      bodyTreeItems().map((i) => i.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(['B', 'A'])
    // MoveUp : retour à l'ordre initial
    const moveUp = [...bodyTreeItems()[1].querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Move up',
    ) as HTMLElement
    moveUp.click()
    await nextTick()
    await delay(50)
    expect(
      bodyTreeItems().map((i) => i.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(['A', 'B'])
    // Remove d'un nœud (titre du nœud)
    const remove = [...bodyTreeItems()[0].querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Remove',
    ) as HTMLElement
    remove.click()
    await nextTick()
    await delay(50)
    expect(bodyTreeItems()).toHaveLength(1)
    // Add Node → un nœud de plus (label par défaut « Item 3 »)
    const addNode = bodyButtons().find((b) =>
      b.textContent?.includes('Add Node'),
    ) as HTMLElement
    addNode.click()
    await nextTick()
    await delay(50)
    expect(bodyTreeItems()).toHaveLength(2)
    expect(bodyText()).toContain('Item 2')
    // OK : la valeur repart triée + complétée
    const ok = bodyButtons().find((b) => b.textContent === 'OK') as HTMLElement
    ok.click()
    await nextTick()
    await delay(50)
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0]).toEqual([
      { children: [], label: 'B', value: 'b' },
      {
        children: [],
        label: 'Item 2',
        value: expect.any(String),
      },
    ])
  })

  test('ajoute une sous-option au parent sélectionné et conserve plusieurs niveaux', async () => {
    const { wrapper, onChange } = mountSetter({
      value: [{ label: 'Parent', value: 'parent' }],
    })
    await openDialog(wrapper)
    const addSubOption = bodyButtons().find((button) =>
      button.textContent?.includes('Add sub-option'),
    )!
    expect(addSubOption.disabled).toBe(true)

    bodyTreeItems()[0].click()
    await nextTick()
    expect(addSubOption.disabled).toBe(false)
    addSubOption.click()
    await nextTick()
    expect(bodyTreeItems()[0].getAttribute('aria-expanded')).toBe('true')
    expect(bodyTreeItems()[1].getAttribute('aria-selected')).toBe('true')

    addSubOption.click()
    await nextTick()
    expect(bodyTreeItems()[2].getAttribute('aria-level')).toBe('3')
    expect(bodyTreeItems()[2].getAttribute('aria-selected')).toBe('true')
    bodyButtons()
      .find((button) => button.textContent === 'OK')!
      .click()
    await nextTick()
    expect(onChange).toHaveBeenCalledWith([
      {
        label: 'Parent',
        value: 'parent',
        children: [
          {
            label: 'Item 1',
            value: expect.any(String),
            children: [
              { label: 'Item 1', value: expect.any(String), children: [] },
            ],
          },
        ],
      },
    ])
  })

  test('allowTree=false masque l’ajout de sous-options', async () => {
    const { wrapper } = mountSetter({
      allowTree: false,
      value: [{ label: 'Option A', value: 'a' }],
    })
    await openDialog(wrapper)
    bodyTreeItems()[0].click()
    await nextTick()
    expect(bodyText()).not.toContain('Add sub-option')
    expect(bodyText()).toContain('Add Node')
  })

  test('allowExtendOption=false : pas de paires ajoutables, label non éditable', async () => {
    const { wrapper } = mountSetter({
      value: [{ label: 'A', value: 'a' }],
      allowExtendOption: false,
    })
    await openDialog(wrapper)
    bodyTreeItems()[0].click()
    await nextTick()
    await delay(50)
    expect(bodyText()).not.toContain('Add Key Value Pair')
    const inputs = [
      ...document.body.querySelectorAll('input'),
    ] as HTMLInputElement[]
    expect(inputs[0].disabled).toBe(true)
  })
})
