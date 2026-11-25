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
  Comment,
  defineComponent,
  h,
  ref,
  useId,
  type PropType,
  type VNodeChild,
} from 'vue'
import {
  draft2020,
  labels,
  resources,
  schemaChildren,
  schemaLists,
  schemaMaps,
  typeNames,
  types,
  type Message,
} from './keywords'
import {
  createRuleControls,
  replaceSubschema,
  setRequiredProperty,
} from './schema-rules'
import { SchemaBuilder } from './builder'
import { FieldSettings, type SettingsSection } from './field-settings'
import { AdvancedRules } from './advanced-rules'
export { DataValuesEditor } from './values'

type Model = FormDocuments['dataSchema']
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
    builder: Boolean,
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
    const builderRoot = ref<HTMLElement>()
    const section = ref<SettingsSection>('validation')
    const advancedRule = ref<string>()
    const history = ref<
      { pointer: string; section: SettingsSection; rule?: string }[]
    >([])
    let trigger: HTMLElement | undefined
    const example = ref<string>()
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
      h('label', { class: 'grid min-w-0 gap-1.5 text-sm font-medium' }, [
        text,
        input,
      ])
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
    const annotation = (key: string, labels: Message, attrs = {}) =>
      label(
        t(labels),
        h(key === 'description' ? 'textarea' : 'input', {
          class: control,
          'data-schema-keyword': key,
          value: schema.value[key] ?? '',
          onInput: (event: Event) => edit(key, valueFrom(event) || undefined),
          ...attrs,
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
                key.endsWith('Contains') ||
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

    function list(
      key: 'enum' | 'examples',
      heading: Message,
      showHeading = true,
    ) {
      const entries = (
        Array.isArray(schema.value[key]) ? schema.value[key] : []
      ) as JsonValue[]
      return [
        showHeading
          ? h('p', { class: 'text-sm font-medium' }, t(heading))
          : null,
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
        const validate = compileDataValidator({ type: 'string', pattern })
        if (props.builder && example.value === undefined) return ''
        return validate(example.value ?? '').length
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
      inline: props.builder,
    })
    const usages = computed(() =>
      schemaUsages(props.modelValue, props.dependencies),
    )
    const linked = computed(() => {
      const paths = new Set<string>()
      for (const { path, pointer } of locations.value) {
        if (!usages.value.has(pointer)) continue
        for (let i = 0; i <= path.length; i++)
          paths.add(jsonPointer(path.slice(0, i)))
      }
      return paths
    })
    function referencedDataPath() {
      const paths = new Map<string, (string | null)[]>()
      for (const { path } of usages.value.get(location.value.pointer) ?? [])
        paths.set(JSON.stringify(path), [...path])
      if (paths.size === 1) return paths.values().next().value
    }
    function show(pointer: string, nextSection: SettingsSection) {
      selected.value = pointer
      section.value = nextSection
      advancedRule.value = undefined
      inspecting.value = true
      example.value = undefined
      localError.value = ''
    }

    function select(pointer: string) {
      if (props.builder && inspecting.value) {
        if (pointer === selected.value) return
        history.value.push({
          pointer: selected.value,
          section: section.value,
          rule: advancedRule.value,
        })
      }
      show(pointer, 'validation')
    }

    function openInspector(pointer: string, button?: HTMLElement) {
      history.value = []
      trigger = button
      show(pointer, 'validation')
    }

    function back() {
      const previous = history.value.pop()
      if (previous) {
        show(previous.pointer, previous.section)
        advancedRule.value = previous.rule
      }
    }

    function close() {
      inspecting.value = false
    }

    function restoreFocus() {
      ;(trigger?.isConnected ? trigger : builderRoot.value)?.focus({
        preventScroll: true,
      })
      trigger = undefined
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
      const currentPath = location.value
      const pathLabel = currentPath.data
        ? jsonPointer(currentPath.data.map((part) => part ?? '*')) || '/'
        : currentPath.pointer
      const directBindings = usages.value.get(currentPath.pointer) ?? []
      const extension =
        props.tree || (props.builder && inspecting.value)
          ? slots.inspector?.({
              path: currentPath.data ?? referencedDataPath(),
              pointer: currentPath.pointer,
              close,
              objects: locations.value.flatMap(({ data, path }) => {
                if (!data) return []
                const schema = valueAt(props.modelValue, path)
                return isJsonObject(schema) &&
                  (schema.type === 'object' ||
                    (Array.isArray(schema.type) &&
                      schema.type.includes('object')))
                  ? [data]
                  : []
              }),
            })
          : undefined
      const references = (keyword?: string) => [
        (keyword === undefined || keyword === '$dynamicRef') &&
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
        (keyword === undefined || keyword === '$ref') &&
        refTarget !== undefined &&
        locations.value.some(({ pointer }) => pointer === refTarget)
          ? button(
              ['Open reference', 'Ouvrir la référence', 'Abrir referencia'],
              () => select(refTarget),
            )
          : null,
      ]
      const typeLabel = (type: string) =>
        types.includes(type as keyof typeof typeNames)
          ? t(typeNames[type as keyof typeof typeNames])
          : type
      const bindingRows = () =>
        directBindings.map(({ componentId, property, types }) => {
          const component = props.componentLabel?.(componentId)
          return h(
            'div',
            {
              key: componentId + property,
              class: props.builder
                ? 'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2.5'
                : 'flex flex-wrap items-center gap-2 text-sm',
            },
            [
              h('div', { class: 'min-w-0' }, [
                h(
                  'span',
                  { class: 'font-medium break-words' },
                  component ?? componentId,
                ),
                h(
                  'div',
                  { class: 'text-xs break-words text-muted-foreground' },
                  property + ' · ' + types.map(typeLabel).join(' / '),
                ),
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
        })
      const schemaFormLabel = t([
        'Schema form',
        'Forme du schéma',
        'Forma del esquema',
      ])
      const schemaForm = () =>
        currentPath.path.length
          ? label(
              schemaFormLabel,
              h(
                'select',
                {
                  'aria-label': schemaFormLabel,
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
                        currentPath.path,
                        next === 'object' ? {} : next === 'true',
                      ) as Model,
                    )
                  },
                },
                [
                  h(
                    'option',
                    { value: 'object' },
                    props.builder
                      ? t([
                          'Schema with rules',
                          'Schéma avec règles',
                          'Esquema con reglas',
                        ])
                      : t(typeNames.object),
                  ),
                  h(
                    'option',
                    { value: 'true' },
                    t([
                      'Accepts every value',
                      'Accepte toute valeur',
                      'Acepta cualquier valor',
                    ]),
                  ),
                  h(
                    'option',
                    { value: 'false' },
                    t([
                      'Rejects every value',
                      'Refuse toute valeur',
                      'Rechaza cualquier valor',
                    ]),
                  ),
                ],
              ),
            )
          : null
      const typeControls = () =>
        h(
          'div',
          { class: 'flex flex-wrap gap-3' },
          types.map((type) =>
            h('label', { class: 'flex items-center gap-1.5 text-sm' }, [
              h('input', {
                type: 'checkbox',
                checked: selectedTypes.includes(type),
                onChange: (event: Event) => {
                  const next = (event.target as HTMLInputElement).checked
                    ? [...selectedTypes, type]
                    : selectedTypes.filter((item) => item !== type)
                  edit('type', next.length > 1 ? next : next[0])
                },
              }),
              typeLabel(type),
            ]),
          ),
        )
      const allowedValuesLabel: Message = [
        'Allowed values',
        'Valeurs autorisées',
        'Valores permitidos',
      ]
      const allowedValues = (showHeading = true) =>
        list('enum', allowedValuesLabel, showHeading)
      const constant = () =>
        optionalValue('const', ['Constant', 'Constante', 'Constante'])
      const visibility = () =>
        h(
          'div',
          { class: 'grid gap-3 sm:grid-cols-3' },
          ['readOnly', 'writeOnly', 'deprecated'].map(flag),
        )
      const titles = () => [
        annotation('title', ['Title', 'Titre', 'Título']),
        annotation(
          'description',
          ['Description', 'Description', 'Descripción'],
          { rows: 3 },
        ),
      ]
      const suggestedValues = () => [
        optionalValue('default', [
          'Default value',
          'Valeur par défaut',
          'Valor predeterminado',
        ]),
        ...list('examples', ['Examples', 'Exemples', 'Ejemplos']),
      ]
      const numberKeys = [
        'minimum',
        'maximum',
        'exclusiveMinimum',
        'exclusiveMaximum',
        'multipleOf',
      ]
      const stringRules = () => [
        numberControls(['minLength', 'maxLength']),
        annotation(
          'format',
          ['Format', 'Format', 'Formato'],
          props.builder
            ? { list: id + '-formats', placeholder: 'email, date…' }
            : {},
        ),
        props.builder
          ? h(
              'datalist',
              { id: id + '-formats' },
              [
                'email',
                'uri',
                'date',
                'date-time',
                'time',
                'uuid',
                'hostname',
                'ipv4',
                'ipv6',
              ].map((format) => h('option', { value: format })),
            )
          : h(
              'p',
              { class: 'text-sm text-muted-foreground' },
              t([
                'Format describes a string. Formivue validates registered formats by default.',
                'Le format décrit une chaîne. Formivue valide les formats enregistrés par défaut.',
                'El formato describe una cadena. Formivue valida por defecto los formatos registrados.',
              ]),
            ),
        annotation(
          'pattern',
          ['Regular expression', 'Expression régulière', 'Expresión regular'],
          props.builder
            ? { placeholder: '^…$', class: control + ' font-mono' }
            : {},
        ),
        typeof current.pattern === 'string'
          ? label(
              t(['Pattern sample', 'Exemple à tester', 'Ejemplo para probar']),
              h('input', {
                id: id + '-sample',
                class: control,
                value: example.value ?? '',
                'aria-describedby': patternResult.value
                  ? id + '-result'
                  : undefined,
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
      ]
      const objectRules = () => [
        rules.named('properties'),
        rules.required(),
        rules.named('patternProperties'),
        rules.child('additionalProperties'),
        rules.child('propertyNames'),
        rules.dependencies(),
        rules.named('dependentSchemas'),
        rules.child('unevaluatedProperties'),
      ]
      const arrayRules = () => [
        rules.child('items'),
        rules.branches('prefixItems'),
        rules.child('contains'),
        numberControls(['minContains', 'maxContains']),
        rules.child('unevaluatedItems'),
      ]
      const useDialect = () =>
        button(
          [
            'Use 2020-12 dialect',
            'Utiliser le dialecte 2020-12',
            'Usar el dialecto 2020-12',
          ],
          () => edit('$schema', draft2020),
        )
      const groups: Record<Family, () => VNodeChild[]> = {
        types: () => [typeControls(), ...allowedValues(), constant()],
        numbers: () => [numberControls(numberKeys)],
        strings: stringRules,
        objects: () => [
          numberControls(['minProperties', 'maxProperties']),
          ...objectRules(),
        ],
        arrays: () => [
          numberControls(['minItems', 'maxItems']),
          flag('uniqueItems'),
          ...arrayRules(),
        ],
        combinations: () => [
          ...['allOf', 'anyOf', 'oneOf'].map(rules.branches),
          ...['not', 'if', 'then', 'else'].map(rules.child),
        ],
        content: () => [
          annotation('contentEncoding', labels.contentEncoding),
          annotation('contentMediaType', labels.contentMediaType),
          rules.child('contentSchema'),
        ],
        resources: () => [
          ...resources
            .filter((keyword) => keyword !== '$schema' || resourceRoot)
            .map((keyword) => annotation(keyword, labels[keyword])),
          resourceRoot && useDialect(),
          rules.named('$defs'),
          resourceRoot && rules.vocabulary(),
        ],
        annotations: () => [...titles(), visibility(), ...suggestedValues()],
      }
      const feedback = () =>
        localError.value
          ? h(
              'p',
              { role: 'alert', class: 'text-sm text-destructive' },
              localError.value,
            )
          : null
      const isRuleSchema = isJsonObject(node.value)
      if (props.builder) {
        const advancedEditor = (keyword: string): VNodeChild => {
          switch (keyword) {
            case 'schema-settings':
              return [schemaForm(), isRuleSchema ? typeControls() : null]
            case 'required':
              return rules.required()
            case 'dependentRequired':
              return rules.dependencies()
            case '$vocabulary':
              return rules.vocabulary()
            case 'minContains':
            case 'maxContains':
              return numberControls([keyword])
            case '$schema':
              return [
                annotation(keyword, labels[keyword]),
                resourceRoot ? h('div', [useDialect()]) : null,
              ]
            case '$ref':
            case '$dynamicRef':
              return [
                annotation(keyword, labels[keyword]),
                h('div', references(keyword)),
              ]
          }
          if (schemaMaps.some((key) => key === keyword))
            return rules.named(keyword)
          if (schemaLists.some((key) => key === keyword))
            return rules.branches(keyword)
          if (schemaChildren.some((key) => key === keyword))
            return rules.child(keyword)
          return annotation(keyword, labels[keyword])
        }
        const parentPath = currentPath.path.slice(0, -2)
        const key = currentPath.path[currentPath.path.length - 1]
        const parent =
          currentPath.path[currentPath.path.length - 2] === 'properties' &&
          locations.value.some(
            ({ pointer }) => pointer === jsonPointer(parentPath),
          )
            ? valueAt(props.modelValue, parentPath)
            : undefined
        const requiredControl = () =>
          isJsonObject(parent)
            ? h(
                'label',
                {
                  class:
                    'flex items-center gap-2.5 rounded-lg border bg-background px-4 py-3 font-medium',
                },
                [
                  h('input', {
                    type: 'checkbox',
                    checked:
                      Array.isArray(parent.required) &&
                      parent.required.includes(key),
                    onChange: (event: Event) => {
                      const next = copyJson(props.modelValue) as Model
                      setRequiredProperty(
                        valueAt(next, parentPath) as Model,
                        key,
                        (event.target as HTMLInputElement).checked,
                      )
                      emit('update:modelValue', next)
                    },
                  }),
                  t([
                    'Required field',
                    'Champ obligatoire',
                    'Campo obligatorio',
                  ]),
                ],
              )
            : null
        const card = (title: Message, children: VNodeChild[]) =>
          h(
            'section',
            { class: 'grid min-w-0 gap-3 rounded-lg border bg-background p-4' },
            [
              h('h3', { class: 'text-sm font-semibold' }, t(title)),
              ...children,
            ],
          )
        const disclosure = (title: Message, render: () => VNodeChild[]) =>
          h('details', { class: 'min-w-0 rounded-lg border bg-background' }, [
            h(
              'summary',
              {
                class:
                  'cursor-pointer px-4 py-3 font-medium hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring',
              },
              t(title),
            ),
            h('div', { class: 'grid min-w-0 gap-3 border-t p-4' }, render()),
          ])
        const validation = () => {
          if (!isRuleSchema)
            return [
              requiredControl(),
              h(
                'p',
                { class: 'rounded-lg border bg-muted/40 p-4' },
                node.value
                  ? t([
                      'This schema accepts every value.',
                      'Ce schéma accepte toute valeur.',
                      'Este esquema acepta cualquier valor.',
                    ])
                  : t([
                      'This schema rejects every value.',
                      'Ce schéma refuse toute valeur.',
                      'Este esquema rechaza cualquier valor.',
                    ]),
              ),
            ]
          const showRules = (types: string[], keys: string[]) =>
            types.some((type) => selectedTypes.includes(type)) ||
            keys.some((key) =>
              Object.prototype.hasOwnProperty.call(current, key),
            )
          return [
            feedback(),
            requiredControl(),
            ...references(),
            showRules(
              ['string'],
              ['minLength', 'maxLength', 'pattern', 'format'],
            )
              ? card(
                  ['Text rules', 'Règles de texte', 'Reglas de texto'],
                  stringRules(),
                )
              : null,
            showRules(['number', 'integer'], numberKeys)
              ? card(
                  ['Number limits', 'Limites numériques', 'Límites numéricos'],
                  [
                    numberControls(['minimum', 'maximum']),
                    disclosure(
                      [
                        'Exclusive limits and multiples',
                        'Limites exclusives et multiples',
                        'Límites exclusivos y múltiplos',
                      ],
                      () => [
                        numberControls([
                          'exclusiveMinimum',
                          'exclusiveMaximum',
                          'multipleOf',
                        ]),
                      ],
                    ),
                  ],
                )
              : null,
            showRules(['array'], ['minItems', 'maxItems', 'uniqueItems'])
              ? card(
                  ['List size', 'Taille de la liste', 'Tamaño de la lista'],
                  [
                    numberControls(['minItems', 'maxItems']),
                    flag('uniqueItems'),
                  ],
                )
              : null,
            showRules(['object'], ['minProperties', 'maxProperties'])
              ? card(
                  ['Object size', 'Taille de l’objet', 'Tamaño del objeto'],
                  [numberControls(['minProperties', 'maxProperties'])],
                )
              : null,
            card(allowedValuesLabel, [
              ...allowedValues(false),
              h('div', { class: 'border-t pt-3' }, [constant()]),
            ]),
          ]
        }
        const title =
          directBindings
            .map(({ componentId }) => props.componentLabel?.(componentId))
            .find(Boolean) ||
          (typeof current.title === 'string' && current.title) ||
          (currentPath.path.length
            ? currentPath.path[currentPath.path.length - 1]
            : t(['Root schema', 'Schéma racine', 'Esquema raíz']))
        return h(
          'div',
          {
            ref: builderRoot,
            tabindex: -1,
            class: 'grid min-w-0 content-start',
          },
          [
            h(SchemaBuilder, {
              modelValue: props.modelValue,
              t,
              selected: inspecting.value ? currentPath.pointer : undefined,
              linked: linked.value,
              componentLabel: (pointer) =>
                usages.value
                  .get(pointer)
                  ?.map(({ componentId }) =>
                    props.componentLabel?.(componentId),
                  )
                  .find(Boolean),
              onInspect: openInspector,
              'onUpdate:modelValue': (value) =>
                emit('update:modelValue', value),
            }),
            h(
              FieldSettings,
              {
                open: inspecting.value,
                title,
                path: pathLabel,
                typeLabel: selectedTypes.map(typeLabel).join(' / '),
                section: section.value,
                hasBindings:
                  !!directBindings.length ||
                  !!extension?.some((node) => node.type !== Comment),
                back: history.value.length ? back : undefined,
                restoreFocus,
                t,
                onClose: close,
                'onUpdate:section': (value) => {
                  section.value = value
                },
              },
              {
                validation,
                general: () =>
                  isRuleSchema
                    ? [
                        feedback(),
                        card(
                          [
                            'Field details',
                            'Détails du champ',
                            'Detalles del campo',
                          ],
                          titles(),
                        ),
                        card(
                          [
                            'Access and lifecycle',
                            'Accès et cycle de vie',
                            'Acceso y ciclo de vida',
                          ],
                          [visibility()],
                        ),
                        card(
                          [
                            'Defaults and examples',
                            'Valeur par défaut et exemples',
                            'Valor predeterminado y ejemplos',
                          ],
                          suggestedValues(),
                        ),
                      ]
                    : [schemaForm()],
                bindings: () => [
                  directBindings.length
                    ? card(
                        [
                          'Canvas components',
                          'Composants du canevas',
                          'Componentes del lienzo',
                        ],
                        bindingRows(),
                      )
                    : null,
                  extension,
                ],
                advanced: () => [
                  feedback(),
                  h(
                    AdvancedRules,
                    {
                      key: currentPath.pointer,
                      schema: isRuleSchema ? current : undefined,
                      resourceRoot,
                      active: advancedRule.value,
                      'onUpdate:active': (keyword?: string) => {
                        advancedRule.value = keyword
                      },
                      t,
                    },
                    {
                      default: ({ keyword }: { keyword: string }) =>
                        advancedEditor(keyword),
                    },
                  ),
                ],
              },
            ),
          ],
        )
      }
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
                        onClick: close,
                      },
                      t([
                        'Schema tree',
                        'Arbre du schéma',
                        'Árbol del esquema',
                      ]),
                    ),
                    h('h3', { class: 'font-semibold break-all' }, pathLabel),
                  ],
                )
              : label(
                  t(['Schema node', 'Nœud du schéma', 'Nodo del esquema']),
                  h(
                    'select',
                    {
                      class: control,
                      value: currentPath.pointer,
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
            ...references(),
          ]),
          props.tree
            ? h('div', { class: 'grid gap-2' }, [...bindingRows(), extension])
            : null,
          schemaForm(),
          props.tree && isRuleSchema
            ? h(
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
                    const select = event.target as HTMLSelectElement
                    const target = document.getElementById(
                      id + '-' + select.value,
                    )
                    select.value = ''
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
              )
            : null,
          feedback(),
          isRuleSchema
            ? h(
                'div',
                { class: 'grid gap-3 xl:grid-cols-2' },
                (Object.keys(families) as Family[])
                  .filter((family) => enabledFamilies[family])
                  .map((family) => group(family, groups[family]())),
              )
            : h('p', { class: 'text-sm' }, String(node.value)),
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
