import { Button } from '@formivue-design/vue-ui'
import { jsonPointer } from '@formivue/json-schema'
import type {
  CanvasBindingChange,
  CanvasRenameChoice,
  DocumentDataPath,
} from '@formivue-design/formivue-transformer'
import {
  computed,
  defineComponent,
  h,
  ref,
  useId,
  watch,
  type PropType,
} from 'vue'
import { message, type Message } from '../../../shared/language'
import { documentError } from '../../../shared/document-messages'
import type { DocumentProject } from '../service/document-project'

type Review = NonNullable<DocumentProject['reconciliation']['value']>
const pathLabel = (path: DocumentDataPath) =>
  jsonPointer(path.map((part) => part ?? '*')) || '/'

const labels: Record<CanvasBindingChange['kind'], Message> = {
  rename: ['Renamed', 'Renommé', 'Renombrado'],
  added: ['Added', 'Ajouté', 'Añadido'],
  removed: ['Removed', 'Supprimé', 'Eliminado'],
  incompatible: ['Changed binding', 'Liaison modifiée', 'Vínculo modificado'],
}

export const CanvasReconciliationWidget = defineComponent({
  name: 'CanvasReconciliationWidget',
  props: {
    review: { type: Object as PropType<Review>, required: true },
    componentLabel: {
      type: Function as PropType<(id: string) => string | undefined>,
      required: true,
    },
    onCancel: { type: Function as PropType<() => void>, required: true },
    onApplied: { type: Function as PropType<() => void>, required: true },
    onNavigate: Function as PropType<(id?: string) => void>,
  },
  setup(props) {
    const id = useId()
    const choices = ref(props.review.choices)
    const stale = ref(false)
    const resolution = computed(() => props.review.check(choices.value))
    const changeById = computed(
      () =>
        new Map(
          props.review.changes.map((change) => [change.componentId, change]),
        ),
    )
    watch(
      () => props.review,
      (review) => {
        choices.value = review.choices
        stale.value = false
      },
      { flush: 'sync' },
    )
    const label = (change: CanvasBindingChange) =>
      props.componentLabel(change.componentId) ??
      change.component ??
      change.componentId
    const button = (
      title: Message,
      action: () => void,
      disabled = false,
      primary = false,
    ) =>
      h(
        Button,
        {
          size: 'small',
          type: primary ? 'primary' : 'default',
          disabled,
          onClick: action,
        },
        () => message(title),
      )

    return () =>
      h(
        'section',
        { class: 'grid gap-3 rounded-md border p-3', 'aria-labelledby': id },
        [
          h(
            'h3',
            { id, class: 'font-semibold' },
            message([
              'Reconcile variants',
              'Réconcilier les variantes',
              'Conciliar variantes',
            ]),
          ),
          h(
            'ul',
            { class: 'grid gap-1 text-sm' },
            props.review.changes.map((change) =>
              h(
                'li',
                {
                  key: change.componentId,
                  class: 'break-all',
                },
                [
                  h('strong', [
                    message(labels[change.kind]),
                    ' · ',
                    label(change),
                  ]),
                  ' · ',
                  ...(change.from && change.to
                    ? [pathLabel(change.from), ' → ', pathLabel(change.to)]
                    : [pathLabel(change.to ?? change.from)]),
                ],
              ),
            ),
          ),
          ...props.review.variants
            .filter(({ fields }) => fields.length)
            .map(({ name, fields }) =>
              h(
                'fieldset',
                {
                  key: name,
                  class: 'grid min-w-0 gap-2 rounded-md border p-2',
                },
                [
                  h('legend', { class: 'px-1 text-sm font-medium' }, name),
                  ...fields.map(({ componentId, path, draftPath }) => {
                    const change = changeById.value.get(componentId)
                    const selected = choices.value[name][componentId]
                    const resulting = (current: DocumentDataPath) =>
                      selected === 'keep'
                        ? current
                        : [
                            ...current.slice(0, -1),
                            change.to[change.to.length - 1],
                          ]
                    const next = resulting(path)
                    const nextDraft = draftPath && resulting(draftPath)
                    return h(
                      'div',
                      { key: componentId, class: 'grid min-w-0 gap-1 text-sm' },
                      [
                        h('p', { class: 'break-all' }, [
                          label(change),
                          ' · ',
                          pathLabel(path),
                        ]),
                        draftPath && pathLabel(draftPath) !== pathLabel(path)
                          ? h(
                              'p',
                              { class: 'break-all text-muted-foreground' },
                              message(
                                [
                                  'Draft path {path}',
                                  'Chemin du brouillon {path}',
                                  'Ruta del borrador {path}',
                                ],
                                { path: pathLabel(draftPath) },
                              ),
                            )
                          : null,
                        h('label', { class: 'grid max-w-md gap-1' }, [
                          message(
                            [
                              'Key for {name}',
                              'Clé pour {name}',
                              'Clave para {name}',
                            ],
                            { name: label(change) },
                          ),
                          h(
                            'select',
                            {
                              class:
                                'min-w-0 rounded border border-input bg-background p-2',
                              value: selected,
                              onChange: (event: Event) => {
                                const choice = (
                                  event.target as HTMLSelectElement
                                ).value as CanvasRenameChoice
                                choices.value = {
                                  ...choices.value,
                                  [name]: {
                                    ...choices.value[name],
                                    [componentId]: choice,
                                  },
                                }
                              },
                            },
                            [
                              h(
                                'option',
                                { value: 'keep' },
                                message([
                                  'Keep the variant key',
                                  'Conserver la clé de la variante',
                                  'Conservar la clave de la variante',
                                ]),
                              ),
                              h(
                                'option',
                                { value: 'follow' },
                                message([
                                  'Use the canvas key in the current object',
                                  'Utiliser la clé du canevas dans l’objet actuel',
                                  'Usar la clave del lienzo en el objeto actual',
                                ]),
                              ),
                            ],
                          ),
                        ]),
                        h(
                          'p',
                          { class: 'break-all' },
                          message(
                            [
                              'Resulting path {path}',
                              'Chemin résultant {path}',
                              'Ruta resultante {path}',
                            ],
                            { path: pathLabel(next) },
                          ),
                        ),
                        nextDraft && pathLabel(nextDraft) !== pathLabel(next)
                          ? h(
                              'p',
                              { class: 'break-all' },
                              message(
                                [
                                  'Resulting draft path {path}',
                                  'Chemin résultant du brouillon {path}',
                                  'Ruta resultante del borrador {path}',
                                ],
                                { path: pathLabel(nextDraft) },
                              ),
                            )
                          : null,
                      ],
                    )
                  }),
                ],
              ),
            ),
          ...resolution.value.diagnostics.map(({ variant, issues }, index) =>
            h(
              'div',
              {
                key: variant + index,
                role: 'alert',
                class:
                  'grid gap-2 rounded border border-destructive/40 p-2 text-sm text-destructive',
              },
              [
                h(
                  'strong',
                  variant ||
                    message(['Base model', 'Modèle de base', 'Modelo base']),
                ),
                h(
                  'p',
                  { class: 'whitespace-pre-wrap break-words' },
                  documentError({ issues }),
                ),
                ...issues.flatMap(({ componentId }) =>
                  componentId && props.componentLabel(componentId)
                    ? [
                        button(
                          [
                            'Select on canvas',
                            'Sélectionner sur le canevas',
                            'Seleccionar en el lienzo',
                          ],
                          () => props.onNavigate?.(componentId),
                        ),
                      ]
                    : [],
                ),
              ],
            ),
          ),
          stale.value
            ? h(
                'p',
                { role: 'alert', class: 'text-sm text-destructive' },
                message([
                  'The project changed. Generate from the canvas again.',
                  'Le projet a changé. Relancez la génération depuis le canevas.',
                  'El proyecto cambió. Vuelve a generar desde el lienzo.',
                ]),
              )
            : null,
          h('div', { class: 'flex flex-wrap gap-2' }, [
            button(
              [
                'Apply reconciliation',
                'Appliquer la réconciliation',
                'Aplicar la conciliación',
              ],
              () => {
                if (resolution.value.confirm()) props.onApplied()
                else stale.value = true
              },
              !!resolution.value.diagnostics.length || stale.value,
              true,
            ),
            button(
              [
                'Cancel reconciliation',
                'Annuler la réconciliation',
                'Cancelar la conciliación',
              ],
              props.onCancel,
            ),
          ]),
        ],
      )
  },
})
