// Phase 7 (7.1) — port de formivue/antd/playground/widgets/PreviewWidget :
// rendu réel du schéma (vue PREVIEW). L'ère montait @formivue/antd (Form +
// createSchemaField) ; la pile headless (V1) rend les bindings réelles de la
// carte `Materials` (@formivue-design/formivue-vue, phase 4) sous FormProvider du
// fork, l'enveloppe FormLayout recevant les props du nœud Form (l'ère les
// passait au <Form> antd — même sémantique, FormLayout est le shell headless).
import { defineComponent, h, type Component, type PropType } from 'vue'
import { createForm } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { TreeNode } from '@formivue-design/core'
import { transformToSchema } from '@formivue-design/formivue-transformer'
// ATTENTION piège du port : le barrel de @formivue-design/formivue-vue exporte le
// MATÉRIAU DESIGNER FormLayout (= withContainer → DroppableWidget du chrome) ;
// la binding réelle vit dans la carte Materials (FormLayout vue-ui pur).
import { Materials } from '@formivue-design/formivue-vue'

export const PreviewWidget = observer(
  defineComponent({
    name: 'PreviewWidget',
    props: {
      tree: { type: Object as PropType<TreeNode>, required: true },
      materials: Object as PropType<Record<string, Component>>,
      frame: Object as PropType<Component>,
    },
    setup(props) {
      // sémantique useMemo(() => createForm(), []) d'ère : un form par
      // instance (l'app est remontée à chaque bascule PREVIEW par le ViewPanel)
      const form = createForm()
      const { SchemaField } = createSchemaField({
        components: { ...Materials, ...props.materials },
      })
      return () => {
        const { form: formProps, schema } = transformToSchema(props.tree)
        const renderForm = () =>
          h(
            FormProvider as any,
            { form },
            {
              default: () =>
                h(
                  Materials.FormLayout as any,
                  { ...formProps },
                  {
                    default: () => h(SchemaField as any, { schema }),
                  },
                ),
            },
          )
        return props.frame
          ? h(props.frame, {}, { default: renderForm })
          : renderForm()
      }
    },
  }) as any,
) as any
