import { Button } from '@formivue-design/vue-ui'
import type {
  DataSchema,
  FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  compileDataValidator,
  copyJson,
  isJsonObject,
  jsonPointer,
  pointerSegments,
  valueAt,
  type JsonValue,
} from '@formivue/json-schema'
import {
  computed,
  defineComponent,
  h,
  ref,
  useId,
  type PropType,
  type VNodeChild,
} from 'vue'

type Model = FormDocuments['dataSchema']
type Message = readonly [string, string, string]
const types = [
  'object',
  'array',
  'string',
  'integer',
  'number',
  'boolean',
  'null',
]
const typeNames: Record<string, Message> = {
  object: ['Object', 'Objet', 'Objeto'],
  array: ['Array', 'Tableau', 'Lista'],
  string: ['String', 'Chaîne', 'Cadena'],
  integer: ['Integer', 'Entier', 'Entero'],
  number: ['Number', 'Nombre', 'Número'],
  boolean: ['Boolean', 'Booléen', 'Booleano'],
  null: ['Null', 'Nul', 'Nulo'],
}
const numeric: Record<string, Message> = {
  minimum: ['Minimum', 'Minimum', 'Mínimo'],
  maximum: ['Maximum', 'Maximum', 'Máximo'],
  exclusiveMinimum: [
    'Exclusive minimum',
    'Minimum exclusif',
    'Mínimo exclusivo',
  ],
  exclusiveMaximum: [
    'Exclusive maximum',
    'Maximum exclusif',
    'Máximo exclusivo',
  ],
  multipleOf: ['Multiple of', 'Multiple de', 'Múltiplo de'],
  minLength: ['Minimum length', 'Longueur minimale', 'Longitud mínima'],
  maxLength: ['Maximum length', 'Longueur maximale', 'Longitud máxima'],
  minItems: [
    'Minimum items',
    'Nombre minimal d’éléments',
    'Número mínimo de elementos',
  ],
  maxItems: [
    'Maximum items',
    'Nombre maximal d’éléments',
    'Número máximo de elementos',
  ],
  minProperties: [
    'Minimum properties',
    'Nombre minimal de propriétés',
    'Número mínimo de propiedades',
  ],
  maxProperties: [
    'Maximum properties',
    'Nombre maximal de propriétés',
    'Número máximo de propiedades',
  ],
}
const booleans: Record<string, Message> = {
  readOnly: ['Read only', 'Lecture seule', 'Solo lectura'],
  writeOnly: ['Write only', 'Écriture seule', 'Solo escritura'],
  deprecated: ['Deprecated', 'Déprécié', 'Obsoleto'],
  uniqueItems: ['Unique items', 'Éléments uniques', 'Elementos únicos'],
  additionalProperties: [
    'Additional properties',
    'Propriétés supplémentaires',
    'Propiedades adicionales',
  ],
}
const control =
  'min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-ring'
const valueFrom = (event: Event) => (event.target as HTMLInputElement).value
const initialValue = (type: string): JsonValue =>
  type === 'object'
    ? {}
    : type === 'array'
      ? []
      : type === 'boolean'
        ? false
        : type === 'number' || type === 'integer'
          ? 0
          : type === 'null'
            ? null
            : ''
const valueType = (value: JsonValue) =>
  Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value

function schemaLocations(schema: DataSchema, path: string[] = []): string[][] {
  if (!isJsonObject(schema)) return [path]
  const children = ['$defs', 'properties'].flatMap((key) => {
    const map = schema[key]
    return isJsonObject(map)
      ? Object.entries(map).flatMap(([name, child]) =>
          schemaLocations(child as DataSchema, [...path, key, name]),
        )
      : []
  })
  if (schema.items !== undefined)
    children.push(
      ...schemaLocations(schema.items as DataSchema, [...path, 'items']),
    )
  for (const keyword of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
    const branches = schema[keyword]
    if (Array.isArray(branches))
      branches.forEach((child, index) =>
        children.push(
          ...schemaLocations(child as DataSchema, [
            ...path,
            keyword,
            String(index),
          ]),
        ),
      )
  }
  return [path, ...children]
}

export const DataSchemaEditor = defineComponent({
  name: 'DataSchemaEditor',
  props: {
    modelValue: { type: Object as PropType<Model>, required: true },
    locale: { type: String, default: 'en' },
  },
  emits: { 'update:modelValue': (_value: Model) => true },
  setup(props, { emit }) {
    const selected = ref('')
    const example = ref('')
    const propertyName = ref('')
    const localError = ref('')
    const id = useId()
    const locations = computed(() =>
      schemaLocations(props.modelValue).map((path) => ({
        path,
        pointer: jsonPointer(path),
      })),
    )
    const location = computed(
      () =>
        locations.value.find(({ pointer }) => pointer === selected.value) ??
        locations.value[0],
    )
    const node = computed(
      () => valueAt(props.modelValue, location.value.path) as DataSchema,
    )
    const schema = computed(() =>
      isJsonObject(node.value) ? (node.value as Model) : {},
    )
    const t = (labels: Message) =>
      labels[
        props.locale.startsWith('fr')
          ? 1
          : props.locale.startsWith('es')
            ? 2
            : 0
      ]
    const button = (labels: Message, onClick: () => void, disabled = false) =>
      h(Button, { size: 'small', variant: 'outline', onClick, disabled }, () =>
        t(labels),
      )
    const label = (text: string, input: VNodeChild) =>
      h('label', { class: 'grid min-w-0 gap-1 text-sm' }, [text, input])
    const group = (heading: Message, contents: VNodeChild[]) =>
      h('fieldset', { class: 'grid min-w-0 gap-3 rounded-md border p-3' }, [
        h('legend', { class: 'px-1 text-sm font-semibold' }, t(heading)),
        ...contents,
      ])

    function edit(keyword: string, value?: unknown) {
      const next = copyJson(props.modelValue) as Model
      const target = valueAt(next, location.value.path) as Model
      if (value === undefined) delete target[keyword]
      else target[keyword] = value
      localError.value = ''
      emit('update:modelValue', next)
    }

    const updateTyped = (
      value: JsonValue,
      change: (value: JsonValue) => void,
      name: string,
    ) => {
      const type = valueType(value)
      const typePicker = h(
        'select',
        {
          class: control,
          'aria-label': name + ' · ' + t(['Type', 'Type', 'Tipo']),
          value: type,
          onChange: (event: Event) => change(initialValue(valueFrom(event))),
        },
        types
          .filter((type) => type !== 'integer')
          .map((type) => h('option', { value: type }, t(typeNames[type]))),
      )
      const attrs = { class: control, 'aria-label': name }
      const input =
        type === 'null'
          ? null
          : type === 'object' || type === 'array'
            ? h('textarea', {
                ...attrs,
                rows: 2,
                value: JSON.stringify(value),
                onChange: (event: Event) => {
                  try {
                    const parsed = JSON.parse(valueFrom(event)) as JsonValue
                    if (valueType(parsed) !== type) throw Error()
                    change(copyJson(parsed))
                  } catch {
                    localError.value = t([
                      'Enter valid JSON of the selected type',
                      'Saisir un JSON valide du type choisi',
                      'Introduce JSON válido del tipo elegido',
                    ])
                  }
                },
              })
            : type === 'boolean'
              ? h(
                  'select',
                  {
                    ...attrs,
                    value: String(value),
                    onChange: (event: Event) =>
                      change(valueFrom(event) === 'true'),
                  },
                  ['true', 'false'].map((value) =>
                    h('option', { value }, value),
                  ),
                )
              : h('input', {
                  ...attrs,
                  type: type === 'number' ? 'number' : 'text',
                  step: type === 'number' ? 'any' : undefined,
                  value: value as number | string,
                  onInput: (event: Event) => {
                    const input = valueFrom(event)
                    if (type === 'string') change(input)
                    else if (input !== '' && Number.isFinite(Number(input)))
                      change(Number(input))
                  },
                })
      return h(
        'div',
        {
          class:
            'grid min-w-0 grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-2',
        },
        [typePicker, input],
      )
    }
    const initial = () => {
      const declared = schema.value.type
      return initialValue(Array.isArray(declared) ? declared[0] : declared)
    }
    const annotation = (key: string, labels: Message) =>
      label(
        t(labels),
        h(key === 'description' ? 'textarea' : 'input', {
          class: control,
          value: schema.value[key] ?? '',
          onInput: (event: Event) => edit(key, valueFrom(event) || undefined),
        }),
      )
    const numberControls = (keys: string[]) =>
      h(
        'div',
        { class: 'grid grid-cols-1 gap-2 sm:grid-cols-2' },
        keys.map((key) =>
          label(
            t(numeric[key]),
            h('input', {
              type: 'number',
              class: control,
              step:
                key.endsWith('Length') ||
                key.endsWith('Items') ||
                key.endsWith('Properties')
                  ? 1
                  : 'any',
              value: schema.value[key] ?? '',
              onInput: (event: Event) => {
                const value = valueFrom(event)
                if (value === '') edit(key)
                else if (Number.isFinite(Number(value)))
                  edit(key, Number(value))
              },
            }),
          ),
        ),
      )
    const flag = (key: string) =>
      label(
        t(booleans[key]),
        h(
          'select',
          {
            class: control,
            value:
              typeof schema.value[key] === 'boolean'
                ? String(schema.value[key])
                : '',
            onChange: (event: Event) => {
              const value = valueFrom(event)
              edit(key, value ? value === 'true' : undefined)
            },
          },
          [
            h(
              'option',
              { value: '' },
              t(['Unspecified', 'Non défini', 'Sin definir']),
            ),
            h('option', { value: 'true' }, t(['Yes', 'Oui', 'Sí'])),
            h('option', { value: 'false' }, t(['No', 'Non', 'No'])),
          ],
        ),
      )

    function list(key: 'enum' | 'examples', heading: Message) {
      const entries = (
        Array.isArray(schema.value[key]) ? schema.value[key] : []
      ) as JsonValue[]
      return [
        h('p', { class: 'text-sm font-medium' }, t(heading)),
        ...entries.map((value, i) =>
          h(
            'div',
            { key: i, class: 'grid grid-cols-[minmax(0,1fr)_auto] gap-2' },
            [
              updateTyped(
                value,
                (next) =>
                  edit(
                    key,
                    entries.map((item, index) => (index === i ? next : item)),
                  ),
                t(heading) + ' ' + (i + 1),
              ),
              button(
                ['Remove value', 'Retirer la valeur', 'Quitar valor'],
                () =>
                  edit(
                    key,
                    entries.length > 1
                      ? entries.filter((_, n) => n !== i)
                      : undefined,
                  ),
              ),
            ],
          ),
        ),
        h('div', [
          button(
            key === 'enum'
              ? [
                  'Add allowed value',
                  'Ajouter une valeur autorisée',
                  'Añadir valor permitido',
                ]
              : ['Add example', 'Ajouter un exemple', 'Añadir ejemplo'],
            () => edit(key, [...entries, initial()]),
          ),
        ]),
      ]
    }
    function optionalValue(key: 'const' | 'default', heading: Message) {
      return h('div', { class: 'grid gap-2' }, [
        h('p', { class: 'text-sm font-medium' }, t(heading)),
        ...(schema.value[key] === undefined
          ? [
              h('div', [
                button(
                  ['Set value', 'Définir la valeur', 'Definir valor'],
                  () => edit(key, initial()),
                ),
              ]),
            ]
          : [
              updateTyped(
                schema.value[key] as JsonValue,
                (value) => edit(key, value),
                t(heading),
              ),
              h('div', [
                button(
                  ['Clear value', 'Effacer la valeur', 'Borrar valor'],
                  () => edit(key),
                ),
              ]),
            ]),
      ])
    }

    const patternResult = computed(() => {
      const { pattern } = schema.value
      if (typeof pattern !== 'string') return ''
      try {
        return compileDataValidator({ type: 'string', pattern })(example.value)
          .length
          ? t([
              'Sample does not match',
              'L’exemple ne correspond pas',
              'El ejemplo no coincide',
            ])
          : t(['Sample matches', 'L’exemple correspond', 'El ejemplo coincide'])
      } catch {
        return t([
          'Invalid regular expression',
          'Expression régulière invalide',
          'Expresión regular no válida',
        ])
      }
    })
    const reference = computed(() => {
      try {
        const ref = schema.value.$ref
        return ref === '#' || ref?.startsWith('#/')
          ? jsonPointer(pointerSegments(decodeURIComponent(ref.slice(1))))
          : undefined
      } catch {
        return undefined
      }
    })
    function select(pointer: string) {
      selected.value = pointer
      example.value = ''
      propertyName.value = ''
      localError.value = ''
    }

    return () => {
      const current = schema.value
      const selectedTypes = Array.isArray(current.type)
        ? current.type
        : current.type
          ? [current.type]
          : []
      const relevant = (type: string) =>
        !selectedTypes.length || selectedTypes.includes(type)
      const refTarget = reference.value
      const properties = current.properties ?? {}
      const candidate = propertyName.value.trim()
      return h('div', { class: 'min-h-0 flex-1 overflow-auto space-y-3' }, [
        h('div', { class: 'flex flex-wrap items-end gap-2' }, [
          label(
            t(['Schema node', 'Nœud du schéma', 'Nodo del esquema']),
            h(
              'select',
              {
                class: control,
                value: location.value.pointer,
                onChange: (event: Event) => select(valueFrom(event)),
              },
              locations.value.map(({ pointer }) =>
                h(
                  'option',
                  { value: pointer },
                  pointer || t(['Root', 'Racine', 'Raíz']),
                ),
              ),
            ),
          ),
          refTarget !== undefined &&
          locations.value.some(({ pointer }) => pointer === refTarget)
            ? button(
                ['Open reference', 'Ouvrir la référence', 'Abrir referencia'],
                () => select(refTarget),
              )
            : null,
        ]),
        localError.value
          ? h(
              'p',
              { role: 'alert', class: 'text-destructive text-sm' },
              localError.value,
            )
          : null,
        !isJsonObject(node.value)
          ? h('p', { class: 'text-sm' }, String(node.value))
          : h('div', { class: 'grid gap-3 xl:grid-cols-2' }, [
              group(
                ['Types and values', 'Types et valeurs', 'Tipos y valores'],
                [
                  h(
                    'div',
                    { class: 'flex flex-wrap gap-3' },
                    types.map((type) =>
                      h('label', { class: 'flex items-center gap-1 text-sm' }, [
                        h('input', {
                          type: 'checkbox',
                          checked: selectedTypes.includes(type),
                          onChange: (event: Event) => {
                            const next = (event.target as HTMLInputElement)
                              .checked
                              ? [...selectedTypes, type]
                              : selectedTypes.filter((item) => item !== type)
                            edit('type', next.length > 1 ? next : next[0])
                          },
                        }),
                        t(typeNames[type]),
                      ]),
                    ),
                  ),
                  ...list('enum', [
                    'Allowed values',
                    'Valeurs autorisées',
                    'Valores permitidos',
                  ]),
                  optionalValue('const', [
                    'Constant',
                    'Constante',
                    'Constante',
                  ]),
                ],
              ),
              relevant('number') || relevant('integer')
                ? group(
                    ['Numbers', 'Nombres', 'Números'],
                    [
                      numberControls([
                        'minimum',
                        'maximum',
                        'exclusiveMinimum',
                        'exclusiveMaximum',
                        'multipleOf',
                      ]),
                    ],
                  )
                : null,
              relevant('string')
                ? group(
                    ['Strings', 'Chaînes', 'Cadenas'],
                    [
                      numberControls(['minLength', 'maxLength']),
                      annotation('pattern', [
                        'Regular expression',
                        'Expression régulière',
                        'Expresión regular',
                      ]),
                      annotation('format', ['Format', 'Format', 'Formato']),
                      typeof current.pattern === 'string'
                        ? label(
                            t([
                              'Pattern sample',
                              'Exemple à tester',
                              'Ejemplo para probar',
                            ]),
                            h('input', {
                              id,
                              class: control,
                              value: example.value,
                              'aria-describedby': id + '-result',
                              onInput: (event: Event) => {
                                example.value = valueFrom(event)
                              },
                            }),
                          )
                        : null,
                      patternResult.value
                        ? h(
                            'p',
                            {
                              id: id + '-result',
                              role: 'status',
                              class: 'text-sm text-muted-foreground',
                            },
                            patternResult.value,
                          )
                        : null,
                    ],
                  )
                : null,
              relevant('object')
                ? group(
                    ['Objects', 'Objets', 'Objetos'],
                    [
                      numberControls(['minProperties', 'maxProperties']),
                      flag('additionalProperties'),
                      ...Object.keys(properties).map((name) =>
                        h(
                          'div',
                          { key: name, class: 'flex items-center gap-2' },
                          [
                            h(
                              'label',
                              { class: 'flex items-center gap-2 text-sm' },
                              [
                                h('input', {
                                  type: 'checkbox',
                                  checked: current.required?.includes(name),
                                  onChange: (event: Event) => {
                                    const all = current.required ?? []
                                    const next = (
                                      event.target as HTMLInputElement
                                    ).checked
                                      ? [...all, name]
                                      : all.filter((key) => key !== name)
                                    edit(
                                      'required',
                                      next.length ? next : undefined,
                                    )
                                  },
                                }),
                                t(['Required', 'Obligatoire', 'Obligatorio']) +
                                  ' · ' +
                                  name,
                              ],
                            ),
                          ],
                        ),
                      ),
                      h('div', { class: 'flex flex-wrap items-end gap-2' }, [
                        label(
                          t([
                            'Property name',
                            'Nom de propriété',
                            'Nombre de propiedad',
                          ]),
                          h('input', {
                            class: control,
                            value: propertyName.value,
                            onInput: (event: Event) => {
                              propertyName.value = valueFrom(event)
                            },
                          }),
                        ),
                        button(
                          [
                            'Add property',
                            'Ajouter une propriété',
                            'Añadir propiedad',
                          ],
                          () => {
                            edit('properties', {
                              ...properties,
                              [candidate]: {},
                            })
                            select(
                              jsonPointer([
                                ...location.value.path,
                                'properties',
                                candidate,
                              ]),
                            )
                          },
                          !candidate ||
                            own(properties, candidate) ||
                            ['__proto__', 'constructor', 'prototype'].includes(
                              candidate,
                            ),
                        ),
                      ]),
                    ],
                  )
                : null,
              relevant('array')
                ? group(
                    ['Arrays', 'Listes', 'Listas'],
                    [
                      numberControls(['minItems', 'maxItems']),
                      flag('uniqueItems'),
                      current.items === undefined
                        ? h('div', [
                            button(
                              [
                                'Add item schema',
                                'Ajouter le schéma des éléments',
                                'Añadir esquema de elementos',
                              ],
                              () => {
                                edit('items', {})
                                select(
                                  jsonPointer([
                                    ...location.value.path,
                                    'items',
                                  ]),
                                )
                              },
                            ),
                          ])
                        : null,
                    ],
                  )
                : null,
              group(
                ['Annotations', 'Annotations', 'Anotaciones'],
                [
                  annotation('title', ['Title', 'Titre', 'Título']),
                  annotation('description', [
                    'Description',
                    'Description',
                    'Descripción',
                  ]),
                  flag('readOnly'),
                  flag('writeOnly'),
                  flag('deprecated'),
                  optionalValue('default', [
                    'Default value',
                    'Valeur par défaut',
                    'Valor predeterminado',
                  ]),
                  ...list('examples', ['Examples', 'Exemples', 'Ejemplos']),
                ],
              ),
            ]),
      ])
    }
  },
})

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
