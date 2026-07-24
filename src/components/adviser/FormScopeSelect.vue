<!-- Analysis scope selector: full map / geographic (province) / thematic (category) -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'

const props = defineProps<{
  modelValue: 'full_map' | 'geographic' | 'thematic'
  province: string
  category: string
  provinces: Province[]
  categories: Category[]
  loadingProvinces?: boolean
  loadingCategories?: boolean
  errorProvince?: string
  errorCategory?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [scope: 'full_map' | 'geographic' | 'thematic']
  'update:province': [value: string]
  'update:category': [value: string]
}>()

const scopeOptions = [
  { value: 'full_map',   label: 'Full map (default)' },
  { value: 'geographic', label: 'Geographic subset' },
  { value: 'thematic',   label: 'Thematic subset' },
] as const

const showProvince = computed(() => props.modelValue === 'geographic')
const showCategory = computed(() => props.modelValue === 'thematic')
</script>

<template>
  <div>
    <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Analysis scope</label>

    <select
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as any)"
      class="w-full border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
      :class="{ 'border-teal-500 ring-1 ring-teal-400': modelValue !== 'full_map' }"
    >
      <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <p class="mt-2 text-[13px] text-gray-400 tracking-wide">
      Narrowing scope is useful for very specific proposals, but the full map gives the most complete coordination picture.
    </p>

    <!-- Focus province (geographic) -->
    <div v-if="showProvince" class="mt-6">
      <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Focus province</label>
      <select
        :value="province"
        @change="emit('update:province', ($event.target as HTMLSelectElement).value)"
        class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
        :class="errorProvince ? 'border-red-400' : 'border-gray-200'"
      >
        <option value="">{{ loadingProvinces ? 'Loading…' : 'Select a province' }}</option>
        <option v-for="p in provinces" :key="p.id" :value="String(p.id)">
          {{ p.province_name }}
        </option>
      </select>
      <p v-if="errorProvince" class="mt-1.5 text-[13px] text-red-500">{{ errorProvince }}</p>
    </div>

    <!-- Focus category (thematic) -->
    <div v-if="showCategory" class="mt-6">
      <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Focus activity category</label>
      <select
        :value="category"
        @change="emit('update:category', ($event.target as HTMLSelectElement).value)"
        class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
        :class="errorCategory ? 'border-red-400' : 'border-gray-200'"
      >
        <option value="">{{ loadingCategories ? 'Loading…' : 'Select a category' }}</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">
          {{ (c as any).label ?? c.name }}
        </option>
      </select>
      <p v-if="errorCategory" class="mt-1.5 text-[13px] text-red-500">{{ errorCategory }}</p>
    </div>
  </div>
</template>
