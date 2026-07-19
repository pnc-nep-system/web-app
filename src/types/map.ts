/**
 * UI-facing filter state for the map view.
 *
 * Each field maps to a filter control in MapFilterBar. Values are display-oriented
 * strings (category codes, province names, etc.) rather than the numeric IDs used
 * by the export API (MapFilters).
 */
export interface MapViewFilters {
  category: string
  level: string
  inclusion: string
  province: string
  district: string
  village: string
  counterpart: string
  keyword: string
}
