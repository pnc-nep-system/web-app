<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Submission, SubmissionStatus } from '@/types/adviser'

const props = defineProps<{
  submissions: Submission[]
  coordinatorMap: Record<number, string>
}>()

const emit = defineEmits<{
  open: [id: number]
}>()

function statusLabel(status: SubmissionStatus): string {
  if (status === 'advice_delivered') return 'Advice delivered'
  return 'Submitted for review'
}

function statusClass(status: SubmissionStatus): string {
  if (status === 'advice_delivered') return 'bg-[#DCFCE7] text-[#15803D]'
  return 'bg-[#FFEDD5] text-[#C2410C]'
}

function coordinatorLabel(id: number | null): string {
  if (!id) return 'Unassigned'
  return props.coordinatorMap[id] ?? `User #${id}`
}

function formatScope(s: Submission): string {
  const base = s.analysis_scope ? s.analysis_scope.charAt(0).toUpperCase() + s.analysis_scope.slice(1) : '—'
  return s.analysis_scope_detail ? `${base}: ${s.analysis_scope_detail}` : base
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const months = Math.floor(days / 30)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  return `${months} month${months !== 1 ? 's' : ''} ago`
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full table-fixed text-left border-collapse min-w-[860px]">
        <colgroup>
          <col style="width: 17%" />
          <col style="width: 20%" />
          <col style="width: 17%" />
          <col style="width: 16%" />
          <col style="width: 13%" />
          <col style="width: 9%" />
          <col style="width: 8%" />
        </colgroup>

        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Submitting party</th>
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Document</th>
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Analysis scope</th>
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Status</th>
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Assigned to</th>
            <th class="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">Submitted</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="sub in submissions"
            :key="sub.id"
            @click="emit('open', sub.id)"
            class="group hover:bg-[#F4FBFA] transition-colors cursor-pointer"
          >
            <!-- Submitting party -->
            <td class="px-4 h-12 align-middle">
              <span class="text-[13px] font-semibold text-gray-900 truncate block leading-none" :title="sub.submitting_party">
                {{ sub.submitting_party }}
              </span>
            </td>

            <!-- Document -->
            <td class="px-4 h-12 align-middle">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                  <BaseIcon name="file" size="12" class="text-gray-400" />
                </span>
                <span class="text-[13px] text-gray-600 truncate leading-none" :title="sub.document_name">{{ sub.document_name }}</span>
              </div>
            </td>

            <!-- Analysis scope -->
            <td class="px-4 h-12 align-middle">
              <span class="text-[13px] text-gray-700 truncate block leading-none" :title="formatScope(sub)">{{ formatScope(sub) }}</span>
            </td>

            <!-- Status badge -->
            <td class="px-4 h-12 align-middle">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                :class="statusClass(sub.status)"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="sub.status === 'advice_delivered' ? 'bg-[#15803D]' : 'bg-[#C2410C]'"
                ></span>
                {{ statusLabel(sub.status) }}
              </span>
            </td>

            <!-- Assigned to -->
            <td class="px-4 h-12 align-middle">
              <span
                class="text-[13px] truncate block leading-none"
                :class="coordinatorLabel(sub.assign_to_staff_user_id) === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700'"
                :title="coordinatorLabel(sub.assign_to_staff_user_id)"
              >
                {{ coordinatorLabel(sub.assign_to_staff_user_id) }}
              </span>
            </td>

            <!-- Submitted time -->
            <td class="px-4 h-12 align-middle text-[13px] text-gray-400 whitespace-nowrap leading-none">
              {{ timeAgo(sub.submitted_at) }}
            </td>

            <!-- Action -->
            <td class="px-4 pr-5 h-12 align-middle text-right">
              <span
                class="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors whitespace-nowrap"
                :class="sub.status === 'advice_delivered' ? 'text-[#15803D] group-hover:text-[#0f5a4d]' : 'text-gray-400 group-hover:text-[#0F5A4D]'"
              >
                {{ sub.status === 'advice_delivered' ? 'View' : 'Open' }}
                <BaseIcon name="arrowLeft" size="14" class="rotate-180 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
