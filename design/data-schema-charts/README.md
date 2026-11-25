# @formivue-design/data-schema-charts

Document contracts for chart rows, column mappings and filters. The
extension maps `bindings.rows` to the chart's data shape, checks the columns
declared in each row schema and updates mappings when paths change.

```ts
import { chartDocumentContracts } from '@formivue-design/data-schema-charts'
import {
  compileFormDocuments,
  createDocumentContractRegistry,
} from '@formivue-design/formivue-transformer'

const contracts = createDocumentContractRegistry([chartDocumentContracts])
const compiled = compileFormDocuments(documents, { contracts })
```

The extension uses the `data-contract` export of
[`charts-runtime`](../charts-runtime/README.md) for shared rules. Its
installation includes the chart runtime and Unovis. See the
[chart filter example](../formivue-transformer/README.md#bind-chart-filters-to-form-fields)
for declarative bindings and the
[playground](../../examples/designer-playground/README.md) for the canvas
workflow.
