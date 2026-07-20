<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  documentName?: string
  documentSize?: string
  submittingParty?: string
  analysisScope?: string
  submittedDate?: string
  assignee?: string
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Document Preview Card -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 class="text-[14px] font-bold text-gray-900">Uploaded document</h2>
      </div>
      <div class="p-5">
        <!-- Document info -->
        <div class="flex items-start gap-4 mb-5">
          <div class="w-12 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
            <BaseIcon name="file" size="24" class="text-gray-500" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-semibold text-gray-900 truncate">{{ documentName }}</p>
            <p class="text-[12px] text-gray-500 mt-0.5">PDF • {{ documentSize }}</p>
          </div>
        </div>

        <!-- Download link -->
        <a 
          href="#" 
          class="flex items-center gap-2.5 px-4 py-2.5 bg-[#0F5A4D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0c4a3f] transition shadow-sm w-full justify-center mb-3"
        >
          <BaseIcon name="download" size="16" />
          Download document
        </a>

        <!-- In-browser viewer link -->
        <a 
          href="#" 
          class="flex items-center gap-2.5 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition shadow-sm w-full justify-center"
        >
          <BaseIcon name="eye" size="16" />
          View in browser
        </a>
      </div>
    </div>

    <!-- Document Metadata Card -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h2 class="text-[14px] font-bold text-gray-900 mb-4">Document details</h2>
      <dl class="space-y-3">
        <div class="flex justify-between">
          <dt class="text-[12px] text-gray-500 font-medium">Submitted by</dt>
          <dd class="text-[13px] text-gray-900 font-medium">{{ submittingParty }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[12px] text-gray-500 font-medium">Analysis scope</dt>
          <dd class="text-[13px] text-gray-900 font-medium">{{ analysisScope }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[12px] text-gray-500 font-medium">Submitted</dt>
          <dd class="text-[13px] text-gray-900 font-medium">{{ submittedDate }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[12px] text-gray-500 font-medium">Assigned to</dt>
          <dd class="text-[13px] text-gray-900 font-medium">{{ assignee }}</dd>
        </div>
      </dl>
    </div>

    <!-- Reasoning Card -->
    <div class="bg-gray-50/80 border border-gray-200 rounded-xl shadow-sm p-5">
      <h2 class="text-[13px] font-bold text-gray-900 mb-2">Reasoning for AI recommendations</h2>
      <p class="text-[12px] text-gray-600 leading-relaxed">
        Recommendations are grounded only in structured map data — activity tags, 
        geographies and funding models. The exact phrasing has been formulated based on 
        NEP coordination historical notes.
      </p>
    </div>
  </div>
</template>