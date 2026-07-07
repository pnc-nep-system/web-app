import type { RouteRecordRaw } from 'vue-router';

export const memberRoutes: RouteRecordRaw[] = [
  {
    path: '/member/programmes/new',
    name: 'NewProgramme',
    component: () => import('@/views/programme/NewProgrammeView.vue'),
    meta: {
      title: 'Create New Programme',
      requiresAuth: true
    }
  }
];
