import { computed, defineComponent, h, ref, watchEffect } from 'vue'

export type Language = 'en' | 'fr' | 'es'
export type Message = readonly [
  english: string,
  french: string,
  spanish: string,
]

const storageKey = 'formivue-example-language'
const languages = ['en', 'fr', 'es'] as const
const names = ['English', 'Français', 'Español']
export const localeTags = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' }

function supported(value?: string | null): Language | undefined {
  const code = value?.toLowerCase().split('-')[0]
  return languages.find((language) => language === code)
}

function initialLanguage() {
  try {
    const saved = supported(window.localStorage.getItem(storageKey))
    if (saved) return saved
  } catch {
    // Storage may be unavailable in an embedded example.
  }
  return (
    (globalThis.navigator?.languages ?? []).map(supported).find(Boolean) ?? 'en'
  )
}

const current = ref<Language>(initialLanguage())
export const exampleLanguage = computed(() => current.value)
export const exampleLocale = computed(() => localeTags[current.value])

export function message(
  text: Message,
  params?: Record<string, string | number>,
) {
  return messageFor(current.value, text, params)
}

export function messageFor(
  language: Language,
  text: Message,
  params?: Record<string, string | number>,
) {
  const translated = text[languages.indexOf(language)]
  return params
    ? translated.replace(/\{(\w+)\}/gu, (placeholder, key) =>
        Object.prototype.hasOwnProperty.call(params, key)
          ? String(params[key])
          : placeholder,
      )
    : translated
}

export function syncExampleLanguage(
  title?: Message,
  onChange?: (locale: Language, tag: string) => void,
) {
  watchEffect(
    () => {
      document.documentElement.lang = current.value
      if (title) document.title = message(title)
      onChange?.(current.value, exampleLocale.value)
    },
    { flush: 'sync' },
  )
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    const selected = event.key === storageKey && supported(event.newValue)
    if (selected) current.value = selected
  })
}

export const LanguagePicker = defineComponent({
  name: 'ExampleLanguagePicker',
  setup() {
    return () =>
      h(
        'select',
        {
          value: current.value,
          'aria-label': message(['Language', 'Langue', 'Idioma']),
          class:
            'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
          onChange(event: Event) {
            const selected = supported(
              (event.target as HTMLSelectElement).value,
            )
            if (!selected) return
            current.value = selected
            try {
              window.localStorage.setItem(storageKey, selected)
            } catch {
              // The change still applies when storage is unavailable.
            }
          },
        },
        languages.map((language, index) =>
          h('option', { value: language, lang: language }, names[index]),
        ),
      )
  },
})

// Localize the presentation of shipped example schemas. Data values, schema
// property names and imported strings outside the catalog retain their meaning.
export function localize<T>(
  value: T,
  catalog: Readonly<Record<string, Message>>,
): T {
  if (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(catalog, value)
  )
    return message(catalog[value]) as T
  if (Array.isArray(value))
    return value.map((item) => localize(item, catalog)) as T
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key === 'default' || key === 'value' ? item : localize(item, catalog),
      ]),
    ) as T
  return value
}
