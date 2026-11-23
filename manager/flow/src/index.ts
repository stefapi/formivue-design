import { isVoidField, type Form } from '@formivue/core'
import { observable, toJS } from '@formivue/reactive'

export type FlowAnswer = string | number | boolean | null

export interface FlowBranch {
  path: string
  equals: FlowAnswer
  next: string | null
}

export interface FlowStep {
  id: string
  /** Field address prefix, including any void ancestors. */
  scope?: string
  /** Additional Formivue query patterns to validate with this step. */
  fields?: readonly string[]
  branches?: readonly FlowBranch[]
  /** Defaults to the following step in the supplied order. */
  next?: string | null
}

export interface FormFlowOptions {
  steps: readonly FlowStep[]
  initialStep?: string
}

export function createFormFlow<Values extends object>(
  form: Form<Values>,
  options: FormFlowOptions,
) {
  const steps = new Map(options.steps.map((step) => [step.id, step]))
  const order = [...steps.keys()]
  if (order.length !== options.steps.length || order.some((id) => !id)) {
    throw new Error('Flow steps must have unique, nonempty IDs.')
  }
  const initialStep = options.initialStep ?? order[0]
  if (initialStep !== undefined && !steps.has(initialStep)) {
    throw new Error(`Unknown initial flow step "${initialStep}".`)
  }
  const following = new Map(order.map((id, index) => [id, order[index + 1]]))
  for (const step of steps.values()) {
    for (const target of [
      step.next,
      ...(step.branches ?? []).map(({ next }) => next),
    ]) {
      if (target != null && !steps.has(target)) {
        throw new Error(
          `Unknown flow step "${target}" referenced by "${step.id}".`,
        )
      }
    }
  }

  const state = observable({
    visited: [] as string[],
    pending: false,
    completed: false,
    errors: [] as unknown[],
  })

  const resolveNext = (id: string) => {
    const step = steps.get(id)
    const branch = step.branches?.find(({ path, equals }) =>
      Object.is(form.getValuesIn(path), equals),
    )
    return branch
      ? branch.next
      : step.next === undefined
        ? following.get(id)
        : step.next
  }

  const getRoute = () => {
    const route: string[] = []
    const seen = new Set<string>()
    let next = initialStep
    while (next != null) {
      if (seen.has(next)) {
        return { route, error: `Flow returns to step "${next}".` }
      }
      seen.add(next)
      route.push(next)
      next = resolveNext(next)
    }
    return { route }
  }

  const getPosition = () => {
    const { route, error } = getRoute()
    let index = 0
    while (
      index + 1 < route.length &&
      state.visited[index] === route[index + 1]
    )
      index++
    return { route, error, index, current: route[index] }
  }

  const validate = async (id: string) => {
    const step = steps.get(id)
    const fields = new Set(
      (step.fields ?? []).flatMap((pattern) => form.query(pattern).map()),
    )
    if (step.scope) {
      for (const field of Object.values(form.fields)) {
        const address = field.address.toString()
        if (address === step.scope || address.startsWith(`${step.scope}.`)) {
          fields.add(field)
        }
      }
    }
    const results = await Promise.allSettled(
      [...fields].flatMap((field) =>
        isVoidField(field) ? [] : [field.validate()],
      ),
    )
    const errors = results.flatMap((result) =>
      result.status === 'rejected'
        ? ([] as unknown[]).concat(result.reason)
        : [],
    )
    state.errors = errors
    return errors.length === 0
  }

  const run = async (action: () => Promise<boolean>) => {
    if (state.pending) return false
    state.pending = true
    state.errors = []
    try {
      return await action()
    } finally {
      state.pending = false
    }
  }

  const setIndex = (route: string[], index: number) => {
    state.visited = route.slice(1, index + 1)
    state.completed = false
  }

  return {
    get route(): readonly string[] {
      return getRoute().route
    },
    get current() {
      return getPosition().current
    },
    get index() {
      return getPosition().index
    },
    get canGoBack() {
      return getPosition().index > 0
    },
    get isLast() {
      const { current, index, route, error } = getPosition()
      return !!current && index === route.length - 1 && !error
    },
    get pending() {
      return state.pending
    },
    get completed() {
      return state.completed
    },
    get errors(): readonly unknown[] {
      return state.errors
    },
    back() {
      const { route, index } = getPosition()
      if (state.pending || index === 0) return false
      setIndex(route, index - 1)
      state.errors = []
      return true
    },
    next() {
      return run(async () => {
        const { current, index } = getPosition()
        if (!current || !(await validate(current))) return false
        const position = getPosition()
        if (position.current !== current) return false
        if (index + 1 >= position.route.length) {
          if (position.error) state.errors = [position.error]
          return false
        }
        setIndex(position.route, index + 1)
        return true
      })
    },
    finish(onComplete?: (values: Values) => unknown) {
      return run(async () => {
        if (state.completed) return false
        const { current, route, index, error } = getPosition()
        if (!current || error || index !== route.length - 1) return false
        for (const [stepIndex, id] of route.entries()) {
          if (!(await validate(id))) {
            setIndex(route, stepIndex)
            return false
          }
          const updated = getRoute()
          if (
            updated.error ||
            route.length !== updated.route.length ||
            route.some((step, i) => step !== updated.route[i])
          ) {
            return false
          }
        }
        await onComplete?.(toJS(form.values))
        state.completed = true
        return true
      })
    },
  }
}

export type FormFlow = ReturnType<typeof createFormFlow>
