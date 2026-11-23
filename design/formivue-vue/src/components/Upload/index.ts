// formivue/vue — Upload + Upload.Dragger (matériau d'ère, V3 backlog levé :
// Upload maison vue-ui — input file natif, envoi XHR si `action`).
import type { Component } from 'vue'
import { connect, mapReadPretty } from '@formivue/vue'
import {
  Upload as DUpload,
  UploadDragger as DUploadDragger,
} from '@formivue-design/vue-ui'
import { createBehavior, createResource } from '@formivue-design/core'
import type { DnFC } from '@formivue-design/vue'
import { PreviewText } from '../../preview-text'
import { createFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'

export const Upload: DnFC<any> & { Dragger?: Component } = connect(
  DUpload,
  mapReadPretty(PreviewText.Upload as any),
) as any

Upload.Dragger = connect(
  DUploadDragger,
  mapReadPretty(PreviewText.Upload as any),
) as any

Upload.Behavior = createBehavior(
  {
    name: 'Upload',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'Upload',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.Upload),
    },
    designerLocales: AllLocales.Upload,
  },
  {
    name: 'Upload.Dragger',
    extends: ['Field'],
    selector: (node) => node.props['x-component'] === 'Upload.Dragger',
    designerProps: {
      propsSchema: createFieldSchema(AllSchemas.Upload.Dragger!),
    },
    designerLocales: AllLocales.UploadDragger,
  },
)

Upload.Resource = createResource(
  {
    icon: 'UploadSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'Array<object>',
          title: 'Upload',
          'x-decorator': 'FormItem',
          'x-component': 'Upload',
          'x-component-props': {
            textContent: 'Upload',
          },
        },
      },
    ],
  },
  {
    icon: 'UploadDraggerSource',
    elements: [
      {
        componentName: 'Field',
        props: {
          type: 'Array<object>',
          title: 'Drag Upload',
          'x-decorator': 'FormItem',
          'x-component': 'Upload.Dragger',
          'x-component-props': {
            textContent: 'Click or drag file to this area to upload',
          },
        },
      },
    ],
  },
)
