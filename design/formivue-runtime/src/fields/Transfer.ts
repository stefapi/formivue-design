import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Transfer as DTransfer } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Transfer = connect(
  DTransfer,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Transfer as any),
) as any
