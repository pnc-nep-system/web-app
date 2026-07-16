<script setup lang="ts">
import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
  <ToastHost />
</template>

<style scoped></style>

