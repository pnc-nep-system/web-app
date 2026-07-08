// TODO: Scaffolded for a centralised role registry. Populate when:
//   - guards.ts needs to compare roles without string literals
//   - usePermission.ts uses ROLE_HIERARCHY for isAtLeast() logic
//   - any component needs to enumerate available roles dynamically
//
// Planned shape:
//
//   export const ROLES = {
//     ADMIN: 'admin',
//     COORDINATOR: 'coordinator',
//     MEMBER: 'member',
//   } as const
//
//   export type Role = (typeof ROLES)[keyof typeof ROLES]
//
//   /** Higher index = higher privilege */
//   export const ROLE_HIERARCHY: Role[] = [ROLES.MEMBER, ROLES.COORDINATOR, ROLES.ADMIN]
//
//   export function isAtLeast(userRole: Role, minRole: Role): boolean {
//     return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)
//   }
export {}
