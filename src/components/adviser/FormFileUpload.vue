<!-- Drag-and-drop / click-to-browse file picker for PDF/Word documents -->
<script setup lang="ts">
import { ref } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const props = defineProps<{
  modelValue: File | null
  error?: string
  compact?: boolean
  hideLabel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
}>()

const isDragging = ref(false)
const sizeError = ref('')

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function isValidFile(f: File) {
  return (
    ALLOWED_TYPES.includes(f.type) ||
    f.name.endsWith('.pdf') ||
    f.name.endsWith('.doc') ||
    f.name.endsWith('.docx')
  )
}

function setFile(f: File) {
  if (!isValidFile(f)) {
    emit('update:modelValue', null)
    return
  }
  if (f.size > MAX_SIZE_BYTES) {
    emit('update:modelValue', null)
    sizeError.value = `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`
    return
  }
  sizeError.value = ''
  emit('update:modelValue', f)
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) setFile(input.files[0])
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

function triggerFileInput() {
  document.getElementById('fileInput')?.click()
}
</script>

<template>
  <div>
    <label v-if="!hideLabel" class="block text-[14.5px] font-bold text-slate-900 mb-2">Document</label>

    <!-- Drop zone -->
    <div
      class="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group overflow-hidden"
      :class="[
        compact ? 'py-5 px-6 gap-1' : 'py-10 px-8 gap-2',
        isDragging
          ? 'border-[#0F5A4D] bg-[#0F5A4D]/10 scale-[1.005]'
          : error
            ? 'border-red-400 bg-red-50/40'
            : modelValue
              ? 'border-[#0F5A4D]/40 bg-[#F4FBFA]'
              : 'border-slate-200 bg-slate-50/40 hover:border-[#0F5A4D] hover:bg-[#F4FBFA]/60',
      ]"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <!-- No file selected -->
      <template v-if="!modelValue">
        <div class="w-12 h-12 rounded-xl bg-[#0F5A4D]/10 text-[#0F5A4D] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
          <BaseIcon name="upload" size="22" />
        </div>
        <p class="text-sm font-semibold text-slate-700 text-center">
          Drop your document here, or
          <span class="text-[#0F5A4D] font-bold underline underline-offset-4 hover:text-[#0c483d]">browse files</span>
        </p>
        <p class="text-[14px] text-gray-400 mt-1">Accepts .pdf, .doc, .docx — max 50 MB</p>
      </template>

      <!-- File selected -->
      <template v-else>
        <div class="w-12 h-12 rounded-xl bg-[#0F5A4D] text-white flex items-center justify-center mb-1 shadow-sm">
          <BaseIcon name="check" size="24" />
        </div>
        <div class="text-center min-w-0 max-w-sm">
          <p class="text-sm text-slate-900 font-bold truncate">{{ modelValue.name }}</p>
          <p class="text-xs text-[#0F5A4D] font-semibold mt-0.5">Click to replace file</p>
        </div>
      </template>
    </div>

    <input
      id="fileInput"
      type="file"
      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      class="hidden"
      @change="onFileInputChange"
    />

    <p v-if="sizeError" class="mt-2 text-xs text-red-500 font-medium">{{ sizeError }}</p>
    <p v-else-if="error" class="mt-2 text-xs text-red-500 font-medium">{{ error }}</p>
    <p class="mt-2 text-xs text-slate-400">
      Files are read for their name only in this prototype — content is not actually parsed or uploaded anywhere.
    </p>
  </div>
</template>
