import { defineComponent } from 'vue'
import { isStr, isPlainObj } from '@formivue-design/shared'
import { GlobalRegistry, IDesignerMiniLocales } from '@formivue-design/core'
import { observer } from '@formivue/reactive-vue'

export interface ITextWidgetProps {
  componentName?: string
  sourceName?: string
  token?: string | IDesignerMiniLocales
  defaultMessage?: string | IDesignerMiniLocales
}

// Port §1.5 : l'ère passait le token par children — Vue expose les slots en
// fonctions, un objet de locales ne survit pas en children. Le contrat d'ère
// est conservé à l'identique via la prop `token` (children ≡ token dans
// l'implémentation d'ère : même takeMessage) ; le slot default accepte
// toujours un token texte.
export const TextWidget = observer(
  defineComponent({
    name: 'TextWidget',
    props: {
      componentName: { type: String, default: undefined },
      sourceName: { type: String, default: undefined },
      token: {
        type: [String, Object] as any,
        default: undefined,
      },
      defaultMessage: {
        type: [String, Object] as any,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const takeLocale = (message: string | IDesignerMiniLocales): any => {
        if (isStr(message)) return message
        if (isPlainObj(message)) {
          const lang = GlobalRegistry.getDesignerLanguage()
          for (let key in message) {
            if (key.toLocaleLowerCase() === lang) return message[key]
          }
          return
        }
        return message
      }
      const takeMessage = (token: any) => {
        if (!token) return
        const message = isStr(token)
          ? GlobalRegistry.getDesignerMessage(token)
          : token
        if (message) return takeLocale(message)
        return token
      }
      return () => {
        const slotContent = slots.default?.()
        // slot texte : Vue normalise les children en tableau — un token texte
        // arrive en tableau à un élément ou en chaîne brute
        const tokenFromSlot = Array.isArray(slotContent)
          ? slotContent[0]
          : slotContent
        const children =
          typeof tokenFromSlot === 'string' ? tokenFromSlot : undefined
        return (
          takeMessage(children) ||
          takeMessage(props.token) ||
          takeMessage(props.defaultMessage) ||
          slotContent ||
          null
        )
      }
    },
  }),
)
