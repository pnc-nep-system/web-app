<script setup lang="ts">
import { ref } from 'vue'
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

// Helper regex to validate email format before hitting the API
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Quick-fills the login form with demo credentials
 */
const fillDemo = (company) => {
  if (company === 'riverkids') {
    email.value = 'programmes@riverkids.org'
  } else if (company === 'childwell') {
    email.value = 'programmes@childwell.org'
  } else if (company === 'newhope') {
    email.value = 'programmes@newhope.org'
  }
  password.value = 'demo1234'
  
  // Clear errors when filling demo accounts
  emailError.value = ''
  passwordError.value = ''
}

/**
 * Handles the login form submission.
 * Performs client validation, makes the API call, handles redirection based on role,
 * and tracks failed login attempts to offer password reset guidance.
 */
async function submit() {
  // Clear previous errors
  emailError.value = ''
  passwordError.value = ''

  // 1. Client-Side Input Validation
  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address.'
    return
  }
  if (password.value.length < 4) {
    passwordError.value = 'Password must be at least 4 characters long.'
    return
  }

  // 2. Trigger Auth Store Login API Request
  const success = await authStore.login(email.value, password.value)
  
  if (success) {
    // All roles use the same dynamic dashboard — title/UI adapts by role
    failedAttempts.value = 0
    router.push('/dashboard')
  } else {
    // 3. Handle Failure Cases
    failedAttempts.value++
    
    // Clear password input immediately for better security & clean state
    password.value = ''
    
    // Map backend field errors to UI fields
    if (authStore.fieldErrors.email) {
      emailError.value = authStore.fieldErrors.email[0]
    }
    if (authStore.fieldErrors.password) {
      passwordError.value = authStore.fieldErrors.password[0]
    }
  }
}
</script>

<template>
  <div class="w-full lg:w-[650px] bg-white flex flex-col justify-center p-8 lg:p-14 flex-shrink-0">
    <h2 class="text-xl font-semibold mb-2">Organisation sign in</h2>
    <p class="text-sm text-gray-500 mb-6.5">Accounts are organisational, not individual — staff turnover never costs you access.</p>

    <form @submit.prevent="submit" class="space-y-4">
      <BaseFormField label="Organisation email" :error="emailError">
        <BaseInput type="email" v-model="email" required autocomplete="username" placeholder="programmes@riverkids.org" :error="!!emailError" />
      </BaseFormField>
      <BaseFormField label="Password" :error="passwordError">
        <div class="relative">
          <!-- 
            Standard input type password toggled dynamically to text. 
            This resolves Firefox password masking bug while allowing standard eye toggling.
          -->
          <BaseInput 
            :type="showPassword ? 'text' : 'password'" 
            v-model="password" 
            required 
            autocomplete="current-password" 
            placeholder="••••••••" 
            class="w-full pr-10" 
            :error="!!passwordError"
          />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <BaseIcon name="eye" size="20" />
          </button>
        </div>
      </BaseFormField>

      <div v-if="failedAttempts >= 3" class="text-sm text-right">
        <router-link to="/forgot-password" class="text-teal-700 font-semibold hover:underline">Forgot your password?</router-link>
      </div>

      <BaseButton type="submit" class="w-full justify-center mt-2" :disabled="authStore.loading">
        {{ authStore.loading ? 'Signing in...' : 'Sign in' }}
      </BaseButton>
    </form>

    <div class="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4 text-xs text-amber-700">
      <b class="block text-sm mb-1">Demo accounts</b>
      <p class="opacity-90 leading-relaxed">Working prototype backed by a local JSON data store — no real backend. Try any of the three:</p>
      <div class="flex gap-2 mt-2.5 flex-wrap">
        <button type="button" @click="fillDemo('riverkids')" class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">Riverkids Cambodia</button>
        <button type="button" @click="fillDemo('childwell')" class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">ChildWell Cambodia</button>
        <button type="button" @click="fillDemo('newhope')" class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">New Hope Learning (no entries yet)</button>
      </div>
      <p class="mt-2.5 text-gray-400">Password for every demo account: <code class="bg-black/5 px-1.5 py-0.5 rounded">demo1234</code></p>
    </div>
  </div>
</template>
