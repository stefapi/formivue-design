import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import {
  DatePicker as DDatePicker,
  DateRangePicker as DDateRangePicker,
} from '@formivue-design/vue-ui'
import {
  GlobalRegistry,
  createBehavior,
  createResource,
} from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

const mapLocale = mapProps((props: { locale?: string }) => ({
  ...props,
  locale: props.locale ?? GlobalRegistry.getDesignerLanguage(),
}))

export const DatePicker: DnFC<any> & { RangePicker?: Component } = connect(
  DDatePicker,
  mapLocale,
  mapReadPretty(PreviewText.DatePicker as any),
) as any

DatePicker.RangePicker = connect(
  DDateRangePicker,
  mapLocale,
  mapReadPretty(PreviewText.DateRangePicker as any),
) as any

DatePicker.Behavior = createBehavior(
  {
    name: 'DatePicker',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'DatePicker',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.DatePicker),
    },
    designerLocales: AllLocales.DatePicker,
  },
  {
    name: 'DatePicker.RangePicker',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'DatePicker.RangePicker',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.DatePicker.RangePicker!),
    },
    designerLocales: AllLocales.DateRangePicker,
  },
)

DatePicker.Resource = createResource(
  {
    icon: 'DatePickerSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string',
          title: 'DatePicker',
          'x-decorator': 'FormItem',
          'x-component': 'DatePicker',
        },
      },
    ],
  },
  {
    icon: 'DateRangePickerSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string[]',
          title: 'DateRangePicker',
          'x-decorator': 'FormItem',
          'x-component': 'DatePicker.RangePicker',
        },
      },
    ],
  },
)
