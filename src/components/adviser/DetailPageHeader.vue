<!-- Page header for the adviser detail view:
     shows the title, status badge, source metadata, and action buttons -->
<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  status: string
  documentName: string
  submittingParty: string
  scopeDisplay: string
  delivering: boolean
}>()

const emit = defineEmits<{
  back: []
  saveDraft: []
  markDelivered: []
}>()
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 py-6 border-b border-gray-100 mb-6">

    <!-- Left: title + metadata -->
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Draft advisory note</h1>
        <span
          v-if="status === 'advice_delivered'"
          class="bg-[#DCFCE7] text-[#15803D] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
        >Advice delivered</span>
        <span
          v-else
          class="bg-[#FFF4ED] text-[#C2410C] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
        >Submitted for review</span>
      </div>

      <p class="mt-2 text-[13px] text-gray-500 flex items-center gap-2">
        <span>Source: <a href="#" class="text-[#0F5A4D] hover:underline underline-offset-2">{{ documentName }}</a></span>
        <span class="text-gray-300">•</span>
        <span>Submitted by <span class="font-medium text-gray-700">{{ submittingParty }}</span></span>
        <span class="text-gray-300">•</span>
        <span>Analysed against {{ scopeDisplay }}</span>
      </p>
    </div>

    <!-- Right: action buttons -->
    <div class="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
      <button
        @click="emit('back')"
        class="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
      >
        <BaseIcon name="arrowLeft" size="14" />
        Back
      </button>

      <template v-if="status !== 'advice_delivered'">
        <button
          @click="emit('saveDraft')"
          class="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          Save draft
        </button>

        <button
          @click="emit('markDelivered')"
          :disabled="delivering"
          class="px-4 py-2 bg-[#0F5A4D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0c4a3f] transition shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <BaseIcon v-if="delivering" name="refresh" size="14" class="animate-spin" />
          {{ delivering ? 'Saving…' : 'Mark advice delivered →' }}
        </button>
      </template>
    </div>

  </div>
</template>
