// formivue/vue — ArrayBase/createArrayBehavior (port verbatim de l'ère : la
// fabrique de behaviors des composants à tableaux — Addition/Remove/Index/
// MoveUp/MoveDown). Les composants réels (boutons) vivent dans
// ../../array-base.
import { createBehavior, TreeNode } from '@formivue-design/core'
import { arrayOperations } from '@formivue-design/formivue-runtime/bindings'
import { createFieldSchema, createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export {
  arrayContainerProps,
  createArrayRowKeys,
} from '@formivue-design/formivue-runtime/bindings'
export { arrayOperations }

// La barre de sélection du designer occupe le premier espace sous la liste.
export const arrayActionPosition = { top: 'calc(100% + 32px)' }

export const createArrayControl = (component: string) =>
  new TreeNode({
    componentName: 'Field',
    props: { type: 'void', 'x-component': component },
  })

export const createArrayBehavior = (name: string) => {
  const Schemas = AllSchemas as any
  const Locales = AllLocales as any
  return createBehavior(
    {
      name,
      extends: ['Field'],
      selector: (node) => node.props['x-component'] === name,
      designerProps: {
        droppable: true,
        propsSchema: createFieldSchema(Schemas[name], undefined, {
          include: ['JSON', 'EXPRESSION'],
          jsonType: 'array',
        }),
      },
      designerLocales: Locales[name],
    },
    {
      name: `${name}.Addition`,
      extends: ['Field'],
      selector: (node) => node.props['x-component'] === `${name}.Addition`,
      designerProps: {
        allowDrop(parent) {
          return parent.props['x-component'] === name
        },
        propsSchema: createVoidFieldSchema(Schemas[name].Addition),
      },
      designerLocales: Locales.ArrayAddition,
    },
    ...['Index', ...arrayOperations, 'SortHandle'].map((control) => {
      const component = `${name}.${control}`
      return {
        name: component,
        extends: ['Field'],
        selector: (node: TreeNode) => node.props['x-component'] === component,
        designerProps: {
          allowDrop: (parent: TreeNode) => parent.props['x-component'] === name,
          propsSchema: createVoidFieldSchema(),
        },
        designerLocales: Locales[`Array${control}`],
      }
    }),
  )
}
