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
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin'] },
    },
    {
      path: '/admin/map',
      name: 'admin-map',
      component: () => import('@/views/MapView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['nep_admin', 'nep_coordinator'],
      },
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
      path: '/admin/coordinators',
      name: 'admin-coordinators',
      component: () => import('@/views/admin/CoordinatorManagementView.vue'),
      meta: { requiresAuth: true, roles: ['nep_admin'] },
    },
    {
      path: '/adviser',
      name: 'adviser',
      component: () => import('@/views/adviser/AdviserListView.vue'),
      meta: { requiresAuth: true, roles: ['nep_coordinator', 'nep_admin'] },
    },
    {
      path: '/adviser/new',
      name: 'adviser-new',
      component: () => import('@/views/adviser/NewSubmissionView.vue'),
      meta: { requiresAuth: true, roles: ['nep_coordinator', 'nep_admin'] },
    },
    {
      path: '/adviser/:id',
      name: 'adviser-detail',
      component: () => import('@/views/adviser/AdviserDetailView.vue'),
      meta: { requiresAuth: true, roles: ['nep_coordinator', 'nep_admin'] },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/403.vue'),
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

  if (to.name === 'login' && isAuthenticated) {
    return authStore.userRole === 'nep_admin' ? { name: 'admin-users' } : { name: 'dashboard' }
  }

  if (isAuthenticated && !authStore.currentUser) {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      authStore.clearAuthState(false)
      return { name: 'login' }
    }
  }

  if (isAuthenticated) {
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles?.length && !allowedRoles.includes(authStore.userRole)) {
      return { name: 'forbidden' }
    }
  }

  return true
})

export default router
