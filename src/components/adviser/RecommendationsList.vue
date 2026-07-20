<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

interface Recommendation {
  org: string
  type: string
  linked: string
  text: string
}

defineProps<{
  items: Recommendation[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  'update:org': [index: number, value: string]
  'update:type': [index: number, value: string]
  'update:text': [index: number, value: string]
}>()
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      <h2 class="text-[14px] font-bold text-gray-900">B · Coordination recommendations</h2>
      <button @click="$emit('add')" class="text-[13px] text-gray-500 hover:text-gray-900 font-semibold">+ Add</button>
    </div>
    
    <div class="p-6 space-y-4">
      <p v-if="items.length === 0" class="text-[13.5px] text-gray-600">No recommendations recorded.</p>
      
      <div v-for="(rec, idx) in items" :key="idx" class="border border-gray-200 rounded-lg p-5 bg-white relative group">
        <button @click="$emit('remove', idx)" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition">✕</button>
        
        <div class="flex items-center gap-3 mb-3 pr-8">
          <input 
            type="text" 
            :value="rec.org"
            @input="$emit('update:org', idx, ($event.target as HTMLInputElement).value)"
            placeholder="Organisation name" 
            class="font-bold text-[14px] text-gray-900 border border-gray-200 rounded-md px-3 py-1.5 w-[220px] focus:outline-none focus:border-[#0F5A4D]" 
          />
          <select 
            :value="rec.type"
            @change="$emit('update:type', idx, ($event.target as HTMLSelectElement).value)"
            class="text-[13px] text-gray-700 border border-gray-200 rounded-md px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-[#0F5A4D]"
          >
            <option>Geographic overlap</option>
            <option>Thematic adjacency</option>
          </select>
        </div>
        
        <p class="text-[12px] text-gray-500 mb-2 font-medium">Linked entry: {{ rec.linked }}</p>
        <textarea 
          :value="rec.text"
          @input="$emit('update:text', idx, ($event.target as HTMLTextAreaElement).value)"
          class="w-full text-[13.5px] text-gray-600 border border-transparent hover:border-gray-200 focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D] rounded-md p-2 -ml-2 transition-all min-h-[60px] resize-y outline-none" 
          placeholder="Describe the recommendation..."
        ></textarea>
      </div>
    </div>
  </div>
</template>