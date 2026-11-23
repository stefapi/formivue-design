import { createForm, Form } from '@formivue/core'
import { ISchema, Schema, SchemaKey } from '../'

// This is the schema
const schemaJson = {
  type: 'object',
  title: 'xxx configuration',
  properties: {
    string: {
      type: 'string',
      title: 'string',
      maxLength: 5,
      required: true,
    },
    number: {
      type: 'number',
      title: 'number',
      required: true,
    },
    url: {
      type: 'string',
      title: 'url',
      format: 'url',
    },
    arr: {
      type: 'array',
      title: 'array',
      maxItems: 2,
      required: true,
      items: {
        type: 'object',
        properties: {
          string: {
            type: 'string',
            title: 'string',
            required: true,
          },
        },
      },
    },
  },
}
// This is the data to validate
const schemaData = {
  string: '123456', // more than 5 characters
  // the number field does not exist
  url: 'xxxxx', // invalid url
  arr: [
    {
      string: '1',
    },
    {
      string: '2',
    },
    {
      // the array exceeds 2 items
      string: '', // not filled in
    },
  ],
}

function recursiveField(
  form: Form,
  schema: ISchema,
  basePath?: string,
  name?: SchemaKey,
) {
  const fieldSchema = new Schema(schema)
  const fieldProps = fieldSchema.toFieldProps()

  function recursiveProperties(propBasePath?: string) {
    fieldSchema.mapProperties((propSchema, propName) => {
      recursiveField(form, propSchema, propBasePath, propName)
    })
  }

  if (name === undefined || name === null) {
    recursiveProperties(basePath)
    return
  }

  if (schema.type === 'object') {
    const field = form.createObjectField({
      ...fieldProps,
      name,
      basePath,
    })

    recursiveProperties(field.address.toString())
  } else if (schema.type === 'array') {
    const field = form.createArrayField({
      ...fieldProps,
      name,
      basePath,
    })

    const fieldAddress = field.address.toString()
    const fieldValues = form.getValuesIn(fieldAddress)
    fieldValues.forEach((value: any, index: number) => {
      if (schema.items) {
        const itemsSchema = Array.isArray(schema.items)
          ? schema.items[index] || schema.items[0]
          : schema.items

        recursiveField(form, itemsSchema as ISchema, fieldAddress, index)
      }
    })
  } else if (schema.type === 'void') {
    const field = form.createVoidField({
      ...fieldProps,
      name,
      basePath,
    })

    recursiveProperties(field.address.toString())
  } else {
    form.createField({
      ...fieldProps,
      name,
      basePath,
    })
  }
}
test('server validate', async () => {
  const form = createForm({
    values: schemaData,
  })
  recursiveField(form, schemaJson)
  let errors: any[]
  try {
    await form.validate()
  } catch (e) {
    errors = e
  }
  expect(errors).not.toBeUndefined()
})
