<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Permission, GroupedPermissions, CreatePermissionPayload, UpdatePermissionPayload } from '@/types/role'

const props = defineProps<{
  open: boolean
  editPermission?: Permission | null
  isSaving: boolean
  groupedPermissions: GroupedPermissions
  backendErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreatePermissionPayload | UpdatePermissionPayload]
}>()

const name = ref('')
const displayName = ref('')
const group = ref('')
const description = ref('')

const clientErrors = ref<Partial<Record<'name' | 'display_name' | 'group', string>>>({})

const isEditMode = computed(() => !!props.editPermission)
const title = computed(() => (isEditMode.value ? 'Edit Permission' : 'Create Permission'))
const existingGroups = computed(() => Object.keys(props.groupedPermissions))

const errors = computed(() => {
  const errs: Record<string, string> = {}
  if (props.backendErrors) {
    Object.entries(props.backendErrors).forEach(([key, val]) => {
      if (Array.isArray(val) && val[0]) errs[key] = val[0]
    })
  }
  Object.entries(clientErrors.value).forEach(([key, val]) => {
    if (val) errs[key] = val
  })
  return errs
})

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    resetForm()
    if (props.editPermission) {
      name.value = props.editPermission.name
      displayName.value = props.editPermission.display_name
      group.value = props.editPermission.group
      description.value = props.editPermission.description ?? ''
    }
  },
)

function resetForm() {
  name.value = ''
  displayName.value = ''
  group.value = ''
  description.value = ''
  clientErrors.value = {}
}

function validate(): boolean {
  clientErrors.value = {}
  if (!isEditMode.value) {
    if (!name.value.trim()) {
      clientErrors.value.name = 'Permission name is required (e.g. "reports.export").'
    } else if (!/^[a-z0-9_]+\.[a-z0-9_-]+$/.test(name.value.trim())) {
      clientErrors.value.name = 'Use the "resource.action" convention, e.g. "reports.export".'
    }
  }
  if (!displayName.value.trim()) clientErrors.value.display_name = 'Display name is required.'
  if (!group.value.trim()) clientErrors.value.group = 'Group is required (e.g. "Reports").'
  return Object.keys(clientErrors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  if (isEditMode.value) {
    const payload: UpdatePermissionPayload = {
      display_name: displayName.value.trim(),
      group: group.value.trim(),
      description: description.value.trim() || null,
    }
    emit('submit', payload)
  } else {
    const payload: CreatePermissionPayload = {
      name: name.value.trim(),
      display_name: displayName.value.trim(),
      group: group.value.trim(),
      description: description.value.trim() || null,
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="w-full max-w-[460px]">
      <div class="flex items-start gap-3 mb-6">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="isEditMode ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'"
        >
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-[var(--ink-900)]">{{ title }}</h2>
          <p class="text-[12.5px] text-[var(--ink-400)] mt-0.5">A permission represents one specific allowed action.</p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)]"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" novalidate class="flex flex-col gap-4">
        <div v-if="!isEditMode">
          <label for="pm-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Permission Name</label>
          <input
            id="pm-name"
            v-model="name"
            type="text"
            placeholder="e.g. reports.export"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white font-mono focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-600': errors.name }"
          />
          <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600"><BaseIcon name="alert" :size="11" />{{ errors.name }}</p>
        </div>

        <div>
          <label for="pm-display-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Display Name</label>
          <input
            id="pm-display-name"
            v-model="displayName"
            type="text"
            placeholder="e.g. Export Reports"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-600': errors.display_name }"
          />
          <p v-if="errors.display_name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600"><BaseIcon name="alert" :size="11" />{{ errors.display_name }}</p>
        </div>

        <div>
          <label for="pm-group" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Group</label>
          <input
            id="pm-group"
            v-model="group"
            type="text"
            list="pm-existing-groups"
            placeholder="e.g. Reports"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-600': errors.group }"
          />
          <datalist id="pm-existing-groups">
            <option v-for="g in existingGroups" :key="g" :value="g" />
          </datalist>
          <p v-if="errors.group" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600"><BaseIcon name="alert" :size="11" />{{ errors.group }}</p>
        </div>

        <div>
          <label for="pm-description" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Description</label>
          <textarea
            id="pm-description"
            v-model="description"
            rows="2"
            placeholder="What does this permission allow?"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)] resize-none"
          />
        </div>

        <div class="flex justify-end gap-2.5 mt-2 pt-4.5 border-t border-[var(--line-soft)]">
          <button type="button" class="btn btn-secondary" :disabled="isSaving" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Permission' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
