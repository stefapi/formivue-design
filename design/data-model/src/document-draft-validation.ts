import { computed, type Ref } from 'vue'
import {
  compileFormDocuments,
  type CompileFormDocumentOptions,
  type FormDocumentJson,
  type FormDocuments,
} from '@formivue-design/formivue-transformer'
import {
  compileDataValidator,
  DocumentValidationError,
  isJsonObject,
  type JsonObject,
} from '@formivue/json-schema'

function parsed<T>(read: () => T) {
  try {
    return { value: read(), error: undefined }
  } catch (error) {
    return { value: undefined, error }
  }
}

function readObject<T>(source: string, path: string): T {
  const candidate = JSON.parse(source)
  if (isJsonObject(candidate)) return candidate as T
  throw new DocumentValidationError([
    { path, code: 'invalid_json_object', message: 'Expected a JSON object' },
  ])
}

export function useDocumentDraftValidation(
  files: Readonly<Ref<FormDocumentJson | undefined>>,
  options: () => CompileFormDocumentOptions,
) {
  const schemaSource = computed(() => files.value?.dataSchema)
  const uiSource = computed(() => files.value?.ui)
  const dataSource = computed(() => files.value?.data)
  const schema = computed(() =>
    parsed(() =>
      readObject<FormDocuments['dataSchema']>(
        schemaSource.value,
        '/dataSchema',
      ),
    ),
  )
  const ui = computed(() =>
    parsed(() => readObject<FormDocuments['ui']>(uiSource.value, '/ui')),
  )
  const data = computed(() =>
    parsed(() => readObject<JsonObject>(dataSource.value, '/data')),
  )
  const validation = computed(() =>
    schema.value.value
      ? parsed(() =>
          compileDataValidator(schema.value.value, {
            ...options().schemaValidation,
            includeValidationDetails: true,
          }),
        )
      : { error: schema.value.error, value: undefined },
  )
  const compiled = computed(() =>
    ui.value.value && validation.value.value
      ? parsed(() =>
          compileFormDocuments(
            { ui: ui.value.value, dataSchema: schema.value.value },
            options(),
          ),
        )
      : { value: undefined, error: ui.value.error },
  )
  const dataIssues = computed(() => {
    if (data.value.error) return data.value.error
    const candidate = data.value.value
    try {
      const issues = validation.value.value?.(candidate) ?? []
      if (!issues.length && compiled.value.value)
        issues.push(...compiled.value.value.validateBindings(candidate))
      return issues.length ? new DocumentValidationError(issues) : undefined
    } catch (cause) {
      return cause
    }
  })
  const blocked = computed(() => !compiled.value.value || !!dataIssues.value)
  return {
    schemaSource,
    schema,
    data,
    validation,
    compiled,
    dataIssues,
    blocked,
  }
}
