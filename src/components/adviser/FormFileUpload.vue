<!-- Drag-and-drop / click-to-browse file picker for PDF/Word documents -->
<script setup lang="ts">
import { ref } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const props = defineProps<{
  modelValue: File | null
  error?: string
  compact?: boolean
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
    <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Document</label>

    <!-- Drop zone -->
    <div
      class="border rounded-lg flex flex-col items-center justify-center cursor-pointer transition relative"
      :class="[
        compact ? 'py-5 px-6 gap-1' : 'py-12 px-8 gap-2',
        isDragging
          ? 'border-teal-500 bg-teal-50/50'
          : error
            ? 'border-red-400 bg-red-50/50'
            : 'border-[var(--line)] bg-white hover:border-[#125B4D] hover:bg-gray-50/30',
      ]"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <!-- No file selected -->
      <template v-if="!modelValue">
        <BaseIcon name="upload" size="26" class="text-gray-400 mb-2" />
        <p class="text-[15px] text-gray-500 text-center">
          Drop a PDF or Word document, or
          <span class="text-[#0E5B4D] font-medium underline underline-offset-[3px] hover:text-[#0C4A3F]">browse files</span>
        </p>
        <p class="text-[14px] text-gray-400 mt-1">Accepts .pdf, .doc, .docx — max 50 MB</p>
      </template>

      <!-- File selected -->
      <template v-else>
        <BaseIcon name="check" size="28" class="text-[#125B4D] mb-1" />
        <p class="text-[15px] text-gray-900 font-medium truncate max-w-xs">{{ modelValue.name }}</p>
      </template>
    </div>

    <input
      id="fileInput"
      type="file"
      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      class="hidden"
      @change="onFileInputChange"
    />

    <p v-if="sizeError" class="mt-2 text-[13px] text-red-500">{{ sizeError }}</p>
    <p v-else-if="error" class="mt-2 text-[13px] text-red-500">{{ error }}</p>
    <p class="mt-2.5 text-[13px] text-gray-400 tracking-wide">
      Files are read for their name only in this prototype — content is not actually parsed or uploaded anywhere.
    </p>
  </div>
</template>
