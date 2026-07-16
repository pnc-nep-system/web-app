<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()
</script>

<template>
  <div 
    :class="[
      'p-4 border rounded-xl flex gap-3 text-xs shadow-sm transition-all duration-300',
      store.isNavigationRestricted
        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
    ]"
  >
    <span class="shrink-0 mt-0.5">
      <!-- Warning Icon -->
      <svg 
        v-if="store.isNavigationRestricted" 
        class="w-4 h-4 text-amber-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <!-- Unlocked Check Icon -->
      <svg 
        v-else 
        class="w-4 h-4 text-emerald-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
    <div>
      <p 
        class="font-semibold mb-0.5"
        :class="store.isNavigationRestricted ? 'text-amber-950' : 'text-emerald-950'"
      >
        {{ store.isNavigationRestricted ? 'Navigation Restricted' : 'Navigation Unlocked' }}
      </p>
      <p class="leading-relaxed opacity-90">
        {{ 
          store.isNavigationRestricted 
            ? 'Complete Step 1: Programme identity (Name and Start year) to freely jump to other steps.' 
            : 'Step 1 complete! You can now freely click and jump to any step in the sidebar.' 
        }}
      </p>
    </div>
  </div>
</template>
