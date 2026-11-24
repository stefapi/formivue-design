import {
  compileDataValidator,
  isJsonObject,
  type JsonObject,
  type JsonValue,
} from '@formivue/json-schema'
import type { UiDocumentNode } from './documents'

type Constraints = Record<string, unknown>
type Report = (message: string, code: string, property?: string) => void

const numeric = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
]
const limits = [
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'minProperties',
  'maxProperties',
]
const optionControls = [
  'Select',
  'Radio',
  'Radio.Group',
  'Combobox',
  'ToggleGroup',
  'Checkbox.Group',
]
const numericControls = ['NumberPicker', 'Slider']
const numericValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

function integerStep(multiple: number) {
  if (Number.isInteger(multiple)) return multiple
  const [significand, exponent = '0'] = String(multiple).split('e')
  const [whole, fraction = ''] = significand.split('.')
  const numerator = BigInt(whole + fraction)
  let factor = numerator
  let denominator = 10n ** BigInt(fraction.length - Number(exponent))
  while (denominator !== 0n) {
    const remainder = factor % denominator
    factor = denominator
    denominator = remainder
  }
  return Number(numerator / factor)
}

function numberRange(
  constraints: Constraints,
  integer: boolean,
  step?: number,
) {
  const min = numericValue(constraints.minimum)
  const max = numericValue(constraints.maximum)
  const lower = numericValue(constraints.exclusiveMinimum)
  const upper = numericValue(constraints.exclusiveMaximum)
  const low = Math.max(min ?? -Infinity, lower ?? -Infinity)
  const high = Math.min(max ?? Infinity, upper ?? Infinity)
  const lowOpen = lower === low
  const highOpen = upper === high
  const grid = step && step > 0 ? step : integer ? 1 : undefined
  const position = (value: number) => {
    const quotient = value / grid
    const nearest = Math.round(quotient)
    return Math.abs(quotient - nearest) <=
      Number.EPSILON * Math.max(1, Math.abs(quotient)) * 4
      ? nearest
      : quotient
  }
  const lowerIndex =
    grid && Number.isFinite(low)
      ? lowOpen
        ? Math.floor(position(low)) + 1
        : Math.ceil(position(low))
      : undefined
  const upperIndex =
    grid && Number.isFinite(high)
      ? highOpen
        ? Math.ceil(position(high)) - 1
        : Math.floor(position(high))
      : undefined
  const gridValue = (index: number) => Number((index * grid).toPrecision(15))
  return {
    min: lowerIndex === undefined ? numericValue(low) : gridValue(lowerIndex),
    max: upperIndex === undefined ? numericValue(high) : gridValue(upperIndex),
    empty:
      low > high ||
      (low === high && (lowOpen || highOpen)) ||
      (lowerIndex !== undefined &&
        upperIndex !== undefined &&
        lowerIndex > upperIndex),
  }
}

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)

export function projectDocumentConstraints({
  node,
  constraints,
  itemConstraints,
  types,
  props,
  report,
}: {
  node: UiDocumentNode
  constraints: Constraints
  itemConstraints: Constraints
  types: string[]
  props: JsonObject
  report: Report
}) {
  const setting = (keyword: string) => numericValue(constraints[keyword])
  const values = types.filter((type) => type !== 'null')
  const integer = values.length === 1 && values[0] === 'integer'
  const multiple = setting('multipleOf')
  const grid =
    multiple > 0
      ? integer
        ? integerStep(multiple)
        : multiple
      : integer
        ? 1
        : undefined
  const range = numberRange(constraints, integer, grid)
  if (
    range.empty &&
    values.length &&
    values.every((type) => type === 'number' || type === 'integer')
  )
    report(
      'The numeric constraints leave no allowed value',
      'empty_numeric_range',
      'minimum',
    )
  for (const [min, max] of [
    ['minLength', 'maxLength'],
    ['minItems', 'maxItems'],
    ['minProperties', 'maxProperties'],
  ]) {
    if (setting(min) > setting(max))
      report(`${min} must not exceed ${max}`, 'incompatible_schema_limits', min)
  }

  if (numericControls.includes(node.component)) {
    const min = numericValue(props.min)
    const max = numericValue(props.max)
    const combined = numberRange(
      {
        ...constraints,
        minimum: Math.max(min ?? -Infinity, setting('minimum') ?? -Infinity),
        maximum: Math.min(max ?? Infinity, setting('maximum') ?? Infinity),
      },
      integer,
      grid,
    )
    for (const [prop, value] of [
      ['min', combined.min],
      ['max', combined.max],
    ] as const) {
      if (
        value === undefined ||
        (props[prop] !== undefined && typeof props[prop] !== 'number')
      )
        continue
      props[prop] = value
    }
    if (combined.empty && !range.empty)
      report(
        'The control bounds conflict with the data schema',
        'incompatible_control_bounds',
        'minimum',
      )
    if (multiple > 0 && grid > 0) props.step = grid
    else if (
      integer &&
      !(Number.isInteger(props.step) && Number(props.step) > 0)
    )
      props.step = 1
    if (integer && node.component === 'NumberPicker') props.precision = 0
    if (
      node.component === 'NumberPicker' &&
      (integer || numeric.some((key) => own(constraints, key)))
    )
      props.allowInvalid = true
  }
  if (
    (node.component === 'ArrayTable' || node.component === 'ArrayCards') &&
    node.kind === 'array'
  ) {
    for (const key of ['minItems', 'maxItems'])
      if (setting(key) !== undefined) props[key] = setting(key)
  }
  if (node.component === 'Input' && props.type === undefined) {
    if (constraints.format === 'email') props.type = 'email'
    if (constraints.format === 'uri') props.type = 'url'
  }

  const list = values.length === 1 && values[0] === 'array'
  const domain = list ? itemConstraints : constraints
  const named =
    Array.isArray(domain.oneOf) &&
    domain.oneOf.length &&
    domain.oneOf.every((option) => isJsonObject(option) && own(option, 'const'))
      ? domain.oneOf.map((option) => ({
          value: option.const,
          label: option.title ?? String(option.const),
        }))
      : undefined
  const choices = Array.isArray(domain.enum)
    ? domain.enum
    : own(domain, 'const')
      ? [domain.const]
      : named
  const explicit =
    node.options ?? (Array.isArray(props.options) ? props.options : undefined)
  if (
    optionControls.includes(node.component) &&
    explicit?.length &&
    (choices ||
      [...numeric, ...limits, 'pattern', 'format'].some((key) =>
        own(domain, key),
      ))
  ) {
    const assertions = Object.fromEntries(
      [...numeric, ...limits, 'type', 'pattern', 'format', 'enum', 'const']
        .filter((key) => own(domain, key))
        .map((key) => [key, domain[key]]),
    )
    if (named) assertions.oneOf = domain.oneOf
    const validate = compileDataValidator(assertions)
    for (const option of explicit) {
      const value =
        isJsonObject(option) && own(option, 'value') ? option.value : option
      if (validate(value).length) {
        report(
          `The option ${JSON.stringify(value)} is excluded by the data schema`,
          'incompatible_ui_option',
          'enum',
        )
        break
      }
    }
  }
  return { choices: (node.options ?? choices) as JsonValue[] | undefined }
}
