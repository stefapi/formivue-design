import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { dialectValidator, needsDialectEvaluation } from './document-dialect'
import {
  dataSchemaLocations,
  type JsonDataSchema,
  type DataSchemaRegistry,
} from './document-schema-resources'

import {
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
  type DocumentIssue,
  type JsonValue,
} from './document-json'

export interface DataSchemaValidationOptions {
  /** External schema resources are explicitly registered by the application. */
  resources?: DataSchemaRegistry
  /** The document manager asserts registered formats by default. */
  format?: 'assert' | 'annotate'
  /** Include both values for failed const rules and collapse their direct conditional summary. */
  includeConstantValues?: boolean
  /** Include the failed rule and the input it rejected for display in a data editor. */
  includeValidationDetails?: boolean
}

export function compileDataValidator(
  schema: JsonDataSchema,
  {
    resources = {},
    format = 'assert',
    includeConstantValues = false,
    includeValidationDetails = false,
  }: DataSchemaValidationOptions = {},
) {
  const ajv = new Ajv2020({
    allErrors: true,
    strictSchema: false,
    strictTypes: false,
    strictRequired: false,
    strictTuples: false,
    validateFormats: format === 'assert',
    verbose: includeValidationDetails,
    multipleOfPrecision: 12,
    ownProperties: true,
  })
  addFormats(ajv)
  try {
    for (const [uri, resource] of Object.entries(resources))
      ajv.addSchema(resource, uri)
    for (const document of [schema, ...Object.values(resources)]) {
      if (!ajv.validateSchema(document))
        throw new DocumentValidationError(
          ajv.errors.map(({ instancePath, keyword, message }) => ({
            path: instancePath,
            code: 'invalid_schema_keyword',
            message: message ?? keyword,
          })),
        )
      for (const path of dataSchemaLocations(document)) {
        const node = valueAt(document, path)
        if (!path.length || !isJsonObject(node) || typeof node.$id === 'string')
          continue
        for (const keyword of ['$schema', '$vocabulary'])
          if (node[keyword] !== undefined)
            throw new DocumentValidationError([
              {
                path: jsonPointer([...path, keyword]),
                code: 'invalid_schema_keyword',
                message: `${keyword} belongs at a schema resource root`,
              },
            ])
      }
    }
    if (needsDialectEvaluation(schema, resources))
      return dialectValidator(schema, resources, format === 'assert', {
        includeConstantValues,
        includeValidationDetails,
      })
    const validate = ajv.compile(schema)
    return (value: unknown): DocumentIssue[] => {
      if (validate(value)) return []
      const errors = validate.errors
      // A direct failure already explains why its conditional branch failed.
      const directFailures =
        includeConstantValues || includeValidationDetails
          ? new Set(
              errors
                .filter(({ keyword }) =>
                  includeValidationDetails
                    ? keyword !== 'if'
                    : keyword === 'const',
                )
                .map(({ instancePath, schemaPath }) =>
                  JSON.stringify([
                    instancePath,
                    schemaPath.slice(0, schemaPath.lastIndexOf('/')),
                  ]),
                ),
            )
          : undefined
      const nameFailures = includeValidationDetails
        ? new Set(
            errors.flatMap(({ instancePath, schemaPath, propertyName }) =>
              propertyName === undefined
                ? []
                : [
                    JSON.stringify([
                      instancePath,
                      schemaPath.slice(0, schemaPath.lastIndexOf('/')),
                      propertyName,
                    ]),
                  ],
            ),
          )
        : undefined
      const containsFailures = includeValidationDetails
        ? errors.filter(({ keyword }) => keyword === 'contains')
        : []
      const issues = directFailures?.size
        ? errors.filter(({ keyword, instancePath, schemaPath, params }) => {
            if (keyword === 'if') {
              const branch =
                schemaPath.slice(0, schemaPath.lastIndexOf('/') + 1) +
                params.failingKeyword
              if (directFailures.has(JSON.stringify([instancePath, branch])))
                return false
            }
            if (
              keyword === 'propertyNames' &&
              nameFailures?.has(
                JSON.stringify([instancePath, schemaPath, params.propertyName]),
              )
            )
              return false
            // Contains tests each item as a candidate. One failed candidate is
            // not a standalone violation of the array's rule.
            return !containsFailures.some(
              (parent) =>
                schemaPath.startsWith(parent.schemaPath + '/') &&
                instancePath.startsWith(parent.instancePath + '/'),
            )
          })
        : errors
      return issues.map(
        ({
          instancePath,
          message,
          keyword,
          params,
          propertyName,
          schema: constraint,
          data,
        }) => {
          const field =
            propertyName ??
            params.missingProperty ??
            params.additionalProperty ??
            params.unevaluatedProperty ??
            params.propertyName
          return {
            path:
              typeof field === 'string'
                ? instancePath + jsonPointer([field])
                : instancePath,
            message: message ?? keyword,
            ...(includeConstantValues && keyword === 'const'
              ? {
                  constantMismatch: {
                    expected: params.allowedValue as JsonValue,
                    actual:
                      propertyName ??
                      valueAt(value, pointerSegments(instancePath)),
                  },
                }
              : {}),
            ...(includeValidationDetails
              ? {
                  validationDetails: {
                    keyword,
                    expected:
                      keyword === 'contains'
                        ? { ...params, itemSchema: constraint }
                        : constraint,
                    actual:
                      typeof field === 'string' && propertyName === undefined
                        ? keyword === 'propertyNames'
                          ? field
                          : valueAt(data, [field])
                        : keyword === 'uniqueItems' && Array.isArray(data)
                          ? data[params.i]
                          : data,
                  },
                }
              : {}),
          }
        },
      )
    }
  } catch (error) {
    if (error instanceof DocumentValidationError) throw error
    throw new DocumentValidationError([{ path: '', message: String(error) }])
  }
}
