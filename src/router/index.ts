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
      meta: { requiresAuth: true },
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
  ],
})

router.beforeEach(async (to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken')

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
    return
  }

  if (isAuthenticated) {
    const authStore = useAuthStore()
    if (!authStore.currentUser) {
      try {
        await authStore.fetchCurrentUser()
      } catch (err) {
        console.error('Error fetching user profile in router guard:', err)
        authStore.logout()
        next({ name: 'login' })
        return
      }
    }
  }

  if (to.name === 'login' && isAuthenticated) {
    // All roles use the same dashboard; title changes based on role
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
