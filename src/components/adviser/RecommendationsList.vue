<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

interface Recommendation {
  org: string
  type: string
  linked: string
  province?: string
  text: string
}

defineProps<{
  items: Recommendation[]
  fetching?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  findOverlaps: []
  'update:org': [index: number, value: string]
  'update:type': [index: number, value: string]
  'update:text': [index: number, value: string]
}>()
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
      <div class="flex items-center gap-2.5">
        <h2 class="text-[14.5px] font-bold text-slate-900 tracking-tight">B · Coordination recommendations</h2>
        <span v-if="items.length > 0" class="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
          {{ items.length }} {{ items.length === 1 ? 'match' : 'matches' }}
        </span>
      </div>
      <div v-if="!readonly" class="flex items-center gap-2.5">
        <button
          @click="emit('findOverlaps')"
          :disabled="fetching"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F5A4D] bg-[#0F5A4D]/10 hover:bg-[#0F5A4D]/20 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <BaseIcon v-if="fetching" name="refresh" size="13" class="animate-spin" />
          <BaseIcon v-else name="search" size="13" />
          {{ fetching ? 'Matching map entries…' : 'Query Overlaps on Map' }}
        </button>
        <button
          @click="$emit('add')"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer shadow-2xs"
        >
          + Add Manual
        </button>
      </div>
    </div>
    
    <div class="p-6 space-y-4">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="py-8 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/40">
        <div class="w-12 h-12 rounded-full bg-[#0F5A4D]/10 text-[#0F5A4D] mx-auto flex items-center justify-center mb-3">
          <BaseIcon name="search" size="22" />
        </div>
        <h3 class="text-sm font-bold text-slate-800">No Overlap Recommendations Found Yet</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-4">
          Click below to compare this programme against the map database by location & activity taxonomy to find similar registered programmes.
        </p>
        <button
          @click="emit('findOverlaps')"
          :disabled="fetching"
          class="inline-flex items-center mt-2 gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0F5A4D] hover:bg-[#0c483d] rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <BaseIcon v-if="fetching" name="refresh" size="14" class="animate-spin" />
          <BaseIcon v-else name="search" size="14" />
          {{ fetching ? 'Searching System Map…' : 'Run Overlap Search Query' }}
        </button>
      </div>
      
      <!-- Recommendation Cards -->
      <div
        v-for="(rec, idx) in items"
        :key="idx"
        class="border border-slate-200 hover:border-emerald-300 rounded-xl p-5 bg-white transition-all shadow-2xs relative group"
      >
        <button
          v-if="!readonly"
          @click="$emit('remove', idx)"
          class="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
          title="Remove recommendation"
        >
          ✕
        </button>
        
        <!-- Header row -->
        <div class="flex flex-wrap items-center gap-3 mb-3 pr-8">
          <input 
            type="text" 
            :value="rec.org"
            @input="!readonly && $emit('update:org', idx, ($event.target as HTMLInputElement).value)"
            :readonly="readonly"
            placeholder="Partner Organisation name" 
            class="font-bold text-[14px] text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 min-w-[220px] focus:outline-none focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D]"
            :class="readonly ? 'bg-slate-50 cursor-default' : ''"
          />
          <!-- Overlap Type Select Dropdown (Other options disabled) -->
          <select 
            :value="rec.type"
            @change="!readonly && $emit('update:type', idx, ($event.target as HTMLSelectElement).value)"
            :disabled="readonly"
            class="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:border-[#0F5A4D]"
            :class="readonly ? 'cursor-default opacity-100' : 'cursor-pointer'"
          >
            <option 
              v-for="opt in ['Geographic & Activity overlap', 'Geographic overlap', 'Thematic overlap', 'Thematic adjacency']"
              :key="opt"
              :value="opt"
              :disabled="opt !== rec.type"
              class="disabled:text-slate-400 disabled:bg-slate-100"
            >
              {{ opt }}
            </option>
          </select>

          <!-- Status Badge (Distinct Color for Each Status) -->
          <span
            class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider border shadow-2xs"
            :class="{
              'bg-emerald-100 text-emerald-800 border-emerald-200': rec.type.includes('Geographic') && rec.type.includes('Activity'),
              'bg-teal-100 text-teal-800 border-teal-200': rec.type.includes('Geographic') && !rec.type.includes('Activity'),
              'bg-indigo-100 text-indigo-800 border-indigo-200': rec.type.includes('Thematic') && !rec.type.includes('adjacency'),
              'bg-amber-100 text-amber-800 border-amber-200': rec.type.includes('adjacency'),
            }"
          >
            {{ rec.type }}
          </span>
        </div>
        
        <!-- Linked entry & Province Location -->
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2 font-medium">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400">Linked Map Entry:</span>
            <span class="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {{ rec.linked }}
            </span>
          </div>
          <div v-if="rec.province" class="flex items-center gap-1.5">
            <span class="text-slate-400">Location / Province:</span>
            <span class="font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              📍 {{ rec.province }}
            </span>
          </div>
        </div>
        <textarea 
          :value="rec.text"
          @input="!readonly && $emit('update:text', idx, ($event.target as HTMLTextAreaElement).value)"
          :readonly="readonly"
          class="w-full text-[13.5px] text-slate-700 border border-slate-200 hover:border-slate-300 focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D] rounded-lg p-3 transition-all min-h-[70px] resize-y outline-none bg-slate-50/50" 
          :class="readonly ? 'cursor-default' : ''"
          placeholder="Describe the coordination recommendation..."
        ></textarea>
      </div>
    </div>
  </div>
</template>