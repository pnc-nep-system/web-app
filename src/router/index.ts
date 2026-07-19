import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false },
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/member/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/map/MapView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin', 'nep_coordinator'] },
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin'] },
    },
    {
      path: '/admin/taxonomy',
      name: 'admin-taxonomy',
      component: () => import('@/views/staff/TaxonomyAdminView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin'] },
    },
    {
      path: '/manager/dashboard',
      name: 'manager-dashboard',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/entries/new',
      name: 'entry-new',
      component: () => import('@/views/programme/NewEntryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/UserManagementView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin'] },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/403.vue'),
    },
    {
      path: '/entries/:id',
      name: 'entry-detail',
      component: () => import('@/views/programme/EntryDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/account',
      name: 'organisation-profile',
      component: () => import('@/views/member/OrganisationProfileView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (isAuthenticated) {
    if (!authStore.currentUser) {
      try {
        await authStore.fetchCurrentUser()
      } catch (err) {
        console.error('Error fetching user profile in router guard:', err)
        authStore.clearAuthState(false)
        return { name: 'login' }
      }
    }

    // Role-based authorization check
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles?.length && !allowedRoles.includes(authStore.userRole)) {
      return { name: 'forbidden' }
    }
  }

  if (to.name === 'login' && isAuthenticated) {
    if (authStore.userRole === 'nep_admin') {
      return { name: 'admin-users' }
    }
    return { name: 'dashboard' }
  } else if ((to.path === '/dashboard' || to.name === 'dashboard') && isAuthenticated) {
    if (authStore.userRole === 'nep_admin') {
      return { name: 'admin-users' }
    }
  }

  return true
})

export default router

