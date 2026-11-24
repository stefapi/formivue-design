import { syncExampleLanguage } from '../../../shared/language'
import { createApp } from 'vue'
import LiveDocuments from './LiveDocuments.vue'
import './live-documents.css'

export function mountLiveDocuments() {
  syncExampleLanguage([
    'Formivue · Live sales',
    'Formivue · Ventes en temps réel',
    'Formivue · Ventas en tiempo real',
  ])
  const viewport = document.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  document.head.append(viewport)
  createApp(LiveDocuments).mount('#root')
}
