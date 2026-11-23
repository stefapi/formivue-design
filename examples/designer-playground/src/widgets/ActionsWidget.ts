// Phase 7 (7.1) — port de formivue/antd/playground/widgets/ActionsWidget :
// sélecteur de langue (Radio vue-ui — Radio.Group antd d'ère), lien Github,
// Save/Publish → saveSchema (service, localStorage). Écarts V1 documentés :
// Space/Button/Radio antd + GithubOutlined → vue-ui + lucide ; le toast
// `message.success` antd devient un indicateur « Saved » inline (tokens V6).
import { defineComponent, h, onMounted, ref } from 'vue'
import { observer } from '@formivue/reactive-vue'
import { GlobalRegistry } from '@formivue-design/core'
import { useDesigner, TextWidget } from '@formivue-design/vue'
import { Button, Radio } from '@formivue-design/vue-ui'
// lucide a retiré les icônes de marque (@lucide/vue n'expose plus Github) :
// SVG inline du tracé d'origine lucide — mêmes attrs qu'une icône lucide.
const Github = defineComponent({
  name: 'LucideGithub',
  setup: () => () =>
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [
        h('path', {
          d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
        }),
        h('path', { d: 'M9 18c-4.51 2-5-2-7-2' }),
      ],
    ),
})
import { loadInitialSchema, saveSchema } from '../service'

export const ActionsWidget = observer(
  defineComponent({
    name: 'ActionsWidget',
    props: { advanced: Boolean },
    setup(props) {
      const designer = useDesigner()
      const saved = ref(false)
      let savedTimer: ReturnType<typeof setTimeout>
      onMounted(() => {
        loadInitialSchema(designer, props.advanced)
        const supportLocales = ['en-us', 'fr-fr', 'es-es']
        if (!supportLocales.includes(GlobalRegistry.getDesignerLanguage())) {
          GlobalRegistry.setDesignerLanguage('en-us')
        }
      })
      const onSave = () => {
        saveSchema(designer, props.advanced)
        saved.value = true
        clearTimeout(savedTimer)
        savedTimer = setTimeout(() => (saved.value = false), 1500)
      }
      const modeUrl = (advanced: boolean) => {
        const url = new URL(window.location.href)
        if (advanced) url.searchParams.set('mode', 'advanced')
        else url.searchParams.delete('mode')
        return url.href
      }
      return () =>
        h('div', { class: 'mr-2 flex items-center gap-2' }, [
          h(
            'nav',
            {
              'aria-label': 'Designer mode',
              class: 'flex gap-1 rounded-md border p-0.5',
            },
            [false, true].map((advanced) =>
              h(
                'a',
                {
                  href: modeUrl(advanced),
                  'aria-current':
                    props.advanced === advanced ? 'page' : undefined,
                  class: [
                    'rounded px-2 py-1 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                    props.advanced === advanced &&
                      'bg-accent text-accent-foreground',
                  ],
                  onClick: () => saveSchema(designer, props.advanced),
                },
                advanced ? 'Advanced' : 'Standard',
              ),
            ),
          ),
          h(Radio, {
            class: 'text-xs',
            options: [
              { label: 'English', value: 'en-us' },
              { label: 'Français', value: 'fr-fr' },
              { label: 'Español', value: 'es-es' },
            ],
            value: GlobalRegistry.getDesignerLanguage(),
            onChange: (value: string | number) =>
              GlobalRegistry.setDesignerLanguage(String(value)),
          }),
          h(
            'a',
            {
              href: 'https://github.com/stefapi/formivue-design',
              target: '_blank',
              class:
                'inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            },
            [h(Github, { class: 'size-4' }), 'Github'],
          ),
          h(
            Button,
            { onClick: onSave },
            { default: () => h(TextWidget, { token: 'Save' }) },
          ),
          h(
            Button,
            { type: 'primary', onClick: onSave },
            { default: () => h(TextWidget, { token: 'Publish' }) },
          ),
          saved.value
            ? h(
                'span',
                { class: 'text-xs text-muted-foreground', role: 'status' },
                h(TextWidget, { token: 'saved', defaultMessage: 'Saved ✓' }),
              )
            : null,
        ])
    },
  }) as any,
) as any
