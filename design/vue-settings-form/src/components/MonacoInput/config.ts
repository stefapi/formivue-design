// vue-settings-form — MonacoInput/config (port de l'ère). Écart assumé :
// `@monaco-editor/react` (React) disparaît — le loader framework-agnostic
// `@monaco-editor/loader` est conservé (décision 5.1 du plan) ; initMonaco
// définit les thèmes (monokai/chrome-devtools), les options compilateur TS
// et le provider de formatage document (via model['getDesignerLanguage']).
import loader from '@monaco-editor/loader'
import chromeTheme from './themes/chrome'
import monokaiTheme from './themes/monokai'
import { format } from './format'

let initialized = false

export const initMonaco = () => {
  if (initialized) return
  loader.init().then((monaco: any) => {
    monaco.editor.defineTheme('monokai', monokaiTheme as any)
    monaco.editor.defineTheme('chrome-devtools', chromeTheme as any)
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: true,
    })
    monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      async provideDocumentFormattingEdits(model: any) {
        return [
          {
            text: await format(
              model['getDesignerLanguage']?.() || 'typescript',
              model.getValue(),
            ),
            range: model.getFullModelRange(),
          },
        ]
      },
    })
    initialized = true
  })
}
