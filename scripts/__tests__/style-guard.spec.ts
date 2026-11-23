// @vitest-environment node
/**
 * Garde-fou A6 (plan v3) : Tailwind 4 est l'unique système de style.
 * Toute réintroduction d'un préprocesseur CSS legacy (less/scss/stylus/sass)
 * ou d'une feuille de charte compilée fait échouer ce test.
 * Intégration formivue v3 : la garde couvre les deux racines du repo autoporteur
 * — manager/ (packages @formivue/* copiés du fork) et design/ (@formivue-design/*),
 * plus les examples/.
 */
import { describe, test, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const REPO = join(import.meta.dirname, '../..')
// périmètre : les deux racines du repo autoporteur + les examples
const TREES = ['manager', 'design', 'examples'].map((t) => join(REPO, t))

const FORBIDDEN_EXT = /\.(less|scss|sass|styl)$/
const FORBIDDEN_IMPORT = /['"]([^"]+\.(?:less|scss|sass|styl))['"]/
const FORBIDDEN_STYLE_BLOCK =
  /<style[^>]*\slang=["'](less|scss|sass|stylus)["']/
const FORBIDDEN_DEP =
  /"(?:less|less-loader|less-plugin-npm-import|sass|node-sass|stylus|stylus-loader)":\s*"/

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist')
      continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

describe('A6 — Tailwind 4 seul, aucun préprocesseur CSS', () => {
  test('aucun fichier .less/.scss/.sass/.styl dans manager/, design/ ni examples/', () => {
    const offenders = TREES.flatMap((t) => walk(t)).filter((f) =>
      FORBIDDEN_EXT.test(f),
    )
    expect(offenders, `fichiers interdits: ${offenders.join(', ')}`).toEqual([])
  })

  test('aucun import de feuille legacy ni <style lang=less|scss|stylus|sass>', () => {
    const offenders: string[] = []
    for (const f of TREES.flatMap((t) => walk(t))) {
      if (!/\.(vue|ts|tsx|js|mjs)$/.test(f)) continue
      const content = readFileSync(f, 'utf8')
      if (
        FORBIDDEN_IMPORT.test(content) ||
        FORBIDDEN_STYLE_BLOCK.test(content)
      ) {
        offenders.push(f)
      }
    }
    expect(
      offenders,
      `imports/blocks interdits: ${offenders.join(', ')}`,
    ).toEqual([])
  })

  test('aucune devDep de préprocesseur dans les manifests', () => {
    const offenders: string[] = []
    const manifests = [
      join(REPO, 'package.json'),
      ...TREES.flatMap((t) => walk(t)).filter((p) =>
        p.endsWith('package.json'),
      ),
    ]
    for (const f of manifests) {
      if (FORBIDDEN_DEP.test(readFileSync(f, 'utf8'))) offenders.push(f)
    }
    expect(offenders, `manifests fautifs: ${offenders.join(', ')}`).toEqual([])
  })
})
