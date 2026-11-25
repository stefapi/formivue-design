import type { FormDocuments } from '@formivue-design/formivue-transformer'
import {
  copyJson,
  dataSchemaLocations,
  dataSchemaResources,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
} from '@formivue/json-schema'
import { Button } from '@formivue-design/vue-ui'
import {
  defineComponent,
  h,
  nextTick,
  ref,
  type PropType,
  type VNode,
} from 'vue'
import { labels, typeNames, types, type Message } from './keywords'
import { setRequiredProperty } from './schema-rules'

type Model = FormDocuments['dataSchema']
type Schema = Record<string, unknown> | boolean
type RowKind = 'property' | 'definition' | 'item' | 'position'
type Translate = (message: Message) => string
const fieldName = ['Field name', 'Nom du champ', 'Nombre del campo'] as const
const addField = ['Add field', 'Ajouter un champ', 'Añadir campo'] as const
const required = ['Required', 'Obligatoire', 'Obligatorio'] as const
const description = ['Description', 'Description', 'Descripción'] as const
const settings = [
  'Field settings',
  'Réglages du champ',
  'Ajustes del campo',
] as const
const itemsLabel = [
  'Array items',
  'Éléments du tableau',
  'Elementos de la lista',
] as const
const fieldControl =
  'schema-builder-control min-w-0 rounded border border-transparent bg-transparent text-sm hover:border-input focus:border-input focus:bg-background focus-visible:outline-2 focus-visible:outline-ring'
const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
const from = (event: Event) => (event.target as HTMLInputElement).value

function schemaNode(value: unknown): value is Schema {
  return typeof value === 'boolean' || isJsonObject(value)
}

function mapAt(schema: Record<string, unknown>, key: string) {
  const map = schema[key]
  return isJsonObject(map) ? map : {}
}

function replaceKey(map: object, from: string, to: string) {
  return Object.fromEntries(
    Object.entries(map).map(([name, value]) => [
      name === from ? to : name,
      value,
    ]),
  )
}

// Pointer references to a renamed field (including descendants) still point
// into the same resource. Anchors and references to other resources are stable.
function retargetPointers(
  original: Model,
  next: Model,
  path: string[],
  name: string,
) {
  const paths = [path]
  if (path[path.length - 2] === 'properties')
    paths.push([
      ...path.slice(0, -2),
      'dependentSchemas',
      path[path.length - 1],
    ])
  const changedPath = (segments: string[]) => {
    const relocated = paths.find((path) =>
      path.every((part, index) => segments[index] === part),
    )
    return relocated
      ? [...relocated.slice(0, -1), name, ...segments.slice(relocated.length)]
      : segments
  }
  const registry = dataSchemaResources(original)
  for (const sourcePath of dataSchemaLocations(original)) {
    const source = valueAt(original, sourcePath)
    if (!isJsonObject(source)) continue
    for (const keyword of ['$ref', '$dynamicRef']) {
      const ref = source[keyword]
      if (typeof ref !== 'string') continue
      const fragment = ref.indexOf('#')
      if (fragment === -1) continue
      const target = registry.resolve(source, ref)
      if (target?.document !== original) continue
      const resolvedPath = changedPath(target.path)
      if (resolvedPath === target.path) continue
      const address = decodeURIComponent(ref.slice(fragment + 1))
      if (!address.startsWith('/')) continue
      const referenceLength = pointerSegments(address).length
      const targetPath = resolvedPath.slice(-referenceLength)
      const updated = valueAt(next, changedPath(sourcePath)) as Record<
        string,
        unknown
      >
      updated[keyword] =
        ref.slice(0, fragment + 1) +
        jsonPointer(targetPath).split('/').map(encodeURIComponent).join('/')
    }
  }
}

export const SchemaBuilder = defineComponent({
  name: 'SchemaBuilder',
  props: {
    modelValue: { type: Object as PropType<Model>, required: true },
    t: { type: Function as PropType<Translate>, required: true },
    selected: String,
    linked: { type: Object as PropType<ReadonlySet<string>>, required: true },
    componentLabel: Function as PropType<
      (pointer: string) => string | undefined
    >,
  },
  emits: {
    inspect: (_pointer: string, _trigger?: HTMLElement) => true,
    'update:modelValue': (_schema: Model) => true,
  },
  setup(props, { emit }) {
    const root = ref<HTMLElement>()
    const expanded = ref(new Set<string>())
    const error = ref('')
    const t = (message: Message) => props.t(message)

    function change(edit: (next: Model) => void) {
      try {
        const next = copyJson(props.modelValue) as Model
        edit(next)
        emit('update:modelValue', next)
        error.value = ''
        return true
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : String(cause)
        return false
      }
    }

    function editAt(
      path: string[],
      edit: (target: Record<string, unknown>) => void,
    ) {
      return change((next) =>
        edit(valueAt(next, path) as Record<string, unknown>),
      )
    }

    function focusName(path: string[]) {
      const pointer = jsonPointer(path)
      void nextTick(() => {
        const input = [
          ...(root.value?.querySelectorAll<HTMLInputElement>(
            '[data-field-name]',
          ) ?? []),
        ].find((input) => input.dataset.fieldName === pointer)
        input?.focus()
        input?.select()
      })
    }

    function addNamed(path: string[], keyword: 'properties' | '$defs') {
      const parent = valueAt(props.modelValue, path) as Record<string, unknown>
      const map = mapAt(parent, keyword)
      const base = keyword === 'properties' ? 'field' : 'definition'
      let name = base
      for (let index = 2; own(map, name); index++) name = base + index
      if (
        editAt(path, (target) => {
          target[keyword] = {
            ...map,
            [name]: { type: keyword === 'properties' ? 'string' : 'object' },
          }
        })
      ) {
        expanded.value.add(jsonPointer(path))
        focusName([...path, keyword, name])
      }
    }

    function rename(event: Event, path: string[]) {
      const input = event.target as HTMLInputElement
      const name = input.value
      const previous = path[path.length - 1]
      if (name === previous) return
      const keyword = path[path.length - 2]
      const parentPath = path.slice(0, -2)
      const parent = valueAt(props.modelValue, parentPath) as Record<
        string,
        unknown
      >
      if (
        !name.trim() ||
        ['__proto__', 'prototype', 'constructor'].includes(name) ||
        own(mapAt(parent, keyword), name)
      ) {
        error.value = t([
          'Choose a non-empty, unique name.',
          'Choisissez un nom unique et non vide.',
          'Elige un nombre único y no vacío.',
        ])
        input.value = previous
        return
      }
      if (
        !change((next) => {
          const target = valueAt(next, parentPath) as Record<string, unknown>
          target[keyword] = replaceKey(mapAt(target, keyword), previous, name)
          if (keyword === 'properties') {
            const renameMember = (key: unknown) =>
              key === previous ? name : key
            if (Array.isArray(target.required))
              target.required = [...new Set(target.required.map(renameMember))]
            for (const key of ['dependentRequired', 'dependentSchemas']) {
              const map = mapAt(target, key)
              if (own(map, previous) && own(map, name)) {
                throw new Error(
                  t([
                    'The destination already has a dependency rule.',
                    'Ce nom possède déjà une règle de dépendance.',
                    'El destino ya tiene una regla de dependencia.',
                  ]),
                )
              }
              if (isJsonObject(target[key])) {
                const renamed = replaceKey(map, previous, name)
                target[key] =
                  key === 'dependentRequired'
                    ? Object.fromEntries(
                        Object.entries(renamed).map(([trigger, keys]) => [
                          trigger,
                          Array.isArray(keys)
                            ? [...new Set(keys.map(renameMember))]
                            : keys,
                        ]),
                      )
                    : renamed
              }
            }
          }
          retargetPointers(props.modelValue, next, path, name)
        })
      ) {
        input.value = previous
        return
      }
      const old = jsonPointer(path)
      const updated = jsonPointer([...parentPath, keyword, name])
      expanded.value = new Set(
        [...expanded.value].map((pointer) =>
          pointer === old || pointer.startsWith(old + '/')
            ? updated + pointer.slice(old.length)
            : pointer,
        ),
      )
      if (props.selected === old || props.selected?.startsWith(old + '/'))
        emit('inspect', updated + props.selected.slice(old.length))
    }

    function remove(path: string[], kind: RowKind) {
      const name = path[path.length - 1]
      if (kind === 'item') {
        editAt(path.slice(0, -1), (parent) => {
          delete parent.items
        })
        return
      }
      const keyword = path[path.length - 2]
      editAt(path.slice(0, -2), (parent) => {
        const map = mapAt(parent, keyword)
        const remaining = Object.entries(map).filter(([key]) => key !== name)
        if (remaining.length) parent[keyword] = Object.fromEntries(remaining)
        else delete parent[keyword]
        if (keyword === 'properties') setRequiredProperty(parent, name, false)
      })
    }

    function iconButton(
      icon: string,
      name: string,
      action: (event: MouseEvent) => void,
      attrs = {},
    ) {
      return h(
        'button',
        {
          type: 'button',
          class: 'schema-builder-icon',
          title: name,
          'aria-label': name,
          onClick: action,
          ...attrs,
        },
        h('span', { 'aria-hidden': 'true' }, icon),
      )
    }

    function typeControl(schema: Schema, path: string[], name: string) {
      const translateType = (type: string) =>
        own(typeNames, type)
          ? t(typeNames[type as keyof typeof typeNames])
          : type
      const declared =
        typeof schema === 'boolean' ? String(schema) : schema.type
      const value = Array.isArray(declared)
        ? 'union'
        : typeof declared === 'string'
          ? declared
          : ''
      const special = Array.isArray(declared)
        ? declared.map(translateType).join(' / ')
        : translateType(value)
      const allowed = [...types, 'true', 'false'] as string[]
      return h(
        'select',
        {
          class: 'schema-builder-type ' + fieldControl,
          'aria-label': `${t(['Type', 'Type', 'Tipo'])} · ${name}`,
          value,
          'data-field-type': jsonPointer(path),
          'data-schema-type': value,
          onChange: (event: Event) => {
            const type = from(event)
            let changed: boolean
            if (
              type === 'true' ||
              type === 'false' ||
              typeof schema === 'boolean'
            ) {
              const next =
                type === 'true' || type === 'false'
                  ? type === 'true'
                  : type
                    ? { type }
                    : {}
              changed = editAt(path.slice(0, -1), (parent) => {
                parent[path[path.length - 1]] = next
              })
            } else {
              changed = editAt(path, (target) => {
                if (type) target.type = type
                else delete target.type
              })
            }
            if (changed && (type === 'object' || type === 'array'))
              expanded.value.add(jsonPointer(path))
          },
        },
        [
          h(
            'option',
            { value: '' },
            typeof schema !== 'boolean' && (schema.$ref || schema.$dynamicRef)
              ? t(labels.$ref)
              : t(['Any type', 'Tout type', 'Cualquier tipo']),
          ),
          value && !allowed.includes(value)
            ? h('option', { value, disabled: true }, special)
            : null,
          ...types.map((type) =>
            h('option', { key: type, value: type }, translateType(type)),
          ),
          h(
            'option',
            { value: 'true' },
            t(['True schema', 'Schéma vrai', 'Esquema verdadero']),
          ),
          h(
            'option',
            { value: 'false' },
            t(['False schema', 'Schéma faux', 'Esquema falso']),
          ),
        ],
      )
    }

    function propertyRows(schema: Record<string, unknown>, path: string[]) {
      const required = Array.isArray(schema.required) ? schema.required : []
      return Object.entries(mapAt(schema, 'properties')).flatMap(
        ([name, child]) =>
          schemaNode(child)
            ? [
                row(
                  child,
                  [...path, 'properties', name],
                  name,
                  'property',
                  required.includes(name),
                ),
              ]
            : [],
      )
    }

    function row(
      schema: Schema,
      path: string[],
      name: string,
      kind: RowKind,
      isRequired?: boolean,
    ): VNode {
      const pointer = jsonPointer(path)
      const named = kind === 'property' || kind === 'definition'
      const object = typeof schema === 'boolean' ? {} : schema
      const types = Array.isArray(object.type) ? object.type : [object.type]
      const hasProperties =
        types.includes('object') || isJsonObject(object.properties)
      const hasItems = schemaNode(object.items)
      const isArray = types.includes('array') || hasItems
      const tuple = Array.isArray(object.prefixItems) ? object.prefixItems : []
      const container = hasProperties || isArray || tuple.length > 0
      const open = expanded.value.has(pointer)
      const linked = props.linked.has(pointer)
      const component = linked ? props.componentLabel?.(pointer) : undefined
      const canRemove = named || kind === 'item'
      const displayName = name || '""'
      const describe = (label: Message) => `${t(label)} · ${displayName}`
      return h('li', { key: pointer, class: 'schema-builder-node' }, [
        h(
          'div',
          {
            class: 'schema-builder-row',
            'data-schema-field': pointer,
            'data-selected': props.selected === pointer ? 'true' : undefined,
          },
          [
            container
              ? iconButton(
                  open ? '▾' : '▸',
                  describe(
                    open
                      ? ['Collapse', 'Replier', 'Contraer']
                      : ['Expand', 'Déplier', 'Expandir'],
                  ),
                  () => {
                    if (open) expanded.value.delete(pointer)
                    else expanded.value.add(pointer)
                  },
                  { 'aria-expanded': open },
                )
              : h(
                  'span',
                  { class: 'schema-builder-spacer', 'aria-hidden': 'true' },
                  '·',
                ),
            h('div', { class: 'schema-builder-name min-w-0' }, [
              named && !linked
                ? h('input', {
                    class: fieldControl + ' w-full font-mono font-semibold',
                    'aria-label': describe(fieldName),
                    value: name,
                    'data-field-name': pointer,
                    onBlur: (event: FocusEvent) => rename(event, path),
                    onKeydown: (event: KeyboardEvent) => {
                      if (event.key !== 'Enter' && event.key !== 'Escape')
                        return
                      event.preventDefault()
                      const input = event.target as HTMLInputElement
                      if (event.key === 'Escape') input.value = name
                      input.blur()
                    },
                  })
                : named
                  ? h(
                      'div',
                      {
                        class:
                          'flex min-w-0 flex-wrap items-baseline gap-x-1.5',
                      },
                      [
                        h(
                          'button',
                          {
                            class:
                              'min-w-0 truncate px-1 text-left font-mono text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring',
                            type: 'button',
                            title: describe(settings),
                            'aria-haspopup': 'dialog',
                            onClick: (event: MouseEvent) =>
                              emit(
                                'inspect',
                                pointer,
                                event.currentTarget as HTMLElement,
                              ),
                          },
                          displayName,
                        ),
                        component && component !== name
                          ? h(
                              'span',
                              {
                                class:
                                  'truncate px-1 text-xs text-muted-foreground',
                                title: component,
                              },
                              component,
                            )
                          : null,
                      ],
                    )
                  : h(
                      'span',
                      {
                        class: 'block truncate px-1 text-sm font-semibold',
                        title: displayName,
                      },
                      displayName,
                    ),
              typeof schema !== 'boolean'
                ? h('input', {
                    class: fieldControl + ' w-full text-muted-foreground',
                    'aria-label': describe(description),
                    placeholder: t(description),
                    value:
                      typeof schema.description === 'string'
                        ? schema.description
                        : '',
                    onInput: (event: Event) =>
                      editAt(path, (target) => {
                        if (from(event)) target.description = from(event)
                        else delete target.description
                      }),
                  })
                : null,
            ]),
            typeControl(schema, path, displayName),
            isRequired === undefined
              ? null
              : h('label', { class: 'schema-builder-required' }, [
                  h('input', {
                    type: 'checkbox',
                    checked: isRequired,
                    'aria-label': describe(required),
                    onChange: (event: Event) =>
                      editAt(path.slice(0, -2), (parent) =>
                        setRequiredProperty(
                          parent,
                          name,
                          (event.target as HTMLInputElement).checked,
                        ),
                      ),
                  }),
                  t(required),
                ]),
            h('div', { class: 'schema-builder-actions' }, [
              iconButton(
                '⚙︎',
                describe(settings),
                (event) =>
                  emit('inspect', pointer, event.currentTarget as HTMLElement),
                { 'aria-haspopup': 'dialog' },
              ),
              canRemove
                ? iconButton(
                    '×',
                    describe(['Delete', 'Supprimer', 'Eliminar']),
                    () => remove(path, kind),
                    { class: 'schema-builder-icon schema-builder-delete' },
                  )
                : null,
            ]),
          ],
        ),
        open && container
          ? h('ul', { class: 'schema-builder-children' }, [
              ...propertyRows(object, path),
              ...tuple.flatMap((child, index) =>
                schemaNode(child)
                  ? [
                      row(
                        child,
                        [...path, 'prefixItems', String(index)],
                        `#${index + 1}`,
                        'position',
                      ),
                    ]
                  : [],
              ),
              hasItems
                ? row(
                    object.items as Schema,
                    [...path, 'items'],
                    t(itemsLabel),
                    'item',
                  )
                : null,
              hasProperties
                ? h('li', [
                    addButton(
                      addField,
                      () => addNamed(path, 'properties'),
                      describe(addField),
                    ),
                  ])
                : null,
              isArray && !hasItems
                ? h('li', [
                    addButton(
                      itemsLabel,
                      () => {
                        if (
                          editAt(path, (target) => {
                            target.items = { type: 'string' }
                          })
                        )
                          expanded.value.add(pointer)
                      },
                      describe(itemsLabel),
                    ),
                  ])
                : null,
            ])
          : null,
      ])
    }

    function addButton(label: Message, onClick: () => void, name = t(label)) {
      return h(
        Button,
        { type: 'default', size: 'small', onClick, 'aria-label': name },
        () => `+ ${t(label)}`,
      )
    }

    return () => {
      const schema = props.modelValue
      const properties = propertyRows(schema, [])
      const definitions = Object.entries(mapAt(schema, '$defs')).flatMap(
        ([name, child]) =>
          schemaNode(child)
            ? [row(child, ['$defs', name], name, 'definition')]
            : [],
      )
      return h(
        'section',
        {
          ref: root,
          class: 'schema-builder',
          'aria-label': t([
            'Schema fields',
            'Champs du schéma',
            'Campos del esquema',
          ]),
        },
        [
          h('div', { class: 'schema-builder-header' }, [
            h(
              'h3',
              { class: 'font-semibold' },
              t(['Fields', 'Champs', 'Campos']),
            ),
            h('div', { class: 'flex flex-wrap items-center gap-2' }, [
              iconButton(
                '⚙︎',
                t([
                  'Schema settings',
                  'Réglages du schéma',
                  'Ajustes del esquema',
                ]),
                (event) =>
                  emit('inspect', '', event.currentTarget as HTMLElement),
                { 'aria-haspopup': 'dialog' },
              ),
              addButton(addField, () => addNamed([], 'properties')),
            ]),
          ]),
          error.value
            ? h(
                'p',
                { class: 'px-3 text-sm text-destructive', role: 'alert' },
                error.value,
              )
            : null,
          properties.length
            ? h('ul', { class: 'schema-builder-list' }, properties)
            : h(
                'p',
                { class: 'schema-builder-empty' },
                t([
                  'Add a field to define the data model.',
                  'Ajoutez un champ pour définir le modèle de données.',
                  'Añade un campo para definir el modelo de datos.',
                ]),
              ),
          h(
            'details',
            {
              class: 'schema-builder-definitions',
              open: definitions.length > 0 || undefined,
            },
            [
              h(
                'summary',
                { class: 'cursor-pointer text-sm font-medium' },
                t(labels.$defs),
              ),
              definitions.length
                ? h('ul', { class: 'schema-builder-list' }, definitions)
                : null,
              addButton(
                [
                  'Add definition',
                  'Ajouter une définition',
                  'Añadir definición',
                ],
                () => addNamed([], '$defs'),
              ),
            ],
          ),
        ],
      )
    }
  },
})
