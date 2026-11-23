// vue-settings-form — types publics (port de l'ère ; types React → Vue,
// table §1.5 du plan).
import type { CSSProperties, Component } from 'vue'
import type { Form } from '@formivue/core'

export interface ISettingFormProps {
  className?: string
  style?: CSSProperties
  uploadAction?: string
  components?: Record<string, Component>
  effects?: (form: Form) => void
  scope?: any
}
