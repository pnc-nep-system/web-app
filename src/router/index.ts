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
      component: () => import('@/views/member/NewEntryView.vue'),
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
  ],
})

<<<<<<< HEAD
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken')
  const authStore = useAuthStore()
=======
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
>>>>>>> 0baea147829107158aa36361503425506349bd87

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (isAuthenticated) {
    if (!authStore.currentUser) {
      try {
        await authStore.fetchCurrentUser()
      } catch (err) {
        console.error('Error fetching user profile in router guard:', err)
        authStore.logout()
        return { name: 'login' }
      }
    }

<<<<<<< HEAD
    // Role-based authorization check
    if (to.meta.roles) {
      const allowedRoles = to.meta.roles as string[]
      const userRole = (authStore.currentUser as any)?.role || localStorage.getItem('userRole')
      if (!allowedRoles.includes(userRole)) {
        next({ name: 'forbidden' })
        return
      }
=======
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles?.length && !allowedRoles.includes(authStore.userRole)) {
      return { name: 'dashboard' }
>>>>>>> 0baea147829107158aa36361503425506349bd87
    }
  }

  if (to.name === 'login' && isAuthenticated) {
<<<<<<< HEAD
    const userRole = localStorage.getItem('userRole') || (authStore.currentUser as any)?.role
    if (userRole === 'nep_admin') {
      next({ name: 'admin-users' })
    } else {
      next({ name: 'dashboard' })
    }
  } else if ((to.path === '/dashboard' || to.name === 'dashboard') && isAuthenticated) {
    const userRole = localStorage.getItem('userRole') || (authStore.currentUser as any)?.role
    if (userRole === 'nep_admin') {
      next({ name: 'admin-users' })
    } else {
      next()
    }
  } else {
    next()
=======
    // All roles use the same dashboard; title changes based on role
    return { name: 'dashboard' }
>>>>>>> 0baea147829107158aa36361503425506349bd87
  }

  return true
})

export default router