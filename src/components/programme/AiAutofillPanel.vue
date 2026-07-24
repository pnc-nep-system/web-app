<script setup lang="ts">
import { ref } from 'vue'
import { useAiAutofillStore } from '@/stores/aiAutofill'
import { memberApi } from '@/api/member.api'

const store = useAiAutofillStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.name.endsWith('.doc')) {
    store.error = 'Old .doc format is not supported. Please save as .docx and try again.'
    return
  }

  store.uploadedFileName = file.name

  if (file.name.endsWith('.txt')) {
    store.text = await file.text()
    store.pendingFile = null
    store.inputMode = 'text'
  } else if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    store.text = result.value
    store.pendingFile = null
    store.inputMode = 'text'
  } else if (file.name.endsWith('.pdf')) {
    store.pendingFile = file
    store.text = ''
  }
}

async function fetchUrl() {
  await store.fetchUrl()
}
</script>

<template>
  <div class="bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-200 rounded-xl p-5 mb-4 shadow-sm">
    <div class="flex items-center gap-2 mb-3">
      <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span class="text-sm font-bold text-gray-800">AI Autofill — Activities, Geography, Agreements & Keywords</span>
    </div>

    <p class="text-xs text-gray-500 mb-3">
      Provide your programme description once and AI will suggest all 4 sections simultaneously.
    </p>

    <!-- Mode tabs -->
    <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs font-semibold mb-3">
      <button type="button" @click="store.inputMode = 'text'"
        class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
        :class="store.inputMode === 'text' ? 'bg-teal-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
        Paste Text
      </button>
      <button type="button" @click="store.inputMode = 'url'"
        class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
        :class="store.inputMode === 'url' ? 'bg-teal-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
        Website URL
      </button>
      <button type="button" @click="store.inputMode = 'file'"
        class="px-2.5 py-1 rounded-md transition-all cursor-pointer"
        :class="store.inputMode === 'file' ? 'bg-teal-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'">
        Upload File
      </button>
    </div>

    <!-- Text mode -->
    <div v-if="store.inputMode === 'text'">
      <textarea v-model="store.text" rows="3" placeholder="Paste your programme description here..."
        class="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700 placeholder-gray-400 bg-white" />
    </div>

    <!-- URL mode -->
    <div v-else-if="store.inputMode === 'url'" class="space-y-2">
      <div class="flex items-center gap-2">
        <input v-model="store.url" type="url" placeholder="https://your-ngo.org/programme-page"
          class="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700 bg-white" />
        <button type="button" @click="fetchUrl" :disabled="store.isFetchingUrl || !store.url.trim()"
          class="px-3.5 py-2 text-xs font-semibold bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition disabled:opacity-50 cursor-pointer shrink-0">
          {{ store.isFetchingUrl ? 'Fetching...' : 'Fetch' }}
        </button>
      </div>
      <textarea v-if="store.text" v-model="store.text" rows="2"
        class="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg resize-y text-gray-700 bg-white" />
    </div>

    <!-- File mode -->
    <div v-else-if="store.inputMode === 'file'">
      <input ref="fileInputRef" type="file" accept=".pdf,.docx,.txt" class="hidden" @change="onFileUpload" />
      <div @click="fileInputRef?.click()"
        class="border-2 border-dashed border-amber-200 hover:border-teal-400 bg-white/60 hover:bg-teal-50/20 transition-all rounded-xl p-4 text-center cursor-pointer">
        <svg class="w-7 h-7 mx-auto text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span class="text-xs font-semibold text-slate-600">Click to upload (.pdf, .docx, .txt)</span>
        <span v-if="store.uploadedFileName" class="block mt-1.5 text-[11px] font-bold text-teal-800">
          📄 {{ store.uploadedFileName }}
        </span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
      {{ store.error }}
    </div>

    <!-- Success -->
    <div v-if="store.success" class="mt-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 font-semibold">
      ✓ AI autofill applied — activities, geography, agreements and keywords have been pre-filled. Review and adjust as needed.
    </div>

    <!-- Run button -->
    <button type="button" @click="store.run"
      :disabled="store.isRunning || store.isFetchingUrl"
      class="mt-3 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2">
      <svg v-if="store.isRunning" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ store.isRunning ? 'Running AI autofill…' : '✦ Run AI autofill on all sections' }}
    </button>
  </div>
</template>
