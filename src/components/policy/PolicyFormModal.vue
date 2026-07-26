<script setup lang="ts">
import { reactive, watch } from 'vue'
import Icon from '@/components/common/BaseIcon.vue'
import FormFileUpload from '@/components/adviser/FormFileUpload.vue'
import type { PolicyDocument } from '@/types/policy'

const props = defineProps<{
  show: boolean
  initialData?: PolicyDocument | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { title: string; authority: string; version: string; date: string; status: 'active' | 'superseded' | 'inactive'; file?: File | null }): void
}>()

const form = reactive({ title: '', authority: '', version: '', date: '', status: 'active' as 'active' | 'superseded' | 'inactive', file: null as File | null })
const errors = reactive({ title: '', authority: '', version: '', date: '', file: '' })

// Reset or populate form when modal opens
watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.initialData) {
        form.title = props.initialData.title
        form.authority = props.initialData.authority
        form.version = props.initialData.version
        form.date = props.initialData.date ? props.initialData.date.substring(0, 10) : ''
        form.status = props.initialData.status
      } else {
        form.title = ''
        form.authority = ''
        form.version = ''
        form.date = ''
        form.status = 'active'
      }
      form.file = null
      errors.title = ''
      errors.authority = ''
      errors.version = ''
      errors.date = ''
      errors.file = ''
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
    date: form.date,
    status: form.status,
    file: form.file ?? undefined,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel" style="max-width: 640px;">
        <h3 class="text-[16px] font-semibold mb-[14px]">
          {{ initialData ? 'Edit policy document' : 'Add policy document' }}
        </h3>

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

        <div class="field" v-if="initialData">
          <label>Status</label>
          <select v-model="form.status" class="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-[13px] bg-white outline-none focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]">
            <option value="active">Active</option>
            <option value="superseded">Superseded</option>
          </select>
        </div>

        <div class="field mt-4">
          <FormFileUpload v-model="form.file" :error="errors.file" :compact="true" />
        </div>

        <div v-if="!initialData" class="text-[11.5px] text-[var(--ink-500)] mt-4 mb-[18px] leading-normal">
          If a document with this exact title is already active, it will be marked superseded and retained for
          historical reference.
        </div>

        <div class="flex justify-end gap-[10px] mt-[18px]">
          <button @click="emit('close')" class="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button @click="submit" class="btn btn-primary btn-sm">
            {{ initialData ? 'Save changes' : 'Add document' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
