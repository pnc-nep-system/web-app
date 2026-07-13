<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { memberApi } from '@/api/member.api'
import type { ProgrammeGeographicData, Province, District } from '@/types/programme'

const props = defineProps<{
    modelValue?: ProgrammeGeographicData
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: ProgrammeGeographicData): void
}>()

const formData = ref<ProgrammeGeographicData>({
    provinceIds: props.modelValue?.provinceIds ?? [],
    districts: props.modelValue?.districts ?? {},
    otherCountries: props.modelValue?.otherCountries ?? '',
})

const provinces = ref<Province[]>([])
const districtsCache = ref<Record<number, District[]>>({})
const loadingProvinces = ref(false)
const provincesError = ref<string | null>(null)
const loadingDistricts = ref<Set<number>>(new Set())

const provinceNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const p of provinces.value) {
        map[p.id] = p.province_name
    }
    return map
})

async function loadProvinces() {
    loadingProvinces.value = true
    provincesError.value = null
    try {
        const res = await memberApi.getProvinces()
        provinces.value = res.data.data
    } catch {
        provincesError.value = 'Failed to load provinces. Please try again.'
    } finally {
        loadingProvinces.value = false
    }
}

async function fetchDistricts(provinceId: number) {
    if (districtsCache.value[provinceId] || loadingDistricts.value.has(provinceId)) return
    loadingDistricts.value = new Set([...loadingDistricts.value, provinceId])
    try {
        const res = await memberApi.getDistricts(provinceId)
        districtsCache.value = { ...districtsCache.value, [provinceId]: res.data.data }
    } catch {
        // Silently fail; districts just won't show
    } finally {
        const next = new Set(loadingDistricts.value)
        next.delete(provinceId)
        loadingDistricts.value = next
    }
}

function toggleProvince(provinceId: number) {
    const idx = formData.value.provinceIds.indexOf(provinceId)
    if (idx === -1) {
        formData.value.provinceIds.push(provinceId)
    } else {
        formData.value.provinceIds.splice(idx, 1)
        delete formData.value.districts[provinceId]
    }
}

const expandedProvinces = ref<Set<number>>(new Set())

function toggleDistrictVisibility(provinceId: number) {
    const next = new Set(expandedProvinces.value)
    if (next.has(provinceId)) {
        next.delete(provinceId)
    } else {
        next.add(provinceId)
        fetchDistricts(provinceId)
    }
    expandedProvinces.value = next
}

function toggleDistrict(provinceId: number, districtId: number) {
    if (!formData.value.districts[provinceId]) {
        formData.value.districts[provinceId] = []
    }
    const arr = formData.value.districts[provinceId]
    const idx = arr.indexOf(districtId)
    if (idx === -1) {
        arr.push(districtId)
    } else {
        arr.splice(idx, 1)
    }
}

watch(
    () => props.modelValue,
    (val) => {
        if (!val) return
        const incomingProvinceIds = Array.isArray(val.provinceIds) ? val.provinceIds : []
        const incomingDistricts = val.districts && typeof val.districts === 'object' ? val.districts : {}
        const incomingOtherCountries = typeof val.otherCountries === 'string' ? val.otherCountries : ''

        if (JSON.stringify(incomingProvinceIds) !== JSON.stringify(formData.value.provinceIds)) {
            formData.value.provinceIds = [...incomingProvinceIds]
        }
        if (JSON.stringify(incomingDistricts) !== JSON.stringify(formData.value.districts)) {
            formData.value.districts = JSON.parse(JSON.stringify(incomingDistricts))
        }
        if (incomingOtherCountries !== formData.value.otherCountries) {
            formData.value.otherCountries = incomingOtherCountries
        }
    },
    { deep: true },
)

watch(
    formData,
    (val) => {
        emit('update:modelValue', {
            provinceIds: [...val.provinceIds],
            districts: JSON.parse(JSON.stringify(val.districts)),
            otherCountries: val.otherCountries,
        })
    },
    { deep: true },
)

function validate(): boolean {
    return true
}

function getData() {
    return formData.value
}

defineExpose({ validate, getData })

onMounted(() => {
    loadProvinces()
})
</script>

<template>
    <div class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 3: Geographic coverage</h3>
        <p class="text-sm text-gray-500 mb-6">
            Select the provinces and districts where this programme operates.
        </p>

        <!-- Loading state -->
        <div v-if="loadingProvinces" class="flex items-center gap-2 text-sm text-gray-400 py-4">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading provinces…
        </div>

        <!-- Error state -->
        <div v-else-if="provincesError" class="flex items-center gap-3 py-4">
            <span class="text-sm text-red-600">{{ provincesError }}</span>
            <button @click="loadProvinces" class="text-sm font-medium text-teal-700 hover:text-teal-600 underline">
                Retry
            </button>
        </div>

        <!-- Province pills -->
        <div v-else class="mt-6">
            <label class="block text-xs font-semibold text-gray-700 mb-2.5">Select all provinces where this programme currently operates</label>
            <div class="flex flex-wrap gap-2 mb-5">
                <label v-for="p in provinces" :key="p.id"
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer border transition-all select-none"
                    :class="formData.provinceIds.includes(p.id)
                        ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                    <input type="checkbox" :checked="formData.provinceIds.includes(p.id)"
                        @change="toggleProvince(p.id)" class="hidden" />
                    {{ p.province_name }}
                </label>
            </div>

            <!-- District section -->
            <template v-if="formData.provinceIds.length">
                <div class="h-px bg-gray-200 my-4"></div>
                <label class="block text-xs font-semibold text-gray-700 mb-2.5">Select districts for each province (optional)</label>

                <div v-for="pid in formData.provinceIds" :key="pid" class="mb-4">
                    <div class="flex items-center justify-between text-[13px] font-semibold text-gray-700 mb-2">
                        <span>{{ provinceNameById[pid] || `Province #${pid}` }}</span>
                        <button
                            class="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-transparent border border-teal-200 rounded-md px-2.5 py-1 cursor-pointer transition-all hover:bg-teal-50 hover:border-teal-400"
                            @click="toggleDistrictVisibility(pid)">
                            <template v-if="expandedProvinces.has(pid)">
                                Hide districts
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/>
                                </svg>
                            </template>
                            <template v-else>
                                Select districts
                                <template v-if="formData.districts[pid]?.length">
                                    ({{ formData.districts[pid].length }} selected)
                                </template>
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                                </svg>
                            </template>
                        </button>
                    </div>

                    <!-- District loading -->
                    <div v-if="loadingDistricts.has(pid)" v-show="expandedProvinces.has(pid)"
                        class="flex items-center gap-2 text-xs text-gray-400 py-2">
                        <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading districts…
                    </div>

                    <!-- District pills -->
                    <div v-else-if="districtsCache[pid]?.length" v-show="expandedProvinces.has(pid)" class="flex flex-wrap gap-2 mb-5">
                        <label v-for="d in districtsCache[pid]" :key="d.id"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all select-none"
                            :class="formData.districts[pid]?.includes(d.id)
                                ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                            <input type="checkbox" :checked="formData.districts[pid]?.includes(d.id)"
                                @change="toggleDistrict(pid, d.id)" class="hidden" />
                            {{ d.name }}
                        </label>
                    </div>

                    <div v-else v-show="expandedProvinces.has(pid)" class="text-xs text-gray-400 py-1">No districts
                        available</div>
                </div>
            </template>

            <div class="h-px bg-gray-200 my-4"></div>
            <div>
                <label class="block text-xs font-semibold text-gray-700 mb-2">Other countries (if applicable)</label>
                <input type="text" v-model="formData.otherCountries" placeholder="Leave blank if Cambodia-only"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400" />
            </div>
        </div>
    </div>
</template>

