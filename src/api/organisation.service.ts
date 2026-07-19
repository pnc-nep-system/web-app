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

  // Add this based on the exact field returned by your backend
  logo_url: string | null

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

export type UpdateOrganisationPayload =
  Partial<CreateOrganisationPayload>

const BASE = '/admin/organisations'

export const organisationService = {
  getOrganisations(
    page = 1,
    search = '',
    filters: { status?: string; per_page?: number } = {},
  ) {
    return api.get<OrganisationListResponse>(BASE, {
      params: {
        page,
        search,
        ...filters,
      },
    })
  },

  getOrganisation(id: number) {
    return api.get<Organisation>(`${BASE}/${id}`)
  },

  createOrganisation(payload: CreateOrganisationPayload & { logoFile?: File | null }) {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('contact_name', payload.contact_name)
    formData.append('email', payload.email)
    formData.append('member_since', String(payload.member_since))
    if (payload.logoFile) formData.append('logo', payload.logoFile)
    return api.post<Organisation>(BASE, formData)
  },

  updateOrganisation(
    id: number,
    payload: UpdateOrganisationPayload,
  ) {
    return api.put<OrganisationActionResponse>(
      `${BASE}/${id}`,
      payload,
    )
  },

  uploadLogo(id: number, file: File) {
    const formData = new FormData()
    formData.append('logo', file)
    return api.post<OrganisationActionResponse>(
      `${BASE}/${id}/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  deactivateOrganisation(id: number) {
    return api.patch<OrganisationActionResponse>(
      `${BASE}/${id}/deactivate`,
    )
  },

  reactivateOrganisation(id: number) {
    return api.patch<OrganisationActionResponse>(
      `${BASE}/${id}/activate`,
    )
  },
}