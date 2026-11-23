import { GlobalRegistry } from '@formivue-design/core'
import { chartLanguageIndex } from '@formivue-design/charts-runtime'
import type { LocaleText } from '../locales/shared'

export const text = (labels: LocaleText) =>
  labels[chartLanguageIndex(GlobalRegistry.getDesignerLanguage())]
