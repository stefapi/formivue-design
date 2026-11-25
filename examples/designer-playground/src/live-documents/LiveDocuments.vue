<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef } from 'vue'
import { LifeCycleTypes } from '@formivue/core'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { Materials } from '@formivue-design/formivue-vue'
import { DataTable } from '@formivue-design/shadcn-advanced-runtime'
import { BarChart } from '@formivue-design/charts-runtime'
import {
  parseFormDocuments,
  type FormDocumentJson,
} from '@formivue-design/formivue-transformer'
import { exampleLocale, LanguagePicker } from '../../../shared/language'
import {
  createExampleSchemaScope,
  translateExampleSchema,
} from '../../../shared/schema-language'
import { documentError, validationMessage } from '../document-messages'
import { schemaCopy, t, type CopyKey } from './copy'
import { createSalesDemo } from './model'

const brand = import.meta.env.BASE_URL + 'formivue-mark.svg'

const { SchemaField } = createSchemaField({
  components: { ...Materials, DataTable, BarChart },
})
type SalesDemo = ReturnType<typeof createSalesDemo>
const demo = shallowRef(createSalesDemo())
const session = computed(() => demo.value.session)
const languageScope = createExampleSchemaScope(schemaCopy)
const scope = computed(() => ({ ...session.value.scope, ...languageScope }))
const sections = computed(() => {
  const source = session.value.schema.properties
  const properties =
    typeof source === 'object' && source
      ? translateExampleSchema(source, schemaCopy)
      : {}
  if (
    properties.chart &&
    typeof properties.chart['x-component-props'] === 'object'
  )
    properties.chart['x-component-props'].locale = '{{ $exampleLocale() }}'
  return {
    chart: { type: 'object', properties: { chart: properties.chart } },
    editor: { type: 'object', properties: { boutiques: properties.boutiques } },
    published: {
      type: 'object',
      properties: { published: properties.published },
    },
  }
})

const fileNames = {
  ui: 'ui.json',
  dataSchema: 'data.schema.json',
  data: 'data.json',
} satisfies Record<keyof FormDocumentJson, string>
const selected = ref<keyof FormDocumentJson>('data')
const drafts = ref<Partial<FormDocumentJson>>({})
const files = shallowRef(demo.value.files())
const revision = ref(0)
const conflicts = ref<string[]>([])
const issue = shallowRef<{ path: string; message: string }>()
const sales = shallowRef(salesRows())
const sequence = ref(0)
const stream = ref(false)
let timer: ReturnType<typeof setInterval>

function salesRows() {
  return session.value.exportData().boutiques as {
    boutique: string
    ventes: number
    objectif: number
  }[]
}

type Activity = {
  id: number
  label: CopyKey
  detail: () => string
  level: 'ok' | 'error' | 'conflict'
}
const activity = ref<Activity[]>([
  {
    id: 0,
    label: 'loaded',
    detail: () => t('verified'),
    level: 'ok',
  },
])

function record(
  label: CopyKey,
  detail: () => string,
  level: Activity['level'] = 'ok',
) {
  activity.value = [
    { id: ++sequence.value, label, detail, level },
    ...activity.value,
  ].slice(0, 3)
}

function refresh() {
  files.value = demo.value.files()
  sales.value = salesRows()
  revision.value = session.value.revision
  conflicts.value = session.value.conflicts
  const first = session.value.issues[0]
  issue.value = first
}

function watchForm(current: SalesDemo) {
  let pending = false
  current.session.form.subscribe(({ type }) => {
    if (type !== LifeCycleTypes.ON_FORM_VALUES_CHANGE || pending) return
    pending = true
    queueMicrotask(() => {
      pending = false
      if (demo.value === current) refresh()
    })
  })
}
watchForm(demo.value)

function send(
  label: CopyKey,
  action: (current: SalesDemo) => { revision: number; detail?: () => string },
) {
  try {
    const event = action(demo.value)
    refresh()
    record(
      label,
      event.detail ??
        (() => t('publishedRevision', { revision: event.revision })),
      conflicts.value.length ? 'conflict' : 'ok',
    )
  } catch (error) {
    record('rejected', () => documentError(error), 'error')
  }
}

function patch() {
  send('partial', (demo) => demo.publishPatch())
}

function toggleStream() {
  stream.value = !stream.value
  if (stream.value) timer = setInterval(patch, 2800)
  else clearInterval(timer)
}

function resolve(keep: boolean) {
  session.value.resolveConflicts(keep)
  refresh()
  record(keep ? 'editsKept' : 'restored', () => t('resolved'))
}

const euro = computed(
  () =>
    new Intl.NumberFormat(exampleLocale.value, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }),
)
const total = computed(() =>
  sales.value.reduce((sum, row) => sum + row.ventes, 0),
)
const target = computed(() =>
  sales.value.reduce((sum, row) => sum + row.objectif, 0),
)
const progress = computed(() =>
  target.value ? Math.round((100 * total.value) / target.value) : 0,
)
const currentText = computed(
  () => drafts.value[selected.value] ?? files.value[selected.value],
)

function edit(event: Event) {
  drafts.value[selected.value] = (event.target as HTMLTextAreaElement).value
}

function applyDocuments() {
  try {
    const docs = parseFormDocuments({ ...files.value, ...drafts.value })
    const previous = session.value.exportDocuments()
    if (
      JSON.stringify(previous.ui) === JSON.stringify(docs.ui) &&
      JSON.stringify(previous.dataSchema) === JSON.stringify(docs.dataSchema)
    ) {
      demo.value.applyData(docs.data)
    } else {
      const next = createSalesDemo(docs)
      session.value.dispose()
      demo.value = next
      watchForm(next)
    }
    drafts.value = {}
    refresh()
    record('applied', () => t('verified'))
  } catch (error) {
    record('filesRejected', () => documentError(error), 'error')
  }
}

const fileError = computed(() => {
  const latest = activity.value[0]
  return latest.label === 'filesRejected' ? latest.detail() : ''
})

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const part = selected.value
  if (!file) return
  try {
    drafts.value[part] = await file.text()
  } catch (error) {
    record('filesRejected', () => documentError(error), 'error')
  } finally {
    input.value = ''
  }
}

function download() {
  const url = URL.createObjectURL(
    new Blob([files.value[selected.value]], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.download = fileNames[selected.value]
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

onUnmounted(() => {
  clearInterval(timer)
  session.value.dispose()
})
</script>

<template>
  <div class="live-demo">
    <header class="demo-header">
      <div class="demo-shell demo-nav">
        <a class="demo-brand" href="./">
          <img :src="brand" alt="" /> Formivue <span>{{ t('demo') }}</span>
        </a>
        <div class="demo-nav-actions">
          <LanguagePicker />
          <a class="back-link" href="./?mode=advanced"
            >{{ t('back') }} <span aria-hidden="true">↗</span></a
          >
        </div>
      </div>
    </header>

    <main class="demo-shell demo-main">
      <section class="demo-hero" aria-labelledby="demo-title">
        <div>
          <h1 id="demo-title">{{ t('title') }}</h1>
          <p>
            {{ t('intro') }}
          </p>
        </div>
        <button
          class="stream-button"
          type="button"
          :aria-pressed="stream"
          @click="toggleStream"
        >
          <span
            class="stream-dot"
            :class="{ running: stream }"
            aria-hidden="true"
          ></span>
          {{ t(stream ? 'pause' : 'start') }}
        </button>
      </section>

      <dl class="metrics">
        <div>
          <dt>{{ t('revenue') }}</dt>
          <dd>{{ euro.format(total) }}</dd>
        </div>
        <div>
          <dt>{{ t('target') }}</dt>
          <dd>{{ progress }} <span>%</span></dd>
        </div>
        <div>
          <dt>{{ t('revision') }}</dt>
          <dd data-testid="revision">{{ revision }}</dd>
        </div>
      </dl>

      <FormProvider :key="session.form.id" :form="session.form" retain>
        <div class="dashboard-grid">
          <section class="demo-card chart-card" aria-labelledby="chart-title">
            <div class="card-heading">
              <div>
                <h2 id="chart-title">{{ t('byShop') }}</h2>
              </div>
              <code>/boutiques</code>
            </div>
            <SchemaField
              v-if="sections.chart.properties.chart"
              :schema="sections.chart"
              :scope="scope"
            />
          </section>

          <section class="demo-card feed-card" aria-labelledby="feed-title">
            <div class="card-heading">
              <div>
                <h2 id="feed-title">{{ t('feed') }}</h2>
                <p>{{ t('feedIntro') }}</p>
              </div>
            </div>
            <div class="feed-actions">
              <button type="button" class="demo-button accent" @click="patch">
                {{ t('sendPatch') }}
              </button>
              <button
                type="button"
                class="demo-button"
                @click="send('snapshot', (demo) => demo.publishSnapshot())"
              >
                {{ t('replace') }}
              </button>
              <button
                type="button"
                class="demo-button"
                @click="send('invalidBatch', (demo) => demo.rejectPatch())"
              >
                {{ t('invalid') }}
              </button>
              <button
                type="button"
                class="demo-button"
                @click="send('editConflict', (demo) => demo.simulateConflict())"
              >
                {{ t('conflict') }}
              </button>
            </div>
            <ol class="activity" :aria-label="t('updates')" aria-live="polite">
              <li
                v-for="entry in activity"
                :key="entry.id"
                :data-level="entry.level"
              >
                <span class="activity-dot" aria-hidden="true"></span>
                <div>
                  <strong>{{ t(entry.label) }}</strong><small>{{
                    entry.detail()
                  }}</small>
                </div>
              </li>
            </ol>
          </section>

          <section
            class="demo-card table-card editor-card"
            aria-labelledby="edit-title"
          >
            <div class="card-heading">
              <div>
                <h2 id="edit-title">{{ t('local') }}</h2>
                <p>{{ t('edit') }}</p>
              </div>
              <code>ArrayTable</code>
            </div>
            <div v-if="conflicts.length" class="conflict-banner" role="status">
              <strong>{{ t('preserved') }}</strong>
              <p>{{ t('overlap', { paths: conflicts.join(', ') }) }}</p>
              <div>
                <button
                  type="button"
                  class="demo-button"
                  @click="resolve(true)"
                >
                  {{ t('keep') }}
                </button>
                <button
                  type="button"
                  class="demo-button"
                  @click="resolve(false)"
                >
                  {{ t('takeSnapshot') }}
                </button>
              </div>
            </div>
            <p v-if="issue" class="validation" role="status">
              {{ issue.path }} · {{ validationMessage(issue.message) }}
            </p>
            <SchemaField
              v-if="sections.editor.properties.boutiques"
              :schema="sections.editor"
              :scope="scope"
            />
          </section>

          <section
            class="demo-card table-card published-card"
            aria-labelledby="published-title"
          >
            <div class="card-heading">
              <div>
                <h2 id="published-title">{{ t('published') }}</h2>
                <p>{{ t('latest') }}</p>
              </div>
              <code>DataTable</code>
            </div>
            <SchemaField
              v-if="sections.published.properties.published"
              :schema="sections.published"
              :scope="scope"
            />
          </section>
        </div>
      </FormProvider>

      <section class="demo-card json-card" aria-labelledby="json-title">
        <div class="card-heading">
          <div>
            <h2 id="json-title">{{ t('documents') }}</h2>
            <p>
              {{ t('documentsIntro') }}
            </p>
          </div>
        </div>
        <div class="json-toolbar">
          <div class="file-tabs" role="group" :aria-label="t('jsonGroup')">
            <button
              v-for="(name, key) in fileNames"
              :key="key"
              type="button"
              :aria-pressed="selected === key"
              @click="selected = key"
            >
              {{ name }}
            </button>
          </div>
          <div class="file-actions">
            <label class="demo-button file-button"
              >{{ t('import')
              }}<input
                type="file"
                accept=".json,application/json"
                :aria-label="t('importFile', { file: fileNames[selected] })"
                @change="importFile"
            /></label>
            <button type="button" class="demo-button" @click="download">
              {{ t('download') }}
            </button>
            <button
              type="button"
              class="demo-button accent"
              @click="applyDocuments"
            >
              {{ t('apply') }}
            </button>
          </div>
        </div>
        <textarea
          :aria-label="fileNames[selected]"
          :value="currentText"
          spellcheck="false"
          @input="edit"
        ></textarea>
        <p v-if="fileError" class="validation" role="alert">{{ fileError }}</p>
      </section>
    </main>
  </div>
</template>
