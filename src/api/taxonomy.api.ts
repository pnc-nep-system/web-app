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

function unwrapData<T>(response: { data: T | { data: T } }): T {
  const body = response.data as T | { data: T }
  return typeof body === 'object' && body !== null && 'data' in body ? body.data : (body as T)
}

export const taxonomyApi = {
  async list() {
    const response = await api.get<Category[] | { data: Category[] }>('/taxonomy/categories')
    return unwrapData<Category[]>(response)
  },

  async createCategory(payload: TaxonomyCreatePayload) {
    const response = await api.post<Category | { data: Category }>('/taxonomy/categories', payload)
    return unwrapData<Category>(response)
  },

  async createSubCategory(payload: TaxonomyCreatePayload) {
    const response = await api.post<SubCategory | { data: SubCategory }>(
      '/taxonomy/subcategories',
      payload,
    )
    return unwrapData<SubCategory>(response)
  },

  async createItem(payload: TaxonomyCreatePayload) {
    const response = await api.post<TaxonomyItem | { data: TaxonomyItem }>('/taxonomy/items', payload)
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
    return unwrapData<Category | SubCategory | TaxonomyItem>(response)
  },

  async setItemStatus(id: number, status: TaxonomyItemStatus) {
    if (status === 'deprecated') {
      return this.deprecate('item', id) as Promise<TaxonomyItem>
    }

    return Promise.reject(new Error('Backend does not expose a reactivate taxonomy item endpoint.'))
  },
}
