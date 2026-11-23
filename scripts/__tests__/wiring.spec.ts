// Smoke de câblage, inclus dans `pnpm test` et `pnpm check:formivue`.
// inclus dans `pnpm test`, il échoue si un @formivue/* cesse de résoudre vers le
// manager intégré. Intégration formivue v3 — le repo est AUTOPORTEUR : les 9
// packages @formivue/* vivent dans manager/ (copie du fork), résolus via les
// symlinks du workspace. Le test runtime (createForm) résout @formivue/core
// depuis design/formivue-transformer dans un processus Node natif.
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { realpathSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// version unique du projet — source unique package-meta.json
const meta = JSON.parse(
  readFileSync(path.join(root, 'package-meta.json'), 'utf8'),
)

// le realpath d'un @formivue/* câblé est dans manager/ (repo autoporteur) —
// vérifié par préfixe du chemin réel, indépendamment de l'emplacement du repo
const managerRoot = realpathSync(path.join(root, 'manager'))
const inManager = (resolved: string) =>
  resolved.startsWith(managerRoot + path.sep)
const assertInManager = (dir: string, name: string, resolved: string) =>
  assert.ok(inManager(resolved), `${dir} → ${name} (${resolved})`)

// déclarant → packages @formivue/* câblés (résolus vers manager/)
const consumers: Record<string, string[]> = {
  '.': ['@formivue/vue', '@formivue/reactive-vue', '@formivue/reactive'],
  // manager/ — les packages @formivue/* se consomment entre eux (workspace:*)
  'manager/core': [
    '@formivue/reactive',
    '@formivue/shared',
    '@formivue/validator',
  ],
  'manager/grid': ['@formivue/reactive'],
  'manager/json-schema': [
    '@formivue/core',
    '@formivue/reactive',
    '@formivue/shared',
  ],
  'manager/reactive-vue': ['@formivue/reactive'],
  'manager/shared': ['@formivue/path'],
  'manager/validator': ['@formivue/shared'],
  'manager/vue': [
    '@formivue/core',
    '@formivue/json-schema',
    '@formivue/reactive',
    '@formivue/reactive-vue',
    '@formivue/shared',
  ],
  // design/ — les packages @formivue-design/* consomment les bindings Vue du manager
  'design/core': [
    '@formivue/json-schema',
    '@formivue/path',
    '@formivue/reactive',
  ],
  'design/formivue-transformer': ['@formivue/core', '@formivue/json-schema'],
  // phase 3 vue — le chrome consomme les bindings Vue du manager
  'design/vue': ['@formivue/reactive', '@formivue/reactive-vue'],
  // phase 4 vue — la couche matériau consomme les bindings du manager
  'design/formivue-vue': ['@formivue/reactive-vue', '@formivue/vue'],
  // phase 5 vue — le panneau de settings consomme les bindings du manager
  'design/vue-settings-form': [
    '@formivue/core',
    '@formivue/reactive',
    '@formivue/reactive-vue',
    '@formivue/shared',
    '@formivue/vue',
  ],
  // phase 6 — les setters consomment les bindings du manager
  'design/formivue-setters': [
    '@formivue/core',
    '@formivue/json-schema',
    '@formivue/reactive',
    '@formivue/reactive-vue',
    '@formivue/shared',
    '@formivue/vue',
  ],
  'examples/basic': ['@formivue/reactive'],
  'examples/vite-usage': [
    '@formivue/core',
    '@formivue/reactive',
    '@formivue/reactive-vue',
    '@formivue/shared',
    '@formivue/validator',
    '@formivue/vue',
  ],
}

describe('câblage formivue v3 (manager intégré au workspace)', () => {
  test('chaque déclarant résout ses @formivue/* fournis vers le manager', () => {
    for (const [dir, names] of Object.entries(consumers)) {
      for (const name of names) {
        const resolved = realpathSync(
          require.resolve(`${name}/package.json`, {
            paths: [path.join(root, dir)],
          }),
        )
        assertInManager(dir, name, resolved)
        const pkg = require(resolved)
        assert.equal(
          pkg.version,
          meta.version,
          `${name} : version manager attendue (${meta.version}, package-meta.json)`,
        )
      }
    }
  })

  test('instance unique de @formivue/reactive à travers les contextes', () => {
    const realpaths = Object.entries(consumers)
      .filter(([, names]) => names.includes('@formivue/reactive'))
      .map(([dir]) =>
        realpathSync(
          require.resolve('@formivue/reactive/package.json', {
            paths: [path.join(root, dir)],
          }),
        ),
      )
    expect(new Set(realpaths).size).toBe(1)
  })

  test('le runtime ESM du manager fonctionne dans Node depuis le transformer', () => {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import assert from 'node:assert/strict'
          import { createForm } from '@formivue/core'

          const form = createForm({ initialValues: { hello: 'world' } })
          assert.equal(form.values.hello, 'world')
        `,
      ],
      {
        cwd: path.join(root, 'design/formivue-transformer'),
        stdio: 'inherit',
        timeout: 4000,
      },
    )
  })

  // phase 8.1 du plan vue (V4/V5) — stack React archivé : ni bindings
  // @formivue React, ni pool React/antd ne doivent revenir au lockfile.
  // Intégration formivue v3 : `moment` et `immutable` quittent la liste —
  // devDeps racine légitimes des specs manager (@formivue/shared compare
  // des objets moment/immutable ; @formivue/reactive benché contre mobx/lodash).
  test("le lockfile ne référence plus la stack React d'ère", () => {
    const lock = readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8')
    // clés de snapshots pnpm : 'pkg@version' (le @ final borne @formivue/react
    // vs @formivue/reactive-react, @formivue/reactive…)
    for (const gone of [
      /@formivue\/antd@/,
      /@formivue\/react@/,
      /@formivue\/reactive-react@/,
      /'react@/,
      /'react-dom@/,
      /'antd@/,
      /'@dnd-kit\//,
      /'@ant-design\/icons@/,
    ]) {
      expect(lock).not.toMatch(gone)
    }
  })
})
