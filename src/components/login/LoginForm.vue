<script setup>
import { ref } from 'vue'
import FormField from '@/components/FormField.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Icon from '@/components/Icon.vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function submit() {
  console.log('Submit', email.value, password.value)
}
</script>

<template>
  <div class="w-full lg:w-[500px] bg-white flex flex-col justify-center p-8 lg:p-14 flex-shrink-0">
    <h2 class="text-xl font-semibold mb-2">Organisation sign in</h2>
    <p class="text-sm text-gray-500 mb-6.5">Accounts are organisational, not individual — staff turnover never costs you access.</p>

    <form @submit.prevent="submit" class="space-y-4">
      <FormField label="Organisation email">
        <Input type="email" v-model="email" required autocomplete="username" placeholder="programmes@riverkids.org" />
      </FormField>
      <FormField label="Password">
        <div class="relative">
          <Input :type="showPassword ? 'text' : 'password'" v-model="password" required autocomplete="current-password" placeholder="••••••••" class="w-full pr-10" />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon name="eye" size="20" />
          </button>
        </div>
      </FormField>

      <Button type="submit" class="w-full justify-center">Sign in</Button>
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
