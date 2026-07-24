<script setup lang="ts">
import { useMapStore } from '@/stores/map'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/constants/map'

/**
 * Renders the filter bar for the Programme Map page.
 *
 * Uses fluid flex layout with min-widths so options fill rows cleanly
 * on all screen sizes without awkward clipping or squishing.
 */
const mapStore = useMapStore()
const taxonomyStore = useTaxonomyStore()
</script>

<template>
  <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 items-center">
      
      <!-- Category Filter -->
      <select v-model="mapStore.filters.category" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate">
        <option value="">Activity category — any</option>
        <option v-for="c in taxonomyStore.categories" :key="c.code" :value="c.code">{{ c.code }} {{ c.label }}</option>
      </select>

      <!-- Education Level Filter -->
      <select v-model="mapStore.filters.level" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate">
        <option value="">Education level — any</option>
        <option v-for="(label, key) in EDUCATION_LEVELS" :key="key" :value="key">{{ label }}</option>
      </select>

      <!-- Inclusion Group Filter -->
      <select v-model="mapStore.filters.inclusion" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate">
        <option value="">Inclusion group — any</option>
        <option v-for="(label, key) in INCLUSION_GROUPS" :key="key" :value="key">{{ label }}</option>
      </select>

      <!-- Province Filter -->
      <select v-model="mapStore.filters.province" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate">
        <option value="">Province — any</option>
        <option v-for="p in mapStore.provincesList" :key="p" :value="p">{{ p }}</option>
      </select>

      <!-- District Filter -->
      <select
        v-model="mapStore.filters.district"
        :disabled="!mapStore.filters.province"
        class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50/50"
      >
        <option value="">District — any</option>
        <option v-for="d in mapStore.districtsList" :key="d" :value="d">{{ d }}</option>
      </select>

      <!-- Commune Filter -->
      <select
        v-model="mapStore.filters.commune"
        :disabled="!mapStore.filters.district"
        class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50/50"
      >
        <option value="">Commune — any</option>
        <option v-for="c in mapStore.communesList" :key="c" :value="c">{{ c }}</option>
      </select>

      <!-- Village Filter -->
      <select
        v-model="mapStore.filters.village"
        :disabled="!mapStore.filters.commune"
        class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50/50"
      >
        <option value="">Village — any</option>
        <option v-for="v in mapStore.villagesList" :key="v" :value="v">{{ v }}</option>
      </select>

      <!-- Government Counterpart Filter -->
      <select v-model="mapStore.filters.counterpart" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50/50 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer truncate">
        <option value="">Govt. counterpart — any</option>
        <option v-for="c in mapStore.counterpartOptions" :key="c" :value="c">{{ c }}</option>
      </select>

      <!-- Keyword Search & Clear Button -->
      <div class="sm:col-span-2 md:col-span-3 lg:col-span-4 flex items-center gap-2 mt-1">
        <input 
          type="text" 
          v-model="mapStore.filters.keyword" 
          placeholder="Keyword or organisation…" 
          class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all" 
        />
        <button 
          class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap shrink-0 border border-slate-200/60" 
          @click="mapStore.clearFilters"
          title="Clear all filters"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>
