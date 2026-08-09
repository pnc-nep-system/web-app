<script setup lang="ts">
import { ref } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { downloadProgrammeReportPdf } from '@/api/programmeReport.api'
import { useToast } from '@/utils/toast'

const props = defineProps<{
  show: boolean
  entry: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const downloading = ref(false)
const toast = useToast()

async function handleDownloadPdf() {
  if (!props.entry) return
  downloading.value = true
  try {
    const nameSlug = (props.entry.name || props.entry.programme_name || 'Report')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30)
    await downloadProgrammeReportPdf(props.entry.id, `Programme_Report_${nameSlug}.pdf`)
    toast.success('PDF report downloaded successfully!')
  } catch (err: any) {
    if (err?.response?.status === 403) {
      toast.error('Forbidden: You can only generate reports for programs assigned to your organisation.')
    } else {
      toast.error('Failed to download PDF report. Please try again.')
    }
  } finally {
    downloading.value = false
  }
}

function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show && entry"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-150 p-4 sm:p-6"
        @click.self="emit('close')"
      >
        <div
          class="bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[800px] max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
          @click.stop
        >
          <!-- Header Bar -->
          <div class="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <BaseIcon name="file" :size="18" class="text-[#0F5A4D]" />
                Programme Report Preview
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Preview the generated self-service report before exporting to PDF
              </p>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                type="button"
                @click="handleDownloadPdf"
                :disabled="downloading"
                class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F5A4D] hover:bg-[#0c483d] shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                <svg v-if="downloading" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <BaseIcon v-else name="download" :size="14" />
                {{ downloading ? 'Exporting PDF...' : 'Download PDF' }}
              </button>

              <button
                type="button"
                @click="emit('close')"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <BaseIcon name="close" :size="18" />
              </button>
            </div>
          </div>

          <!-- Document Preview Canvas (Simulated A4 PDF Page) -->
          <div class="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-200/70">
            <div class="bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-[720px] mx-auto text-slate-800 text-xs leading-relaxed space-y-6">
              
              <!-- Report Document Header -->
              <div class="border-b-2 border-[#0F5A4D] pb-4 flex items-start justify-between gap-4">
                <div>
                  <div class="text-lg font-extrabold text-[#0F5A4D] tracking-wide uppercase">NEP CAMBODIA</div>
                  <div class="text-[11px] text-slate-500 font-medium">NGO Education Partnership — Self-Service Programme Report</div>
                  <h1 class="text-xl font-bold text-slate-900 mt-3 leading-snug">
                    {{ entry.name || entry.programme_name || 'Untitled Programme' }}
                  </h1>
                  <p class="text-xs text-slate-600 font-semibold mt-1">
                    Organisation: <span class="text-slate-900">{{ entry.organisationName || entry.organisation?.name || 'N/A' }}</span>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <BaseBadge :tone="entry.is_verified || entry.status === 'Verified' ? 'green' : 'amber'" dot>
                    {{ entry.is_verified || entry.status === 'Verified' ? 'Verified' : 'Unverified' }}
                  </BaseBadge>
                  <div class="text-[10px] text-slate-400 mt-2 font-medium">
                    Report Date: {{ formatDate() }}
                  </div>
                </div>
              </div>

              <!-- Section 1: Basic Info & Budget -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                  1. Programme Information & Budget
                </h4>
                <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-slate-400 font-medium block text-[11px]">Implementation Period</span>
                    <span class="font-semibold text-slate-900">
                      {{ entry.startYear || entry.start_year || 'N/A' }} – {{ entry.endYear || entry.end_year || 'Ongoing' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400 font-medium block text-[11px]">Total Annual Budget</span>
                    <span class="font-semibold text-slate-900">
                      <template v-if="entry.annual_budget_usd">${{ Number(entry.annual_budget_usd).toLocaleString() }} USD</template>
                      <template v-else-if="entry.budgetBand">{{ entry.budgetBand }}</template>
                      <template v-else>Not specified</template>
                    </span>
                  </div>
                  <div class="col-span-2 pt-1">
                    <span class="text-slate-400 font-medium block text-[11px] mb-0.5">Description / Summary</span>
                    <p class="text-slate-700 leading-normal">{{ entry.description || 'No description provided.' }}</p>
                  </div>
                </div>
              </div>

              <!-- Section 2: Programme Activities -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                  2. Programme Activities & Taxonomy
                </h4>
                <div v-if="entry.activities && entry.activities.length" class="overflow-x-auto">
                  <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                    <thead class="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th class="p-2 border border-slate-200">Role</th>
                        <th class="p-2 border border-slate-200">Category & Sub-Category</th>
                        <th class="p-2 border border-slate-200">Education Levels</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-xs">
                      <tr v-for="(act, idx) in entry.activities" :key="idx" class="hover:bg-slate-50">
                        <td class="p-2 border border-slate-200 font-bold" :class="act.importance === 'primary' || act.importance === 'core' ? 'text-teal-700' : 'text-slate-600'">
                          {{ act.importance === 'primary' || act.importance === 'core' ? 'Core' : 'Supporting' }}
                        </td>
                        <td class="p-2 border border-slate-200">
                          <div class="font-semibold text-slate-900">{{ act.category?.name || act.activity_code }}</div>
                          <div class="text-[11px] text-slate-500">{{ act.subCategory?.name || act.activity_code }}</div>
                          <div v-if="act.other_text" class="text-[10px] text-slate-400 italic">Note: {{ act.other_text }}</div>
                        </td>
                        <td class="p-2 border border-slate-200">
                          {{ Array.isArray(act.education_levels) ? act.education_levels.join(', ') : (act.education_levels || '—') }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-200">
                  No registered activity taxonomy items.
                </div>
              </div>

              <!-- Section 3: Geographic Coverage -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                  3. Geographic Coverage
                </h4>
                <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                  <span class="text-slate-400 font-medium block text-[11px] mb-1">Covered Provinces</span>
                  <span class="font-semibold text-slate-900">
                    {{ entry.provincesDisplay || (entry.locations && entry.locations.length ? entry.locations.map((l: any) => l.province?.name || l.name).filter(Boolean).join(', ') : 'Geographic coverage not specified.') }}
                  </span>
                </div>
              </div>

              <!-- Section 4: Government Agreements -->
              <div class="space-y-2">
                <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                  4. Government Agreements & Counterparts
                </h4>
                <div v-if="entry.governmentAgreements && entry.governmentAgreements.length" class="overflow-x-auto">
                  <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                    <thead class="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th class="p-2 border border-slate-200">Agreement Name</th>
                        <th class="p-2 border border-slate-200">Counterpart Level</th>
                        <th class="p-2 border border-slate-200">Signatory Entity</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-xs">
                      <tr v-for="(agr, idx) in entry.governmentAgreements" :key="idx">
                        <td class="p-2 border border-slate-200 font-medium text-slate-900">{{ agr.name || agr.agreement_name || '—' }}</td>
                        <td class="p-2 border border-slate-200">{{ agr.counterpartStatus?.name || agr.counterpart_level || '—' }}</td>
                        <td class="p-2 border border-slate-200">{{ agr.signatory_entity || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-200">
                  No formal government agreements recorded.
                </div>
              </div>

              <!-- Section 5: Keywords -->
              <div v-if="entry.keywords && entry.keywords.length" class="space-y-2">
                <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                  5. Keywords & Focus Areas
                </h4>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span
                    v-for="(kw, idx) in entry.keywords"
                    :key="idx"
                    class="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[11px] font-medium"
                  >
                    {{ typeof kw === 'string' ? kw : (kw.keyword || kw.name) }}
                  </span>
                </div>
              </div>

              <!-- Footer -->
              <div class="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
                Confidential — NGO Education Partnership (NEP) System • Self-Service Programme Report
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
