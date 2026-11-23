import {
  computed,
  defineComponent,
  h,
  mergeProps,
  ref,
  type PropType,
} from 'vue'
import { CalendarIcon, ChevronDown } from '@lucide/vue'
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { UiButton } from '../ui/button'
import { UiCalendar, UiRangeCalendar } from '../ui/calendar'
import { UiPopover } from '../ui/tooltip'
import { UiInput } from '../ui/input'
import { cn } from '../lib/utils'

const strings = {
  en: {
    date: 'Pick a date',
    range: 'Pick a date range',
    time: 'Time',
    timeRange: 'Time range',
    start: 'Start time',
    end: 'End time',
    clear: 'Clear',
    month: 'Month',
    year: 'Year',
  },
  fr: {
    date: 'Choisir une date',
    range: 'Choisir une plage de dates',
    time: 'Heure',
    timeRange: 'Plage horaire',
    start: 'Heure de début',
    end: 'Heure de fin',
    clear: 'Effacer',
    month: 'Mois',
    year: 'Année',
  },
  es: {
    date: 'Elegir una fecha',
    range: 'Elegir un rango de fechas',
    time: 'Hora',
    timeRange: 'Rango horario',
    start: 'Hora de inicio',
    end: 'Hora de fin',
    clear: 'Borrar',
    month: 'Mes',
    year: 'Año',
  },
}

const dateTimeProps = {
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  locale: { type: String, default: undefined },
}

const singleValueProps = {
  ...dateTimeProps,
  value: { type: String, default: undefined },
  onChange: {
    type: Function as PropType<(value: string) => void>,
    default: undefined,
  },
  placeholder: { type: String, default: undefined },
}

const rangeValueProps = {
  ...dateTimeProps,
  value: { type: Array as PropType<string[]>, default: undefined },
  onChange: {
    type: Function as PropType<(value: string[]) => void>,
    default: undefined,
  },
}

const usePickerLocale = (props: { locale?: string }) => {
  const locale = computed(
    () => props.locale || globalThis.navigator?.language || 'en-US',
  )
  const labels = computed(
    () =>
      strings[
        locale.value.toLowerCase().split('-')[0] as keyof typeof strings
      ] ?? strings.en,
  )
  return { locale, labels }
}

const splitDateTime = (value?: unknown) => {
  const [date = '', time = ''] = String(value ?? '').split('T')
  return { date, time }
}

const joinDateTime = (date: string, time: string) =>
  date ? `${date}T${time || '00:00'}` : ''

const toDateValue = (iso: string) => {
  if (!iso) return undefined
  try {
    return parseDate(iso)
  } catch {
    return undefined
  }
}

const formatDate = (formatter: DateFormatter, date?: DateValue) =>
  date ? formatter.format(date.toDate('UTC')) : ''

const formatDateTime = (date: string, time: string) =>
  date && time ? `${date} ${time}` : date

const timeStep = (time: string) =>
  time.includes('.') ? '0.001' : time.length > 5 ? '1' : '60'

const openTimePicker = (event: MouseEvent) => {
  const input = event.currentTarget as HTMLInputElement
  if (event.defaultPrevented || input.readOnly || input.matches(':disabled'))
    return

  try {
    input.showPicker?.()
  } catch {
    // The browser can restrict showPicker(), for example in a cross-origin iframe.
  }
}

const renderTimeInput = (
  attrs: Record<string, unknown>,
  onChange: (time: string) => void,
) =>
  h(UiInput, {
    ...mergeProps(attrs, { onClick: openTimePicker }),
    type: 'time',
    class: cn('bg-background dark:[color-scheme:dark]', attrs.class),
    onChange: (event: Event) =>
      onChange((event.target as HTMLInputElement).value),
  })

const renderDateTrigger = (
  attrs: Record<string, unknown>,
  label: string,
  placeholder: string,
  disabled: boolean,
  slot: 'date-picker' | 'range-picker',
) =>
  h(
    UiButton,
    {
      ...attrs,
      variant: 'outline',
      type: 'button',
      disabled,
      'data-slot': slot,
      class: cn(
        'w-full min-w-0 justify-start text-left font-normal',
        !label && 'text-muted-foreground',
        attrs.class,
      ),
    },
    {
      default: () => [
        h(CalendarIcon, { class: 'size-4', 'aria-hidden': 'true' }),
        h('span', { class: 'truncate' }, label || placeholder),
      ],
    },
  )

const renderClearButton = (label: string, clear: () => void) =>
  h('div', { class: 'flex justify-end border-t px-3 py-2' }, [
    h(UiButton, { variant: 'ghost', size: 'sm', onClick: clear }, () => label),
  ])

const renderCalendarSelect = (
  label: string,
  value: number,
  options: { value: number; label: string; disabled?: boolean }[],
  onChange: (value: number) => void,
) =>
  h('div', { class: 'relative min-w-0' }, [
    h(
      'select',
      {
        'aria-label': label,
        class:
          'h-7 w-full appearance-none truncate rounded-md border border-input bg-background pe-6 ps-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        value,
        onChange: (event: Event) =>
          onChange(Number((event.target as HTMLSelectElement).value)),
      },
      options.map(({ value, label, disabled }) =>
        h('option', { key: value, value, disabled }, label),
      ),
    ),
    h(ChevronDown, {
      'aria-hidden': 'true',
      class:
        'pointer-events-none absolute end-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground',
    }),
  ])

export const DatePicker = defineComponent({
  name: 'DDatePicker',
  inheritAttrs: false,
  props: {
    ...singleValueProps,
    showTime: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const open = ref(false)
    const calendarMonth = ref<DateValue>()
    const { locale, labels } = usePickerLocale(props)
    const formatter = computed(
      () =>
        new DateFormatter(locale.value, { dateStyle: 'long', timeZone: 'UTC' }),
    )
    const monthFormatter = computed(
      () =>
        new DateFormatter(locale.value, { month: 'short', timeZone: 'UTC' }),
    )
    const yearFormatter = computed(
      () => new Intl.NumberFormat(locale.value, { useGrouping: false }),
    )
    const part = computed(() => splitDateTime(props.value))
    const selected = computed(() => toDateValue(part.value.date))

    const commit = (value: string) => {
      emit('update:value', value)
      props.onChange?.(value)
    }

    return () => {
      const {
        min,
        max,
        step,
        name,
        form,
        required,
        readonly,
        ...triggerAttrs
      } = attrs
      const minimum = splitDateTime(min)
      const maximum = splitDateTime(max)
      const minDate = toDateValue(minimum.date)
      const maxDate = toDateValue(maximum.date)
      const disabled =
        props.disabled || props.readOnly || readonly === '' || Boolean(readonly)
      const time = part.value.time || (selected.value ? '00:00' : '')
      const label = formatDate(formatter.value, selected.value)
      const placeholder = props.placeholder || labels.value.date

      const clamp = (date: DateValue) => {
        if (minDate && date.compare(minDate) < 0) return minDate
        if (maxDate && date.compare(maxDate) > 0) return maxDate
        return date
      }

      const renderHeading = ({ month }: { month: DateValue }) => {
        const currentYear = today(getLocalTimeZone()).year
        const firstYear = Math.min(
          month.year,
          Math.max(minDate?.year ?? 1, currentYear - 100),
        )
        const lastYear = Math.max(
          month.year,
          Math.min(maxDate?.year ?? 9999, currentYear + 100),
        )
        const months = Array.from({ length: 12 }, (_, index) => {
          const date = month.set({ month: index + 1, day: 1 })
          return {
            value: date.month,
            label: monthFormatter.value.format(date.toDate('UTC')),
            disabled:
              (month.year === minDate?.year && date.month < minDate.month) ||
              (month.year === maxDate?.year && date.month > maxDate.month),
          }
        })
        const years = Array.from(
          { length: lastYear - firstYear + 1 },
          (_, index) => {
            const value = firstYear + index
            return { value, label: yearFormatter.value.format(value) }
          },
        )
        return h('div', { class: 'mx-10 flex min-w-0 items-center gap-1' }, [
          renderCalendarSelect(
            labels.value.month,
            month.month,
            months,
            (monthNumber) => {
              calendarMonth.value = clamp(month.set({ month: monthNumber }))
            },
          ),
          renderCalendarSelect(labels.value.year, month.year, years, (year) => {
            calendarMonth.value = clamp(month.set({ year }))
          }),
        ])
      }

      return h(
        'div',
        {
          'data-slot': 'date-picker-field',
          class: props.showTime
            ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'
            : undefined,
        },
        [
          h(
            UiPopover,
            {
              open: open.value && !disabled,
              'onUpdate:open': (next: boolean) => {
                if (next)
                  calendarMonth.value = clamp(
                    selected.value ?? today(getLocalTimeZone()),
                  )
                open.value = next
              },
              align: 'start',
              class: 'w-auto p-0',
              'aria-label': labels.value.date,
              onOpenAutoFocus: (event: Event) => event.preventDefault(),
            },
            {
              default: () =>
                renderDateTrigger(
                  triggerAttrs,
                  label,
                  placeholder,
                  disabled,
                  'date-picker',
                ),
              content: () => [
                h(
                  UiCalendar,
                  {
                    locale: locale.value,
                    initialFocus: true,
                    preventDeselect: true,
                    disableDaysOutsideCurrentView: true,
                    minValue: minDate,
                    maxValue: maxDate,
                    placeholder: calendarMonth.value,
                    'onUpdate:placeholder': (date: DateValue) => {
                      calendarMonth.value = date
                    },
                    modelValue: selected.value ?? null,
                    'onUpdate:modelValue': (date?: DateValue) => {
                      if (!date) return
                      const day = date.toString()
                      let nextTime = time
                      if (day === minimum.date && minimum.time > nextTime)
                        nextTime = minimum.time
                      if (
                        day === maximum.date &&
                        maximum.time &&
                        maximum.time < nextTime
                      )
                        nextTime = maximum.time
                      commit(props.showTime ? joinDateTime(day, nextTime) : day)
                      open.value = false
                    },
                  },
                  { heading: renderHeading },
                ),
                selected.value &&
                  renderClearButton(labels.value.clear, () => {
                    commit('')
                    open.value = false
                  }),
              ],
            },
          ),
          props.showTime &&
            renderTimeInput(
              {
                'aria-label': labels.value.time,
                'aria-invalid': attrs['aria-invalid'],
                'aria-describedby': attrs['aria-describedby'],
                class: 'w-auto',
                disabled: props.disabled || !selected.value,
                readonly: disabled && !props.disabled,
                value: time,
                step: step ?? timeStep(time),
                min:
                  part.value.date === minimum.date ? minimum.time : undefined,
                max:
                  part.value.date === maximum.date ? maximum.time : undefined,
                required,
                onFocus: attrs.onFocus,
                onBlur: attrs.onBlur,
              },
              (next) => commit(joinDateTime(part.value.date, next)),
            ),
          name &&
            h('input', {
              type: 'hidden',
              name,
              form,
              disabled: props.disabled,
              value: props.value ?? '',
            }),
        ],
      )
    }
  },
})

export const TimePicker = defineComponent({
  name: 'DTimePicker',
  inheritAttrs: false,
  props: singleValueProps,
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const { labels } = usePickerLocale(props)
    return () =>
      renderTimeInput(
        {
          ...attrs,
          step: attrs.step ?? 1,
          value: props.value ?? '',
          disabled: props.disabled,
          readonly: props.readOnly || attrs.readonly,
          placeholder: props.placeholder,
          'aria-label':
            attrs['aria-label'] ??
            (attrs.id || attrs['aria-labelledby']
              ? undefined
              : props.placeholder || labels.value.time),
        },
        (value) => {
          emit('update:value', value)
          props.onChange?.(value)
        },
      )
  },
})

export const DateRangePicker = defineComponent({
  name: 'DDateRangePicker',
  inheritAttrs: false,
  props: {
    ...rangeValueProps,
    placeholder: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    showTime: { type: Boolean, default: false },
    numberOfMonths: { type: Number, default: 2 },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const open = ref(false)
    const start = computed(() => splitDateTime(props.value?.[0]))
    const end = computed(() => splitDateTime(props.value?.[1]))
    const calendarRange = computed<DateRange>(() => ({
      start: toDateValue(start.value.date),
      end: toDateValue(end.value.date),
    }))
    const { locale, labels } = usePickerLocale(props)
    const formatter = computed(
      () =>
        new DateFormatter(locale.value, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }),
    )

    const commit = (from: string, to: string) => {
      const value = from || to ? [from, to] : []
      emit('update:value', value)
      props.onChange?.(value)
    }

    const withTime = (date: string, time: string) =>
      props.showTime ? joinDateTime(date, time) : date

    return () => {
      const { min, max, readonly, ...triggerAttrs } = attrs
      const disabled =
        props.disabled || props.readOnly || readonly === '' || Boolean(readonly)
      const range = calendarRange.value
      const startLabel = formatDate(formatter.value, range.start)
      const endLabel = formatDate(formatter.value, range.end)
      const from = props.showTime
        ? formatDateTime(startLabel, start.value.time)
        : startLabel
      const to = props.showTime
        ? formatDateTime(endLabel, end.value.time)
        : endLabel
      const label = from || to ? `${from || '…'} – ${to || '…'}` : ''
      const placeholder = Array.isArray(props.placeholder)
        ? props.placeholder.filter(Boolean).join(' – ')
        : props.placeholder
      return h(
        UiPopover,
        {
          open: open.value && !disabled,
          'onUpdate:open': (next: boolean) => (open.value = next),
          align: 'start',
          class:
            'w-auto max-h-(--reka-popover-content-available-height) overflow-auto p-0',
          'aria-label': labels.value.range,
          onOpenAutoFocus: (event: Event) => event.preventDefault(),
        },
        {
          default: () =>
            renderDateTrigger(
              triggerAttrs,
              label,
              placeholder || labels.value.range,
              disabled,
              'range-picker',
            ),
          content: () => [
            h(UiRangeCalendar, {
              locale: locale.value,
              numberOfMonths: props.numberOfMonths,
              initialFocus: true,
              disableDaysOutsideCurrentView: true,
              minValue: toDateValue(splitDateTime(min).date),
              maxValue: toDateValue(splitDateTime(max).date),
              modelValue: range,
              defaultPlaceholder: range.start ?? range.end,
              'onUpdate:modelValue': (value: DateRange) => {
                const from = withTime(
                  value.start?.toString() ?? '',
                  start.value.time,
                )
                const to = withTime(value.end?.toString() ?? '', end.value.time)
                if (
                  from !== (props.value?.[0] ?? '') ||
                  to !== (props.value?.[1] ?? '')
                ) {
                  commit(from, to)
                }
              },
            }),
            props.showTime &&
              h('div', { class: 'grid grid-cols-2 gap-2 border-t px-3 py-2' }, [
                renderTimeInput(
                  {
                    'aria-label': labels.value.start,
                    value: start.value.time,
                    step: timeStep(start.value.time),
                    disabled: !range.start,
                  },
                  (next) =>
                    commit(
                      withTime(start.value.date, next),
                      withTime(end.value.date, end.value.time),
                    ),
                ),
                renderTimeInput(
                  {
                    'aria-label': labels.value.end,
                    value: end.value.time,
                    step: timeStep(end.value.time),
                    disabled: !range.end,
                  },
                  (next) =>
                    commit(
                      withTime(start.value.date, start.value.time),
                      withTime(end.value.date, next),
                    ),
                ),
              ]),
            label &&
              renderClearButton(labels.value.clear, () => {
                commit('', '')
                open.value = false
              }),
          ],
        },
      )
    }
  },
})

export const TimeRangePicker = defineComponent({
  name: 'DTimeRangePicker',
  inheritAttrs: false,
  props: {
    ...rangeValueProps,
    placeholder: { type: Array as PropType<string[]>, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    const { labels } = usePickerLocale(props)
    const update = (index: number, time: string) => {
      const next = [props.value?.[0] ?? '', props.value?.[1] ?? '']
      next[index] = time
      const value = next.some(Boolean) ? next : []
      emit('update:value', value)
      props.onChange?.(value)
    }
    return () => {
      const { id, onFocus, onBlur, readonly, ...groupAttrs } = attrs
      const input = (index: number, label: string) =>
        renderTimeInput(
          {
            id: index === 0 ? id : undefined,
            step: attrs.step ?? 1,
            'aria-label': props.placeholder?.[index] || label,
            'aria-invalid': attrs['aria-invalid'],
            placeholder: props.placeholder?.[index],
            disabled: props.disabled,
            readonly: props.readOnly || readonly,
            value: props.value?.[index] ?? '',
            min: index === 1 ? props.value?.[0] || undefined : undefined,
            max: index === 0 ? props.value?.[1] || undefined : undefined,
            onFocus,
            onBlur,
          },
          (time) => update(index, time),
        )
      return h(
        'div',
        {
          'aria-label': labels.value.timeRange,
          ...groupAttrs,
          'data-slot': 'range-picker',
          role: 'group',
          class: cn('grid w-full min-w-0 grid-cols-2 gap-2', attrs.class),
        },
        [input(0, labels.value.start), input(1, labels.value.end)],
      )
    }
  },
})
