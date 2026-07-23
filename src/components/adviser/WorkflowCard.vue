<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User } from '@/types/user'

const props = defineProps<{
  currentStatus: string
  assigneeId: number | null
  coordinators: Array<{ id: number; name: string; email?: string }>
  deliveredAt?: string | null
}>()

const emit = defineEmits<{
  'update:assigneeId': [value: number | null]
  upload: []
}>()

const assigneeName = computed(() => {
  if (!props.assigneeId) return null
  const u = props.coordinators.find(c => c.id === props.assigneeId)
  return u ? (u.name ?? u.email ?? `User #${props.assigneeId}`) : `User #${props.assigneeId}`
})

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'just now'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function onSelectChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emit('update:assigneeId', val === '' ? null : Number(val))
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <h2 class="text-[14px] font-bold text-gray-900 mb-6">Workflow</h2>
    
    <div class="relative pl-8 space-y-7 border-l-2 border-gray-100 ml-3">
      
      <div class="relative">
        <div class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <h3 class="text-[13px] font-bold text-gray-900 leading-none">Document uploaded</h3>
      </div>

      <div class="relative">
        <div class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <h3 class="text-[13px] font-bold text-gray-900 leading-none">AI draft generated</h3>
      </div>

      <div class="relative">
        <div v-if="currentStatus === 'advice_delivered'" class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <div v-else class="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-[#FFF4ED] border-4 border-white flex items-center justify-center">
          <div class="w-2.5 h-2.5 bg-[#C2410C] rounded-full"></div>
        </div>
        
        <template v-if="currentStatus === 'advice_delivered'">
          <h3 class="text-[13px] font-bold text-gray-900 leading-none">Advice delivered</h3>
          <p class="text-[12px] text-gray-500 mt-1">{{ formatDate(deliveredAt) }}</p>
        </template>
        <template v-else>
          <h3 class="text-[13px] font-bold text-gray-900 leading-none">Coordinator review</h3>
          <p class="text-[12px] text-gray-500 mt-1">
            In progress<template v-if="assigneeName"> — {{ assigneeName }}</template>
          </p>
        </template>
      </div>
    </div>

    <!-- Divider -->
    <!-- <hr class="border-gray-100 my-6" /> -->

    <!-- Post-delivery State -->
    <div v-if="currentStatus === 'advice_delivered'">
      <p class="text-[13px] text-gray-900 font-semibold mb-1">
        Delivered on <span class="font-normal text-gray-600">{{ formatDate(deliveredAt) }}</span>
      </p>
    </div>

    <!-- Pre-delivery Editing State -->
    <div v-else class="space-y-4">
      <div v-if="false">
        <label class="block text-[12px] font-bold text-gray-700 mb-2">Assign to coordinator</label>
        <div class="relative">
          <select
            :value="assigneeId ?? ''"
            @change="onSelectChange"
            class="w-full text-[13px] text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 appearance-none bg-white hover:border-gray-300 focus:outline-none focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D] transition shadow-sm"
          >
            <option value="">Unassigned — leave in shared queue</option>
            <option
              v-for="c in coordinators"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name ?? c.email ?? `User #${c.id}` }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
            <BaseIcon name="chevronDown" size="16" />
          </div>
        </div>
      </div>

      <div v-if="false">
        <label class="block text-[12px] font-bold text-gray-700 mb-2">Upload final note (Word/PDF)</label>
        <div class="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-[#0F5A4D]/50 transition cursor-pointer group">
          <BaseIcon name="upload" size="24" class="text-gray-400 group-hover:text-[#0F5A4D] transition mb-2" />
          <span class="text-[13px] text-gray-500 font-medium">Drop final file or browse</span>
        </div>
      </div>
    </div>
  </div>
</template>