import { IObserverOptions } from '../types'
import { useObserver } from '../hooks/useObserver'

export function observer<C>(baseComponent: C, options?: IObserverOptions): C {
  const opts = baseComponent as any
  const name = options?.name || opts.name || 'ObservableComponent'

  return {
    name,
    ...opts,
    setup(props: Record<string, any>, context: any) {
      useObserver(options)
      return opts?.setup?.(props, context)
    },
  } as C
}
