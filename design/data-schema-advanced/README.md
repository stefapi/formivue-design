# @formivue-design/data-schema-advanced

Document contracts for the advanced controls, layout containers and workflows.
The extension tells the transformer which fields the components edit and
which document properties they can read. It also checks table columns and
row keys and updates binding references when paths change.

```ts
import { advancedDocumentContracts } from '@formivue-design/data-schema-advanced'
import {
  compileFormDocuments,
  createDocumentContractRegistry,
} from '@formivue-design/formivue-transformer'

const contracts = createDocumentContractRegistry([advancedDocumentContracts])
const compiled = compileFormDocuments(documents, { contracts })
```

Use the same registry when generating, compiling or reconciling documents.
The [advanced runtime](../shadcn-advanced-runtime/README.md) provides the
Vue rendering registry. See the
[document contract guide](../formivue-transformer/README.md#component-contracts)
for how to combine extensions.
