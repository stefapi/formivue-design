// Phase 4 — smoke runtime des matériaux @formivue-design/formivue-vue : montage
// via createSchemaField(Materials), saisie, lecture, ArrayTable/FormGrid,
// export public, behaviors/resources enregistrables dans le moteur.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { FormPath } from '@formivue/shared'
import { createDesigner, GlobalRegistry, TreeNode } from '@formivue-design/core'
import { calcElementLayout } from '@formivue-design/shared'
import { ComponentTreeWidget, Designer, Workspace } from '@formivue-design/vue'
import { Materials as RuntimeMaterials } from '@formivue-design/formivue-runtime'
import * as Pkg from '../index'
import { Materials } from '../materials'

const { SchemaField } = createSchemaField({ components: Materials as any })

test('the designer attaches canvas metadata to its own bindings', () => {
  expect(Materials.Input).toBe(Pkg.Input)
  expect(Pkg.Input.Behavior).toBeDefined()
  expect(Pkg.Input.Resource).toBeDefined()
  expect(RuntimeMaterials.Input).not.toHaveProperty('Behavior')
  expect(RuntimeMaterials.Input).not.toHaveProperty('Resource')
  expect(RuntimeMaterials.Input.TextArea).toBe(Pkg.Input.TextArea)
  expect(Pkg.Radio.Group).toBe(Pkg.Radio)
})

let warn: ReturnType<typeof vi.spyOn>
let error: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  error = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  warn.mockRestore()
  error.mockRestore()
})
const vueWarnings = () =>
  [...warn.mock.calls, ...error.mock.calls]
    .map((c) => String(c[0]))
    .filter((m) => /\[Vue warn\]|Error/.test(m))

const render = (schema: any, form = createForm()) => {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(FormProvider, { form }, () => h(SchemaField, { schema })),
    }),
    { attachTo: document.body },
  )
  return { wrapper, form }
}

describe('formivue-vue — export public', () => {
  test('les composants matériau sont exportés (pas masqués par des collisions)', () => {
    for (const name of [
      'Input',
      'Select',
      'Checkbox',
      'Radio',
      'Switch',
      'NumberPicker',
      'DatePicker',
      'TimePicker',
      'Form',
      'Field',
      'FormGrid',
      'FormTab',
      'FormCollapse',
      'ArrayTable',
      'ArrayCards',
      'Card',
      'Space',
      'Text',
      'Rate',
      'TreeSelect',
      'Cascader',
      'Transfer',
      'Upload',
    ]) {
      expect((Pkg as any)[name], name).toBeTruthy()
      expect((Pkg as any)[name].Behavior, `${name}.Behavior`).toBeTruthy()
    }
    expect(Pkg.AllSchemas).toBeTruthy()
    expect(Pkg.AllLocales).toBeTruthy()
  })

  test('behaviors et resources enregistrables', () => {
    const comps = Object.values(Pkg).filter(
      (v: any) => v && (v.Behavior || v.Resource),
    ) as any[]
    expect(() => {
      for (const c of comps) {
        if (c.Behavior) GlobalRegistry.setDesignerBehaviors(c.Behavior)
      }
    }).not.toThrow()
  })
})

describe('formivue-vue — matériaux designer (CANVAS)', () => {
  // Régression post-intégration : parité d'ère ArrayBase.mixin(matériau) —
  // les nœuds template des arrays (x-component 'ArrayCards.Index',
  // 'ArrayTable.Addition'…) se résolvent dans le canvas via
  // FormPath.getIn(components, name) (Field/preview.ts) : les statics
  // doivent vivre sur le MATÉRIAU designer (carte du canvas), pas
  // seulement sur la binding Materials (carte du preview).
  test.each(['ArrayCards', 'ArrayTable'])(
    '%s porte les statics ArrayBase (résolution canvas)',
    (name) => {
      const material = (Pkg as any)[name]
      for (const stat of [
        'Item',
        'Index',
        'Addition',
        'Copy',
        'Remove',
        'MoveDown',
        'MoveUp',
        'SortHandle',
      ]) {
        expect(material[stat], `${name}.${stat}`).toBeTruthy()
      }
    },
  )

  test('FormPath.getIn résout les sous-composants depuis le matériau designer', () => {
    // même carte que le canvas du playground (app.ts components)
    const components = {
      ArrayCards: (Pkg as any).ArrayCards,
      ArrayTable: (Pkg as any).ArrayTable,
    } as any
    expect(FormPath.getIn(components, 'ArrayCards.Index')).toBe(
      (Pkg as any).ArrayCards.Index,
    )
    expect(FormPath.getIn(components, 'ArrayCards.Addition')).toBe(
      (Pkg as any).ArrayCards.Addition,
    )
    expect(FormPath.getIn(components, 'ArrayTable.SortHandle')).toBe(
      (Pkg as any).ArrayTable.SortHandle,
    )
    expect(FormPath.getIn(components, 'ArrayTable.Column')).toBeUndefined()
  })

  test('FormLayout et Space appliquent leur affichage au conteneur avec ses champs', async () => {
    const engine = createDesigner({ rootComponentName: 'Form' })
    const { tree } = engine.workbench.ensureWorkspace({ id: 'form' }).operation
    tree.setProps({ style: { display: 'block' } })
    for (const component of ['FormLayout', 'Space']) {
      tree.append(
        new TreeNode({
          id: component,
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': component,
            'x-component-props': { style: { display: 'inline-block' } },
          },
          children: [1, 2].map(
            (index) =>
              new TreeNode({
                id: `${component}-${index}`,
                componentName: 'Field',
                props: {
                  type: 'string',
                  title: `Field ${index}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              }),
          ),
        }),
      )
    }

    const { Form, Field, FormLayout, Space, Input } = Pkg
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Designer, { engine }, () =>
            h(Workspace, { id: 'form' }, () =>
              h(ComponentTreeWidget, {
                components: { Form, Field, FormLayout, Space, Input },
              }),
            ),
          ),
      }),
      { attachTo: document.body },
    )
    try {
      const container = (name: string) =>
        wrapper.get(`form > [data-designer-node-id="${name}"]`)
      for (const name of ['FormLayout', 'Space']) {
        expect((container(name).element as HTMLElement).style.display).toBe(
          'inline-block',
        )
        expect(container(name).findAll('input')).toHaveLength(2)
        expect(calcElementLayout(container(name).element)).toBe('horizontal')
      }
      expect(wrapper.get('form').element.style.display).toBe('block')
      tree.props.style.display = 'flex'
      const layoutStyle =
        tree.findById('FormLayout').props['x-component-props'].style
      layoutStyle.display = 'flex'
      layoutStyle.flexDirection = 'column'
      await vi.waitFor(() => {
        expect(wrapper.get('form').element.style.display).toBe('flex')
        expect(
          (container('FormLayout').element as HTMLElement).style.display,
        ).toBe('flex')
        expect(
          calcElementLayout(
            container('FormLayout').get('[data-slot=form-item]').element,
          ),
        ).toBe('vertical')
      })
    } finally {
      wrapper.unmount()
      engine.unmount()
    }
  })
})

describe('formivue-vue — champs (PREVIEW)', () => {
  test('Texte affiche les retours à la ligne par défaut et assainit le HTML explicite', () => {
    const content = 'Première ligne\nDeuxième <strong>ligne</strong>'
    const { wrapper } = render({
      type: 'object',
      properties: {
        plain: {
          type: 'string',
          'x-component': 'Text',
          'x-component-props': { content, mode: 'p' },
        },
        html: {
          type: 'string',
          'x-component': 'Text',
          'x-component-props': {
            format: 'html',
            mode: 'p',
            content:
              '<p onclick="ignored()">Intro <strong>exemple</strong></p><ul><li>Point</li></ul><a href="https://example.test">Lien</a><img src="https://example.test/pixel"><script>ignored()</script>',
          },
        },
      },
    })
    try {
      const [plain, html] = wrapper.findAll('.dn-text')
      expect(plain.element.tagName).toBe('P')
      expect(plain.element.textContent).toBe(content)
      expect((plain.element as HTMLElement).style.whiteSpace).toBe('pre-wrap')
      expect(plain.find('strong').exists()).toBe(false)
      expect(html.element.tagName).toBe('DIV')
      expect(html.get('strong').text()).toBe('exemple')
      expect(html.get('ul > li').text()).toBe('Point')
      expect(html.get('a').attributes('href')).toBe('https://example.test')
      expect(html.find('[onclick], img, script').exists()).toBe(false)
      expect(html.attributes('data-content-editable')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })

  test('Slider : pas décimal, titre accessible et valeur numérique du formulaire', async () => {
    const { wrapper, form } = render({
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          title: 'Variation',
          default: 0,
          'x-decorator': 'FormItem',
          'x-component': 'Slider',
          'x-component-props': { min: -10, max: 10, step: 0.25 },
        },
      },
    })
    try {
      await nextTick()
      const thumb = wrapper.get('[role="slider"]')
      expect(thumb.attributes('aria-label')).toBe('Variation')
      expect(thumb.attributes('aria-valuenow')).toBe('0')
      await thumb.trigger('keydown', { key: 'ArrowLeft' })
      expect(form.values.amount).toBe(-0.25)
      expect(wrapper.get('[data-slot="slider-value"]').text()).toBe('-0.25')
      expect(vueWarnings()).toEqual([])
    } finally {
      wrapper.unmount()
    }
  })

  test('Input : saisie → valeur du form, lecture → texte', async () => {
    const { wrapper, form } = render({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'Nom',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    await input.setValue('abc')
    expect(form.values.name).toBe('abc')
    expect(wrapper.find('label').text()).toContain('Nom')
    form.setPattern('readPretty')
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('abc')
    expect(vueWarnings()).toEqual([])
    wrapper.unmount()
  })

  test.each([
    ['Input.TextArea', 'string'],
    ['Password', 'string'],
    ['NumberPicker', 'number'],
    ['Select', 'string'],
    ['Checkbox.Group', 'array'],
    ['Radio.Group', 'string'],
    ['Switch', 'boolean'],
    ['Slider', 'number'],
    ['DatePicker', 'string'],
    ['TimePicker', 'string'],
    ['Rate', 'number'],
    ['TreeSelect', 'string'],
    ['Cascader', 'array'],
    ['Transfer', 'array'],
    ['DatePicker.RangePicker', 'array'],
    ['TimePicker.RangePicker', 'array'],
    ['Upload', 'array'],
    ['Upload.Dragger', 'array'],
  ])('%s monte sans warning', async (component, type) => {
    const { wrapper } = render({
      type: 'object',
      properties: {
        f: {
          type,
          title: component,
          'x-decorator': 'FormItem',
          'x-component': component,
          enum: /Select|Group/.test(component)
            ? [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
              ]
            : undefined,
        },
      },
    })
    await nextTick()
    expect(wrapper.html()).not.toBe('')
    expect(vueWarnings()).toEqual([])
    wrapper.unmount()
  })
})

describe('formivue-vue — structures (scénario 4.5)', () => {
  test.each([
    { activeKey: 'custom', expected: 'Second tab' },
    { activeKey: 'deleted', expected: 'First tab' },
    { activeKey: 'hidden', expected: 'First tab' },
    { activeKey: '', expected: 'First tab' },
  ])(
    'les onglets résolvent le choix initial $activeKey',
    ({ activeKey, expected }) => {
      const { wrapper } = render({
        type: 'object',
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'FormTab',
            'x-component-props': { activeKey },
            properties: {
              hidden: {
                type: 'void',
                'x-display': 'hidden',
                'x-component': 'FormTab.TabPane',
              },
              first: {
                type: 'void',
                'x-component': 'FormTab.TabPane',
                'x-component-props': { tab: 'First tab' },
              },
              second: {
                type: 'void',
                'x-component': 'FormTab.TabPane',
                'x-component-props': { key: 'custom', tab: 'Second tab' },
              },
            },
          },
        },
      })
      try {
        expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe(
          expected,
        )
      } finally {
        wrapper.unmount()
      }
    },
  )

  test.each([
    {
      accordion: false,
      initial: ['true', 'true'],
      afterClick: ['false', 'true'],
    },
    {
      accordion: true,
      initial: ['true', 'false'],
      afterClick: ['false', 'true'],
    },
  ])(
    'l’accordéon initialise les panneaux et respecte accordion=$accordion',
    async ({ accordion, initial, afterClick }) => {
      const { wrapper } = render({
        type: 'object',
        properties: {
          collapse: {
            type: 'void',
            'x-component': 'FormCollapse',
            'x-component-props': {
              accordion,
              defaultOpenKeys: ['deleted', 'first', 'custom'],
            },
            properties: {
              first: {
                type: 'void',
                'x-component': 'FormCollapse.CollapsePanel',
              },
              second: {
                type: 'void',
                'x-component': 'FormCollapse.CollapsePanel',
                'x-component-props': { key: 'custom' },
              },
            },
          },
        },
      })
      try {
        const headers = () => wrapper.findAll('button[aria-expanded]')
        const expanded = () =>
          headers().map((button) => button.attributes('aria-expanded'))
        expect(expanded()).toEqual(initial)
        await headers()[accordion ? 1 : 0].trigger('click')
        expect(expanded()).toEqual(afterClick)
        await headers()[1].trigger('click')
        expect(expanded()).toEqual(['false', 'false'])
      } finally {
        wrapper.unmount()
      }
    },
  )

  test('FormGrid + Card + Space + FormLayout montent', async () => {
    const { wrapper } = render({
      type: 'object',
      properties: {
        layout: {
          type: 'void',
          'x-component': 'FormLayout',
          properties: {
            card: {
              type: 'void',
              'x-component': 'Card',
              'x-component-props': { title: 'Carte' },
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'FormGrid',
                  'x-component-props': { maxColumns: 2 },
                  properties: {
                    a: {
                      type: 'string',
                      title: 'A',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    b: {
                      type: 'string',
                      title: 'B',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    await nextTick()
    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.text()).toContain('Carte')
    expect(vueWarnings()).toEqual([])
    wrapper.unmount()
  })

  test('FormTab / FormCollapse montent', async () => {
    const { wrapper } = render({
      type: 'object',
      properties: {
        tabs: {
          type: 'void',
          'x-component': 'FormTab',
          properties: {
            t1: {
              type: 'void',
              'x-component': 'FormTab.TabPane',
              'x-component-props': { tab: 'Onglet 1' },
              properties: {
                x: { type: 'string', 'x-component': 'Input' },
              },
            },
          },
        },
        collapse: {
          type: 'void',
          'x-component': 'FormCollapse',
          properties: {
            p1: {
              type: 'void',
              'x-component': 'FormCollapse.CollapsePanel',
              'x-component-props': { header: 'Panneau 1' },
              properties: {
                y: { type: 'string', 'x-component': 'Input' },
              },
            },
          },
        },
      },
    })
    await nextTick()
    expect(wrapper.text()).toContain('Onglet 1')
    expect(wrapper.text()).toContain('Panneau 1')
    expect(vueWarnings()).toEqual([])
    wrapper.unmount()
  })

  test('ArrayTable : ajout, saisie, suppression, validation bloquante', async () => {
    const form = createForm()
    const { wrapper } = render(
      {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            'x-component': 'ArrayTable',
            items: {
              type: 'object',
              properties: {
                c1: {
                  type: 'void',
                  'x-component': 'ArrayTable.Column',
                  'x-component-props': { title: 'Nom' },
                  properties: {
                    name: {
                      type: 'string',
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
                c2: {
                  type: 'void',
                  'x-component': 'ArrayTable.Column',
                  'x-component-props': { title: 'Actions' },
                  properties: {
                    remove: {
                      type: 'void',
                      'x-component': 'ArrayTable.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                'x-component': 'ArrayTable.Addition',
                title: 'Ajouter',
              },
            },
          },
        },
      },
      form,
    )
    await nextTick()
    expect(wrapper.text()).toContain('Nom')
    const add = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Ajouter'))
    expect(add, 'bouton Ajouter').toBeTruthy()
    await add!.trigger('click')
    await nextTick()
    expect(form.values.rows).toHaveLength(1)
    await expect(form.submit()).rejects.toBeTruthy()
    await wrapper.find('input').setValue('ligne')
    expect(form.values.rows[0].name).toBe('ligne')
    await expect(form.submit()).resolves.toBeTruthy()
    const remove = wrapper.find('button[aria-label="Remove"]')
    expect(remove.exists(), 'bouton Remove nommé').toBe(true)
    await remove.trigger('click')
    await nextTick()
    expect(form.values.rows).toHaveLength(0)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(vueWarnings()).toEqual([])
    wrapper.unmount()
  })

  test.each(['ArrayCards', 'ArrayTable'])(
    '%s applique le style à la liste et gère les opérations sans boucler',
    async (component) => {
      const control = (name: string) => ({
        type: 'void',
        'x-component': `${component}.${name}`,
      })
      const field = { type: 'string', 'x-component': 'Input' }
      const column = (title: string, properties: object, style?: object) => ({
        ...control('Column'),
        'x-component-props': { title, style },
        properties,
      })
      const operations = {
        copy: control('Copy'),
        remove: control('Remove'),
        up: control('MoveUp'),
        down: control('MoveDown'),
      }
      const rows = [
        { name: 'Alice', city: 'Paris' },
        { name: 'Bruno', city: 'Lyon' },
        { name: 'Camille', city: 'Toulouse' },
      ]
      const { wrapper, form } = render({
        type: 'object',
        properties: {
          list: {
            type: 'array',
            default: rows,
            'x-component': component,
            'x-component-props': {
              style: {
                display: 'inline-block',
                width: '360px',
                padding: '8px',
              },
            },
            items: {
              type: 'object',
              default: { city: 'Lille' },
              properties:
                component === 'ArrayCards'
                  ? { name: field, city: field, ...operations }
                  : {
                      sort: column('', { handle: control('SortHandle') }),
                      name: column(
                        'Name',
                        { name: field },
                        { padding: '13px' },
                      ),
                      city: column('City', { city: field }),
                      actions: column('Actions', operations),
                    },
            },
            properties: {
              add: {
                ...control('Addition'),
                title: 'Add test item',
                'x-component-props': { method: 'unshift' },
              },
            },
          },
        },
      })
      try {
        const list = wrapper.get(
          component === 'ArrayCards' ? '.dn-array-cards' : '.dn-array-table',
        )
        expect((list.element as HTMLElement).style.display).toBe('inline-block')
        expect((list.element as HTMLElement).style.width).toBe('360px')
        expect(list.attributes('data-array-inline')).toBe('')
        expect(list.findAll('input')).toHaveLength(6)
        expect(
          list.get('[aria-label="Move up"]').attributes('disabled'),
        ).toBeDefined()
        expect(
          list
            .findAll('[aria-label="Move down"]')
            .at(-1)
            ?.attributes('disabled'),
        ).toBeDefined()
        await list.get('[aria-label="Move up"]').trigger('click')
        expect(form.values.list.map((row) => row.name)).toEqual([
          'Alice',
          'Bruno',
          'Camille',
        ])

        if (component === 'ArrayTable') {
          expect(list.get('tbody [style*="13px"]').find('input').exists()).toBe(
            true,
          )
          const handle = list.get('button[aria-keyshortcuts]')
          await handle.trigger('keydown', { key: 'ArrowDown' })
          expect(form.values.list.map((row) => row.name)).toEqual([
            'Bruno',
            'Alice',
            'Camille',
          ])
          const firstHandle = list.get('button[aria-keyshortcuts]')
          await firstHandle.trigger('keydown', { key: 'ArrowDown' })
          await firstHandle.trigger('keydown', { key: 'ArrowDown' })
          expect(form.values.list.map((row) => row.name)).toEqual([
            'Alice',
            'Camille',
            'Bruno',
          ])
        }

        await list.get('[aria-label="Duplicate"]').trigger('click')
        expect(form.values.list[1]).toEqual(form.values.list[0])
        await list.findAll('input')[2].setValue('Indépendant')
        expect(form.values.list[0].name).toBe('Alice')
        expect(form.values.list[1].name).toBe('Indépendant')
        await list.findAll('[aria-label="Remove"]')[1].trigger('click')
        expect(form.values.list).toHaveLength(3)
        const add = list
          .findAll('button')
          .find((button) => button.text() === 'Add test item')!
        await add.trigger('click')
        expect(form.values.list[0].city).toBe('Lille')
        expect(list.findAll('input')).toHaveLength(8)
        expect(vueWarnings()).toEqual([])
      } finally {
        wrapper.unmount()
      }
    },
  )
})

describe('formivue-vue — matériaux backlog V3 rétablis', () => {
  const tree = [
    {
      label: 'Europe',
      value: 'eu',
      children: [
        {
          label: 'France',
          value: 'fr',
          children: [{ label: 'Paris', value: 'paris' }],
        },
      ],
    },
  ]
  const field = (component: string, extra: any = {}) => ({
    type: 'object',
    properties: {
      f: {
        title: component,
        'x-decorator': 'FormItem',
        'x-component': component,
        ...extra,
      },
    },
  })

  test('behaviors : RangePicker et Upload.Dragger ont leur propre behavior', () => {
    const names = [
      ...(Pkg.DatePicker as any).Behavior,
      ...(Pkg.TimePicker as any).Behavior,
      ...(Pkg.Upload as any).Behavior,
    ].map((b: any) => b.name)
    expect(names).toEqual([
      'DatePicker',
      'DatePicker.RangePicker',
      'TimePicker',
      'TimePicker.RangePicker',
      'Upload',
      'Upload.Dragger',
    ])
    expect((Pkg.Upload as any).Resource).toHaveLength(2)
  })

  test('lecture : Cascader → chemin des libellés, TreeSelect → libellés', async () => {
    const form = createForm({
      values: { f: ['eu', 'fr', 'paris'] },
      readPretty: true,
    })
    const { wrapper } = render(field('Cascader', { enum: tree }), form)
    await nextTick()
    expect(wrapper.text()).toContain('Europe / France / Paris')
    wrapper.unmount()
    const form2 = createForm({
      values: { f: ['fr', 'paris'] },
      readPretty: true,
    })
    const second = render(field('TreeSelect', { enum: tree }), form2)
    await nextTick()
    expect(second.wrapper.text()).toContain('France')
    expect(second.wrapper.text()).toContain('Paris')
    second.wrapper.unmount()
  })

  test('lecture : plage → « début ~ fin », Upload → liens', async () => {
    const form = createForm({
      values: { f: ['2026-01-01', '2026-01-31'] },
      readPretty: true,
    })
    const { wrapper } = render(field('DatePicker.RangePicker'), form)
    await nextTick()
    expect(wrapper.text()).toContain('2026-01-01 ~ 2026-01-31')
    wrapper.unmount()
    const form2 = createForm({
      values: { f: [{ uid: '1', name: 'a.pdf', url: 'https://x/a.pdf' }] },
      readPretty: true,
    })
    const second = render(field('Upload'), form2)
    await nextTick()
    expect(second.wrapper.find('a[href="https://x/a.pdf"]').text()).toBe(
      'a.pdf',
    )
    second.wrapper.unmount()
  })

  test('Transfer : options depuis enum, transfert → valeur du form', async () => {
    const { wrapper, form } = render(
      field('Transfer', {
        enum: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      }),
    )
    const [left] = wrapper.findAll('[role="group"]')
    // case shadcn (reka Checkbox, role=checkbox)
    await left.findAll('li [role="checkbox"]')[1].trigger('click')
    await wrapper.get('button[aria-label="Move to target"]').trigger('click')
    expect(form.values.f).toEqual(['b'])
    wrapper.unmount()
  })
})
