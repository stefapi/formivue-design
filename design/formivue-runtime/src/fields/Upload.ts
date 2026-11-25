import type { Component } from 'vue'
import { connect, mapReadPretty } from '@formivue/vue'
import {
  Upload as DUpload,
  UploadDragger as DUploadDragger,
} from '@formivue-design/vue-ui'
import { PreviewText } from '../preview-text'

export const Upload: Component & { Dragger?: Component } = connect(
  DUpload,
  mapReadPretty(PreviewText.Upload as any),
) as any

Upload.Dragger = connect(
  DUploadDragger,
  mapReadPretty(PreviewText.Upload as any),
) as any
