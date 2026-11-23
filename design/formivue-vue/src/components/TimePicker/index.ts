import type { Component } from 'vue'
import { connect, mapProps, mapReadPretty } from '@formivue/vue'
import {
  TimePicker as DTimePicker,
  TimeRangePicker as DTimeRangePicker,
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

export const TimePicker: DnFC<any> & { RangePicker?: Component } = connect(
  DTimePicker,
  mapReadPretty(PreviewText.TimePicker as any),
) as any

TimePicker.RangePicker = connect(
  DTimeRangePicker,
  mapProps((props: { locale?: string }) => ({
    ...props,
    locale: props.locale ?? GlobalRegistry.getDesignerLanguage(),
  })),
  mapReadPretty(PreviewText.TimeRangePicker as any),
) as any

TimePicker.Behavior = createBehavior(
  {
    name: 'TimePicker',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'TimePicker',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.TimePicker),
    },
    designerLocales: AllLocales.TimePicker,
  },
  {
    name: 'TimePicker.RangePicker',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'TimePicker.RangePicker',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.TimePicker.RangePicker!),
    },
    designerLocales: AllLocales.TimeRangePicker,
  },
)

TimePicker.Resource = createResource(
  {
    icon: 'TimePickerSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string',
          title: 'TimePicker',
          'x-decorator': 'FormItem',
          'x-component': 'TimePicker',
        },
      },
    ],
  },
  {
    icon: 'TimeRangePickerSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'string[]',
          title: 'TimeRangePicker',
          'x-decorator': 'FormItem',
          'x-component': 'TimePicker.RangePicker',
        },
      },
    ],
  },
)
