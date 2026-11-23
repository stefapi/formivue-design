import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Previewer from './components/Previewer.vue'
import './style.css'

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Previewer', Previewer)
  },
}

export default theme
