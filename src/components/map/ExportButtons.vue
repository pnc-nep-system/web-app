<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { exportMapEntriesCsv, exportMapEntriesPdf } from '@/api/map.api'
import { useMapStore } from '@/stores/map'

const mapStore = useMapStore()
const exportingCsv = ref(false)
const exportingPdf = ref(false)

async function handleExportCsv() {
  try {
    exportingCsv.value = true
    await exportMapEntriesCsv(mapStore.filters)
  } catch (error) {
    console.error('CSV export failed:', error)
  } finally {
    exportingCsv.value = false
  }
}

async function handleExportPdf() {
  try {
    exportingPdf.value = true
    await exportMapEntriesPdf(mapStore.filters)
  } catch (error) {
    console.error('PDF export failed:', error)
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5">
    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="exportingCsv"
      class="shrink-0"
      @click="handleExportCsv"
    >
      <BaseIcon name="download" size="16" />
      {{ exportingCsv ? 'Exporting...' : 'Export CSV' }}
    </BaseButton>

    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="exportingPdf"
      class="shrink-0"
      @click="handleExportPdf"
    >
      <BaseIcon name="file" size="16" />
      {{ exportingPdf ? 'Exporting...' : 'PDF report' }}
    </BaseButton>
  </div>
</template>
