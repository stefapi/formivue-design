// @formivue-design/vue-ui — composite — Upload / UploadDragger (maison, V3 backlog
// levé) : input file natif. Valeur = liste de fichiers au format antd
// (`{ uid, name, size, type, status, percent, url, response }`).
// Avec `action` : envoi XHR (multipart, `name`, `data`, `headers`,
// `withCredentials`, `method`) avec progression ; sans `action` : fichier
// gardé localement (URL blob) — utile en conception / aperçu.
// `listType` : text | picture | picture-card. `maxCount` garde les N derniers.
// a11y : déclencheur bouton natif, zone de dépôt focusable (Entrée/Espace
// ouvre le sélecteur), liste de fichiers avec boutons « Remove » nommés.
import { defineComponent, h, ref, type PropType } from 'vue'
import {
  CloudUpload,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Upload as UploadIcon,
} from '@lucide/vue'
import { UiButton } from '../ui/button'
import { cn } from '../lib/utils'

export type UploadStatus = 'uploading' | 'done' | 'error' | 'removed'

export interface IUploadFile {
  uid: string
  name: string
  size?: number
  type?: string
  status?: UploadStatus
  percent?: number
  url?: string
  response?: any
  error?: string
}

let uidSeed = 0
const createUid = () => `dn-upload-${Date.now()}-${++uidSeed}`

const isImage = (file: IUploadFile) =>
  /^image\//.test(file.type ?? '') ||
  /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.url ?? file.name)

const uploadProps = {
  value: { type: Array as PropType<IUploadFile[]>, default: undefined },
  onChange: {
    type: Function as PropType<(files: IUploadFile[]) => void>,
    default: undefined,
  },
  action: { type: String, default: undefined },
  method: { type: String, default: 'POST' },
  name: { type: String, default: 'file' },
  data: { type: Object as PropType<Record<string, any>>, default: undefined },
  headers: {
    type: Object as PropType<Record<string, string>>,
    default: undefined,
  },
  withCredentials: { type: Boolean, default: false },
  accept: { type: String, default: undefined },
  multiple: { type: Boolean, default: false },
  directory: { type: Boolean, default: false },
  maxCount: { type: Number, default: undefined },
  listType: {
    type: String as PropType<'text' | 'picture' | 'picture-card'>,
    default: 'text',
  },
  showUploadList: { type: Boolean, default: true },
  textContent: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
}

// logique commune : file d'envoi, mises à jour immuables de la liste
const useUploader = (props: any, emit: (e: 'update:value', v: any) => void) => {
  const input = ref<HTMLInputElement>()
  // la liste vivante (les XHR la modifient après le premier rendu)
  let files: IUploadFile[] = []

  const sync = () => {
    files = [...(props.value ?? [])]
  }
  const commit = (next: IUploadFile[]) => {
    files = next
    emit('update:value', next)
    props.onChange?.(next)
  }
  const patch = (uid: string, changes: Partial<IUploadFile>) => {
    commit(
      files.map((file) => (file.uid === uid ? { ...file, ...changes } : file)),
    )
  }

  const send = (entry: IUploadFile, raw: File) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    Object.entries(props.data ?? {}).forEach(([key, val]) =>
      form.append(key, val as any),
    )
    form.append(props.name, raw)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        patch(entry.uid, { percent: Math.round((e.loaded / e.total) * 100) })
    }
    xhr.onload = () => {
      let response: any = xhr.responseText
      try {
        response = JSON.parse(xhr.responseText)
      } catch {
        // réponse texte conservée telle quelle
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        patch(entry.uid, {
          status: 'done',
          percent: 100,
          response,
          url: response?.url ?? entry.url,
        })
      } else {
        patch(entry.uid, {
          status: 'error',
          response,
          error: `${xhr.status} ${xhr.statusText}`.trim(),
        })
      }
    }
    xhr.onerror = () =>
      patch(entry.uid, { status: 'error', error: 'Network error' })
    xhr.open(props.method || 'POST', props.action, true)
    xhr.withCredentials = !!props.withCredentials
    Object.entries(props.headers ?? {}).forEach(([key, val]) =>
      xhr.setRequestHeader(key, val as string),
    )
    xhr.send(form)
  }

  const addFiles = (list: FileList | File[] | null | undefined) => {
    if (!list?.length || props.disabled) return
    sync()
    const raws = Array.from(list)
    const accepted = props.multiple ? raws : raws.slice(0, 1)
    const entries = accepted.map<IUploadFile>((raw) => ({
      uid: createUid(),
      name: raw.name,
      size: raw.size,
      type: raw.type,
      status: props.action ? 'uploading' : 'done',
      percent: props.action ? 0 : 100,
      url: URL.createObjectURL(raw),
    }))
    let next = props.multiple ? [...files, ...entries] : entries
    if (props.maxCount) next = next.slice(-props.maxCount)
    commit(next)
    if (props.action) entries.forEach((entry, i) => send(entry, accepted[i]))
  }

  const remove = (uid: string) => {
    sync()
    const target = files.find((file) => file.uid === uid)
    if (target?.url?.startsWith('blob:')) URL.revokeObjectURL(target.url)
    commit(files.filter((file) => file.uid !== uid))
  }

  const openDialog = () => {
    if (!props.disabled) input.value?.click()
  }

  const renderInput = () =>
    h('input', {
      ref: input,
      type: 'file',
      class: 'hidden',
      tabindex: -1,
      'aria-hidden': 'true',
      accept: props.accept,
      multiple: props.multiple,
      ...(props.directory ? { webkitdirectory: '', directory: '' } : {}),
      onChange: (e: Event) => {
        const target = e.target as HTMLInputElement
        addFiles(target.files)
        target.value = ''
      },
    })

  return { addFiles, remove, openDialog, renderInput }
}

const renderFileList = (
  props: any,
  remove: (uid: string) => void,
  trigger?: any,
) => {
  const files: IUploadFile[] = props.value ?? []
  if (props.listType === 'picture-card') {
    return h('ul', { class: 'flex flex-wrap gap-2' }, [
      ...files.map((file) =>
        h(
          'li',
          {
            key: file.uid,
            class: cn(
              'group/file relative flex size-24 items-center justify-center overflow-hidden rounded-md border border-input p-1',
              file.status === 'error' && 'border-destructive',
            ),
            title: file.error ?? file.name,
          },
          [
            isImage(file) && file.url
              ? h('img', {
                  src: file.url,
                  alt: file.name,
                  class: 'size-full rounded-sm object-cover',
                })
              : h(
                  'span',
                  {
                    class:
                      'flex flex-col items-center gap-1 text-center text-xs text-muted-foreground',
                  },
                  [
                    h(FileText, { class: 'size-6' }),
                    h('span', { class: 'line-clamp-2 break-all' }, file.name),
                  ],
                ),
            file.status === 'uploading'
              ? h(
                  'span',
                  {
                    class:
                      'absolute inset-0 flex items-center justify-center bg-background/70 text-xs',
                  },
                  `${file.percent ?? 0}%`,
                )
              : null,
            props.disabled
              ? null
              : h(
                  UiButton,
                  {
                    variant: 'secondary',
                    size: 'icon-xs',
                    'aria-label': `Remove ${file.name}`,
                    class:
                      'absolute right-1 top-1 hidden shadow-xs group-hover/file:inline-flex hover:text-destructive focus-visible:inline-flex',
                    onClick: () => remove(file.uid),
                  },
                  { default: () => h(Trash2) },
                ),
          ],
        ),
      ),
      trigger,
    ])
  }
  if (!props.showUploadList || !files.length) return null
  return h(
    'ul',
    { class: 'mt-2 flex flex-col gap-1' },
    files.map((file) =>
      h(
        'li',
        {
          key: file.uid,
          class: cn(
            'group/file flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-accent',
            props.listType === 'picture' && 'border border-input p-1.5',
            file.status === 'error' && 'text-destructive',
          ),
          title: file.error,
        },
        [
          props.listType === 'picture'
            ? isImage(file) && file.url
              ? h('img', {
                  src: file.url,
                  alt: '',
                  class: 'size-10 shrink-0 rounded-sm object-cover',
                })
              : h(FileText, { class: 'size-10 shrink-0 p-2 opacity-60' })
            : file.status === 'uploading'
              ? h(Loader2, { class: 'size-3.5 shrink-0 animate-spin' })
              : h(Paperclip, { class: 'size-3.5 shrink-0 opacity-60' }),
          h('span', { class: 'flex min-w-0 flex-1 flex-col' }, [
            file.url && file.status !== 'error'
              ? h(
                  'a',
                  {
                    href: file.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    class: 'truncate hover:text-primary',
                  },
                  file.name,
                )
              : h('span', { class: 'truncate' }, file.name),
            file.status === 'uploading'
              ? h('span', { class: 'mt-1 h-0.5 w-full rounded bg-muted' }, [
                  h('span', {
                    class: 'block h-full rounded bg-primary transition-all',
                    style: { width: `${file.percent ?? 0}%` },
                  }),
                ])
              : null,
          ]),
          props.disabled
            ? null
            : h(
                UiButton,
                {
                  variant: 'ghost',
                  size: 'icon-xs',
                  'aria-label': `Remove ${file.name}`,
                  class:
                    'text-muted-foreground opacity-0 group-hover/file:opacity-100 hover:text-destructive focus-visible:opacity-100',
                  onClick: () => remove(file.uid),
                },
                { default: () => h(Trash2) },
              ),
        ],
      ),
    ),
  )
}

export const Upload = defineComponent({
  name: 'DUpload',
  inheritAttrs: false,
  props: uploadProps,
  emits: ['update:value'],
  setup(props, { attrs, emit, slots }) {
    const { remove, openDialog, renderInput } = useUploader(props, emit)
    return () => {
      const text = props.textContent ?? 'Upload'
      const reachedMax =
        !!props.maxCount && (props.value?.length ?? 0) >= props.maxCount
      const trigger =
        props.listType === 'picture-card'
          ? reachedMax && props.multiple
            ? null
            : h(
                UiButton,
                {
                  variant: 'outline',
                  disabled: props.disabled,
                  // carte de dépôt : Button outline en pointillés
                  class:
                    'size-24 flex-col gap-1 border-dashed bg-muted/40 text-xs font-normal text-muted-foreground hover:border-primary hover:text-primary',
                  onClick: openDialog,
                },
                {
                  default: () =>
                    slots.default?.() ?? [
                      h(Plus, { class: 'size-5' }),
                      h('span', {}, text),
                    ],
                },
              )
          : h(
              UiButton,
              {
                variant: 'outline',
                size: 'sm',
                disabled: props.disabled,
                onClick: openDialog,
              },
              {
                default: () =>
                  slots.default?.() ?? [h(UploadIcon), h('span', {}, text)],
              },
            )
      return h(
        'div',
        {
          ...attrs,
          'data-slot': 'upload',
          class: cn('w-full', attrs.class as string),
        },
        [
          renderInput(),
          props.listType === 'picture-card'
            ? renderFileList(props, remove, trigger)
            : [trigger, renderFileList(props, remove)],
        ],
      )
    }
  },
})

export const UploadDragger = defineComponent({
  name: 'DUploadDragger',
  inheritAttrs: false,
  props: uploadProps,
  emits: ['update:value'],
  setup(props, { attrs, emit, slots }) {
    const { addFiles, remove, openDialog, renderInput } = useUploader(
      props,
      emit,
    )
    const over = ref(false)
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-slot': 'upload',
          class: cn('w-full', attrs.class as string),
        },
        [
          renderInput(),
          h(
            'div',
            {
              role: 'button',
              tabindex: props.disabled ? -1 : 0,
              'aria-disabled': props.disabled || undefined,
              'aria-label': props.textContent ?? 'Upload',
              class: cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/40 px-4 py-6 text-center transition-colors outline-none',
                'hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/50',
                over.value && 'border-primary bg-primary/5',
                props.disabled && 'pointer-events-none opacity-50',
              ),
              onClick: openDialog,
              onKeydown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDialog()
                }
              },
              onDragover: (e: DragEvent) => {
                e.preventDefault()
                over.value = true
              },
              onDragleave: () => (over.value = false),
              onDrop: (e: DragEvent) => {
                e.preventDefault()
                over.value = false
                addFiles(e.dataTransfer?.files)
              },
            },
            slots.default?.() ?? [
              h(CloudUpload, { class: 'size-10 text-primary' }),
              h(
                'p',
                { class: 'text-sm text-foreground' },
                props.textContent ??
                  'Click or drag file to this area to upload',
              ),
            ],
          ),
          renderFileList(props, remove),
        ],
      )
  },
})
