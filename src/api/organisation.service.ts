import api from './axios'

export interface Organisation {
  id: number
  name: string
  contact_name: string
  email: string
  member_since: number
  status: 'active' | 'inactive'
  last_inactive_at: string | null
  users_count: number
  created_at: string
  updated_at: string
}

export interface OrganisationListResponse {
  data: Organisation[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface OrganisationActionResponse {
  message: string
  organisation: Organisation
}

export interface CreateOrganisationPayload {
  name: string
  contact_name: string
  email: string
  member_since: number
}

export type UpdateOrganisationPayload = Partial<CreateOrganisationPayload>

const BASE = '/admin/organisations'

export const organisationService = {
  getOrganisations(page = 1, search = '', filters: { status?: string; per_page?: number } = {}) {
    return api.get<OrganisationListResponse>(BASE, { params: { page, search, ...filters } })
  },

  getOrganisation(id: number) {
    return api.get<Organisation>(`${BASE}/${id}`)
  },

  createOrganisation(payload: CreateOrganisationPayload) {
    return api.post<OrganisationActionResponse>(BASE, payload)
  },

  updateOrganisation(id: number, payload: UpdateOrganisationPayload) {
    return api.patch<OrganisationActionResponse>(`${BASE}/${id}`, payload)
  },

  deactivateOrganisation(id: number) {
    return api.post<OrganisationActionResponse>(`${BASE}/${id}/deactivate`)
  },

  reactivateOrganisation(id: number) {
    return api.post<OrganisationActionResponse>(`${BASE}/${id}/reactivate`)
  },
}
