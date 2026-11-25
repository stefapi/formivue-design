export type Message = readonly [
  english: string,
  french: string,
  spanish: string,
]

const contractIssues: Record<string, Message> = {
  untrusted_rendering: [
    'This rendering setting requires explicitly trusted content.',
    'Ce réglage de rendu nécessite un contenu explicitement approuvé.',
    'Este ajuste de renderizado requiere contenido de confianza explícita.',
  ],
  project_archive_invalid: [
    'Invalid project archive section.',
    'Section de l’archive du projet invalide.',
    'Sección no válida del archivo del proyecto.',
  ],
  project_archive_json: [
    'The file does not contain valid JSON.',
    'Le fichier ne contient pas de JSON valide.',
    'El archivo no contiene JSON válido.',
  ],
  project_archive_version: [
    'Unsupported project archive format or version.',
    'Format ou version d’archive du projet non pris en charge.',
    'Formato o versión del archivo del proyecto no compatible.',
  ],
  removed_ui_binding: [
    'This canvas field was removed. Resolve its existing bindings.',
    'Ce champ a été supprimé du canevas. Réconciliez ses liaisons existantes.',
    'Este campo se eliminó del lienzo. Concilia sus vínculos existentes.',
  ],
  changed_ui_binding: [
    'This canvas field has an incompatible change.',
    'La modification de ce champ du canevas est incompatible.',
    'El cambio de este campo del lienzo es incompatible.',
  ],
  reconciliation_path_conflict: [
    'This field’s variant destination cannot be replayed.',
    'La destination de ce champ dans la variante ne peut pas être réappliquée.',
    'No se puede volver a aplicar el destino de este campo en la variante.',
  ],
  reconciliation_missing_parent: [
    'The current control’s layout is missing from the canvas.',
    'Le contrôle actuel a perdu son conteneur sur le canevas.',
    'El contenedor del control actual no está en el lienzo.',
  ],
  reconciliation_schema_parent: [
    'Declare the destination object or array item directly in the variant schema.',
    'Déclarez directement l’objet ou l’élément de tableau de destination dans le schéma de la variante.',
    'Declara el objeto o elemento de destino directamente en el esquema de la variante.',
  ],
  reconciliation_draft_json: [
    'Correct this draft JSON before migrating it.',
    'Corrigez ce brouillon JSON avant de le migrer.',
    'Corrige este borrador JSON antes de migrarlo.',
  ],
  reconciliation_draft_ui: [
    'The draft UI has independent edits. Reconcile them before changing the canvas version.',
    'Le brouillon UI contient des modifications indépendantes. Réconciliez-les avant de changer la version du canevas.',
    'La interfaz del borrador tiene cambios independientes. Concilia estos cambios antes de cambiar la versión del lienzo.',
  ],
  cross_record_move: [
    'The source and destination must belong to the same record',
    'La source et la destination doivent appartenir au même enregistrement',
    'El origen y el destino deben pertenecer al mismo registro',
  ],
  shared_schema_move: [
    'This object uses a schema reference',
    'Cet objet utilise une référence de schéma',
    'Este objeto utiliza una referencia de esquema',
  ],
  invalid_move_parent: [
    'The destination parent must be an object',
    'Le parent de destination doit être un objet',
    'El elemento padre del destino debe ser un objeto',
  ],
  incompatible_move_layout: [
    'The field would leave its layout or repeated row',
    'Le champ quitterait sa disposition ou sa ligne répétée',
    'El campo saldría de su disposición o fila repetida',
  ],
  incompatible_move_binding: [
    'The binding would leave its row scope',
    'La liaison sortirait de la portée de sa ligne',
    'El vínculo quedaría fuera del ámbito de su fila',
  ],
  incompatible_move_row_key: [
    'The row key must stay directly in the row',
    'La clé doit rester une propriété directe de la ligne',
    'La clave debe seguir siendo una propiedad directa de la fila',
  ],
  schema_key_collision: [
    'The destination already exists in the schema',
    'La destination existe déjà dans le schéma',
    'El destino ya existe en el esquema',
  ],
  data_key_collision: [
    'The destination conflicts with an existing value',
    'La destination entre en conflit avec une valeur existante',
    'El destino entra en conflicto con un valor existente',
  ],
  invalid_json_object: [
    'Expected a JSON object',
    'Un objet JSON est attendu',
    'Se esperaba un objeto JSON',
  ],
  missing_data_path: [
    'Data path not found',
    'Chemin de données introuvable',
    'No se encontró la ruta de datos',
  ],
  incompatible_data_type: [
    'Incompatible data type',
    'Type de données incompatible',
    'Tipo de datos incompatible',
  ],
  incompatible_binding_type: [
    'Incompatible binding type',
    'Type de liaison incompatible',
    'Tipo de vínculo incompatible',
  ],
  incompatible_column: [
    'Missing or incompatible column',
    'Colonne absente ou incompatible',
    'Columna ausente o incompatible',
  ],
  invalid_chart_filter: [
    'Incompatible chart filter',
    'Filtre de graphique incompatible',
    'Filtro de gráfico incompatible',
  ],
  incompatible_ui_option: [
    'Incompatible form option',
    'Option de formulaire incompatible',
    'Opción de formulario incompatible',
  ],
  cyclic_chart_flow: [
    'Sankey cycle',
    'Cycle dans le Sankey',
    'Ciclo en el Sankey',
  ],
  incompatible_branch_value: [
    'Incompatible branch value',
    'Valeur d’embranchement incompatible',
    'Valor de ramificación incompatible',
  ],
  duplicate_table_row_key: [
    'Duplicate row key',
    'Clé de ligne dupliquée',
    'Clave de fila duplicada',
  ],
  unmatched_variant_ui: [
    'UI does not match a project variant',
    'L’interface ne correspond à aucune variante de ce projet',
    'La interfaz no corresponde a ninguna variante de este proyecto',
  ],
  stale_rename: [
    'The draft changed. Review the change again.',
    'Le brouillon a changé. Réexaminer la modification.',
    'El borrador cambió. Revisa la modificación.',
  ],
}

const typeLabels: Record<string, Message> = {
  integer: ['an integer', 'un entier', 'un entero'],
  number: ['a number', 'un nombre', 'un número'],
  string: ['text', 'du texte', 'texto'],
  array: ['an array', 'un tableau', 'una lista'],
  boolean: ['a boolean', 'un booléen', 'un booleano'],
  object: ['an object', 'un objet', 'un objeto'],
  null: ['null', 'null', 'null'],
}

const valueRules: Record<string, Message> = {
  type: [
    'Expected {expected}',
    'Type attendu {expected}',
    'Se esperaba {expected}',
  ],
  minimum: [
    'Must be at least {expected}',
    'Minimum attendu {expected}',
    'Mínimo esperado {expected}',
  ],
  maximum: [
    'Must be at most {expected}',
    'Maximum attendu {expected}',
    'Máximo esperado {expected}',
  ],
  exclusiveMinimum: [
    'Must be greater than {expected}',
    'Doit être supérieur à {expected}',
    'Debe ser mayor que {expected}',
  ],
  exclusiveMaximum: [
    'Must be less than {expected}',
    'Doit être inférieur à {expected}',
    'Debe ser menor que {expected}',
  ],
  multipleOf: [
    'Must be a multiple of {expected}',
    'Doit être un multiple de {expected}',
    'Debe ser múltiplo de {expected}',
  ],
  minLength: [
    'At least {expected} characters expected',
    'Au moins {expected} caractères attendus',
    'Se requieren al menos {expected} caracteres',
  ],
  maxLength: [
    'At most {expected} characters allowed',
    'Au plus {expected} caractères autorisés',
    'Se permiten como máximo {expected} caracteres',
  ],
  minItems: [
    'At least {expected} items expected',
    'Au moins {expected} éléments attendus',
    'Se requieren al menos {expected} elementos',
  ],
  maxItems: [
    'At most {expected} items allowed',
    'Au plus {expected} éléments autorisés',
    'Se permiten como máximo {expected} elementos',
  ],
  minProperties: [
    'At least {expected} properties expected',
    'Au moins {expected} propriétés attendues',
    'Se requieren al menos {expected} propiedades',
  ],
  maxProperties: [
    'At most {expected} properties allowed',
    'Au plus {expected} propriétés autorisées',
    'Se permiten como máximo {expected} propiedades',
  ],
  pattern: [
    'Must match the pattern {expected}',
    'Doit respecter le motif {expected}',
    'Debe coincidir con el patrón {expected}',
  ],
  format: [
    'Must use the format {expected}',
    'Format attendu {expected}',
    'Formato esperado {expected}',
  ],
}

const structuralRules: Record<string, Message> = {
  uniqueItems: [
    'Items must be unique',
    'Les éléments doivent être uniques',
    'Los elementos deben ser únicos',
  ],
  additionalProperties: [
    'Additional property rejected',
    'Propriété supplémentaire refusée',
    'Propiedad adicional rechazada',
  ],
  unevaluatedProperties: [
    'Undeclared property rejected',
    'Propriété non déclarée refusée',
    'Propiedad no declarada rechazada',
  ],
  propertyNames: [
    'Invalid property name',
    'Nom de propriété invalide',
    'Nombre de propiedad no válido',
  ],
  oneOf: [
    'Must match exactly one alternative',
    'Doit satisfaire exactement une variante',
    'Debe cumplir exactamente una alternativa',
  ],
  anyOf: [
    'Must match at least one alternative',
    'Doit satisfaire au moins une variante',
    'Debe cumplir al menos una alternativa',
  ],
  allOf: [
    'Must match every rule in the group',
    'Doit satisfaire toutes les règles du groupe',
    'Debe cumplir todas las reglas del grupo',
  ],
  not: [
    'The value matches an excluded rule',
    'La valeur correspond à une règle d’exclusion',
    'El valor coincide con una regla de exclusión',
  ],
  'false schema': [
    'No value is allowed',
    'Aucune valeur autorisée',
    'No se permite ningún valor',
  ],
}

export function createDocumentMessages(locale: () => string = () => 'en') {
  function languageIndex() {
    const language = locale()?.toLowerCase().split('-')[0]
    return language === 'fr' ? 1 : language === 'es' ? 2 : 0
  }

  function message(text: Message, params?: Record<string, string | number>) {
    const translated = text[languageIndex()]
    return params
      ? translated.replace(/\{(\w+)\}/gu, (placeholder, key) =>
          Object.prototype.hasOwnProperty.call(params, key)
            ? String(params[key])
            : placeholder,
        )
      : translated
  }

  function displayValue(value: unknown) {
    return JSON.stringify(value) ?? message(['missing', 'absente', 'ausente'])
  }

  function conflictMessage(paths: readonly string[]) {
    return message(
      [
        'Remote updates overlap local edits: {paths}',
        'Des mises à jour distantes touchent la saisie : {paths}',
        'Las actualizaciones remotas afectan a los cambios locales: {paths}',
      ],
      { paths: paths.join(', ') },
    )
  }

  const has = (object: object, key: string) =>
    Object.prototype.hasOwnProperty.call(object, key)

  function detailedValidationMessage(
    detail: string,
    code: string | undefined,
    {
      keyword,
      expected,
      actual,
    }: { keyword: string; expected?: unknown; actual: unknown },
  ) {
    if (
      keyword === 'required' ||
      keyword === 'dependentRequired' ||
      keyword === 'dependencies'
    )
      return message([
        'This field is required. No value was entered.',
        'Champ obligatoire. Aucune valeur saisie.',
        'Campo obligatorio. No se ha introducido ningún valor.',
      ])
    const current = displayValue(actual)
    if (keyword === 'const')
      return message(
        [
          'Expected {expected}, current value {actual}.',
          'Valeur attendue {expected}, valeur actuelle {actual}.',
          'Valor esperado {expected}, valor actual {actual}.',
        ],
        { expected: displayValue(expected), actual: current },
      )
    if (keyword === 'enum' && Array.isArray(expected))
      return expected.length
        ? message(
            [
              'Current value {actual}. Allowed values: {allowed}.',
              'Valeur actuelle {actual}. Valeurs autorisées : {allowed}.',
              'Valor actual {actual}. Valores permitidos: {allowed}.',
            ],
            { actual: current, allowed: expected.map(displayValue).join(', ') },
          )
        : message(
            [
              'Current value {actual}. No value is allowed.',
              'Valeur actuelle {actual}. Aucune valeur autorisée.',
              'Valor actual {actual}. No se permite ningún valor.',
            ],
            { actual: current },
          )

    let rule = validationMessage(detail, code)
    if (has(structuralRules, keyword)) rule = message(structuralRules[keyword])
    if (expected !== undefined && has(valueRules, keyword)) {
      const label =
        keyword === 'type'
          ? (Array.isArray(expected) ? expected : [expected])
              .map((type) =>
                has(typeLabels, type)
                  ? message(typeLabels[type])
                  : String(type),
              )
              .join(' / ')
          : displayValue(expected)
      rule = message(valueRules[keyword], { expected: label })
    }
    if (keyword === 'contains' && expected && typeof expected === 'object') {
      const { minContains, maxContains, itemSchema } = expected as {
        minContains?: number
        maxContains?: number
        itemSchema?: unknown
      }
      const min = minContains ?? 1
      rule =
        maxContains === undefined
          ? message(
              [
                'At least {min} matching items expected',
                'Au moins {min} éléments correspondants attendus',
                'Se requieren al menos {min} elementos coincidentes',
              ],
              { min },
            )
          : message(
              [
                'Between {min} and {max} matching items expected',
                'Entre {min} et {max} éléments correspondants attendus',
                'Se requieren entre {min} y {max} elementos coincidentes',
              ],
              { min, max: maxContains },
            )
      if (itemSchema !== undefined)
        rule += message(
          [
            ' for the rule {schema}',
            ' pour la règle {schema}',
            ' para la regla {schema}',
          ],
          { schema: displayValue(itemSchema) },
        )
    }
    return message(
      [
        '{rule}. Current value {actual}.',
        '{rule}. Valeur actuelle {actual}.',
        '{rule}. Valor actual {actual}.',
      ],
      { rule: rule.trimEnd().replace(/[.!?]$/u, ''), actual: current },
    )
  }

  function documentError(error: unknown) {
    if (!(
      error &&
      typeof error === 'object' &&
      'issues' in error &&
      Array.isArray(error.issues)
    )) {
      return error instanceof Error ? error.message : String(error)
    }
    return error.issues
      .map(
        ({
          component,
          path,
          property,
          code,
          message: detail,
          constantMismatch,
          validationDetails,
        }) => {
          const details =
            validationDetails ??
            (constantMismatch && { keyword: 'const', ...constantMismatch })
          const explanation = details
            ? detailedValidationMessage(detail, code, details)
            : validationMessage(detail, code)
          return `${component ? component + ' ' : ''}${path || '/'}${property ? ' · ' + property : ''}: ${explanation}`
        },
      )
      .join('\n')
  }

  function validationMessage(detail: string, code?: string) {
    if (
      code &&
      Object.prototype.hasOwnProperty.call(contractIssues, code) &&
      languageIndex() !== 0
    )
      return message(contractIssues[code])
    if (/^must have required property /u.test(detail))
      return message([
        'A value is required',
        'Une valeur est obligatoire',
        'Se requiere un valor',
      ])
    if (detail === 'must be equal to one of the allowed values')
      return message([
        'Choose an allowed value',
        'Choisir une valeur autorisée',
        'Elige un valor permitido',
      ])
    const pattern = /^must match pattern (.+)$/u.exec(detail)?.[1]
    if (pattern)
      return message(
        [
          'Must match {pattern}',
          'Doit correspondre à {pattern}',
          'Debe coincidir con {pattern}',
        ],
        { pattern },
      )
    const type =
      /^must be (integer|number|string|array|boolean|object|null)$/u.exec(
        detail,
      )?.[1]
    if (type) {
      return message(
        ['Must be {type}', 'Valeur attendue : {type}', 'Se esperaba {type}'],
        { type: message(typeLabels[type]) },
      )
    }
    const limit =
      /^must (NOT have fewer|NOT have more) than (\d+) characters$/u.exec(
        detail,
      )
    if (limit)
      return limit[1] === 'NOT have fewer'
        ? message(
            [
              'Must contain at least {count} characters',
              'Au moins {count} caractères attendus',
              'Se requieren al menos {count} caracteres',
            ],
            { count: limit[2] },
          )
        : message(
            [
              'Must contain at most {count} characters',
              'Au plus {count} caractères attendus',
              'Se permiten como máximo {count} caracteres',
            ],
            { count: limit[2] },
          )
    const minimum = /^must be >= (\S+)$/u.exec(detail)?.[1]
    if (minimum)
      return message(
        [
          'Must be at least {min}',
          'Valeur minimale attendue : {min}',
          'Valor mínimo esperado: {min}',
        ],
        { min: minimum },
      )
    const maximum = /^must be <= (\S+)$/u.exec(detail)?.[1]
    if (maximum)
      return message(
        [
          'Must be at most {max}',
          'Valeur maximale attendue : {max}',
          'Valor máximo esperado: {max}',
        ],
        { max: maximum },
      )
    return detail
  }

  return { message, documentError, validationMessage, conflictMessage }
}
