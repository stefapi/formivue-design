// vue-settings-form — ImageInput / BackgroundImageInput (port de l'ère).
// Écart documenté (V1) : antd Upload (React) → upload **maison** headless —
// input file natif + POST multipart vers `uploadAction` (lu du
// SettingsFormContext) ; en l'absence de serveur, l'image est intégrée
// au schéma sous forme d'URL de données.
import { defineComponent, h, inject, ref, type PropType } from 'vue'
import { Input } from '@formivue-design/vue-ui'
import { usePrefix, IconWidget } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { SettingsFormContext } from '../../shared/context'
import cls from 'classnames'

export interface ImageInputProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
}

export const ImageInput = defineComponent({
  name: 'DImageInput',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('image-input')
    // inject au setup (l'ère lisait le contexte au rendu ; le provider est
    // monté par SettingsForm au-dessus — résolution setup équivalente)
    const context = inject(SettingsFormContext, null)
    const fileInput = ref<HTMLInputElement>()
    const upload = async (file: File) => {
      const uploadAction = context?.uploadAction
      if (!uploadAction) {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') props.onChange?.(reader.result)
        }
        reader.readAsDataURL(file)
        return
      }
      const data = new FormData()
      data.append('file', file)
      try {
        const response = await fetch(uploadAction, {
          method: 'POST',
          body: data,
        })
        const json = await response.json().catch(() => null)
        const url =
          json?.url || json?.downloadURL || json?.imageURL || json?.thumbUrl
        if (!url) return
        props.onChange?.(url)
      } catch {
        // réseau indisponible : l'ère (antd Upload) restait silencieuse aussi
      }
    }
    return () =>
      h(
        'div',
        {
          class: cls(
            prefix,
            'flex w-full items-center gap-1',
            attrs.class as string,
          ),
          style: attrs.style as any,
        },
        [
          h(
            'button',
            {
              type: 'button',
              class: cls(
                prefix + '-upload',
                'flex h-8 shrink-0 cursor-pointer items-center px-2 text-foreground',
              ),
              'aria-label':
                GlobalRegistry.getDesignerMessage(
                  'SettingComponents.ImageInput.uploadImage',
                ) || 'Upload image',
              onClick: () => fileInput.value?.click(),
            },
            [h(IconWidget, { infer: 'CloudUpload' })],
          ),
          h('input', {
            ref: fileInput,
            type: 'file',
            class: 'hidden',
            'aria-hidden': 'true',
            tabindex: '-1',
            onChange: (e: Event) => {
              const input = e.target as HTMLInputElement
              const file = input.files?.[0]
              if (file) upload(file)
              input.value = ''
            },
          }),
          h(Input, {
            value: props.value,
            placeholder: props.placeholder,
            onChange: (value: string) => {
              props.onChange?.(value)
            },
          }),
        ],
      )
  },
})

export const BackgroundImageInput = defineComponent({
  name: 'DBackgroundImageInput',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(value: string) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const addBgValue = (value: any) => {
      if (/url\([^)]+\)/.test(value)) {
        return value
      }
      return `url(${value})`
    }
    const removeBgValue = (value: any) => {
      const matched = String(value).match(/url\(\s*([^)]+)\s*\)/)
      if (matched?.[1]) {
        return matched?.[1]
      }
      return value
    }
    return () =>
      h(ImageInput as any, {
        value: removeBgValue(props.value),
        onChange: (url: string) => {
          props.onChange?.(addBgValue(url))
        },
      })
  },
})
