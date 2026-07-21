<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/api/policy.api'

defineProps<{
  items: PolicyDocument[]
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full table-fixed text-left border-collapse min-w-[860px]">
      <colgroup>
        <col style="width: 32%" />
        <col style="width: 28%" />
        <col style="width: 12%" />
        <col style="width: 14%" />
        <col style="width: 14%" />
      </colgroup>

      <!-- Header -->
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Document</th>
          <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Issuing authority</th>
          <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Version</th>
          <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Date</th>
          <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Status</th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="d in items"
          :key="d.id"
          class="group hover:bg-[#F4FBFA] transition-colors"
        >
          <!-- Document title with icon -->
          <td class="px-5 h-12 align-middle">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <BaseIcon name="book" size="12" class="text-gray-400" />
              </span>
              <span
                class="text-[13px] truncate block leading-none"
                :class="d.status === 'active' ? 'font-semibold text-gray-900' : 'text-gray-500'"
                :title="d.title"
              >
                {{ d.title }}
              </span>
            </div>
          </td>

          <!-- Issuing authority -->
          <td class="px-5 h-12 align-middle">
            <span class="text-[13px] text-gray-600 truncate block leading-none" :title="d.authority">
              {{ d.authority }}
            </span>
          </td>

          <!-- Version -->
          <td class="px-5 h-12 align-middle">
            <span class="text-[13px] text-gray-600 truncate block leading-none">
              {{ d.version }}
            </span>
          </td>

          <!-- Date -->
          <td class="px-5 h-12 align-middle text-[13px] text-gray-500 whitespace-nowrap leading-none">
            {{ formatDate(d.date) }}
          </td>

          <!-- Status badge -->
          <td class="px-5 h-12 align-middle">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
              :class="d.status === 'active' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-gray-100 text-gray-500'"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="d.status === 'active' ? 'bg-[#15803D]' : 'bg-gray-400'"
              ></span>
              {{ d.status === 'active' ? 'Active' : 'Superseded' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
