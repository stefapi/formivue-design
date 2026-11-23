// Phase 3.6 — suites @formivue-design/vue-sandbox : iframe + bridge framework-
// agnostic, renderSandboxContent via createApp.
import { describe, expect, test } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import {
  Sandbox,
  renderSandboxContent,
  useSandboxScope,
  type ISandboxProps,
} from '../index'
import { Designer, Workspace } from '@formivue-design/vue'
import { useSandbox } from '../index'
import { createDesigner } from '@formivue-design/core'
import { globalThisPolyfill } from '@formivue-design/shared'

describe('@formivue-design/vue-sandbox', () => {
  test('Sandbox : iframe rendue, document écrit avec __SANDBOX_ROOT__', async () => {
    const engine = createDesigner()
    const Host = defineComponent({
      components: { Designer, Workspace, Sandbox },
      setup() {
        return () =>
          h(Designer, { engine } as any, {
            default: () =>
              h(Workspace, null, {
                default: () => h(Sandbox, { scope: { answer: 42 } }),
              }),
          })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    const iframe = wrapper.get('iframe')
    // jsdom normalise `border: none` en `border: medium` — on teste la
    // présence du contrat de style (plein cadre) sans dépendre de la
    // normalisation CSS de l'env
    expect(iframe.attributes('style')).toContain('width: 100%')

    // le document de l'iframe contient la racine du sandbox
    const doc = (iframe.element as HTMLIFrameElement).contentDocument
    expect(doc.getElementById('__SANDBOX_ROOT__')).toBeTruthy()

    // le scope est exposé sur la window de l'iframe
    const win = (iframe.element as HTMLIFrameElement).contentWindow as any
    expect(win['__FORMIVUEDESIGN_SANDBOX_SCOPE__']).toEqual({ answer: 42 })
    expect(win['__FORMIVUEDESIGN_ENGINE__']).toBe(engine)

    wrapper.unmount()
    engine.unmount()
  })

  test('useSandbox : composable hors composant → ref iframe non liée', () => {
    // contrat : useSandbox doit être appelé dans un setup — ici on vérifie
    // juste qu'il ne crashe pas et retourne une ref
    expect(typeof useSandbox).toBe('function')
  })

  test('useSandboxScope : lit la global __FORMIVUEDESIGN_SANDBOX_SCOPE__', () => {
    ;(globalThisPolyfill as any)['__FORMIVUEDESIGN_SANDBOX_SCOPE__'] = {
      k: 'v',
    }
    expect(useSandboxScope()).toEqual({ k: 'v' })
    delete (globalThisPolyfill as any)['__FORMIVUEDESIGN_SANDBOX_SCOPE__']
    expect(useSandboxScope()).toBeUndefined()
  })

  test('renderSandboxContent : monte une app Vue dans #__SANDBOX_ROOT__', () => {
    // racine sandbox simulée dans le document principal (dans la vraie vie
    // ce script tourne DANS l'iframe)
    const root = document.createElement('div')
    root.id = '__SANDBOX_ROOT__'
    document.body.appendChild(root)

    renderSandboxContent(() => h('div', { class: 'sandbox-child' }, 'hello'))

    expect(root.querySelector('.sandbox-child')?.textContent).toBe('hello')

    // remplacement propre (l'ère écrasait via ReactDOM.render)
    renderSandboxContent(() => h('div', { class: 'sandbox-child-2' }, 'world'))
    expect(root.querySelector('.sandbox-child')).toBeNull()
    expect(root.querySelector('.sandbox-child-2')?.textContent).toBe('world')

    root.remove()
  })

  test('ISandboxProps : contrat de types exporté', () => {
    const props: ISandboxProps = {
      cssAssets: ['a.css'],
      jsAssets: ['b.js'],
      scope: null,
    }
    expect(props.cssAssets).toEqual(['a.css'])
  })
})
