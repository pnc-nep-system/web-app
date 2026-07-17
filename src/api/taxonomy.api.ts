import api from './axios'
import type { Category, SubCategory, TaxonomyItem } from '@/types/taxonomy'

export type TaxonomyNodeType = 'category' | 'subCategory' | 'item'
export type TaxonomyItemStatus = 'active' | 'deprecated'

export interface TaxonomyCreatePayload {
  name: string
  code?: string
  category_id?: number
  sub_category_id?: number
  subcategory_id?: number
}

export interface TaxonomyRenamePayload {
  label: string
}

export interface OtherQueuePayload {
  text: string
  suggested_category: string
  category_code?: string
  subcategory_label?: string
}

const TAXONOMY_CACHE_KEY = 'nep_taxonomy_categories_cache_v1'
const TAXONOMY_CACHE_TTL_MS = 24 * 60 * 60 * 1000
let taxonomyRequest: Promise<Category[]> | null = null

interface CachePayload<T> {
  savedAt: number
  data: T
}

function unwrapData<T>(response: { data: T | { data: T } }): T {
  const body = response.data as T | { data: T }
  return typeof body === 'object' && body !== null && 'data' in body ? body.data : (body as T)
}

function readTaxonomyCache(): Category[] | null {
  try {
    const raw = localStorage.getItem(TAXONOMY_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachePayload<Category[]> | Category[]

    if (Array.isArray(parsed)) {
      return parsed
    }

    if (!Array.isArray(parsed.data)) return null

    const isFresh = Date.now() - parsed.savedAt < TAXONOMY_CACHE_TTL_MS
    return isFresh ? parsed.data : null
  } catch {
    return null
  }
}

function writeTaxonomyCache(data: Category[]) {
  localStorage.setItem(
    TAXONOMY_CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      data,
    } satisfies CachePayload<Category[]>),
  )
}

export function invalidateTaxonomyCache() {
  taxonomyRequest = null
  localStorage.removeItem(TAXONOMY_CACHE_KEY)
}

export const taxonomyApi = {
  async list(options: { force?: boolean } = {}) {
    if (!options.force) {
      const cached = readTaxonomyCache()
      if (cached) return cached

      if (taxonomyRequest) return taxonomyRequest
    }

    taxonomyRequest = api
      .get<Category[] | { data: Category[] }>('/taxonomy/categories')
      .then((response) => {
        const categories = unwrapData<Category[]>(response)
        writeTaxonomyCache(categories)
        return categories
      })
      .finally(() => {
        taxonomyRequest = null
      })

    return taxonomyRequest
  },

  async createCategory(payload: TaxonomyCreatePayload) {
    const response = await api.post<Category | { data: Category }>('/taxonomy/categories', payload)
    invalidateTaxonomyCache()
    return unwrapData<Category>(response)
  },

  async createSubCategory(payload: TaxonomyCreatePayload) {
    const response = await api.post<SubCategory | { data: SubCategory }>(
      '/taxonomy/subcategories',
      payload,
    )
    invalidateTaxonomyCache()
    return unwrapData<SubCategory>(response)
  },

  async createItem(payload: TaxonomyCreatePayload) {
    const response = await api.post<TaxonomyItem | { data: TaxonomyItem }>('/taxonomy/items', payload)
    invalidateTaxonomyCache()
    return unwrapData<TaxonomyItem>(response)
  },

  async rename(type: TaxonomyNodeType, id: number, payload: TaxonomyRenamePayload) {
    const path = type === 'category'
      ? `/taxonomy/categories/${id}`
      : type === 'subCategory'
        ? `/taxonomy/subcategories/${id}`
        : `/taxonomy/items/${id}`

    const response = await api.put<Category | SubCategory | TaxonomyItem | { data: Category | SubCategory | TaxonomyItem }>(
      path,
      payload,
    )
    invalidateTaxonomyCache()
    return unwrapData<Category | SubCategory | TaxonomyItem>(response)
  },

  async deprecate(type: TaxonomyNodeType, id: number) {
    const path = type === 'category'
      ? `/taxonomy/categories/${id}/deprecate`
      : type === 'subCategory'
        ? `/taxonomy/subcategories/${id}/deprecate`
        : `/taxonomy/items/${id}/deprecate`

    const response = await api.patch<Category | SubCategory | TaxonomyItem | { data: Category | SubCategory | TaxonomyItem }>(
      path,
      { is_active: false },
    )
    invalidateTaxonomyCache()
    return unwrapData<Category | SubCategory | TaxonomyItem>(response)
  },

  async setItemStatus(id: number, status: TaxonomyItemStatus) {
    if (status === 'deprecated') {
      return this.deprecate('item', id) as Promise<TaxonomyItem>
    }

    return Promise.reject(new Error('Backend does not expose a reactivate taxonomy item endpoint.'))
  },
}
