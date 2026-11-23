// Calendar and RangeCalendar share the shadcn-vue layout over their respective Reka primitives.
import type { DateValue } from '@internationalized/date'
import { defineComponent, h, type Component } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from 'reka-ui'
import { cn } from '../lib/utils'
import { buttonVariants } from './button'

const navButtonClass = (side: 'left' | 'right') =>
  cn(
    buttonVariants({ variant: 'outline' }),
    'absolute',
    side === 'left' ? 'left-1' : 'right-1',
    'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
  )

const rangeCellClass =
  'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md [&:has([data-selected][data-selection-end])]:rounded-r-md [&:has([data-selected][data-selection-start])]:rounded-l-md'

const dayClass = cn(
  buttonVariants({ variant: 'ghost' }),
  'h-8 w-8 p-0 font-normal data-[selected]:opacity-100',
  '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
  'data-[outside-view]:text-muted-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
  'data-[unavailable]:text-destructive data-[unavailable]:line-through',
)

const selectedDayClass =
  'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground'
const rangeDayClass =
  'data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground data-[selection-start]:hover:bg-primary data-[selection-start]:hover:text-primary-foreground data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground data-[selection-end]:hover:bg-primary data-[selection-end]:hover:text-primary-foreground'

type CalendarGridMonth = { value: DateValue; rows: DateValue[][] }

function createCalendar(range: boolean) {
  const prefix = range ? 'range-calendar' : 'calendar'
  const Cell = range ? RangeCalendarCell : CalendarCell
  const CellTrigger = range ? RangeCalendarCellTrigger : CalendarCellTrigger
  const Grid = range ? RangeCalendarGrid : CalendarGrid
  const GridBody = range ? RangeCalendarGridBody : CalendarGridBody
  const GridHead = range ? RangeCalendarGridHead : CalendarGridHead
  const GridRow = range ? RangeCalendarGridRow : CalendarGridRow
  const HeadCell = range ? RangeCalendarHeadCell : CalendarHeadCell
  const Header = range ? RangeCalendarHeader : CalendarHeader
  const Heading = range ? RangeCalendarHeading : CalendarHeading
  const Next = range ? RangeCalendarNext : CalendarNext
  const Prev = range ? RangeCalendarPrev : CalendarPrev
  const Root: Component = range ? RangeCalendarRoot : CalendarRoot

  return defineComponent({
    name: range ? 'UiRangeCalendar' : 'UiCalendar',
    inheritAttrs: false,
    props: {
      class: { type: null, default: undefined },
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          Root,
          {
            'data-slot': prefix,
            ...attrs,
            class: cn('overflow-x-auto p-3', props.class),
          },
          {
            default: ({
              grid,
              weekDays,
            }: {
              grid: CalendarGridMonth[]
              weekDays: string[]
            }) => [
              h(
                Header,
                {
                  'data-slot': `${prefix}-header`,
                  class:
                    'relative flex h-8 min-w-56 items-center justify-center',
                },
                {
                  default: () => [
                    h(Heading, {
                      'data-slot': `${prefix}-heading`,
                      class: slots.heading ? 'sr-only' : 'text-sm font-medium',
                    }),
                    slots.heading?.({ month: grid[0]?.value }),
                    h('div', { class: 'flex items-center gap-1' }, [
                      h(
                        Prev,
                        {
                          'data-slot': `${prefix}-prev-button`,
                          class: navButtonClass('left'),
                        },
                        { default: () => h(ChevronLeft, { class: 'size-4' }) },
                      ),
                      h(
                        Next,
                        {
                          'data-slot': `${prefix}-next-button`,
                          class: navButtonClass('right'),
                        },
                        { default: () => h(ChevronRight, { class: 'size-4' }) },
                      ),
                    ]),
                  ],
                },
              ),
              h(
                'div',
                {
                  class: 'mt-2 flex flex-col gap-4 sm:flex-row',
                },
                grid.map((month) =>
                  h(
                    Grid,
                    {
                      key: month.value.toString(),
                      'data-slot': `${prefix}-grid`,
                      class: 'mx-auto w-max border-collapse',
                    },
                    {
                      default: () => [
                        h(
                          GridHead,
                          { 'data-slot': `${prefix}-grid-head` },
                          {
                            default: () =>
                              h(
                                GridRow,
                                {
                                  'data-slot': `${prefix}-grid-row`,
                                  class: 'flex',
                                },
                                {
                                  default: () =>
                                    weekDays.map((day, index) =>
                                      h(
                                        HeadCell,
                                        {
                                          key: index,
                                          'data-slot': `${prefix}-head-cell`,
                                          class:
                                            'w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground',
                                        },
                                        { default: () => day },
                                      ),
                                    ),
                                },
                              ),
                          },
                        ),
                        h(
                          GridBody,
                          { 'data-slot': `${prefix}-grid-body` },
                          {
                            default: () =>
                              month.rows.map((weekDates, index) =>
                                h(
                                  GridRow,
                                  {
                                    key: `weekDate-${index}`,
                                    'data-slot': `${prefix}-grid-row`,
                                    class: 'mt-1 flex w-full',
                                  },
                                  {
                                    default: () =>
                                      weekDates.map((weekDate) =>
                                        h(
                                          Cell,
                                          {
                                            key: weekDate.toString(),
                                            date: weekDate,
                                            'data-slot': `${prefix}-cell`,
                                            class: range
                                              ? rangeCellClass
                                              : 'relative p-0 text-center focus-within:z-20',
                                          },
                                          {
                                            default: () =>
                                              h(CellTrigger, {
                                                day: weekDate,
                                                month: month.value,
                                                'data-slot': `${prefix}-trigger`,
                                                class: cn(
                                                  dayClass,
                                                  range
                                                    ? rangeDayClass
                                                    : selectedDayClass,
                                                ),
                                              }),
                                          },
                                        ),
                                      ),
                                  },
                                ),
                              ),
                          },
                        ),
                      ],
                    },
                  ),
                ),
              ),
            ],
          },
        )
    },
  })
}

export const UiCalendar = createCalendar(false)
export const UiRangeCalendar = createCalendar(true)
