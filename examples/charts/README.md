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

The sales example shares one Formivue form between an editable `ArrayTable` and a `BarChart`. The chart reads the table through a schema expression and groups rows by month and channel. The two January web sales show the difference between sum and mean. Try editing, adding, moving or removing a row.

The [sales schema](./src/sales.ts) uses `SchemaField` with the standard and chart runtime materials. The [gallery](./src/gallery.ts) provides props for the named chart components.
