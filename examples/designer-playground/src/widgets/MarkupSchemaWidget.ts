// Phase 7 (7.1) — port de formivue/antd/playground/widgets/MarkupSchemaWidget :
// vue MARKUP — le code de consommation du schéma, en lecture seule (Monaco).
// L'ère générait du JSX React sur @formivue/antd ; la sortie vise désormais la
// pile Vue (V1) : @formivue/vue (createSchemaField — champs markup nommés
// `SchemaStringField`…, le fork n'expose pas les alias `.String` d'ère) +
// carte Materials de @formivue-design/formivue-vue (bindings réelles). Le langage
// markup (x-component/x-decorator, <SchemaField> imbriqués) est inchangé —
// c'est celui du fork.
import { defineComponent, h, type PropType } from 'vue'
import { TreeNode } from '@formivue-design/core'
import { MonacoInput } from '@formivue-design/vue-settings-form'
import { isEmpty, isPlainObj } from '@formivue/shared'

export interface IMarkupSchemaWidgetProps {
  tree: TreeNode
}

const printAttribute = (node: TreeNode) => {
  if (!node) return ''
  const props = { ...node.props }
  if (node.depth !== 0) {
    props.name = node.props.name || node.id
  }
  return `${Object.keys(props)
    .map((key) => {
      if (
        key === 'x-designable-id' ||
        key === 'x-designable-source-name' ||
        key === '_isJSONSchemaObject' ||
        key === 'version' ||
        key === 'type'
      )
        return ''
      const value = props[key]
      if (isPlainObj(value) && isEmpty(value)) return ''
      if (typeof value === 'string') return `${key}="${value}"`
      return `${key}={${JSON.stringify(value)}}`
    })
    .join(' ')}`
}

const printChildren = (node: TreeNode) => {
  if (!node) return ''
  return node.children
    .map((child) => {
      return printNode(child)
    })
    .join('')
}

// fork : champs markup nommés (SchemaStringField…) — pas d'alias `.String`
const printTag = (node: TreeNode) => {
  if (node.props.type === 'string') return 'SchemaStringField'
  if (node.props.type === 'number') return 'SchemaNumberField'
  if (node.props.type === 'boolean') return 'SchemaBooleanField'
  if (node.props.type === 'date') return 'SchemaDateField'
  if (node.props.type === 'datetime') return 'SchemaDatetimeField'
  if (node.props.type === 'array') return 'SchemaArrayField'
  if (node.props.type === 'object') return 'SchemaObjectField'
  if (node.props.type === 'void') return 'SchemaVoidField'
  return 'SchemaMarkupField'
}

const printNode = (node: TreeNode) => {
  if (!node) return ''
  return `<${printTag(node)} ${printAttribute(node)} ${
    node.children.length ? `>${printChildren(node)}</${printTag(node)}>` : '/>'
  }`
}

const transformToMarkupSchemaCode = (tree: TreeNode, advanced: boolean) => {
  const root = tree.find((child) => {
    return child.componentName === 'Form' || child.componentName === 'Root'
  })
  return `import { defineComponent } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider, createSchemaField } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'${advanced ? "\nimport { AdvancedMaterials } from '@formivue-design/shadcn-advanced-runtime'\nimport { ChartMaterials } from '@formivue-design/charts-runtime'" : ''}

const {
  SchemaField,
  SchemaMarkupField,
  SchemaStringField,
  SchemaNumberField,
  SchemaBooleanField,
  SchemaDateField,
  SchemaDatetimeField,
  SchemaArrayField,
  SchemaObjectField,
  SchemaVoidField,
} = createSchemaField({ components: ${advanced ? '{ ...Materials, ...AdvancedMaterials, ...ChartMaterials }' : 'Materials'} })

const FormLayout = Materials.FormLayout

export default defineComponent({
  setup() {
    const form = createForm()
    return () => (
      <FormProvider form={form}>
        <FormLayout ${printAttribute(root)}>
          <SchemaField>
            ${printChildren(root)}
          </SchemaField>
        </FormLayout>
      </FormProvider>
    )
  },
})
`
}

export const MarkupSchemaWidget = defineComponent({
  name: 'MarkupSchemaWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    advanced: Boolean,
  },
  setup(props) {
    return () =>
      h(MonacoInput as any, {
        options: { readOnly: true },
        value: transformToMarkupSchemaCode(props.tree, props.advanced),
        language: 'typescript',
      })
  },
})
