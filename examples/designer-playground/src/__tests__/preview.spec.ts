import { expect, test } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createDesigner } from '@formivue-design/core'
import { ComponentTreeWidget, Designer, Workspace } from '@formivue-design/vue'
import { transformToTreeNode } from '@formivue-design/formivue-transformer'
import {
  Form,
  Field,
  Card,
  FormGrid,
  FormTab,
  FormCollapse,
  Input,
} from '@formivue-design/formivue-vue'
import { PreviewWidget } from '../widgets/PreviewWidget'

test.each([false, true])(
  'preview applies the canvas render policy with trusted=%s',
  (trusted) => {
    const engine = createDesigner({ rootComponentName: 'Form' })
    const { tree } = engine.workbench.ensureWorkspace({ id: 'form' }).operation
    tree.from({
      componentName: 'Form',
      props: { action: '/submit', 'aria-label': 'Account' },
      children: [
        {
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormLayout',
            'x-component-props': { tag: 'section', 'data-section': 'details' },
          },
        },
      ],
    })
    const preview = mount(PreviewWidget, { props: { tree, trusted } })
    try {
      const form = preview.get('form')
      expect(form.attributes('aria-label')).toBe('Account')
      expect(form.attributes('action')).toBe(trusted ? '/submit' : undefined)
      expect(form.get('section').attributes('data-section')).toBe('details')
    } finally {
      preview.unmount()
      engine.unmount()
    }
  },
)

test('Carte, Grille, Onglets et Accordéon gardent les styles du canevas en aperçu', async () => {
  const field = { type: 'string', 'x-component': 'Input' }
  const fields = () => ({ first: { ...field }, second: { ...field } })
  const paneStyle = { display: 'flex', gap: '12px', padding: '7px' }
  const style = { display: 'inline-block', width: '145px' }
  const structure = (component: string, properties: object, props = {}) => ({
    type: 'void',
    'x-component': component,
    'x-designable-id': component,
    'x-component-props': { style, ...props },
    properties,
  })
  const engine = createDesigner({ rootComponentName: 'Form' })
  const { tree } = engine.workbench.ensureWorkspace({ id: 'form' }).operation
  tree.from(
    transformToTreeNode({
      schema: {
        type: 'object',
        properties: {
          card: structure('Card', fields(), { title: 'Carte' }),
          grid: structure('FormGrid', {
            first: structure('FormGrid.GridColumn', { gridFirst: field }),
            second: {
              ...structure('FormGrid.GridColumn', { gridSecond: field }),
              'x-designable-id': 'grid-second-column',
            },
          }),
          tabs: structure('FormTab', {
            tab: structure('FormTab.TabPane', fields(), {
              tab: 'Onglet',
              style: paneStyle,
            }),
          }),
          collapse: structure(
            'FormCollapse',
            {
              panel: structure('FormCollapse.CollapsePanel', fields(), {
                header: 'Panneau',
                style: paneStyle,
              }),
            },
            { defaultOpenKeys: ['panel'] },
          ),
        },
      } as any,
    }),
  )
  const canvas = mount(
    defineComponent({
      setup: () => () =>
        h(Designer, { engine }, () =>
          h(Workspace, { id: 'form' }, () =>
            h(ComponentTreeWidget, {
              components: {
                Form,
                Field,
                Card,
                FormGrid,
                FormTab,
                FormCollapse,
                Input,
              },
            }),
          ),
        ),
    }),
    { attachTo: document.body },
  )
  const preview = mount(PreviewWidget, {
    props: { tree },
    attachTo: document.body,
  })
  try {
    for (const wrapper of [canvas, preview]) {
      const form = wrapper.get('form').element
      const root =
        (form.firstElementChild as HTMLElement).style.display === 'contents'
          ? form.firstElementChild
          : form
      const components = Array.from(root.children) as HTMLElement[]
      expect(components).toHaveLength(4)
      for (const component of components) {
        expect(component.style.display).toBe('inline-block')
        expect(component.querySelectorAll('input')).toHaveLength(2)
      }
      expect(components[0].querySelector('[data-slot=card-footer]')).toBeNull()
      for (const component of components.slice(2)) {
        const pane = component.querySelector<HTMLElement>(
          '[style*="gap: 12px"]',
        )
        expect(pane?.style.padding).toBe('7px')
        expect(pane?.querySelectorAll('input')).toHaveLength(2)
      }
    }
  } finally {
    canvas.unmount()
    preview.unmount()
    engine.unmount()
  }
})
