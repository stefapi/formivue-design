// Phase 2.6 — a11y : axe-core sur un kitchen-sink du design system (V8 : cible 0).
// Recette fork (examples/vite-usage/playground.spec.ts) : Axe.run(document.body)
// + filtre des violations à nœuds réels.
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  FormItemBase,
  FormLayout,
  Input,
  NumberPicker,
  Radio,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tabs,
  TimePicker,
  Tree,
} from '../index'

const KitchenSink = defineComponent({
  name: 'KitchenSink',
  setup() {
    return () =>
      h(
        FormLayout,
        {},
        {
          default: () => [
            h(
              Space,
              { direction: 'vertical', size: 'large' },
              {
                default: () => [
                  h(
                    Card,
                    { title: 'Identité' },
                    {
                      default: () => [
                        h(
                          FormItemBase,
                          {
                            label: 'Nom',
                            labelFor: 'fld-name',
                            required: true,
                          },
                          {
                            default: () =>
                              h(Input, { id: 'fld-name', value: '' }),
                          },
                        ),
                        h(
                          FormItemBase,
                          { label: 'Date', labelFor: 'fld-date' },
                          {
                            default: () =>
                              h(DatePicker, {
                                id: 'fld-date',
                                value: '2026-11-21',
                              }),
                          },
                        ),
                        h(
                          FormItemBase,
                          { label: 'Heure', labelFor: 'fld-time' },
                          {
                            default: () =>
                              h(TimePicker, {
                                id: 'fld-time',
                                value: '10:00:00',
                              }),
                          },
                        ),
                        h(
                          FormItemBase,
                          { label: 'Quantité', labelFor: 'fld-num' },
                          {
                            default: () =>
                              h(NumberPicker, { id: 'fld-num', value: 1 }),
                          },
                        ),
                        h(
                          FormItemBase,
                          { label: 'Couleur', labelFor: 'fld-sel' },
                          {
                            default: () =>
                              h(Select, {
                                id: 'fld-sel',
                                options: [
                                  { label: 'Rouge', value: 'red' },
                                  { label: 'Vert', value: 'green' },
                                ],
                                value: 'red',
                              }),
                          },
                        ),
                        h(Checkbox, {
                          value: true,
                          label: 'J’accepte les conditions',
                          onChange: () => {},
                        }),
                        h(Radio, {
                          options: [
                            { label: 'Oui', value: 'yes' },
                            { label: 'Non', value: 'no' },
                          ],
                          value: 'yes',
                          onChange: () => {},
                        }),
                        h(
                          FormItemBase,
                          { label: 'Actif', labelFor: 'fld-switch' },
                          {
                            default: () =>
                              h(Switch, { id: 'fld-switch', value: false }),
                          },
                        ),
                        h(
                          FormItemBase,
                          { label: 'Progression', labelFor: 'fld-slider' },
                          {
                            default: () =>
                              h(Slider, { id: 'fld-slider', value: 30 }),
                          },
                        ),
                      ],
                    },
                  ),
                  h(
                    Card,
                    { title: 'Arborescence' },
                    {
                      default: () =>
                        h(Tree, {
                          items: [
                            {
                              key: 'root',
                              label: 'root',
                              children: [{ key: 'child', label: 'child' }],
                            },
                          ],
                          defaultExpandedKeys: ['root'],
                        }),
                    },
                  ),
                  h(
                    Card,
                    { title: 'Lignes' },
                    {
                      default: () =>
                        h(Table, {
                          columns: [
                            { key: 'name', title: 'Nom' },
                            { key: 'age', title: 'Âge' },
                          ],
                          dataSource: [
                            { key: '1', name: 'Alice', age: 30 },
                            { key: '2', name: 'Bob', age: 25 },
                          ],
                          rowKey: 'key',
                        }),
                    },
                  ),
                  h(
                    Tabs,
                    {
                      tabs: [
                        { key: 'a', label: 'Général' },
                        { key: 'b', label: 'Avancé' },
                      ],
                    },
                    { a: () => h(Button, () => 'A'), b: () => 'B' },
                  ),
                ],
              },
            ),
          ],
        },
      )
  },
})

describe('@formivue-design/vue-ui — a11y (axe, cible 0)', () => {
  test('kitchen-sink : 0 violation axe sur le design system', async () => {
    document.title = 'vue-ui kitchen sink'
    document.documentElement.lang = 'fr'
    document.body.innerHTML = ''
    const wrapper = mount(
      { render: () => h('main', [h(KitchenSink)]) },
      { attachTo: document.body },
    )
    const { default: Axe } = await import('axe-core')
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
        real
          .map((v) => {
            const nodes = (
              v.nodes as Array<{ html?: string; target?: string[] }>
            ).slice(0, 3)
            return `${v.id} (${v.nodes.length}) :: ${nodes
              .map((n) => (n.target ?? []).join('|').slice(0, 80))
              .join(' ## ')}`
          })
          .join('\n'),
      )
    }
    expect(real).toEqual([])
    wrapper.unmount()
  })
})
