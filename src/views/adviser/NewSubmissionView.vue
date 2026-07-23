<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import AdviserSubmissionForm from '@/components/adviser/AdviserSubmissionForm.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', 'New submission']" />
        
      <!-- Right Header Elements -->
      <div class="flex items-center gap-3 ml-auto">
        <!-- Search Bar -->
          <div class="relative hidden md:block">
            <svg class="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search programmes, organisations..." 
              class="pl-9 pr-4 py-2 bg-gray-50 rounded-[8px] text-[13px] text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#125B4D] w-[300px] border-none"
            />
          </div>
          
          <!-- Notification Bell -->
          <button class="relative p-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-[8px] transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <span class="absolute top-[6px] right-[6px] w-[7px] h-[7px] bg-[#E87B35] rounded-full border border-white"></span>
          </button>
        </div>
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
