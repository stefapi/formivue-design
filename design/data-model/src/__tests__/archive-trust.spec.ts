import {
  parseDocumentProject,
  stringifyDocumentProject,
  useDocumentProject,
} from '@formivue-design/data-model'
import { expect, test } from 'vitest'

const canvas = () => ({
  id: 'form',
  componentName: 'Form',
  props: {},
  children: [],
})
const initial = () => ({ version: 1 as const, selected: '', drafts: {} })
const reaction = [{ fulfill: { run: 'void 0' } }]
const restricted = expect.objectContaining({
  issues: [expect.objectContaining({ code: 'untrusted_rendering' })],
})

test('requires explicit trust for the archive canvas, even if the archive claims trust', () => {
  const root = {
    ...canvas(),
    children: [
      {
        id: 'sample',
        componentName: 'Field',
        props: { 'x-reactions': reaction },
        children: [],
      },
    ],
  }
  const state = { ...initial(), trusted: true }
  const source = stringifyDocumentProject(root, state)
  expect(() => parseDocumentProject(source)).toThrow(restricted)
  const archive = parseDocumentProject(source, { trusted: true })
  expect(archive.canvas).toEqual(root)
  const restrictedProject = useDocumentProject({ applyPreview: () => {} })
  expect(() => restrictedProject.importArchive(archive)).toThrow(restricted)
  const trustedProject = useDocumentProject({
    documentOptions: { trusted: true },
    applyPreview: () => {},
  })
  expect(() => trustedProject.importArchive(archive)).not.toThrow()
})

test('checks applied documents and editable UI drafts inside an archive', () => {
  const ui = {
    version: 1 as const,
    nodes: [
      {
        id: 'sample',
        key: 'sample',
        kind: 'field' as const,
        component: 'Input',
        bind: '/sample',
        field: { 'x-reactions': reaction },
      },
    ],
  }
  const dataSchema = {
    type: 'object' as const,
    properties: { sample: { type: 'string' as const } },
  }
  const data = { sample: 'value' }
  for (const state of [
    { ...initial(), applied: { ui, dataSchema, data } },
    {
      ...initial(),
      drafts: {
        '': {
          renames: [],
          files: {
            ui: JSON.stringify(ui),
            dataSchema: JSON.stringify(dataSchema),
            data: JSON.stringify(data),
          },
        },
      },
    },
  ]) {
    const source = stringifyDocumentProject(canvas(), state)
    expect(() => parseDocumentProject(source)).toThrow(restricted)
    expect(parseDocumentProject(source, { trusted: true }).state).toEqual(state)
  }
})

test('filters canvas render attributes before restoring a restricted archive', () => {
  const props = {
    layout: 'vertical',
    'aria-label': 'Account',
    action: 'https://example.test/submit',
  }
  const root = {
    ...canvas(),
    props,
    children: [
      {
        id: 'layout',
        componentName: 'FormLayout',
        props: { tag: 'section', target: '_blank', 'data-section': 'details' },
        children: [],
      },
    ],
  }
  const source = stringifyDocumentProject(root, initial())
  const restored = parseDocumentProject(source).canvas
  expect(restored.props).toEqual({
    layout: 'vertical',
    'aria-label': 'Account',
  })
  expect(restored.children[0].props).toEqual({
    tag: 'section',
    'data-section': 'details',
  })
  expect(parseDocumentProject(source, { trusted: true }).canvas).toEqual(root)
})
