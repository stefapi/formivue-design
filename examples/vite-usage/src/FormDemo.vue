<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <header class="relative overflow-hidden bg-slate-950 text-white">
      <div
        class="pointer-events-none absolute inset-0 opacity-60"
        style="
          background:
            radial-gradient(
              60% 80% at 15% 0%,
              rgb(99 102 241 / 0.45),
              transparent 60%
            ),
            radial-gradient(
              50% 70% at 90% 20%,
              rgb(236 72 153 / 0.25),
              transparent 60%
            ),
            radial-gradient(
              40% 60% at 60% 100%,
              rgb(16 185 129 / 0.2),
              transparent 60%
            );
        "
      />
      <div class="relative mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8 sm:pt-20">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <img
            :src="`${logoUrl}#dark`"
            alt="Formivue"
            width="161"
            height="40"
            class="h-8 w-auto"
          />
          <p
            class="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-indigo-100 ring-1 ring-white/15"
          >
            @formivue/vue · v{{ version }}
          </p>
        </div>
        <h1
          class="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          Forms that are
          <span
            class="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent"
          >
            reactive</span
          >, no glue.
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
          formivue separates the
          <strong class="text-white">form state</strong> (an observable,
          field-by-field model) from its
          <strong class="text-white">rendering</strong>. Each demo below shows
          the live reactive state of
          <code class="font-mono text-indigo-200">form</code>
          on the right — type, break things, observe.
        </p>
        <div class="mt-6 flex flex-wrap gap-2 text-[12px] text-slate-300">
          <span
            v-for="s in stack"
            :key="s"
            class="rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10"
            >{{ s }}</span
          >
        </div>

        <div class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            v-for="(d, i) in demos"
            :key="d.id"
            :href="`#${d.id}`"
            class="group rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <span class="font-mono text-[11px] text-indigo-300"
              >0{{ i + 1 }}</span
            >
            <span class="mt-1 block font-semibold text-white">{{
              d.label
            }}</span>
            <span class="mt-1 block text-[13px] leading-snug text-slate-400">{{
              d.pitch
            }}</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Sticky navigation -->
    <nav
      class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur"
      aria-label="Demos"
    >
      <div
        class="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-2.5 sm:px-8"
      >
        <img
          :src="logoUrl"
          alt="Formivue"
          width="161"
          height="40"
          class="mr-3 h-6 w-auto shrink-0"
        />
        <a
          v-for="(d, i) in demos"
          :key="d.id"
          :href="`#${d.id}`"
          class="shrink-0 rounded-md px-2.5 py-1 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <span class="text-slate-400">{{ i + 1 }}.</span> {{ d.label }}
        </a>
      </div>
    </nav>

    <main class="mx-auto max-w-6xl space-y-20 px-5 py-14 sm:px-8">
      <!-- 1. Tenant ---------------------------------------------------------- -->
      <DemoSection
        id="demo-locataire"
        :index="1"
        kicker="Fields · validation · effects"
        title="Tenant"
        :apis="[
          'createForm',
          '<Field>',
          'zodValidator',
          'onFieldInputValueChange',
          'form.setPattern',
        ]"
        :code="codeLocataire"
      >
        <template #description>
          Each <code class="font-mono text-indigo-700">&lt;Field&gt;</code> is
          an observable model: title, required, errors, validation state. The
          rules come from the <strong>same zod schema</strong> as vee-validate.
          Switch the display mode to watch the same form become read-only or
          "read pretty".
        </template>

        <FormProvider :form="locataireForm">
          <div
            class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"
          >
            <h3 class="text-sm font-semibold text-slate-900">Tenant profile</h3>
            <div class="seg" role="group" aria-label="Form display mode">
              <button
                v-for="p in patterns"
                :key="p"
                type="button"
                :aria-pressed="pattern === p"
                @click="setPattern(p)"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <div class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field
              name="nom"
              title="Full name"
              required
              :validator="zodValidator(locataireSchema.shape.nom)"
              :decorator="[FormItem]"
              :component="[FInput, { placeholder: 'Jean Dupont' }]"
            />
            <Field
              name="email"
              title="Email"
              required
              :validator="zodValidator(locataireSchema.shape.email)"
              :decorator="[FormItem]"
              :component="[
                FInput,
                { type: 'email', placeholder: 'jean@exemple.fr' },
              ]"
            />
            <Field
              name="telephone"
              title="Phone"
              :validator="phoneRule"
              description="Format: 06 12 34 56 78"
              :decorator="[FormItem]"
              :component="[FInput, { placeholder: '06 12 34 56 78' }]"
            />
            <Field
              name="revenus"
              title="Net monthly income"
              required
              :validator="zodValidator(locataireSchema.shape.revenus)"
              :decorator="[FormItem, { hint: 'zod · min €1,000' }]"
              :component="[
                FInput,
                { type: 'number', suffix: '€', format: euro },
              ]"
            />
            <Field
              name="garant"
              title="Guarantor"
              :initial-value="false"
              :decorator="[FormItem]"
              :component="[FSwitch, { label: 'A guarantor stands surety' }]"
            />
          </div>

          <div
            class="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5"
          >
            <button type="button" class="btn-primary" @click="submitLocataire">
              Submit
            </button>
            <button type="button" class="btn-ghost" @click="resetLocataire">
              Reset
            </button>
            <button type="button" class="btn-ghost" @click="fillLocataire">
              Fill in a sample
            </button>
            <p
              v-if="submitResult"
              class="ml-auto rounded-full px-3 py-1 text-xs font-semibold ring-1"
              :class="
                submitResult.ok
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-rose-200'
              "
              role="status"
            >
              {{ submitResult.text }}
            </p>
          </div>
        </FormProvider>

        <template #aside>
          <StateInspector
            :form="locataireForm"
            :log="effectsLog"
            title="locataireForm"
          />
        </template>
      </DemoSection>

      <!-- 2. Rent schedule --------------------------------------------------- -->
      <DemoSection
        id="demo-loyers"
        :index="2"
        kicker="Array fields · computed field"
        title="Rent schedule"
        :apis="[
          '<ArrayField>',
          'field.push / remove / moveUp',
          'reactions',
          'batch',
        ]"
        :code="codeLoyers"
      >
        <template #description>
          <code class="font-mono text-indigo-700">&lt;ArrayField&gt;</code>
          manages rows (add, remove, move) while keeping each field's state. The
          total is a field computed by a <em>reaction</em>: it updates on its
          own, with no Vue <code class="font-mono">watch</code> or
          <code class="font-mono">computed</code>.
        </template>

        <FormProvider :form="loyersForm">
          <ArrayField name="echeances" v-slot="{ field }">
            <ol class="space-y-2">
              <li
                v-for="(_, index) in (field as ArrayFieldModel)
                  .value as Echeance[]"
                :key="index"
                class="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70"
              >
                <span
                  class="mt-7 flex size-6 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200"
                >
                  {{ index + 1 }}
                </span>
                <div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <Field
                    :name="`${index}.mois`"
                    title="Month"
                    required
                    :validator="monthRule"
                    :decorator="[FormItem]"
                    :component="[FInput, { type: 'month' }]"
                  />
                  <Field
                    :name="`${index}.montant`"
                    title="Amount"
                    required
                    :validator="{
                      minimum: 1,
                      message: 'A positive amount is expected',
                    }"
                    :decorator="[FormItem]"
                    :component="[
                      FInput,
                      { type: 'number', suffix: '€', format: euro },
                    ]"
                  />
                </div>
                <div class="mt-6 flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    class="btn-icon"
                    :disabled="index === 0"
                    :aria-label="`Move installment ${index + 1} up`"
                    @click="(field as ArrayFieldModel).moveUp(index)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="size-4"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="btn-icon hover:text-rose-600"
                    :aria-label="`Remove installment ${index + 1}`"
                    @click="(field as ArrayFieldModel).remove(index)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="size-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            </ol>
            <p
              v-if="!field.value?.length"
              class="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500"
            >
              No installments yet — add one.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="btn-primary"
                data-testid="add-echeance"
                @click="pushEcheance(field as ArrayFieldModel)"
              >
                <span aria-hidden="true">+</span> Add an installment
              </button>
              <button
                type="button"
                class="btn-ghost"
                @click="indexer(field as ArrayFieldModel)"
              >
                Apply +3.5% rent index
              </button>
            </div>
          </ArrayField>

          <div
            class="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"
          >
            <Field
              name="total"
              title="Total"
              pattern="readPretty"
              :reactions="totalReaction"
              :decorator="[
                TotalTile,
                { 'data-testid': 'loyers-total', tone: 'emerald' },
              ]"
              :component="[FInput, { format: euro }]"
            />
            <Field
              name="moyenne"
              title="Monthly average"
              pattern="readPretty"
              :reactions="moyenneReaction"
              :decorator="[TotalTile, { tone: 'indigo' }]"
              :component="[FInput, { format: euro }]"
            />
          </div>
        </FormProvider>

        <template #aside>
          <StateInspector :form="loyersForm" title="loyersForm" />
        </template>
      </DemoSection>

      <!-- 3. Lease terms ----------------------------------------------------- -->
      <DemoSection
        id="demo-dynamique"
        :index="3"
        kicker="Reactions · dependent fields"
        title="Lease terms"
        :apis="[
          'reactions',
          'field.query()',
          'display',
          'validator dynamique',
          'dataSource',
        ]"
        :code="codeBail"
      >
        <template #description>
          Fields drive each other: the lease type sets the duration, the legal
          cap for the security deposit (1 month unfurnished, 2 months furnished)
          and reveals the inventory, which becomes required. Try a €2,000
          deposit, then switch to furnished.
        </template>

        <FormProvider :form="bailForm">
          <div class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field
              name="type"
              title="Lease type"
              initial-value="vide"
              :data-source="typesBail"
              :decorator="[FormItem]"
              :component="[FSelect, { 'data-testid': 'type-bail' }]"
            />
            <Field
              name="duree"
              title="Minimum duration"
              pattern="readPretty"
              :reactions="dureeReaction"
              :decorator="[FormItem, { hint: 'computed' }]"
              :component="[FInput]"
            />
            <Field
              name="loyer"
              title="Rent excluding charges"
              required
              :initial-value="850"
              :validator="{ minimum: 1 }"
              :decorator="[FormItem]"
              :component="[
                FInput,
                { type: 'number', suffix: '€', format: euro },
              ]"
            />
            <Field
              name="depot"
              title="Security deposit"
              :initial-value="850"
              :reactions="depotReaction"
              :decorator="[FormItem]"
              :component="[
                FInput,
                { type: 'number', suffix: '€', format: euro },
              ]"
            />
            <div class="sm:col-span-2">
              <Field
                name="inventaire"
                title="Furniture inventory"
                :reactions="inventaireReaction"
                :decorator="[MeubleBox, { 'data-testid': 'meuble-detail' }]"
                :component="[
                  FTextarea,
                  { placeholder: 'Washing machine, fridge, 140×190 bed…' },
                ]"
              />
            </div>
          </div>
        </FormProvider>

        <template #aside>
          <StateInspector :form="bailForm" title="bailForm" />
        </template>
      </DemoSection>

      <!-- 4. JSON Schema ----------------------------------------------------- -->
      <DemoSection
        id="demo-schema"
        :index="4"
        kicker="JSON Schema · expressions"
        title="Solvency simulator"
        :apis="[
          'createSchemaField',
          '<SchemaField>',
          'x-reactions',
          '{{ $deps }}',
        ]"
        :code="codeSchema"
      >
        <template #description>
          The same engine, described as <strong>JSON Schema</strong>: the form
          is data (storable, versionable, generatable server-side). Dependencies
          are written as
          <code class="font-mono text-indigo-700">x-reactions</code>
          expressions.
        </template>

        <FormProvider :form="schemaForm">
          <div class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <SchemaField :schema="simulateurSchema" />
          </div>
        </FormProvider>

        <template #aside>
          <StateInspector :form="schemaForm" title="schemaForm" />
        </template>
      </DemoSection>
      <DesignerSchemaDemo />
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"
      >
        <p>
          <span class="font-mono font-semibold text-slate-800">
            Formivue v{{ version }}
          </span>
          · fork Vue 3.5 · ESM-only
        </p>
        <p>
          Vite · TypeScript strict · Tailwind 4 · reka-ui · zod · axe 0
          violation
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { batch } from '@formivue/reactive'
import {
  createForm,
  onFieldInputValueChange,
  onFormReset,
  onFormSubmitFailed,
  onFormSubmitSuccess,
  type ArrayField as ArrayFieldModel,
  type Field as FieldModel,
} from '@formivue/core'
import {
  ArrayField,
  Field,
  FormProvider,
  createSchemaField,
} from '@formivue/vue'
import { version } from '@formivue/vue/package.json'
import { zodValidator } from '@formivue/validator/zod'
import DemoSection from './ui/DemoSection.vue'
import DesignerSchemaDemo from './DesignerSchemaDemo.vue'
import FInput from './ui/FInput.vue'
import FSelect from './ui/FSelect.vue'
import FSwitch from './ui/FSwitch.vue'
import FTextarea from './ui/FTextarea.vue'
import FormItem from './ui/FormItem.vue'
import MeubleBox from './ui/MeubleBox.vue'
import StateInspector from './ui/StateInspector.vue'
import TotalTile from './ui/TotalTile.vue'
import Verdict from './ui/Verdict.vue'

type Echeance = { mois: string; montant: number }
type Pattern = 'editable' | 'readOnly' | 'disabled' | 'readPretty'

const logoUrl = `${import.meta.env.BASE_URL}formivue.svg`

const stack = [
  'Vue 3.5',
  'TypeScript strict',
  'Tailwind 4',
  'reka-ui',
  'zod bridge',
  'ESM-only',
]
const demos = [
  {
    id: 'demo-locataire',
    label: 'Tenant',
    pitch: 'zod validation, effects, 4 display modes.',
  },
  {
    id: 'demo-loyers',
    label: 'Rent schedule',
    pitch: 'Dynamic rows and computed totals.',
  },
  {
    id: 'demo-dynamique',
    label: 'Lease',
    pitch: 'Fields that drive each other.',
  },
  {
    id: 'demo-schema',
    label: 'JSON Schema',
    pitch: 'The form described as data.',
  },
  {
    id: 'demo-designer-schema',
    label: 'Designer form',
    pitch: 'Render a designer export with the manager.',
  },
]

const euro = (v: unknown) =>
  Number(v).toLocaleString('en', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
const time = () => new Date().toLocaleTimeString('en-GB')

// ---------------------------------------------------------------------------
// 1. Tenant — Field + zod + effects + pattern
// ---------------------------------------------------------------------------
const locataireSchema = z.object({
  nom: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email address'),
  revenus: z
    .number({ invalid_type_error: 'A number is expected' })
    .min(1000, 'Minimum income: €1,000'),
})
const phoneRule = {
  pattern: /^0[1-9](?:[\s.]?\d{2}){4}$/,
  message: 'Expected format: 06 12 34 56 78',
}

const effectsLog = ref<string[]>([])
const log = (s: string) => {
  effectsLog.value = [`${time()}  ${s}`, ...effectsLog.value].slice(0, 40)
}
const submitResult = ref<{ ok: boolean; text: string } | null>(null)

const locataireForm = createForm({
  validateFirst: true, // one error at a time: required, then zod rules
  effects() {
    onFieldInputValueChange('*', (f) => {
      log(`input  ${f.address} = ${JSON.stringify((f as FieldModel).value)}`)
    })
    onFormSubmitSuccess(() => log('submit ✓ success'))
    onFormSubmitFailed(() => log('submit ✕ validation failed'))
    onFormReset(() => log('reset'))
  },
})

const patterns: Pattern[] = ['editable', 'readOnly', 'disabled', 'readPretty']
const pattern = ref<Pattern>('editable')
function setPattern(p: Pattern) {
  pattern.value = p
  locataireForm.setPattern(p)
}
async function submitLocataire() {
  try {
    await locataireForm.submit()
    submitResult.value = { ok: true, text: 'Form is valid ✓' }
  } catch (errors) {
    const n = Array.isArray(errors)
      ? errors.length
      : locataireForm.errors.length
    submitResult.value = {
      ok: false,
      text: `${n} error${n > 1 ? 's' : ''} to fix`,
    }
  }
}
async function resetLocataire() {
  submitResult.value = null
  await locataireForm.reset('*', { forceClear: true })
  locataireForm.setValuesIn('garant', false)
}
function fillLocataire() {
  locataireForm.setValues({
    nom: 'Camille Martin',
    email: 'camille.martin@exemple.fr',
    telephone: '06 12 34 56 78',
    revenus: 3200,
    garant: true,
  })
  log('setValues  sample loaded')
}

const codeLocataire = `const schema = z.object({
  nom: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email address'),
})

const form = createForm({
  effects() {
    onFieldInputValueChange('*', (f) => log(f.address, f.value))
  },
})

<Field
  name="email" title="Email" required
  :validator="zodValidator(schema.shape.email)"
  :decorator="[FormItem]"
  :component="[FInput, { type: 'email' }]"
/>

form.setPattern('readPretty') // the whole form`

// ---------------------------------------------------------------------------
// 2. Rent schedule — ArrayField + computed fields
// ---------------------------------------------------------------------------
const monthRule = {
  pattern: /^\d{4}-\d{2}$/,
  message: 'Month expected (YYYY-MM)',
}
const loyersForm = createForm({
  values: {
    echeances: [
      { mois: '2026-12', montant: 850 },
      { mois: '2027-01', montant: 850 },
    ] as Echeance[],
  },
})
const sumEcheances = (f: FieldModel) =>
  ((f.form.values.echeances ?? []) as Echeance[]).reduce(
    (s, e) => s + (Number(e?.montant) || 0),
    0,
  )
const totalReaction = (f: FieldModel) => {
  f.value = sumEcheances(f)
}
const moyenneReaction = (f: FieldModel) => {
  const n = ((f.form.values.echeances ?? []) as Echeance[]).length
  f.value = n ? Math.round(sumEcheances(f) / n) : 0
}
function nextMonth(m?: string) {
  if (!m || !/^\d{4}-\d{2}$/.test(m)) return ''
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function pushEcheance(field: ArrayFieldModel) {
  const list = (field.value ?? []) as Echeance[]
  const last = list[list.length - 1]
  field.push({ mois: nextMonth(last?.mois), montant: last?.montant ?? 850 })
}
function indexer(field: ArrayFieldModel) {
  // batch: a single notification for N mutations
  batch(() => {
    ;((field.value ?? []) as Echeance[]).forEach((e, i) => {
      loyersForm.setValuesIn(
        `echeances.${i}.montant`,
        Math.round((Number(e.montant) || 0) * 1.035),
      )
    })
  })
}

const codeLoyers = `<ArrayField name="echeances" v-slot="{ field }">
  <li v-for="(_, i) in field.value" :key="i">
    <Field :name="\`\${i}.montant\`" :component="[FInput]" />
    <button @click="field.moveUp(i)">↑</button>
    <button @click="field.remove(i)">✕</button>
  </li>
  <button @click="field.push({ mois: '', montant: 850 })">+</button>
</ArrayField>

<!-- computed field: the reaction is replayed as soon
     as any read value changes -->
<Field name="total" pattern="readPretty"
  :reactions="(f) => (f.value = sum(f.form.values.echeances))" />`

// ---------------------------------------------------------------------------
// 3. Lease — cross reactions
// ---------------------------------------------------------------------------
const typesBail = [
  { label: 'Unfurnished rental', value: 'vide' },
  { label: 'Furnished rental', value: 'meuble' },
]
const bailForm = createForm()
const isMeuble = (f: FieldModel) => f.query('type').value() === 'meuble'
const dureeReaction = (f: FieldModel) => {
  f.value = isMeuble(f) ? '1 year (9 months for students)' : '3 years'
}
const depotReaction = (f: FieldModel) => {
  const mois = isMeuble(f) ? 2 : 1
  const plafond = (Number(f.query('loyer').value()) || 0) * mois
  f.description = `Legal cap: ${euro(plafond)} (${mois} months of rent excluding charges)`
  f.validator = [
    { maximum: plafond, message: `Exceeds the legal cap of ${euro(plafond)}` },
  ]
  if (f.modified || f.value != null) void f.validate().catch(() => {})
}
const inventaireReaction = (f: FieldModel) => {
  const meuble = isMeuble(f)
  f.display = meuble ? 'visible' : 'none'
  f.required = meuble
}

const codeBail = `<Field name="depot" :reactions="(f) => {
  const meuble = f.query('type').value() === 'meuble'
  const plafond = f.query('loyer').value() * (meuble ? 2 : 1)
  f.description = \`Legal cap: \${plafond} EUR\`
  f.validator = [{ maximum: plafond }]
}" />

<Field name="inventaire" :reactions="(f) => {
  const meuble = f.query('type').value() === 'meuble'
  f.display = meuble ? 'visible' : 'none'
  f.required = meuble
}" />`

// ---------------------------------------------------------------------------
// 4. JSON Schema — SchemaField + x-reactions
// ---------------------------------------------------------------------------
const { SchemaField } = createSchemaField({
  components: { FormItem, FInput, FSwitch, Verdict },
})
const schemaForm = createForm()
const simulateurSchema = {
  type: 'object',
  properties: {
    revenus: {
      type: 'number',
      title: 'Household net monthly income',
      default: 2600,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { type: 'number', suffix: '€' },
    },
    loyer: {
      type: 'number',
      title: 'Rent including charges',
      default: 950,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'FInput',
      'x-component-props': { type: 'number', suffix: '€' },
    },
    taux: {
      type: 'number',
      title: 'Effort rate',
      'x-pattern': 'readPretty',
      'x-decorator': 'FormItem',
      'x-decorator-props': { hint: 'x-reactions' },
      'x-component': 'FInput',
      'x-component-props': { suffix: '%' },
      'x-reactions': {
        dependencies: ['revenus', 'loyer'],
        fulfill: {
          state: {
            value:
              '{{ $deps[0] > 0 ? Math.round(($deps[1] / $deps[0]) * 1000) / 10 : 0 }}',
          },
        },
      },
    },
    garant: {
      type: 'boolean',
      title: 'Garant',
      'x-decorator': 'FormItem',
      'x-component': 'FSwitch',
      'x-component-props': { label: 'Offer a guarantor' },
      'x-reactions': {
        dependencies: ['taux'],
        fulfill: { state: { visible: '{{ $deps[0] > 33 }}' } },
      },
    },
    verdict: {
      type: 'void',
      'x-component': 'Verdict',
      'x-component-props': { class: 'sm:col-span-2' },
      'x-reactions': {
        dependencies: ['taux'],
        fulfill: { state: { 'componentProps.taux': '{{ $deps[0] }}' } },
      },
    },
  },
}
const codeSchema = JSON.stringify(simulateurSchema, null, 2)
</script>
