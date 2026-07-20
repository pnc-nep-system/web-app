<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/utils/toast'
import Badge from '@/components/common/BaseBadge.vue'
import Icon from '@/components/common/BaseIcon.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PolicyFormModal from '@/components/policy/PolicyFormModal.vue'

interface PolicyDocument {
  id: number
  title: string
  authority: string
  version: string
  date: string
  status: 'active' | 'superseded'
}

const auth = useAuthStore()
const toast = useToast()

const isAdmin = computed(() => auth.userRole === 'nep_admin')

const items = ref<PolicyDocument[]>([])
const loading = ref(false)
const error = ref('')

const seedData: PolicyDocument[] = [
  { id: 1, title: 'Education Strategic Plan 2024-2028', authority: 'MoEYS', version: '1.0', date: '2024-01-15', status: 'active' },
  { id: 2, title: 'Inclusive Education Policy Circular', authority: 'MoEYS', version: '2.1', date: '2025-03-02', status: 'active' },
  { id: 3, title: 'TVET Sector Framework', authority: 'Ministry of Labour and Vocational Training', version: '1.2', date: '2023-09-10', status: 'superseded' },
  { id: 4, title: 'TVET Sector Framework', authority: 'Ministry of Labour and Vocational Training', version: '2.0', date: '2026-02-01', status: 'active' },
  { id: 5, title: 'Early Childhood Care and Development Policy', authority: 'MoEYS', version: '1.0', date: '2022-06-20', status: 'active' },
  { id: 6, title: 'Child Safeguarding in Schools Guideline', authority: 'MoEYS', version: '1.1', date: '2025-08-14', status: 'active' }
]

async function fetchPolicies() {
  loading.value = true
  error.value = ''
  try {
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    items.value = [...seedData]
  } catch {
    error.value = 'Failed to load policy documents.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPolicies()
})

const showAdd = ref(false)

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function handleAddPolicy(payload: { title: string; authority: string; version: string; date: string }) {
  const active = items.value.find(d => d.title === payload.title && d.status === 'active')
  if (active) active.status = 'superseded'

  items.value.push({
    id: Date.now(),
    title: payload.title,
    authority: payload.authority,
    version: payload.version,
    date: payload.date,
    status: 'active',
  })

  toast.success('Policy document added — any prior active version has been marked superseded')
  showAdd.value = false
}
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex items-center gap-1.5 text-sm min-w-0">
          <span class="text-gray-400">NEP</span>
          <span class="text-gray-300">›</span>
          <span class="text-gray-700 font-medium truncate">Policy library</span>
        </div>
        <button v-if="isAdmin" @click="showAdd = true"
          class="inline-flex items-center gap-[7px] rounded-lg font-semibold text-[13px] px-4 py-[9px] border border-[var(--line)] bg-white text-[var(--ink-700)] whitespace-nowrap transition duration-100 hover:border-[var(--ink-400)] shadow-sm shrink-0">
          <Icon name="plus" :size="15" /> Add document
        </button>
      </div>
    </template>

    <!-- Page heading -->
    <div class="page-head">
      <h1>Policy document library <Badge tone="indigo" class="align-middle">Phase 7 — future</Badge></h1>
      <p>Curated MoEYS and government policy documents that will power the Policy Alignment Module (C3), built after C1 and C2 are stable.</p>
    </div>

    <!-- Info Banner -->
    <div class="border rounded-xl shadow-sm p-5 mb-6 bg-[var(--teal-50)] border-[var(--teal-100)]">
      <h2 class="text-[13px] font-bold text-[var(--ink-900)] mb-1.5">Why this screen exists now</h2>
      <p class="text-[13px] text-[var(--ink-600)] leading-relaxed">
        The system architecture is designed to accommodate C3 from the start. This library is populated and manageable
        today so the data model — title, issuing authority, date, version, active status — is validated early, even though
        alignment analysis itself ships later.
      </p>
    </div>

    <!-- Data Table / Loader / Empty States -->
    <div class="border rounded-xl shadow-sm bg-white overflow-hidden">
      <!-- Loading Indicator -->
      <LoadingSpinner v-if="loading" message="Loading documents..." />

      <!-- Error State -->
      <EmptyState v-else-if="error" title="Something went wrong" :description="error">
        <button
          class="mt-2 text-sm font-medium text-teal-700 hover:text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-200 transition-colors"
          @click="fetchPolicies"
        >
          Try again
        </button>
      </EmptyState>

      <!-- Empty State -->
      <EmptyState v-else-if="items.length === 0" title="No matching entries found" description="Try adjusting or clearing your filters." />

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[var(--line)] bg-gray-50/50">
              <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Document</th>
              <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-6 py-3.5">Issuing
                authority</th>
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
    </div>

    <!-- Modal Form (Extracted Component) -->
    <PolicyFormModal
      :show="showAdd"
      @close="showAdd = false"
      @submit="handleAddPolicy"
    />
  </AppShell>
</template>

<style scoped>
.page-head {
  margin-bottom: 24px;
}
.page-head h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.02em;
  margin: 0;
}
.page-head p {
  font-size: 13px;
  color: var(--ink-400);
  margin-top: 4px;
}
</style>
