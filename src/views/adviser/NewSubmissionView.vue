<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import AdviserSubmissionForm from '@/components/adviser/AdviserSubmissionForm.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', 'Submit document']" />
    </template>

    <!-- Full-width layout -->
    <div class="pt-8 pb-12">
      <!-- Page heading -->
      <div class="mb-10">
        <h1 class="text-[32px] font-bold text-gray-900 tracking-tight">Submit a document for analysis</h1>
        <p class="mt-2 text-[15px] text-gray-500 tracking-wide">
          The document does not need to be from a member. Submission is recorded for audit purposes only.
        </p>
      </div>

      <AdviserSubmissionForm />
    </div>
  </AppShell>
</template>
