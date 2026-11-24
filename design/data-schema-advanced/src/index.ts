import { FormPath } from '@formivue/core'
import {
  isJsonObject,
  jsonPointer,
  type JsonValue,
} from '@formivue/json-schema'
import type {
  DocumentComponentContract,
  DocumentContractExtension,
  DocumentDataType,
} from '@formivue-design/formivue-transformer'

const choices = ['string', 'number'] as const
const scalarTypes = ['string', 'number', 'boolean', 'null'] as const
const layouts = [
  'Carousel',
  'CarouselSlide',
  'Drawer',
  'Sheet',
  'ScrollArea',
  'Resizable',
  'ResizablePanel',
  'Questionnaire',
  'Stepper',
]

function branchValueType(value: JsonValue): DocumentDataType | undefined {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number'
    case 'string':
      return 'string'
    case 'boolean':
      return 'boolean'
  }
}

const branchStep: DocumentComponentContract = {
  kind: 'void',
  renameProps(props, { renameBinding }) {
    if (!Array.isArray(props.branches)) return props
    let changed = false
    const branches = props.branches.map((branch) => {
      if (!isJsonObject(branch) || typeof branch.path !== 'string')
        return branch
      const next = renameBinding({ path: branch.path })
      if (next.path === branch.path) return branch
      changed = true
      return { ...branch, path: next.path }
    })
    return changed ? { ...props, branches } : props
  },
  migrateProps(props) {
    if (!Array.isArray(props.branches)) return props
    return {
      ...props,
      branches: props.branches.map((branch) =>
        isJsonObject(branch) && typeof branch.path === 'string'
          ? {
              ...branch,
              path: jsonPointer(FormPath.parse(branch.path).segments),
            }
          : branch,
      ),
    }
  },
  compileProps(props, { resolveBinding, report }) {
    if (!Array.isArray(props.branches)) return props
    return {
      ...props,
      branches: props.branches.map((branch, index) => {
        const property = `branches[${index}].path`
        if (!isJsonObject(branch) || typeof branch.path !== 'string') {
          report({
            property,
            code: 'invalid_branch_binding',
            message: 'Invalid branch binding',
          })
          return branch
        }
        const type = branchValueType(branch.equals)
        if (!type) {
          report({
            property,
            code: 'incompatible_branch_value',
            message: 'Branch value must be a JSON scalar',
          })
          return branch
        }
        const resolved = resolveBinding({ path: branch.path }, property, [type])
        if (!resolved) return branch
        const restrictions = resolved.schema?.constraints
        if (
          !resolved.types.includes(type) ||
          (restrictions &&
            Object.prototype.hasOwnProperty.call(restrictions, 'const') &&
            restrictions.const !== branch.equals) ||
          (Array.isArray(restrictions?.enum) &&
            !restrictions.enum.includes(branch.equals))
        )
          report({
            property,
            path: resolved.path,
            code: 'incompatible_branch_value',
            message: 'Branch value is incompatible with the data schema',
          })
        return { ...branch, path: resolved.segments }
      }),
    }
  },
}

const display = (...properties: string[]): DocumentComponentContract => ({
  kind: 'void',
  bindings: Object.fromEntries(
    properties.map((prop) => [prop, { types: ['string'], nullable: true }]),
  ),
})

export const advancedDocumentContracts: DocumentContractExtension = {
  name: 'advanced',
  components: {
    ...Object.fromEntries(layouts.map((name) => [name, { kind: 'void' }])),
    Avatar: display('src', 'alt', 'fallback'),
    Badge: display('text'),
    HoverCard: display('triggerText', 'title', 'message', 'href'),
    Combobox: { kind: 'field', types: choices },
    InputOTP: { kind: 'field', types: ['string'] },
    TagsInput: { kind: 'field', types: ['array'], items: ['string'] },
    ToggleGroup: (props) =>
      props.multiple === true
        ? { kind: 'field', types: ['array'], items: choices }
        : { kind: 'field', types: choices },
    QuestionnaireStep: branchStep,
    StepperStep: branchStep,
    DataTable: (props) => {
      const columns = Array.isArray(props.columns) ? props.columns : []
      const mapped = columns.flatMap((column) => {
        const key = isJsonObject(column) ? column.key : undefined
        return typeof key === 'string' && key
          ? [{ column: key, types: scalarTypes }]
          : []
      })
      const rowKey =
        typeof props.rowKey === 'string' && props.rowKey
          ? props.rowKey
          : undefined
      return {
        kind: 'void',
        renameProps(props, { renameColumn }) {
          let changed = false
          const columns = (
            Array.isArray(props.columns) ? props.columns : []
          ).map((column) => {
            if (!isJsonObject(column) || typeof column.key !== 'string')
              return column
            const key = renameColumn('rows', column.key)
            if (key === column.key) return column
            changed = true
            return { ...column, key }
          })
          const rowKey =
            typeof props.rowKey === 'string'
              ? renameColumn('rows', props.rowKey)
              : undefined
          return changed || (rowKey !== undefined && rowKey !== props.rowKey)
            ? {
                ...props,
                ...(changed ? { columns } : {}),
                ...(rowKey === undefined ? {} : { rowKey }),
              }
            : props
        },
        allowsBinding: (property) =>
          property !== 'columns' &&
          property !== 'series' &&
          !property.endsWith('Key'),
        bindings: {
          rows: {
            required: true,
            rows: {
              columns: [
                ...mapped,
                ...(rowKey
                  ? [
                      {
                        column: rowKey,
                        types: ['string', 'number'] as const,
                        property: 'rowKey',
                      },
                    ]
                  : []),
              ],
              incomplete:
                mapped.length !== columns.length ||
                new Set(mapped.map(({ column }) => column)).size !==
                  mapped.length ||
                (props.rowKey !== undefined && !rowKey),
              validate: rowKey
                ? (rows) => {
                    const keys = new Set<string>()
                    return rows.flatMap((row, index) => {
                      const value = isJsonObject(row) ? row[rowKey] : undefined
                      const path = [String(index), rowKey]
                      if (
                        typeof value !== 'string' &&
                        typeof value !== 'number'
                      )
                        return [
                          {
                            path,
                            code: 'invalid_table_row_key',
                            message:
                              'A table row key must be a string or number',
                          },
                        ]
                      const key = String(value)
                      if (keys.has(key))
                        return [
                          {
                            path,
                            code: 'duplicate_table_row_key',
                            message: 'Table row keys must be unique',
                          },
                        ]
                      keys.add(key)
                      return []
                    })
                  }
                : undefined,
            },
          },
        },
      }
    },
  },
}
