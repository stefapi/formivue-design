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
import {
  transformToSchema,
  type createFormDocument,
} from '@formivue-design/formivue-transformer'
import type { DraftFormPreview } from '@formivue-design/data-model/ui'
// ATTENTION piège du port : le barrel de @formivue-design/formivue-vue exporte le
// MATÉRIAU DESIGNER FormLayout (= withContainer → DroppableWidget du chrome) ;
// la binding réelle vit dans la carte Materials (FormLayout vue-ui pur).
import { conflictMessage, validationMessage } from '../document-messages'
import { Materials } from '@formivue-design/formivue-vue'

export const PreviewWidget = observer(
  defineComponent({
    name: 'PreviewWidget',
    props: {
      tree: { type: Object as PropType<TreeNode>, required: true },
      materials: Object as PropType<Record<string, Component>>,
      frame: Object as PropType<Component>,
      document: Object as PropType<ReturnType<typeof createFormDocument>>,
      draft: Object as PropType<DraftFormPreview>,
    },
    setup(props) {
      // sémantique useMemo(() => createForm(), []) d'ère : un form par
      // instance (l'app est remontée à chaque bascule PREVIEW par le ViewPanel)
      const form = createForm()
      const { SchemaField } = createSchemaField({
        components: { ...Materials, ...props.materials },
      })
      return () => {
        const active = props.document
        const conflicts = active?.conflicts ?? []
        const issues = active?.issues ?? []
        const draft = props.draft
        const { form: formProps, schema } = active
          ? { form: active.formProps, schema: active.schema }
          : (draft?.compiled ?? transformToSchema(props.tree))
        const currentForm = active?.form ?? draft?.form ?? form
        const renderForm = () =>
          h(
            FormProvider as any,
            {
              form: currentForm,
              key: currentForm.id,
              retain: !!active || !!draft,
            },
            {
              default: () =>
                h(
                  Materials.FormLayout as any,
                  { ...formProps },
                  {
                    default: () => [
                      ...(conflicts.length
                        ? [
                            h(
                              'p',
                              {
                                role: 'alert',
                                class: 'text-sm text-destructive',
                              },
                              conflictMessage(conflicts),
                            ),
                          ]
                        : []),
                      ...(issues.length
                        ? [
                            h(
                              'ul',
                              {
                                role: 'alert',
                                class: 'text-sm text-destructive',
                              },
                              issues.map(({ path, message }) =>
                                h(
                                  'li',
                                  `${path || '/'}: ${validationMessage(message)}`,
                                ),
                              ),
                            ),
                          ]
                        : []),
                      h(SchemaField as any, {
                        key: 'fields',
                        schema,
                        scope: active?.scope ?? draft?.scope,
                      }),
                    ],
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
