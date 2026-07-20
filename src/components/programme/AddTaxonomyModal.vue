<script setup lang="ts">
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy
</script>

<template>
  <Teleport to="body">
    <div v-if="store.showAdd" class="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" @click.self="store.showAdd = false">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
        <div>
          <h3 class="text-lg font-bold text-[var(--ink-900)]">Add custom activity</h3>
          <p class="text-xs text-slate-500 mt-0.5">Submit a custom taxonomy item for evaluation or review.</p>
        </div>
        
        <div class="space-y-3.5">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-705">Category</label>
            <select v-model="store.addForm.categoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
              <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                {{ c.code }} · {{ c.label }}
              </option>
            </select>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-705">Sub-category code</label>
              <input type="text" v-model="store.addForm.subcategoryCode" placeholder="e.g. B1.4" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-705">Sub-category label (if new)</label>
              <input type="text" v-model="store.addForm.subcategoryLabel" placeholder="e.g. Health education" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
            </div>
          </div>
          
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-705">Item label</label>
            <input type="text" v-model="store.addForm.label" placeholder="e.g. Menstrual hygiene management sessions" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.showAdd = false">Cancel</button>
          <button class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.submitAdd" :disabled="taxonomy.loading">
            {{ taxonomy.loading ? 'Submitting...' : 'Submit for review' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
