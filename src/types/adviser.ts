export type AnalysisScope = 'full map' | 'geographic subset' | 'thematic subset'
export type SubmissionStatus = 'pending' | 'submitted_for_review' | 'advice_delivered'

export interface Submission {
    id: number
    programme_entry_id?: number | null
    assign_to_staff_user_id: number | null
    submitting_party: string
    document_name: string
    analysis_scope: string
    analysis_scope_detail: string | null
    status: SubmissionStatus
    section_profile: string | null
    section_gaps: string | null
    section_coordinators_notes: string | null
    final_note_file: string | null
    submitted_at: string
    delivered_at: string | null
    created_at: string
    updated_at: string
}

export interface PaginationLink {
    url: string | null
    label: string
    page: number | null
    active: boolean
}

export interface PaginatedSubmissions {
    current_page: number
    data: Submission[]
    first_page_url: string
    from: number | null
    last_page: number
    last_page_url: string
    links: PaginationLink[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}
