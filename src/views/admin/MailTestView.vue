<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ToastHost from '@/components/ToastHost.vue'
import { usePermission } from '@/composables/usePermission'
import { mailTestService } from '@/services/mailTest.service'
import { useToast } from '@/utils/toast'
import type { MailEncryption, MailTestResponse } from '@/types/mailTest'

const { can } = usePermission()
const router = useRouter()
const toast = useToast()

onMounted(() => {
  if (!can('system.test-email')) {
    router.replace({ name: 'forbidden' })
  }
})

// Every field is optional except `to` — an empty field falls back to
// whatever's live in the backend's .env, so "just fill in a recipient and
// test the current config" is the fast path.
const form = reactive({
  host: '',
  port: null as number | null,
  encryption: '' as MailEncryption | '',
  username: '',
  password: '',
  from_address: '',
  from_name: '',
  to: '',
})

const isSending = ref(false)
const result = ref<MailTestResponse | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})

async function handleSubmit() {
  isSending.value = true
  result.value = null
  fieldErrors.value = {}

  try {
    const response = await mailTestService.send({
      host: form.host || undefined,
      port: form.port ?? undefined,
      encryption: form.encryption || undefined,
      username: form.username || undefined,
      password: form.password || undefined,
      from_address: form.from_address || undefined,
      from_name: form.from_name || undefined,
      to: form.to,
    })
    result.value = response.data
    toast.success(response.data.message)
  } catch (err: any) {
    if (err.response?.status === 422 && err.response.data?.errors) {
      fieldErrors.value = err.response.data.errors
      toast.error('Please correct the errors below.')
    } else if (err.response?.data) {
      // The backend still returns 422 with success:false + a classified
      // reason for genuine SMTP failures (as opposed to validation errors).
      result.value = err.response.data
      toast.error(err.response.data.message ?? 'Test email failed.')
    } else {
      toast.error('Failed to reach the server.')
    }
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Mail Test" />
    </template>

    <PageHeader
      title="Test Email Configuration"
      subtitle="Verify any SMTP provider — Gmail, Microsoft 365, or a custom server — before relying on it. Leave a field blank to use the value currently configured on the server."
    />

    <div class="max-w-[640px]">
      <form @submit.prevent="handleSubmit" class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] p-5 sm:p-6 flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label for="mt-host" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">SMTP Host</label>
            <input id="mt-host" v-model="form.host" type="text" placeholder="Leave blank to use the configured host"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
            <p v-if="fieldErrors.host" class="mt-1.5 text-[11.5px] text-red-600">{{ fieldErrors.host[0] }}</p>
          </div>

          <div>
            <label for="mt-port" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Port</label>
            <input id="mt-port" v-model.number="form.port" type="number" placeholder="e.g. 587"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
            <p v-if="fieldErrors.port" class="mt-1.5 text-[11.5px] text-red-600">{{ fieldErrors.port[0] }}</p>
          </div>

          <div>
            <label for="mt-encryption" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Encryption</label>
            <select id="mt-encryption" v-model="form.encryption"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]">
              <option value="">Use configured / auto (by port)</option>
              <option value="tls">TLS / STARTTLS — port 587</option>
              <option value="ssl">SSL — implicit TLS, port 465</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label for="mt-username" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Username</label>
            <input id="mt-username" v-model="form.username" type="text" placeholder="Leave blank to use the configured username" autocomplete="off"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
          </div>

          <div>
            <label for="mt-password" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Password</label>
            <input id="mt-password" v-model="form.password" type="password" placeholder="Leave blank to use the configured password" autocomplete="new-password"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
          </div>

          <div>
            <label for="mt-from-address" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">From Email</label>
            <input id="mt-from-address" v-model="form.from_address" type="email" placeholder="Leave blank to use the configured sender"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
            <p v-if="fieldErrors.from_address" class="mt-1.5 text-[11.5px] text-red-600">{{ fieldErrors.from_address[0] }}</p>
          </div>

          <div>
            <label for="mt-from-name" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">From Name</label>
            <input id="mt-from-name" v-model="form.from_name" type="text" placeholder="Leave blank to use the configured sender name"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]" />
          </div>

          <div class="sm:col-span-2 pt-1 border-t border-[var(--line-soft)]">
            <label for="mt-to" class="block text-[12.5px] font-semibold text-[var(--ink-700)] mt-3 mb-1.5">
              Test Recipient <span class="text-red-600">*</span>
            </label>
            <input id="mt-to" v-model="form.to" type="email" required placeholder="you@example.com — where the test email will be sent"
              class="w-full border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]"
              :class="{ '!border-red-600': fieldErrors.to }" />
            <p v-if="fieldErrors.to" class="mt-1.5 text-[11.5px] text-red-600">{{ fieldErrors.to[0] }}</p>
          </div>
        </div>

        <button type="submit" class="btn btn-primary self-start" :disabled="isSending">
          <BaseIcon v-if="!isSending" name="sparkles" :size="14" />
          {{ isSending ? 'Sending…' : 'Send Test Email' }}
        </button>
      </form>

      <!-- Result -->
      <div
        v-if="result"
        class="mt-4 rounded-[var(--radius)] border p-4 flex items-start gap-3"
        :class="result.success ? 'bg-[var(--ok-wash,_#e5f4ec)] border-green-200' : 'bg-red-50 border-red-200'"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :class="result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
        >
          <BaseIcon :name="result.success ? 'check' : 'alert'" :size="16" />
        </div>
        <div class="min-w-0">
          <p class="text-[13.5px] font-bold" :class="result.success ? 'text-green-800' : 'text-red-800'">
            {{ result.success ? 'Success' : 'Failed' }}
          </p>
          <p class="text-[13px] mt-0.5" :class="result.success ? 'text-green-700' : 'text-red-700'">{{ result.message }}</p>
          <p v-if="result.category" class="text-[11px] mt-1.5 font-mono uppercase tracking-wide text-red-500">reason: {{ result.category }}</p>
        </div>
      </div>
    </div>

    <ToastHost />
  </AppShell>
</template>
