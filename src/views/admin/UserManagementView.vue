<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import UserManagementPanel from '@/components/user/UserManagementPanel.vue'
import { usePermission } from '@/composables/usePermission'
import { useUsersAdminStore } from '@/stores/usersAdmin'

const { isAdmin } = usePermission()
const router = useRouter()
const store = useUsersAdminStore()

onMounted(async () => {
  if (!isAdmin.value) {
    router.replace({ name: 'forbidden' })
    return
  }
  await Promise.all([
    store.usersComposable.fetchUsers(1),
    store.usersComposable.fetchOrganisations(),
  ])
})
</script>

<template>
  <AppShell>
    <!-- Breadcrumb -->
    <template #header>
      <span class="text-gray-400">Admin</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">User Management</span>
    </template>

    <UserManagementPanel />
  </AppShell>
</template>
