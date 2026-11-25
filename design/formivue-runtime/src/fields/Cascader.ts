import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Cascader as DCascader } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Cascader = connect(
  DCascader,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Cascader as any),
) as any
