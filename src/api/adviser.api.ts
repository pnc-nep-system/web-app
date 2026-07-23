import api from './axios'
import type { PaginatedSubmissions, Submission } from '@/types/adviser'
import type { User } from '@/types/user'

export interface SubmissionCreateResponse {
    message: string
    data: Submission
}

export interface SubmissionListParams {
    analysis_scope?: string
    status?: string
    per_page?: number
    page?: number
}

export interface SubmissionPayload {
    submitting_party: string
    document_name: string
    analysis_scope: string
    analysis_scope_detail?: string | null
    assigned_to?: number | null
}

export interface CoordinatorListResponse {
    data: User[]
}

export const adviserApi = {
    /**
     * Fetch a paginated list of submissions.
     */
    list(params: SubmissionListParams = {}) {
        return api.get<PaginatedSubmissions>('/adviser/submissions', { params })
    },

    /**
     * Fetch all staff users (nep_coordinator, nep_admin) for assignment dropdown.
     */
    listStaffUsers() {
        return api.get<{ data: User[] } | User[]>('/adviser/staff-users')
    },

    /**
     * Fetch a single submission by ID.
     */
    getById(id: number) {
        return api.get<{ data: Submission } | Submission>(`/adviser/submissions/${id}`)
    },

    /**
     * Submit a new document for analysis.
     */
    submit(payload: SubmissionPayload, file?: File) {
        if (file) {
            const form = new FormData()
            if (payload.submitting_party) form.append('submitting_party', payload.submitting_party)
            if (payload.document_name) form.append('document_name', payload.document_name)
            if (payload.analysis_scope) form.append('analysis_scope', payload.analysis_scope)
            if (payload.analysis_scope_detail != null) form.append('analysis_scope_detail', payload.analysis_scope_detail)
            if (payload.assigned_to != null) form.append('assigned_to', String(payload.assigned_to))
            form.append('document', file)
            return api.post<SubmissionCreateResponse>('/adviser/submissions', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            })
        }
        return api.post<SubmissionCreateResponse>('/adviser/submissions', payload)
    },

    /**
     * Mark a submission's status as advice_delivered.
     */
    markDelivered(id: number) {
        return api.patch<{ data: Submission }>(`/adviser/submissions/${id}/deliver`)
    },

    /**
     * Update the coordinator assigned to a submission.
     */
    updateAssignee(id: number, userId: number | null) {
        return api.patch<{ data: Submission }>(`/adviser/submissions/${id}`, {
            assign_to_staff_user_id: userId,
        })
    },
}
