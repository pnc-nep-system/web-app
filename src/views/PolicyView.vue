<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/utils/toast'
import Badge from '@/components/common/BaseBadge.vue'
import Icon from '@/components/common/BaseIcon.vue'

const auth = useAuthStore()
const toast = useToast()

const isAdmin = computed(() => auth.userRole === 'nep_admin')

const items = ref([])

const showAdd = ref(false)
const form = reactive({ title: '', authority: '', version: '', date: '' })
const errors = reactive({ title: '', authority: '', version: '', date: '' })

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openAdd() {
  form.title = ''
  form.authority = ''
  form.version = ''
  form.date = ''
  showAdd.value = true
}

async function submit() {
  errors.title = form.title.trim() ? '' : 'Title is required.'
  errors.authority = form.authority.trim() ? '' : 'Issuing authority is required.'
  errors.version = form.version.trim() ? '' : 'Version is required.'
  errors.date = form.date ? '' : 'Date is required.'
  if (Object.values(errors).some(Boolean)) return
  const active = items.value.find(d => d.title === form.title.trim() && d.status === 'active')
  if (active) active.status = 'superseded'
  items.value.push({
    id: Date.now(),
    title: form.title.trim(),
    authority: form.authority.trim(),
    version: form.version.trim(),
    date: form.date,
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
        <button v-if="isAdmin" @click="openAdd"
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

    <!-- Data Table -->
    <div class="border rounded-xl shadow-sm bg-white overflow-hidden">
      <div class="overflow-x-auto">
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

    <!-- Modal Form (Teleport) -->
    <Teleport to="body">
      <div v-if="showAdd" class="fixed inset-0 bg-[rgba(10,25,22,0.45)] flex items-center justify-center z-[150] p-5"
        @click.self="showAdd = false">
        <div class="bg-white rounded-xl shadow-[var(--shadow-lg)] w-full max-w-[440px] p-6">
          <h3 class="text-[16px] font-semibold mb-[14px]">Add policy document</h3>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-[6px]">Title</label>
            <input type="text" v-model="form.title"
              class="w-full border rounded-lg px-3 py-[10px] text-[13.3px] text-[var(--ink-900)] bg-white transition-colors duration-100 focus:outline-none focus:border-[var(--teal-600)] focus:ring-[3px] focus:ring-[var(--teal-100)]"
              :class="errors.title ? 'border-[var(--red-600)]' : 'border-[var(--line)]'" />
            <div v-if="errors.title" class="flex items-center gap-1 text-[11.5px] text-[var(--red-600)] mt-1">{{
              errors.title }}</div>
          </div>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-[6px]">Issuing authority</label>
            <input type="text" v-model="form.authority"
              class="w-full border rounded-lg px-3 py-[10px] text-[13.3px] text-[var(--ink-900)] bg-white transition-colors duration-100 focus:outline-none focus:border-[var(--teal-600)] focus:ring-[3px] focus:ring-[var(--teal-100)]"
              :class="errors.authority ? 'border-[var(--red-600)]' : 'border-[var(--line)]'" />
            <div v-if="errors.authority" class="flex items-center gap-1 text-[11.5px] text-[var(--red-600)] mt-1">{{
              errors.authority }}</div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-[6px]">Version</label>
              <input type="text" v-model="form.version" placeholder="e.g. 1.0"
                class="w-full border rounded-lg px-3 py-[10px] text-[13.3px] text-[var(--ink-900)] bg-white transition-colors duration-100 focus:outline-none focus:border-[var(--teal-600)] focus:ring-[3px] focus:ring-[var(--teal-100)]"
                :class="errors.version ? 'border-[var(--red-600)]' : 'border-[var(--line)]'" />
              <div v-if="errors.version" class="flex items-center gap-1 text-[11.5px] text-[var(--red-600)] mt-1">{{
                errors.version }}</div>
            </div>
            <div>
              <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-[6px]">Date</label>
              <input type="date" v-model="form.date"
                class="w-full border rounded-lg px-3 py-[10px] text-[13.3px] text-[var(--ink-900)] bg-white transition-colors duration-100 focus:outline-none focus:border-[var(--teal-600)] focus:ring-[3px] focus:ring-[var(--teal-100)]"
                :class="errors.date ? 'border-[var(--red-600)]' : 'border-[var(--line)]'" />
              <div v-if="errors.date" class="flex items-center gap-1 text-[11.5px] text-[var(--red-600)] mt-1">{{
                errors.date }}</div>
            </div>
          </div>

          <div class="text-[11.5px] text-[var(--ink-500)] mt-3 mb-[18px] leading-normal">
            If a document with this exact title is already active, it will be marked superseded and retained for
            historical reference.
          </div>

          <div class="flex justify-end gap-[10px]">
            <button @click="showAdd = false"
              class="inline-flex items-center gap-[7px] rounded-[7px] font-semibold text-[12.3px] px-[11px] py-[6px] border border-[var(--line)] bg-white text-[var(--ink-700)] whitespace-nowrap transition duration-100 hover:border-[var(--ink-400)]">Cancel</button>
            <button @click="submit"
              class="inline-flex items-center gap-[7px] rounded-[7px] font-semibold text-[12.3px] px-[11px] py-[6px] border border-transparent bg-[var(--teal-800)] text-white shadow-sm whitespace-nowrap transition duration-100 hover:bg-[var(--teal-700)]">Add
              document</button>
          </div>
        </div>
      </div>
    </Teleport>
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

