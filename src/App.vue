<script setup lang="ts">
import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <KeepAlive>
    <RouterView />
  </KeepAlive>
  <ToastHost />
</template>

<style scoped></style>

