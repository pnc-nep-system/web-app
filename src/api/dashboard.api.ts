import api from './axios'

export interface DashboardStats {
  total_organizations: number
  total_program_entries: number
  unverified_program_entries: number
  coordinator_advisory_notes: number | null
  total_advisory_notes: number
}

export interface CategoryCount {
  id: number
  code: string
  label: string
  programme_count: number
}

export interface ProvinceCount {
  id: number
  province_name: string
  programme_count: number
}

export const dashboardApi = {
  getStats() {
    return api.get<DashboardStats>('/dashboard/stats')
  },
  getCategoryCounts() {
    return api.get<CategoryCount[]>('/taxonomy/categories/counts')
  },
  getProvinceCounts() {
    return api.get<ProvinceCount[]>('/provinces/counts')
  },
}
