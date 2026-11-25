# Formivue designer data model

`useDocumentProject` manages the base model, variants, draft documents and
reconciliation reviews for a designer canvas. Pass the component contracts
used by the application and a callback that applies the documents to the
preview. `useDocumentPreview` supplies this callback when the application
uses a Formivue document session. It keeps the form and reports conflicts
when only the data changes. Call `preview.clear()` when closing the preview
or unmounting its owner.

```ts
import {
  useDocumentPreview,
  useDocumentProject,
} from '@formivue-design/data-model'

const preview = useDocumentPreview({ contracts })
const model = useDocumentProject({
  documentOptions: { contracts },
  applyPreview: preview.apply,
  persistence: {
    read: () => localStorage.getItem('my-form-project'),
    write: (state) => localStorage.setItem('my-form-project', state),
  },
})

model.generate(tree)
const archive = model.exportArchive(tree.serialize())
```

The session can run in memory by omitting `persistence`. The archive contains
the canvas, applied documents, drafts and any pending reconciliation choices.
`parseDocumentProject` and `stringifyDocumentProject` provide independent
access to the version 1 archive format.

The package declares `vue` as a peer and `@babel/types` as an optional peer
for type checking. Vue 3.5's compiler declarations reference Babel types.
When checking dependency declarations with an isolated `node_modules`
layout, add `@babel/types` to the consuming project alongside `vue`.

## Model panel

Import `DataModelWidget` from `@formivue-design/data-model/ui` and include
`@formivue-design/data-model/styles.css` in the application stylesheet. The
panel includes the schema and test-data views, reconciliation review and
archive controls. Configure Tailwind to scan the package's `dist` directory
alongside the other designer packages.

Pass the canvas tree, project session, document options and application locale
to the panel. The application handles archive installation and navigation to
the canvas or JSON documents. The optional `preview` slot receives the draft
form, compiled schema and binding scope for the application's renderer.

`DocumentEditorWidget` from the same entry edits, imports and downloads
`ui.json`, `data.schema.json` and `data.json`. Wire `draft`, `onDraft`,
`onReload` and `onApply` to the project to share its draft with the model
panel. The optional `legacy` slot adds an editor for the combined Formivue
JSON format. Set `showVisualSchema` to `false` when the application already
provides the visual schema editor in the model panel.
