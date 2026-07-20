<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array as () => { label: string, value: number }[], required: true },
  showBar: { type: Boolean, default: false },
  actionText: { type: String, default: '' }
})

const emit = defineEmits(['action'])

const maxValue = computed(() => {
  if (!props.items.length) return 0
  return Math.max(...props.items.map(item => item.value))
})
</script>

<template>
  <div class="card p-6 h-full flex flex-col">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-[15px] font-bold text-[var(--ink-900)]">{{ title }}</h2>
      <span v-if="subtitle" class="text-[12.5px] text-[var(--ink-400)]">{{ subtitle }}</span>
    </div>

    <div class="flex-1 flex flex-col gap-3.5">
      <div v-for="(item, index) in items" :key="index">
        <div class="flex items-center justify-between text-[13px] mb-1.5">
          <span class="text-[var(--ink-700)]">{{ item.label }}</span>
          <span class="font-bold text-[var(--ink-900)]">{{ item.value }}</span>
        </div>
        
        <div v-if="showBar" class="h-1 w-full bg-[var(--line)] rounded-full overflow-hidden">
          <div 
            class="h-full bg-[var(--teal-700)] rounded-full" 
            :style="{ width: `${maxValue ? (item.value / maxValue) * 100 : 0}%` }"
          ></div>
        </div>
        <div v-else-if="index !== items.length - 1" class="h-px w-full bg-[var(--line-soft)] mt-3.5"></div>
      </div>
    </div>

    <div v-if="actionText" class="mt-6 pt-1">
      <button 
        @click="emit('action')" 
        class="text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)] transition-colors flex items-center gap-1"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
