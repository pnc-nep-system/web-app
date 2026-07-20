import api from './axios'

export interface DashboardStats {
  total_organizations: number
  total_program_entries: number
  unverified_program_entries: number
  coordinator_advisory_notes: number
  total_advisory_notes: number
}

export const dashboardApi = {
  getStats() {
    return api.get<DashboardStats>('/dashboard/stats')
  }
}
