import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const sourceFiles = '**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}'
const internalImports = {
  regex: '^@formivue(?:-design)?/[^/]+/(?:src|dist)(?:/|$)',
  message: 'Import workspace packages through their public exports.',
}
const exampleImports = {
  regex:
    '^(?:(?:@formivue/example-[^/]+|@formivue-design/[^/]+-example)(?:/|$)|(?:\\.\\./)+examples/)',
  message: 'Examples compose packages and must stay outside library code.',
}
const designerImports = {
  regex: '^(?:@formivue-design/|(?:\\.\\./)+design/)',
  message: 'The manager must stay independent of the designer.',
}
const formivueImports = {
  regex: '^(?:@formivue(?:-design)?/|(?:\\.\\./)+(?:manager|design)/)',
  message: 'Vue UI controls receive behavior through props, slots and events.',
}

const restrictWorkspaceImports = (directory, ...patterns) => ({
  files: [`${directory}/${sourceFiles}`],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: [internalImports, ...patterns] },
    ],
  },
})

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/lib/**',
    '**/esm/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/temp_esm/**',
    '**/.umi*/**',
    '**/doc-site/**',
    '**/expected/**',
    // artefacts de build des apps (phase 6) : bundle IIFE de l'iframe Sandbox
    '**/public/sandbox.bundle.js',
    // démos vitepress du manager (manager/vue/docs) : non lintées dans le
    // fork (eslint ignore docs/**) — code de démo, pas surface de library
    'manager/vue/docs/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // parité avec packages/.eslintrc (ère) — rien d'ajouté
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // parité avec l'ère : era no-var-requires off + react@7.14 sans unknown-property sur p-id
      '@typescript-eslint/no-require-imports': 'off',
      // règle absente de l'ère (ts-eslint v4) : KeyCode porte des alias de valeurs par design
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      // parité avec l'ère formivue (packages/.eslintrc @v2.3.7) : la config d'ère
      // n'étendait pas eslint:recommended — ces règles core de
      // js.configs.recommended n'existaient pas. Écart révélé par le porté
      // formivue-v3/antd (phase 5) : no-async-promise-executor (form-dialog,
      // form-drawer), no-unsafe-finally (editable), no-unescaped-entities.
      'no-async-promise-executor': 'off',
      'no-unsafe-finally': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      // catch vides idiomatic (garde typeof SSR dans globalThisPolyfill, playgrounds)
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'off',
      'no-var': 'warn',
    },
  },
  {
    // équivalent env:node de l'ère pour les scripts CJS (config racine d'époque)
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    // scripts ESM (smoke, configs flat) : globals node
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // scripts/ relevait de la config racine d'époque (no-console non restreint)
    files: ['scripts/**/*.js', 'scripts/**/*.ts', 'scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  // phase 1.4 du plan vue — composants
  // .vue : vue flat/recommended (recette fork). Intégration formivue v3 : les
  // premiers SFC du repo arrivent avec examples/vite-usage (FormDemo.vue…) —
  // le bloc s'active enfin. NB : configs['flat/recommended'] est un TABLEAU
  // (base + règles) dont le bloc règles n'a PAS de `files` — étalé tel il
  // imposerait les règles vue à tout .ts du repo ; on borne chaque élément
  // aux seuls .vue.
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.vue'],
  })),
  {
    // les SFC portent des <script lang="ts"> : vue-eslint-parser délègue
    // le contenu du bloc au parser TS (sinon espree → parsing error)
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // l'override eslint-recommended de tseseslint (qui coupe no-undef)
      // ne cible que .ts/.tsx : les globales DOM des SFC (FocusEvent…)
      // relever du typage TS, pas de no-undef
      'no-undef': 'off',
    },
  },
  {
    // les démos de l'exemple vite-usage (composants monofichiers nommés par
    // fichier) : nommage multimot relâché, à la manière du fork (ses .vue
    // n'étaient pas lintés — ici on les lint avec la règle retirée)
    files: ['examples/vite-usage/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // intégration formivue v3 — parité fork : manager/ (copie du fork) et
    // examples/vite-usage étaient couverts par la config du fork, qui
    // n'applique NI js.configs.recommended NI tseslint.configs.recommended
    // aux .ts (positions historiques reprises ici — sinon ~50 erreurs de
    // style sur du code inchangé par principe de copie simple)
    files: ['manager/**/*.{ts,tsx}', 'examples/vite-usage/**/*.{ts,tsx}'],
    rules: {
      // js.configs.recommended : non appliqué aux .ts par le fork
      'prefer-rest-params': 'off',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
      'no-extra-boolean-cast': 'off',
      'no-fallthrough': 'off',
      // positions historiques du fork (explicit off)
      'no-empty': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // tseslint.configs.recommended : non appliqué par le fork (set custom v4)
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    },
  },
  restrictWorkspaceImports('manager', designerImports, exampleImports),
  restrictWorkspaceImports('design', exampleImports),
  restrictWorkspaceImports(
    'design/vue-ui/src',
    formivueImports,
    exampleImports,
  ),
  restrictWorkspaceImports('examples'),
  prettier,
)
