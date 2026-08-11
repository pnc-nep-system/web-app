import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
      meta: { requiresAuth: false },
    },

    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/member/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/admin/dashboard",
      name: "admin-dashboard",
      component: () => import("@/views/staff/DashboardView.vue"),
      meta: { requiresAuth: true, permission: "dashboard.view" },
    },
    {
      path: "/map",
      name: "map",
      component: () => import("@/views/staff/MapView.vue"),
      // Previously had no frontend gate at all — its API calls were already
      // staff-only, so a member_org user could load a broken page shell.
      meta: { requiresAuth: true, permission: "map.view" },
    },
    {
      path: "/admin/taxonomy",
      name: "admin-taxonomy",
      component: () => import("@/views/admin/TaxonomyManagement.vue"),
      meta: { requiresAuth: true, permission: "taxonomy.create" },
    },
    {
      path: "/policy",
      name: "policy",
      component: () => import("@/views/staff/PolicyView.vue"),
      meta: { requiresAuth: true, permission: "policy.view" },
    },
    {
      path: "/manager/dashboard",
      name: "manager-dashboard",
      component: () => import("@/views/staff/DashboardView.vue"),
      // Previously had no frontend gate — see /map comment above.
      meta: { requiresAuth: true, permission: "dashboard.view" },
    },
    {
      path: "/entries/new",
      name: "entry-new",
      component: () => import("@/views/programme/NewEntryView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/entries/:id",
      name: "entry-detail",
      component: () => import("@/views/EntryDetailView.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: () => import("@/views/admin/UserManagementView.vue"),
      meta: { requiresAuth: true, permission: "users.view" },
    },
    {
      path: "/admin/roles",
      name: "admin-roles",
      component: () => import("@/views/admin/RoleManagementView.vue"),
      meta: { requiresAuth: true, permission: "roles.view" },
    },
    {
      path: "/admin/permissions",
      name: "admin-permissions",
      component: () => import("@/views/admin/PermissionManagementView.vue"),
      meta: { requiresAuth: true, permission: "permissions.view" },
    },
    {
      path: "/admin/mail-test",
      name: "admin-mail-test",
      component: () => import("@/views/admin/MailTestView.vue"),
      meta: { requiresAuth: true, permission: "system.test-email" },
    },
    {
      path: "/admin/coordinators",
      name: "admin-coordinators",
      component: () => import("@/views/admin/CoordinatorManagementView.vue"),
      meta: { requiresAuth: true, permission: "users.view" },
    },
    {
      path: "/adviser",
      name: "adviser",
      component: () => import("@/views/adviser/AdviserListView.vue"),
      meta: { requiresAuth: true, permission: "advisory.manage" },
    },
    {
      path: "/adviser/new",
      name: "adviser-new",
      component: () => import("@/views/adviser/NewSubmissionView.vue"),
      meta: { requiresAuth: true, permission: "advisory.manage" },
    },
    {
      path: "/adviser/entry/:entryId",
      name: "adviser-entry-detail",
      component: () => import("@/views/adviser/AdvisoryNoteView.vue"),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: "/adviser/:id",
      name: "adviser-detail",
      component: () => import("@/views/adviser/AdviserDetailView.vue"),
      meta: { requiresAuth: true, permission: "advisory.manage" },
    },
    {
      path: "/admin/programmes",
      name: "admin-programmes",
      component: () => import("@/views/admin/AdminProgrammesView.vue"),
      // Matches the exact nep_admin+nep_coordinator set this console has
      // always been restricted to (dashboard.view isn't semantically perfect
      // for "programme oversight", but no module-specific permission existed
      // for it and this reproduces current access exactly without leaking to
      // member_org, who also holds programmes.view).
      meta: { requiresAuth: true, permission: "dashboard.view" },
    },
    {
      path: "/admin/organization",
      name: "admin-organization",
      component: () => import("@/views/admin/OrganizationManagementView.vue"),
      meta: { requiresAuth: true, permission: "organisations.create" },
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/views/errors/403.vue"),
    },
    {
      path: "/account",
      name: "organisation-profile",
      component: () => import("@/views/member/OrganisationProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/auth/ForgotPasswordView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("@/views/auth/ResetPasswordView.vue"),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }

  if (to.name === "login" && isAuthenticated) {
    if (authStore.userRole === "nep_admin") {
      return { name: "admin-dashboard" };
    } else if (authStore.userRole === "nep_coordinator") {
      return { name: "manager-dashboard" };
    } else {
      return { name: "dashboard" };
    }
  }

  if (isAuthenticated && !authStore.currentUser) {
    try {
      await authStore.fetchCurrentUser();
      useNotificationStore().init()
    } catch {
      authStore.clearAuthState(false);
      return { name: "login" };
    }
  }

  if (isAuthenticated) {
    // Dynamic, permission-driven route protection — `meta.permission` names
    // one or more permissions (ANY of them grants access), matching the
    // backend's `permission:` middleware semantics. This is a UX convenience;
    // the real authorization boundary is the backend.
    const required = to.meta.permission as string | string[] | undefined;
    const requiredList = Array.isArray(required) ? required : required ? [required] : [];
    if (requiredList.length && !authStore.hasAnyPermission(requiredList)) {
      return { name: "forbidden" };
    }
  }

  return true;
});

export default router;
