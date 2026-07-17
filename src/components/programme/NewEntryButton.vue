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
    class="flex items-center justify-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border-0 outline-none select-none w-full cursor-pointer"
    style="color: white !important;"
  >
    <span class="text-white font-semibold" style="color: white !important;">+ New programme entry</span>
  </button>
</template>
