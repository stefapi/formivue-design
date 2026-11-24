import { ISchema, Schema, type JsonObject } from '@formivue/json-schema'
import { ITreeNode } from '@formivue-design/core'
import { clone, uid } from '@formivue-design/shared'
import { splitFormSchema } from './document-migration'
import type { DocumentContractOptions } from './document-contracts'

export interface ITransformerOptions {
  designableFieldName?: string
  designableFormName?: string
}

type DesignableSchema = ISchema & { 'x-designable-id'?: string }

export interface IFormivueSchema {
  schema?: DesignableSchema
  form?: Record<string, any>
}

const createOptions = (options: ITransformerOptions): ITransformerOptions => {
  return {
    designableFieldName: 'Field',
    designableFormName: 'Form',
    ...options,
  }
}

const findNode = (node: ITreeNode, finder?: (node: ITreeNode) => boolean) => {
  if (!node) return
  if (finder(node)) return node
  if (!node.children) return
  for (let i = 0; i < node.children.length; i++) {
    if (findNode(node.children[i])) return node.children[i]
  }
  return
}

export const transformToSchema = (
  node: ITreeNode,
  options?: ITransformerOptions,
): IFormivueSchema => {
  const realOptions = createOptions(options)
  const root = findNode(node, (child) => {
    return child.componentName === realOptions.designableFormName
  })
  const schema = {
    type: 'object',
    properties: {},
  }
  if (!root) return { schema }
  const createSchema = (node: ITreeNode, schema: DesignableSchema = {}) => {
    if (node !== root) {
      Object.assign(schema, clone(node.props))
    }
    schema['x-designable-id'] = node.id
    if (schema.type === 'array') {
      if (node.children[0]) {
        if (
          node.children[0].componentName === realOptions.designableFieldName
        ) {
          schema.items = createSchema(node.children[0])
          schema['x-index'] = 0
        }
      }
      node.children.slice(1).forEach((child, index) => {
        if (child.componentName !== realOptions.designableFieldName) return
        const key = child.props.name || child.id
        schema.properties = schema.properties || {}
        schema.properties[key] = createSchema(child)
        schema.properties[key]['x-index'] = index
      })
    } else {
      node.children.forEach((child, index) => {
        if (child.componentName !== realOptions.designableFieldName) return
        const key = child.props.name || child.id
        schema.properties = schema.properties || {}
        schema.properties[key] = createSchema(child)
        schema.properties[key]['x-index'] = index
      })
    }
    return schema
  }
  return { form: clone(root.props), schema: createSchema(root, schema) }
}

export const transformToTreeNode = (
  formivue: IFormivueSchema = {},
  options?: ITransformerOptions,
) => {
  const realOptions = createOptions(options)
  const root: ITreeNode = {
    id: formivue.schema?.['x-designable-id'],
    componentName: realOptions.designableFormName,
    props: formivue.form,
    children: [],
  }
  const schema = new Schema(formivue.schema)
  const cleanProps = (props: any) => {
    if (props['name'] === props['x-designable-id']) {
      delete props.name
    }
    delete props['version']
    delete props['_isJSONSchemaObject']
    return props
  }
  const appendTreeNode = (parent: ITreeNode, schema: Schema) => {
    if (!schema) return
    const current = {
      id: schema['x-designable-id'] || uid(),
      componentName: realOptions.designableFieldName,
      props: cleanProps(schema.toJSON(false)),
      children: [],
    }
    parent.children.push(current)
    const item = schema.items
    if (item && !Array.isArray(item)) {
      const hasItemNode =
        item['x-designable-id'] ||
        item['x-component'] ||
        item['x-decorator'] ||
        item.type === 'object' ||
        item.properties ||
        item.items
      if (hasItemNode) {
        appendTreeNode(current, item)
      } else {
        current.props.items = cleanProps(item.toJSON())
      }
    }
    schema.mapProperties((schema) => {
      schema['x-designable-id'] = schema['x-designable-id'] || uid()
      appendTreeNode(current, schema)
    })
  }
  schema.mapProperties((schema) => {
    schema['x-designable-id'] = schema['x-designable-id'] || uid()
    appendTreeNode(root, schema)
  })
  return root
}

export * from './documents'
export type { DataSchema } from './document-schema'
export { splitFormSchema } from './document-migration'
export {
  createDocumentContractRegistry,
  type DocumentBindingContract,
  type DocumentComponentContract,
  type DocumentContractContext,
  type DocumentContractExtension,
  type DocumentContractOptions,
  type DocumentContractRegistry,
  type DocumentDataType,
  type DocumentDependency,
  type DocumentRowsContract,
} from './document-contracts'

export function transformToFormDocuments(
  tree: ITreeNode,
  values?: JsonObject,
  options?: DocumentContractOptions,
) {
  return splitFormSchema(transformToSchema(tree), values, options)
}
