/// <reference types="vite/client" />

// Phase 7 (7.1) — bootstrap du playground : l'App vit dans ./app (montable
// en isolation par la suite a11y 7.3), ici createApp(...).mount('#root') —
// l'ère faisait ReactDOM.render(<App/>, #root).
import { createApp, h } from 'vue'
import { setNpmCDNRegistry } from '@formivue-design/vue-settings-form'
import { App } from './app'
import './styles.css'

setNpmCDNRegistry(`${import.meta.env.BASE_URL}editor-assets`, 'monaco/vs')
async function mountPlayground() {
  const advanced =
    new URLSearchParams(window.location.search).get('mode') === 'advanced'
  if (!advanced) {
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
        materials: { ...AdvancedMaterials, ...ChartMaterials },
        previewFrame: AdvancedPreviewFrame,
      },
    })
  createApp({
    render: () => h(ChartDesignerLocale, null, { default: render }),
  }).mount('#root')
}

void mountPlayground()
