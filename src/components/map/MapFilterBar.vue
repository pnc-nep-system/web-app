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
  <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
    <div class="flex flex-wrap gap-2.5 items-center">
      <select v-model="mapStore.filters.category" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Activity category — any</option>
        <option v-for="c in taxonomyStore.categories" :key="c.code" :value="c.code">{{ c.code }} {{ c.label }}</option>
      </select>

      <select v-model="mapStore.filters.level" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Education level — any</option>
        <option v-for="(label, key) in EDUCATION_LEVELS" :key="key" :value="key">{{ label }}</option>
      </select>

      <select v-model="mapStore.filters.inclusion" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Inclusion group — any</option>
        <option v-for="(label, key) in INCLUSION_GROUPS" :key="key" :value="key">{{ label }}</option>
      </select>

      <select v-model="mapStore.filters.province" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Province — any</option>
        <option v-for="p in mapStore.provincesList" :key="p" :value="p">{{ p }}</option>
      </select>

      <select v-model="mapStore.filters.district" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">District — any</option>
        <option v-for="d in mapStore.districtsList" :key="d" :value="d">{{ d }}</option>
      </select>

      <select v-model="mapStore.filters.village" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Village — any</option>
        <option v-for="v in mapStore.villagesList" :key="v" :value="v">{{ v }}</option>
      </select>

      <select v-model="mapStore.filters.counterpart" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer">
        <option value="">Govt. counterpart — any</option>
        <option v-for="c in mapStore.counterpartOptions" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="relative flex-grow min-w-[200px]">
        <input 
          type="text" 
          v-model="mapStore.filters.keyword" 
          placeholder="Keyword or organisation…" 
          class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all" 
        />
      </div>

      <button 
        class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap" 
        @click="mapStore.clearFilters"
      >
        Clear all
      </button>
    </div>
  </div>
</template>
