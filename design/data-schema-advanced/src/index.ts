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
        if (!resolved.types.includes(type))
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
              columns: columns.flatMap((column) => {
                const key = isJsonObject(column) ? column.key : undefined
                return typeof key === 'string' && key
                  ? [{ column: key, types: scalarTypes }]
                  : []
              }),
              incomplete: columns.some(
                (column) =>
                  !isJsonObject(column) ||
                  typeof column.key !== 'string' ||
                  !column.key,
              ),
            },
          },
        },
      }
    },
  },
}
