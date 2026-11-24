import {
  copyJson,
  createDataDocument,
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
  type DocumentIssue,
  type DocumentRowKey,
  type ISchema,
  type JsonObject,
} from '@formivue/json-schema'
import {
  displayValueProps,
  isRowsDisplay,
  rowColumns,
  rowIssues,
  widgetData,
} from './document-contracts'
import { schemaLookup, type DataSchema } from './document-schema'

export interface DataBinding {
  path: string
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

interface CompileOptions {
  hasComponent?: (component: string) => boolean
}

export function compileFormDocuments(
  { ui, dataSchema }: Pick<FormDocuments, 'ui' | 'dataSchema'>,
  options: CompileOptions = {},
) {
  if (
    !isJsonObject(ui) ||
    ui.version !== 1 ||
    !Array.isArray(ui.nodes) ||
    (ui.form !== undefined && !isJsonObject(ui.form))
  )
    throw new DocumentValidationError([
      { path: '/ui', message: 'Expected a version 1 UI document' },
    ])
  if (!isJsonObject(dataSchema))
    throw new DocumentValidationError([
      { path: '/dataSchema', message: 'Expected a JSON Schema object' },
    ])
  const lookup = schemaLookup(dataSchema)
  if (!lookup.accepts(dataSchema, ['object']))
    throw new DocumentValidationError([
      {
        path: '/dataSchema',
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
  const schemaTypes = [
    'object',
    'array',
    'string',
    'number',
    'integer',
    'boolean',
    'null',
  ]
  const rowChecks: { node: UiDocumentNode; path: (string | null)[] }[] = []
  const fail = (node: UiDocumentNode, path: string, message: string) =>
    issues.push({ component: node.component ?? node.id, path, message })
  const parse = (node: UiDocumentNode, pointer: string) => {
    try {
      return pointerSegments(pointer)
    } catch {
      fail(node, String(pointer), 'Invalid JSON Pointer')
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
      issues.push({ path: location(parent), message: 'Invalid UI node' })
      return
    }
    if (ids.has(node.id))
      fail(node, location(parent), `Duplicate UI id "${node.id}"`)
    ids.add(node.id)
    if (
      node.component &&
      options.hasComponent &&
      !options.hasComponent(node.component)
    )
      fail(node, location(parent), `Unknown component "${node.component}"`)
    for (const key of Object.keys(node.field ?? {}))
      if (
        !formatProperties.has(key) &&
        (!key.startsWith('x-') || reservedProperties.has(key))
      )
        fail(node, location(parent), `Unsupported field metadata "${key}"`)
    const expected = widgetData(node.component, node.props)
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
    if (node.kind !== 'void') {
      if (target === undefined || target === false)
        fail(node, pathName, 'Path is missing from the data schema')
      const types = node.kind === 'field' ? expected?.types : [node.kind]
      if (types && !lookup.accepts(target, types, node.kind === 'field'))
        fail(
          node,
          pathName,
          `Expected ${types.join(' or ')} in the data schema`,
        )
      if (
        expected?.items &&
        !lookup.accepts(lookup.child(target, null), expected.items, true)
      )
        fail(
          node,
          pathName,
          `Expected array items of type ${expected.items.join(' or ')}`,
        )
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
      else rowKeys.push({ path, key: node.rowKey })
    }

    const props: Record<string, unknown> = { ...node.props }
    const dataProps = displayValueProps(node.component)
    for (const prop of dataProps)
      if (Object.prototype.hasOwnProperty.call(props, prop))
        fail(node, pathName, `Move "${prop}" to the data document and bind it`)
    for (const [prop, binding] of Object.entries(node.bindings ?? {})) {
      if (
        !isJsonObject(binding) ||
        typeof binding.path !== 'string' ||
        (binding.scope !== undefined && binding.scope !== 'parent')
      ) {
        fail(node, pathName, `Invalid binding for "${prop}"`)
        continue
      }
      if (
        ['value', 'name', 'multiple', 'rowKey'].includes(prop) ||
        /^on[A-Z]/u.test(prop) ||
        ((node.component === 'DataTable' || isRowsDisplay(node.component)) &&
          (prop === 'columns' || prop === 'series' || prop.endsWith('Key')))
      ) {
        fail(
          node,
          pathName,
          `"${prop}" cannot be assigned by a property binding`,
        )
        continue
      }
      const segments = parse(node, binding.path)
      const bound = [...(binding.scope === 'parent' ? parent : []), ...segments]
      const propertySchema = lookup.at(bound)
      const boundName = location(bound)
      if (propertySchema === undefined || propertySchema === false)
        fail(node, boundName, `Missing path for "${prop}"`)
      if (prop === 'rows' && isRowsDisplay(node.component)) {
        const row = lookup.child(propertySchema, null)
        if (
          !lookup.accepts(propertySchema, ['array']) ||
          !lookup.accepts(row, ['object'])
        )
          fail(node, boundName, 'Rows must be an array of objects')
        const { columns, incomplete } = rowColumns(node.component, props)
        if (incomplete) fail(node, boundName, 'Incomplete column mapping')
        for (const { column, types } of columns) {
          if (
            typeof column === 'string' &&
            !lookup.accepts(
              lookup.child(row, column),
              types,
              !types.includes('null'),
            )
          )
            fail(
              node,
              boundName,
              `Column "${column}" must have type ${types.join(' or ')}`,
            )
        }
        rowChecks.push({ node, path: bound })
      } else {
        const types = dataProps.includes(prop) ? ['string'] : binding.types
        if (
          !Array.isArray(types) ||
          !types.length ||
          !types.every((type) => schemaTypes.includes(type))
        ) {
          fail(node, boundName, `Declare the expected types for "${prop}"`)
        } else if (
          !lookup.accepts(propertySchema, types, dataProps.includes(prop))
        ) {
          fail(node, boundName, `"${prop}" expects ${types.join(' or ')}`)
        }
      }
      const base =
        binding.scope === 'parent'
          ? `, $self.path.segments.slice(0, ${parent.length})`
          : ''
      props[prop] =
        `{{ $document.read(${JSON.stringify(binding.path)}${base}) }}`
    }
    if (isRowsDisplay(node.component) && !node.bindings?.rows)
      fail(node, pathName, 'A rows binding is required')

    if (
      (node.component === 'StepperStep' ||
        node.component === 'QuestionnaireStep') &&
      Array.isArray(props.branches)
    ) {
      props.branches = props.branches.map((branch) => {
        if (!isJsonObject(branch) || typeof branch.path !== 'string') {
          fail(node, pathName, 'Invalid branch binding')
          return branch
        }
        const segments = parse(node, branch.path)
        const bound = lookup.at(segments)
        const type =
          branch.equals === null
            ? 'null'
            : Number.isInteger(branch.equals)
              ? 'integer'
              : typeof branch.equals
        if (!lookup.possible(bound).includes(type) || bound === undefined)
          fail(
            node,
            branch.path,
            'Branch value is incompatible with the data schema',
          )
        return { ...branch, path: segments }
      })
    }

    const constraints = lookup.constraints(target)
    const {
      items,
      enum: choices,
      title,
      description,
      readOnly,
      writeOnly,
    } = constraints
    const metadata = Object.fromEntries(
      Object.entries({
        enum: choices,
        title,
        description,
        readOnly,
        writeOnly,
      }).filter(([, value]) => value !== undefined),
    )
    const type =
      node.kind === 'field'
        ? (lookup
            .possible(target)
            .find((type) => type !== 'null' && type !== 'integer') ?? 'number')
        : node.kind
    const field: ISchema & { 'x-designable-id'?: string } = {
      ...(node.kind === 'void' ? {} : metadata),
      ...node.field,
      type,
      ...(node.options ? { enum: node.options } : {}),
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
      field.items = items as ISchema
    }
    return { path: bind.length ? bind : [node.key], field }
  }

  function compileChildren(nodes: UiDocumentNode[], parent: (string | null)[]) {
    const properties: Record<string, ISchema> = {}
    nodes.forEach((node, index) => {
      const compiled = compileNode(node, parent)
      if (!compiled) return
      const { path, field } = compiled
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

  const schema: ISchema = {
    type: 'object',
    properties: compileChildren(ui.nodes, []),
  }
  if (issues.length) throw new DocumentValidationError(issues)
  return {
    form: ui.form ?? {},
    schema,
    rowKeys,
    validateBindings(data: JsonObject) {
      const result: DocumentIssue[] = []
      for (const { node, path } of rowChecks) {
        const visit = (value: unknown, index: number, current: string[]) => {
          if (index === path.length) {
            if (!Array.isArray(value)) return
            result.push(
              ...rowIssues(node.component, node.props ?? {}, value).map(
                (issue) => ({
                  component: node.component,
                  path: jsonPointer([...current, ...issue.path]),
                  message: issue.message,
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
  options: CompileOptions & { revision?: number } = {},
) {
  const ui = copyJson(documents.ui) as unknown as UiDocument
  const dataSchema = copyJson(
    documents.dataSchema,
  ) as FormDocuments['dataSchema']
  const compiled = compileFormDocuments({ ui, dataSchema }, options)
  const data = createDataDocument({
    schema: dataSchema,
    data: documents.data,
    revision: options.revision,
    rowKeys: compiled.rowKeys,
    validateBindings: compiled.validateBindings,
  })
  return Object.assign(data, {
    formProps: compiled.form,
    schema: compiled.schema,
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

export function parseFormDocuments(files: FormDocumentJson): FormDocuments {
  const parse = (part: keyof FormDocuments) => {
    try {
      return JSON.parse(files[part])
    } catch (error) {
      throw new DocumentValidationError([
        { path: '/' + part, message: String(error) },
      ])
    }
  }
  return {
    ui: parse('ui'),
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
