<script setup>
defineProps({
  icon: { type: String, default: 'search' },
  title: { type: String, required: true },
  message: { type: String, default: '' }
})
import Icon from './Icon.vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 text-center">
    <div class="text-gray-400 mb-4"><Icon :name="icon" :size="40" /></div>
    <b class="text-sm text-gray-700">{{ title }}</b>
    <p v-if="message" class="text-xs text-gray-500 mt-1">{{ message }}</p>
    <div v-if="$slots.action" class="mt-4"><slot name="action" /></div>
  </div>
</template>
