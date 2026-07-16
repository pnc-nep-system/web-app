import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgrammeKeywordsStore = defineStore('programmeKeywords', () => {
  const keyword1 = ref('')
  const keyword2 = ref('')
  const keyword3 = ref('')
  const keyword4 = ref('')
  const keyword5 = ref('')
  
  const keywordsError = ref<string | null>(null)

  const keywordsData = computed(() => {
    return [
      keyword1.value.trim(),
      keyword2.value.trim(),
      keyword3.value.trim(),
      keyword4.value.trim(),
      keyword5.value.trim()
    ].filter(k => k !== '')
  })

  function initKeywords(list: string[]) {
    keyword1.value = list?.[0] || ''
    keyword2.value = list?.[1] || ''
    keyword3.value = list?.[2] || ''
    keyword4.value = list?.[3] || ''
    keyword5.value = list?.[4] || ''
  }

  function reset() {
    keyword1.value = ''
    keyword2.value = ''
    keyword3.value = ''
    keyword4.value = ''
    keyword5.value = ''
    keywordsError.value = null
  }

  return {
    keyword1,
    keyword2,
    keyword3,
    keyword4,
    keyword5,
    keywordsData,
    keywordsError,
    initKeywords,
    reset,
  }
})
