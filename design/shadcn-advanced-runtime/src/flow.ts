import { computed, defineComponent, h, nextTick, ref, useId } from 'vue'
import { createForm } from '@formivue/core'
import { createFormFlow, type FormFlow } from '@formivue/flow'
import { observer } from '@formivue/reactive-vue'
import { useField, useForm } from '@formivue/vue'
import { Button } from '@formivue-design/vue-ui'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { sectionsProp, useSections } from './sections'

function createFlowComponent(
  name: 'Questionnaire' | 'Stepper',
  stepName: string,
) {
  return observer(
    defineComponent({
      name,
      inheritAttrs: false,
      props: {
        sections: sectionsProp,
        initialStep: String,
        label: { type: String, default: name },
        previousText: { type: String, default: 'Previous' },
        nextText: { type: String, default: 'Next' },
        finishText: { type: String, default: 'Finish' },
        completedText: { type: String, default: 'Completed' },
        validationText: {
          type: String,
          default: 'Check the highlighted fields before continuing.',
        },
        onSubmit: Function,
      },
      emits: ['complete'],
      setup(props, { attrs, slots, emit }) {
        const field = useField()
        const form = useForm()
        const fallbackForm = createForm()
        const sections = useSections(stepName, props, slots)
        const heading = ref<HTMLElement>()
        const headingId = useId()
        const configuration = computed<{
          owner: ReturnType<typeof createForm>
          settings: string
          flow?: FormFlow
          error?: string
        }>((previous) => {
          const owner = form.value ?? fallbackForm
          const address = field.value?.address
          const options = {
            initialStep: props.initialStep || undefined,
            steps: sections.value.map(({ id, branches, next, fields }) => ({
              id,
              branches,
              next,
              fields,
              scope: address?.concat(id).toString(),
            })),
          }
          // A schema rerender can produce new section objects during navigation.
          // Keep the active flow while its form and routing settings are equal.
          const settings = JSON.stringify(options)
          if (previous?.owner === owner && previous.settings === settings)
            return previous
          try {
            return {
              owner,
              settings,
              flow: createFormFlow(owner, options),
              error: undefined,
            }
          } catch (error) {
            return {
              owner,
              settings,
              flow: undefined,
              error: String(error instanceof Error ? error.message : error),
            }
          }
        })
        const failed = ref('')
        const navigate = async (action: () => unknown) => {
          const current = configuration.value.flow?.current
          failed.value = ''
          try {
            await action()
          } catch (error) {
            failed.value =
              error instanceof Error ? error.message : String(error)
          }
          if (configuration.value.flow?.current !== current)
            await nextTick(() => heading.value?.focus())
        }
        return () => {
          const { flow, error } = configuration.value
          if (error)
            return h(
              'p',
              {
                ...attrs,
                role: 'alert',
                class: ['text-sm text-destructive', attrs.class],
              },
              error,
            )
          if (!flow?.current) return null
          const route = flow.route
          const current = sections.value.find(({ id }) => id === flow.current)
          const issue =
            failed.value ||
            (flow.errors.length
              ? typeof flow.errors[0] === 'string'
                ? flow.errors[0]
                : props.validationText
              : '')
          return h(
            'section',
            {
              ...attrs,
              'aria-label': props.label,
              class: [
                'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-lg border bg-card p-4 text-card-foreground',
                attrs.class,
              ],
            },
            [
              name === 'Stepper'
                ? h(
                    'ol',
                    {
                      'aria-label': props.label,
                      class: 'flex flex-wrap gap-2 text-sm',
                    },
                    route.map((id, index) =>
                      h(
                        'li',
                        {
                          key: id,
                          'aria-current':
                            id === flow.current ? 'step' : undefined,
                          class: [
                            'flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1',
                            id === flow.current &&
                              'bg-primary text-primary-foreground',
                          ],
                        },
                        [
                          h('span', { 'aria-hidden': true }, String(index + 1)),
                          h(
                            'span',
                            { class: 'min-w-0 wrap-anywhere' },
                            sections.value.find((section) => section.id === id)
                              ?.title ?? id,
                          ),
                        ],
                      ),
                    ),
                  )
                : h(
                    ProgressRoot,
                    {
                      class: 'h-2 w-full overflow-hidden rounded-full bg-muted',
                      'aria-label': props.label,
                      modelValue: flow.index + 1,
                      max: route.length,
                    },
                    () =>
                      h(ProgressIndicator, {
                        class: 'h-full rounded-full bg-primary',
                        style: {
                          width: `${(100 * (flow.index + 1)) / route.length}%`,
                        },
                      }),
                  ),
              h('div', [
                h(
                  'h3',
                  {
                    id: headingId,
                    ref: heading,
                    tabindex: -1,
                    class: 'font-semibold wrap-anywhere outline-none',
                  },
                  current.title ?? current.id,
                ),
                current.description
                  ? h(
                      'p',
                      {
                        class:
                          'text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground',
                      },
                      current.description,
                    )
                  : null,
              ]),
              ...sections.value.map((section) =>
                h(
                  'div',
                  {
                    key: section.id,
                    hidden: section.id !== flow.current,
                    role: section.id === flow.current ? 'group' : undefined,
                    'aria-labelledby':
                      section.id === flow.current ? headingId : undefined,
                  },
                  [section.render()],
                ),
              ),
              issue
                ? h(
                    'p',
                    { role: 'alert', class: 'text-sm text-destructive' },
                    issue,
                  )
                : null,
              flow.completed
                ? h(
                    'p',
                    { role: 'status', class: 'text-sm font-medium' },
                    props.completedText,
                  )
                : h('div', { class: 'flex flex-wrap justify-between gap-2' }, [
                    h(
                      Button,
                      {
                        disabled: !flow.canGoBack || flow.pending,
                        onClick: () => navigate(flow.back),
                      },
                      () => props.previousText,
                    ),
                    h(
                      Button,
                      {
                        type: 'primary',
                        disabled: flow.pending,
                        onClick: () =>
                          navigate(() =>
                            flow.isLast
                              ? flow.finish(async (values) => {
                                  await props.onSubmit?.(values)
                                  emit('complete', values)
                                })
                              : flow.next(),
                          ),
                      },
                      () => (flow.isLast ? props.finishText : props.nextText),
                    ),
                  ]),
            ],
          )
        }
      },
    }),
  )
}

export const Questionnaire = createFlowComponent(
  'Questionnaire',
  'QuestionnaireStep',
)
export const Stepper = createFlowComponent('Stepper', 'StepperStep')
