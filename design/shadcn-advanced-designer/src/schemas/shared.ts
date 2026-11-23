import type { ISchema } from '@formivue/json-schema'

export type PropertySchema = ISchema & { anyOf?: ISchema[] }

export const jsonScalar: PropertySchema = {
  anyOf: ['string', 'number', 'boolean', 'null'].map((type) => ({ type })),
}

type Editor =
  | 'Input'
  | 'Input.TextArea'
  | 'Switch'
  | 'NumberPicker'
  | 'ValueInput'
  | string[]

export const componentSchema = <Properties extends Record<string, ISchema>>(
  properties: Properties,
) => ({ type: 'object', properties }) satisfies ISchema

export const editor = (
  component: Editor,
  props?: Record<string, unknown>,
  schema?: PropertySchema,
): PropertySchema => ({
  type:
    component === 'Switch'
      ? 'boolean'
      : component === 'NumberPicker'
        ? 'number'
        : 'string',
  'x-decorator': 'FormItem',
  'x-component': Array.isArray(component) ? 'Select' : component,
  ...(Array.isArray(component) ? { enum: component } : {}),
  ...(component === 'NumberPicker'
    ? { minimum: props?.min as number, maximum: props?.max as number }
    : {}),
  ...(props ? { 'x-component-props': props } : {}),
  ...schema,
})

export const jsonArray = (items: ISchema, allowExpression = false): ISchema =>
  editor(
    'ValueInput',
    {
      include: allowExpression ? ['JSON', 'EXPRESSION'] : ['JSON'],
      jsonType: 'array',
    },
    { type: 'array', items },
  )
