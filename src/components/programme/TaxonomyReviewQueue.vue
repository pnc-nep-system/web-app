<script setup lang="ts">
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy
</script>

<template>
  <div class="space-y-4">
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
              <td class="px-6 py-4 text-xs font-bold font-mono text-slate-550">
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
                    @click="store.openPromote(entry)"
                    class="px-4.5 py-2 bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Promote
                  </button>
                  <button
                    @click="store.dismiss(entry)"
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
</template>
