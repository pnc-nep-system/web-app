import api from '../api/axios'
import type { GroupedPermissions, Permission, CreatePermissionPayload, UpdatePermissionPayload } from '@/types/role'

const BASE = '/admin/permissions'

export const permissionService = {
  /** Returns permissions grouped by module, e.g. { Users: [...], Roles: [...] } */
  getPermissions(search = '') {
    return api.get<GroupedPermissions>(BASE, { params: { search: search || undefined } })
  },

  createPermission(payload: CreatePermissionPayload) {
    return api.post<Permission>(BASE, payload)
  },

  updatePermission(id: number, payload: UpdatePermissionPayload) {
    return api.patch<Permission>(`${BASE}/${id}`, payload)
  },

  deletePermission(id: number) {
    return api.delete<{ message: string }>(`${BASE}/${id}`)
  },
}
