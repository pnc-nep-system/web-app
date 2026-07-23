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
     * Fetch all users with role nep_coordinator for the assignment dropdown.
     */
    getCoordinators() {
        return api.get<{ data: User[] } | User[]>('/adviser/coordinators')
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
            Object.entries(payload).forEach(([k, v]) => {
                if (v !== null && v !== undefined) form.append(k, String(v))
            })
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

    /**
     * Generate an AI advisory note for a submission.
     */
    generateAdvisoryNote(id: number, programmeProfile: object) {
        return api.post(`/adviser/submissions/${id}/generate-advisory-note`, {
            programme_profile: programmeProfile,
        }, { timeout: 60000 })
    },

    /**
     * Create a programme entry draft from AI-extracted profile data.
     */
    createProgrammeEntry(id: number, payload: object) {
        return api.post<{ message: string; data: { id: number } }>(
            `/adviser/submissions/${id}/create-programme-entry`,
            payload
        )
    },
}
