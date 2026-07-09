<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// --- Form Reactive State ---
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const showPassword = ref(false)
const failedAttempts = ref(0)

const router = useRouter()
const authStore = useAuthStore()

// Clear field errors as the user corrects their input
watch(email, () => { emailError.value = '' })
watch(password, () => { passwordError.value = '' })

/**
 * Quick-fills the login form with demo credentials
 */
const fillDemo = (company: string) => {
  if (company === 'riverkids') {
    email.value = 'programmes@riverkids.org'
  } else if (company === 'childwell') {
    email.value = 'programmes@childwell.org'
  } else if (company === 'newhope') {
    email.value = 'programmes@newhope.org'
  }
  password.value = 'demo1234'

  // Clear all errors when filling demo accounts
  emailError.value = ''
  passwordError.value = ''
  authStore.clearErrors()
}

/**
 * Handles the login form submission.
 * Validates required fields first, then calls the API.
 * Maps backend errors to the appropriate UI fields.
 */
async function submit() {
  // Clear previous errors
  emailError.value = ''
  passwordError.value = ''
  authStore.clearErrors()

  // 1. Required field validation
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
    router.push('/dashboard')
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
          <!--
            Standard input type password toggled dynamically to text.
            This resolves Firefox password masking bug while allowing standard eye toggling.
          -->
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
    </form>

    <div class="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4 text-xs text-amber-700">
      <b class="block text-sm mb-1">Demo accounts</b>
      <p class="opacity-90 leading-relaxed">
        Working prototype backed by a local JSON data store — no real backend. Try any of the three:
      </p>
      <div class="flex gap-2 mt-2.5 flex-wrap">
        <button
          type="button"
          @click="fillDemo('riverkids')"
          class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors"
        >
          Riverkids Cambodia
        </button>
        <button
          type="button"
          @click="fillDemo('childwell')"
          class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors"
        >
          ChildWell Cambodia
        </button>
        <button
          type="button"
          @click="fillDemo('newhope')"
          class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors"
        >
          New Hope Learning (no entries yet)
        </button>
      </div>
      <p class="mt-2.5 text-gray-400">
        Password for every demo account:
        <code class="bg-black/5 px-1.5 py-0.5 rounded">demo1234</code>
      </p>
    </div>
  </div>
</template>
