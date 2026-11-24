import { exampleLanguage, message, type Message } from './language'

const contractIssues: Record<string, Message> = {
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

export function documentError(error: unknown) {
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
      ({ component, path, property, code, message: detail }) =>
        `${component ? component + ' ' : ''}${path || '/'}${property ? ' · ' + property : ''}: ${validationMessage(detail, code)}`,
    )
    .join('\n')
}

export function validationMessage(detail: string, code?: string) {
  if (
    code &&
    Object.prototype.hasOwnProperty.call(contractIssues, code) &&
    exampleLanguage.value !== 'en'
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
    const types = {
      integer: ['an integer', 'un entier', 'un entero'],
      number: ['a number', 'un nombre', 'un número'],
      string: ['text', 'du texte', 'texto'],
      array: ['an array', 'un tableau', 'una lista'],
      boolean: ['a boolean', 'un booléen', 'un booleano'],
      object: ['an object', 'un objet', 'un objeto'],
      null: ['null', 'null', 'null'],
    } as const
    return message(
      ['Must be {type}', 'Valeur attendue : {type}', 'Se esperaba {type}'],
      { type: message(types[type as keyof typeof types]) },
    )
  }
  const limit =
    /^must (NOT have fewer|NOT have more) than (\d+) characters$/u.exec(detail)
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
