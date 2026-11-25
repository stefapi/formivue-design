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
- **Accessibility.** The controls use Reka UI's ARIA roles. Component tests
  check naming and semantics with axe-core.

## Consumer theme

Import the package stylesheet in the application's Tailwind 4 entry. It
registers the control classes. The application defines the theme tokens.
A standard form renderer can import its own stylesheet, which already
includes these sources.

```css
@import 'tailwindcss';
@import '@formivue-design/vue-ui/styles.css';

@theme inline {
  --color-background: var(--color-white);
  --color-foreground: var(--color-slate-900);
  --color-card: var(--color-white);
  --color-card-foreground: var(--color-slate-900);
  --color-popover: var(--color-white);
  --color-popover-foreground: var(--color-slate-900);
  --color-primary: var(--color-slate-900);
  --color-primary-foreground: var(--color-white);
  --color-secondary: var(--color-slate-100);
  --color-secondary-foreground: var(--color-slate-900);
  --color-muted: var(--color-slate-100);
  --color-muted-foreground: var(--color-slate-600);
  --color-accent: var(--color-slate-100);
  --color-accent-foreground: var(--color-slate-900);
  --color-destructive: var(--color-rose-600);
  --color-border: var(--color-slate-200);
  --color-input: var(--color-slate-300);
  --color-ring: var(--color-indigo-500);
}
```

Override the theme values in your application to support additional themes.

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

[`src/__tests__`](./src/__tests__) — one suite per family + **axe suite**
(`a11y.spec.ts`, kitchen-sink, 0-violation target, fork recipe).
On jsdom: `scripts/test-setup.ts` polyfills `ResizeObserver` and the
Pointer Capture API (absent from jsdom, required by reka).
