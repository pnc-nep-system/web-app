<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Staff Dashboard</h1>
      <button
        @click="logout()"
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
    <p class="mt-4 text-gray-600">Welcome to your staff dashboard.</p>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()
</script>
