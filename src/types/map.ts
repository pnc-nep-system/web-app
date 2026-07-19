export interface MapFilterParams {
  category_id?: number | null
  subcategory_id?: number | null
  item_id?: number | null
  education_level_id?: number | null
  inclusion_group?: string
  inclusion_type?: string
  province_id?: number | null
  district_id?: number | null
  commune_id?: number | null
  agreement_counterpart_type?: string
  agreement_status?: string
  budget_band_id?: number | null
  keyword?: string
  organisation_name?: string
  min_staff?: number | null
  max_staff?: number | null
  min_beneficiaries?: number | null
  max_beneficiaries?: number | null
  per_page?: number
  page?: number
}

export interface RefdataEducationLevel {
  id: number
  level_name: string
}

export interface RefdataBudgetBand {
  id: number
  label: string
  min_amount: number | null
  max_amount: number | null
}

export interface MapEntry {
  id: number
  programme_name: string
  start_year: number | null
  end_year: number | null
  ongoing: boolean
  organisation: { id: number; name: string } | null
  budget_band: RefdataBudgetBand | null
  locations: Array<{
    province: { province_name: string } | null
    district: { name: string } | null
    commune: { name: string } | null
    village: { name: string } | null
  }>
  activities: Array<{
    is_primary: boolean
    activity_item: { code: string } | null
    education_levels: Array<{ level_name: string }>
  }>
  is_unverified: boolean
  last_updated_at: string
  fte_staff: number | null
  direct_beneficiaries: number | null
  indirect_beneficiaries: number | null
  keywords: string[]
  government_agreements: Array<{
    counterpart_agency: string
    nature: string
    status: string
  }>
}

export interface MapEntryResponse {
  data: MapEntry[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
