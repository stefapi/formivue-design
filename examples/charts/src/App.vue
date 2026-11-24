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
import { chartSchema, sampleSales, tableSchema } from './sales'

const brandMark = `${import.meta.env.BASE_URL}formivue-mark.svg`
const { SchemaField } = createSchemaField({
  components: { ...Materials, ...ChartMaterials },
})
const form = createForm({ initialValues: { sales: sampleSales() } })
const languageScope = {
  ...createExampleSchemaScope(schemaCopy),
  $salesChartRows: (rows: ReturnType<typeof sampleSales>, monthLabel: string) =>
    rows.map(({ Mois, ...row }) => ({ ...row, [monthLabel]: Mois })),
}
const translatedTable = computed(() =>
  translateExampleSchema(tableSchema, schemaCopy),
)
const aggregation = ref<'sum' | 'mean'>('sum')
const valueFormat = ref<'auto' | 'euro' | 'decimal'>('euro')
watch(
  [aggregation, valueFormat],
  ([aggregation, valueFormat]) =>
    form.setValuesIn('chartSettings', { aggregation, valueFormat }),
  { immediate: true },
)

const family = ref('all')
const filters = [{ id: 'all', label: copy.all }, ...chartGroups]
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
          v-for="filter in filters"
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
