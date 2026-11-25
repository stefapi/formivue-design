import { connect, mapReadPretty } from '@formivue/vue'
import { Rate as DRate } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Rate = connect(
  DRate,
  mapReadPretty(PreviewText.Rate as any),
) as any
