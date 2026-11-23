#!/usr/bin/env node
// Synchronise les métadonnées communes de `package-meta.json` — source unique du
// projet — vers le package.json racine et tous les packages du workspace pnpm
// (globs de `pnpm-workspace.yaml` : manager/*, design/*, examples/*).
//
// Usage :
//   node scripts/sync-package-meta.mjs          # écrire les package.json
//   node scripts/sync-package-meta.mjs --check  # vérifier seulement (CI/lint)
//
// Règles :
// - `version` : version unique du projet, insérée juste après `name` ;
// - `repository` / `bugs` / `homepage` / `author` / `license` : appliqués à
//   l'identique partout ; `repository.directory` est calculé (chemin du
//   package dans le repo) ;
// - dépendances internes (packages du workspace) : `workspace:*` conservé
//   (liaison locale requise), toute autre plage (ex. peerDependencies) est
//   normalisée en `^<version unique>`.
//
// Le formatage suit Prettier (2 espaces, fin de fichier par un saut de ligne) :
// l'ordre des clés existantes est préservé, les clés absentes sont ajoutées.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CHECK = process.argv.includes('--check')

const meta = JSON.parse(readFileSync(join(ROOT, 'package-meta.json'), 'utf8'))
const metaRepository = { ...meta.repository }

// --- découverte des packages du workspace (pnpm-workspace.yaml) ------------
const workspaceYaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8')
const patterns = [...workspaceYaml.matchAll(/^\s*-\s*(\S+)\s*$/gm)].map(
  (m) => m[1],
)

const packagePaths = [join(ROOT, 'package.json')]
for (const pattern of patterns) {
  if (pattern.startsWith('!')) continue
  if (pattern.endsWith('/*')) {
    const base = join(ROOT, pattern.slice(0, -2))
    for (const entry of readdirSync(base).sort()) {
      const dir = join(base, entry)
      if (
        statSync(dir).isDirectory() &&
        statSync(join(dir, 'package.json'), { throwIfNoEntry: false })?.isFile()
      ) {
        packagePaths.push(join(dir, 'package.json'))
      }
    }
  } else {
    const dir = join(ROOT, pattern)
    if (
      statSync(join(dir, 'package.json'), { throwIfNoEntry: false })?.isFile()
    ) {
      packagePaths.push(join(dir, 'package.json'))
    }
  }
}

const packages = packagePaths.sort().map((file) => {
  const raw = readFileSync(file, 'utf8')
  return { file, dir: dirname(file), raw, pkg: JSON.parse(raw) }
})

// noms des packages internes (plages de dépendances à normaliser)
const workspaceNames = new Set(
  packages.filter((p) => p.dir !== ROOT).map((p) => p.pkg.name),
)

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

// --- application de la source unique sur un package ------------------------
function applyMeta(entry) {
  const { pkg, dir } = entry
  const isRoot = dir === ROOT

  const next = {}
  for (const [key, value] of Object.entries(pkg)) {
    next[key] = value
    // version juste après `name` si absente
    if (key === 'name' && pkg.version === undefined) next.version = meta.version
  }
  next.version = meta.version
  next.repository = isRoot
    ? metaRepository
    : { ...metaRepository, directory: relative(ROOT, dir) }
  next.bugs = { ...meta.bugs }
  next.homepage = meta.homepage
  next.author = meta.author
  next.license = meta.license

  // plages des dépendances internes : workspace:* conservé, autres -> ^version
  const rangeChanges = []
  for (const field of DEP_FIELDS) {
    const deps = next[field]
    if (!deps) continue
    for (const [name, range] of Object.entries(deps)) {
      if (!workspaceNames.has(name)) continue
      if (String(range).startsWith('workspace:')) continue
      deps[name] = `^${meta.version}`
      rangeChanges.push(`${name} (${field}) : ${range} → ^${meta.version}`)
    }
  }
  return { text: JSON.stringify(next, null, 2) + '\n', rangeChanges }
}

// --- exécution --------------------------------------------------------------
const updated = []
const drift = []

for (const entry of packages) {
  const { text, rangeChanges } = applyMeta(entry)
  if (text === entry.raw) {
    console.log(`✓ ${relative(ROOT, entry.file)} — à jour (${meta.version})`)
    continue
  }
  // champs divergents (hors plages de dépendances)
  const fields = []
  const before = entry.pkg
  const after = JSON.parse(text)
  for (const key of [
    'version',
    'repository',
    'bugs',
    'homepage',
    'author',
    'license',
  ]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      fields.push(key)
    }
  }
  const detail = [...fields, ...rangeChanges].join(', ')
  if (CHECK) {
    drift.push({ file: entry.file, detail })
    console.log(`✗ ${relative(ROOT, entry.file)} — diverge : ${detail}`)
  } else {
    writeFileSync(entry.file, text)
    updated.push(entry.file)
    console.log(`~ ${relative(ROOT, entry.file)} — mis à jour : ${detail}`)
  }
}

console.log('')
if (CHECK) {
  if (drift.length > 0) {
    console.error(
      `✗ ${drift.length} package.json divergent(s) de package-meta.json ` +
        `(version ${meta.version}). Lancer : pnpm meta:sync`,
    )
    process.exitCode = 1
  } else {
    console.log(
      `✓ tous les package.json sont alignés sur package-meta.json (${meta.version})`,
    )
  }
} else {
  console.log(
    updated.length === 0
      ? `✓ rien à faire : tous les package.json suivent déjà package-meta.json (${meta.version})`
      : `✓ ${updated.length} package.json synchronisés sur package-meta.json (version unique ${meta.version})`,
  )
}
