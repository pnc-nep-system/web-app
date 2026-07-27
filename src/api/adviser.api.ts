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
    coordinator_id?: number | null
    programme_entry_id?: number | null
}

export interface CoordinatorListResponse {
    data: User[]
}

const programmeEntryNotePromises = new Map<number, Promise<any>>()

export const adviserApi = {
    /**
     * Fetch a paginated list of submissions.
     */
    list(params: SubmissionListParams = {}) {
        return api.get<PaginatedSubmissions>('/adviser/submissions', { params })
    },

    /**
     * Fetch all active coordinators for the assignment dropdown.
     */
    listCoordinators() {
        return api.get<CoordinatorListResponse>('/adviser/coordinators')
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
     * Save advisory note sections A, B, C, D.
     */
    _updateSectionsPromises: new Map<number, Promise<any>>(),
    updateSections(id: number, payload: {
        section_profile?: string
        section_gaps?: string
        section_coordinators_notes?: string
        recommendations?: { organisation_name: string | null; type: string; relational: string; programme_entry_id: number | null }[]
    }) {
        if (this._updateSectionsPromises.has(id)) return this._updateSectionsPromises.get(id)!
        const p = api.patch<{ data: Submission }>(`/adviser/submissions/${id}`, payload)
            .finally(() => this._updateSectionsPromises.delete(id))
        this._updateSectionsPromises.set(id, p)
        return p
    },

    /**
     * Mark a submission's status as advice_delivered.
     */
    _deliverPromises: new Map<number, Promise<any>>(),
    markDelivered(id: number) {
        if (this._deliverPromises.has(id)) return this._deliverPromises.get(id)!
        const p = api.patch<{ data: Submission }>(`/adviser/submissions/${id}/deliver`)
            .finally(() => this._deliverPromises.delete(id))
        this._deliverPromises.set(id, p)
        return p
    },

    /**
     * Update the coordinator assigned to a submission.
     */
    updateAssignee(id: number, userId: number | null) {
        return api.patch<{ data: Submission }>(`/adviser/submissions/${id}`, {
            coordinator_id: userId,
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

    /**
     * Query map entries for overlaps based on programme profile & analysis scope.
     */
    queryOverlap(programmeProfile: object, analysisScope: string = 'full map') {
        return api.post<{ data: any[] }>('/adviser/map/overlap-query', {
            analysis_scope: analysisScope,
            programme_profile: programmeProfile,
        })
    },

    /**
     * Get the advisory note linked to a programme entry.
     * Returns 404 if no advisory note exists for the entry.
     */
    getByProgrammeEntry(programmeEntryId: number) {
        if (programmeEntryNotePromises.has(programmeEntryId)) {
            return programmeEntryNotePromises.get(programmeEntryId)!
        }
        const promise = api.get<{ data: Submission }>(`/adviser/programme-entries/${programmeEntryId}/advisory-note`)
            .finally(() => programmeEntryNotePromises.delete(programmeEntryId))
        programmeEntryNotePromises.set(programmeEntryId, promise)
        return promise
    },

    /**
     * Request a short-lived download token for the uploaded final note file.
     * Then open: /api/adviser/submissions/{id}/file?token=xxx
     */
    async openFinalNoteFile(id: number) {
        const res = await api.post<{ token: string }>(`/adviser/submissions/${id}/file-token`)
        const token = res.data.token
        const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') ?? ''
        window.open(`${baseUrl}/adviser/submissions/${id}/file?token=${token}`, '_blank')
    },
}
