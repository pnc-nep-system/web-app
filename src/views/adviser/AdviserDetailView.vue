<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AdviserDetailCard from '@/components/adviser/AdviserDetailCard.vue'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.push('/adviser')
}
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <router-link to="/adviser" class="text-gray-500 hover:text-gray-700 transition">The Adviser</router-link>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Submission #{{ route.params.id }}</span>
    </template>

    <AdviserDetailCard
      :id="Number(route.params.id)"
      @back="goBack"
    />
  </AppShell>
</template>
