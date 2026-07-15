Step 1: Add <KeepAlive> to prevent component destruction on navigation
Files: src/App.vue
Changes:
- Wrap <RouterView /> with <KeepAlive>
<template>
  <KeepAlive>
    <RouterView />
  </KeepAlive>
  <ToastHost />
</template>
Commit message:
perf: wrap RouterView with KeepAlive to prevent component destruction on navigation
Step 2: Remove duplicate fetchCurrentUser() call from DashboardView
Files: src/views/member/DashboardView.vue
Changes:
- Remove lines 200-207 (the entire onMounted block that calls auth.fetchCurrentUser()) since the router guard already calls it
- Remove import { onMounted } from 'vue' on line 183 (no longer needed)
- Remove import { useAuthStore } from '@/stores/auth' on line 191 (no longer needed)
- Remove const auth = useAuthStore() on line 197 (no longer needed)
Commit message:
perf: remove duplicate fetchCurrentUser call in DashboardView (already called by router guard)
Step 3: Debounce taxonomy search input
Files: src/views/staff/TaxonomyAdminView.vue
Changes:
- Replace searchQuery with a debounced approach:
1. Add a raw input ref searchInput = ref('') (v-model on the input points to this)
2. Create a debounced computed or watcher that updates searchQuery after 300ms
3. Use import { ref, watch } from 'vue' (computed is no longer needed for this)
Add this after line 27 (const searchQuery = ref('')):
const searchInput = ref('')
watch(searchInput, (val) => {
  const timeout = setTimeout(() => { searchQuery.value = val }, 300)
  // store timeout ref for cleanup
})
Actually, simpler approach - just debounce the searchInput to searchQuery:
const searchInput = ref('')
let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(searchInput, (val) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => { searchQuery.value = val }, 300)
})
- Change v-model="searchQuery" on line 320 to v-model="searchInput"
- Remove import { computed, onMounted, reactive, ref } from 'vue' — change computed to watch import
Wait, filteredCategories is still a computed — we keep that. We just debounce what goes into searchQuery. So we need both computed and watch.
The import line should keep computed and add watch:
import { computed, onMounted, reactive, ref, watch } from 'vue'
Commit message:
perf: debounce taxonomy search input to prevent re-computation on every keystroke
Step 4: Lazy-load Pusher/Echo to reduce bundle size
Files: src/realtime/echo.ts, src/realtime/index.ts
Changes:
- In src/realtime/echo.ts, replace static top-level imports with dynamic imports inside getEcho():
// Remove lines 1-2: import Echo from "laravel-echo"; import Pusher from "pusher-js";
// Remove line 10-11: window.Pusher = Pusher;

export async function getEcho() {
  if (echo) return echo;

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  window.Pusher = Pusher;
  // rest of the function stays the same
}
- Remove declare global block (lines 9-13) since Pusher type is imported dynamically
Actually, keep Window interface but adjust. Let me think...
Actually the cleanest approach:
let echo: any = null;

export async function getEcho() {
  if (echo) return echo;

  const Echo = (await import("laravel-echo")).default;
  const Pusher = (await import("pusher-js")).default;

  window.Pusher = Pusher;

  echo = new Echo({ /* ... same config ... */ });
  window.Echo = echo;
  return echo;
}
Remove the declare global block, the static imports, and let echo: Echo<"reverb"> | null becomes let echo: any | null.
- In src/realtime/index.ts, make connectRealtimeForRole async and await getEcho():
export async function connectRealtimeForRole(role?: string) {
  if (role !== 'nep_admin' && role !== 'nep_coordinator') return
  if (subscribed) return

  const taxonomy = useTaxonomyStore()
  const echo = await getEcho()
  // ... rest stays the same
}
Commit message:
perf: lazy-load pusher-js and laravel-echo to reduce initial bundle size by ~60KB
Step 5: Add v-memo to taxonomy tree table rows
Files: src/views/staff/TaxonomyAdminView.vue
Changes:
- Add v-memo to the category loop (line 343):
v-for="cat in filteredCategories"
:key="cat.code"
v-memo="[cat.code, cat.label, isCategoryExpanded(cat.code), filteredCategories.length]"
- Add v-memo to subcategory loop (line 399):
v-for="sub in cat.subcategories"
:key="sub.code"
v-memo="[sub.code, sub.label, sub.items.length, isSubcategoryExpanded(sub.code)]"
- Add v-memo to item rows (line 467):
v-for="item in sub.items"
:key="item.code"
v-memo="[item.id, item.code, item.label, item.status, item.version, item.usedCount, renameForm.key]"
Commit message:
perf: add v-memo directives to taxonomy tree to skip re-rendering unchanged rows
Step 6: Add build optimization to vite config
Files: vite.config.ts
Changes:
- Add build section with manual chunks, sourcemap disabled, and conditional vueDevTools:
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : []),
  ],
  resolve: { /* ... same ... */ },
  server: { /* ... same ... */ },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-http': ['axios'],
          'vendor-realtime': ['pusher-js', 'laravel-echo'],
        },
      },
    },
  },
})
Commit message:
perf: add build optimizations - manual chunk splitting, disable sourcemaps, dev-only devtools
Step 7: Strip console statements in production builds
Files: vite.config.ts
Changes:
After the previous step, the build config should already have the build section. Add terser or configure esbuild to drop console statements:
Option 1 (using esbuild, simpler, already the default minifier):
build: {
  sourcemap: false,
  minify: 'esbuild',
  esbuild: {
    drop: ['console', 'debugger'],
  },
  rollupOptions: { output: { manualChunks: { ... } } },
}
Commit message:
perf: strip console.log and console.error from production builds
Step 8: Optimize large PNG logo
Files: src/assets/images/logoes/NEP-logoo.png
Changes:
- Either compress the PNG using a tool like sharp or imagemagick, or convert to SVG
- Since this is binary, you'd need to use an external tool. Suggestion: install sharp and run:
npx sharp-cli input.png -o output.webp
Or manually run the image through an optimizer like https://squoosh.app
Commit message:
perf: optimize NEP-logoo.png by converting to WebP (98KB -> ~15KB)
Summary of steps order
Step	Impact	Effort
1. KeepAlive	High	2 lines
2. Remove duplicate fetchCurrentUser	High	Remove ~8 lines
3. Debounce taxonomy search	High	~10 lines
4. Lazy-load Pusher/Echo	High	~15 lines
5. v-memo on taxonomy tree	Medium	3 attributes
6. Build optimization	Medium	~15 lines
7. Strip console	Low	2 lines
8. Optimize PNG	Medium	External tool
Want me to proceed with implementing these?