<script setup lang="ts">
const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const educationLevels = [
  { id: 1, name: "Early Childhood" },
  { id: 2, name: "Primary" },
  { id: 3, name: "Secondary" },
  { id: 4, name: "TVET" },
  { id: 5, name: "Higher Education" }
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
  <div class="flex flex-wrap gap-4 mt-2">
    <label
      v-for="level in educationLevels"
      :key="level.id"
      class="inline-flex items-center gap-2 cursor-pointer group"
    >
      <div class="relative flex items-center justify-center">
        <input
          type="checkbox"
          :value="level.id"
          :checked="modelValue.includes(level.id)"
          @change="toggleLevel(level.id)"
          class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        />
        <svg
          class="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
        {{ level.name }}
      </span>
    </label>
  </div>
</template>
