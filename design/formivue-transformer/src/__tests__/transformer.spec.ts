// Phase 2.4/2.5 — le transformer consomme @formivue/json-schema v3 (fork) via new Schema(...)
// et les helpers @formivue-design/{core,shared} : c'est la première suite qui exerce le pont
// designable → formivue v3 de bout en bout.
import {
  transformToSchema,
  transformToTreeNode,
} from '@formivue-design/formivue-transformer'
import type { ITreeNode } from '@formivue-design/core'
// import statique : résolu via les node_modules du transformer → fork v3 en link: (ESM pur)
import { createForm } from '@formivue/core'

const makeTree = (): ITreeNode => ({
  id: 'root',
  componentName: 'Form',
  props: { labelCol: 6, wrapperCol: 18 },
  children: [
    {
      id: 'field-a',
      componentName: 'Field',
      props: { name: 'fieldA', title: 'A', type: 'string' },
      children: [],
    },
    {
      id: 'field-b',
      componentName: 'Field',
      props: { name: 'fieldB', title: 'B', type: 'number' },
      children: [],
    },
  ],
})

describe('formivue-transformer', () => {
  test('transformToSchema : form + properties nommées + x-index', () => {
    const { form, schema } = transformToSchema(makeTree())
    expect(form).toEqual({ labelCol: 6, wrapperCol: 18 })
    expect(schema.type).toBe('object')
    expect(Object.keys(schema.properties)).toEqual(['fieldA', 'fieldB'])
    expect(schema.properties.fieldA).toMatchObject({
      title: 'A',
      type: 'string',
      'x-designable-id': 'field-a',
      'x-index': 0,
    })
    expect(schema.properties.fieldB['x-index']).toBe(1)
  })

  test('transformToSchema : sans racine Form → schema vide', () => {
    const { form, schema } = transformToSchema({
      id: 'orphan',
      componentName: 'Card',
      children: [],
    })
    expect(form).toBeUndefined()
    expect(schema).toEqual({ type: 'object', properties: {} })
  })

  test('transformToTreeNode → transformToSchema : aller-retour stable', () => {
    const tree = makeTree()
    const schema = transformToSchema(tree)
    const backToTree = transformToTreeNode(schema)
    expect(backToTree.componentName).toBe('Form')
    expect(backToTree.props).toEqual({ labelCol: 6, wrapperCol: 18 })
    expect(backToTree.children.map((child) => child.props.name)).toEqual([
      'fieldA',
      'fieldB',
    ])
    const roundTrip = transformToSchema(backToTree)
    expect(roundTrip.form).toEqual(schema.form)
    expect(Object.keys(roundTrip.schema.properties)).toEqual([
      'fieldA',
      'fieldB',
    ])
    expect(roundTrip.schema.properties.fieldA).toMatchObject({
      title: 'A',
      type: 'string',
    })
  })

  test('options : noms de composants personnalisés', () => {
    const { form } = transformToSchema(
      {
        id: 'r',
        componentName: 'Root',
        props: { a: 1 },
        children: [],
      },
      { designableFormName: 'Root' },
    )
    expect(form).toEqual({ a: 1 })
  })

  // phase 2.5 — le runtime @formivue/core v3 du fork s'exécute depuis ce repository
  test('@formivue/core v3 (fork) : createForm()', () => {
    const form = createForm({ initialValues: { hello: 'world' } })
    expect(form.values.hello).toBe('world')
  })
})
