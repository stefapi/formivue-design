import { Button } from '@formivue-design/vue-ui'
import { jsonPointer } from '@formivue/json-schema'
import {
  canvasReconciliationChoices,
  type CanvasBindingChange,
  type CanvasReconciliationChoice,
  type DocumentDataPath,
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
  type: ['Type changed', 'Type modifié', 'Tipo modificado'],
  incompatible: ['Changed binding', 'Liaison modifiée', 'Vínculo modificado'],
}

const decisions: Record<CanvasReconciliationChoice, Message> = {
  keep: [
    'Keep the variant key',
    'Conserver la clé de la variante',
    'Conservar la clave de la variante',
  ],
  follow: [
    'Use the canvas key in the current object',
    'Utiliser la clé du canevas dans l’objet actuel',
    'Usar la clave del lienzo en el objeto actual',
  ],
  add: [
    'Add the field at the canvas key',
    'Ajouter le champ à la clé du canevas',
    'Añadir el campo en la clave del lienzo',
  ],
  separate: [
    'Add the field with a separate key',
    'Ajouter le champ avec une clé distincte',
    'Añadir el campo con una clave distinta',
  ],
  defer: [
    'Leave the field out of this variant',
    'Reporter l’ajout dans cette variante',
    'Posponer la incorporación en esta variante',
  ],
  detach: [
    'Remove the control and keep its data',
    'Retirer le contrôle et conserver ses données',
    'Quitar el control y conservar sus datos',
  ],
  retain: [
    'Keep the current control and data',
    'Conserver le contrôle actuel et ses données',
    'Conservar el control actual y sus datos',
  ],
  adopt: [
    'Adopt the canvas change and preserve previous data',
    'Adopter le changement et préserver les données précédentes',
    'Adoptar el cambio y preservar los datos anteriores',
  ],
}

const effects: Partial<Record<CanvasReconciliationChoice, Message>> = {
  separate: [
    'Existing data stays at its current key. The new field gets a free key ending in _canvas or a numbered suffix.',
    'Les données existantes gardent leur clé. Le nouveau champ reçoit une clé libre avec le suffixe _canvas, éventuellement numéroté.',
    'Los datos existentes conservan su clave. El campo nuevo recibe una clave libre con el sufijo _canvas, que puede llevar un número.',
  ],
  detach: [
    'The schema and values remain in the JSON export.',
    'Le schéma et les valeurs restent dans l’export JSON.',
    'El esquema y sus valores se conservan en la exportación JSON.',
  ],
  adopt: [
    'If the new field needs the same key with a different type, the previous schema and values move to a free key ending in _previous or a numbered suffix.',
    'Si le nouveau champ reprend la clé avec un type différent, le schéma et les valeurs précédents passent à une clé libre avec le suffixe _previous, éventuellement numéroté.',
    'Si el campo nuevo usa la misma clave con otro tipo, el esquema y los valores anteriores pasan a una clave libre con el sufijo _previous, que puede llevar un número.',
  ],
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
    const rejected = ref(false)
    const stale = computed(() => rejected.value || props.review.stale)
    const resolution = computed(() => props.review.check(props.review.choices))
    const changeById = computed(
      () =>
        new Map(
          props.review.changes.map((change) => [change.componentId, change]),
        ),
    )
    watch(
      () => props.review,
      () => {
        rejected.value = false
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
                  change.kind === 'type' &&
                  change.fromTypes.join() !== change.toTypes.join()
                    ? h(
                        'span',
                        { class: 'text-muted-foreground' },
                        ` · ${change.fromTypes.join(' / ')} → ${change.toTypes.join(' / ')}`,
                      )
                    : null,
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
                    const selected = props.review.choices[name][componentId]
                    const resulting = (current: DocumentDataPath) =>
                      selected !== 'follow'
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
                            change.kind === 'rename'
                              ? [
                                  'Key for {name}',
                                  'Clé pour {name}',
                                  'Clave para {name}',
                                ]
                              : [
                                  'Decision for {name}',
                                  'Décision pour {name}',
                                  'Decisión para {name}',
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
                                ).value as CanvasReconciliationChoice
                                props.review.selectChoice(
                                  name,
                                  componentId,
                                  choice,
                                )
                              },
                            },
                            canvasReconciliationChoices[change.kind].map(
                              (value) =>
                                h(
                                  'option',
                                  { value },
                                  message(decisions[value]),
                                ),
                            ),
                          ),
                        ]),
                        effects[selected]
                          ? h(
                              'p',
                              { class: 'text-muted-foreground' },
                              message(effects[selected]),
                            )
                          : null,
                        change.kind === 'rename'
                          ? h(
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
                            )
                          : null,
                        change.kind === 'rename' &&
                        nextDraft &&
                        pathLabel(nextDraft) !== pathLabel(next)
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
                else rejected.value = true
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
