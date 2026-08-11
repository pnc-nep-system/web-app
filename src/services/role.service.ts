import api from '../api/axios'
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types/role'

const BASE = '/admin/roles'

export const roleService = {
  getRoles(search = '') {
    return api.get<Role[]>(BASE, { params: { search: search || undefined } })
  },

  getRole(id: number) {
    return api.get<Role>(`${BASE}/${id}`)
  },

  createRole(payload: CreateRolePayload) {
    return api.post<Role>(BASE, payload)
  },

  updateRole(id: number, payload: UpdateRolePayload) {
    return api.patch<Role>(`${BASE}/${id}`, payload)
  },

  deleteRole(id: number) {
    return api.delete<{ message: string }>(`${BASE}/${id}`)
  },

  assignToUser(roleId: number, userId: number) {
    return api.post<{ message: string }>(`${BASE}/${roleId}/users/${userId}`)
  },

  removeFromUser(roleId: number, userId: number) {
    return api.delete<{ message: string }>(`${BASE}/${roleId}/users/${userId}`)
  },
}
