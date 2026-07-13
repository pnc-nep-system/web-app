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
        fetchDistricts(provinceId)
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
        let changed = false
        const incomingProvinceIds = Array.isArray(val.provinceIds) ? val.provinceIds : []
        const incomingDistricts = val.districts && typeof val.districts === 'object' ? val.districts : {}
        const incomingOtherCountries = typeof val.otherCountries === 'string' ? val.otherCountries : ''

        if (JSON.stringify(incomingProvinceIds) !== JSON.stringify(formData.value.provinceIds)) {
            formData.value.provinceIds = [...incomingProvinceIds]
            changed = true
        }
        if (JSON.stringify(incomingDistricts) !== JSON.stringify(formData.value.districts)) {
            formData.value.districts = JSON.parse(JSON.stringify(incomingDistricts))
            changed = true
        }
        if (incomingOtherCountries !== formData.value.otherCountries) {
            formData.value.otherCountries = incomingOtherCountries
            changed = true
        }
        if (changed) {
            for (const pid of incomingProvinceIds) {
                if (!districtsCache.value[pid]) {
                    fetchDistricts(pid)
                }
            }
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
    for (const pid of formData.value.provinceIds) {
        fetchDistricts(pid)
    }
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
            <label class="input-label">Select all provinces where this programme currently operates</label>
            <div class="pill-grid">
                <label v-for="p in provinces" :key="p.id" class="pill-check"
                    :class="{ on: formData.provinceIds.includes(p.id) }">
                    <input type="checkbox" :checked="formData.provinceIds.includes(p.id)"
                        @change="toggleProvince(p.id)" />
                    {{ p.province_name }}
                </label>
            </div>

            <!-- District section -->
            <template v-if="formData.provinceIds.length">
                <div class="divider"></div>
                <label class="input-label">Select districts for each province (optional)</label>

                <div v-for="pid in formData.provinceIds" :key="pid" class="district-block">
                    <div class="district-heading">
                        <span>{{ provinceNameById[pid] || `Province #${pid}` }}</span>
                        <button class="district-toggle" @click="toggleDistrictVisibility(pid)">
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
                    <div v-else-if="districtsCache[pid]?.length" v-show="expandedProvinces.has(pid)" class="pill-grid">
                        <label v-for="d in districtsCache[pid]" :key="d.id" class="pill-check pill-check-sm"
                            :class="{ on: formData.districts[pid]?.includes(d.id) }">
                            <input type="checkbox" :checked="formData.districts[pid]?.includes(d.id)"
                                @change="toggleDistrict(pid, d.id)" />
                            {{ d.name }}
                        </label>
                    </div>

                    <div v-else v-show="expandedProvinces.has(pid)" class="text-xs text-gray-400 py-1">No districts
                        available</div>
                </div>
            </template>

            <div class="divider"></div>
            <div class="field">
                <label>Other countries (if applicable)</label>
                <input type="text" v-model="formData.otherCountries" placeholder="Leave blank if Cambodia-only" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.input-label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink-700);
    display: block;
    margin-bottom: 10px;
}

.pill-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.pill-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--line);
    background: #fff;
    color: var(--ink-600);
    transition: 0.12s;
    user-select: none;
}

.pill-check:hover {
    border-color: var(--teal-400);
    background: var(--teal-50);
}

.pill-check.on {
    background: var(--teal-800);
    color: #fff;
    border-color: var(--teal-800);
}

.pill-check.on:hover {
    background: var(--teal-700);
    border-color: var(--teal-700);
}

.pill-check-sm {
    padding: 4px 11px;
    font-size: 12px;
}

.pill-check input {
    display: none;
}

.divider {
    height: 1px;
    background: var(--line);
    margin: 16px 0;
}

.district-block {
    margin-bottom: 16px;
}

.district-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-700);
    margin-bottom: 8px;
}

.district-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--teal-700);
    background: none;
    border: 1px solid var(--teal-200);
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    transition: 0.12s;
    font-family: inherit;
}

.district-toggle:hover {
    background: var(--teal-50);
    border-color: var(--teal-400);
}
</style>
