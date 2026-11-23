# @formivue-design/vue-ui

UI layer of the Vue 3 designer — **shadcn-vue on top of reka-ui** (user
decision 2026-11-21): the components follow the recipe of the
[shadcn-vue](https://github.com/unovue/shadcn-vue) registry (`new-york-v4` — cva + `cn()` +
registry classes, [reka-ui](https://github.com/unovue/reka-ui) 2.x primitives), owned by this
package (shadcn rule: the components live in your codebase), and completed with
in-house controls such as Tree, the data-driven Table, and the form block.

## Recipe

- **TS ports of the registry**: the registry SFCs do not pass tsdown's dts
  pipeline → the shadcn components are ported **1:1** to TS `defineComponent`
  (classes, cva variants, lucide icons, reka composition) under `src/ui/` —
  `buttonVariants` (exact cva), `Input`, `Checkbox` (lucide Check), `Select`
  (ChevronDown Trigger + Check Item), `Dialog` (overlay + X), `DropdownMenu`,
  `Tabs`, `Collapsible` (chevron), `NumberField` (Plus/Minus), `Slider`,
  `Switch`, `Tooltip` (arrow), `Popover`, `Card`, `Table`, `Label`.
- The **public** components (`Button`, `Select`…) wrap the `ui/` layer while
  keeping the designer's antd-like form-friendly contract (`type`/`size`,
  `value`/`onChange`).
- **`cn()` = clsx + tailwind-merge** (`src/lib/utils.ts`), `cva`
  (class-variance-authority), **@lucide/vue** icons.
- **Zero formivue dependency**: this package is a pure UI library. The bridge
  to fields (`connect`/`mapProps`) is done by the consuming packages.
- **a11y by construction** (V8 of the Vue plan: `axe-core` target = 0) — ARIA
  roles via reka-ui, explicit `aria-label` wherever the semantics require it
  (e.g. the Select's `role=combobox` trigger), `role=group` for the Tree
  subtrees.

## Consumer theme (required)

The classes use **shadcn theme tokens** (`bg-background`,
`text-foreground`, `bg-primary`, `text-muted-foreground`, `bg-accent`,
`border-border`, `text-destructive`…). The consumer MUST provide the shadcn
Tailwind 4 theme in their global CSS (`shadcn-vue init` recipe):

```css
@import 'tailwindcss' @import 'tw-animate-css'
  /* optional — animate-in/out animations from the registry */ @source
  '../node_modules/@formivue-design/vue-ui/dist': root {
  --background: oklch(1 0 0) --foreground: oklch(0.145 0 0)
    --primary: oklch(0.205 0 0) --primary-foreground: oklch(0.985 0 0)
    /* …full shadcn tokens (see the shadcn-vue registry)… */
    --border: oklch(0.922 0 0) --muted: oklch(0.97 0 0)
    --muted-foreground: oklch(0.556 0 0) --accent: oklch(0.97 0 0)
    --popover: oklch(1 0 0) --card: oklch(1 0 0)
    --destructive: oklch(0.577 0.245 27.325);
}

@theme inline {
  --color-background: var(--background) --color-foreground: var(--foreground)
    --color-primary: var(--primary)
    --color-primary-foreground: var(--primary-foreground)
    /* …identical mapping for each token… */ --color-border: var(--border)
    --color-muted: var(--muted)
    --color-muted-foreground: var(--muted-foreground)
    --color-accent: var(--accent) --color-popover: var(--popover)
    --color-card: var(--card) --color-destructive: var(--destructive);
}
```

Dark mode is then done by overriding the variables under `.dark { … }` (no
class hardcoded in the components).

## "Form-friendly" contract

Any control exposing `value` + `onChange(value)` is enough to be wired to a
`@formivue/vue` field:

```ts
import { connect, mapProps } from '@formivue/vue'
import { isVoidField } from '@formivue/core'
import { FormItemBase, Input } from '@formivue-design/vue-ui'

const FormItem = connect(
  FormItemBase,
  mapProps(
    { validateStatus: true, title: 'label', required: true },
    (props, field) => ({
      help: !isVoidField(field)
        ? field.selfErrors.length
          ? field.selfErrors
          : undefined
        : undefined,
      extra: field.description,
    }),
  ),
)

const MyInput = connect(Input, mapProps({ value: true, onChange: true }))
```

## Components

|                |                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **chrome**     | `Button`, `Input`, `Password`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Slider`, `NumberPicker`, `Select` |
| **overlay**    | `Tooltip`, `Popover`, `Dialog`, `Menu`                                                                       |
| **navigation** | `Collapsible`, `Tabs`                                                                                        |
| **data**       | `Tree`, `Table`, `DatePicker`, `DateRangePicker`, `TimePicker`, `TimeRangePicker`                            |
| **form**       | `FormItemBase`, `FormLayout` (+ injectable `FormLayoutKey`), `Space`, `Card`, `FormCollapse`, `FormTab`      |

Public → registry mapping: `Button` type `primary/default/text/link` →
cva variants `default/outline/ghost/link`, size `small/middle/large` →
`sm/default/lg`.

Date pickers combine the shadcn-vue outline button and popover with Reka UI's
Calendar or RangeCalendar. The calendar label follows the configured locale.
Time pickers use the shadcn-vue Input with `type="time"`. Date values are ISO
strings such as `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` with `showTime`. Time values
use the native time format, and ranges store a pair of strings.

## Tests

`packages/vue-ui/src/__tests__/` — one suite per family + **axe suite**
(`a11y.spec.ts`, kitchen-sink, 0-violation target, fork recipe).
On jsdom: `scripts/test-setup.ts` polyfills `ResizeObserver` and the
Pointer Capture API (absent from jsdom, required by reka).
