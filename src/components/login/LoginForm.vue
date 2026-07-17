<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const showPassword = ref(false)
const failedAttempts = ref(0)

const router = useRouter()
const authStore = useAuthStore()

watch(email, () => { emailError.value = '' })
watch(password, () => { passwordError.value = '' })

async function quickLogin(e: string, p: string) {
  email.value = e
  password.value = p
  await submit()
}

async function submit() {
  emailError.value = ''
  passwordError.value = ''
  authStore.clearErrors()

  let hasErrors = false

  if (!email.value.trim()) {
    emailError.value = 'Email is required.'
    hasErrors = true
  }

  if (!password.value) {
    passwordError.value = 'Password is required.'
    hasErrors = true
  }

  if (hasErrors) return

  // 2. Trigger Auth Store Login API Request
  const success = await authStore.login(email.value, password.value)

  if (success) {
    failedAttempts.value = 0
    await router.push(authStore.userRole === 'nep_admin' ? { name: 'admin-users' } : { name: 'dashboard' })
  } else {
    failedAttempts.value++

    // Clear password input immediately for security
    password.value = ''

    // Map backend field-level errors to UI fields
    if (authStore.fieldErrors.email?.[0]) {
      emailError.value = authStore.fieldErrors.email[0]
    }
    if (authStore.fieldErrors.password?.[0]) {
      passwordError.value = authStore.fieldErrors.password[0]
    }
  }
}
</script>

<template>
  <div class="w-full lg:w-[650px] bg-white flex flex-col justify-center p-8 lg:p-14 flex-shrink-0">
    <h2 class="text-xl font-semibold mb-2">Organisation sign in</h2>
    <p class="text-sm text-gray-500 mb-6.5">
      Accounts are organisational, not individual — staff turnover never costs you access.
    </p>

    <form @submit.prevent="submit" class="space-y-4" novalidate>
      <BaseFormField label="Organisation email" :error="emailError">
        <BaseInput
          id="email"
          type="email"
          v-model="email"
          autocomplete="username"
          placeholder="programmes@riverkids.org"
          :error="!!emailError"
        />
      </BaseFormField>

      <BaseFormField label="Password" :error="passwordError">
        <div class="relative">
          <BaseInput
            id="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full pr-10"
            :error="!!passwordError"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <BaseIcon name="eye" size="20" />
          </button>
        </div>
      </BaseFormField>

      <div v-if="failedAttempts >= 3" class="text-sm text-right">
        <router-link to="/forgot-password" class="text-teal-700 font-semibold hover:underline"
          >Forgot your password?</router-link
        >
      </div>

      <BaseButton
        id="login-submit"
        type="submit"
        class="w-full justify-center mt-2"
        :disabled="authStore.loading"
      >
        {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
      </BaseButton>

      <!-- Developer Quick Login Panel -->
      <div class="mt-6 border-t border-slate-100 pt-6">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Developer Quick Sign In</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="quickLogin('admin@example.com', 'password')"
            class="px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100/50 shadow-xs text-center"
          >
            Admin
          </button>
          <button
            type="button"
            @click="quickLogin('coordinator@example.com', 'password')"
            class="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-100/50 shadow-xs text-center"
          >
            Coordinator
          </button>
          <button
            type="button"
            @click="quickLogin('orgadmin@example.com', 'password')"
            class="px-3 py-2 text-xs font-semibold bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer border border-teal-100/50 shadow-xs text-center"
          >
            Member
          </button>
        </div>
      </div>
       <!-- Network / Server Error Banner -->
    <div
      v-if="authStore.networkError"
      class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
      <span>{{ authStore.networkError }}</span>
    </div>

    <!-- General Auth Error Banner (invalid credentials, server errors) -->
    <div
      v-else-if="authStore.authError && !authStore.fieldErrors.email && !authStore.fieldErrors.password"
      class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
      <span>{{ authStore.authError }}</span>
    </div>
    </form>
  </div>
</template>
