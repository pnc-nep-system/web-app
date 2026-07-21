<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/api/policy.api'
import api from '@/api/axios'

const props = defineProps<{
  show: boolean
  document: PolicyDocument | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isPdf = computed(() => props.document?.file_url?.toLowerCase().includes('.pdf'))
const isWord = computed(() =>
  props.document?.file_url?.toLowerCase().includes('.doc') || props.document?.file_url?.toLowerCase().includes('.docx')
)

const fileObjectUrl = ref<string | null>(null)
const fileLoading = ref(false)
const fileError = ref(false)
const fileErrorMsg = ref('')

// --- DOCX rendering state ---
const docxHtml = ref<string | null>(null)
const docxError = ref(false)
const docxLoading = ref(false)
const docxErrorMsg = ref('')

async function loadFile() {
  if (!props.document?.id) return

  fileLoading.value = true
  fileError.value = false
  fileErrorMsg.value = ''
  fileObjectUrl.value = null
  docxHtml.value = null
  docxError.value = false
  docxErrorMsg.value = ''

  try {
    const response = await api.get(`/policy-documents/${props.document.id}/file`, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], {
      type: (response.headers['content-type'] as string) || 'application/octet-stream',
    })
    
    fileObjectUrl.value = URL.createObjectURL(blob)

    if (isWord.value) {
      await loadDocx(blob)
    }
  } catch (error: any) {
    fileError.value = true
    fileErrorMsg.value = error?.message || 'Failed to load document'
  } finally {
    fileLoading.value = false
  }
}

async function loadDocx(blob: Blob) {
  docxLoading.value = true
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await blob.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    docxHtml.value = result.value || '<p style="color:#6b7280">Document is empty.</p>'
  } catch (e: any) {
    const msg = e?.message ?? String(e)
    console.error('[PolicyDocumentPreview] Failed to render DOCX:', msg)
    docxErrorMsg.value = msg
    docxError.value = true
  } finally {
    docxLoading.value = false
  }
}

// Load when modal opens and file is a Word doc or PDF
watch(
  () => props.show,
  (val) => {
    if (val && props.document?.file_url) {
      loadFile()
    } else if (!val) {
      if (fileObjectUrl.value) {
        URL.revokeObjectURL(fileObjectUrl.value)
        fileObjectUrl.value = null
      }
      docxHtml.value = null
      docxError.value = false
      fileError.value = false
    }
  }
)

async function downloadDocument() {
  if (!props.document?.id) return
  
  try {
    const response = await api.get(`/policy-documents/${props.document.id}/file`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const filename = props.document.file_url?.split('/').pop() || props.document.title || 'document'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download document:', error)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="modal-backdrop" @click="emit('close')">
        <div
          class="modal-panel !max-w-[900px] !p-0 overflow-hidden flex flex-col !max-h-[95vh] h-[95vh]"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <BaseIcon name="file" size="20" class="text-teal-700" />
              </div>
              <div>
                <h2 class="text-[15px] font-bold text-gray-900">{{ document?.title || 'Document Preview' }}</h2>
                <p class="text-[12px] text-gray-500 mt-0.5">
                  {{ document?.file_url || 'No file attached' }}
                  <span v-if="document?.version"> • v{{ document.version }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="document?.file_url"
                @click="downloadDocument"
                class="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-colors hover:bg-gray-100"
                title="Download"
              >
                <BaseIcon name="download" size="18" />
              </button>
              <button
                @click="emit('close')"
                class="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition-colors hover:bg-gray-100"
              >
                <BaseIcon name="x" size="20" />
              </button>
            </div>
          </div>

          <!-- Document Body -->
          <div class="flex-1 overflow-hidden bg-gray-200/60 flex flex-col">

            <!-- Global Loading for File Fetch -->
            <div v-if="fileLoading" class="flex flex-col items-center justify-center h-full gap-3 text-gray-400 bg-white">
              <svg class="animate-spin w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p class="text-[13px]">Downloading document…</p>
            </div>

            <div v-else-if="fileError" class="flex flex-col items-center justify-center h-full gap-3 text-center p-6 bg-white">
              <BaseIcon name="alert" size="32" class="text-red-400" />
              <p class="text-[14px] font-semibold text-gray-700">Could not load document</p>
              <p class="text-[12px] text-gray-400 max-w-sm break-all">
                {{ fileErrorMsg || 'Unknown error' }}
              </p>
              <button
                @click="downloadDocument"
                class="mt-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-[13px] font-semibold hover:bg-teal-800 transition"
              >Download file</button>
            </div>

            <!-- PDF: embed directly in browser -->
            <embed
              v-else-if="isPdf && fileObjectUrl"
              :src="fileObjectUrl"
              type="application/pdf"
              class="w-full h-full border-none"
            />

            <!-- DOCX: rendered via mammoth -->
            <div v-else-if="isWord" class="flex-1 overflow-y-auto bg-white p-8 md:p-12">
              <!-- Loading -->
              <div v-if="docxLoading" class="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <svg class="animate-spin w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p class="text-[13px]">Rendering document…</p>
              </div>

              <!-- Error -->
              <div v-else-if="docxError" class="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
                <BaseIcon name="alert" size="32" class="text-red-400" />
                <p class="text-[14px] font-semibold text-gray-700">Could not render document</p>
                <p class="text-[12px] text-gray-400 max-w-sm break-all">
                  <span class="font-medium text-gray-500">Error:</span> {{ docxErrorMsg || 'Unknown error' }}
                </p>
                <button
                  @click="downloadDocument"
                  class="mt-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-[13px] font-semibold hover:bg-teal-800 transition"
                >Download file</button>
              </div>

              <!-- Rendered HTML -->
              <article
                v-else-if="docxHtml"
                class="prose prose-sm max-w-none docx-content"
                v-html="docxHtml"
              />
            </div>

            <!-- Unknown file or no file attached -->
            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white"
            >
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BaseIcon name="file" size="32" class="text-gray-400" />
              </div>
              <h3 class="text-[16px] font-semibold text-gray-700 mb-1">
                {{ document?.file_url ? 'Preview not available' : 'No file attached' }}
              </h3>
              <p class="text-[13px] text-gray-400 max-w-xs">
                {{ document?.file_url ? 'This file type cannot be previewed in the browser.' : 'This policy document doesn\'t have a file uploaded yet.' }}
              </p>
              <button
                v-if="document?.file_url"
                @click="downloadDocument"
                class="mt-4 px-4 py-2 bg-teal-700 text-white rounded-lg text-[13px] font-semibold hover:bg-teal-800 transition"
              >Download file</button>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Basic typography for rendered DOCX content */
.docx-content :deep(h1) { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.docx-content :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
.docx-content :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
.docx-content :deep(p)  { margin: 0.5rem 0; line-height: 1.7; color: #374151; font-size: 14px; }
.docx-content :deep(ul),
.docx-content :deep(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
.docx-content :deep(li) { margin: 0.25rem 0; line-height: 1.6; font-size: 14px; }
.docx-content :deep(table) { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.docx-content :deep(td),
.docx-content :deep(th) { border: 1px solid #E5E7EB; padding: 6px 10px; font-size: 13px; }
.docx-content :deep(strong) { font-weight: 600; }
</style>
