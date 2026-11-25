import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Select as DSelect } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Select = connect(
  DSelect,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Select as any),
) as any
