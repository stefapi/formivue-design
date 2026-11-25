import {
  copyJson,
  createDataDocument,
  type DataSchemaValidationOptions,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  projectDocumentRows,
  valueAt,
  type DocumentIssue,
  type DocumentRowKey,
  type ISchema,
  type JsonObject,
} from '@formivue/json-schema'
import {
  documentDataTypes,
  standardDocumentContracts,
  type DocumentContractOptions,
  type DocumentDataType,
  type DocumentDependency,
  type DocumentRowsContract,
  type DocumentSchemaDescription,
} from './document-contracts'
import { schemaLookup, type DataSchema } from './document-schema'
import { projectDocumentConstraints } from './document-projection'
import { visitUiNodes } from './document-paths'
import {
  assertSafeDocumentUi,
  assertSafeRenderMetadata,
  type DocumentTrustOptions,
} from './document-trust'

export interface DataBinding {
  path: string
  /** Optional row-relative JSON Pointers keyed by the consumer's column names. */
  columnPaths?: Record<string, string>
  /** Object or array item containing this node. Omitted paths start at document root. */
  scope?: 'parent'
  /** Expected JSON types for a property outside the built-in data slots. */
  types?: string[]
}

export interface UiDocumentNode {
  id: string
  key: string
  kind: 'field' | 'object' | 'array' | 'void'
  component?: string
  /** Path within the current data object. Editors write to this location. */
  bind?: string
  bindings?: Record<string, DataBinding>
  props?: JsonObject
  /** Formivue presentation metadata (decorator, display, reactions and labels). */
  field?: JsonObject
  options?: JsonObject[]
  children?: UiDocumentNode[]
  item?: UiDocumentNode
  rowKey?: string
}

export interface UiDocument {
  version: 1
  form?: JsonObject
  nodes: UiDocumentNode[]
}

export interface FormDocuments {
  ui: UiDocument
  dataSchema: Exclude<DataSchema, boolean>
  data: JsonObject
}

export interface CompileFormDocumentOptions
  extends DocumentContractOptions, DocumentTrustOptions {
  hasComponent?: (component: string) => boolean
  schemaValidation?: DataSchemaValidationOptions
}

export function compileFormDocuments(
  { ui, dataSchema }: Pick<FormDocuments, 'ui' | 'dataSchema'>,
  {
    contracts = standardDocumentContracts,
    hasComponent,
    schemaValidation,
    trusted,
  }: CompileFormDocumentOptions = {},
) {
  if (
    !isJsonObject(ui) ||
    ui.version !== 1 ||
    !Array.isArray(ui.nodes) ||
    (ui.form !== undefined && !isJsonObject(ui.form))
  )
    throw new DocumentValidationError([
      {
        path: '/ui',
        code: 'invalid_ui_document',
        severity: 'error',
        message: 'Expected a version 1 UI document',
      },
    ])
  if (!isJsonObject(dataSchema))
    throw new DocumentValidationError([
      {
        path: '/dataSchema',
        code: 'invalid_data_schema',
        severity: 'error',
        message: 'Expected a JSON Schema object',
      },
    ])
  assertSafeDocumentUi(ui, { trusted })
  const lookup = schemaLookup(dataSchema, schemaValidation?.resources)
  const describeSchema = (
    schema: DataSchema,
  ): DocumentSchemaDescription | undefined =>
    schema === undefined || schema === false
      ? undefined
      : {
          types: lookup.possible(schema),
          constraints: lookup.constraints(schema),
          item: (index) =>
            describeSchema(
              lookup.child(schema, index === undefined ? null : String(index)),
            ),
        }
  if (!lookup.accepts(dataSchema, ['object']))
    throw new DocumentValidationError([
      {
        path: '/dataSchema',
        code: 'invalid_data_schema',
        severity: 'error',
        message: 'The root schema must describe an object',
      },
    ])
  const issues: DocumentIssue[] = []
  const rowKeys: DocumentRowKey[] = []
  const ids = new Set<string>()
  const editors = new Set<string>()
  const formatProperties = new Set([
    'title',
    'description',
    'readOnly',
    'writeOnly',
  ])
  const reservedProperties = new Set([
    'x-component',
    'x-component-props',
    'x-designable-id',
    'x-index',
    'x-value',
  ])
  const dependencies: DocumentDependency[] = []
  const rowChecks: {
    node: UiDocumentNode
    property: string
    path: (string | null)[]
    validate: NonNullable<DocumentRowsContract['validate']>
    columns: Record<string, string[]>
  }[] = []
  const fail = (
    node: UiDocumentNode,
    path: string,
    message: string,
    code = 'invalid_ui_binding',
    property?: string,
  ) =>
    issues.push({
      component: node.component ?? node.id,
      componentId: node.id,
      path,
      message,
      code,
      severity: 'error',
      property,
    })
  const parse = (node: UiDocumentNode, pointer: string) => {
    try {
      return pointerSegments(pointer)
    } catch {
      fail(
        node,
        String(pointer),
        'Invalid JSON Pointer',
        'invalid_json_pointer',
      )
      return []
    }
  }
  const location = (path: (string | null)[]) =>
    jsonPointer(path.map((key) => key ?? '*'))

  function compileNode(
    node: UiDocumentNode,
    parent: (string | null)[],
    item = false,
  ) {
    if (
      !isJsonObject(node) ||
      !['field', 'array', 'object', 'void'].includes(node.kind) ||
      typeof node.id !== 'string' ||
      !node.id ||
      typeof node.key !== 'string' ||
      !node.key ||
      (node.children !== undefined && !Array.isArray(node.children)) ||
      (node.component !== undefined && typeof node.component !== 'string') ||
      (node.options !== undefined && !Array.isArray(node.options)) ||
      (node.props !== undefined && !isJsonObject(node.props)) ||
      (node.field !== undefined && !isJsonObject(node.field)) ||
      (node.bindings !== undefined && !isJsonObject(node.bindings))
    ) {
      issues.push({
        path: location(parent),
        code: 'invalid_ui_node',
        severity: 'error',
        message: 'Invalid UI node',
      })
      return
    }
    if (ids.has(node.id))
      fail(node, location(parent), `Duplicate UI id "${node.id}"`)
    ids.add(node.id)
    const unknownComponent =
      node.component && hasComponent && !hasComponent(node.component)
    if (unknownComponent)
      fail(
        node,
        location(parent),
        `Unknown component "${node.component}"`,
        'unknown_component',
      )
    for (const key of Object.keys(node.field ?? {}))
      if (
        !formatProperties.has(key) &&
        (!key.startsWith('x-') || reservedProperties.has(key))
      )
        fail(node, location(parent), `Unsupported field metadata "${key}"`)
    const expected = contracts.resolve(node.component, node.props)
    if (expected && expected.kind !== node.kind)
      fail(node, location(parent), `Expected a ${expected.kind} node`)
    const bind = node.kind !== 'void' && !item ? parse(node, node.bind) : []
    if (node.kind !== 'void' && !item && !bind.length)
      fail(node, location(parent), 'A data binding is required')
    if ((node.kind === 'void' || item) && node.bind !== undefined)
      fail(node, location(parent), 'This node inherits its data scope')
    if (
      [...bind, node.key].some(
        (key) =>
          !key || /[.[\]*,]|^(?:__proto__|prototype|constructor)$/u.test(key),
      )
    )
      fail(node, location(parent), 'Field keys must be addressable by Formivue')
    for (let depth = 1; depth < bind.length; depth++)
      if (
        !lookup.accepts(lookup.at([...parent, ...bind.slice(0, depth)]), [
          'object',
        ])
      )
        fail(
          node,
          location([...parent, ...bind.slice(0, depth)]),
          'Expected an object in the binding path',
        )
    const path = [...parent, ...bind]
    const pathName = location(path)
    const target = lookup.at(path)
    if (node.component && !expected && !unknownComponent)
      issues.push({
        component: node.component,
        componentId: node.id,
        path: node.kind === 'void' ? location([...path, node.key]) : pathName,
        code: 'missing_component_contract',
        severity: 'warning',
        message: `No data contract registered for "${node.component}"`,
      })
    if (node.kind !== 'void') {
      if (target === undefined || target === false)
        fail(
          node,
          pathName,
          'Path is missing from the data schema',
          'missing_data_path',
          'bind',
        )
      const types: readonly DocumentDataType[] =
        node.kind === 'field' ? expected?.types : [node.kind]
      if (types) {
        dependencies.push({
          componentId: node.id,
          property: 'bind',
          path,
          types,
        })
        if (!lookup.accepts(target, types, node.kind === 'field'))
          fail(
            node,
            pathName,
            `Expected ${types.join(' or ')} in the data schema`,
            'incompatible_data_type',
            'bind',
          )
      }
      if (expected?.items) {
        dependencies.push({
          componentId: node.id,
          property: 'bind',
          path: [...path, null],
          types: expected.items,
        })
        if (!lookup.accepts(lookup.child(target, null), expected.items, true))
          fail(
            node,
            pathName,
            `Expected array items of type ${expected.items.join(' or ')}`,
            'incompatible_data_type',
            'bind',
          )
      }
      if (!item && node.kind !== 'object') {
        if (editors.has(pathName))
          fail(node, pathName, 'Multiple fields write to this path')
        editors.add(pathName)
      }
    }
    if (node.rowKey !== undefined) {
      if (
        node.kind !== 'array' ||
        typeof node.rowKey !== 'string' ||
        !lookup.accepts(lookup.child(lookup.child(target, null), node.rowKey), [
          'string',
          'number',
        ])
      )
        fail(
          node,
          pathName,
          'A row key must reference a string or number in each item',
        )
      else {
        rowKeys.push({ path, key: node.rowKey })
        dependencies.push({
          componentId: node.id,
          property: 'rowKey',
          path: [...path, null, node.rowKey],
          types: ['string', 'number'],
        })
      }
    }

    let props: JsonObject = { ...node.props }
    if (expected?.normalizeProps) props = expected.normalizeProps(props)
    if (trusted !== true)
      assertSafeRenderMetadata(props, ['ui', node.id, 'props'])
    const bindingContracts = expected?.bindings ?? {}
    for (const [prop, contract] of Object.entries(bindingContracts)) {
      if (Object.prototype.hasOwnProperty.call(props, prop))
        fail(
          node,
          pathName,
          `Move "${prop}" to the data document and bind it`,
          'inline_bound_property',
          prop,
        )
      if (
        contract.required &&
        !Object.prototype.hasOwnProperty.call(node.bindings ?? {}, prop)
      )
        fail(
          node,
          pathName,
          prop === 'rows'
            ? 'A rows binding is required'
            : `A binding for "${prop}" is required`,
          'missing_property_binding',
          prop,
        )
    }

    const resolveBinding = (binding: DataBinding, property: string) => {
      let segments: string[]
      try {
        segments = pointerSegments(binding.path)
      } catch {
        fail(
          node,
          String(binding.path),
          'Invalid JSON Pointer',
          'invalid_json_pointer',
          property,
        )
        return
      }
      const path = [...(binding.scope === 'parent' ? parent : []), ...segments]
      const schema = lookup.at(path)
      const boundName = location(path)
      if (schema === undefined || schema === false) {
        fail(
          node,
          boundName,
          `Missing path for "${property}"`,
          'missing_data_path',
          property,
        )
        return
      }
      return { segments, path, schema, boundName }
    }
    const bindingExpression = (
      binding: DataBinding,
      columns?: Record<string, string[]>,
    ) => {
      const args = [JSON.stringify(binding.path)]
      if (binding.scope === 'parent')
        args.push(`$self.path.segments.slice(0, ${parent.length})`)
      else if (columns) args.push('[]')
      if (columns) args.push(JSON.stringify(columns))
      return `{{ $document.read(${args.join(', ')}) }}`
    }
    const resolvedSlots = new Map<string, DataSchema>()
    const columnSlots = new Map<string, Record<string, string[]>>()

    for (const [prop, binding] of Object.entries(node.bindings ?? {})) {
      if (
        !isJsonObject(binding) ||
        typeof binding.path !== 'string' ||
        (binding.scope !== undefined && binding.scope !== 'parent')
      ) {
        fail(
          node,
          pathName,
          `Invalid binding for "${prop}"`,
          'invalid_property_binding',
          prop,
        )
        continue
      }
      if (
        ['value', 'name', 'multiple', 'rowKey'].includes(prop) ||
        /^on[A-Z]/u.test(prop) ||
        expected?.allowsBinding?.(prop) === false
      ) {
        fail(
          node,
          pathName,
          `"${prop}" cannot be assigned by a property binding`,
          'forbidden_property_binding',
          prop,
        )
        continue
      }
      const resolved = resolveBinding(binding, prop)
      if (!resolved) continue
      const { path: bound, schema: propertySchema, boundName } = resolved
      resolvedSlots.set(prop, propertySchema)
      const contract = Object.prototype.hasOwnProperty.call(
        bindingContracts,
        prop,
      )
        ? bindingContracts[prop]
        : undefined
      const mapped: Record<string, string[]> = Object.create(null)
      if (binding.columnPaths !== undefined) {
        if (
          !contract ||
          !('rows' in contract) ||
          !isJsonObject(binding.columnPaths)
        )
          fail(
            node,
            boundName,
            'Column paths require a rows contract',
            'invalid_column_paths',
            prop,
          )
        else
          for (const [column, pointer] of Object.entries(binding.columnPaths)) {
            if (
              !contract.rows.columns.some((entry) => entry.column === column) ||
              typeof pointer !== 'string' ||
              !pointer
            ) {
              fail(
                node,
                boundName,
                `Invalid path for column "${column}"`,
                'invalid_column_paths',
                prop,
              )
              continue
            }
            try {
              mapped[column] = pointerSegments(pointer)
            } catch {
              fail(
                node,
                boundName,
                `Invalid path for column "${column}"`,
                'invalid_column_paths',
                prop,
              )
            }
          }
      }
      columnSlots.set(prop, mapped)
      if (contract && 'rows' in contract) {
        const { columns, incomplete, validate } = contract.rows
        dependencies.push({
          componentId: node.id,
          property: prop,
          path: bound,
          types: ['array'],
        })
        const row = lookup.child(propertySchema, null)
        if (
          !lookup.accepts(propertySchema, ['array']) ||
          !lookup.accepts(row, ['object'])
        )
          fail(
            node,
            boundName,
            'Rows must be an array of objects',
            'incompatible_rows',
            prop,
          )
        if (incomplete)
          fail(
            node,
            boundName,
            'Incomplete column mapping',
            'incomplete_column_mapping',
            prop,
          )
        for (const { column, types, property = prop } of columns) {
          if (typeof column !== 'string' || !column) continue
          const columnPath = [...bound, null, ...(mapped[column] ?? [column])]
          dependencies.push({
            componentId: node.id,
            property,
            path: columnPath,
            types,
          })
          if (
            !lookup.accepts(
              lookup.at(columnPath),
              types,
              !types.includes('null'),
            )
          )
            fail(
              node,
              location(columnPath),
              `Column "${column}" must have type ${types.join(' or ')}`,
              'incompatible_column',
              property,
            )
        }
        if (validate)
          rowChecks.push({
            node,
            property: prop,
            path: bound,
            validate,
            columns: mapped,
          })
      } else {
        const scalarContract =
          contract && 'types' in contract ? contract : undefined
        const types = scalarContract?.types ?? binding.types
        if (
          !Array.isArray(types) ||
          !types.length ||
          !types.every((type) =>
            documentDataTypes.includes(type as DocumentDataType),
          )
        ) {
          fail(
            node,
            boundName,
            `Declare the expected types for "${prop}"`,
            'missing_binding_types',
            prop,
          )
        } else {
          dependencies.push({
            componentId: node.id,
            property: prop,
            path: bound,
            types: types as DocumentDataType[],
          })
          if (!lookup.accepts(propertySchema, types, scalarContract?.nullable))
            fail(
              node,
              boundName,
              `"${prop}" expects ${types.join(' or ')}`,
              'incompatible_binding_type',
              prop,
            )
        }
      }
      props[prop] = bindingExpression(
        binding,
        Object.keys(mapped).length ? mapped : undefined,
      )
    }

    if (expected?.compileProps) {
      props = expected.compileProps(props, {
        path: pathName,
        columnSchema(property, column) {
          const row = lookup.child(resolvedSlots.get(property), null)
          return describeSchema(
            (columnSlots.get(property)?.[column] ?? [column]).reduce(
              (schema, key) => lookup.child(schema, key),
              row,
            ),
          )
        },
        resolveBinding(binding, property, types) {
          const resolved = resolveBinding(binding, property)
          if (!resolved) return
          dependencies.push({
            componentId: node.id,
            property,
            path: resolved.path,
            types,
          })
          return {
            segments: resolved.segments,
            path: resolved.boundName,
            types: lookup.possible(resolved.schema),
            expression: bindingExpression(binding),
            schema: describeSchema(resolved.schema),
          }
        },
        report(issue) {
          fail(
            node,
            issue.path ?? pathName,
            issue.message,
            issue.code,
            issue.property,
          )
        },
      })
    }

    const constraints = lookup.constraints(target)
    const { items, title, description, readOnly, writeOnly, deprecated } =
      constraints
    const types = lookup.possible(target)
    const { choices } =
      node.kind === 'void'
        ? {}
        : projectDocumentConstraints({
            node,
            constraints,
            types,
            props,
            itemConstraints: lookup.constraints(lookup.child(target, null)),
            report: (message, code, property) =>
              fail(node, pathName, message, code, property),
          })
    const metadata = Object.fromEntries(
      Object.entries({
        enum: choices,
        title,
        description,
        readOnly,
      }).filter(([, value]) => value !== undefined),
    )
    const type =
      node.kind === 'field'
        ? (types.find((type) => type !== 'null' && type !== 'integer') ??
          'number')
        : node.kind
    const field: ISchema & { 'x-designable-id'?: string } = {
      ...node.field,
      ...(node.kind === 'void' ? {} : metadata),
      type,
      'x-designable-id': node.id,
      'x-compile-omitted': [
        ...new Set([
          ...Object.keys(metadata),
          ...(Array.isArray(node.field?.['x-compile-omitted'])
            ? (node.field['x-compile-omitted'] as string[])
            : []),
        ]),
      ],
    }
    // Render metadata never seeds or replaces the validated data document.
    delete field.default
    delete field['x-value']
    if (
      readOnly === true &&
      !['disabled', 'readPretty'].includes(field['x-pattern'])
    )
      field['x-pattern'] = 'readOnly'
    if (writeOnly === true)
      field['x-data'] = { ...field['x-data'], documentWriteOnly: true }
    if (deprecated === true) {
      props['data-deprecated'] = true
      if (field['x-decorator'] === 'FormItem')
        field.description = [field.description, 'Deprecated']
          .filter(Boolean)
          .join(' · ')
    }
    if (node.kind === 'array') {
      const defaults = newItemDefaults(lookup.child(target, null))
      if (defaults !== undefined) {
        if (trusted !== true)
          assertSafeRenderMetadata(defaults, [
            'dataSchema',
            ...path.filter((part) => part !== null),
            'items',
            'default',
          ])
        props.itemDefault = defaults
      }
    }
    if (node.component) field['x-component'] = node.component
    if (Object.keys(props).length) field['x-component-props'] = props
    const required = lookup.constraints(lookup.at(path.slice(0, -1))).required
    if (
      field['x-decorator'] === 'FormItem' &&
      node.kind === 'field' &&
      Array.isArray(required) &&
      required.includes(path[path.length - 1])
    ) {
      field['x-decorator-props'] = {
        asterisk: true,
        ...(field['x-decorator-props'] as object),
      }
    }
    if (node.children?.length)
      field.properties = compileChildren(node.children, path)
    if (node.item) {
      if (node.kind !== 'array')
        fail(node, pathName, 'Only array nodes can define an item')
      field.items = compileNode(node.item, [...path, null], true)?.field
    } else if (node.kind === 'field' && type === 'array') {
      // Scalar lists (TagsInput, choices and uploads) have no item widget.
      if (trusted !== true)
        assertSafeRenderMetadata(items, [
          'dataSchema',
          ...path.filter((part) => part !== null),
          'items',
        ])
      field.items = items as ISchema
    }
    return { path: bind.length ? bind : [node.key], field }
  }

  function newItemDefaults(
    target: DataSchema,
    visited = new Set<DataSchema>(),
  ): JsonObject[string] | undefined {
    if (target === undefined || visited.has(target)) return
    const { default: value, properties } = lookup.constraints(target)
    if (value !== undefined) return value as JsonObject[string]
    if (!isJsonObject(properties)) return
    const seen = new Set(visited).add(target)
    const result: JsonObject = {}
    for (const [key, schema] of Object.entries(properties)) {
      const value = newItemDefaults(schema as DataSchema, seen)
      if (value !== undefined) result[key] = value
    }
    if (Object.keys(result).length) return result
  }

  function compileChildren(nodes: UiDocumentNode[], parent: (string | null)[]) {
    const properties: Record<string, ISchema> = {}
    // Insert real object fields before bindings that reuse an intermediate object.
    const fields = nodes
      .flatMap((node, index) => {
        const field = compileNode(node, parent)
        return field ? [{ ...field, node, index }] : []
      })
      .sort((left, right) => left.path.length - right.path.length)
    fields.forEach(({ path, field, node, index }) => {
      let target = properties
      for (const group of path.slice(0, -1)) {
        const container = Object.prototype.hasOwnProperty.call(target, group)
          ? target[group]
          : (target[group] = {
              type: 'object',
              properties: {},
              'x-index': index,
            })
        if (container.type !== 'object') {
          fail(node, location(parent), `Path collides with "${group}"`)
          return
        }
        target = container.properties ??= {}
      }
      const key = path[path.length - 1]
      if (Object.prototype.hasOwnProperty.call(target, key))
        fail(node, location(parent), `Duplicate rendered field "${key}"`)
      else target[key] = { ...field, 'x-index': index }
    })
    return properties
  }

  const schema = {
    type: 'object',
    properties: compileChildren(ui.nodes, []),
  } satisfies ISchema
  if (issues.some(({ severity }) => severity !== 'warning'))
    throw new DocumentValidationError(issues)
  return {
    form: ui.form ?? {},
    schema,
    rowKeys,
    dependencies,
    diagnostics: issues,
    validateBindings(data: JsonObject) {
      const result: DocumentIssue[] = []
      for (const { node, property, path, validate, columns } of rowChecks) {
        const visit = (value: unknown, index: number, current: string[]) => {
          if (index === path.length) {
            if (!Array.isArray(value)) return
            result.push(
              ...validate(projectDocumentRows(value, columns) as unknown[]).map(
                (issue) => ({
                  component: node.component,
                  componentId: node.id,
                  property,
                  path: jsonPointer([
                    ...current,
                    ...issue.path.slice(0, 1),
                    ...(columns[issue.path[1]] ?? issue.path.slice(1, 2)),
                    ...issue.path.slice(2),
                  ]),
                  message: issue.message,
                  code: issue.code,
                  severity: 'error' as const,
                }),
              ),
            )
            return
          }
          const key = path[index]
          if (key === null) {
            if (Array.isArray(value))
              value.forEach((item, i) =>
                visit(item, index + 1, [...current, String(i)]),
              )
          } else {
            visit(valueAt(value, [key]), index + 1, [...current, key])
          }
        }
        visit(data, 0, [])
      }
      return result
    },
  }
}

export function createFormDocument(
  documents: FormDocuments,
  options: CompileFormDocumentOptions & { revision?: number } = {},
) {
  const ui = copyJson(documents.ui) as unknown as UiDocument
  const dataSchema = copyJson(
    documents.dataSchema,
  ) as FormDocuments['dataSchema']
  const compiled = compileFormDocuments({ ui, dataSchema }, options)
  if (options.contracts) {
    const registry = options.contracts
    visitUiNodes(ui, (node) => {
      if (!node.props) return
      const contract = registry.resolve(node.component, node.props)
      if (contract?.normalizeProps)
        node.props = contract.normalizeProps(node.props)
    })
  }
  const data = createDataDocument({
    schema: dataSchema,
    data: documents.data,
    revision: options.revision,
    rowKeys: compiled.rowKeys,
    schemaValidation: options.schemaValidation,
    validateBindings: compiled.validateBindings,
  })
  return Object.assign(data, {
    formProps: compiled.form,
    schema: compiled.schema,
    diagnostics: compiled.diagnostics,
    exportDocuments(): FormDocuments {
      return {
        ui: copyJson(ui) as unknown as UiDocument,
        dataSchema: copyJson(dataSchema) as FormDocuments['dataSchema'],
        data: data.exportData(),
      }
    },
  })
}

export type FormDocumentJson = Record<keyof FormDocuments, string>

export function parseFormDocuments(
  files: FormDocumentJson,
  options: DocumentTrustOptions = {},
): FormDocuments {
  const parse = (part: keyof FormDocuments) => {
    try {
      return JSON.parse(files[part])
    } catch (error) {
      throw new DocumentValidationError([
        { path: '/' + part, message: String(error) },
      ])
    }
  }
  const ui = parse('ui')
  assertSafeDocumentUi(ui, options)
  return {
    ui,
    dataSchema: parse('dataSchema'),
    data: parse('data'),
  }
}

export function stringifyFormDocuments({
  ui,
  dataSchema,
  data,
}: FormDocuments): FormDocumentJson {
  return {
    ui: JSON.stringify(ui, null, 2),
    dataSchema: JSON.stringify(dataSchema, null, 2),
    data: JSON.stringify(data, null, 2),
  }
}
