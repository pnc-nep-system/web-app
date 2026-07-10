<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
  }>(),
  {
    modelValue: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const keyword1 = ref('')
const keyword2 = ref('')
const keyword3 = ref('')
const keyword4 = ref('')
const keyword5 = ref('')

onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    keyword1.value = props.modelValue[0] || ''
    keyword2.value = props.modelValue[1] || ''
    keyword3.value = props.modelValue[2] || ''
    keyword4.value = props.modelValue[3] || ''
    keyword5.value = props.modelValue[4] || ''
  }
})

watch([keyword1, keyword2, keyword3, keyword4, keyword5], () => {
  const newKeywords = [
    keyword1.value.trim(),
    keyword2.value.trim(),
    keyword3.value.trim(),
    keyword4.value.trim(),
    keyword5.value.trim()
  ].filter(k => k !== '')
  
  emit('update:modelValue', newKeywords)
})

watch(() => props.modelValue, (newVal) => {
  const currentLocal = [
    keyword1.value.trim(),
    keyword2.value.trim(),
    keyword3.value.trim(),
    keyword4.value.trim(),
    keyword5.value.trim()
  ].filter(k => k !== '')
  
  if (JSON.stringify(newVal) !== JSON.stringify(currentLocal)) {
    keyword1.value = newVal[0] || ''
    keyword2.value = newVal[1] || ''
    keyword3.value = newVal[2] || ''
    keyword4.value = newVal[3] || ''
    keyword5.value = newVal[4] || ''
  }
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6">
      <div class="mb-6">
        <p class="text-sm text-gray-500">
          Enter up to 5 keywords describing what is distinctive about this programme. Examples: system strengthening, locally led, research-based, handover model, inclusion-focused, community-driven, digital learning, gender transformative, evidence-based, language minority, rural remote.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        <div>
          <label for="keyword1" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 1
          </label>
          <input
            id="keyword1"
            v-model="keyword1"
            type="text"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword2" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 2
          </label>
          <input
            id="keyword2"
            v-model="keyword2"
            type="text"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword3" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 3
          </label>
          <input
            id="keyword3"
            v-model="keyword3"
            type="text"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword4" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 4
          </label>
          <input
            id="keyword4"
            v-model="keyword4"
            type="text"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword5" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 5
          </label>
          <input
            id="keyword5"
            v-model="keyword5"
            type="text"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
