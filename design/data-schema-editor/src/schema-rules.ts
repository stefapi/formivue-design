import {
  isJsonObject,
  jsonPointer,
  copyJson,
  type JsonValue,
} from '@formivue/json-schema'
import { Button } from '@formivue-design/vue-ui'
import { h, reactive, useId, type VNodeChild } from 'vue'
import { labels, type Message } from './keywords'

interface RuleEditor {
  current: () => Record<string, unknown>
  path: () => string[]
  edit: (keyword: string, value?: unknown) => void
  select: (pointer: string) => void
  t: (message: Message) => string
  control: string
  inline?: boolean
}

const own = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key)
const removable = ['Remove', 'Retirer', 'Quitar'] as const
const addable = ['Add', 'Ajouter', 'Añadir'] as const
const open = ['Open', 'Ouvrir', 'Abrir'] as const
const nameOf = ['Name', 'Nom', 'Nombre'] as const

export function setRequiredProperty(
  parent: Record<string, unknown>,
  name: string,
  checked: boolean,
) {
  const names = Array.isArray(parent.required) ? parent.required : []
  const next = checked
    ? [...new Set([...names, name])]
    : names.filter((entry) => entry !== name)
  if (next.length) parent.required = next
  else delete parent.required
}

export function createRuleControls({
  current,
  path,
  edit,
  select,
  t,
  control,
  inline,
}: RuleEditor) {
  const names = reactive<Record<string, string>>({})
  const propertyListId = useId() + '-property-names'
  function button(
    label: string,
    action: () => void,
    disabled = false,
    attrs = {},
  ) {
    return h(
      Button,
      { size: 'small', onClick: action, disabled, ...attrs },
      () => label,
    )
  }
  const form = (keyword: string, contents: VNodeChild[]) =>
    inline
      ? h(
          'div',
          { 'data-schema-keyword': keyword, class: 'grid min-w-0 gap-2' },
          contents,
        )
      : h(
          'fieldset',
          {
            'data-schema-keyword': keyword,
            class: 'grid min-w-0 gap-2 rounded border p-2',
          },
          [
            h(
              'legend',
              { class: 'px-1 text-sm' },
              `${t(labels[keyword])} · ${keyword}`,
            ),
            ...contents,
          ],
        )
  const linked = (keyword: string, segments: string[], label: string) =>
    button(
      label,
      () => select(jsonPointer([...path(), keyword, ...segments])),
      false,
      { 'data-open-schema': segments.join('/') },
    )
  const remove = (label: string, action: () => void) =>
    button(
      inline ? t(removable) : t(removable) + ' · ' + label,
      action,
      false,
      {
        'data-remove-schema': label,
        ...(inline
          ? {
              'aria-label': t(removable) + ' · ' + label,
              variant: 'ghost',
              class: 'text-destructive hover:text-destructive',
            }
          : {}),
      },
    )
  const nameInput = (
    key: string,
    label: string,
    add: (value: string) => void,
    unavailable: (value: string) => boolean,
    suggestProperties = false,
  ) => {
    const name = names[key] ?? ''
    const commit = () => {
      if (unavailable(name)) return
      add(name)
      names[key] = ''
    }
    return h(
      'div',
      { class: 'flex min-w-0 flex-wrap items-center gap-2', key },
      [
        h('input', {
          class: control,
          'aria-label': label,
          placeholder: label,
          list: inline && suggestProperties ? propertyListId : undefined,
          value: name,
          onInput: (event: Event) => {
            names[key] = (event.target as HTMLInputElement).value
          },
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
          },
        }),
        button(t(addable), commit, unavailable(name), {
          'data-add-schema': key,
        }),
      ],
    )
  }
  const mapOf = (keyword: string) => {
    const value = current()[keyword]
    return isJsonObject(value) ? value : {}
  }
  const entries = (keyword: string) => Object.entries(mapOf(keyword))
  const setMap = (keyword: string, name: string, value?: JsonValue) => {
    const map = { ...mapOf(keyword) }
    if (value === undefined) delete map[name]
    else
      Object.defineProperty(map, name, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    edit(keyword, Object.keys(map).length ? map : undefined)
  }
  const join = (contents: VNodeChild[]) =>
    h(
      'div',
      {
        class: [
          'flex min-w-0 flex-wrap items-center gap-2',
          inline && 'rounded-md border p-2',
        ],
      },
      contents,
    )
  const namedLabels: Record<string, Message> = {
    properties: [
      'Property name',
      'Nom de la propriété',
      'Nombre de la propiedad',
    ],
    patternProperties: [
      'Property name pattern',
      'Motif du nom de propriété',
      'Patrón del nombre de propiedad',
    ],
    dependentSchemas: [
      'Trigger property',
      'Propriété déclencheuse',
      'Propiedad desencadenante',
    ],
    $defs: [
      'Definition name',
      'Nom de la définition',
      'Nombre de la definición',
    ],
  }
  const named = (keyword: string) =>
    form(keyword, [
      ...entries(keyword).map(([name]) =>
        join([
          linked(keyword, [name], name || '""'),
          remove(name, () => setMap(keyword, name)),
        ]),
      ),
      nameInput(
        keyword,
        t(inline ? (namedLabels[keyword] ?? nameOf) : nameOf),
        (name) => {
          setMap(keyword, name, {})
          select(jsonPointer([...path(), keyword, name]))
        },
        (name) => own(mapOf(keyword), name),
      ),
    ])
  const child = (keyword: string) => {
    const schema = current()[keyword]
    if (inline) {
      const selected =
        schema === undefined
          ? ''
          : typeof schema === 'boolean'
            ? String(schema)
            : 'schema'
      return form(keyword, [
        h('label', { class: 'grid gap-1.5 font-medium' }, [
          t([
            'Subschema behavior',
            'Comportement du sous-schéma',
            'Comportamiento del subesquema',
          ]),
          h(
            'select',
            {
              class: control,
              value: selected,
              onChange: (event: Event) => {
                const value = (event.target as HTMLSelectElement).value
                edit(
                  keyword,
                  value === 'schema'
                    ? {}
                    : value
                      ? value === 'true'
                      : undefined,
                )
              },
            },
            [
              h(
                'option',
                { value: '' },
                t(['No rule', 'Aucune règle', 'Sin regla']),
              ),
              h(
                'option',
                { value: 'true' },
                t(['Accept everything', 'Tout accepter', 'Aceptar todo']),
              ),
              h(
                'option',
                { value: 'false' },
                t(['Reject everything', 'Tout refuser', 'Rechazar todo']),
              ),
              h(
                'option',
                { value: 'schema' },
                t([
                  'Use a subschema',
                  'Utiliser un sous-schéma',
                  'Usar un subesquema',
                ]),
              ),
            ],
          ),
        ]),
        selected === 'schema'
          ? h('div', [
              linked(
                keyword,
                [],
                t([
                  'Edit subschema',
                  'Modifier le sous-schéma',
                  'Editar subesquema',
                ]),
              ),
            ])
          : null,
      ])
    }
    return form(keyword, [
      current()[keyword] === undefined
        ? button(
            t(addable),
            () => {
              edit(keyword, {})
              select(jsonPointer([...path(), keyword]))
            },
            false,
            { 'data-add-schema': keyword },
          )
        : join([
            linked(keyword, [], t(open)),
            remove(keyword, () => edit(keyword)),
          ]),
    ])
  }
  const branches = (keyword: string) => {
    const existing = current()[keyword]
    const list = Array.isArray(existing) ? (existing as JsonValue[]) : []
    const ordered = keyword === 'prefixItems'
    return form(keyword, [
      ...list.map((_, index) => {
        const label = inline
          ? `${t(ordered ? ['Position', 'Position', 'Posición'] : ['Branch', 'Branche', 'Rama'])} ${index + 1}`
          : String(index + 1)
        const swap = (next: number) => {
          const reordered = [...list]
          ;[reordered[index], reordered[next]] = [
            reordered[next],
            reordered[index],
          ]
          edit(keyword, reordered)
        }
        return join([
          linked(keyword, [String(index)], label),
          button('↑', () => swap(index - 1), index === 0, {
            'aria-label': t(['Move up', 'Monter', 'Subir']) + ' · ' + label,
          }),
          button('↓', () => swap(index + 1), index === list.length - 1, {
            'aria-label':
              t(['Move down', 'Descendre', 'Bajar']) + ' · ' + label,
          }),
          remove(label, () => {
            const next = list.filter((_, i) => i !== index)
            edit(keyword, next.length ? next : undefined)
          }),
        ])
      }),
      button(
        inline
          ? t(
              ordered
                ? ['Add position', 'Ajouter une position', 'Añadir posición']
                : ['Add branch', 'Ajouter une branche', 'Añadir rama'],
            )
          : t(addable),
        () => {
          edit(keyword, [...list, {}])
          select(jsonPointer([...path(), keyword, String(list.length)]))
        },
        false,
        { 'data-add-schema': keyword },
      ),
    ])
  }
  const namesList = (
    key: string,
    value: unknown,
    change: (names: string[]) => void,
  ) => {
    const existing = Array.isArray(value) ? (value as string[]) : []
    return [
      ...existing.map((name) =>
        remove(name, () => change(existing.filter((key) => key !== name))),
      ),
      nameInput(
        key,
        t(nameOf),
        (name) => change([...existing, name]),
        (name) => existing.includes(name),
        true,
      ),
    ]
  }
  const propertySuggestions = () =>
    inline
      ? h(
          'datalist',
          { id: propertyListId },
          Object.keys(mapOf('properties')).map((name) =>
            h('option', { value: name }),
          ),
        )
      : null
  const required = () =>
    form('required', [
      propertySuggestions(),
      ...namesList('required', current().required, (next) =>
        edit('required', next.length ? next : undefined),
      ),
    ])
  const dependencies = () =>
    form('dependentRequired', [
      propertySuggestions(),
      ...entries('dependentRequired').map(([name, deps]) =>
        h('div', { class: 'grid gap-2 rounded border p-2' }, [
          join([
            h('span', name || '""'),
            remove(name, () => setMap('dependentRequired', name)),
          ]),
          ...namesList('dependentRequired/' + name, deps, (next) =>
            setMap('dependentRequired', name, next),
          ),
        ]),
      ),
      nameInput(
        'dependentRequired',
        t([
          'Trigger property',
          'Propriété déclencheuse',
          'Propiedad desencadenante',
        ]),
        (name) => setMap('dependentRequired', name, []),
        (name) => own(mapOf('dependentRequired'), name),
        true,
      ),
    ])
  const vocabulary = () =>
    form('$vocabulary', [
      ...entries('$vocabulary').map(([key, value]) =>
        join([
          h('span', { class: 'break-all' }, key),
          h('label', { class: 'flex items-center gap-1 text-sm' }, [
            h('input', {
              type: 'checkbox',
              checked: value === true,
              onChange: (event: Event) =>
                setMap(
                  '$vocabulary',
                  key,
                  (event.target as HTMLInputElement).checked,
                ),
            }),
            t([
              'Required vocabulary',
              'Vocabulaire requis',
              'Vocabulario requerido',
            ]),
          ]),
          remove(key, () => setMap('$vocabulary', key)),
        ]),
      ),
      nameInput(
        '$vocabulary',
        t(['Vocabulary URI', 'URI du vocabulaire', 'URI del vocabulario']),
        (name) => setMap('$vocabulary', name, true),
        (name) => !name || own(mapOf('$vocabulary'), name),
      ),
    ])
  return { named, child, branches, required, dependencies, vocabulary }
}

/** Allows replacing a nested object schema with a Boolean schema. */
export function replaceSubschema(
  root: object,
  path: string[],
  schema: boolean | object,
) {
  const next = copyJson(root)
  let target = next
  for (const segment of path.slice(0, -1)) target = target[segment]
  target[path[path.length - 1]] = schema
  return next
}
