<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  border?: boolean
  mb?: string
}>()
</script>

<template>
  <div 
    class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    :class="[
      border ? 'border-b border-slate-100 pb-5' : '',
      mb || 'mb-6'
    ]"
  >
    <div>
      <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-xs text-[var(--ink-400)] mt-1 max-w-2xl leading-relaxed">
        {{ subtitle }}
      </p>
    </div>
    
    <div v-if="$slots.default" class="flex items-center gap-2 shrink-0 self-start md:self-auto">
      <slot />
    </div>
  </div>
</template>
