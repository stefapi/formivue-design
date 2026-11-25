# Formivue designer playground

From the repository root, install the locked dependencies, build the packages
and start the playground.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start:playground
```

| View                                  | URL                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Standard designer                     | [Open the playground](http://127.0.0.1:3004/)                              |
| Advanced controls, layouts and charts | [Open Advanced mode](http://127.0.0.1:3004/?mode=advanced)                 |
| Data model and variants               | [Open the variants demo](http://127.0.0.1:3004/?demo=variants)             |
| Live document updates                 | [Open the live documents demo](http://127.0.0.1:3004/?mode=live-documents) |

The toolbar changes the designer mode. Standard and Advanced keep separate
browser-local workspaces. The variants demo has its own workspace and also
supports `?mode=advanced&demo=variants`.

## Data model workflow

1. Open **Data model** from the left toolbar, or from the panel navigation
   on a small screen. **Generate from canvas** derives a schema from the
   current form.
2. Create or duplicate a variant in **Project and variants**. Edit field
   settings in **Schema** and values in **Test data**. Drafts are saved
   locally. **Apply to preview** validates and applies the selected draft.
3. Run **Generate from canvas** again after changing the canvas. Review its
   additions, renames, removals and type changes for each variant before
   applying reconciliation.
4. Open **JSON documents** to edit or transfer `ui.json`,
   `data.schema.json` and `data.json`. Use **Export project** to transfer
   the canvas, variants, drafts and reconciliation together as
   `formivue.project.json`. **Import project** shows the archive for
   confirmation before replacing the open project.

## Rendering and imports

The designer uses [standard canvas materials](../../design/formivue-vue/README.md)
and renders schema previews with the bindings from
[`formivue-runtime`](../../design/formivue-runtime/README.md). Advanced mode
adds the advanced and chart registries. The
[`data-model` package](../../design/data-model/README.md) owns the model
panel, draft and archive handling. The playground supplies storage and
connects the panel to the canvas and preview.

Imports use restricted rendering by default. Use declarative document
bindings for data-driven properties. The toolbar's **Enable trusted
JavaScript** action asks for confirmation and lasts until the next reload.
Use it only for trusted documents with JavaScript reactions or expressions.
See the [document import policy](../../design/formivue-transformer/README.md#separate-ui-schema-and-data-documents).
