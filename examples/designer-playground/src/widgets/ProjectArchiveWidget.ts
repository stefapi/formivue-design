import {
  defineComponent,
  h,
  onBeforeUnmount,
  shallowRef,
  type PropType,
} from 'vue'
import type { TreeNode } from '@formivue-design/core'
import { Button } from '@formivue-design/vue-ui'
import { message } from '../../../shared/language'
import { documentError } from '../../../shared/document-messages'
import { downloadJson } from '../service/download-json'
import type { DocumentProject } from '../service/document-project'
import type { DocumentProjectArchive } from '../service/document-project-archive'

const importTitle = [
  'Import project',
  'Importer le projet',
  'Importar proyecto',
] as const

export const ProjectArchiveWidget = defineComponent({
  name: 'ProjectArchiveWidget',
  props: {
    tree: { type: Object as PropType<TreeNode>, required: true },
    model: { type: Object as PropType<DocumentProject>, required: true },
    onImport: {
      type: Function as PropType<(archive: DocumentProjectArchive) => void>,
      required: true,
    },
  },
  setup(props) {
    const input = shallowRef<HTMLInputElement>()
    const pending = shallowRef<{
      name: string
      archive: DocumentProjectArchive
    }>()
    const error = shallowRef<unknown>()
    const imported = shallowRef(false)
    let read = 0
    onBeforeUnmount(() => {
      read++
    })

    async function readFile(event: Event) {
      const picker = event.target as HTMLInputElement
      const file = picker.files?.[0]
      picker.value = ''
      if (!file) return
      const revision = ++read
      pending.value = undefined
      error.value = undefined
      imported.value = false
      try {
        const contents = await file.text()
        if (revision === read)
          pending.value = {
            name: file.name,
            archive: props.model.readArchive(contents),
          }
      } catch (cause) {
        if (revision === read) error.value = cause
      }
    }

    return () =>
      h('div', { class: 'grid gap-2' }, [
        h('div', { class: 'flex flex-wrap gap-2' }, [
          h(
            Button,
            {
              size: 'small',
              onClick: () => {
                try {
                  downloadJson(
                    'formivue.project.json',
                    props.model.exportArchive(props.tree.serialize()),
                  )
                  error.value = undefined
                } catch (cause) {
                  error.value = cause
                }
              },
            },
            () =>
              message([
                'Export project',
                'Exporter le projet',
                'Exportar proyecto',
              ]),
          ),
          h(
            Button,
            { size: 'small', onClick: () => input.value?.click() },
            () => message(importTitle),
          ),
          h('input', {
            ref: input,
            type: 'file',
            accept: '.json,application/json',
            hidden: true,
            'aria-label': message(importTitle),
            onChange: readFile,
          }),
        ]),
        pending.value
          ? h('div', { class: 'grid gap-2 rounded-md border p-3 text-sm' }, [
              h(
                'p',
                { class: 'break-words' },
                message(
                  [
                    'Open {file} and replace the current canvas, variants and drafts?',
                    'Ouvrir {file} et remplacer le canevas, les variantes et les brouillons actuels ?',
                    '¿Abrir {file} y reemplazar el lienzo, las variantes y los borradores actuales?',
                  ],
                  { file: pending.value.name },
                ),
              ),
              h('div', { class: 'flex flex-wrap gap-2' }, [
                h(
                  Button,
                  {
                    size: 'small',
                    type: 'primary',
                    onClick: () => {
                      try {
                        props.onImport(pending.value.archive)
                        pending.value = undefined
                        error.value = undefined
                        imported.value = true
                      } catch (cause) {
                        error.value = cause
                      }
                    },
                  },
                  () =>
                    message([
                      'Open project',
                      'Ouvrir le projet',
                      'Abrir proyecto',
                    ]),
                ),
                h(
                  Button,
                  {
                    size: 'small',
                    onClick: () => {
                      pending.value = undefined
                    },
                  },
                  () =>
                    message([
                      'Cancel import',
                      'Annuler l’import',
                      'Cancelar importación',
                    ]),
                ),
              ]),
            ])
          : null,
        error.value
          ? h(
              'p',
              {
                role: 'alert',
                class:
                  'whitespace-pre-wrap break-words text-sm text-destructive',
              },
              documentError(error.value),
            )
          : null,
        imported.value
          ? h(
              'p',
              { role: 'status', class: 'text-sm' },
              message([
                'Project imported',
                'Projet importé',
                'Proyecto importado',
              ]),
            )
          : null,
      ])
  },
})
