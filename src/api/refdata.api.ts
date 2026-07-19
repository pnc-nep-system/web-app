import api from './axios'

export const refdataApi = {
  getEducationLevels() {
    return api.get<{ data: Array<{ id: number; level_name: string }> }>('/refdata/education-levels')
  },

  getBudgetBands() {
    return api.get<{ data: Array<{ id: number; label: string; min_amount: number | null; max_amount: number | null }> }>('/refdata/budget-bands')
  },

  getCounterpartAgencies() {
    return api.get<{ data: string[] }>('/refdata/counterpart-agencies')
  },
}
