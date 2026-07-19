<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseIcon from '@/components/common/BaseIcon.vue'


const auth = useAuthStore()
const isSidebarOpen = ref(false)
const isCoordinationOpen = ref(true)

interface NavItem {
  to: string
  label: string
  icon: string
  badge?: number
}

interface NavSection {
  section: string
  items: NavItem[]
}

const navItems = computed<(NavItem | NavSection)[]>(() => {
  if (auth.userRole === 'nep_admin') {
    return [
      {
        section: 'COORDINATION',
        items: [
          // { to: '/admin/dashboard', label: 'Overview', icon: 'home' },
          { to: '/admin/map', label: 'The Map', icon: 'map' },
          // { to: '/adviser', label: 'The Adviser', icon: 'bolt', badge: 3 },
        ],
      },
      {
        section: 'ADMINISTRATION',
        items: [
          { to: '/admin/taxonomy', label: 'Taxonomy data', icon: 'list' },
          { to: '/admin/users', label: 'User accounts', icon: 'users' },
          { to: '/policy', label: 'Policy library', icon: 'book' },
        ],
      },
    ]
  }

  if (auth.userRole === 'nep_coordinator') {
    return [
      {
        section: 'COORDINATION',
        items: [
          { to: '/manager/dashboard', label: 'Overview', icon: 'home' },
          { to: '/admin/map', label: 'The Map', icon: 'map' },
          { to: '/adviser', label: 'The Adviser', icon: 'bolt', badge: 3 },
        ],
      },
      {
        section: 'REFERENCE',
        items: [
          { to: '/policy', label: 'Policy library', icon: 'book' },
        ],
      },
    ]
  }

  return [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/account', label: 'Organisation Profile', icon: 'building' },
  ]
})

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
  <div class="flex min-h-screen flex-col lg:flex-row">
    <!-- Mobile Top Bar Header -->
    <div
      class="lg:hidden flex items-center justify-between bg-teal-900 text-white px-5 py-3.5 sticky top-0 z-20 border-b border-white/10 shrink-0">
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center font-bold text-xs">
          NEP
        </div>
        <div class="leading-none">
          <b class="font-lexend text-sm font-semibold block text-white">{{ portalTitle }}</b>
          <span class="text-[9px] text-white/55">Portal</span>
        </div>
      </div>
      <button type="button" @click="isSidebarOpen = !isSidebarOpen"
        class="text-white hover:text-white/80 transition-colors p-1" aria-label="Toggle navigation menu">
        <BaseIcon :name="isSidebarOpen ? 'x' : 'list'" size="22" />
      </button>
    </div>

    <!-- Backdrop Overlay for Mobile Drawer -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-xs transition-opacity duration-300"></div>

    <!-- Sidebar -->
    <aside :class="[
      'bg-teal-900 text-white flex flex-col shrink-0 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex',
      isSidebarOpen ? 'translate-x-0 fixed inset-y-0 left-0 w-64' : '-translate-x-full fixed inset-y-0 left-0 w-64 lg:relative lg:translate-x-0'
    ]">
      <div class="flex items-center gap-2.5 p-5 border-b border-white/10 shrink-0">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center font-bold text-xs">
          NEP
        </div>
        <div class="leading-none">
          <b class="font-lexend text-sm font-semibold block">{{ portalTitle }}</b>
          <span class="text-[10px] text-white/55">Portal</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-3.5 space-y-0.5">
        <template v-if="auth.userRole === 'nep_coordinator' || auth.userRole === 'nep_admin'">
          <div v-for="(section, sIndex) in navItems" :key="sIndex" class="mb-3">
            <template v-if="'section' in section">
              <button
                type="button"
                @click="isCoordinationOpen = !isCoordinationOpen"
                class="flex items-center justify-between w-full text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-1.5 font-semibold hover:text-white/60 transition-colors"
              >
                <span>{{ section.section }}</span>
                <BaseIcon
                  name="chevronDown"
                  size="12"
                  :class="['transition-transform duration-200', isCoordinationOpen ? 'rotate-180' : '']"
                />
              </button>
              <template v-if="isCoordinationOpen || section.section !== 'COORDINATION'">
                <RouterLink
                  v-for="item in section.items"
                  :key="item.to"
                  :to="item.to"
                  @click="isSidebarOpen = false"
                  class="flex items-center gap-2.5 p-2 rounded-lg text-white/78 text-sm font-medium hover:bg-white/7 hover:text-white transition-colors"
                  active-class="bg-white/14 text-white"
                >
                  <BaseIcon :name="item.icon" />
                  <span class="flex-1">{{ item.label }}</span>
                  <span
                    v-if="item.badge"
                    class="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  >
                    {{ item.badge }}
                  </span>
                </RouterLink>
              </template>
            </template>
          </div>
        </template>

        <template v-else>
          <div class="text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-1.5 font-semibold">
            WORKSPACE
          </div>
          <RouterLink
            v-for="item in navItems as NavItem[]"
            :key="item.to"
            :to="item.to"
            @click="isSidebarOpen = false"
            class="flex items-center gap-2.5 p-2 rounded-lg text-white/78 text-sm font-medium hover:bg-white/7 hover:text-white transition-colors"
            active-class="bg-white/14 text-white"
          >
            <BaseIcon :name="item.icon" />
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <div class="p-4 border-t border-white/10 flex items-center gap-3 shrink-0 select-none">
        <div
          class="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {{ displayName.slice(0, 2).toUpperCase() }}
        </div>
        <div class="overflow-hidden leading-tight flex-grow">
          <b class="text-xs block truncate w-24 text-white font-semibold">{{ displayName }}</b>
          <span class="text-[10px] text-white/50 block mt-0.5">{{ roleLabel }}</span>
        </div>
        <button @click="logout"
          class="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          style="min-width: 36px; min-height: 36px;" title="Log out">
          <BaseIcon name="logout" size="18" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0 flex flex-col">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-14 lg:top-0 z-10">
        <div class="flex items-center gap-1 text-sm text-gray-500 w-full">
          <slot name="header" />
        </div>
      </header>

      <div class="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1">
        <slot />
      </div>
    </main>
  </div>
</template>