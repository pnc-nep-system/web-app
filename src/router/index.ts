import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    // Adding placeholder routes for dashboards since they don't seem to exist in router yet.
    // They will be loaded here when implemented.
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/member/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/manager/dashboard',
      name: 'manager-dashboard',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    const role = localStorage.getItem('userRole')
    if (role === 'admin') next({ name: 'admin-dashboard' })
    else if (role === 'manager') next({ name: 'manager-dashboard' })
    else next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
