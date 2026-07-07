<script setup>
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
const formMessage = ref('')

const router = useRouter()
const authStore = useAuthStore()

// Helper regex to validate email format before hitting the API
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
  formMessage.value = ''

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
    // Reset counter and redirect to the correct dashboard based on user role
    failedAttempts.value = 0
    const role = localStorage.getItem('userRole')
    
    if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'manager') router.push('/manager/dashboard')
    else router.push('/dashboard')
  } else {
    // 3. Handle Failure Cases
    failedAttempts.value++
    
    // Clear password input immediately for better security & clean state
    password.value = ''
    
    // Display the error message returned from the backend/store
    formMessage.value = authStore.authError || 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <div class="w-full lg:w-[650px] bg-white flex flex-col justify-center p-8 lg:p-14 flex-shrink-0">
    <h2 class="text-xl font-semibold mb-2">Organisation sign in</h2>
    <p class="text-sm text-gray-500 mb-6.5">Accounts are organisational, not individual — staff turnover never costs you access.</p>

    <!-- Error banner -->
    <div v-if="formMessage" class="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      <svg class="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <span>{{ formMessage }}</span>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <BaseFormField label="Organisation email" :error="emailError">
        <BaseInput type="email" v-model="email" required autocomplete="username" placeholder="programmes@riverkids.org" :error="!!emailError" />
      </BaseFormField>
      <BaseFormField label="Password" :error="passwordError">
        <div class="relative">
          <!-- 
            We use type="text" instead of type="password" to trick Google Chrome's password manager 
            so it does not detect a breached password and fire its default security alert popups.
            We then mask the text manually using the CSS property '-webkit-text-security'.
          -->
          <BaseInput 
            type="text" 
            v-model="password" 
            required 
            autocomplete="off" 
            placeholder="••••••••" 
            class="w-full pr-10" 
            :error="!!passwordError"
            :style="{ '-webkit-text-security': showPassword ? 'none' : 'disc', 'text-security': showPassword ? 'none' : 'disc' }"
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
        <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">Riverkids Cambodia</button>
        <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">ChildWell Cambodia</button>
        <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-xs hover:border-gray-400 transition-colors">New Hope Learning (no entries yet)</button>
      </div>
      <p class="mt-2.5 text-gray-400">Password for every demo account: <code class="bg-black/5 px-1.5 py-0.5 rounded">demo1234</code></p>
    </div>
  </div>
</template>
