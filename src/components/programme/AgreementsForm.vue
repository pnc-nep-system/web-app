<script setup lang="ts">
import { ref, watch } from 'vue'

export interface GovernmentAgreement {
  id?: number
  counterpart_agency: string
  nature: string
  status: string
  institution_name: string
}

const props = defineProps<{
  modelValue?: GovernmentAgreement[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: GovernmentAgreement[]): void
  (e: 'update:valid', isValid: boolean): void
}>()

const COUNTERPARTS = [
  { value: 'MoEYS national level', label: 'MoEYS — national level' },
  { value: 'Provincial Office of Education', label: 'Provincial Office of Education' },
  { value: 'District Office of Education', label: 'District Office of Education' },
  { value: 'Teacher Education Institution', label: 'Teacher Education Institution' },
  { value: 'specific school or cluster', label: 'Specific school or cluster of schools' },
  { value: 'other government ministry', label: 'Other government ministry or body' }
]

const NATURES = [
  { value: 'MoU', label: 'MoU' },
  { value: 'Letter of Understanding', label: 'LoU' },
  { value: 'official approval letter', label: 'Approval letter' },
  { value: 'informal working arrangement', label: 'Informal' }
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'under renewal', label: 'Renewal' },
  { value: 'under negotiation', label: 'Negotiating' }
]

const agreements = ref<GovernmentAgreement[]>([])

// Sync props to internal state
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      agreements.value = JSON.parse(JSON.stringify(val))
    }
  },
  { immediate: true, deep: true }
)

function addAgreement() {
  agreements.value.push({
    counterpart_agency: '',
    nature: 'MoU',
    status: 'active',
    institution_name: ''
  })
  emitUpdate()
}

function removeAgreement(index: number) {
  agreements.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update:modelValue', agreements.value)
  emit('update:valid', validate())
}

function validate(): boolean {
  // Each added agreement must have counterpart_agency and institution_name filled.
  return agreements.value.every(
    a => a.counterpart_agency.trim() !== '' && a.institution_name.trim() !== ''
  )
}

function getData() {
  return agreements.value
}

defineExpose({ validate, getData })
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6 space-y-6">
      <p class="text-sm text-gray-500 leading-relaxed">
        For each government counterpart, indicate the nature and status of the agreement. Leave empty if no government agreement or arrangement is in place.
      </p>

      <!-- Repeatable Rows List -->
      <div class="space-y-6">
        <div
          v-for="(agreement, index) in agreements"
          :key="index"
          class="space-y-4 pb-6 border-b border-dashed border-gray-200 last:border-0 last:pb-0"
        >
          <!-- Counterpart, Nature, Status Row -->
          <div class="flex flex-col md:flex-row gap-4 items-end">
            <!-- Counterpart Dropdown -->
            <div class="flex-1 min-w-[200px] w-full">
              <label :for="`counterpart-${index}`" class="block text-sm font-medium text-gray-700 mb-1.5">
                Counterpart
              </label>
              <select
                :id="`counterpart-${index}`"
                v-model="agreement.counterpart_agency"
                @change="emitUpdate"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white"
              >
                <option value="" disabled>Select counterpart</option>
                <option v-for="c in COUNTERPARTS" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
            </div>

            <!-- Nature Dropdown -->
            <div class="w-full md:w-48">
              <label :for="`nature-${index}`" class="block text-sm font-medium text-gray-700 mb-1.5">
                Nature
              </label>
              <select
                :id="`nature-${index}`"
                v-model="agreement.nature"
                @change="emitUpdate"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white"
              >
                <option v-for="n in NATURES" :key="n.value" :value="n.value">
                  {{ n.label }}
                </option>
              </select>
            </div>

            <!-- Status Dropdown & Remove Button side-by-side -->
            <div class="w-full md:w-56 flex items-end gap-3">
              <div class="flex-1">
                <label :for="`status-${index}`" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  :id="`status-${index}`"
                  v-model="agreement.status"
                  @change="emitUpdate"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white"
                >
                  <option v-for="s in STATUSES" :key="s.value" :value="s.value">
                    {{ s.label }}
                  </option>
                </select>
              </div>
              <button
                type="button"
                @click="removeAgreement(index)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mb-0.5 shrink-0"
                title="Remove agreement"
              >
                <span class="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">✕</span>
              </button>
            </div>
          </div>

          <!-- Institution Text Input -->
          <div>
            <label :for="`institution-${index}`" class="block text-sm font-medium text-gray-700 mb-1.5">
              Institution (optional detail)
            </label>
            <input
              :id="`institution-${index}`"
              type="text"
              v-model="agreement.institution_name"
              @input="emitUpdate"
              placeholder="e.g. Kampong Cham Provincial Office of Education"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <!-- Add Button -->
      <div class="pt-2">
        <button
          type="button"
          @click="addAgreement"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add agreement
        </button>
      </div>
    </div>
  </div>
</template>
