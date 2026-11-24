/// <reference types="vite/client" />

// Phase 7 (7.1) — bootstrap du playground : l'App vit dans ./app (montable
// en isolation par la suite a11y 7.3), ici createApp(...).mount('#root') —
// l'ère faisait ReactDOM.render(<App/>, #root).
import { createApp, h } from 'vue'
import './styles.css'
import { localizedMaterials } from './localized-materials'

async function mountPlayground() {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode === 'live-documents') {
    const { mountLiveDocuments } = await import('./live-documents/main')
    mountLiveDocuments()
    return
  }
  const [{ App }, { setNpmCDNRegistry }] = await Promise.all([
    import('./app'),
    import('@formivue-design/vue-settings-form'),
  ])
  setNpmCDNRegistry(`${import.meta.env.BASE_URL}editor-assets`, 'monaco/vs')
  if (mode !== 'advanced') {
    createApp(App).mount('#root')
    return
  }
  const viewport = document.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  document.head.append(viewport)
  const [
    { AdvancedDesignerComponents, AdvancedSources },
    { AdvancedMaterials, AdvancedPreviewFrame },
    {
      ChartDesignerComponents,
      ChartDesignerLocale,
      ChartSettingsComponents,
      ChartSources,
    },
    { ChartMaterials },
  ] = await Promise.all([
    import('@formivue-design/shadcn-advanced-designer'),
    import('@formivue-design/shadcn-advanced-runtime'),
    import('@formivue-design/charts-designer'),
    import('@formivue-design/charts-runtime'),
  ])
  const materials = {
    ...localizedMaterials(AdvancedMaterials),
    ...ChartMaterials,
  }
  const render = () =>
    h(App, {
      advanced: {
        components: {
          ...AdvancedDesignerComponents,
          ...ChartDesignerComponents,
        },
        settings: ChartSettingsComponents,
        chartSources: ChartSources,
        sources: AdvancedSources,
        materials,
        previewFrame: AdvancedPreviewFrame,
      },
    })
  createApp({
    render: () => h(ChartDesignerLocale, null, { default: render }),
  }).mount('#root')
}

void mountPlayground()
