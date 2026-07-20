<script setup lang="ts">
import { reactive, watch } from 'vue'
import Icon from '@/components/common/BaseIcon.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { title: string; authority: string; version: string; date: string }): void
}>()

const form = reactive({ title: '', authority: '', version: '', date: '' })
const errors = reactive({ title: '', authority: '', version: '', date: '' })

// Reset form and errors when modal is opened/closed
watch(
  () => props.show,
  (val) => {
    if (val) {
      form.title = ''
      form.authority = ''
      form.version = ''
      form.date = ''
      errors.title = ''
      errors.authority = ''
      errors.version = ''
      errors.date = ''
    }
  }
)

function submit() {
  errors.title = form.title.trim() ? '' : 'Title is required.'
  errors.authority = form.authority.trim() ? '' : 'Issuing authority is required.'
  errors.version = form.version.trim() ? '' : 'Version is required.'
  errors.date = form.date ? '' : 'Date is required.'

  if (Object.values(errors).some(Boolean)) return

  emit('submit', {
    title: form.title.trim(),
    authority: form.authority.trim(),
    version: form.version.trim(),
    date: form.date
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel">
        <h3 class="text-[16px] font-semibold mb-[14px]">Add policy document</h3>

        <div class="field">
          <label>Title</label>
          <input type="text" v-model="form.title" :class="{ 'has-error': errors.title }" />
          <div v-if="errors.title" class="error">
            <Icon name="alert" size="14" /> {{ errors.title }}
          </div>
        </div>

        <div class="field">
          <label>Issuing authority</label>
          <input type="text" v-model="form.authority" :class="{ 'has-error': errors.authority }" />
          <div v-if="errors.authority" class="error">
            <Icon name="alert" size="14" /> {{ errors.authority }}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Version</label>
            <input type="text" v-model="form.version" placeholder="e.g. 1.0" :class="{ 'has-error': errors.version }" />
            <div v-if="errors.version" class="error">
              <Icon name="alert" size="14" /> {{ errors.version }}
            </div>
          </div>
          <div class="field">
            <label>Date</label>
            <input type="date" v-model="form.date" :class="{ 'has-error': errors.date }" />
            <div v-if="errors.date" class="error">
              <Icon name="alert" size="14" /> {{ errors.date }}
            </div>
          </div>
        </div>

        <div class="text-[11.5px] text-[var(--ink-500)] mt-3 mb-[18px] leading-normal">
          If a document with this exact title is already active, it will be marked superseded and retained for
          historical reference.
        </div>

        <div class="flex justify-end gap-[10px]">
          <button @click="emit('close')" class="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button @click="submit" class="btn btn-primary btn-sm">
            Add document
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
