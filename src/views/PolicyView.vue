<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/utils/toast'
import Badge from '@/components/common/BaseBadge.vue'
import Icon from '@/components/common/BaseIcon.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PolicyFormModal from '@/components/policy/PolicyFormModal.vue'
import PolicyTable from '@/components/policy/PolicyTable.vue'

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
      <HeaderBreadcrumb title="Policy Library">
        <button v-if="isAdmin" @click="showAdd = true" class="btn btn-secondary shadow-sm shrink-0">
          <Icon name="plus" :size="15" /> Add document
        </button>
      </HeaderBreadcrumb>
    </template>

    <!-- Page heading -->
    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-[-0.02em] m-0">Policy document library <Badge tone="indigo" class="align-middle">Phase 7 — future</Badge></h1>
      <p class="text-[13px] text-[var(--ink-400)] mt-1">Curated MoEYS and government policy documents that will power the Policy Alignment Module (C3), built after C1 and C2 are stable.</p>
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
        <button class="btn btn-secondary btn-sm mt-2" @click="fetchPolicies">
          Try again
        </button>
      </EmptyState>

      <!-- Empty State -->
      <EmptyState v-else-if="items.length === 0" title="No matching entries found" description="Try adjusting or clearing your filters." />

      <!-- Data Table -->
      <PolicyTable v-else :items="items" />
    </div>

    <!-- Modal Form (Extracted Component) -->
    <PolicyFormModal
      :show="showAdd"
      @close="showAdd = false"
      @submit="handleAddPolicy"
    />
  </AppShell>
</template>
