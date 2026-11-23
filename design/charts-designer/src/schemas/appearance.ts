import { editor, hideWhen } from './shared'

export const numberSetting = (
  min: number,
  max?: number,
  placeholder?: string,
  condition?: string,
) =>
  editor(
    'NumberPicker',
    { min, max, placeholder },
    condition ? { 'x-reactions': hideWhen(condition) } : undefined,
  )

export const toggleSetting = (defaultChecked = false, condition?: string) =>
  editor(
    'Switch',
    { defaultChecked },
    condition ? { 'x-reactions': hideWhen(condition) } : undefined,
  )

export const choiceSetting = (values: string[], defaultValue = values[0]) =>
  editor(values, { defaultValue })

export const settingValue = (name: string) =>
  `$values["x-component-props"]?.${name}`
export const whenUnchecked = (name: string) => `${settingValue(name)} === false`
export const barRadius = numberSetting(0, 24, '2')
export const sliceRadius = numberSetting(0, 32, '0')
export const centerLabel = editor('Input')
export const colorScale = choiceSetting(['auto', 'blue', 'green', 'orange'])
export const curve = choiceSetting(['monotoneX', 'linear', 'step'])
export const showNodeLabels = toggleSetting(true)
export const mapMarkers = {
  markerSize: numberSetting(1, 40, '8'),
  showPointLabels: toggleSetting(true),
  fitToData: toggleSetting(),
}
export const circularScale = {
  scaleMax: numberSetting(0, undefined, 'Auto'),
  showTracks: toggleSetting(true),
}
