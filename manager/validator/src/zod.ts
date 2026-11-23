import type { ZodType } from 'zod'
import type { IValidateResult } from './types'

/**
 * Pont zod → @formivue/validator.
 *
 * Permet d'utiliser un schéma zod directement comme validateur d'un champ :
 *
 * ```ts
 * import { z } from 'zod'
 * import { createForm } from '@formivue/core'
 * import { zodValidator } from '@formivue/validator/zod'
 *
 * const email = z.string().email('Adresse e-mail invalide')
 * const form = createForm()
 * const field = form.createField({
 *   name: 'email',
 *   validator: zodValidator(email),
 * })
 * ```
 *
 * Les messages d'erreur zod (`message` de chaque issue) sont préservés ;
 * en leur absence, le message par défaut `invalid` de la locale est utilisé.
 * Succès zod => pas d'erreur (convention formivue : message vide).
 */
export const zodValidator = <T>(schema: ZodType<T>) => {
  return async (value: unknown): Promise<IValidateResult | null> => {
    const result = schema.safeParse(value)
    if (result.success) {
      // convention @formivue/validator : null/undefined = pas d'erreur
      return null
    }
    const first = result.error.issues[0]
    return {
      type: 'error',
      message: first?.message ?? '',
    }
  }
}
