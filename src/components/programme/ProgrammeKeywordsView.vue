<script setup lang="ts">
import { computed } from 'vue'
import TagInput from '@/components/layout/TagInput.vue'

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

const keywords = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue),
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6">
      <div class="max-w-2xl">
        <!-- Section Header -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-1.5 select-none">Keywords & tags</h2>
          <p class="text-sm text-gray-500">
            Define descriptive tags to help others find and categorise this programme. Add up to 5
            keywords that describe the focus area, activities, or target outcomes.
          </p>
        </div>

        <!-- TagInput component -->
        <TagInput
          v-model="keywords"
          label="Programme keywords"
          placeholder="e.g. nutrition, education, capacity-building, advocacy"
          hint="Press Enter or type a comma (,) to save a keyword. You can add up to 5 keywords."
          :max-tags="5"
        />
      </div>
    </div>
  </div>
</template>
