<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMapFilterStore } from '@/stores/mapFilter'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { useProgrammeGeographyStore } from '@/stores/programmeGeography'
import { GROUPS_CONFIG } from '@/constants/taxonomy'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const mapFilter = useMapFilterStore()
const taxonomy = useTaxonomyStore()
const geography = useProgrammeGeographyStore()

const showFilters = ref(false)

const availableDistricts = mapFilter.availableDistricts
const availableCommunes = mapFilter.availableCommunes

onMounted(() => {
  taxonomy.fetchTaxonomy()
  geography.loadProvinces()
  mapFilter.fetchRefdata()
})
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
    <div class="flex items-center justify-between lg:hidden">
      <button
        @click="showFilters = !showFilters"
        class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <BaseIcon :name="showFilters ? 'chevronDown' : 'list'" :size="16" />
        Filters
        <span
          v-if="mapFilter.activeFilterCount"
          class="ml-1 px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold leading-none"
        >
          {{ mapFilter.activeFilterCount }}
        </span>
      </button>
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="!mapFilter.hasActiveFilters"
        @click="mapFilter.clearFilters"
      >
        Clear all
      </BaseButton>
    </div>

    <div
      :class="[
        showFilters ? 'grid' : 'hidden',
        'md:grid gap-3 mt-3 lg:mt-0 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3'
      ]"
    >
      <select v-model.number="mapFilter.filters.category_id"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option :value="null">Activity category — any</option>
        <option v-for="c in taxonomy.categories" :key="c.id" :value="c.id">{{ c.code }} {{ c.label }}</option>
      </select>

      <select v-model.number="mapFilter.filters.education_level_id"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option :value="null">Education level — any</option>
        <option v-if="mapFilter.educationLevelsLoading" disabled>Loading…</option>
        <option v-for="level in mapFilter.educationLevels" :key="level.id" :value="level.id">{{ level.level_name }}</option>
      </select>

      <select v-model="mapFilter.filters.inclusion_group"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Inclusion group — any</option>
        <option v-for="g in GROUPS_CONFIG" :key="g.name" :value="g.name">{{ g.name }}</option>
      </select>

      <select v-model.number="mapFilter.filters.province_id"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option :value="null">Province — any</option>
        <option v-if="geography.loadingProvinces" disabled>Loading…</option>
        <option v-for="p in geography.provinces" :key="p.id" :value="p.id">{{ p.province_name }}</option>
      </select>

      <select v-model.number="mapFilter.filters.district_id" :disabled="!mapFilter.filters.province_id"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500">
        <option :value="null">District — any</option>
        <option v-for="d in availableDistricts" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>

      <select v-model.number="mapFilter.filters.commune_id" :disabled="!mapFilter.filters.district_id"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500">
        <option :value="null">Commune — any</option>
        <option v-for="c in availableCommunes" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <select v-model="mapFilter.filters.agreement_counterpart_type"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Govt. counterpart — any</option>
        <option v-if="mapFilter.counterpartAgenciesLoading" disabled>Loading…</option>
        <option v-for="c in mapFilter.counterpartAgencies" :key="c" :value="c">{{ c }}</option>
      </select>

      <input v-model="mapFilter.filters.keyword" type="text" placeholder="Keyword…"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400" />

      <input v-model="mapFilter.filters.organisation_name" type="text" placeholder="Organisation name…"
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400" />
    </div>

    <div class="hidden lg:flex justify-end mt-3">
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="!mapFilter.hasActiveFilters"
        @click="mapFilter.clearFilters"
      >
        Clear all
      </BaseButton>
    </div>
  </div>
</template>
