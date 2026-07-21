import api from './axios'

export interface PolicyDocument {
  id: number
  title: string
  authority: string
  version: string
  date: string
  status: 'active' | 'superseded' | 'inactive'
  file_url?: string | null
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface PolicyDocumentPayload {
  title: string
  authority: string
  version: string
  date: string
  status?: 'active' | 'superseded' | 'inactive'
  file_url?: string | null
}

export const policyApi = {
  /**
   * Fetch all policy documents from backend.
   */
  getPolicies() {
    return api.get<{ data: PolicyDocument[] } | PolicyDocument[]>('/policy-documents')
  },

  /**
   * Create a new policy document.
   */
  createPolicy(payload: PolicyDocumentPayload) {
    return api.post<{ message: string; data: PolicyDocument }>('/policy-documents', payload)
  },

  /**
   * Update a policy document.
   */
  updatePolicy(id: number, payload: Partial<PolicyDocumentPayload>) {
    return api.patch<{ message: string; data: PolicyDocument }>(`/policy-documents/${id}`, payload)
  },

  /**
   * Delete a policy document.
   */
  deletePolicy(id: number) {
    return api.delete<{ message: string }>(`/policy-documents/${id}`)
  },
}
