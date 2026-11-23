// @vitest-environment jsdom
/**
 * Critère M3 complet : un formulaire vee-validate + zod existant,
 * réimplémenté avec @formivue/core — SANS RÉÉCRIRE le schéma zod.
 * Le même fichier de schéma alimente les deux moteurs.
 */
import { describe, test, expect } from 'vitest'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { createForm } from '@formivue/core'
import { zodValidator } from '@formivue/validator/zod'

// ---------------------------------------------------------------
// LE schéma zod (fichier unique, partagé par les deux moteurs)
// ---------------------------------------------------------------
const bailSchema = z.object({
  loyer: z
    .number({ invalid_type_error: 'Le loyer doit être un nombre' })
    .positive('Le loyer doit être positif'),
  charges: z.number().min(0, 'Les charges doivent être positives'),
  caution: z.number().min(0, 'La caution doit être positive'),
})

describe('M3 — coexistence vee-validate / formivue sur le même schéma zod', () => {
  test('moteur vee-validate (existant, inchangé) — même schéma via toTypedSchema', async () => {
    // vee-validate consomme le schéma tel quel (usage previimmo):
    // toTypedSchema est le pont officiel vee-validate <-> zod.
    const typed = toTypedSchema(bailSchema)
    expect(typeof typed.parse).toBe('function')
    // les règles zod sont bien là, inchangées:
    const bad = bailSchema.safeParse({ loyer: -100, charges: 0, caution: 0 })
    expect(bad.success).toBe(false)
    expect(bad.error?.issues[0].message).toBe('Le loyer doit être positif')
    const good = bailSchema.safeParse({ loyer: 850, charges: 40, caution: 850 })
    expect(good.success).toBe(true)
  })

  test('moteur formivue (nouveau) — mêmes règles, zéro réécriture', async () => {
    const form = createForm()
    const loyer = form.createField({
      name: 'loyer',
      validator: zodValidator(bailSchema.shape.loyer),
    })
    await loyer.setValue(-100)
    // convention formivue: form.validate() rejette form.errors si invalide
    await expect(form.validate()).rejects.toBeTruthy()
    expect(oyerErrors(loyer)).toContain('Le loyer doit être positif')

    await loyer.setValue(850)
    await form.validate() // ne rejette pas si valide
    expect(oyerErrors(loyer)).toEqual([])
  })

  test('les champs obligatoires formivue + zod se composent', async () => {
    const form = createForm()
    const charges = form.createField({
      name: 'charges',
      required: true,
      validator: zodValidator(bailSchema.shape.charges),
    })
    await charges.setValue(-20)
    await expect(form.validate()).rejects.toBeTruthy()
    expect(oyerErrors(charges)).toContain('Les charges doivent être positives')
  })
})

function oyerErrors(field: any): string[] {
  return (field.selfErrors ?? []).filter(Boolean)
}
