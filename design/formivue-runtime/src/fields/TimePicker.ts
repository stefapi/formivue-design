import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import {
  TimePicker as DTimePicker,
  TimeRangePicker as DTimeRangePicker,
} from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export function createTimePicker(getLocale?: () => string) {
  const TimePicker: Component & { RangePicker?: Component } = connect(
    DTimePicker,
    mapReadPretty(PreviewText.TimePicker as any),
  ) as any

  TimePicker.RangePicker = connect(
    DTimeRangePicker,
    mapProps((props: { locale?: string }) => ({
      ...props,
      locale: props.locale ?? getLocale?.(),
    })),
    mapReadPretty(PreviewText.TimeRangePicker as any),
  ) as any
  return TimePicker
}

export const TimePicker = createTimePicker()
