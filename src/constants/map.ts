/**
 * Maps education level API IDs to their display labels.
 * Used by the "Education level" filter dropdown in MapFilterBar.
 */
export const EDUCATION_LEVELS: Record<string, string> = {
  '1': 'Primary',
  '2': 'Lower Secondary',
  '3': 'Upper Secondary',
  '4': 'Tertiary',
}

/**
 * Maps inclusion group keys to their display labels.
 * Used by the "Inclusion group" filter dropdown in MapFilterBar.
 */
export const INCLUSION_GROUPS: Record<string, string> = {
  disability: 'Disability',
  ethnic: 'Ethnic minority',
  poverty: 'Extreme poverty',
  rural: 'Rural/remote',
  girls: 'Girls/women',
}
