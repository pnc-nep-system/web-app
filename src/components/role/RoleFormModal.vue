<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Role, GroupedPermissions, CreateRolePayload, UpdateRolePayload } from '@/types/role'

const props = defineProps<{
  open: boolean
  editRole?: Role | null
  isSaving: boolean
  groupedPermissions: GroupedPermissions
  backendErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreateRolePayload | UpdateRolePayload]
}>()

const name = ref('')
const displayName = ref('')
const description = ref('')
const selectedPermissionIds = ref<Set<number>>(new Set())

const clientErrors = ref<Partial<Record<'name' | 'display_name', string>>>({})

const isEditMode = computed(() => !!props.editRole)
const title = computed(() => (isEditMode.value ? 'Edit Role' : 'Create Role'))

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
    if (props.editRole) {
      name.value = props.editRole.name
      displayName.value = props.editRole.display_name
      description.value = props.editRole.description ?? ''
      selectedPermissionIds.value = new Set(props.editRole.permissions.map((p) => p.id))
    }
  },
)

function resetForm() {
  name.value = ''
  displayName.value = ''
  description.value = ''
  selectedPermissionIds.value = new Set()
  clientErrors.value = {}
}

function togglePermission(id: number) {
  const next = new Set(selectedPermissionIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedPermissionIds.value = next
}

function toggleGroup(group: string, allSelected: boolean) {
  const next = new Set(selectedPermissionIds.value)
  const ids = props.groupedPermissions[group]?.map((p) => p.id) ?? []
  if (allSelected) {
    ids.forEach((id) => next.delete(id))
  } else {
    ids.forEach((id) => next.add(id))
  }
  selectedPermissionIds.value = next
}

function isGroupFullySelected(group: string): boolean {
  const ids = props.groupedPermissions[group]?.map((p) => p.id) ?? []
  return ids.length > 0 && ids.every((id) => selectedPermissionIds.value.has(id))
}

function validate(): boolean {
  clientErrors.value = {}
  if (!isEditMode.value && !name.value.trim()) {
    clientErrors.value.name = 'Machine name is required (e.g. "content_manager").'
  } else if (!isEditMode.value && !/^[a-z0-9_]+$/.test(name.value.trim())) {
    clientErrors.value.name = 'Use lowercase letters, numbers and underscores only.'
  }
  if (!displayName.value.trim()) clientErrors.value.display_name = 'Display name is required.'
  return Object.keys(clientErrors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const permissions = Array.from(selectedPermissionIds.value)

  if (isEditMode.value) {
    const payload: UpdateRolePayload = {
      display_name: displayName.value.trim(),
      description: description.value.trim() || null,
      permissions,
    }
    emit('submit', payload)
  } else {
    const payload: CreateRolePayload = {
      name: name.value.trim(),
      display_name: displayName.value.trim(),
      description: description.value.trim() || null,
      permissions,
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="w-full max-w-[640px]">
      <!-- Header -->
      <div class="flex items-start gap-3 mb-6">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="isEditMode ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'"
        >
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-[var(--ink-900)]">{{ title }}</h2>
          <p class="text-[12.5px] text-[var(--ink-400)] mt-0.5">Grant a role a name and a set of permissions.</p>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Machine name (create only) -->
          <div v-if="!isEditMode">
            <label for="rm-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Machine Name</label>
            <input
              id="rm-name"
              v-model="name"
              type="text"
              placeholder="e.g. content_manager"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
              :class="{ '!border-red-600': errors.name }"
            />
            <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600"><BaseIcon name="alert" :size="11" />{{ errors.name }}</p>
          </div>

          <!-- Display name -->
          <div>
            <label for="rm-display-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Display Name</label>
            <input
              id="rm-display-name"
              v-model="displayName"
              type="text"
              placeholder="e.g. Content Manager"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
              :class="{ '!border-red-600': errors.display_name }"
            />
            <p v-if="errors.display_name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600"><BaseIcon name="alert" :size="11" />{{ errors.display_name }}</p>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="rm-description" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Description</label>
          <textarea
            id="rm-description"
            v-model="description"
            rows="2"
            placeholder="What can this role do?"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)] resize-none"
          />
        </div>

        <!-- Permission Matrix -->
        <div>
          <label class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-2">
            Permissions
            <span class="text-[11px] font-normal text-[var(--ink-400)]">({{ selectedPermissionIds.size }} selected)</span>
          </label>
          <div class="border border-[var(--line)] rounded-[9px] max-h-[320px] overflow-y-auto divide-y divide-[var(--line-soft)]">
            <div v-for="(perms, group) in groupedPermissions" :key="group" class="p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">{{ group }}</span>
                <button
                  type="button"
                  class="text-[11px] font-semibold text-[var(--teal-700)] hover:underline cursor-pointer"
                  @click="toggleGroup(String(group), isGroupFullySelected(String(group)))"
                >
                  {{ isGroupFullySelected(String(group)) ? 'Clear all' : 'Select all' }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <label
                  v-for="perm in perms"
                  :key="perm.id"
                  class="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--teal-50)] transition-colors"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 accent-[var(--teal-700)]"
                    :checked="selectedPermissionIds.has(perm.id)"
                    @change="togglePermission(perm.id)"
                  />
                  <span class="min-w-0">
                    <span class="block text-[12.5px] font-medium text-[var(--ink-800)]">{{ perm.display_name }}</span>
                    <span class="block text-[11px] text-[var(--ink-400)] font-mono">{{ perm.name }}</span>
                  </span>
                </label>
              </div>
            </div>
            <p v-if="Object.keys(groupedPermissions).length === 0" class="p-4 text-center text-[12.5px] text-[var(--ink-400)]">
              No permissions available yet. Create one under Permission Management first.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2.5 mt-2 pt-4.5 border-t border-[var(--line-soft)]">
          <button type="button" class="btn btn-secondary" :disabled="isSaving" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Role' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
