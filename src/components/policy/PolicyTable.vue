<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/api/policy.api'

defineProps<{
  items: PolicyDocument[]
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', doc: PolicyDocument): void
  (e: 'delete', id: number): void
  (e: 'view', doc: PolicyDocument): void
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <!-- Desktop Table -->
  <div class="overflow-x-auto">
    <table class="w-full table-fixed text-left border-collapse min-w-[860px] hidden md:table">
      <colgroup>
        <col style="width: 25%" />
        <col style="width: 25%" />
        <col style="width: 18%" />
        <col style="width: 14%" />]
        <col style="width: 18%" />
      </colgroup>

      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th
            class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">
            Document</th>
          <th
            class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">
            Issuing authority</th>
          <th
            class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">
            Version</th>
          <th
            class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">
            Status</th>
          <th
            class="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right whitespace-nowrap">
            Action</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-100">
        <tr v-for="d in items" :key="d.id" class="group hover:bg-[#F4FBFA] transition-colors">
          <td class="px-5 h-12 align-middle">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                <BaseIcon name="book" size="12" class="text-gray-400" />
              </span>
              <div>
                <span class="text-[13px] truncate block leading-none"
                  :class="d.status === 'active' ? 'font-semibold text-gray-900' : 'text-gray-500'" :title="d.title">
                  {{ d.title }}
                </span>
                <span class="text-xs text-[var(--ink-400)]">{{ formatDate(d.date) }}</span>
              </div>
            </div>
          </td>

          <td class="px-5 h-12 align-middle">
            <span class="text-[13px] text-gray-600 truncate block leading-none" :title="d.authority">
              {{ d.authority }}
            </span>
          </td>

          <td class="px-5 h-12 align-middle">
            <span class="text-[13px] text-gray-600 truncate block leading-none">
              {{ d.version }}
            </span>
          </td>
          <td class="px-5 h-12 align-middle">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
              :class="d.status === 'active' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-gray-100 text-gray-500'">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="d.status === 'active' ? 'bg-[#15803D]' : 'bg-gray-400'"></span>
              {{ d.status === 'active' ? 'Active' : 'Superseded' }}
            </span>
          </td>

          <td class="px-4 py-3.5 align-middle text-right">
            <div class="inline-flex items-center gap-1">
              <button
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                title="View document" @click.stop="emit('view', d)">
                <BaseIcon name="eye" :size="14" />
              </button>
              <button v-if="isAdmin"
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                title="Edit document" @click.stop="emit('edit', d)">
                <BaseIcon name="edit" :size="14" />
              </button>
              <button v-if="isAdmin"
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
                title="Delete document" @click.stop="emit('delete', d.id)">
                <BaseIcon name="trash" :size="14" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards -->
  <div class="flex flex-col md:hidden">
    <div v-for="d in items" :key="d.id" class="py-4 px-[18px] border-b border-gray-100 last:border-b-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
          <BaseIcon name="book" size="12" class="text-gray-400" />
        </span>
        <span class="text-[13px] truncate block leading-tight flex-1 min-w-0"
          :class="d.status === 'active' ? 'font-semibold text-gray-900' : 'text-gray-500'" :title="d.title">
          {{ d.title }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0"
          :class="d.status === 'active' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-gray-100 text-gray-500'">
          <span class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="d.status === 'active' ? 'bg-[#15803D]' : 'bg-gray-400'"></span>
          {{ d.status === 'active' ? 'Active' : 'Superseded' }}
        </span>
      </div>
      <div class="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 pl-9.5 text-xs text-gray-500">
        <span class="truncate min-w-0 max-w-[200px]" :title="d.authority">{{ d.authority }}</span>
        <span class="text-gray-400">v{{ d.version }}</span>
        <span class="text-gray-400 whitespace-nowrap">{{ formatDate(d.date) }}</span>
      </div>
      <div class="flex gap-1.5 mt-3 pl-9.5">
        <button
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
          title="View document" @click.stop="emit('view', d)">
          <BaseIcon name="eye" :size="14" />
        </button>
        <button v-if="isAdmin"
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
          title="Edit document" @click.stop="emit('edit', d)">
          <BaseIcon name="edit" :size="14" />
        </button>
        <button v-if="isAdmin"
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
          title="Delete document" @click.stop="emit('delete', d.id)">
          <BaseIcon name="trash" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
