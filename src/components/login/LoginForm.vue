<script setup>
import { ref } from 'vue'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const showPassword = ref(false)

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function submit() {
  emailError.value = validateEmail(email.value) ? '' : 'Please enter a valid email address.'
  passwordError.value = password.value.length >= 8 ? '' : 'Password must be at least 8 characters long.'

  if (emailError.value || passwordError.value) return

  console.log('Submit', email.value, password.value)
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
          <BaseInput :type="showPassword ? 'text' : 'password'" v-model="password" required autocomplete="current-password" placeholder="••••••••" class="w-full pr-10" :error="!!passwordError" />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <BaseIcon name="eye" size="20" />
          </button>
        </div>
      </BaseFormField>

      <BaseButton type="submit" class="w-full justify-center">Sign in</BaseButton>
    </form>

  </div>
</template>
