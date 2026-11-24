import { GlobalRegistry } from '@formivue-design/core'
import { createApp } from 'vue'
import { syncDesignerLanguage } from '../../shared/designer-language'
import { copy } from './copy'
import App from './App.vue'
import './styles.css'

syncDesignerLanguage(GlobalRegistry, copy.pageTitle)

createApp(App).mount('#app')
