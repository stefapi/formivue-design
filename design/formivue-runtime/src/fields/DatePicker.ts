import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import {
  DatePicker as DDatePicker,
  DateRangePicker as DDateRangePicker,
} from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export function createDatePicker(getLocale?: () => string) {
  const mapLocale = mapProps((props: { locale?: string }) => ({
    ...props,
    locale: props.locale ?? getLocale?.(),
  }))

  const DatePicker: Component & { RangePicker?: Component } = connect(
    DDatePicker,
    mapLocale,
    mapReadPretty(PreviewText.DatePicker as any),
  ) as any

  DatePicker.RangePicker = connect(
    DDateRangePicker,
    mapLocale,
    mapReadPretty(PreviewText.DateRangePicker as any),
  ) as any
  return DatePicker
}

export const DatePicker = createDatePicker()
