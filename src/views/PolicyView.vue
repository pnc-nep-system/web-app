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
import PolicyDocumentPreviewModal from '@/components/policy/PolicyDocumentPreviewModal.vue'
import PolicyTable from '@/components/policy/PolicyTable.vue'
import { policyApi } from '@/api/policy.api'
import type { PolicyDocument } from '@/types/policy'

const auth = useAuthStore()
const toast = useToast()

const isAdmin = computed(() => auth.userRole === 'nep_admin')

const items = ref<PolicyDocument[]>([])
const loading = ref(false)
const error = ref('')

async function fetchPolicies() {
  loading.value = true
  error.value = ''
  try {
    const res = await policyApi.getPolicies()
    const rawData = res.data as any
    const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : [])
    items.value = list
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Failed to load policy documents.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPolicies()
})

const showAdd = ref(false)
const submitting = ref(false)
const editingPolicy = ref<PolicyDocument | null>(null)

const viewingPolicy = ref<PolicyDocument | null>(null)
function handleView(doc: PolicyDocument) {
  viewingPolicy.value = doc
}

function openAddModal() {
  editingPolicy.value = null
  showAdd.value = true
}

function handleEdit(doc: PolicyDocument) {
  editingPolicy.value = doc
  showAdd.value = true
}

async function handleDelete(id: number) {
  if (!confirm('Are you sure you want to delete this policy document?')) return

  try {
    await policyApi.deletePolicy(id)
    toast.success('Policy document deleted')
    await fetchPolicies()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to delete policy document')
  }
}

async function handleSavePolicy(payload: { title: string; authority: string; version: string; date: string; status: 'active' | 'superseded' | 'inactive'; file?: File | null }) {
  submitting.value = true
  try {
    if (editingPolicy.value) {
      await policyApi.updatePolicy(editingPolicy.value.id, payload)
      toast.success('Policy document updated successfully')
    } else {
      await policyApi.createPolicy(payload)
      toast.success('Policy document created successfully')
    }
    showAdd.value = false
    await fetchPolicies()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to save policy document')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Policy Library" />
    </template>

    <!-- Page heading + CTA under header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 mt-2">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          Policy document library
          <Badge tone="indigo" class="align-middle">Phase 7 — future</Badge>
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Curated MoEYS and government policy documents that will power the Policy Alignment Module (C3), built after C1 and C2 are stable.
        </p>
      </div>
      <button
        v-if="isAdmin"
        @click="openAddModal"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] !text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
      >
        <Icon name="plus" :size="15" />
        Add document
      </button>
    </div>

    <!-- Data Table / Loader / Empty States -->
    <div class="rounded-xl shadow-sm bg-white overflow-hidden">
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
      <PolicyTable
        v-else
        :items="items"
        :is-admin="isAdmin"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Modal Form (Extracted Component) -->
    <PolicyFormModal
      :show="showAdd"
      :initial-data="editingPolicy"
      @close="showAdd = false"
      @submit="handleSavePolicy"
    />

    <!-- Document Preview Modal -->
    <PolicyDocumentPreviewModal
      :show="!!viewingPolicy"
      :document="viewingPolicy"
      @close="viewingPolicy = null"
    />
  </AppShell>
</template>
