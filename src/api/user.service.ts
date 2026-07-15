import api from './axios'
import type { User, UserListResponse, CreateUserPayload, UpdateUserPayload } from '@/types/user'

export interface OrganisationOption {
  id: number
  name: string
}

/**
 * HTTP service for the /users and /organisations resources.
 */
export const userService = {
  /** Fetch the paginated list of system users. */
  getUsers(page = 1, search = '') {
    return api.get<UserListResponse>('/users', {
      params: { page, search },
    })
  },

  /** Get details of a specific user. */
  getUser(id: number) {
    return api.get<User>(`/users/${id}`)
  },

  /** Create a new user account. */
  createUser(payload: CreateUserPayload) {
    return api.post<User>('/users', payload)
  },

  /** Update an existing user's profile (name, email, role, organisation). */
  updateUser(id: number, payload: UpdateUserPayload) {
    return api.put<User>(`/users/${id}`, payload)
  },

  /** Deactivate a user account. */
  deactivateUser(id: number) {
    return api.patch<{ message: string; data: User }>(`/users/${id}/deactivate`)
  },

  /** Fetch available organisations for selection. */
  getOrganisations() {
    return api.get<{ data: OrganisationOption[] }>('/organisations')
  },
}

