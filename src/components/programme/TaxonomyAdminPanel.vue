<script setup lang="ts">
import ConfirmModal from '@/components/shared/ConfirmDialog.vue'
import TaxonomyDirectoryList from '@/components/programme/TaxonomyDirectoryList.vue'
import TaxonomyReviewQueue from '@/components/programme/TaxonomyReviewQueue.vue'
import AddTaxonomyModal from '@/components/programme/AddTaxonomyModal.vue'
import PromoteTaxonomyModal from '@/components/programme/PromoteTaxonomyModal.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
    <!-- Title & Action -->
    <PageHeader
      title="Activity Taxonomy Directory"
      subtitle="Manage the standard activity list (B1 to B9) that member organisations select when submitting new programme reports."
      border
      mb="mb-6"
    >
      <button
        @click="store.openAdd"
        class="inline-flex items-center gap-2 bg-teal-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-teal-900 shadow-xs transition-all duration-200 cursor-pointer self-start md:self-auto"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add custom activity
      </button>
    </PageHeader>

    <!-- Segment Tabs & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-px">
      <div class="inline-flex bg-slate-100 p-0.5 rounded-xl self-start">
        <button
          @click="store.tab = 'items'"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
          :class="store.tab === 'items' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
        >
          Activity Directory List
        </button>
        <button
          @click="store.tab = 'other'"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
          :class="store.tab === 'other' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
        >
          Suggestions Review Queue
          <span
            v-if="taxonomy.pendingOtherEntries.length"
            class="inline-flex items-center justify-center h-4.5 px-1 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs"
          >
            {{ taxonomy.pendingOtherEntries.length }}
          </span>
        </button>
      </div>

      <div v-if="store.tab === 'items'" class="flex items-center gap-2 select-none self-end sm:self-auto pb-2 sm:pb-0">
        <button
          @click="store.expandAll"
          class="text-[10px] font-bold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
        >
          Open All
        </button>
        <span class="text-slate-300 text-xs">|</span>
        <button
          @click="store.collapseAll"
          class="text-[10px] font-bold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
        >
          Collapse All
        </button>
      </div>
    </div>

    <!-- Tab Panels -->
    <TaxonomyDirectoryList v-if="store.tab === 'items'" />
    <TaxonomyReviewQueue v-else />

    <!-- Modals -->
    <AddTaxonomyModal />
    <PromoteTaxonomyModal />

    <ConfirmModal
      :open="!!store.confirmTarget"
      :title="store.confirmTarget?.status === 'active' ? 'Deprecate this item?' : 'Reactivate this item?'"
      :message="store.confirmTarget?.status === 'active'
        ? 'Deprecated items are hidden from new entries but remain visible on any existing entry that already selected them.'
        : 'This item will become selectable again in new programme entries.'"
      :confirm-label="store.confirmTarget?.status === 'active' ? 'Deprecate' : 'Reactivate'"
      :danger="store.confirmTarget?.status === 'active'"
      :loading="taxonomy.loading"
      @cancel="store.confirmTarget = null"
      @confirm="store.confirmDeprecate"
    />
  </div>
</template>
