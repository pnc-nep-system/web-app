<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ActivityItemCard from './ActivityItemCard.vue'
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps<{
  modelValue?: { selected: string[]; primary: string[]; aiText: string; inclusions?: any; educationLevels?: any }
}>()

const store = useProgrammeActivitiesStore()
const accordion = useCategoriesStore()

const inputMode = ref<'text' | 'url' | 'file'>('text')
const websiteUrl = ref('')
const isFetchingUrl = ref(false)
const uploadedFileName = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileLoading = ref(false)

onMounted(async () => {
  await accordion.loadCategories()
  if (props.modelValue && store.selected.length === 0) {
    store.initFromPayload(props.modelValue)
  }
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadedFileName.value = file.name
  fileLoading.value = true

  try {
    if (file.name.endsWith('.txt')) {
      const text = await file.text()
      store.aiText = text
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      store.aiText = result.value
    } else {
      // Fallback for other document types
      const text = await file.text()
      store.aiText = text
    }
  } catch (err) {
    console.error('Failed to parse uploaded file:', err)
  } finally {
    fileLoading.value = false
  }
}

async function fetchWebsiteUrl() {
  if (!websiteUrl.value.trim()) return
  isFetchingUrl.value = true
  try {
    // Populate url text into aiText for AI analysis
    store.aiText = `[Content from website: ${websiteUrl.value}]\n` + store.aiText
    await store.suggestActivities()
  } catch (err) {
    console.error('Failed to fetch URL:', err)
  } finally {
    isFetchingUrl.value = false
  }
}

function validate() {
  return store.validate()
}

function getData() {
  return store.getData()
}

defineExpose({ validate, getData })
</script>

<template>
  <div class="space-y-4" @click="store.clearError">

    <!-- Validation error banner -->
    <div
      v-if="store.showError"
      class="flex items-center justify-between gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 cursor-pointer shadow-sm animate-fade-in"
      @click.stop="store.clearError"
    >
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ store.errorMessage || 'Please select at least one activity before continuing.' }}</span>
      </div>
      <button type="button" class="text-red-500 hover:text-red-800 transition-colors p-1" @click.stop="store.clearError">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- AI-assisted completion panel -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="text-sm font-bold text-gray-800">AI-assisted completion</span>
        </div>

        <!-- Mode Buttons: Text / Website URL / Upload File -->
        <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            @click="inputMode = 'text'"
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
            :class="inputMode === 'text' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'"
          >
             Paste Text
          </button>
          <button
            type="button"
            @click="inputMode = 'url'"
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
            :class="inputMode === 'url' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'"
          >
             Website URL
          </button>
          <button
            type="button"
            @click="inputMode = 'file'"
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
            :class="inputMode === 'file' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'"
          >
             Upload File
          </button>
        </div>
      </div>

      <p class="text-xs text-gray-500 mb-3 leading-relaxed hidden sm:block">
        Provide a description of your programme via text, website URL, or proposal document file, and the system will suggest activity tags.
      </p>

      <!-- MODE 1: Direct Text Area -->
      <div v-if="inputMode === 'text'">
        <textarea
          v-model="store.aiText"
          rows="3"
          placeholder="e.g. We provide scholarships and mentoring to help girls stay enrolled through lower secondary school in rural Kampong Cham..."
          class="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700 placeholder-gray-400"
        />
      </div>

      <!-- MODE 2: Website URL -->
      <div v-else-if="inputMode === 'url'" class="space-y-2">
        <div class="flex items-center gap-2">
          <input
            v-model="websiteUrl"
            type="url"
            placeholder="https://example-ngo.org/programmes/girls-education"
            class="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700"
          />
          <button
            type="button"
            @click="fetchWebsiteUrl"
            :disabled="isFetchingUrl || !websiteUrl.trim()"
            class="px-3.5 py-2 text-xs font-semibold bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            {{ isFetchingUrl ? 'Fetching...' : 'Fetch URL' }}
          </button>
        </div>
        <textarea
          v-model="store.aiText"
          rows="2"
          placeholder="Extracted website content will appear here..."
          class="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg resize-y text-gray-700 placeholder-gray-400"
        />
      </div>

      <!-- MODE 3: Upload File -->
      <div v-else-if="inputMode === 'file'" class="space-y-3">
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          class="hidden"
          @change="onFileUpload"
        />
        <div
          @click="triggerFileInput"
          class="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/20 transition-all rounded-xl p-5 text-center cursor-pointer group"
        >
          <svg class="w-8 h-8 mx-auto text-slate-400 group-hover:text-teal-600 mb-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span class="text-xs font-semibold text-slate-700 group-hover:text-teal-800 block">
            Click to upload proposal document (.docx, .txt, .pdf)
          </span>
          <span v-if="uploadedFileName" class="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            📄 {{ uploadedFileName }}
          </span>
        </div>

        <textarea
          v-model="store.aiText"
          rows="2"
          placeholder="Extracted file text content will appear here..."
          class="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg resize-y text-gray-700 placeholder-gray-400"
        />
      </div>

      <button
        type="button"
        @click="store.suggestActivities"
        class="mt-3 px-4 py-2 text-xs font-bold text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-colors cursor-pointer shadow-xs"
      >
        Suggest activities
      </button>
    </div>

    <!-- Instruction -->
    <p class="text-sm text-gray-500 px-1 hidden sm:block">
      Select every activity item this programme delivers.
      Mark your most important activities as <strong class="text-gray-700">primary</strong> — NEP's coordination matching prioritises these.
    </p>

    <!-- Loading Spinner -->
    <div v-if="accordion.isLoading" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
      <svg class="animate-spin h-8 w-8 text-teal-800 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span class="text-sm font-medium text-gray-500">Loading activity taxonomy...</span>
    </div>

    <!-- B1–B9 Accordions -->
    <div v-else class="space-y-3">
      <div
        v-for="cat in accordion.categories"
        :key="cat.code"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <!-- Accordion Category Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors bg-slate-50/50 cursor-pointer select-none"
          @click="accordion.toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-800">{{ cat.code }} · {{ cat.label }}</span>
            <!-- Selection badge -->
            <span
              v-if="accordion.categoryCount(cat.code) > 0"
              class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-teal-800 text-white shadow-sm"
            >
              {{ accordion.categoryCount(cat.code) }}
            </span>
          </div>
          <!-- Chevron -->
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            :class="accordion.openCategories.has(cat.code) ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Category Body (Subcategories List) -->
        <div v-if="accordion.openCategories.has(cat.code)" class="border-t border-gray-100 px-5 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
          <div
            v-for="sub in cat.subcategories"
            :key="sub.code"
            class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <!-- Accordion Subcategory Header -->
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 transition-colors bg-slate-50/30 cursor-pointer select-none"
              @click="accordion.toggleSubcategory(sub.code)"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-slate-700">{{ sub.code }} · {{ sub.label }}</span>
                <!-- Selection badge -->
                <span
                  v-if="accordion.subcategoryCount(sub.code) > 0"
                  class="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[9px] font-bold bg-teal-600 text-white shadow-sm"
                >
                  {{ accordion.subcategoryCount(sub.code) }}
                </span>
              </div>
              <svg
                class="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200"
                :class="accordion.openSubcategories.has(sub.code) ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Subcategory Body (Items List) -->
            <div v-if="accordion.openSubcategories.has(sub.code)" class="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
              <ActivityItemCard
                v-for="item in sub.items"
                :key="item.code"
                :item="item"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
