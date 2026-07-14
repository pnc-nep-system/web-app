<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { OrganisationOption } from '@/api/user.service'

// ─── Props / Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  open: boolean
  editUser?: User | null
  isSaving: boolean
  organisations: OrganisationOption[]
  backendErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreateUserPayload | UpdateUserPayload]
}>()

// ─── Role options ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'nep_admin', label: 'NEP Admin' },
  { value: 'nep_coordinator', label: 'Coordinator' },
  { value: 'member_org', label: 'Member Organisation' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

const name = ref('')
const email = ref('')
const role = ref<UserRole>('member_org')
const organisationId = ref<number | null>(null)
const password = ref('')
const showPassword = ref(false)

const clientErrors = ref<Partial<Record<'name' | 'email' | 'role' | 'password' | 'organisation_id', string>>>({})

const isEditMode = computed(() => !!props.editUser)
const title = computed(() => (isEditMode.value ? 'Edit User' : 'Create User'))

// ─── Combined errors helper ───────────────────────────────────────────────────

const errors = computed(() => {
  const errs: Record<string, string> = {}
  
  // Apply backend errors (422) first
  if (props.backendErrors) {
    Object.entries(props.backendErrors).forEach(([key, val]) => {
      if (Array.isArray(val) && val[0]) {
        errs[key] = val[0]
      }
    })
  }
  
  // Apply client validation errors which overwrite backend errors
  Object.entries(clientErrors.value).forEach(([key, val]) => {
    if (val) {
      errs[key] = val
    }
  })
  
  return errs
})

// ─── Sync form when modal opens / edit target changes ─────────────────────────

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    resetForm()
    if (props.editUser) {
      name.value = props.editUser.name
      email.value = props.editUser.email
      role.value = props.editUser.role
      organisationId.value = props.editUser.organisation_id
    }
  },
)

function resetForm() {
  name.value = ''
  email.value = ''
  role.value = 'member_org'
  organisationId.value = null
  password.value = ''
  showPassword.value = false
  clientErrors.value = {}
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(): boolean {
  clientErrors.value = {}

  if (!name.value.trim()) clientErrors.value.name = 'Full name is required.'
  if (!email.value.trim()) {
    clientErrors.value.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    clientErrors.value.email = 'Enter a valid email address.'
  }
  if (!role.value) clientErrors.value.role = 'Role is required.'
  
  if (role.value === 'member_org' && !organisationId.value) {
    clientErrors.value.organisation_id = 'Organisation is required for member users.'
  }

  if (!isEditMode.value) {
    if (!password.value.trim()) {
      clientErrors.value.password = 'Password is required.'
    } else if (password.value.length < 8) {
      clientErrors.value.password = 'Password must be at least 8 characters.'
    }
  }

  return Object.keys(clientErrors.value).length === 0
}

// ─── Submit ───────────────────────────────────────────────────────────────────

function handleSubmit() {
  if (!validate()) return

  if (isEditMode.value) {
    const payload: UpdateUserPayload = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      organisation_id: role.value === 'member_org' ? organisationId.value : null,
    }
    emit('submit', payload)
  } else {
    const payload: CreateUserPayload = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      password: password.value,
      organisation_id: role.value === 'member_org' ? organisationId.value : null,
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="w-full" style="max-width: 480px">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-base font-semibold text-[var(--ink-900)]">{{ title }}</h2>
          <p class="text-xs text-[var(--ink-400)] mt-0.5">
            {{ isEditMode ? 'Update the account details below.' : 'Fill in the details to create a new account.' }}
          </p>
        </div>
        <button
          class="icon-btn"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Full Name -->
        <div class="field">
          <label for="um-name">Full Name</label>
          <input
            id="um-name"
            v-model="name"
            type="text"
            placeholder="e.g. Jane Smith"
            :class="{ 'has-error': errors.name }"
            autocomplete="name"
          />
          <p v-if="errors.name" class="error">
            <BaseIcon name="alert" :size="12" />{{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="field">
          <label for="um-email">Email</label>
          <input
            id="um-email"
            v-model="email"
            type="email"
            placeholder="e.g. jane@example.com"
            :class="{ 'has-error': errors.email }"
            autocomplete="email"
          />
          <p v-if="errors.email" class="error">
            <BaseIcon name="alert" :size="12" />{{ errors.email }}
          </p>
        </div>

        <!-- Role -->
        <div class="field">
          <label for="um-role">Role</label>
          <select id="um-role" v-model="role" :class="{ 'has-error': errors.role }">
            <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="errors.role" class="error">
            <BaseIcon name="alert" :size="12" />{{ errors.role }}
          </p>
        </div>

        <!-- Organisation (Only visible/relevant for Coordinator and Member Org, required for Member Org) -->
        <div v-if="role === 'member_org' || role === 'nep_coordinator'" class="field">
          <label for="um-organisation">Organisation {{ role === 'member_org' ? '(Required)' : '(Optional)' }}</label>
          <select id="um-organisation" v-model="organisationId" :class="{ 'has-error': errors.organisation_id }">
            <option :value="null">None / No Organisation</option>
            <option v-for="org in organisations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
          <p v-if="role === 'nep_coordinator'" class="hint">
            Coordinators do not have to be assigned to an organisation.
          </p>
          <p v-if="errors.organisation_id" class="error">
            <BaseIcon name="alert" :size="12" />{{ errors.organisation_id }}
          </p>
        </div>

        <!-- Password (create only) -->
        <div v-if="!isEditMode" class="field">
          <label for="um-password">Password</label>
          <div class="relative">
            <input
              id="um-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Min. 8 characters"
              :class="{ 'has-error': errors.password }"
              autocomplete="new-password"
              class="pr-10"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)]"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <BaseIcon name="eye" :size="15" />
            </button>
          </div>
          <p v-if="errors.password" class="error">
            <BaseIcon name="alert" :size="12" />{{ errors.password }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-7">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isSaving"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <svg
              v-if="isSaving"
              class="animate-spin w-3.5 h-3.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create User' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

