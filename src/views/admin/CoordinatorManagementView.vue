<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import UserManagementPanel from '@/components/user/UserManagementPanel.vue'
import { usePermission } from '@/composables/usePermission'
import { useUsersAdminStore } from '@/stores/usersAdmin'

const { can } = usePermission()
const router = useRouter()
const store = useUsersAdminStore()

onMounted(async () => {
  if (!can('users.view')) {
    router.replace({ name: 'forbidden' })
    return
  }

  // Pre-set the role filter to show only coordinators
  store.usersComposable.roleFilter = 'nep_coordinator'

  await Promise.all([
    store.usersComposable.fetchUsers(1),
    store.usersComposable.fetchOrganisations(),
    store.usersComposable.fetchRoles(),
  ])
})
</script>

<template>
  <AppShell>
    <!-- Breadcrumb -->
    <template #header>
      <HeaderBreadcrumb title="Coordinators" />
    </template>

    <UserManagementPanel />
  </AppShell>
</template>