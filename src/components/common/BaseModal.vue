<script setup lang="ts">
defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
