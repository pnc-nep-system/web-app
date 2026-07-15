<script setup lang="ts">
defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-panel">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 25, 22, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  padding: 20px;
}
.modal-panel {
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(10, 45, 41, 0.18),
    0 2px 8px rgba(10, 45, 41, 0.08);
  width: 100%;
  max-width: 460px;
  padding: 26px;
}

/* ── Transition ── */
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active .modal-panel {
  transition: transform 0.15s ease;
}
.modal-enter-from .modal-panel {
  transform: translateY(12px) scale(0.97);
}
.modal-leave-to .modal-panel {
  transform: translateY(6px) scale(0.99);
}
</style>
