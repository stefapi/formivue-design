// formivue/vue — ArrayBase/createArrayBehavior (port verbatim de l'ère : la
// fabrique de behaviors des composants à tableaux — Addition/Remove/Index/
// MoveUp/MoveDown). Les composants réels (boutons) vivent dans
// ../../array-base.
import { createBehavior, TreeNode } from '@formivue-design/core'
import { normalizeStyle } from 'vue'
import { raw } from '@formivue/reactive'
import { createFieldSchema, createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const arrayOperations = ['Remove', 'Copy', 'MoveDown', 'MoveUp']

// La barre de sélection du designer occupe le premier espace sous la liste.
export const arrayActionPosition = { top: 'calc(100% + 32px)' }

export const createArrayControl = (component: string) =>
  new TreeNode({
    componentName: 'Field',
    props: { type: 'void', 'x-component': component },
  })

export const createArrayRowKeys = () => {
  const ids = new WeakMap<object, number>()
  let nextId = 0
  return (records: unknown[]) => {
    const occurrences = new Map<number, number>()
    return records.map((record, index) => {
      if (!record || typeof record !== 'object') return `position-${index}`
      const target = raw(record)
      const id = ids.get(target) ?? ++nextId
      ids.set(target, id)
      const occurrence = (occurrences.get(id) ?? 0) + 1
      occurrences.set(id, occurrence)
      return `record-${id}-${occurrence}`
    })
  }
}

export const arrayContainerProps = (
  attrs: Record<string, unknown>,
  className: string,
) => {
  const style = normalizeStyle([attrs.style])
  const display =
    typeof style === 'object' && typeof style.display === 'string'
      ? style.display
      : undefined
  return {
    ...Object.fromEntries(
      Object.entries(attrs).filter(
        ([name]) => name.startsWith('data-') || name.startsWith('aria-'),
      ),
    ),
    id: attrs.id,
    style: attrs.style,
    'data-array-inline': display?.startsWith('inline') ? '' : undefined,
    class: [
      className,
      'min-w-0 align-top gap-2',
      !display && 'flex flex-col',
      attrs.class,
    ],
  }
}

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
