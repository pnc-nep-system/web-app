<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AdviserDetailCard from '@/components/adviser/AdviserDetailCard.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.push('/adviser')
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', `Submission #${route.params.id}`]" />
    </template>

    <AdviserDetailCard
      :id="Number(route.params.id)"
      @back="goBack"
    />
  </AppShell>
</template>
