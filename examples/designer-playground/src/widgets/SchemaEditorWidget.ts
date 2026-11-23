// Phase 7 (7.1) — port de formivue/antd/playground/widgets/SchemaEditorWidget :
// éditeur JSON de l'arbre (vue JSONTREE). Port verbatim — le MonacoInput vit
// dans vue-settings-form (loader @monaco-editor, framework-agnostic), le
// transformer TreeNode ⇄ JSON Schema est intact.
import { defineComponent, h, type PropType } from 'vue'
import {
  transformToSchema,
  transformToTreeNode,
  type IFormivueSchema,
} from '@formivue-design/formivue-transformer'
import { TreeNode, ITreeNode } from '@formivue-design/core'
import { MonacoInput } from '@formivue-design/vue-settings-form'

export const SchemaEditorWidget = defineComponent({
  name: 'SchemaEditorWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    onChange: {
      type: null as unknown as PropType<(tree: ITreeNode) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(MonacoInput as any, {
        value: JSON.stringify(transformToSchema(props.tree), null, 2),
        onChange: (value: string) => {
          let schema: IFormivueSchema
          try {
            schema = JSON.parse(value)
          } catch {
            return
          }
          if (schema && typeof schema === 'object' && !Array.isArray(schema))
            props.onChange?.(transformToTreeNode(schema))
        },
        language: 'json',
        options: { automaticLayout: true },
      })
  },
})
