<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import Badge from '@/components/common/BaseBadge.vue'
import ConfirmModal from '@/components/shared/ConfirmDialog.vue'
import { useTaxonomyStore, type OtherQueueEntry, type TaxonomyAdminNodeKind } from '@/stores/taxonomy'
import { useToast } from '@/utils/toast'

type TaxonomyRow = {
  id: number
  kind: TaxonomyAdminNodeKind
  code: string
  label: string
  status: 'active' | 'deprecated'
  version: string
  usedCount: number | string
  note?: string
  categoryCode?: string
  subcategoryCode?: string
  subcategoryLabel?: string
}

const taxonomy = useTaxonomyStore()
const toast = useToast()
const tab = ref<'items' | 'other'>('items')

const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'deprecated'>('all')

// Accordion collapse/expand states
const expandedCategories = ref<Set<string>>(new Set())
const expandedSubcategories = ref<Set<string>>(new Set())

onMounted(async () => {
  await taxonomy.fetchTaxonomy()
  // Expand first category by default on load
  const firstCategory = taxonomy.categories[0]
  if (firstCategory) {
    expandedCategories.value.add(firstCategory.code)
  }
})

// Search & filter computed categories tree
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const status = statusFilter.value

  return taxonomy.categories.map(cat => {
    const subcategories = cat.subcategories.map(sub => {
      const items = sub.items.filter(item => {
        const matchesQuery = !query || 
          item.code.toLowerCase().includes(query) || 
          item.label.toLowerCase().includes(query)
        const matchesStatus = status === 'all' || item.status === status
        return matchesQuery && matchesStatus
      })

      const subMatchesQuery = !query || 
        sub.code.toLowerCase().includes(query) || 
        sub.label.toLowerCase().includes(query)

      // Keep subcategory if its code/label matches or it has items that match
      if (subMatchesQuery || items.length > 0) {
        if (query && items.length > 0) {
          expandedSubcategories.value.add(sub.code)
        }
        return { ...sub, items }
      }
      return null
    }).filter((sub): sub is Exclude<typeof sub, null> => sub !== null)

    const catMatchesQuery = !query || 
      cat.code.toLowerCase().includes(query) || 
      cat.label.toLowerCase().includes(query)

    // Keep category if it matches or has matching subcategories
    if (catMatchesQuery || subcategories.length > 0) {
      if (query && subcategories.length > 0) {
        expandedCategories.value.add(cat.code)
      }
      return { ...cat, subcategories }
    }
    return null
  }).filter((cat): cat is Exclude<typeof cat, null> => cat !== null)
})

function isCategoryExpanded(code: string): boolean {
  return expandedCategories.value.has(code)
}

function isSubcategoryExpanded(code: string): boolean {
  return expandedSubcategories.value.has(code)
}

function toggleCategory(code: string) {
  if (expandedCategories.value.has(code)) {
    expandedCategories.value.delete(code)
  } else {
    expandedCategories.value.add(code)
  }
}

function toggleSubcategory(code: string) {
  if (expandedSubcategories.value.has(code)) {
    expandedSubcategories.value.delete(code)
  } else {
    expandedSubcategories.value.add(code)
  }
}

function expandAll() {
  taxonomy.categories.forEach(cat => {
    expandedCategories.value.add(cat.code)
    cat.subcategories.forEach(sub => {
      expandedSubcategories.value.add(sub.code)
    })
  })
}

function collapseAll() {
  expandedCategories.value.clear()
  expandedSubcategories.value.clear()
}

const showAdd = ref(false)
const addForm = reactive({
  categoryCode: '',
  subcategoryCode: '',
  subcategoryLabel: '',
  label: '',
})

const renameForm = reactive({
  key: '',
  label: '',
})

function openAdd() {
  addForm.categoryCode = taxonomy.categories[0]?.code || ''
  addForm.subcategoryCode = ''
  addForm.subcategoryLabel = ''
  addForm.label = ''
  showAdd.value = true
}

async function submitAdd() {
  if (!addForm.categoryCode || !addForm.subcategoryCode || !addForm.label.trim()) {
    toast.error('Category, sub-category code, and label are all required.')
    return
  }

  await taxonomy.addItem({ ...addForm })
  toast.success('Submitted to the Other review queue')
  showAdd.value = false
  tab.value = 'other'
}

const confirmTarget = ref<TaxonomyRow | any | null>(null)

function rowKey(kind: string, id: number) {
  return `${kind}-${id}`
}

function beginRename(row: any, kindName?: string) {
  const kind = kindName || row.kind || (row.items ? 'subcategory' : 'category')
  renameForm.key = rowKey(kind, row.id)
  renameForm.label = row.label
}

function cancelRename() {
  renameForm.key = ''
  renameForm.label = ''
}

async function saveRename(row: any, kindName?: string) {
  const label = renameForm.label.trim()
  if (!label) return

  const kind = kindName || row.kind || (row.items ? 'subcategory' : 'category')
  try {
    await taxonomy.renameEntry(kind, row.id, label)
    toast.success('Taxonomy name updated')
    cancelRename()
  } catch (err: any) {
    console.error('Rename failed:', err)
    toast.error(err.response?.data?.message || err.message || 'Failed to rename')
  }
}

function askDeprecate(row: any) {
  confirmTarget.value = {
    ...row,
    kind: row.kind || (row.items ? 'subcategory' : 'category')
  }
}

async function confirmDeprecate() {
  const row = confirmTarget.value
  if (!row) return

  await taxonomy.deprecateEntry(row.kind, row.id)
  toast.success('Taxonomy entry deprecated')
  confirmTarget.value = null
}

const promoteTarget = ref<OtherQueueEntry | null>(null)
const promoteForm = reactive({
  categoryCode: '',
  subcategoryCode: '',
  subcategoryLabel: '',
})

function openPromote(entry: OtherQueueEntry) {
  promoteTarget.value = entry
  const guessCat = entry.suggestedCategory.split('.')[0] || ''
  promoteForm.categoryCode = entry.categoryCode || guessCat
  promoteForm.subcategoryCode = entry.suggestedCategory
  promoteForm.subcategoryLabel = entry.subcategoryLabel || ''
}

async function confirmPromote() {
  if (!promoteTarget.value) return

  await taxonomy.promoteOtherEntry(promoteTarget.value.id, { ...promoteForm })
  toast.success('Promoted to standard taxonomy')
  promoteTarget.value = null
  tab.value = 'items'
}

async function dismiss(entry: OtherQueueEntry) {
  await taxonomy.dismissOtherEntry(entry.id)
  toast.info('Entry dismissed')
}
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span>NEP Portal</span>
        <span>/</span>
        <span class="text-slate-800 font-bold">Activity Taxonomy Directory</span>
      </div>
    </template>

    <div class="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      <!-- Title & Action -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 class="text-2xl font-black text-slate-900 font-lexend tracking-tight">Activity Taxonomy Directory</h1>
          <p class="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage the standard activity list (B1 to B9) that member organisations select when submitting new programme reports.
          </p>
        </div>
        <button
          @click="openAdd"
          class="inline-flex items-center gap-2 bg-teal-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-teal-900 shadow-xs transition-all duration-200 cursor-pointer self-start md:self-auto"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add custom activity
        </button>
      </div>

      <!-- Segment Tabs & Controls -->
      <div class="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-px">
        <div class="inline-flex bg-slate-100 p-0.5 rounded-xl">
          <button
            @click="tab = 'items'"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
            :class="tab === 'items' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            Activity Directory List
          </button>
          <button
            @click="tab = 'other'"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
            :class="tab === 'other' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
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

        <div v-if="tab === 'items'" class="flex items-center gap-2 select-none">
          <button
            @click="expandAll"
            class="text-[10px] font-bold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
          >
            Open All
          </button>
          <span class="text-slate-300 text-xs">|</span>
          <button
            @click="collapseAll"
            class="text-[10px] font-bold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      <!-- Tab 1: Categories & Items -->
      <div v-if="tab === 'items'" class="space-y-4">
        <!-- Search & Filter Bar -->
        <div class="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <!-- Search input -->
          <div class="relative flex-grow">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search directory by code or keyword..."
              class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 text-slate-700 bg-white"
            />
          </div>

          <!-- Status select filter -->
          <div class="sm:w-48">
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-700 bg-white"
            >
              <option value="all">All Activities (Active &amp; Dep)</option>
              <option value="active">Active Only</option>
              <option value="deprecated">Deprecated Only</option>
            </select>
          </div>
        </div>

        <!-- Collapsible Tree Table cards -->
        <div class="space-y-4">
          <div
            v-for="cat in filteredCategories"
            :key="cat.code"
            class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <!-- Category Header -->
            <div
              class="flex items-center justify-between px-5 py-4 bg-slate-50/50 cursor-pointer select-none border-b border-slate-100"
              @click="toggleCategory(cat.code)"
            >
              <div class="flex items-center gap-3">
                <!-- Chevron -->
                <svg
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="isCategoryExpanded(cat.code) ? 'rotate-0' : '-rotate-90'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 border border-teal-100 text-teal-800 font-mono">Category {{ cat.code }}</span>
                  
                  <!-- Inline Rename for Category -->
                  <div v-if="renameForm.key === `category-${cat.id}`" @click.stop class="flex items-center gap-2">
                    <input
                      v-model="renameForm.label"
                      type="text"
                      @keydown.enter="saveRename(cat, 'category')"
                      @keydown.escape="cancelRename"
                      class="px-2.5 py-1 text-sm border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                    />
                    <button @click="saveRename(cat, 'category')" class="px-3 py-1 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                    <button @click="cancelRename" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
                  </div>
                  <b v-else class="text-sm text-slate-800 font-bold transition-colors">{{ cat.label }}</b>
                </div>
              </div>

              <!-- Rename Category Pencil -->
              <div class="flex items-center gap-2" @click.stop>
                <button
                  v-if="renameForm.key !== `category-${cat.id}`"
                  @click="beginRename(cat, 'category')"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Rename Category"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Category Body (Subcategories List) -->
            <div v-if="isCategoryExpanded(cat.code)" class="bg-white divide-y divide-slate-100 border-t border-slate-100 animate-fade-in">
              <div
                v-for="sub in cat.subcategories"
                :key="sub.code"
                class="overflow-hidden"
              >
                <!-- Subcategory Header Row -->
                <div
                  class="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer select-none bg-white"
                  @click="toggleSubcategory(sub.code)"
                >
                  <div class="flex items-center gap-2.5">
                    <!-- Chevron -->
                    <svg
                      class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                      :class="isSubcategoryExpanded(sub.code) ? 'rotate-0' : '-rotate-90'"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>

                    <div class="flex items-center gap-2">
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono">Subcategory {{ sub.code }}</span>
                      
                      <!-- Inline Rename for subcategory -->
                      <div v-if="renameForm.key === `subcategory-${sub.id}`" @click.stop class="flex items-center gap-2">
                        <input
                          v-model="renameForm.label"
                          type="text"
                          @keydown.enter="saveRename(sub, 'subcategory')"
                          @keydown.escape="cancelRename"
                          class="px-2.5 py-1 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                        />
                        <button @click="saveRename(sub, 'subcategory')" class="px-2.5 py-0.5 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                        <button @click="cancelRename" class="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
                      </div>
                      <span v-else class="text-xs text-slate-750 font-semibold">{{ sub.label }}</span>
                    </div>
                  </div>

                  <!-- Rename Subcategory Pencil -->
                  <div class="flex items-center gap-2" @click.stop>
                    <button
                      v-if="renameForm.key !== `subcategory-${sub.id}`"
                      @click="beginRename(sub, 'subcategory')"
                      class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Rename Subcategory"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Subcategory Body (Items Table inside expanded subcategory) -->
                <div v-if="isSubcategoryExpanded(sub.code)" class="bg-slate-50/15 border-t border-slate-100 pl-8 pr-6 py-4 animate-fade-in overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-slate-200">
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider w-28">Activity Code</th>
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Activity Description</th>
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Availability</th>
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20">Version</th>
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Programmes using</th>
                        <th class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr
                        v-for="item in sub.items"
                        :key="item.code"
                        class="hover:bg-slate-100/40 transition-colors"
                      >
                        <td class="px-4 py-2.5 text-xs font-bold font-mono text-slate-550">{{ item.code }}</td>
                        <td class="px-4 py-2.5 text-xs text-slate-700">
                          <!-- Inline Rename for item -->
                          <div v-if="renameForm.key === `item-${item.id}`" class="flex items-center gap-2">
                            <input
                              v-model="renameForm.label"
                              type="text"
                              @keydown.enter="saveRename(item, 'item')"
                              @keydown.escape="cancelRename"
                              class="px-2.5 py-1 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800 w-full max-w-sm"
                            />
                            <button @click="saveRename(item, 'item')" class="px-2.5 py-0.5 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                            <button @click="cancelRename" class="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
                          </div>
                          <div v-else class="flex items-center gap-2">
                            <span class="font-medium text-slate-850">{{ item.label }}</span>
                            <span v-if="item.note" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs font-mono select-none">{{ item.note }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 select-none">
                          <span
                            class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs border"
                            :class="item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'"
                          >
                            {{ item.status === 'active' ? 'Active' : 'Deprecated' }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-xs font-medium text-slate-500 font-mono">{{ item.version }}</td>
                        <td class="px-4 py-2.5 text-xs font-bold text-slate-700">{{ item.usedCount }}</td>
                        <td class="px-4 py-2.5 text-right select-none">
                          <div class="inline-flex gap-1.5">
                            <button
                              v-if="renameForm.key !== `item-${item.id}`"
                              @click="beginRename(item, 'item')"
                              class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200 shadow-xs"
                              :disabled="taxonomy.loading"
                            >
                              Rename
                            </button>
                            <button
                              v-if="item.status === 'active'"
                              @click="askDeprecate(item)"
                              class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 transition-colors cursor-pointer border border-rose-100 shadow-xs"
                              :disabled="taxonomy.loading"
                            >
                              Deprecate
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!sub.items.length">
                        <td colspan="6" class="px-4 py-6 text-center text-xs text-slate-400">No items found in this subcategory.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: "Other" Review Queue -->
      <div v-else class="space-y-4">
        <!-- Queue list -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 select-none">
                  <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Free-Text Entry</th>
                  <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-48">Suggested Category</th>
                  <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-40">Frequency</th>
                  <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-36">Status</th>
                  <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-48 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="entry in taxonomy.otherQueue"
                  :key="entry.id"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-6 py-4 text-sm font-medium text-slate-800">
                    <span class="italic font-normal">"{{ entry.text }}"</span>
                  </td>
                  <td class="px-6 py-4 text-xs font-bold font-mono text-slate-500">
                    {{ entry.suggestedCategory }}
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-700">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-250 shadow-xs font-mono select-none">
                      {{ entry.frequency }} Org{{ entry.frequency === 1 ? '' : 's' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-xs border"
                      :class="entry.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : entry.status === 'promoted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'"
                    >
                      {{ entry.status === 'pending' ? 'Pending Review' : entry.status === 'promoted' ? 'Promoted' : 'Dismissed' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div v-if="entry.status === 'pending'" class="inline-flex gap-2 justify-end">
                      <button
                        @click="openPromote(entry)"
                        class="px-4.5 py-2 bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Promote
                      </button>
                      <button
                        @click="dismiss(entry)"
                        class="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200 shadow-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!taxonomy.otherQueue.length">
                  <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400">No review queue entries yet.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="taxonomy.loading && !taxonomy.otherQueue.length" class="text-center p-12 text-sm text-slate-400">
            Loading review queue...
          </div>
        </div>

        <p class="text-[11px] text-slate-450 mt-2 px-1 leading-relaxed">
          Review queue entries are gathered from free-text "Other" field reports. Items used frequently are prime candidates for promotion to standard taxonomy during the annual review.
        </p>
      </div>

      <!-- ADD TAXONOMY MODAL -->
      <Teleport to="body">
        <div v-if="showAdd" class="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" @click.self="showAdd = false">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div>
              <h3 class="text-lg font-black text-slate-900 font-lexend">Add custom activity</h3>
              <p class="text-xs text-slate-500 mt-0.5">Submit a custom taxonomy item for evaluation or review.</p>
            </div>
            
            <div class="space-y-3.5">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-slate-705">Category</label>
                <select v-model="addForm.categoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
                  <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                    {{ c.code }} · {{ c.label }}
                  </option>
                </select>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-slate-705">Sub-category code</label>
                  <input type="text" v-model="addForm.subcategoryCode" placeholder="e.g. B1.4" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-slate-705">Sub-category label (if new)</label>
                  <input type="text" v-model="addForm.subcategoryLabel" placeholder="e.g. Health education" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
                </div>
              </div>
              
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-slate-705">Item label</label>
                <input type="text" v-model="addForm.label" placeholder="e.g. Menstrual hygiene management sessions" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs" @click="showAdd = false">Cancel</button>
              <button class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-xs" @click="submitAdd" :disabled="taxonomy.loading">
                {{ taxonomy.loading ? 'Submitting...' : 'Submit for review' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- PROMOTE TAXONOMY MODAL -->
      <Teleport to="body">
        <div v-if="promoteTarget" class="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" @click.self="promoteTarget = null">
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div>
              <h3 class="text-lg font-black text-slate-900 font-lexend">Promote to standard taxonomy</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Promote <span class="font-semibold italic text-slate-800">"{{ promoteTarget.text }}"</span> (reported by {{ promoteTarget.frequency }} organisations).
              </p>
            </div>

            <div class="space-y-3.5">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-slate-700">Category</label>
                <select v-model="promoteForm.categoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
                  <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                    {{ c.code }} · {{ c.label }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-slate-700">Sub-category code</label>
                  <input type="text" v-model="promoteForm.subcategoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-bold text-slate-700">Sub-category label (if new)</label>
                  <input type="text" v-model="promoteForm.subcategoryLabel" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white" />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs" @click="promoteTarget = null">Cancel</button>
              <button class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-xs" @click="confirmPromote" :disabled="taxonomy.loading">Promote</button>
            </div>
          </div>
        </div>
      </Teleport>

      <ConfirmModal
        :open="!!confirmTarget"
        :title="confirmTarget?.status === 'active' ? 'Deprecate this item?' : 'Reactivate this item?'"
        :message="confirmTarget?.status === 'active'
          ? 'Deprecated items are hidden from new entries but remain visible on any existing entry that already selected them.'
          : 'This item will become selectable again in new programme entries.'"
        :confirm-label="confirmTarget?.status === 'active' ? 'Deprecate' : 'Reactivate'"
        :danger="confirmTarget?.status === 'active'"
        :loading="taxonomy.loading"
        @cancel="confirmTarget = null"
        @confirm="confirmDeprecate"
      />
    </div>
  </AppShell>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>
