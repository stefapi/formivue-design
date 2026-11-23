import { createApp, defineComponent, h } from 'vue'
import { setValidateLanguage } from '@formivue/validator'
import './styles.css'
import FormDemo from './FormDemo.vue'

setValidateLanguage('en')

createApp(defineComponent(() => () => h(FormDemo))).mount('#app')
