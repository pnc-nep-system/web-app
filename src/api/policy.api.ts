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
  file?: File | null
}

/** Build a FormData object from a payload, including an optional File. */
function buildFormData(payload: Omit<PolicyDocumentPayload, 'file'>, file?: File | null): FormData {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('authority', payload.authority)
  fd.append('version', payload.version)
  fd.append('date', payload.date)
  if (payload.status) fd.append('status', payload.status)
  if (file) fd.append('file', file)
  return fd
}

export const policyApi = {
  /**
   * Fetch all policy documents from backend.
   */
  getPolicies() {
    return api.get<{ data: PolicyDocument[] } | PolicyDocument[]>('/policy-documents')
  },

  /**
   * Create a new policy document (with optional file upload).
   */
  createPolicy(payload: PolicyDocumentPayload) {
    const fd = buildFormData(payload, payload.file)
    return api.post<{ message: string; data: PolicyDocument }>('/policy-documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Update a policy document (with optional file upload).
   * Uses POST with _method=PATCH so multipart/form-data works with Laravel.
   */
  updatePolicy(id: number, payload: Partial<PolicyDocumentPayload>) {
    const fd = buildFormData(
      { title: payload.title ?? '', authority: payload.authority ?? '', version: payload.version ?? '', date: payload.date ?? '', status: payload.status },
      payload.file
    )
    fd.append('_method', 'PATCH')
    return api.post<{ message: string; data: PolicyDocument }>(`/policy-documents/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Delete a policy document.
   */
  deletePolicy(id: number) {
    return api.delete<{ message: string }>(`/policy-documents/${id}`)
  },
}
