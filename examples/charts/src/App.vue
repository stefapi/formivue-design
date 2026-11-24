<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createForm } from '@formivue/core'
import { ChartMaterials } from '@formivue-design/charts-runtime'
import { Materials } from '@formivue-design/formivue-vue'
import { createSchemaField, FormProvider } from '@formivue/vue'
import { exampleLocale, LanguagePicker, message } from '../../shared/language'
import {
  createExampleSchemaScope,
  translateExampleSchema,
} from '../../shared/schema-language'
import { copy, schemaCopy, t } from './copy'
import { chartGroups, chartPropsForLanguage } from './gallery'
import {
  chartSchema,
  sampleSales,
  salesPeriods,
  salesStatuses,
  tableSchema,
} from './sales'

const brandMark = `${import.meta.env.BASE_URL}formivue-mark.svg`
const { SchemaField } = createSchemaField({
  components: { ...Materials, ...ChartMaterials },
})
const form = createForm({ initialValues: { sales: sampleSales() } })
const schemaLanguage = createExampleSchemaScope(schemaCopy)
const languageScope = {
  ...schemaLanguage,
  $salesChartRows: (rows: ReturnType<typeof sampleSales>) => {
    const month = schemaLanguage.$exampleText('Mois')
    const channel = schemaLanguage.$exampleText('Canal')
    const amount = schemaLanguage.$exampleText('Montant')
    const store = schemaLanguage.$exampleText('Boutique')
    return rows.map(({ Date, Canal, Montant, Statut }) => ({
      Date,
      Statut,
      [month]: Date,
      [channel]: Canal === 'Boutique' ? store : Canal,
      [amount]: Montant,
    }))
  },
}
const translatedTable = computed(() =>
  translateExampleSchema(tableSchema, schemaCopy),
)
const aggregation = ref<'sum' | 'mean'>('sum')
const valueFormat = ref<'auto' | 'euro' | 'decimal'>('euro')
const period = ref('')
const status = ref('')
const periodOptions = computed(() => {
  const month = new Intl.DateTimeFormat(exampleLocale.value, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return salesPeriods.map(([start]) => ({
    value: start,
    label: month.format(new Date(start)),
  }))
})
watch(
  [aggregation, valueFormat, period, status],
  ([aggregation, valueFormat, period, status]) =>
    form.setValuesIn('chartSettings', {
      aggregation,
      valueFormat,
      period: salesPeriods.find(([start]) => start === period) ?? [],
      status,
    }),
  { immediate: true },
)

const family = ref('all')
const familyFilters = [{ id: 'all', label: copy.all }, ...chartGroups]
const visibleCharts = computed(() =>
  chartGroups
    .filter((group) => family.value === 'all' || group.id === family.value)
    .flatMap(({ charts }) =>
      charts.map((chart) => ({
        ...chart,
        props: chartPropsForLanguage(chart.props),
      })),
    ),
)
</script>

<template>
  <header class="site-header">
    <div class="page-shell header-inner">
      <a class="brand" href="#accueil" :aria-label="t('home')">
        <img :src="brandMark" alt="" width="30" height="30" />
        <span>Formivue</span>
      </a>
      <div class="header-actions">
        <nav :aria-label="t('navigation')">
          <a href="#interaction">{{ t('interactive') }}</a>
          <a href="#galerie">{{ t('gallery') }}</a>
        </nav>
        <LanguagePicker />
      </div>
    </div>
  </header>

  <main id="accueil" class="page-shell">
    <section class="intro" aria-labelledby="page-title">
      <div>
        <h1 id="page-title">{{ t('pageTitle') }}</h1>
        <p>
          {{ t('intro') }}
        </p>
      </div>
      <a class="primary-link" href="#galerie">
        {{ t('explore') }} <span aria-hidden="true">↓</span>
      </a>
    </section>

    <section id="interaction" class="live-demo" aria-labelledby="live-title">
      <div class="live-heading">
        <div>
          <h2 id="live-title">{{ t('liveTitle') }}</h2>
          <p>
            {{ t('liveHelp') }}
          </p>
        </div>
        <div class="controls">
          <label>
            <span>{{ t('period') }}</span>
            <select v-model="period">
              <option value="">{{ t('allPeriods') }}</option>
              <option
                v-for="option in periodOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            <span>{{ t('status') }}</span>
            <select v-model="status">
              <option value="">{{ t('allStatuses') }}</option>
              <option
                v-for="option in salesStatuses"
                :key="option.value"
                :value="option.value"
              >
                {{ message(schemaCopy[option.label]) }}
              </option>
            </select>
          </label>
          <label>
            <span>{{ t('aggregation') }}</span>
            <select v-model="aggregation">
              <option value="sum">{{ t('sum') }}</option>
              <option value="mean">{{ t('mean') }}</option>
            </select>
          </label>
          <label>
            <span>{{ t('format') }}</span>
            <select v-model="valueFormat">
              <option value="euro">{{ t('euro') }}</option>
              <option value="decimal">{{ t('decimal') }}</option>
              <option value="auto">{{ t('auto') }}</option>
            </select>
          </label>
        </div>
      </div>
      <FormProvider :form="form">
        <div class="live-content">
          <div class="live-plot">
            <SchemaField :schema="chartSchema" :scope="languageScope" />
          </div>
          <div class="live-table">
            <div class="table-heading">
              <h3>{{ t('saleRows') }}</h3>
              <button
                type="button"
                class="quiet-button"
                @click="form.setValuesIn('sales', sampleSales())"
              >
                {{ t('reset') }}
              </button>
            </div>
            <SchemaField :schema="translatedTable" :scope="languageScope" />
          </div>
        </div>
      </FormProvider>
    </section>

    <section id="galerie" class="gallery" aria-labelledby="gallery-title">
      <div class="gallery-heading">
        <div>
          <h2 id="gallery-title">{{ t('galleryTitle') }}</h2>
          <p>
            {{ t('galleryHelp') }}
          </p>
        </div>
        <p class="chart-count" role="status">
          {{ t('chartCount', { count: visibleCharts.length }) }}
        </p>
      </div>
      <div class="filters" role="group" :aria-label="t('families')">
        <button
          v-for="filter in familyFilters"
          :key="filter.id"
          type="button"
          :aria-pressed="family === filter.id"
          @click="family = filter.id"
        >
          {{ message(filter.label) }}
        </button>
      </div>
      <div class="chart-grid">
        <article
          v-for="chart in visibleCharts"
          :key="chart.name"
          class="chart-card"
        >
          <component
            :is="ChartMaterials[chart.name]"
            v-bind="chart.props"
            :locale="exampleLocale"
            :height="225"
          />
          <p>{{ message(chart.description) }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
