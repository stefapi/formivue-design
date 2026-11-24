import { message } from './language'

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
      ({ component, path, message: detail }) =>
        `${component ? component + ' ' : ''}${path || '/'}: ${validationMessage(detail)}`,
    )
    .join('\n')
}

export function validationMessage(detail: string) {
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
  return detail
}
