# Formivue designer data model

`useDocumentProject` manages the base model, variants, draft documents and
reconciliation reviews for a designer canvas. Pass the component contracts
used by the application and a callback that applies the documents to the
preview.

```ts
import { useDocumentProject } from '@formivue-design/data-model'

const model = useDocumentProject({
  documentOptions: { contracts },
  applyPreview,
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
