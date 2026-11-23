// vue-settings-form — MonacoInput (port de l'ère).
// Écart structurel documenté (5.3) : `@monaco-editor/react` est **React**
// → wrapper **Vue maison** (DMonacoEditor : create/setValue/dispose/onMount)
// sur le loader framework-agnostic `@monaco-editor/loader` (conservé).
// Thèmes (monokai/chrome-devtools), validation babel (markers/decorations),
// submit debounce 1s, extraLib, helpLink/helpCode : logique d'ère portée à
// l'identique — useRef → closures, useState → ref (loaded).
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type VNode,
} from 'vue'
import loader from '@monaco-editor/loader'
import type * as monacoEditor from 'monaco-editor'
import { parseExpression, parse } from '@babel/parser'
import { observer } from '@formivue/reactive-vue'
import {
  TextWidget,
  IconWidget,
  usePrefix,
  useLayout,
} from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import { Tooltip } from '@formivue-design/vue-ui'
import { uid } from '@formivue-design/shared'
import { format } from './format'
import cls from 'classnames'
import { initMonaco } from './config'

export type Monaco = typeof monacoEditor

export interface MonacoInputProps {
  helpLink?: string | boolean
  helpCode?: string
  helpCodeViewWidth?: number | string
  extraLib?: string
  value?: string
  defaultValue?: string
  language?: string
  defaultLanguage?: string
  width?: number | string
  height?: number | string
  options?: Record<string, any>
  onChange?: (value: string) => void
  onMount?: (editor: any, monaco: Monaco) => void
}

// ---------------------------------------------------------------------------
// Wrapper Vue remplaçant l'Editor de @monaco-editor/react : crée l'éditeur
// au montage (via loader.init), synchronise `value`, expose onMount(editor,
// monaco), dispose au démontage. Le listener de contenu est câblé par
// MonacoInput (via onMount), comme en ère.
// ---------------------------------------------------------------------------
const MonacoEditor = defineComponent({
  name: 'DMonacoEditor',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
    language: { type: String, default: undefined },
    defaultLanguage: { type: String, default: undefined },
    theme: { type: String, default: undefined },
    options: { type: Object, default: undefined },
    width: { type: [String, Number], default: undefined },
    height: { type: [String, Number], default: undefined },
    onMount: {
      type: null as unknown as PropType<(editor: any, monaco: Monaco) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const container = ref<HTMLDivElement>()
    let editor: monacoEditor.editor.IStandaloneCodeEditor | null = null
    let monacoInstance: Monaco | null = null
    onMounted(async () => {
      initMonaco()
      monacoInstance = (await loader.init()) as unknown as Monaco
      if (!container.value) return
      editor = monacoInstance.editor.create(container.value, {
        value: props.value ?? props.defaultValue ?? '',
        language: props.language ?? props.defaultLanguage,
        theme: props.theme,
        ...(props.options ?? {}),
      } as any)
      props.onMount?.(editor, monacoInstance)
    })
    watch(
      () => props.value,
      (value) => {
        if (
          editor &&
          value !== undefined &&
          value !== (editor as any).getValue()
        ) {
          ;(editor as any).setValue(value)
        }
      },
    )
    onBeforeUnmount(() => {
      editor?.dispose()
      editor = null
    })
    return () =>
      h('div', {
        ref: container,
        style: {
          width:
            typeof props.width === 'number' ? `${props.width}px` : props.width,
          height:
            typeof props.height === 'number'
              ? `${props.height}px`
              : props.height,
        },
      })
  },
})

const MonacoInputInternal = observer(
  defineComponent({
    name: 'DMonacoInput',
    inheritAttrs: false,
    props: {
      helpLink: { type: [String, Boolean], default: undefined },
      helpCode: { type: String, default: undefined },
      helpCodeViewWidth: { type: [Number, String], default: undefined },
      extraLib: { type: String, default: undefined },
      value: { type: String, default: undefined },
      defaultValue: { type: String, default: undefined },
      language: { type: String, default: undefined },
      defaultLanguage: { type: String, default: undefined },
      width: { type: [String, Number], default: undefined },
      height: { type: [String, Number], default: undefined },
      options: { type: Object, default: undefined },
      onChange: {
        type: null as unknown as PropType<(value: string) => void>,
        default: undefined,
      },
      onMount: {
        type: null as unknown as PropType<
          (editor: any, monaco: Monaco) => void
        >,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const loaded = ref(false)
      // layout (préfixe/thème) — lu au rendu via l'observer (useTheme d'ère
      // était lu à chaque rendu React ; le layout est un observable formivue)
      const layout = useLayout()
      // useRef d'ère → closures (aucun n'est rendu — seul `loaded` l'est)
      let valueRef = ''
      let validateRef: any = null
      let submitRef: any = null
      let declarationRef: string[] = []
      let extraLibRef: { dispose: () => void } = null
      let monacoRef: any = null
      let editorRef: any = null
      let computedLanguage = props.language || props.defaultLanguage
      let realLanguage = ''
      let unmountedRef = false
      const uidRef = uid()
      const prefix = usePrefix('monaco-input')
      const input = computed(() => props.value || props.defaultValue)

      onMounted(() => {
        unmountedRef = false
        initMonaco()
      })
      onBeforeUnmount(() => {
        clearTimeout(validateRef)
        clearTimeout(submitRef)
        if (extraLibRef) {
          extraLibRef.dispose()
        }
        unmountedRef = true
      })

      watch(
        () => props.extraLib,
        () => {
          if (monacoRef && props.extraLib) {
            updateExtraLib()
          }
        },
      )

      const updateExtraLib = () => {
        if (extraLibRef) {
          extraLibRef.dispose()
        }
        extraLibRef =
          monacoRef.languages.typescript.typescriptDefaults.addExtraLib(
            props.extraLib,
            `${uidRef}.d.ts`,
          )
      }

      const isFileLanguage = () => {
        const lang = computedLanguage
        return lang === 'javascript' || lang === 'typescript'
      }

      const isExpLanguage = () => {
        const lang = computedLanguage
        return (
          lang === 'javascript.expression' || lang === 'typescript.expression'
        )
      }

      const renderHelper = () => {
        const getHref = () => {
          if (typeof props.helpLink === 'string') return props.helpLink
          if (isFileLanguage() || isExpLanguage()) {
            return 'https://github.com/mdn/content/tree/main/files/en-us/web/javascript'
          }
        }
        if (props.helpLink === false) return null
        const href = getHref()
        return (
          href &&
          h(
            Tooltip,
            {},
            {
              default: () =>
                h(
                  'div',
                  {
                    class: cls(
                      prefix + '-helper',
                      'absolute bottom-2.5 right-[5%] z-[2]',
                    ),
                  },
                  [
                    h(
                      'a',
                      {
                        target: '_blank',
                        href,
                        rel: 'noreferrer',
                        // a11y (V8, règle 7) : lien icône seule → nom accessible
                        // (token d'ère « helpDocument », fallback littéral)
                        'aria-label':
                          String(
                            GlobalRegistry.getDesignerMessage(
                              'SettingComponents.MonacoInput.helpDocument',
                            ) ?? 'Help document',
                          ) || 'Help document',
                      },
                      [h(IconWidget, { infer: 'Help' })] as VNode[],
                    ),
                  ],
                ),
              content: () =>
                h(TextWidget, {
                  token: 'SettingComponents.MonacoInput.helpDocument',
                }),
            },
          )
        )
      }

      const onMountHandler = (editor: any, monaco: any) => {
        editorRef = editor
        monacoRef = monaco
        props.onMount?.(editor, monaco)
        const model = editor.getModel()
        const currentValue = editor.getValue()
        model['getDesignerLanguage'] = () => computedLanguage
        if (currentValue) {
          format(computedLanguage, currentValue)
            .then((content) => {
              editor.setValue(content)
              loaded.value = true
            })
            .catch(() => {
              loaded.value = true
            })
        } else {
          loaded.value = true
        }
        if (props.extraLib) {
          updateExtraLib()
        }
        editor.onDidChangeModelContent(() => {
          onChangeHandler(editor.getValue())
        })
      }

      const submit = () => {
        clearTimeout(submitRef)
        submitRef = setTimeout(() => {
          if (!unmountedRef) {
            props.onChange?.(valueRef)
          }
        }, 1000)
      }

      const validate = () => {
        if (realLanguage === 'typescript') {
          clearTimeout(validateRef)
          validateRef = setTimeout(() => {
            try {
              if (valueRef) {
                if (isFileLanguage()) {
                  parse(valueRef, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx'],
                  })
                } else if (isExpLanguage()) {
                  parseExpression(valueRef, {
                    plugins: ['typescript', 'jsx'],
                  })
                }
              }
              monacoRef.editor.setModelMarkers(
                editorRef.getModel(),
                computedLanguage,
                [],
              )
              declarationRef = editorRef.deltaDecorations(declarationRef, [
                {
                  range: new monacoRef.Range(1, 1, 1, 1),
                  options: {},
                },
              ])
              submit()
            } catch (e: any) {
              declarationRef = editorRef.deltaDecorations(declarationRef, [
                {
                  range: new monacoRef.Range(
                    e.loc.line,
                    e.loc.column,
                    e.loc.line,
                    e.loc.column,
                  ),
                  options: {
                    isWholeLine: true,
                    glyphMarginClassName: 'monaco-error-highline',
                  },
                },
              ])
              monacoRef.editor.setModelMarkers(
                editorRef.getModel(),
                computedLanguage,
                [
                  {
                    code: '1003',
                    severity: 8,
                    startLineNumber: e.loc.line,
                    startColumn: e.loc.column,
                    endLineNumber: e.loc.line,
                    endColumn: e.loc.column,
                    message: e.message,
                  },
                ],
              )
            }
          }, 240)
        } else {
          submit()
        }
      }

      const onChangeHandler = (value: string) => {
        valueRef = value
        validate()
      }

      const renderHelpCode = () => {
        if (!props.helpCode) return null
        return h(
          'div',
          {
            class: cls(prefix + '-view', 'h-full min-w-0 grow-[2]'),
            style: { width: props.helpCodeViewWidth || '50%' },
          },
          [
            h(MonacoEditor, {
              value: props.helpCode,
              theme: layout?.theme === 'dark' ? 'monokai' : 'chrome-devtools',
              defaultLanguage: realLanguage,
              language: realLanguage,
              options: {
                ...(props.options ?? {}),
                lineNumbers: 'off',
                readOnly: true,
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                minimap: {
                  enabled: false,
                },
                tabSize: 2,
                smoothScrolling: true,
                scrollbar: {
                  verticalScrollbarSize: 5,
                  horizontalScrollbarSize: 5,
                  alwaysConsumeMouseWheel: false,
                },
              },
              width: '100%',
              height: '100%',
            }),
          ],
        )
      }

      return () => {
        computedLanguage = props.language || props.defaultLanguage
        realLanguage = /(?:javascript|typescript)/gi.test(
          computedLanguage || '',
        )
          ? 'typescript'
          : computedLanguage
        return h(
          'div',
          {
            // structure d'ère (MonacoInput/styles.less) : flex plein cadre,
            // fondu à l'apparition (opacity 0 → 1 une fois chargé)
            class: cls(
              prefix,
              'relative flex h-full w-full transition-opacity duration-150',
              loaded.value ? 'loaded opacity-100' : 'opacity-0',
              attrs.class as string,
            ),
            style: {
              width:
                typeof props.width === 'number'
                  ? `${props.width}px`
                  : props.width,
              height:
                typeof props.height === 'number'
                  ? `${props.height}px`
                  : props.height,
            } as any,
          },
          [
            renderHelper(),
            h(
              'div',
              { class: cls(prefix + '-view', 'h-full min-w-0 grow-[2]') },
              [
                h(MonacoEditor, {
                  theme:
                    layout?.theme === 'dark' ? 'monokai' : 'chrome-devtools',
                  defaultLanguage: realLanguage,
                  language: realLanguage,
                  options: {
                    glyphMargin: true,
                    ...(props.options ?? {}),
                    tabSize: 2,
                    smoothScrolling: true,
                    scrollbar: {
                      verticalScrollbarSize: 5,
                      horizontalScrollbarSize: 5,
                      alwaysConsumeMouseWheel: false,
                    },
                  },
                  value: input.value,
                  width: '100%',
                  height: '100%',
                  onMount: onMountHandler,
                }),
              ],
            ),
            renderHelpCode(),
          ],
        )
      }
    },
  }) as any,
)

export const MonacoInput = MonacoInputInternal as typeof MonacoInputInternal & {
  loader: typeof loader
}

MonacoInput.loader = loader
