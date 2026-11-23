// @vitest-environment jsdom
/**
 * Démo M3 (critère d'acceptation phase 8) : le MÊME schéma zod alimente
 * vee-validate ET formivue, sans réécriture.
 */
import { describe, test, expect } from 'vitest'
import { z } from 'zod'
import { validate } from '@formivue/validator'
import { zodValidator } from '@formivue/validator/zod'

// --- Le schéma zod existant côté previimmo (inchangé) ---
const locataireSchema = z.object({
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Adresse e-mail invalide'),
  loyer: z.number().positive('Le loyer doit être positif'),
})

describe('pont zod — même schéma pour vee-validate et formivue', () => {
  test('validateur zod natif (usage vee-validate)', () => {
    // côté vee-validate, le schéma est consommé tel quel via toTypedSchema
    const parsed = locataireSchema.safeParse({
      nom: 'X',
      email: 'pas-un-email',
      loyer: -5,
    })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((i) => i.message)).toContain(
      'Nom trop court',
    )
  })

  test('même schéma via @formivue/validator/zod', async () => {
    const fieldValidator = zodValidator(locataireSchema.shape.email)
    const bad = await validate('pas-un-email', fieldValidator)
    expect(bad.error).toContain('Adresse e-mail invalide')

    const good = await validate('contact@previimmo.fr', fieldValidator)
    expect(good.error).toEqual([])
  })

  test('validation champ par champ (pattern formivue field.validator)', async () => {
    // dans un formulaire formivue, chaque champ pointe sur la même
    // sous-classe du schéma zod — zéro réécriture
    const checks = [
      ['nom', locataireSchema.shape.nom, 'A', ['Nom trop court']],
      ['email', locataireSchema.shape.email, 'contact@previimmo.fr', []],
      ['loyer', locataireSchema.shape.loyer, 850, []],
      [
        'loyer',
        locataireSchema.shape.loyer,
        -1,
        ['Le loyer doit être positif'],
      ],
    ] as const
    for (const [name, schema, value, expected] of checks) {
      const res = await validate(value, zodValidator(schema as any))
      expect(res.error, `champ ${name}`).toEqual(expected)
    }
  })
})
