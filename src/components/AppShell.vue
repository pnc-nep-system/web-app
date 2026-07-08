<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseIcon from '@/components/common/BaseIcon.vue'

const auth = useAuthStore()

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/account', label: 'Organisation profile', icon: 'building' },
]

// Derive a human-friendly title from the stored role
const portalTitle = computed(() => {
  const role = auth.userRole
  if (role === 'nep_admin') return 'NEP Admin'
  if (role === 'nep_coordinator') return 'NEP Coordinator'
  return 'NEP Member'
})

// Capitalise the role label shown under the username
const roleLabel = computed(() => {
  const role = auth.userRole
  if (role === 'nep_admin') return 'Admin'
  if (role === 'nep_coordinator') return 'Coordinator'
  if (role === 'member_org') return 'Member'
  return role?.charAt(0).toUpperCase() + role?.slice(1) || ''
})

// Display name from the logged-in user object, fallback to role label
const displayName = computed(() => {
  const user = auth.currentUser as Record<string, unknown> | null
  return (user?.name as string) || roleLabel.value
})

function logout() {
  auth.logout()
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-teal-900 text-white flex flex-col sticky top-0 h-screen shrink-0">
      <div class="flex items-center gap-2.5 p-5 border-b border-white/10">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center font-bold text-xs"
        >
          NEP
        </div>
        <div class="leading-none">
          <b class="font-lexend text-sm font-semibold block">{{ portalTitle }}</b>
          <span class="text-[10px] text-white/55">Portal</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-3.5 space-y-0.5">
        <div class="text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-1.5">
          WORKSPACE
        </div>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 p-2 rounded-lg text-white/78 text-sm font-medium hover:bg-white/7 hover:text-white"
          active-class="bg-white/14 text-white"
        >
          <BaseIcon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-white/10 flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold shrink-0"
        >
          {{ displayName.slice(0, 2).toUpperCase() }}
        </div>
        <div class="overflow-hidden leading-tight">
          <b class="text-xs block truncate w-24">{{ displayName }}</b>
          <span class="text-[10px] text-white/50">{{ roleLabel }}</span>
        </div>
        <button @click="logout" class="ml-auto text-white/50 hover:text-white">
          <BaseIcon name="logout" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0 flex flex-col">
      <header
        class="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-10"
      >
        <div class="flex items-center gap-1 text-sm text-gray-500 w-full">
          <slot name="header" />
        </div>
      </header>

      <div class="p-8 max-w-6xl w-full mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
