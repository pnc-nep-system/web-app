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

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'nep_admin', label: 'NEP Admin', desc: 'Full system access' },
  { value: 'nep_coordinator', label: 'Coordinator', desc: 'Programme oversight' },
  { value: 'member_org', label: 'Member Organisation', desc: 'Organisation-level access' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

const name = ref('')
const email = ref('')
const role = ref<UserRole>('member_org')
const status = ref<'active' | 'inactive'>('active')
const organisationId = ref<number | null>(null)
const password = ref('')
const showPassword = ref(false)

const clientErrors = ref<Partial<Record<'name' | 'email' | 'role' | 'status' | 'password' | 'organisation_id', string>>>({})

const isEditMode = computed(() => !!props.editUser)
const title = computed(() => (isEditMode.value ? 'Edit User' : 'Create User'))
const subtitle = computed(() =>
  isEditMode.value ? 'Update the account details below.' : 'Fill in the details to create a new account.',
)

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


watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    resetForm()
    if (props.editUser) {
      name.value = props.editUser.name
      email.value = props.editUser.email
      role.value = props.editUser.role
      status.value = props.editUser.status
      organisationId.value = props.editUser.organisation_id
    }
  },
)

function resetForm() {
  name.value = ''
  email.value = ''
  role.value = 'member_org'
  status.value = 'active'
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
  if (!status.value) clientErrors.value.status = 'Status is required.'

  if (role.value === 'member_org' && !organisationId.value) {
    clientErrors.value.organisation_id = 'Organisation is required for member users.'
  }

  if (!isEditMode.value && password.value.trim() && password.value.length < 8) {
    clientErrors.value.password = 'Password must be at least 8 characters.'
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
      status: status.value,
      organisation_id: role.value === 'member_org' || role.value === 'nep_coordinator' ? organisationId.value : null,
    }
    emit('submit', payload)
  } else {
    const payload: CreateUserPayload = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      password: password.value,
      organisation_id: role.value === 'member_org' || role.value === 'nep_coordinator' ? organisationId.value : null,
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="w-full max-w-[480px]">
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
          <p class="text-[12.5px] text-[var(--ink-400)] mt-0.5">{{ subtitle }}</p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-120 shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)]"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="flex flex-col gap-4">
        <!-- Full Name -->
        <div>
          <label for="um-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Full Name
          </label>
          <input
            id="um-name"
            v-model="name"
            type="text"
            placeholder="e.g. Jane Smith"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-600': errors.name }"
            autocomplete="name"
          />
          <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label for="um-email" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Email Address
          </label>
          <input
            id="um-email"
            v-model="email"
            type="email"
            placeholder="e.g. jane@example.com"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-600': errors.email }"
            autocomplete="email"
          />
          <p v-if="errors.email" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.email }}
          </p>
        </div>

        <!-- Role -->
        <div>
          <label for="um-role" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Role
          </label>
          <select
            id="um-role"
            v-model="role"
            class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]"
            :class="{ '!border-red-600': errors.role }"
          >
            <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="errors.role" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.role }}
          </p>
        </div>

        <!-- Status (edit only) -->
        <Transition name="slide">
          <div v-if="isEditMode">
            <label for="um-status" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Status
            </label>
            <select
              id="um-status"
              v-model="status"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]"
              :class="{ '!border-red-600': errors.status }"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p v-if="errors.status" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.status }}
            </p>
          </div>
        </Transition>

        <!-- Organisation (Only visible/relevant for Coordinator and Member Org) -->
        <Transition name="slide">
          <div v-if="role === 'member_org' || role === 'nep_coordinator'">
            <label for="um-organisation" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Organisation
              <span
                class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 uppercase tracking-wider"
              >
                {{ role === 'member_org' ? 'Required' : 'Optional' }}
              </span>
            </label>
            <select
              id="um-organisation"
              v-model="organisationId"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]"
              :class="{ '!border-red-600': errors.organisation_id }"
            >
              <option :value="null">Select organisation…</option>
              <option v-for="org in organisations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
            <p v-if="errors.organisation_id" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.organisation_id }}
            </p>
          </div>
        </Transition>

        <!-- Password (create only) -->
        <Transition name="slide">
          <div v-if="!isEditMode">
            <label for="um-password" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Password
            </label>
            <div class="relative">
              <input
                id="um-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 8 characters"
                class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 pr-10 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
                :class="{ '!border-red-600': errors.password }"
                autocomplete="new-password"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md border-none bg-transparent flex items-center justify-center text-[var(--ink-400)] cursor-pointer transition-colors duration-120 hover:text-[var(--ink-700)]"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <BaseIcon :name="showPassword ? 'eye' : 'lock'" :size="14" />
              </button>
            </div>
            <p v-if="errors.password" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.password }}
            </p>
          </div>
        </Transition>

        <!-- Divider + Actions -->
        <div class="flex justify-end gap-2.5 mt-2 pt-4.5 border-t border-[var(--line-soft)]">
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
              class="w-3.5 h-3.5 animate-spin shrink-0"
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

<style scoped>
/* ── Slide Transition ── */
.slide-enter-active {
  transition: all 0.2s ease;
}
.slide-leave-active {
  transition: all 0.15s ease;
}
.slide-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>