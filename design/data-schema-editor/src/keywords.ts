export type Message = readonly [string, string, string]

export const typeNames = {
  object: ['Object', 'Objet', 'Objeto'],
  array: ['Array', 'Tableau', 'Lista'],
  string: ['String', 'Chaîne', 'Cadena'],
  integer: ['Integer', 'Entier', 'Entero'],
  number: ['Number', 'Nombre', 'Número'],
  boolean: ['Boolean', 'Booléen', 'Booleano'],
  null: ['Null', 'Nul', 'Nulo'],
} satisfies Record<string, Message>

export const types = Object.keys(typeNames) as (keyof typeof typeNames)[]

export const schemaMaps = [
  'properties',
  'patternProperties',
  'dependentSchemas',
  '$defs',
] as const
export const schemaLists = ['prefixItems', 'allOf', 'anyOf', 'oneOf'] as const
export const schemaChildren = [
  'items',
  'contains',
  'unevaluatedItems',
  'additionalProperties',
  'propertyNames',
  'unevaluatedProperties',
  'not',
  'if',
  'then',
  'else',
  'contentSchema',
] as const
export const resources = [
  '$schema',
  '$id',
  '$comment',
  '$ref',
  '$anchor',
  '$dynamicRef',
  '$dynamicAnchor',
] as const

export const labels: Record<string, Message> = {
  properties: ['Properties', 'Propriétés', 'Propiedades'],
  required: [
    'Required properties',
    'Propriétés obligatoires',
    'Propiedades obligatorias',
  ],
  dependentRequired: [
    'Required dependencies',
    'Dépendances obligatoires',
    'Dependencias obligatorias',
  ],
  patternProperties: [
    'Properties by pattern',
    'Propriétés par motif',
    'Propiedades por patrón',
  ],
  dependentSchemas: [
    'Dependent schemas',
    'Schémas dépendants',
    'Esquemas dependientes',
  ],
  additionalProperties: [
    'Additional properties',
    'Propriétés supplémentaires',
    'Propiedades adicionales',
  ],
  propertyNames: [
    'Property names',
    'Noms des propriétés',
    'Nombres de propiedades',
  ],
  unevaluatedProperties: [
    'Unevaluated properties',
    'Propriétés non évaluées',
    'Propiedades no evaluadas',
  ],
  items: ['Item schema', 'Schéma des éléments', 'Esquema de elementos'],
  prefixItems: ['Tuple positions', 'Positions du tuple', 'Posiciones de tupla'],
  contains: [
    'Matching elements',
    'Éléments correspondants',
    'Elementos coincidentes',
  ],
  minContains: [
    'Minimum matching elements',
    'Minimum d’éléments correspondants',
    'Mínimo de elementos coincidentes',
  ],
  maxContains: [
    'Maximum matching elements',
    'Maximum d’éléments correspondants',
    'Máximo de elementos coincidentes',
  ],
  unevaluatedItems: [
    'Unevaluated elements',
    'Éléments non évalués',
    'Elementos no evaluados',
  ],
  allOf: ['All branches', 'Toutes les branches', 'Todas las ramas'],
  anyOf: ['Any branch', 'Au moins une branche', 'Alguna rama'],
  oneOf: ['Exactly one branch', 'Une seule branche', 'Una sola rama'],
  not: ['Excluded schema', 'Schéma exclu', 'Esquema excluido'],
  if: ['Condition', 'Condition', 'Condición'],
  then: [
    'When the condition matches',
    'Si la condition est vraie',
    'Cuando se cumple la condición',
  ],
  else: ['Otherwise', 'Sinon', 'En caso contrario'],
  contentEncoding: [
    'Content encoding',
    'Encodage du contenu',
    'Codificación del contenido',
  ],
  contentMediaType: [
    'Content media type',
    'Type de média du contenu',
    'Tipo de medio del contenido',
  ],
  contentSchema: [
    'Content schema',
    'Schéma du contenu',
    'Esquema del contenido',
  ],
  $schema: ['Dialect URI', 'URI du dialecte', 'URI del dialecto'],
  $id: ['Resource URI', 'URI de la ressource', 'URI del recurso'],
  $comment: [
    'Schema comment',
    'Commentaire du schéma',
    'Comentario del esquema',
  ],
  $defs: ['Definitions', 'Définitions', 'Definiciones'],
  $ref: ['Reference', 'Référence', 'Referencia'],
  $anchor: ['Anchor', 'Ancre', 'Ancla'],
  $dynamicRef: [
    'Dynamic reference',
    'Référence dynamique',
    'Referencia dinámica',
  ],
  $dynamicAnchor: ['Dynamic anchor', 'Ancre dynamique', 'Ancla dinámica'],
  $vocabulary: ['Vocabularies', 'Vocabulaires', 'Vocabularios'],
}

export const draft2020 = 'https://json-schema.org/draft/2020-12/schema'
