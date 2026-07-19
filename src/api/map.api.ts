import api from './axios'
import type { MapFilterParams, MapEntryResponse } from '@/types/map'

function cleanParams(params: MapFilterParams): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  }
  return cleaned
}

export const mapApi = {
  getEntries(params: MapFilterParams) {
    return api.get<MapEntryResponse>('/map/entries', { params: cleanParams(params) })
  },

  getEntry(id: number) {
    return api.get<{ data: any }>(`/programme-entries/${id}`)
  },
}
