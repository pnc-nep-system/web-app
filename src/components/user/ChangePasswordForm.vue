<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from '@/utils/toast'
import { authApi } from '@/api/auth.api'

const toast = useToast()
const emit = defineEmits<{ close: []; success: [] }>()

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', general: '' })
const saving = ref(false)
const showPasswords = ref(false)

function validate() {
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  errors.general = ''

  if (!form.currentPassword.trim()) {
    errors.currentPassword = 'Current password is required'
    return false
  }
  if (!form.newPassword.trim()) {
    errors.newPassword = 'New password is required'
    return false
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters'
    return false
  }
  if (!form.confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your new password'
    return false
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }
  if (form.currentPassword === form.newPassword) {
    errors.newPassword = 'New password must be different from current password'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return

  saving.value = true
  errors.general = ''

  try {
    await authApi.changePassword({
      current_password: form.currentPassword,
      password: form.newPassword,
      password_confirmation: form.confirmPassword,
    })
    toast.success('Password updated successfully')
    resetForm()
    emit('success')
    emit('close')
  } catch (error: unknown) {
    const res = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }).response
    if (res?.status === 401) {
      errors.general = 'Current password is incorrect'
    } else if (res?.status === 422 && res.data?.errors) {
      const fieldErrors = res.data.errors
      if (fieldErrors.current_password?.[0]) errors.currentPassword = fieldErrors.current_password[0]
      if (fieldErrors.password?.[0]) errors.newPassword = fieldErrors.password[0]
      if (fieldErrors.password_confirmation?.[0]) errors.confirmPassword = fieldErrors.password_confirmation[0]
      errors.general = res.data.message || 'Please correct the errors below'
    } else {
      errors.general = res?.data?.message || 'Failed to update password. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  errors.general = ''
}

function close() {
  resetForm()
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Set new password</h3>
        <button type="button" class="modal-close" @click="close" aria-label="Close">✕</button>
      </div>
      <p class="modal-subtitle">Update your password to keep your account secure</p>

      <form @submit.prevent="submit" class="form-stack">
        <div v-if="errors.general" class="alert alert-error">{{ errors.general }}</div>

        <div class="field">
          <label for="current-password">Current password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="current-password"
            v-model="form.currentPassword"
            :class="{ 'has-error': errors.currentPassword }"
            placeholder="Enter your current password"
            autocomplete="current-password"
          />
          <span v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</span>
        </div>

        <div class="field">
          <label for="new-password">New password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="new-password"
            v-model="form.newPassword"
            :class="{ 'has-error': errors.newPassword }"
            placeholder="Enter new password (min. 8 characters)"
            autocomplete="new-password"
          />
          <span v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</span>
        </div>

        <div class="field">
          <label for="confirm-password">Confirm new password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="confirm-password"
            v-model="form.confirmPassword"
            :class="{ 'has-error': errors.confirmPassword }"
            placeholder="Re-enter your new password"
            autocomplete="new-password"
          />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>

        <label class="checkbox-label">
          <input type="checkbox" v-model="showPasswords" />
          <span>Show passwords</span>
        </label>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="saving">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner-sm"></span>
            {{ saving ? 'Updating…' : 'Update password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink-900);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ink-500);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.modal-close:hover {
  background: var(--ink-100);
  color: var(--ink-900);
}

.modal-subtitle {
  font-size: 13px;
  color: var(--ink-500);
  margin: 6px 24px 0;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}

.field input:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: 0 0 0 3px rgba(20, 120, 110, 0.1);
}

.field input.has-error {
  border-color: #dc2626;
  background: #fef2f2;
}

.field-error {
  font-size: 12px;
  color: #dc2626;
}

.alert {
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-600);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--teal-700);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>