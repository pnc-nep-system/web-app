<script setup>
</script>

<template>
  <div class="flex min-h-screen bg-teal-900">
    <div class="flex-[1.1] hidden lg:flex flex-col justify-center px-16 py-15 text-white relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(217,119,6,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_40%)]"></div>
      <div class="relative max-w-[440px]">
        <div class="w-10 h-10 rounded-[10px] bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center font-bold text-[15px] mb-5.5">NEP</div>
        <h1 class="text-[30px] leading-tight font-semibold text-white">Tell NEP what your organisation does — once, kept current.</h1>
        <p class="text-[14px] text-white/65 mt-3.5 leading-7">Your programme entry feeds the shared map NEP uses to spot overlap, avoid duplication, and connect you with organisations doing complementary work.</p>
        <div class="flex gap-6 mt-9">
          <div><b class="block font-lexend text-[22px]">5</b><span class="text-[11.5px] text-white/55 block">sections per entry</span></div>
          <div><b class="block font-lexend text-[22px]">18mo</b><span class="text-[11.5px] text-white/55 block">review cycle</span></div>
          <div><b class="block font-lexend text-[22px]">1</b><span class="text-[11.5px] text-white/55 block">account per organisation</span></div>
        </div>
      </div>
    </div>
    
    <div class="w-full lg:w-[440px] bg-white flex flex-col justify-center p-14 flex-shrink-0">
      <h2 class="text-[20px] font-semibold mb-2">Organisation sign in</h2>
      <p class="text-[13px] text-gray-500 mb-6.5">Accounts are organisational, not individual — staff turnover never costs you access. NEP staff use a separate portal.</p>

      <form @submit.prevent class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-[12.5px] font-semibold text-gray-700">Organisation email</label>
          <input type="email" placeholder="programmes@riverkids.org" class="w-full border border-gray-300 rounded-lg p-2.5 text-[13.3px] focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600" />
        </div>
        <div class="space-y-1.5">
          <label class="block text-[12.5px] font-semibold text-gray-700">Password</label>
          <input type="password" placeholder="••••••••" class="w-full border border-gray-300 rounded-lg p-2.5 text-[13.3px] focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600" />
        </div>

        <button type="submit" class="w-full flex justify-center bg-teal-800 text-white font-semibold text-[13px] p-2.5 rounded-lg hover:bg-teal-700 transition-colors">Sign in</button>
      </form>

      <div class="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4 text-[11.8px] text-amber-700">
        <b class="block text-[12.5px] mb-1">Demo accounts</b>
        <p class="opacity-90 leading-relaxed">Working prototype backed by a local JSON data store — no real backend. Try any of the three:</p>
        <div class="flex gap-2 mt-2.5 flex-wrap">
          <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-[12.3px] hover:border-gray-400 transition-colors">Riverkids Cambodia</button>
          <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-[12.3px] hover:border-gray-400 transition-colors">ChildWell Cambodia</button>
          <button class="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 font-semibold text-[12.3px] hover:border-gray-400 transition-colors">New Hope Learning (no entries yet)</button>
        </div>
        <p class="mt-2.5 text-gray-400">Password for every demo account: <code class="bg-black/5 px-1.5 py-0.5 rounded">demo1234</code></p>
      </div>
    </div>
  </div>
</template>
