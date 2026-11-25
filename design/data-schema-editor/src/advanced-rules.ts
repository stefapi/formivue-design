import { Button } from '@formivue-design/vue-ui'
import { isJsonObject } from '@formivue/json-schema'
import {
  defineComponent,
  h,
  nextTick,
  ref,
  useId,
  watch,
  type PropType,
} from 'vue'
import { labels, resources, schemaChildren, type Message } from './keywords'

const groups = [
  {
    title: ['Objects', 'Objets', 'Objetos'],
    keys: [
      'properties',
      'required',
      'additionalProperties',
      'patternProperties',
      'propertyNames',
      'dependentRequired',
      'dependentSchemas',
      'unevaluatedProperties',
    ],
  },
  {
    title: ['Arrays', 'Tableaux', 'Listas'],
    keys: [
      'items',
      'prefixItems',
      'contains',
      'minContains',
      'maxContains',
      'unevaluatedItems',
    ],
  },
  {
    title: [
      'Alternatives and conditions',
      'Alternatives et conditions',
      'Alternativas y condiciones',
    ],
    keys: ['oneOf', 'anyOf', 'allOf', 'not', 'if', 'then', 'else'],
  },
  {
    title: [
      'References and definitions',
      'Références et définitions',
      'Referencias y definiciones',
    ],
    keys: ['$ref', '$defs', '$anchor', '$dynamicRef', '$dynamicAnchor'],
  },
  {
    title: [
      'Resource and content',
      'Ressource et contenu',
      'Recurso y contenido',
    ],
    keys: [
      ...resources.filter((key) =>
        ['$id', '$schema', '$comment'].includes(key),
      ),
      '$vocabulary',
      'contentMediaType',
      'contentEncoding',
      'contentSchema',
    ],
  },
] satisfies { title: Message; keys: string[] }[]

const schemaSettings: Message = [
  'Schema form and types',
  'Forme du schéma et types',
  'Forma del esquema y tipos',
]
const searchLabel: Message = [
  'Find a rule',
  'Rechercher une règle',
  'Buscar una regla',
]
const descriptions: Record<string, Message> = {
  additionalProperties: [
    'Allow, reject or validate properties beyond the declared names and patterns.',
    'Autorisez, refusez ou validez les propriétés absentes des noms et motifs déclarés.',
    'Permite, rechaza o valida propiedades fuera de los nombres y patrones declarados.',
  ],
  required: [
    'List the property names that must be present in this object.',
    'Indiquez les noms des propriétés qui doivent être présentes dans cet objet.',
    'Indica los nombres de las propiedades que deben estar presentes en este objeto.',
  ],
  dependentRequired: [
    'Require other properties when a specific property is present.',
    'Rendez d’autres propriétés obligatoires lorsqu’une propriété précise est présente.',
    'Exige otras propiedades cuando está presente una propiedad concreta.',
  ],
  items: [
    'Validate array elements. If positions are defined separately, this rule applies to the remaining elements.',
    'Validez les éléments du tableau. Si des positions sont définies séparément, la règle s’applique aux éléments restants.',
    'Valida los elementos de la lista. Si hay posiciones definidas, la regla se aplica a los elementos restantes.',
  ],
  prefixItems: [
    'Assign a different schema to each starting position in the array.',
    'Attribuez un schéma différent à chaque position de départ du tableau.',
    'Asigna un esquema diferente a cada posición inicial de la lista.',
  ],
  contains: [
    'Specify what an array element must match. By default, the array needs at least one match.',
    'Définissez à quoi doit correspondre un élément du tableau. Par défaut, au moins un élément doit correspondre.',
    'Define qué debe cumplir un elemento de la lista. Por defecto, debe coincidir al menos uno.',
  ],
  oneOf: [
    'The value must match exactly one of these branches.',
    'La valeur doit correspondre à une seule de ces branches.',
    'El valor debe coincidir con exactamente una de estas ramas.',
  ],
  anyOf: [
    'The value must match at least one of these branches.',
    'La valeur doit correspondre à au moins une de ces branches.',
    'El valor debe coincidir con al menos una de estas ramas.',
  ],
  allOf: [
    'The value must match every branch.',
    'La valeur doit correspondre à toutes les branches.',
    'El valor debe coincidir con todas las ramas.',
  ],
  not: [
    'The value is rejected if it matches this subschema.',
    'La valeur est refusée si elle correspond à ce sous-schéma.',
    'El valor se rechaza si coincide con este subesquema.',
  ],
  if: [
    'Define the condition that determines whether the “then” or “else” rule applies.',
    'Définissez la condition qui détermine quelle règle s’applique, « alors » ou « sinon ».',
    'Define la condición que determina si se aplica «entonces» o «si no».',
  ],
  then: [
    'Apply this rule when the condition on the same field matches.',
    'Appliquez cette règle quand la condition du même champ est vraie.',
    'Aplica esta regla cuando se cumple la condición del mismo campo.',
  ],
  else: [
    'Apply this rule when the condition on the same field does not match.',
    'Appliquez cette règle quand la condition du même champ est fausse.',
    'Aplica esta regla cuando no se cumple la condición del mismo campo.',
  ],
  $ref: [
    'Reuse a schema by reference. A local definition can be addressed as #/$defs/name.',
    'Réutilisez un schéma par référence. Une définition locale peut s’écrire #/$defs/nom.',
    'Reutiliza un esquema por referencia. Una definición local se puede indicar como #/$defs/nombre.',
  ],
  $defs: [
    'Store named schemas that you can reuse through references.',
    'Stockez des schémas nommés pour les réutiliser par référence.',
    'Guarda esquemas con nombre para reutilizarlos mediante referencias.',
  ],
}
const relatedGroups = [
  ['if', 'then', 'else'],
  ['contains', 'minContains', 'maxContains'],
  ['$ref', '$defs'],
]
const own = (schema: object, key: string) =>
  Object.prototype.hasOwnProperty.call(schema, key)
const searchText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

export const AdvancedRules = defineComponent({
  props: {
    schema: { type: Object as PropType<Record<string, unknown>> },
    resourceRoot: Boolean,
    active: String,
    t: {
      type: Function as PropType<(message: Message) => string>,
      required: true,
    },
  },
  emits: ['update:active'],
  setup(props, { slots, emit }) {
    const query = ref('')
    const showAll = ref(false)
    const searchId = useId()
    const search = ref<HTMLInputElement>()
    const heading = ref<HTMLElement>()
    const root = ref<HTMLElement>()
    const t = (message: Message) => props.t(message)
    const choose = (keyword?: string) => emit('update:active', keyword)

    watch(
      () => props.active,
      (keyword, previous) => {
        void nextTick(() => {
          if (keyword) heading.value?.focus()
          else {
            const buttons = root.value?.querySelectorAll<HTMLButtonElement>(
              'button[data-advanced-rule]',
            )
            const trigger = Array.from(buttons ?? []).find(
              (button) => button.dataset.advancedRule === previous,
            )
            ;(trigger ?? search.value)?.focus()
          }
        })
      },
    )

    function summary(keyword: string) {
      const value = props.schema?.[keyword]
      if (typeof value === 'boolean')
        return value
          ? t(['Accepts everything', 'Accepte tout', 'Acepta todo'])
          : t(['Rejects everything', 'Refuse tout', 'Rechaza todo'])
      if (Array.isArray(value) || isJsonObject(value)) {
        if (schemaChildren.some((key) => key === keyword))
          return t(['Subschema', 'Sous-schéma', 'Subesquema'])
        const count = Object.keys(value).length
        return `${count} ${t(count === 1 ? ['entry', 'entrée', 'entrada'] : ['entries', 'entrées', 'entradas'])}`
      }
      return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : ''
    }

    function row(keyword: string) {
      const value = summary(keyword)
      const settings = keyword === 'schema-settings'
      return h('li', { key: keyword }, [
        h(
          'button',
          {
            type: 'button',
            'data-advanced-rule': keyword,
            class:
              'flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring',
            onClick: () => choose(keyword),
          },
          [
            h('span', { class: 'grid min-w-0 flex-1 gap-0.5' }, [
              h(
                'span',
                { class: 'font-medium' },
                t(settings ? schemaSettings : labels[keyword]),
              ),
              !settings
                ? h('code', { class: 'text-xs text-muted-foreground' }, keyword)
                : null,
            ]),
            value
              ? h(
                  'span',
                  {
                    class:
                      'max-w-[42%] truncate text-right text-xs text-muted-foreground',
                    title: value,
                  },
                  value,
                )
              : null,
            h(
              'span',
              {
                class: 'text-lg leading-none text-muted-foreground',
                'aria-hidden': 'true',
              },
              '›',
            ),
          ],
        ),
      ])
    }

    const list = (keys: string[]) =>
      h('ul', { class: 'grid min-w-0 gap-px' }, keys.map(row))
    const label = (title: Message) =>
      h(
        'h3',
        { class: 'px-3 pb-1 text-xs font-semibold text-muted-foreground' },
        t(title),
      )
    const box = (title: Message, keys: string[]) =>
      h(
        'section',
        { class: 'min-w-0 rounded-lg border bg-background px-1 pt-3 pb-1' },
        [label(title), list(keys)],
      )

    return () => {
      const schema = props.schema
      const available = (keyword: string) =>
        !!schema &&
        (props.resourceRoot ||
          !['$schema', '$vocabulary'].includes(keyword) ||
          own(schema, keyword))
      const keywords = groups.flatMap((group) => group.keys.filter(available))
      const keyword = props.active
      if (
        keyword &&
        (keyword === 'schema-settings' || keywords.includes(keyword))
      ) {
        const related =
          relatedGroups
            .find((group) => group.includes(keyword))
            ?.filter((key) => key !== keyword && available(key)) ?? []
        return h('div', { class: 'grid min-w-0 gap-4' }, [
          h(
            Button,
            {
              type: 'text',
              size: 'small',
              class: '-ml-2 justify-self-start',
              onClick: () => choose(),
            },
            () =>
              t([
                '← Back to rules',
                '← Retour aux règles',
                '← Volver a las reglas',
              ]),
          ),
          h(
            'section',
            { class: 'grid min-w-0 gap-4 rounded-lg border bg-background p-4' },
            [
              h('header', { class: 'grid gap-1' }, [
                h(
                  'h3',
                  {
                    ref: heading,
                    tabindex: -1,
                    class: 'text-base font-semibold focus:outline-none',
                  },
                  t(
                    keyword === 'schema-settings'
                      ? schemaSettings
                      : labels[keyword],
                  ),
                ),
                keyword !== 'schema-settings'
                  ? h(
                      'code',
                      { class: 'text-xs text-muted-foreground' },
                      keyword,
                    )
                  : null,
                descriptions[keyword]
                  ? h(
                      'p',
                      { class: 'mt-2 text-sm text-muted-foreground' },
                      t(descriptions[keyword]),
                    )
                  : null,
              ]),
              slots.default?.({ keyword }),
            ],
          ),
          related.length
            ? box(
                ['Related rules', 'Règles associées', 'Reglas relacionadas'],
                related,
              )
            : null,
        ])
      }

      const configured = schema
        ? keywords.filter((key) => own(schema, key))
        : []
      const schemaTypes = Array.isArray(schema?.type)
        ? schema.type
        : [schema?.type]
      const suggestions = (
        schemaTypes.includes('array')
          ? ['items', 'prefixItems', 'contains', 'oneOf']
          : schemaTypes.includes('object')
            ? ['additionalProperties', 'dependentRequired', 'oneOf', '$ref']
            : ['oneOf', 'if', '$ref', '$defs']
      ).filter((key) => available(key) && !configured.includes(key))
      const terms = searchText(query.value.trim()).split(/\s+/u).filter(Boolean)
      const exact = keywords.find((key) => searchText(key) === terms.join(' '))
      function matchesRule(key: string, title: Message) {
        if (!available(key)) return false
        if (!terms.length) return !configured.includes(key)
        if (exact) return key === exact
        const searchable = searchText(
          [
            key,
            ...labels[key],
            t(title),
            descriptions[key] ? t(descriptions[key]) : '',
          ].join(' '),
        )
        return terms.every((term) => searchable.includes(term))
      }
      const matches =
        terms.length || showAll.value
          ? groups
              .map(({ title, keys }) => ({
                title,
                keys: keys.filter((key) => matchesRule(key, title)),
              }))
              .filter(({ keys }) => keys.length)
          : []
      const results = matches.map(({ title, keys }) => box(title, keys))
      return h('div', { ref: root, class: 'grid min-w-0 gap-4' }, [
        h('div', { class: 'rounded-lg border bg-background p-1' }, [
          list(['schema-settings']),
        ]),
        !schema
          ? null
          : h('div', { class: 'grid min-w-0 gap-3' }, [
              h('div', { class: 'grid min-w-0 gap-1.5' }, [
                h(
                  'div',
                  {
                    class:
                      'flex flex-wrap items-center justify-between gap-x-2',
                  },
                  [
                    h(
                      'label',
                      { for: searchId, class: 'font-medium' },
                      t(searchLabel),
                    ),
                    !terms.length
                      ? h(
                          Button,
                          {
                            type: 'text',
                            size: 'small',
                            onClick: () => {
                              showAll.value = !showAll.value
                            },
                          },
                          () =>
                            showAll.value
                              ? t([
                                  'Show suggestions',
                                  'Afficher les suggestions',
                                  'Mostrar sugerencias',
                                ])
                              : t([
                                  'Browse all rules',
                                  'Parcourir toutes les règles',
                                  'Explorar todas las reglas',
                                ]),
                        )
                      : null,
                  ],
                ),
                h('input', {
                  id: searchId,
                  ref: search,
                  type: 'search',
                  class:
                    'h-9 min-w-0 rounded-md border border-input bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-ring',
                  value: query.value,
                  placeholder: t([
                    'For example, condition or $ref',
                    'Par exemple, condition ou $ref',
                    'Por ejemplo, condición o $ref',
                  ]),
                  onInput: (event: Event) => {
                    query.value = (event.target as HTMLInputElement).value
                  },
                  onKeydown: (event: KeyboardEvent) => {
                    if (
                      event.key === 'Enter' &&
                      terms.length &&
                      matches.length === 1 &&
                      matches[0].keys.length === 1
                    ) {
                      event.preventDefault()
                      choose(matches[0].keys[0])
                    }
                  },
                }),
              ]),
              terms.length
                ? results.length
                  ? results
                  : h(
                      'p',
                      {
                        role: 'status',
                        class:
                          'rounded-lg border bg-background p-3 text-muted-foreground',
                      },
                      t([
                        'No matching rule.',
                        'Aucune règle correspondante.',
                        'Ninguna regla coincide.',
                      ]),
                    )
                : [
                    configured.length
                      ? box(
                          [
                            'Configured rules',
                            'Règles configurées',
                            'Reglas configuradas',
                          ],
                          configured,
                        )
                      : null,
                    showAll.value
                      ? results
                      : suggestions.length
                        ? box(
                            [
                              'Suggested rules',
                              'Règles suggérées',
                              'Reglas sugeridas',
                            ],
                            suggestions,
                          )
                        : null,
                  ],
            ]),
      ])
    }
  },
})
