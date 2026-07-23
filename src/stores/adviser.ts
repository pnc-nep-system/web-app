import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adviserApi } from '@/api/adviser.api'
import { userService } from '@/api/user.service'
import type { SubmissionPayload, SubmissionListParams } from '@/api/adviser.api'
import type { Submission } from '@/types/adviser'

export const useAdviserStore = defineStore('adviser', () => {
    const submissions = ref<Submission[]>([])
    const loading = ref(false)
    const submitting = ref(false)
    const error = ref<string | null>(null)

    const currentPage = ref(1)
    const lastPage = ref(1)
    const total = ref(0)
    const perPage = ref(25)

    // ── Coordinator map (shared) ──────────────────────────────────────────────
    const coordinatorMap = ref<Record<number, string>>({})
    const coordinatorsLoaded = ref(false)
    const isLoadingCoordinators = ref(false)

    async function loadCoordinators() {
        if (coordinatorsLoaded.value || isLoadingCoordinators.value) return
        isLoadingCoordinators.value = true
        try {
            const res = await userService.getUsers(1, '', { role: 'nep_coordinator', status: 'active', per_page: 100 })
            const raw = res.data.data || []
            const map: Record<number, string> = {}
            raw.forEach((u: any) => { map[u.id] = u.name ?? u.email ?? `User ${u.id}` })
            coordinatorMap.value = map
            coordinatorsLoaded.value = true
        } catch {
            coordinatorMap.value = {}
        } finally {
            isLoadingCoordinators.value = false
        }
    }

    function coordinatorLabel(id: number | null): string {
        if (!id) return 'Unassigned'
        return coordinatorMap.value[id] ?? `User #${id}`
    }

    async function fetchSubmissions(params: SubmissionListParams = {}) {
        loading.value = true
        error.value = null
        try {
            const response = await adviserApi.list({
                page: currentPage.value,
                per_page: perPage.value,
                ...params,
            })
            const paginated = response.data
            submissions.value = paginated.data
            currentPage.value = paginated.current_page
            lastPage.value = paginated.last_page
            total.value = paginated.total
        } catch (err: any) {
            error.value = err?.response?.data?.message ?? 'Failed to load submissions.'
        } finally {
            loading.value = false
        }
    }

    async function goToPage(page: number, params: SubmissionListParams = {}) {
        currentPage.value = page
        await fetchSubmissions(params)
    }

    async function submitDocument(payload: SubmissionPayload, file?: File): Promise<Submission> {
        submitting.value = true
        error.value = null
        try {
            const response = await adviserApi.submit(payload, file)
            const created = response.data.data
            submissions.value.unshift(created)
            total.value += 1
            return created
        } catch (err: any) {
            error.value = err?.response?.data?.message ?? 'Failed to submit document.'
            throw err
        } finally {
            submitting.value = false
        }
    }

    return {
        submissions,
        loading,
        submitting,
        error,
        currentPage,
        lastPage,
        total,
        perPage,
        coordinatorMap,
        coordinatorsLoaded,
        isLoadingCoordinators,
        coordinatorLabel,
        loadCoordinators,
        fetchSubmissions,
        goToPage,
        submitDocument,
    }
})
