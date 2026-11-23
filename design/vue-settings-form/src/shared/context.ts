// vue-settings-form — SettingsFormContext (createContext d'ère →
// InjectionKey + provide/inject, table §1.5).
import type { InjectionKey } from 'vue'
import type { ISettingFormProps } from '../types'

export const SettingsFormContext: InjectionKey<ISettingFormProps> = Symbol(
  'SettingsFormContext',
)
