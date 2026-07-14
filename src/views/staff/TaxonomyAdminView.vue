<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import Badge from '@/components/common/BaseBadge.vue'
import Icon from '@/components/common/BaseIcon.vue'
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

onMounted(() => {
  taxonomy.fetchTaxonomy()
})

const rows = computed<TaxonomyRow[]>(() => {
  const out: TaxonomyRow[] = []

  taxonomy.categories.forEach((cat) => {
    out.push({
      id: cat.id,
      kind: 'category',
      code: cat.code,
      label: cat.label,
      status: cat.status,
      version: '',
      usedCount: '',
    })

    cat.subcategories.forEach((sub) => {
      out.push({
        id: sub.id,
        kind: 'subcategory',
        code: sub.code,
        label: sub.label,
        status: sub.status,
        version: '',
        usedCount: '',
      })

      sub.items.forEach((item) => {
        out.push({
          id: item.id,
          kind: 'item',
          code: item.code,
          label: item.label,
          status: item.status,
          version: item.version,
          usedCount: item.usedCount,
          note: item.note,
          categoryCode: cat.code,
          subcategoryCode: sub.code,
          subcategoryLabel: sub.label,
        })
      })
    })
  })

  return out
})

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

const confirmTarget = ref<TaxonomyRow | null>(null)

function rowKey(row: TaxonomyRow) {
  return `${row.kind}-${row.id}`
}

function beginRename(row: TaxonomyRow) {
  renameForm.key = rowKey(row)
  renameForm.label = row.label
}

function cancelRename() {
  renameForm.key = ''
  renameForm.label = ''
}

async function saveRename(row: TaxonomyRow) {
  const label = renameForm.label.trim()
  if (!label) return

  await taxonomy.renameEntry(row.kind, row.id, label)
  toast.success('Taxonomy name updated')
  cancelRename()
}

function askDeprecate(row: TaxonomyRow) {
  confirmTarget.value = row
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
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Taxonomy reference data</span>
    </template>

    <div>
      <div class="page-head">
        <div>
          <h1>Taxonomy reference data</h1>
          <p>
            The activity taxonomy (B1-B9) that powers every entry form. Changes are versioned
            and never invalidate historical entries.
          </p>
        </div>
        <button class="btn btn-primary" @click="openAdd">
          <Icon name="plus" :size="15" />
          Add taxonomy item
        </button>
      </div>

      <div class="tabbar">
        <button :class="{ active: tab === 'items' }" @click="tab = 'items'">
          Categories &amp; items
        </button>
        <button :class="{ active: tab === 'other' }" @click="tab = 'other'">
          "Other" review queue
          <Badge v-if="taxonomy.pendingOtherEntries.length" tone="amber" style="margin-left:4px;">
            {{ taxonomy.pendingOtherEntries.length }}
          </Badge>
        </button>
      </div>

      <div v-if="tab === 'items'" class="card">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Label</th>
                <th>Level</th>
                <th>Status</th>
                <th>Version</th>
                <th>Used in entries</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.code"
                class="hoverable"
                :style="row.kind !== 'item' ? { background: 'var(--bg)' } : {}"
              >
                <td
                  class="mono"
                  :style="{ paddingLeft: row.kind === 'subcategory' ? '26px' : row.kind === 'item' ? '42px' : '14px' }"
                >
                  {{ row.code }}
                </td>
                <td>
                  <div v-if="renameForm.key === rowKey(row)" class="rename-row">
                    <input v-model="renameForm.label" type="text" />
                    <button class="btn btn-primary btn-sm" :disabled="taxonomy.loading" @click="saveRename(row)">
                      Save
                    </button>
                    <button class="btn btn-ghost btn-sm" @click="cancelRename">Cancel</button>
                  </div>
                  <template v-else>
                    <b v-if="row.kind === 'category'">{{ row.label }}</b>
                    <span v-else>{{ row.label }}</span>
                    <Badge v-if="row.note" tone="indigo" style="margin-left:6px;">{{ row.note }}</Badge>
                  </template>
                </td>
                <td style="text-transform:capitalize;color:var(--ink-500);">{{ row.kind }}</td>
                <td>
                  <Badge v-if="row.kind === 'item'" :tone="row.status === 'active' ? 'green' : 'gray'">
                    {{ row.status === 'active' ? 'Active' : 'Deprecated' }}
                  </Badge>
                </td>
                <td>{{ row.version }}</td>
                <td>{{ row.usedCount }}</td>
                <td>
                  <button
                    class="btn btn-secondary btn-sm"
                    :disabled="taxonomy.loading || renameForm.key === rowKey(row)"
                    @click="beginRename(row)"
                  >
                    Rename
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    :disabled="taxonomy.loading || row.status === 'deprecated'"
                    @click="askDeprecate(row)"
                  >
                    Deprecate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="taxonomy.loading && !rows.length" class="empty-row">Loading taxonomy...</div>
          <div v-else-if="!rows.length" class="empty-row">No taxonomy data found.</div>
        </div>
      </div>

      <div v-else class="card">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Free-text entry</th>
                <th>Suggested category</th>
                <th>Frequency</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in taxonomy.otherQueue" :key="entry.id" class="hoverable">
                <td>"{{ entry.text }}"</td>
                <td class="mono">{{ entry.suggestedCategory }}</td>
                <td><b>{{ entry.frequency }}</b> organisation{{ entry.frequency === 1 ? '' : 's' }}</td>
                <td>
                  <Badge v-if="entry.status === 'pending'" tone="amber">Pending review</Badge>
                  <Badge v-else-if="entry.status === 'promoted'" tone="green">Promoted</Badge>
                  <Badge v-else tone="gray">Dismissed</Badge>
                </td>
                <td>
                  <div v-if="entry.status === 'pending'" style="display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm" @click="openPromote(entry)">
                      Promote to taxonomy
                    </button>
                    <button class="btn btn-ghost btn-sm" @click="dismiss(entry)">Dismiss</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="taxonomy.loading && !taxonomy.otherQueue.length" class="empty-row">
            Loading review queue...
          </div>
          <div v-else-if="!taxonomy.otherQueue.length" class="empty-row">
            No review queue entries yet.
          </div>
        </div>
        <p style="font-size:12px;color:var(--ink-500);padding:14px 18px 18px;">
          Reviewed annually. Entries appearing frequently across multiple organisations are candidates
          for the standard taxonomy.
        </p>
      </div>

      <Teleport to="body">
        <div v-if="showAdd" class="modal-backdrop" @click.self="showAdd = false">
          <div class="modal-panel" style="max-width:480px;">
            <h3 style="font-size:16px;margin-bottom:14px;">Submit taxonomy item for review</h3>
            <div class="field">
              <label>Category</label>
              <select v-model="addForm.categoryCode">
                <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                  {{ c.code }} {{ c.label }}
                </option>
              </select>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Sub-category code</label>
                <input type="text" v-model="addForm.subcategoryCode" placeholder="e.g. B1.4" />
              </div>
              <div class="field">
                <label>Sub-category label (if new)</label>
                <input
                  type="text"
                  v-model="addForm.subcategoryLabel"
                  placeholder="Only needed if creating a new one"
                />
              </div>
            </div>
            <div class="field">
              <label>Item label</label>
              <input
                type="text"
                v-model="addForm.label"
                placeholder="e.g. Menstrual hygiene management sessions"
              />
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
              <button class="btn btn-secondary btn-sm" @click="showAdd = false">Cancel</button>
              <button class="btn btn-primary btn-sm" @click="submitAdd" :disabled="taxonomy.loading">
                {{ taxonomy.loading ? 'Submitting...' : 'Submit for review' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="promoteTarget" class="modal-backdrop" @click.self="promoteTarget = null">
          <div class="modal-panel" style="max-width:480px;">
            <h3 style="font-size:16px;margin-bottom:6px;">Promote to standard taxonomy</h3>
            <p style="font-size:12.5px;color:var(--ink-500);margin-bottom:14px;">
              "{{ promoteTarget.text }}" - reported by {{ promoteTarget.frequency }}
              organisation{{ promoteTarget.frequency === 1 ? '' : 's' }}.
            </p>
            <div class="field">
              <label>Category</label>
              <select v-model="promoteForm.categoryCode">
                <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                  {{ c.code }} {{ c.label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Sub-category code</label>
              <input type="text" v-model="promoteForm.subcategoryCode" />
            </div>
            <div class="field">
              <label>Sub-category label (if new)</label>
              <input type="text" v-model="promoteForm.subcategoryLabel" />
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
              <button class="btn btn-secondary btn-sm" @click="promoteTarget = null">Cancel</button>
              <button class="btn btn-primary btn-sm" @click="confirmPromote">Promote</button>
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
        @confirm="confirmToggle"
      />
    </div>
  </AppShell>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.page-head h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-head p {
  max-width: 760px;
  color: var(--ink-600);
  font-size: 16px;
  line-height: 1.55;
}

.tabbar {
  display: flex;
  gap: 22px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 22px;
}

.tabbar button {
  display: inline-flex;
  align-items: center;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--ink-600);
  font-size: 15px;
  font-weight: 700;
  padding: 12px 0 14px;
}

.tabbar button.active {
  border-bottom-color: var(--teal-800);
  color: var(--teal-800);
}

.tbl-wrap {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.tbl th {
  border-bottom: 1px solid var(--line);
  color: var(--ink-600);
  font-size: 12px;
  font-weight: 800;
  padding: 14px;
  text-transform: uppercase;
}

.tbl td {
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink-900);
  font-size: 14px;
  padding: 14px;
  vertical-align: middle;
}

.hoverable:hover {
  background: var(--teal-50) !important;
}

.empty-row {
  color: var(--ink-500);
  padding: 42px 18px;
  text-align: center;
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
  }
}
</style>
