
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