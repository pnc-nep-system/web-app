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
