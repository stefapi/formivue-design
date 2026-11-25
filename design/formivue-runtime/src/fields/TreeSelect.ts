import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { TreeSelect as DTreeSelect } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const TreeSelect = connect(
  DTreeSelect,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.TreeSelect as any),
) as any
