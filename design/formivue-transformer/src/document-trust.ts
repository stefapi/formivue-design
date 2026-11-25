import type { ITreeNode } from '@formivue-design/core'
import {
  DocumentValidationError,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  type JsonObject,
} from '@formivue/json-schema'
import { inlineBinding } from './document-migration'
import type { UiDocument } from './documents'

export interface DocumentTrustOptions {
  /** Allow executable rendering metadata from a source explicitly trusted by the application. */
  trusted?: boolean
}

const expression = /^\s*\{\{[\s\S]*\}\}\s*$/u
const unsafeKey =
  /^(?:__proto__|constructor|prototype|innerhtml|outerhtml|srcdoc|template|x-reactions|x-linkages)$|^__v_|^on(?!eOf$)|^[@.^]/iu
const targets = new Set(['x-component', 'x-decorator', 'tag', 'as', 'is'])
const textModes = new Set([
  'normal',
  'div',
  'span',
  'p',
  'strong',
  'em',
  'small',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
])
const htmlTags = new Set([
  ...textModes,
  'form',
  'section',
  'article',
  'aside',
  'main',
  'header',
  'footer',
  'fieldset',
  'legend',
])
const presentationAttrs =
  /^(?:id|class|style|title|role|lang|dir|tabindex|hidden|aria-[\w-]+|data-[\w-]+)$/iu
const layoutProps = /^(?:layout|label-?align|label-?width|size)$/iu
const restrictedComponentAttrs =
  /^(?:action|form|formaction|formenctype|formmethod|formnovalidate|formtarget|ref|reffor|refkey)$/iu
const activeTags =
  /^(?:script|style|iframe|frame|frameset|object|embed|applet|link|meta|base|svg|math)$/iu
const urlAttributes = /^(?:action|formaction|href|src|xlink:href)$/iu
const unsafeUrl = /^(?:javascript|vbscript|data):/iu
const schemaMaps = new Set([
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'dependentSchemas',
])
const nestedSchemas = new Set([
  'items',
  'prefixItems',
  'additionalItems',
  'additionalProperties',
  'contains',
  'not',
  'if',
  'then',
  'else',
  'allOf',
  'anyOf',
  'oneOf',
])

function filterRenderProps(props: JsonObject, component: unknown) {
  return Object.fromEntries(
    Object.entries(props).filter(([key, value]) => {
      if (component === 'FormLayout') {
        return (
          presentationAttrs.test(key) ||
          layoutProps.test(key) ||
          (key === 'tag' &&
            (value == null ||
              (typeof value === 'string' &&
                value !== 'normal' &&
                htmlTags.has(value))))
        )
      }
      if (typeof component === 'string' && htmlTags.has(component))
        return presentationAttrs.test(key)
      return !restrictedComponentAttrs.test(key.replace(/[-_]/gu, ''))
    }),
  )
}

export function filterDocumentFormProps(
  props: JsonObject,
  { trusted }: DocumentTrustOptions = {},
) {
  return trusted === true ? props : filterRenderProps(props, 'FormLayout')
}

function filterSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(filterSchema)
  if (!isJsonObject(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key === 'x-component-props' || key === 'x-decorator-props') {
        const target =
          key === 'x-component-props' ? 'x-component' : 'x-decorator'
        if (isJsonObject(child))
          return [key, filterRenderProps(child, value[target])]
      }
      if (schemaMaps.has(key) && isJsonObject(child))
        return [
          key,
          Object.fromEntries(
            Object.entries(child).map(([name, schema]) => [
              name,
              filterSchema(schema),
            ]),
          ),
        ]
      return [key, nestedSchemas.has(key) ? filterSchema(child) : child]
    }),
  )
}

export function filterDocumentSchema<S>(
  schema: S,
  { trusted }: DocumentTrustOptions = {},
): S {
  return trusted === true ? schema : (filterSchema(schema) as S)
}

export function rejectUntrustedRendering(
  path: readonly (string | number)[],
): never {
  throw new DocumentValidationError([
    {
      path: jsonPointer(path),
      code: 'untrusted_rendering',
      message: 'This rendering setting requires explicitly trusted content.',
    },
  ])
}

function safeComponent(value: unknown) {
  return (
    typeof value === 'string' &&
    (htmlTags.has(value) ||
      (!activeTags.test(value) &&
        /^[A-Z][\w]*(?:\.[A-Za-z][\w]*)*$/u.test(value) &&
        value.split('.').every((part) => !unsafeKey.test(part))))
  )
}

function isReadBinding(value: string) {
  const pointer = inlineBinding(value)
  return (
    pointer !== undefined &&
    pointerSegments(pointer).every(
      (key) =>
        !!key &&
        !/[.[\]*,]/u.test(key) &&
        !/^(?:__proto__|constructor|prototype)$/u.test(key),
    )
  )
}

function hasUnsafeProtocol(value: string) {
  try {
    return unsafeUrl.test(new URL(value, 'https://formivue.invalid').protocol)
  } catch {
    return false
  }
}

export function assertSafeRenderMetadata(
  source: unknown,
  path: readonly (string | number)[],
  legacyBindings = false,
  schema = false,
) {
  const visited = new WeakSet<object>()
  function visit(
    value: unknown,
    at: readonly (string | number)[],
    isSchema: boolean,
  ) {
    if (typeof value === 'string' && expression.test(value)) {
      if (!legacyBindings || !isReadBinding(value)) rejectUntrustedRendering(at)
      return
    }
    if (typeof value === 'function') rejectUntrustedRendering(at)
    if (!value || typeof value !== 'object' || visited.has(value)) return
    visited.add(value)
    for (const [key, child] of Object.entries(value)) {
      const location = [...at, key]
      const name = key.toLowerCase()
      if (unsafeKey.test(key)) rejectUntrustedRendering(location)
      if (
        targets.has(name) &&
        child !== null &&
        child !== undefined &&
        child !== ''
      ) {
        const safe = name.startsWith('x-')
          ? safeComponent(child)
          : typeof child === 'string' && htmlTags.has(child)
        if (!safe) rejectUntrustedRendering(location)
      }
      if (
        urlAttributes.test(key) &&
        typeof child === 'string' &&
        hasUnsafeProtocol(child)
      )
        rejectUntrustedRendering(location)
      if (isSchema && schemaMaps.has(key) && isJsonObject(child)) {
        for (const [field, nested] of Object.entries(child)) {
          if (/^(?:__proto__|constructor|prototype)$/u.test(field))
            rejectUntrustedRendering([...location, field])
          visit(nested, [...location, field], true)
        }
      } else {
        visit(
          child,
          location,
          isSchema && (Array.isArray(value) || nestedSchemas.has(key)),
        )
      }
    }
  }
  visit(source, path, schema)
}

export function assertSafeDocumentUi(
  ui: UiDocument,
  { trusted }: DocumentTrustOptions = {},
) {
  if (trusted === true || !isJsonObject(ui)) return
  assertSafeRenderMetadata(ui.form, ['ui', 'form'])
  function nodeAt(node: unknown, path: readonly (string | number)[]) {
    if (!isJsonObject(node)) return
    if (node.component !== undefined && !safeComponent(node.component))
      rejectUntrustedRendering([...path, 'component'])
    assertSafeRenderMetadata(node.field, [...path, 'field'])
    assertSafeRenderMetadata(node.props, [...path, 'props'], true)
    assertSafeRenderMetadata(node.options, [...path, 'options'])
    if (
      isJsonObject(node.props) &&
      node.component === 'Text' &&
      typeof node.props.mode === 'string' &&
      !textModes.has(node.props.mode)
    )
      rejectUntrustedRendering([...path, 'props', 'mode'])
    if (isJsonObject(node.bindings)) {
      for (const key of Object.keys(node.bindings))
        if (
          unsafeKey.test(key) ||
          targets.has(key.toLowerCase()) ||
          (urlAttributes.test(key) &&
            !(
              (node.component === 'HoverCard' && key === 'href') ||
              (node.component === 'Avatar' && key === 'src')
            )) ||
          (node.component === 'Text' && key === 'mode')
        )
          rejectUntrustedRendering([...path, 'bindings', key])
    }
    if (Array.isArray(node.children))
      node.children.forEach((child, index) =>
        nodeAt(child, [...path, 'children', index]),
      )
    if (node.item) nodeAt(node.item, [...path, 'item'])
  }
  if (Array.isArray(ui.nodes))
    ui.nodes.forEach((node, index) => nodeAt(node, ['ui', 'nodes', index]))
}

export function assertSafeDocumentCanvas(
  canvas: unknown,
  { trusted }: DocumentTrustOptions = {},
  formName = 'Form',
) {
  if (trusted === true) return
  function nodeAt(node: unknown, path: readonly (string | number)[]) {
    if (!isJsonObject(node)) return
    assertSafeRenderMetadata(
      node.props,
      [...path, 'props'],
      node.componentName !== formName,
      node.componentName !== formName,
    )
    if (isJsonObject(node.props) && node.props['x-component'] === 'Text') {
      const props = node.props['x-component-props']
      if (
        isJsonObject(props) &&
        props.mode !== undefined &&
        (typeof props.mode !== 'string' || !textModes.has(props.mode))
      )
        rejectUntrustedRendering([
          ...path,
          'props',
          'x-component-props',
          'mode',
        ])
    }
    if (Array.isArray(node.children))
      node.children.forEach((child, index) =>
        nodeAt(child, [...path, 'children', index]),
      )
  }
  nodeAt(canvas, ['canvas'])
}

export function filterDocumentCanvas(
  canvas: ITreeNode,
  options: DocumentTrustOptions = {},
  formName = 'Form',
): ITreeNode {
  if (options.trusted === true) return canvas
  assertSafeDocumentCanvas(canvas, options, formName)
  function filterNode(node: ITreeNode): ITreeNode {
    return {
      ...node,
      ...(isJsonObject(node.props)
        ? {
            props:
              node.componentName === formName
                ? filterDocumentFormProps(node.props)
                : filterDocumentSchema(
                    filterRenderProps(node.props, node.componentName),
                  ),
          }
        : {}),
      ...(node.children ? { children: node.children.map(filterNode) } : {}),
    }
  }
  return filterNode(canvas)
}

export function assertSafeLegacySchema(
  formivue: unknown,
  { trusted }: DocumentTrustOptions = {},
) {
  if (trusted === true || !isJsonObject(formivue)) return
  assertSafeRenderMetadata(formivue.form, ['form'])
  assertSafeRenderMetadata(formivue.schema, ['schema'], true, true)
}
