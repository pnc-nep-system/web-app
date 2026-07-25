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
    class="inline-flex items-center justify-center gap-2 bg-[#0F5A4D] hover:bg-[#0c483d] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap"
    style="color: white !important;"
  >
    <span class="font-bold text-sm">+</span>
    <span class="text-white font-bold" style="color: white !important;">New programme entry</span>
  </button>
</template>
