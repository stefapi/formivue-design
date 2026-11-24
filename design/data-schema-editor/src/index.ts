import { Button } from '@formivue-design/vue-ui'
import type {
  DataSchema,
  DocumentDependency,
  FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  compileDataValidator,
  copyJson,
  dataSchemaLocations,
  dataSchemaResources,
  isJsonObject,
  jsonPointer,
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
import { draft2020, labels, resources, type Message } from './keywords'
import { createRuleControls, replaceSubschema } from './schema-rules'
export { DataValuesEditor } from './values'

type Model = FormDocuments['dataSchema']
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
  minContains: labels.minContains,
  maxContains: labels.maxContains,
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
}
const families = {
  types: ['Types and values', 'Types et valeurs', 'Tipos y valores'],
  numbers: ['Numbers', 'Nombres', 'Números'],
  strings: ['Strings', 'Chaînes', 'Cadenas'],
  objects: ['Objects', 'Objets', 'Objetos'],
  arrays: ['Arrays', 'Listes', 'Listas'],
  combinations: [
    'Combinations and conditions',
    'Combinaisons et conditions',
    'Combinaciones y condiciones',
  ],
  content: ['Content', 'Contenu', 'Contenido'],
  resources: [
    'Resources and references',
    'Ressources et références',
    'Recursos y referencias',
  ],
  annotations: ['Annotations', 'Annotations', 'Anotaciones'],
} satisfies Record<string, Message>
type Family = keyof typeof families
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

function dataPath(path: string[]) {
  if (path[0] === '$defs') return
  const result: (string | null)[] = []
  for (let index = 0; index < path.length; index++) {
    const part = path[index]
    if (part === 'items') result.push(null)
    else if (part === 'properties' || part === 'prefixItems')
      result.push(path[++index])
    else if (['allOf', 'anyOf', 'oneOf'].includes(part)) index++
    else return
  }
  return result
}

function schemaUsages(
  model: Model,
  dependencies: readonly DocumentDependency[],
) {
  const usages = new Map<string, DocumentDependency[]>()
  const registry = dataSchemaResources(model)
  for (const dependency of dependencies) {
    const seen = new Map<string, Set<number>>()
    const visit = (path: string[], depth: number) => {
      const schema = valueAt(model, path)
      if (schema === undefined) return
      const pointer = jsonPointer(path)
      const levels = seen.get(pointer) ?? new Set<number>()
      if (levels.has(depth)) return
      levels.add(depth)
      seen.set(pointer, levels)
      if (depth === dependency.path.length) {
        const entries = usages.get(pointer) ?? []
        if (
          !entries.some(
            ({ componentId, property }) =>
              componentId === dependency.componentId &&
              property === dependency.property,
          )
        )
          entries.push(dependency)
        usages.set(pointer, entries)
      }
      if (!isJsonObject(schema)) return
      for (const key of ['$ref', '$dynamicRef']) {
        const target = registry.resolve(schema, schema[key])
        if (target?.document === model) visit(target.path, depth)
      }
      for (const key of ['then', 'else'])
        if (schema.if !== undefined) visit([...path, key], depth)
      if (isJsonObject(schema.dependentSchemas))
        for (const key of Object.keys(schema.dependentSchemas))
          visit([...path, 'dependentSchemas', key], depth)
      for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
        const branches = schema[keyword]
        if (Array.isArray(branches))
          branches.forEach((_, index) =>
            visit([...path, keyword, String(index)], depth),
          )
      }
      if (depth === dependency.path.length) return
      const step = dependency.path[depth]
      if (step === null) {
        visit([...path, 'items'], depth + 1)
        if (Array.isArray(schema.prefixItems))
          schema.prefixItems.forEach((_, index) =>
            visit([...path, 'prefixItems', String(index)], depth + 1),
          )
      } else {
        visit([...path, 'properties', step], depth + 1)
        if (/^(0|[1-9]\d*)$/u.test(step))
          visit([...path, 'prefixItems', step], depth + 1)
        let named = Object.prototype.hasOwnProperty.call(
          schema.properties ?? {},
          step,
        )
        if (isJsonObject(schema.patternProperties))
          for (const pattern of Object.keys(schema.patternProperties)) {
            try {
              if (!new RegExp(pattern, 'u').test(step)) continue
              named = true
              visit([...path, 'patternProperties', pattern], depth + 1)
            } catch {
              // The draft inspector also displays incomplete patterns.
            }
          }
        if (!named) visit([...path, 'additionalProperties'], depth + 1)
      }
    }
    visit([], 0)
  }
  return usages
}

export const DataSchemaEditor = defineComponent({
  name: 'DataSchemaEditor',
  props: {
    modelValue: { type: Object as PropType<Model>, required: true },
    locale: { type: String, default: 'en' },
    tree: Boolean,
    dependencies: {
      type: Array as PropType<readonly DocumentDependency[]>,
      default: () => [],
    },
    componentLabel: Function as PropType<(id: string) => string | undefined>,
  },
  emits: {
    'update:modelValue': (_value: Model) => true,
    navigate: (id: string) => !!id,
  },
  setup(props, { emit, slots }) {
    const selected = ref('')
    const inspecting = ref(false)
    const example = ref('')
    const localError = ref('')
    const id = useId()
    const locations = computed(() =>
      [...dataSchemaLocations(props.modelValue)].map((path) => ({
        path,
        pointer: jsonPointer(path),
        data: dataPath(path),
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
    const group = (family: Family, contents: VNodeChild[]) =>
      h(
        'fieldset',
        {
          id: id + '-' + family,
          tabindex: -1,
          class: 'grid min-w-0 gap-3 rounded-md border p-3',
        },
        [
          h(
            'legend',
            { class: 'px-1 text-sm font-semibold' },
            t(families[family]),
          ),
          ...contents,
        ],
      )

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
          'data-schema-keyword': key,
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
              'data-schema-keyword': key,
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
            'aria-label': t(booleans[key]),
            'data-schema-keyword': key,
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
    const registry = computed(() => dataSchemaResources(props.modelValue))
    const reference = (keyword: '$ref' | '$dynamicRef') => {
      const target = registry.value.resolve(schema.value, schema.value[keyword])
      return target?.document === props.modelValue
        ? jsonPointer(target.path)
        : undefined
    }
    const rules = createRuleControls({
      current: () => schema.value,
      path: () => location.value.path,
      edit,
      select,
      t,
      control,
    })
    const usages = computed(() =>
      schemaUsages(props.modelValue, props.dependencies),
    )
    function select(pointer: string) {
      selected.value = pointer
      inspecting.value = true
      example.value = ''
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
      const enabledFamilies: Record<Family, boolean> = {
        types: true,
        numbers: relevant('number') || relevant('integer'),
        strings: relevant('string'),
        objects: relevant('object'),
        arrays: relevant('array'),
        annotations: true,
        combinations: true,
        content: true,
        resources: true,
      }
      const refTarget = reference('$ref')
      const dynamicTarget = reference('$dynamicRef')
      const resourceRoot =
        !location.value.path.length || typeof current.$id === 'string'
      const inspector = h(
        'div',
        {
          class: props.tree
            ? 'schema-inspector min-w-0 space-y-3'
            : 'min-h-0 flex-1 overflow-auto space-y-3',
        },
        [
          h('div', { class: 'flex flex-wrap items-end gap-2' }, [
            props.tree
              ? h(
                  'div',
                  { class: 'flex min-w-0 flex-wrap items-center gap-2' },
                  [
                    h(
                      'button',
                      {
                        type: 'button',
                        class:
                          'schema-tree-back rounded border px-2 py-1 text-sm',
                        onClick: () => {
                          inspecting.value = false
                        },
                      },
                      t([
                        'Schema tree',
                        'Arbre du schéma',
                        'Árbol del esquema',
                      ]),
                    ),
                    h(
                      'h3',
                      { class: 'font-semibold break-all' },
                      location.value.data
                        ? jsonPointer(
                            location.value.data.map((part) => part ?? '*'),
                          ) || '/'
                        : location.value.pointer,
                    ),
                  ],
                )
              : label(
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
            dynamicTarget !== undefined
              ? button(
                  [
                    'Open dynamic reference',
                    'Ouvrir la référence dynamique',
                    'Abrir referencia dinámica',
                  ],
                  () => select(dynamicTarget),
                )
              : null,
            refTarget !== undefined &&
            locations.value.some(({ pointer }) => pointer === refTarget)
              ? button(
                  ['Open reference', 'Ouvrir la référence', 'Abrir referencia'],
                  () => select(refTarget),
                )
              : null,
          ]),
          props.tree &&
            h('div', { class: 'grid gap-2' }, [
              ...(usages.value.get(location.value.pointer) ?? []).map(
                ({ componentId, property, types }) => {
                  const component = props.componentLabel?.(componentId)
                  return h(
                    'div',
                    {
                      key: componentId + property,
                      class: 'flex flex-wrap items-center gap-2 text-sm',
                    },
                    [
                      h('span', [
                        component ?? componentId,
                        ' · ',
                        property,
                        ' · ',
                        types
                          .map((type) =>
                            typeNames[type] ? t(typeNames[type]) : type,
                          )
                          .join(' / '),
                      ]),
                      (!props.componentLabel || component) &&
                        button(
                          [
                            'Select on canvas',
                            'Sélectionner sur le canevas',
                            'Seleccionar en el lienzo',
                          ],
                          () => emit('navigate', componentId),
                        ),
                    ],
                  )
                },
              ),
              slots.inspector?.({
                path: location.value.data,
                pointer: location.value.pointer,
              }),
            ]),
          location.value.path.length
            ? label(
                t(['Schema form', 'Forme du schéma', 'Forma del esquema']),
                h(
                  'select',
                  {
                    'aria-label': t([
                      'Schema form',
                      'Forme du schéma',
                      'Forma del esquema',
                    ]),
                    class: control,
                    value:
                      typeof node.value === 'boolean'
                        ? String(node.value)
                        : 'object',
                    onChange: (event: Event) => {
                      const next = valueFrom(event)
                      emit(
                        'update:modelValue',
                        replaceSubschema(
                          props.modelValue,
                          location.value.path,
                          next === 'object' ? {} : next === 'true',
                        ) as Model,
                      )
                    },
                  },
                  [
                    h('option', { value: 'object' }, t(typeNames.object)),
                    h(
                      'option',
                      { value: 'true' },
                      t([
                        'True · accepts every value',
                        'Vrai · accepte toute valeur',
                        'Verdadero · acepta cualquier valor',
                      ]),
                    ),
                    h(
                      'option',
                      { value: 'false' },
                      t([
                        'False · rejects every value',
                        'Faux · refuse toute valeur',
                        'Falso · rechaza cualquier valor',
                      ]),
                    ),
                  ],
                ),
              )
            : null,
          props.tree &&
            isJsonObject(node.value) &&
            h(
              'select',
              {
                class: control,
                'aria-label': t([
                  'Add a rule',
                  'Ajouter une règle',
                  'Añadir una regla',
                ]),
                value: '',
                onChange: (event: Event) => {
                  const control = event.target as HTMLSelectElement
                  const target = document.getElementById(
                    id + '-' + control.value,
                  )
                  control.value = ''
                  target?.focus()
                  target?.scrollIntoView?.({ block: 'nearest' })
                },
              },
              [
                h(
                  'option',
                  { value: '' },
                  t(['Add a rule', 'Ajouter une règle', 'Añadir una regla']),
                ),
                ...(Object.keys(families) as Family[])
                  .filter((family) => enabledFamilies[family])
                  .map((family) =>
                    h(
                      'option',
                      { value: family, key: family },
                      t(families[family]),
                    ),
                  ),
              ],
            ),
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
                group('types', [
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
                ]),
                enabledFamilies.numbers
                  ? group('numbers', [
                      numberControls([
                        'minimum',
                        'maximum',
                        'exclusiveMinimum',
                        'exclusiveMaximum',
                        'multipleOf',
                      ]),
                    ])
                  : null,
                enabledFamilies.strings
                  ? group('strings', [
                      numberControls(['minLength', 'maxLength']),
                      annotation('pattern', [
                        'Regular expression',
                        'Expression régulière',
                        'Expresión regular',
                      ]),
                      annotation('format', ['Format', 'Format', 'Formato']),
                      h(
                        'p',
                        { class: 'text-sm text-muted-foreground' },
                        t([
                          'Format describes a string. Formivue validates registered formats by default.',
                          'Le format décrit une chaîne. Formivue valide les formats enregistrés par défaut.',
                          'El formato describe una cadena. Formivue valida por defecto los formatos registrados.',
                        ]),
                      ),
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
                    ])
                  : null,
                enabledFamilies.objects
                  ? group('objects', [
                      numberControls(['minProperties', 'maxProperties']),
                      rules.named('properties'),
                      rules.required(),
                      rules.named('patternProperties'),
                      rules.child('additionalProperties'),
                      rules.child('propertyNames'),
                      rules.dependencies(),
                      rules.named('dependentSchemas'),
                      rules.child('unevaluatedProperties'),
                    ])
                  : null,
                enabledFamilies.arrays
                  ? group('arrays', [
                      numberControls(['minItems', 'maxItems']),
                      flag('uniqueItems'),
                      rules.child('items'),
                      rules.branches('prefixItems'),
                      rules.child('contains'),
                      numberControls(['minContains', 'maxContains']),
                      rules.child('unevaluatedItems'),
                    ])
                  : null,
                group('combinations', [
                  ...['allOf', 'anyOf', 'oneOf'].map(rules.branches),
                  ...['not', 'if', 'then', 'else'].map(rules.child),
                ]),
                group('content', [
                  annotation('contentEncoding', labels.contentEncoding),
                  annotation('contentMediaType', labels.contentMediaType),
                  rules.child('contentSchema'),
                  h(
                    'p',
                    { class: 'text-sm text-muted-foreground' },
                    t([
                      'Content keywords describe embedded data. Content validation requires a configured checker.',
                      'Ces mots-clés décrivent les données intégrées. Leur validation nécessite un contrôle configuré.',
                      'Estas palabras clave describen los datos integrados. Validarlos requiere un verificador configurado.',
                    ]),
                  ),
                ]),
                group('resources', [
                  ...resources
                    .filter((keyword) => keyword !== '$schema' || resourceRoot)
                    .map((keyword) => annotation(keyword, labels[keyword])),
                  resourceRoot &&
                    button(
                      [
                        'Use 2020-12 dialect',
                        'Utiliser le dialecte 2020-12',
                        'Usar el dialecto 2020-12',
                      ],
                      () => edit('$schema', draft2020),
                    ),
                  rules.named('$defs'),
                  resourceRoot && rules.vocabulary(),
                ]),
                group('annotations', [
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
                ]),
              ]),
        ],
      )
      if (!props.tree) return inspector
      const title = t(['Schema tree', 'Arbre du schéma', 'Árbol del esquema'])
      return h(
        'div',
        {
          class: 'data-schema-tree-layout',
          'data-inspecting': inspecting.value,
        },
        [
          h('nav', { class: 'schema-tree min-w-0', 'aria-label': title }, [
            h('h3', { class: 'mb-2 text-sm font-semibold' }, title),
            h(
              'ul',
              { class: 'space-y-1' },
              locations.value.map(({ path, pointer, data }) => {
                const linked = usages.value.get(pointer)?.length ?? 0
                const name = data
                  ? jsonPointer(data.map((part) => part ?? '*'))
                  : pointer
                return h('li', { key: pointer }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class:
                        'w-full rounded px-2 py-1 text-left text-sm break-all hover:bg-muted aria-current:bg-accent',
                      'aria-current':
                        location.value.pointer === pointer ? 'true' : undefined,
                      'data-schema-node': pointer,
                      style: {
                        paddingInlineStart:
                          Math.min(path.length, 8) * 4 + 8 + 'px',
                      },
                      onClick: () => select(pointer),
                    },
                    [
                      name || t(['Root', 'Racine', 'Raíz']),
                      linked
                        ? h(
                            'span',
                            {
                              class: 'ms-2 text-xs text-muted-foreground',
                              title: t([
                                'Bound components',
                                'Composants liés',
                                'Componentes vinculados',
                              ]),
                            },
                            String(linked),
                          )
                        : null,
                    ],
                  ),
                ])
              }),
            ),
          ]),
          inspector,
        ],
      )
    }
  },
})
