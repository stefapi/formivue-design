// @vitest-environment node
// Phase post-intégration — garde de couverture bidirectionnelle des matériaux :
// tout x-component/x-decorator émis par les matériaux designer doit résoudre
// des DEUX côtés, canvas et preview (l'audit 2026-11-21 a révélé le défaut :
// les statics ArrayBase ne vivaient que sur la binding Materials, le canvas
// rendait les nœuds template des arrays vides).
//
//   canvas  : Field/preview.ts résout via FormPath.getIn(components, name),
//             components = la carte des MATÉRIAUX DESIGNER (playground app.ts) ;
//   preview : PreviewWidget/MarkupSchemaWidget résolvent via
//             createSchemaField({ components: Materials }) (les BINDINGS).
//
// Écarts documentés (parité d'ère, vérifiés sur archive/formivue-antd) :
//   - 'Form' : absent de Materials — la racine du schéma est rendue par
//     l'enveloppe FormLayout (transformToSchema : props du nœud racine →
//     form) ; un Form imbriqué rend un champ vide, idem ère (la carte
//     SchemaField d'ère n'avait pas de Form non plus) ;
//   - 'ArrayTable.Column' : aucune résolution canvas — l'ère rendait les
//     colonnes directement (Table.Column), le matériau les rend aussi ;
//     le SortHandle/Index/Addition, eux, passent par TreeNodeWidget → Field.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FormPath } from '@formivue/shared'
import * as Pkg from '../index'
import { Materials } from '../materials'

// même périmètre que l'audit : les fichiers matériaux (canvas) — Field/
// exclut (shared.ts est le propsSchema settings, preview.ts le résolveur)
const MATERIAL_FILES = (() => {
  const walk = (dir: string, acc: string[] = []) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry === 'Field' || entry === '__tests__') continue
        walk(full, acc)
      } else if (/\.ts$/.test(entry)) acc.push(full)
    }
    return acc
  }
  return walk(join(import.meta.dirname, '../components'))
})()

const EMITTED = new Set<string>()
for (const file of MATERIAL_FILES) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(
    /['"]x-(?:component|decorator)['"]\s*:\s*['"]([^'"]+)['"]/g,
  )) {
    EMITTED.add(m[1])
  }
}

// carte du canvas : les matériaux designer sous leurs noms d'export
// (FormItem est injecté à la volée par Field/preview — il est exporté)
const CANVAS_MAP: Record<string, any> = {}
for (const name of [
  'Form',
  'Field',
  'FormItem',
  'Input',
  'Select',
  'Radio',
  'Checkbox',
  'Slider',
  'NumberPicker',
  'Password',
  'DatePicker',
  'TimePicker',
  'Switch',
  'Rate',
  'TreeSelect',
  'Cascader',
  'Transfer',
  'Upload',
  'Text',
  'Card',
  'Space',
  'FormLayout',
  'FormGrid',
  'FormTab',
  'FormCollapse',
  'ArrayCards',
  'ArrayTable',
  'ObjectContainer',
]) {
  CANVAS_MAP[name] = (Pkg as any)[name]
}

describe('formivue-vue — couverture bidirectionnelle des matériaux', () => {
  test("l'audit émet des noms (garde anti-regexp)", () => {
    expect(EMITTED.size).toBeGreaterThan(30)
  })

  test('CANVAS : chaque x-component/-decorator émis résout sur le matériau designer', () => {
    const missing = [...EMITTED].filter(
      (n) =>
        !['ArrayTable.Column'].includes(n) &&
        FormPath.getIn(CANVAS_MAP, n) == null,
    )
    expect(missing, `non résolus côté canvas: ${missing.join(', ')}`).toEqual(
      [],
    )
  })

  test('PREVIEW : chaque x-component/-decorator émis résout dans Materials (bindings)', () => {
    const missing = [...EMITTED].filter(
      (n) =>
        !['Form'].includes(n) && FormPath.getIn(Materials as any, n) == null,
    )
    expect(missing, `non résolus côté preview: ${missing.join(', ')}`).toEqual(
      [],
    )
  })

  test('RÉCIPROCITÉ : chaque matériau designer a Behavior + Resource (palette)', () => {
    const missing = Object.keys(CANVAS_MAP)
      .filter((n) => !['Field', 'FormItem'].includes(n))
      .filter((n) => {
        const m = CANVAS_MAP[n]
        return !m || !m.Behavior || !m.Resource
      })
    expect(missing, `sans Behavior/Resource: ${missing.join(', ')}`).toEqual([])
  })
})
