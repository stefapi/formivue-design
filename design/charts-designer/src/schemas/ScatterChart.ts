import { choiceSetting, numberSetting } from './appearance'
import { chartSchema, axis } from './shared'

export const ScatterChart = chartSchema({
  xKey: axis(true),
  valueKey: axis(true),
  pointShape: choiceSetting([
    'circle',
    'square',
    'diamond',
    'triangle',
    'cross',
    'star',
  ]),
  pointSize: numberSetting(1, 40, '8'),
})
