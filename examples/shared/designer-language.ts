import { syncExampleLanguage, type Message } from './language'

export function syncDesignerLanguage(
  registry: { setDesignerLanguage(language: string): void },
  title?: Message,
) {
  syncExampleLanguage(title, (_code, tag) =>
    registry.setDesignerLanguage(tag.toLowerCase()),
  )
}
