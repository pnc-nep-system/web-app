<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePolicyStore } from '@/stores/policy'
import Badge from '@/components/common/BaseBadge.vue'
import Icon from '@/components/common/BaseIcon.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PolicyFormModal from '@/components/policy/PolicyFormModal.vue'
import PolicyDocumentPreviewModal from '@/components/policy/PolicyDocumentPreviewModal.vue'
import PolicyTable from '@/components/policy/PolicyTable.vue'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'

const auth = useAuthStore()
const policy = usePolicyStore()

const isAdmin = computed(() => auth.userRole === 'nep_admin')

onMounted(() => policy.fetchPolicies())
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
        @click="policy.openAddModal()"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] !text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
      >
        <Icon name="plus" :size="15" />
        Add document
      </button>
    </div>

    <!-- Data Table / Loader / Empty States -->
    <div class="rounded-xl shadow-sm bg-white overflow-hidden">
      <LoadingSpinner v-if="policy.loading" message="Loading documents..." />

      <EmptyState v-else-if="policy.error" title="Something went wrong" :description="policy.error">
        <button class="btn btn-secondary btn-sm mt-2" @click="policy.fetchPolicies()">
          Try again
        </button>
      </EmptyState>

      <EmptyState v-else-if="policy.items.length === 0" title="No matching entries found" description="Try adjusting or clearing your filters." />

      <PolicyTable
        v-else
        :items="policy.items"
        :is-admin="isAdmin"
        @view="policy.handleView"
        @edit="policy.handleEdit"
        @delete="policy.handleDelete"
      />
    </div>

    <PolicyFormModal
      :show="policy.showForm"
      :submitting="policy.submitting"
      :initial-data="policy.editingPolicy"
      @close="policy.showForm = false"
      @submit="policy.handleSavePolicy"
    />

    <PolicyDocumentPreviewModal
      :show="!!policy.viewingPolicy"
      :document="policy.viewingPolicy"
      @close="policy.viewingPolicy = null"
    />
  </AppShell>
</template>
