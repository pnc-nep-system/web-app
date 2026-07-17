<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProgrammeFormStore } from '@/stores/programmeForm'

const router = useRouter()
const store = useProgrammeFormStore()

function handleClick() {
  sessionStorage.removeItem('new_programme_entry_draft')
  store.resetAll()
  router.push('/entries/new')
}
</script>

<template>
  <button
    type="button"
    @click="handleClick"
    class="flex items-center justify-center gap-1 bg-teal-800 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg transition-colors border-0 outline-none select-none w-full cursor-pointer whitespace-nowrap"
    style="color: white !important;"
  >
    <span class="font-bold">+</span>
    <span class="hidden sm:inline text-white font-semibold" style="color: white !important;">New programme entry</span>
    <span class="inline sm:hidden text-white font-semibold" style="color: white !important;">New</span>
  </button>
</template>
