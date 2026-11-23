// formivue/vue — Form (matériau racine du canvas : FormProvider du fork sur
// un form designable + FormLayout vue-ui qui fournit le contexte de layout
// aux FormItemBase — remplace le duo antd Form/FormLayout d'ère).
import { defineComponent, h } from 'vue'
import { createForm } from '@formivue/core'
import { FormProvider } from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { createBehavior, createResource } from '@formivue-design/core'
import { usePrefix, type DnFC } from '@formivue-design/vue'
import { FormLayout } from '@formivue-design/vue-ui'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

// d'ère (Form/styles.less) : `.dn-designable-form .ant-input, .ant-select…
// { pointer-events: none }` — les contrôles du canvas ne réagissent pas à la
// souris : le clic/drag tombe sur le nœud (sélection, déplacement) et un
// Select/popup reka ne s'ouvre pas (son mode modal passait le body en
// pointer-events:none + fond inert, figeant tout le designer).
const FORMIVUEDESIGN_CONTROLS_INERT = [
  '[&_input]:pointer-events-none',
  '[&_textarea]:pointer-events-none',
  '[&_select]:pointer-events-none',
  '[&_[data-slot=select-trigger]]:pointer-events-none',
  '[&_[data-slot=switch]]:pointer-events-none',
  '[&_[data-slot=checkbox]]:pointer-events-none',
  '[&_[data-slot=radio-group-item]]:pointer-events-none',
  '[&_[data-slot=slider]]:pointer-events-none',
  '[&_[data-slot=number-field]]:pointer-events-none',
  '[&_[data-slot=rate]]:pointer-events-none',
  '[&_[data-slot=cascader]]:pointer-events-none',
  '[&_[data-slot=tree-select]]:pointer-events-none',
  '[&_[data-slot=transfer]]:pointer-events-none',
  '[&_[data-slot=upload]]:pointer-events-none',
  '[&_[data-slot=range-picker]]:pointer-events-none',
  '[&_svg]:pointer-events-none',
].join(' ')

export const Form: DnFC<any> = observer(
  defineComponent({
    name: 'DForm',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const prefix = usePrefix('designable-form')
      // un form par montage — sémantique useMemo([]) d'ère ; le canvas est
      // remonté avec le Workbench (key), pas le form.
      const form = createForm({ designable: true })
      return () =>
        h(
          FormProvider,
          { form },
          {
            default: () =>
              h(
                FormLayout,
                { ...attrs, class: [prefix, FORMIVUEDESIGN_CONTROLS_INERT] },
                slots,
              ),
          },
        )
    },
  }) as any,
) as any

Form.Behavior = createBehavior({
  name: 'Form',
  selector: (node) => node.componentName === 'Form',
  designerProps(node) {
    return {
      draggable: !node.isRoot,
      cloneable: !node.isRoot,
      deletable: !node.isRoot,
      droppable: true,
      propsSchema: AllSchemas.Form,
    }
  },
  designerLocales: AllLocales.Form,
})

Form.Resource = createResource({
  title: { 'en-US': 'Form', 'fr-FR': 'Formulaire', 'es-ES': 'Formulario' },
  icon: 'FormLayoutSource',
  elements: [
    {
      componentName: 'Field',
      props: {
        type: 'object',
        'x-component': 'Form',
      },
    },
  ],
})
