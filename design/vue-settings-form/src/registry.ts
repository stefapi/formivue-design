import loader from '@monaco-editor/loader'

let registryBase: string

export const setNpmCDNRegistry = (
  registry: string,
  monacoPath = 'monaco-editor@0.30.1/min/vs',
) => {
  registryBase = registry.replace(/\/$/, '')
  loader.config({
    paths: {
      vs: `${registryBase}/${monacoPath}`,
    },
  })
}

setNpmCDNRegistry('/editor-assets', 'monaco/vs')

export const getNpmCDNRegistry = () => registryBase
