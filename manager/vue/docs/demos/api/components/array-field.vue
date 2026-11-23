<template>
  <FormProvider :form="form">
    <ArrayField name="array">
      <template #default="{ field }">
        <div
          v-for="(item, index) in field.value || []"
          :key="`${item.id}-${index}`"
          class="mb-2.5"
        >
          <Space>
            <Field :name="`${index}.value`" :component="[Input]" />
            <Button
              @click="
                () => {
                  field.remove(index)
                }
              "
            >
              Remove
            </Button>
            <Button
              @click="
                () => {
                  field.moveUp(index)
                }
              "
            >
              Move Up
            </Button>
            <Button
              @click="
                () => {
                  field.moveDown(index)
                }
              "
            >
              Move Down
            </Button>
          </Space>
        </div>
        <Button @click="() => field.push({ id: Date.now(), value: '' })">
          Add
        </Button>
      </template>
    </ArrayField>
  </FormProvider>
</template>

<script setup>
import { createForm } from '@formivue/core'
import { FormProvider, ArrayField, Field } from '@formivue/vue'
import { Button, Input, Space } from '../../../ui'

const form = createForm()
</script>
