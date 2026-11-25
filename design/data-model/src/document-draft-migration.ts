import { isEqual } from '@formivue/shared'
import {
  compileFormDocuments,
  materializeFormDocumentVariant,
  type CompileFormDocumentOptions,
  type FormDocumentJson,
  type FormDocumentProject,
  type FormDocuments,
  type prepareFormDocumentReconciliation,
} from '@formivue-design/formivue-transformer'
import { DocumentValidationError, isJsonObject } from '@formivue/json-schema'
import type {
  ProjectDraft,
  ReconciliationChoices,
} from './document-project-archive'

export function rebaseDraft(
  before: FormDocumentProject,
  reconciled: FormDocumentProject,
  prepared: ReturnType<typeof prepareFormDocumentReconciliation>,
  choices: ReconciliationChoices,
  name: string,
  draft: ProjectDraft,
  options: CompileFormDocumentOptions,
): ProjectDraft {
  const applied = name
    ? reconciled.variants.find((variant) => variant.name === name)
    : { ...reconciled.base, renames: [] }
  const oldUi = name
    ? materializeFormDocumentVariant(
        {
          ...before,
          variants: before.variants.map((variant) =>
            variant.name === name
              ? {
                  ...variant,
                  renames: draft.renames,
                  uiOverrides: draft.uiOverrides,
                }
              : variant,
          ),
        },
        name,
        options,
      ).ui
    : before.base.ui
  const files = { ...draft.files }
  const json = (part: keyof FormDocumentJson) => {
    try {
      const value = JSON.parse(files[part])
      if (isJsonObject(value)) return value
    } catch {
      // Keep the original text intact for correction.
    }
    throw new DocumentValidationError([
      {
        path: '/' + part,
        code: 'reconciliation_draft_json',
        message: 'Correct this draft JSON before migrating it.',
      },
    ])
  }
  let draftSchema: FormDocuments['dataSchema'] | undefined
  try {
    draftSchema = json('dataSchema')
  } catch {
    // Leave unfinished JSON intact unless the canvas change needs the schema.
  }
  const { ui, renames, uiOverrides, dataChanges } = prepared.migrate(
    {
      renames: draft.renames,
      uiOverrides: draft.uiOverrides,
      get dataSchema() {
        return draftSchema ?? json('dataSchema')
      },
      get data() {
        return json('data')
      },
    },
    name ? choices[name] : undefined,
    !name,
    { restoreMissingSchema: !!draftSchema, applied },
  )
  const uiChanged = !isEqual(oldUi, ui)
  if (uiChanged) {
    if (!isEqual(oldUi, json('ui')))
      throw new DocumentValidationError([
        {
          path: '/ui',
          code: 'reconciliation_draft_ui',
          message:
            'The draft UI has independent edits. Reconcile them before changing the canvas version.',
        },
      ])
    files.ui = JSON.stringify(ui, null, 2)
  }
  if (dataChanges) {
    files.dataSchema = JSON.stringify(dataChanges.dataSchema, null, 2)
    files.data = JSON.stringify(dataChanges.data, null, 2)
  }
  if (uiChanged || dataChanges)
    compileFormDocuments(
      {
        ui: uiChanged ? ui : (json('ui') as unknown as FormDocuments['ui']),
        dataSchema: dataChanges?.dataSchema ?? json('dataSchema'),
      },
      options,
    )
  return { files, renames, uiOverrides }
}
