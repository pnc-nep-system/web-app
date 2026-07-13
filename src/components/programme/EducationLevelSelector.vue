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
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer select-none transition-colors"
      :class="modelValue.includes(level.id) ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 bg-white hover:bg-gray-50'"
    >
      <input
        type="checkbox"
        :value="level.id"
        :checked="modelValue.includes(level.id)"
        @change="toggleLevel(level.id)"
        class="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 cursor-pointer"
      />
      <span class="text-xs font-semibold text-gray-700">
        {{ level.name }}
      </span>
    </label>
  </div>
</template>
