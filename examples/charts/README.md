# Formivue chart demo

From the repository root, run:

```bash
pnpm install --frozen-lockfile
pnpm start:charts
```

Open [the chart demo](http://127.0.0.1:3005/). The gallery shows the 20 charts grouped by family. Each chart includes a table of its plotted data.

Use the language picker to switch between English, French and Spanish. The
selection is shared with the other Formivue demos. Switching languages keeps
the sales rows and the current chart settings.

The interactive sales example uses one Formivue form for an editable
`ArrayTable`, a bar chart by month and channel, and a donut chart by channel.
Choose a month and a status to filter both charts and their data tables. The
source rows stay visible and editable. With all statuses selected, the two
January web sales show the difference between sum and mean. Try editing,
adding, moving or removing a row with a filter active.

The [sales schema](./src/sales.ts) uses `SchemaField` with the standard and chart runtime materials. The [gallery](./src/gallery.ts) provides props for the named chart components.
