export type LocaleText<Text = string> = readonly [
  english: Text,
  french: Text,
  spanish: Text,
]

type SettingMessage =
  string | { title: string; dataSource?: string[]; placeholder?: string }

export const designerLanguages = ['en-US', 'fr-FR', 'es-ES'] as const

export const materialLocales = (
  title: LocaleText,
  settings: Record<string, LocaleText<SettingMessage>>,
) =>
  Object.fromEntries(
    designerLanguages.map((language, index) => [
      language,
      {
        title: title[index],
        settings: {
          'x-component-props': Object.fromEntries(
            Object.entries(settings).map(([key, label]) => [key, label[index]]),
          ),
        },
      },
    ]),
  )
