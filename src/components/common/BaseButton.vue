<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | danger-ghost
  size: { type: String, default: 'md' }, // md | sm
  disabled: { type: Boolean, default: false }
})
</script>

<template>
  <button 
    class="btn" 
    :class="[`btn-${variant}`, size === 'sm' ? 'btn-sm' : '']"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
