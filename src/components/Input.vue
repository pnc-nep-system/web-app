<script setup>
defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  error: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :class="{ 'has-error': error }"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
