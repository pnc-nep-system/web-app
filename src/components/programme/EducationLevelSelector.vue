<script setup lang="ts">
const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const educationLevels = [
  { id: 1, name: "Pre-primary / ECCD" },
  { id: 2, name: "Primary" },
  { id: 3, name: "Lower secondary" },
  { id: 4, name: "Upper secondary" },
  { id: 5, name: "Higher education" }
];

const toggleLevel = (id: number) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(id);
  
  if (index === -1) {
    newValue.push(id);
  } else {
    newValue.splice(index, 1);
  }
  
  emit('update:modelValue', newValue);
};
</script>

<template>
  <div class="flex flex-wrap gap-2 mt-2">
    <label
      v-for="level in educationLevels"
      :key="level.id"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all duration-200 text-xs font-medium"
      :class="modelValue.includes(level.id)
        ? 'border-teal-700 bg-teal-50/20 text-teal-900 shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
    >
      <input
        type="checkbox"
        :value="level.id"
        :checked="modelValue.includes(level.id)"
        @change="toggleLevel(level.id)"
        class="sr-only"
      />
      <!-- Custom Checkbox -->
      <div
        class="h-3.5 w-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
        :class="modelValue.includes(level.id)
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-slate-300 bg-white'"
      >
        <svg v-if="modelValue.includes(level.id)" class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span>
        {{ level.name }}
      </span>
    </label>
  </div>
</template>
