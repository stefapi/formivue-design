// Phase 2.4 — TreeNode exerce aussi @formivue/reactive v3 du fork (define/observable).
import { TreeNode } from '@formivue-design/core'

describe('core/models/TreeNode', () => {
  test('racine sans parent', () => {
    const root = new TreeNode({ componentName: 'Form' })
    expect(root.root).toBe(root)
    expect(root.parent).toBeUndefined()
    expect(root.depth).toBe(0)
    expect(root.componentName).toBe('Form')
    expect(root.id).toBeTruthy()
  })

  test('composant par défaut', () => {
    expect(new TreeNode({}).componentName).toBe('NO_NAME_COMPONENT')
  })

  test('enfant : parent, depth, root', () => {
    const root = new TreeNode({ componentName: 'Form' })
    const child = new TreeNode(
      { componentName: 'Field', props: { name: 'a' } },
      root,
    )
    expect(child.parent).toBe(root)
    expect(child.depth).toBe(1)
    expect(child.root).toBe(root)
    expect(child.props).toEqual({ name: 'a' })
  })

  test('constructeur : TreeNode passé tel quel (même instance)', () => {
    const node = new TreeNode({ componentName: 'Form' })
    expect(new TreeNode(node)).toBe(node)
  })

  test('isMyParents', () => {
    const root = new TreeNode({ componentName: 'Form' })
    const child = new TreeNode({ componentName: 'Field' }, root)
    expect(child.isMyParents(root)).toBe(true)
    expect(root.isMyParents(child)).toBe(false)
  })
})
