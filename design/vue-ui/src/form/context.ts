// @formivue-design/vue-ui — bloc form — contexte de layout (provide/inject).
// FormLayout fournit, FormItemBase consomme (parité FormLayoutContext d'ère).
import type { InjectionKey } from 'vue'

export interface IFormLayoutContext {
  layout?: 'vertical' | 'horizontal'
  labelAlign?: 'left' | 'right'
  labelWidth?: number | string
  size?: 'small' | 'middle' | 'large'
}

export const FormLayoutKey: InjectionKey<IFormLayoutContext> =
  Symbol('DFormLayout')
