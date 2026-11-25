// Getter réévalué à chaque lecture. À utiliser à la place de `computed` de
// Vue pour tout ce qui dérive d'un état @formivue/reactive (field.value,
// field.dataSource, display, TreeNode.children…) : un `computed` Vue ne suit
// pas les observables formivue et resterait figé sur sa première valeur ;
// lu dans le render d'un `observer`, ce getter est tracké par formivue.
export const derived = <T>(getter: () => T): { readonly value: T } => ({
  get value() {
    return getter()
  },
})
