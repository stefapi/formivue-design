import type { Component } from 'vue'
import { connect, mapReadPretty } from '@formivue/vue'
import { Input as DInput, Textarea as DTextarea } from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Input: Component & { TextArea?: Component } = connect(
  DInput,
  mapReadPretty(PreviewText.Input as any),
) as any

Input.TextArea = connect(DTextarea, mapReadPretty(PreviewText.Input as any))
