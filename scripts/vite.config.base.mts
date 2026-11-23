import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url))

export const createFormivueDesignViteConfig = (options: {
  port: number
  root: string
}): UserConfig => {
  const { root, port } = options
  const publicDir = mkdtempSync(path.join(tmpdir(), 'formivue-demo-'))
  const settingsRequire = createRequire(
    path.join(workspaceRoot, 'design/vue-settings-form/package.json'),
  )
  const monacoVs = path.dirname(settingsRequire.resolve('monaco-editor'))
  const monacoAssets = path.join(publicDir, 'editor-assets/monaco')

  cpSync(path.join(workspaceRoot, 'branding'), publicDir, { recursive: true })
  const appAssets = path.join(root, 'public')
  if (existsSync(appAssets)) cpSync(appAssets, publicDir, { recursive: true })
  cpSync(monacoVs, path.join(monacoAssets, 'vs'), { recursive: true })
  for (const notice of ['LICENSE', 'ThirdPartyNotices.txt']) {
    copyFileSync(
      path.resolve(monacoVs, '../..', notice),
      path.join(monacoAssets, notice),
    )
  }
  for (const name of ['core', 'shared', 'path', 'validator']) {
    const declarations = path.join(
      publicDir,
      `editor-assets/@formivue/${name}/dist`,
    )
    mkdirSync(declarations, { recursive: true })
    copyFileSync(
      path.join(workspaceRoot, `manager/${name}/dist/index.d.mts`),
      path.join(declarations, 'index.d.mts'),
    )
  }

  return {
    root,
    publicDir,
    plugins: [
      Promise.all([
        import('@vitejs/plugin-vue'),
        import('@tailwindcss/vite'),
      ]).then(([vue, tailwindcss]) => [vue.default(), tailwindcss.default()]),
      {
        name: 'formivue-demo-assets',
        closeBundle() {
          rmSync(publicDir, { recursive: true, force: true })
        },
      },
    ],
    server: {
      port,
      host: '127.0.0.1',
    },
    build: {
      minify: false,
    },
  }
}
