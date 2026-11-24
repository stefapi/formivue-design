import { createApp, defineComponent, h } from 'vue'
import { setValidateLanguage } from '@formivue/validator'
import './styles.css'
import { syncExampleLanguage } from '../../shared/language'
import FormDemo from './FormDemo.vue'

syncExampleLanguage(
  [
    'Formivue · Engine demos',
    'Formivue · Démonstrations du moteur',
    'Formivue · Demostraciones del motor',
  ],
  setValidateLanguage,
)

createApp(defineComponent(() => () => h(FormDemo))).mount('#app')
