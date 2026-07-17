import api from './axios'

export interface MapFilters {
  category_id?: number | null
  subcategory_id?: number | null
  item_id?: number | null
  education_level_id?: number | null
  inclusion_group?: string | null
  inclusion_type?: string | null
  province_id?: number | null
  district_id?: number | null
  commune_id?: number | null
  keyword?: string | null
  organisation_name?: string | null
}

export async function exportMapEntriesCsv(filters: MapFilters) {
  const response = await api.get('/map/entries/export', {
    params: filters,
    responseType: 'blob',
  })

  downloadFile(
    response.data,
    'programme-entries.csv',
    'text/csv;charset=utf-8'
  )
}

export async function exportMapEntriesPdf(filters: MapFilters) {
  const response = await api.get('/map/entries/export/pdf', {
    params: filters,
    responseType: 'blob',
  })

  downloadFile(
    response.data,
    'programme-entries-report.pdf',
    'application/pdf'
  )
}

function downloadFile(
  data: BlobPart,
  filename: string,
  type: string
) {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}
