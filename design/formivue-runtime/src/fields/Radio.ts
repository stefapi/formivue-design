import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import { Radio as DRadio } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Radio: Component & { Group?: Component } = connect(
  DRadio,
  mapProps({ dataSource: 'options' } as any),
  mapReadPretty(PreviewText.Select as any),
) as any

Radio.Group = Radio
