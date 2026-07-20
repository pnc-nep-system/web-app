<script setup lang="ts">
import Badge from '@/components/common/BaseBadge.vue'

interface PolicyDocument {
  id: number
  title: string
  authority: string
  version: string
  date: string
  status: 'active' | 'superseded'
}

defineProps<{
  items: PolicyDocument[]
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-[var(--line)] bg-gray-50/50">
          <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Document</th>
          <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Issuing authority</th>
          <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Version</th>
          <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Date</th>
          <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--line)]">
        <tr v-for="d in items" :key="d.id"
          :class="d.status === 'superseded' ? 'text-[var(--ink-400)]' : 'text-[var(--ink-700)]'"
          class="hover:bg-gray-50/30 transition-colors">
          <td class="px-6 py-4 text-[13px]">
            <span :class="d.status === 'active' ? 'font-bold text-[var(--ink-900)]' : 'font-normal'">
              {{ d.title }}
            </span>
          </td>
          <td class="px-6 py-4 text-[13px]">{{ d.authority }}</td>
          <td class="px-6 py-4 text-[13px]">{{ d.version }}</td>
          <td class="px-6 py-4 text-[13px]">{{ formatDate(d.date) }}</td>
          <td class="px-6 py-4 text-[13px]">
            <Badge :tone="d.status === 'active' ? 'green' : 'gray'">
              {{ d.status === 'active' ? 'Active' : 'Superseded' }}
            </Badge>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
