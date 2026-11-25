import { connect, mapReadPretty } from '@formivue/vue'
import { Switch as DSwitch } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Switch = connect(DSwitch, mapReadPretty(PreviewText as any)) as any
