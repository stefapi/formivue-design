import {
  DocumentValidationError,
  jsonPointer,
  type JsonObject,
} from '@formivue/json-schema'
import type { DataBinding, UiDocumentNode } from './documents'

export const documentDataTypes = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
] as const

export type DocumentDataType = (typeof documentDataTypes)[number]

export interface DocumentDependency {
  componentId: string
  property: string
  /** Null identifies a repeated array item. */
  path: readonly (string | null)[]
  types: readonly DocumentDataType[]
}

export interface DocumentRowsContract {
  columns: readonly {
    column: string
    types: readonly DocumentDataType[]
    property?: string
  }[]
  incomplete?: boolean
  validate?: (rows: unknown[]) => readonly {
    path: readonly string[]
    code: string
    message: string
  }[]
}

export type DocumentBindingContract = { required?: boolean } & (
  | { types: readonly DocumentDataType[]; nullable?: boolean }
  | { rows: DocumentRowsContract }
)

export interface DocumentContractContext {
  path: string
  /** Resolves a dependency and returns the schema's possible types for the adapter to check. */
  resolveBinding(
    binding: DataBinding,
    property: string,
    types: readonly DocumentDataType[],
  ):
    | {
        segments: string[]
        path: string
        types: readonly string[]
        expression?: string
        schema?: DocumentSchemaDescription
      }
    | undefined
  columnSchema(
    property: string,
    column: string,
  ): DocumentSchemaDescription | undefined
  report(issue: {
    code: string
    message: string
    path?: string
    property?: string
  }): void
}

export interface DocumentSchemaDescription {
  types: readonly string[]
  constraints: Readonly<Record<string, unknown>>
  item(index?: number): DocumentSchemaDescription | undefined
}

export interface DocumentComponentContract {
  kind: UiDocumentNode['kind']
  types?: readonly DocumentDataType[]
  items?: readonly DocumentDataType[]
  /** Some widgets use option trees whose values are presentation metadata. */
  enumFromOptions?: false
  bindings?: Readonly<Record<string, DocumentBindingContract>>
  allowsBinding?: (property: string) => boolean
  migrateProps?: (props: JsonObject) => JsonObject
  /** Canonicalizes props when an existing UI document is read. */
  normalizeProps?: (props: JsonObject) => JsonObject
  renameProps?: (
    props: JsonObject,
    context: DocumentRenameContext,
  ) => JsonObject
  compileProps?: (
    props: JsonObject,
    context: DocumentContractContext,
  ) => JsonObject
}

export interface DocumentRenameContext {
  renameBinding(binding: DataBinding): DataBinding
  renameColumn(rowsProperty: string, column: string): string
}

type ContractFactory = (props: JsonObject) => DocumentComponentContract

export interface DocumentContractExtension {
  name: string
  components: Readonly<
    Record<string, DocumentComponentContract | ContractFactory>
  >
}

export interface DocumentContractRegistry {
  resolve(
    component: string | undefined,
    props?: JsonObject,
  ): DocumentComponentContract | undefined
}

export interface DocumentContractOptions {
  contracts?: DocumentContractRegistry
}

const choices = ['string', 'number'] as const
const fields: Record<string, readonly DocumentDataType[]> = {
  Input: ['string'],
  'Input.TextArea': ['string'],
  Password: ['string'],
  NumberPicker: ['number'],
  Rate: ['number'],
  Slider: ['number'],
  DatePicker: ['string'],
  TimePicker: ['string'],
  Switch: ['boolean'],
  'Radio.Group': choices,
  Text: ['string'],
  PreviewText: ['string', 'number', 'boolean', 'null'],
  Checkbox: ['boolean'],
  Radio: choices,
}

const lists: Record<string, readonly DocumentDataType[]> = {
  'Checkbox.Group': choices,
  Transfer: choices,
  'DatePicker.RangePicker': ['string'],
  'TimePicker.RangePicker': ['string'],
  Upload: ['object'],
  'Upload.Dragger': ['object'],
}

const arrayActions = [
  'Index',
  'Addition',
  'Remove',
  'Copy',
  'MoveDown',
  'MoveUp',
]
const layouts = [
  'FormItem',
  'Card',
  'Space',
  'FormLayout',
  'FormGrid',
  'FormGrid.GridColumn',
  'FormTab',
  'FormTab.TabPane',
  'FormCollapse',
  'FormCollapse.CollapsePanel',
  'ArrayTable.Column',
  'ArrayTable.SortHandle',
  ...['ArrayCards', 'ArrayTable'].flatMap((name) =>
    arrayActions.map((action) => `${name}.${action}`),
  ),
]

const select = (props: JsonObject): DocumentComponentContract =>
  props.multiple === true
    ? { kind: 'field', types: ['array'], items: choices }
    : { kind: 'field', types: choices }

const standard: DocumentContractExtension = {
  name: 'standard',
  components: {
    ...Object.fromEntries(layouts.map((name) => [name, { kind: 'void' }])),
    ...Object.fromEntries(
      Object.entries(fields).map(([name, types]) => [
        name,
        { kind: 'field', types },
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(lists).map(([name, items]) => [
        name,
        { kind: 'field', types: ['array'], items },
      ]),
    ),
    Object: { kind: 'object' },
    ArrayTable: { kind: 'array' },
    ArrayCards: { kind: 'array' },
    Select: select,
    TreeSelect: (props) => ({ ...select(props), enumFromOptions: false }),
    Cascader: {
      kind: 'field',
      types: ['array'],
      items: choices,
      enumFromOptions: false,
    },
  },
}

export function createDocumentContractRegistry(
  extensions: readonly DocumentContractExtension[] = [],
): DocumentContractRegistry {
  const contracts = new Map<
    string,
    { name: string; contract: DocumentComponentContract | ContractFactory }
  >()
  for (const { name, components } of [standard, ...extensions]) {
    for (const [component, contract] of Object.entries(components)) {
      const previous = contracts.get(component)
      if (previous)
        throw new DocumentValidationError([
          {
            path: jsonPointer(['extensions', name, component]),
            component,
            code: 'duplicate_component_contract',
            severity: 'error',
            message: `Component "${component}" already has a contract from "${previous.name}"`,
          },
        ])
      contracts.set(component, { name, contract })
    }
  }
  return {
    resolve(component, props = {}) {
      if (component === undefined) return
      const contract = contracts.get(component)?.contract
      return typeof contract === 'function' ? contract(props) : contract
    },
  }
}

export const standardDocumentContracts = createDocumentContractRegistry()
