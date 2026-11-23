import {
  MonacoInput,
  getNpmCDNRegistry,
} from '@formivue-design/vue-settings-form'

export const initDeclaration = async () => {
  const monaco = await MonacoInput.loader.init()
  const { typescriptDefaults } = monaco.languages.typescript
  typescriptDefaults.addExtraLib(
    `
    import { Form, Field } from '@formivue/core'
    declare global {
      /*
       * Form Model
       **/
      var $form: Form
      /*
       * Form Values
       **/
      var $values: any
      /*
       * Field Model
       **/
      var $self: Field
      /*
       * create an persistent observable state object
       **/
      var $observable: <T>(target: T, deps?: any[]) => T
      /*
       * create a persistent data
       **/
      var $memo: <T>(callback: () => T, deps?: any[]) => T
      /*
       * handle side-effect logic
       **/
      var $effect: (callback: () => void | (() => void), deps?: any[]) => void
      /*
       * set initial component props to current field
       **/
      var $props: (props: any) => void
    }
    `,
    'file:///node_modules/formivue_global.d.ts',
  )

  const registry = getNpmCDNRegistry().replace(/^\/\//, 'https://')
  await Promise.all(
    ['core', 'shared', 'path', 'validator'].map(async (name) => {
      const response = await fetch(
        `${registry}/@formivue/${name}/dist/index.d.mts`,
      )
      if (response.ok) {
        typescriptDefaults.addExtraLib(
          await response.text(),
          `file:///node_modules/@formivue/${name}/index.d.ts`,
        )
      }
    }),
  )
}
