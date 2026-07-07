<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const props = defineProps({
  icon: { type: String, default: 'dashboard' },
  iconTone: { type: String, default: 'teal' }, // teal | amber | green | red | indigo
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  trend: { type: String, default: '' },
  trendTone: { type: String, default: 'up' } // up | flag
})

const toneClasses = {
  teal: 'bg-teal-100 text-teal-800',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-600',
  indigo: 'bg-indigo-100 text-indigo-600'
}

const iconClass = computed(() => toneClasses[props.iconTone] || toneClasses.teal)
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
    <div class="flex justify-between items-start mb-3">
      <div class="p-2 rounded-lg flex items-center justify-center" :class="iconClass">
        <BaseIcon :name="icon" :size="17" />
      </div>
      <span v-if="trend" class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="trendTone === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">{{ trend }}</span>
    </div>
    <div class="text-2xl font-bold text-gray-900">{{ value }}</div>
    <div class="text-sm text-gray-500">{{ label }}</div>
  </div>
</template>
