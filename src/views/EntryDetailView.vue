<script setup lang="ts">
import { toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useEntryDetail } from '@/composables/useEntryDetail'
import AppShell from '@/components/AppShell.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EntryDetailHeader from '@/components/entry_detail/EntryDetailHeader.vue'
import EntryProgrammeIdentity from '@/components/entry_detail/EntryProgrammeIdentity.vue'
import EntryActivitiesList from '@/components/entry_detail/EntryActivitiesList.vue'
import EntryGovernmentAgreements from '@/components/entry_detail/EntryGovernmentAgreements.vue'
import EntryGeographicCoverage from '@/components/entry_detail/EntryGeographicCoverage.vue'
import EntryKeywords from '@/components/entry_detail/EntryKeywords.vue'
import EntryCoordinationNote from '@/components/entry_detail/EntryCoordinationNote.vue'
import RelatedEntriesList from '@/components/entry_detail/RelatedEntriesList.vue'

const props = defineProps({ id: String })
const router = useRouter()

const { entry, marking, status, activityRows, relatedEntries, markVerified, analyseInAdviser, organisations, auth }
  = useEntryDetail(toRef(props, 'id'))
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center gap-2 text-sm min-w-0">
        <span class="text-gray-400">NEP</span>
        <span class="text-gray-300">&gt;</span>
        <span class="text-gray-700 font-medium truncate">Programme Map</span>
      </div>
    </template>

    <div v-if="!entry">
      <EmptyState icon="search" title="Entry not found" message="It may have been removed, or the link is out of date.">
        <template #action><BaseButton variant="secondary" size="sm" @click="router.push({ name: 'admin-map' })">← Back to
            map</BaseButton></template>
      </EmptyState>
    </div>

    <template v-else>
      <EntryDetailHeader
        :entry
        :status
        :marking
        :is-admin="auth.isAdmin"
        @mark-verified="markVerified"
        @back="router.push({ name: 'admin-map' })"
      />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 space-y-6">
          <EntryProgrammeIdentity :entry />
          <EntryActivitiesList :activity-rows="activityRows" />
          <EntryGovernmentAgreements :agreements="entry.governmentAgreements" />
        </div>

        <div class="lg:col-span-5 space-y-6">
          <EntryGeographicCoverage :provinces="entry.provinces" :other-countries="entry.otherCountries" />
          <EntryKeywords :keywords="entry.keywords" />
          <EntryCoordinationNote
            :has-overlaps="relatedEntries.length > 0"
            :overlap-count="relatedEntries.length"
            @analyse="analyseInAdviser"
          />
        </div>
      </div>

      <RelatedEntriesList
        :entries="relatedEntries"
        :org-name-of="organisations.nameOf"
        :org-by-id="organisations.byId"
        @navigate="(id: string) => router.push({ name: 'entry-detail', params: { id } })"
      />
    </template>
  </AppShell>
</template>
