import { ref } from 'vue'
import { defineStore } from 'pinia'
import { organisationService } from '@/api/organisation.service'
import type { OrganisationForm } from '@/types/organisations'

export const useOrganisationsStore = defineStore('organisations', () => {
  const organisations = ref<any[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const search = ref('')

  const fetchOrganisations = async (page = 1) => {
    loading.value = true
    error.value = null
    try {
      const res = await organisationService.getOrganisations(page, search.value, { per_page: 16 })
      organisations.value = res.data.data
      currentPage.value = res.data.current_page
      lastPage.value = res.data.last_page
      total.value = res.data.total
    } catch {
      error.value = 'Failed to load organisations'
    } finally {
      loading.value = false
    }
  }

  // Patches a single organisation in local state without refetching the
  // whole paginated list — used after activate/deactivate/logo upload,
  // since the backend already returns the full updated record.
  const patchLocal = (updated: any) => {
    const idx = organisations.value.findIndex((o) => o.id === updated.id)
    if (idx !== -1) {
      organisations.value[idx] = updated
    }
  }

  const create = async (data: OrganisationForm) => {
    saving.value = true
    try {
      const res = await organisationService.createOrganisation(data)
      let created: any = res.data
      organisations.value.unshift(created)
      total.value += 1

      if (data.logoFile) {
        try {
          const logoRes = await organisationService.uploadLogo(created.id, data.logoFile)
          patchLocal(logoRes.data.organisation ?? logoRes.data ?? created)
        } catch {
          throw new Error('logo_upload_failed')
        }
      }
    } finally {
      saving.value = false
    }
  }

  const update = async (id: number, data: OrganisationForm) => {
    saving.value = true
    try {
      const current = organisations.value.find((o) => o.id === id)
      const fieldsChanged = !current ||
        current.name !== data.name ||
        current.contact_name !== data.contact_name ||
        current.email !== data.email ||
        // eslint-disable-next-line eqeqeq
        current.member_since != data.member_since

      let updated: any
      if (fieldsChanged) {
        const res = await organisationService.updateOrganisation(id, data)
        updated = res.data.organisation
      } else {
        updated = current
      }

      if (data.logoFile) {
        try {
          const logoRes = await organisationService.uploadLogo(id, data.logoFile)
          updated = logoRes.data.organisation ?? logoRes.data ?? updated
        } catch (e) {
          console.error('[uploadLogo] failed:', e)
          throw new Error('logo_upload_failed')
        }
      }

      patchLocal(updated)
    } finally {
      saving.value = false
    }
  }

  const activate = async (id: number) => {
    const res = await organisationService.reactivateOrganisation(id)
    patchLocal(res.data)
  }

  const deactivate = async (id: number) => {
    const res = await organisationService.deactivateOrganisation(id)
    patchLocal(res.data)
  }

  return {
    organisations, loading, saving, error,
    currentPage, lastPage, total, search,
    fetchOrganisations, create, update, activate, deactivate,
  }
})