import { connect, mapReadPretty } from '@formivue/vue'
import { Password as DPassword } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Password = connect(
  DPassword,
  mapReadPretty(PreviewText.Input as any),
) as any
