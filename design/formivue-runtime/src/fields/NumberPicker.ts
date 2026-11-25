import { connect, mapReadPretty } from '@formivue/vue'
import { NumberPicker as DNumberPicker } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const NumberPicker = connect(
  DNumberPicker,
  mapReadPretty(PreviewText.NumberPicker as any),
) as any
