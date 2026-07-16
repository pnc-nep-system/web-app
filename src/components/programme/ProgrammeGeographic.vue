<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useProgrammeGeographyStore } from '@/stores/programmeGeography'
import type { ProgrammeGeographicData } from '@/types/programme'

const props = defineProps<{
    modelValue?: ProgrammeGeographicData
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: ProgrammeGeographicData): void
}>()

const store = useProgrammeGeographyStore()

watch(
    () => props.modelValue,
    (val) => {
        if (val && JSON.stringify(val) !== JSON.stringify(store.section3Data)) {
            store.initFromPayload(val)
        }
    },
    { deep: true, immediate: true }
)

watch(
    () => store.section3Data,
    (val) => {
        if (JSON.stringify(val) !== JSON.stringify(props.modelValue)) {
            emit('update:modelValue', val)
        }
    },
    { deep: true }
)

function validate(): boolean {
    return true
}

function getData() {
    return store.getData()
}

defineExpose({ validate, getData })

onMounted(() => {
    store.loadProvinces()
})
</script>

<template>
    <div class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 3: Geographic coverage</h3>
        <p class="text-sm text-gray-500 mb-6">
            Select the provinces and districts where this programme operates.
        </p>

        <!-- Loading state -->
        <div v-if="store.loadingProvinces" class="flex items-center gap-2 text-sm text-gray-400 py-4">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading provinces…
        </div>

        <!-- Error state -->
        <div v-else-if="store.provincesError" class="flex items-center gap-3 py-4">
            <span class="text-sm text-red-600">{{ store.provincesError }}</span>
            <button @click="store.loadProvinces" class="text-sm font-medium text-teal-700 hover:text-teal-600 underline">
                Retry
            </button>
        </div>

        <!-- Province pills -->
        <div v-else class="mt-6">
            <label class="block text-xs font-semibold text-gray-700 mb-2.5">Select all provinces where this programme currently operates</label>
            <div class="flex flex-wrap gap-2 mb-5">
                <label v-for="p in store.provinces" :key="p.id"
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer border transition-all select-none"
                    :class="store.provinceIds.includes(p.id)
                        ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                    <input type="checkbox" :checked="store.provinceIds.includes(p.id)"
                        @change="store.toggleProvince(p.id)" class="hidden" />
                    {{ p.province_name }}
                </label>
            </div>

            <!-- District section -->
            <template v-if="store.provinceIds.length">
                <div class="h-px bg-gray-200 my-4"></div>
                <label class="block text-xs font-semibold text-gray-700 mb-2.5">Select districts for each province (optional)</label>

                <div v-for="pid in store.provinceIds" :key="pid" class="mb-4">
                    <div class="flex items-center justify-between text-[13px] font-semibold text-gray-700 mb-2">
                        <span>{{ store.provinceNameById[pid] || `Province #${pid}` }}</span>
                        <button
                            class="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-transparent border border-teal-200 rounded-md px-2.5 py-1 cursor-pointer transition-all hover:bg-teal-50 hover:border-teal-400"
                            @click="store.toggleDistrictVisibility(pid)">
                            <template v-if="store.expandedProvinces.has(pid)">
                                Hide districts
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/>
                                </svg>
                            </template>
                            <template v-else>
                                Select districts
                                <template v-if="store.districts[pid]?.length">
                                    ({{ store.districts[pid].length }} selected)
                                </template>
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                                </svg>
                            </template>
                        </button>
                    </div>

                    <!-- District loading -->
                    <div v-if="store.loadingDistricts.has(pid)" v-show="store.expandedProvinces.has(pid)"
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
                    <div v-else-if="store.districtsCache[pid]?.length" v-show="store.expandedProvinces.has(pid)" class="flex flex-wrap gap-2 mb-5">
                        <label v-for="d in store.districtsCache[pid]" :key="d.id"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all select-none"
                            :class="store.districts[pid]?.includes(d.id)
                                ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                            <input type="checkbox" :checked="store.districts[pid]?.includes(d.id)"
                                @change="store.toggleDistrict(pid, d.id)" class="hidden" />
                            {{ d.name }}
                        </label>
                    </div>

                    <div v-else v-show="store.expandedProvinces.has(pid)" class="text-xs text-gray-400 py-1">No districts
                        available</div>
                </div>
            </template>

            <div class="h-px bg-gray-200 my-4"></div>
            <div>
                <label class="block text-xs font-semibold text-gray-700 mb-2">Other countries (if applicable)</label>
                <input type="text" v-model="store.otherCountries" placeholder="Leave blank if Cambodia-only"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400" />
            </div>
        </div>
    </div>
</template>
