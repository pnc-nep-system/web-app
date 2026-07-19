<script setup lang="ts">
import { useMapStore } from '@/stores/map'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/constants/map'

/**
 * Renders the filter bar for the Programme Map page.
 *
 * Each select dropdown is bound to a field on mapStore.filters.
 * Taxonomy categories come from useTaxonomyStore; geography lists
 * (provinces, districts, villages) and counterpart options come
 * from useMapStore computeds.
 */
const mapStore = useMapStore()
const taxonomyStore = useTaxonomyStore()
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center mb-3">
    <select v-model="mapStore.filters.category" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Activity category — any</option>
      <option v-for="c in taxonomyStore.categories" :key="c.code" :value="c.code">{{ c.code }} {{ c.label }}</option>
    </select>

    <select v-model="mapStore.filters.level" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Education level — any</option>
      <option v-for="(label, key) in EDUCATION_LEVELS" :key="key" :value="key">{{ label }}</option>
    </select>

    <select v-model="mapStore.filters.inclusion" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Inclusion group — any</option>
      <option v-for="(label, key) in INCLUSION_GROUPS" :key="key" :value="key">{{ label }}</option>
    </select>

    <select v-model="mapStore.filters.province" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Province — any</option>
      <option v-for="p in mapStore.provincesList" :key="p" :value="p">{{ p }}</option>
    </select>

    <select v-model="mapStore.filters.district" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">District — any</option>
      <option v-for="d in mapStore.districtsList" :key="d" :value="d">{{ d }}</option>
    </select>

    <select v-model="mapStore.filters.village" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Village — any</option>
      <option v-for="v in mapStore.villagesList" :key="v" :value="v">{{ v }}</option>
    </select>

    <select v-model="mapStore.filters.counterpart" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 min-w-[140px]">
      <option value="">Govt. counterpart — any</option>
      <option v-for="c in mapStore.counterpartOptions" :key="c" :value="c">{{ c }}</option>
    </select>
    <input type="text" v-model="mapStore.filters.keyword" placeholder="Keyword or organisation…" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white text-gray-800 flex-1 min-w-[180px]" />
    <button class="btn btn-ghost btn-sm" @click="mapStore.clearFilters">Clear all</button>
  </div>
</template>
