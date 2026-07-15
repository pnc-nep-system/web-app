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
const organisationId = ref<number | null>(null)
const password = ref('')
const showPassword = ref(false)

const clientErrors = ref<Partial<Record<'name' | 'email' | 'role' | 'password' | 'organisation_id', string>>>({})

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
    <div class="form-modal">
      <!-- Header -->
      <div class="form-header">
        <div class="header-icon" :class="isEditMode ? 'edit' : 'create'">
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="header-text">
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
        <button
          class="close-btn"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="form-body">
        <!-- Full Name -->
        <div class="form-field">
          <label for="um-name">Full Name</label>
          <input
            id="um-name"
            v-model="name"
            type="text"
            placeholder="e.g. Jane Smith"
            :class="{ 'has-error': errors.name }"
            autocomplete="name"
          />
          <p v-if="errors.name" class="field-error">
            <BaseIcon name="alert" :size="11" />{{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="form-field">
          <label for="um-email">Email Address</label>
          <input
            id="um-email"
            v-model="email"
            type="email"
            placeholder="e.g. jane@example.com"
            :class="{ 'has-error': errors.email }"
            autocomplete="email"
          />
          <p v-if="errors.email" class="field-error">
            <BaseIcon name="alert" :size="11" />{{ errors.email }}
          </p>
        </div>

        <!-- Role -->
        <div class="form-field">
          <label for="um-role">Role</label>
          <select id="um-role" v-model="role" :class="{ 'has-error': errors.role }">
            <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="errors.role" class="field-error">
            <BaseIcon name="alert" :size="11" />{{ errors.role }}
          </p>
        </div>

        <!-- Organisation (Only visible/relevant for Coordinator and Member Org, required for Member Org) -->
        <Transition name="slide">
          <div v-if="role === 'member_org' || role === 'nep_coordinator'" class="form-field">
            <label for="um-organisation">
              Organisation
              <span class="label-tag">{{ role === 'member_org' ? 'Required' : 'Optional' }}</span>
            </label>
            <select id="um-organisation" v-model="organisationId" :class="{ 'has-error': errors.organisation_id }">
              <option :value="null">Select organisation…</option>
              <option v-for="org in organisations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
            <p v-if="errors.organisation_id" class="field-error">
              <BaseIcon name="alert" :size="11" />{{ errors.organisation_id }}
            </p>
          </div>
        </Transition>

        <!-- Password (create only) -->
        <Transition name="slide">
          <div v-if="!isEditMode" class="form-field">
            <label for="um-password">Password</label>
            <div class="password-wrap">
              <input
                id="um-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 8 characters"
                :class="{ 'has-error': errors.password }"
                autocomplete="new-password"
              />
              <button
                type="button"
                tabindex="-1"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <BaseIcon :name="showPassword ? 'eye' : 'lock'" :size="14" />
              </button>
            </div>
            <p v-if="errors.password" class="field-error">
              <BaseIcon name="alert" :size="11" />{{ errors.password }}
            </p>
          </div>
        </Transition>

        <!-- Divider + Actions -->
        <div class="form-actions">
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
              class="spin-icon"
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
.form-modal {
  width: 100%;
  max-width: 480px;
}

/* ── Header ── */
.form-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}
.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.header-icon.create {
  background: var(--teal-100);
  color: var(--teal-700);
}
.header-icon.edit {
  background: #eef0fb;
  color: #4338ca;
}
.header-text {
  flex: 1;
  min-width: 0;
}
.header-text h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
}
.header-text p {
  font-size: 12.5px;
  color: var(--ink-400);
  margin-top: 2px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
}
.close-btn:hover {
  border-color: var(--ink-400);
  color: var(--ink-700);
}

/* ── Form ── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-700);
  margin-bottom: 6px;
}
.label-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--teal-100);
  color: var(--teal-700);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.form-field input,
.form-field select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 10px 13px;
  font-size: 13.5px;
  font-family: inherit;
  color: var(--ink-900);
  background: #fff;
  transition: all 0.15s ease;
}
.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--teal-600);
  box-shadow: 0 0 0 3px var(--teal-100);
}
.form-field input.has-error,
.form-field select.has-error {
  border-color: var(--red-600);
}
.form-field input::placeholder {
  color: var(--ink-300);
}

.field-error {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--red-600);
}

/* ── Password ── */
.password-wrap {
  position: relative;
}
.password-wrap input {
  padding-right: 40px;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-400);
  cursor: pointer;
  transition: color 0.12s;
}
.password-toggle:hover {
  color: var(--ink-700);
}

/* ── Actions ── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
}

.spin-icon {
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
.opacity-25 { opacity: 0.25; }
.opacity-75 { opacity: 0.75; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

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
