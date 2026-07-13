import type { BudgetBand } from '@/constants/programme'
export interface Activity {
  code: string
  primary: boolean
}
export interface ProgrammeIdentity {
  id?: number | null
  name: string
  startYear: number | null
  endYear: number | null
  isOngoing: boolean
  fteStaff: number | null
  budgetBand: BudgetBand | null
  directBeneficiaries: number | null
  indirectBeneficiaries: number | null
  method: string
  verifiedDate: string
  activities?: Activity[]
  provinces?: string[]
}

export interface Province {
  id: number
  province_name: string
}

export interface District {
  id: number
  province_id: number
  name: string
}

export interface ProgrammeGeographicData {
  provinceIds: number[]
  districts: Record<number, number[]>
  otherCountries: string
}

