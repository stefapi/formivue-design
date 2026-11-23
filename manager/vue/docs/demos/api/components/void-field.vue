<template>
  <FormProvider :form="form">
    <Space direction="vertical">
      <VoidField name="layout">
        <Field name="input" :component="[Input]" />
      </VoidField>
      <FormConsumer>
        <template #default="{ form }">
          <Space>
            <Button
              @click="
                () => {
                  form
                    .query('layout')
                    .take()
                    .setState((state) => {
                      state.visible = !state.visible
                    })
                }
              "
            >
              {{ form.query('layout').get('visible') ? 'Hide' : 'Show' }}
            </Button>
            <div>{{ JSON.stringify(form.values, null, 2) }}</div>
          </Space>
        </template>
      </FormConsumer>
    </Space>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, Field, FormConsumer, VoidField } from '@formivue/vue'
import { Button, Input, Space } from '../../../ui'

const form = createForm()
</script>
