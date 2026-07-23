<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import AppShell from '@/components/AppShell.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ChangePasswordForm from '@/components/user/ChangePasswordForm.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'

const auth = useAuthStore()
const toast = useToast()

const orgName = ref('')
const userEmail = ref('')
const contactName = ref('')
const memberSince = ref('')
const submittedCount = ref(0)
const saving = ref(false)
const loading = ref(true)
const showChangePassword = ref(false)

const orgId = computed(() => auth.currentUser?.organisation_id as number | null)

async function loadOrg() {
  if (!orgId.value) { loading.value = false; return }
  try {
    const [orgRes, entriesRes] = await Promise.all([
      memberApi.getMyOrganisation(),
      memberApi.getSubmittedProgrammeEntries(1),
    ])
    const org = orgRes.data.data || orgRes.data
    orgName.value = org.name || ''
    userEmail.value = org.email || ''
    contactName.value = org.contact_name || ''
    memberSince.value = org.member_since ? String(org.member_since) : 'This year'
    submittedCount.value = entriesRes.data.total ?? 0
  } catch {
    toast.error('Failed to load organisation details.')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await memberApi.updateMyOrganisation({ contact_name: contactName.value })
    toast.success('Contact details updated')
  } catch {
    toast.error('Failed to update contact details.')
  } finally {
    saving.value = false
  }
}

onMounted(loadOrg)
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Organisation Profile" />
    </template>

    <div class="page-head">
      <div>
        <h1>Organisation profile</h1>
        <p>Your organisational account details. Contact NEP directly to change your registered email or reset your password.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div class="card card-pad">
          <div class="section-title"><h3>Account details</h3></div>
          <div class="field">
            <label>Organisation name</label>
            <input type="text" :value="orgName" disabled />
          </div>
          <div class="field">
            <label>Registered email</label>
            <input type="email" :value="userEmail" disabled />
            <div class="hint">To change this, contact your NEP focal point — NEP holds master credentials for every member account.</div>
          </div>
          <div class="field">
            <label>Primary contact name</label>
            <input type="text" v-model="contactName" placeholder="Who at your organisation manages this account?" />
          </div>
          <div class="field">
            <label>Member since</label>
            <input type="text" :value="memberSince" disabled />
          </div>
          <button class="btn btn-primary btn-sm" @click="save" :disabled="saving || loading">
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </div>

      <div>
        <div class="card card-pad" style="background:var(--teal-50);border-color:var(--teal-100);">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <BaseIcon name="shield" :size="20" style="color:var(--teal-700);flex-shrink:0;margin-top:2px;" />
            <div>
              <b style="font-size:13px;">Why this account is organisational</b>
              <p style="font-size:12.3px;color:var(--ink-600);margin-top:6px;">Accounts belong to the organisation, not an individual staff member. If your programme contact leaves, nothing is lost — ask NEP to update the contact name and, if needed, reset the password.</p>
            </div>
          </div>
        </div>

        <div class="card card-pad" style="margin-top:16px;">
          <div class="section-title"><h3>At a glance</h3></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--line-soft);font-size:13px;">
            <span style="color:var(--ink-500);">Programme entries</span><b>{{ submittedCount }}</b>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
            <span style="color:var(--ink-500);">Map visibility to other members</span><b>Restricted</b>
          </div>
          <p style="font-size:11.5px;color:var(--ink-500);margin-top:10px;">Visibility is set centrally by NEP and applies to all members equally — it's not a per-organisation setting.</p>
        </div>

        <div class="card card-pad" style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
          <div>
            <div class="section-title" style="margin-bottom:6px;"><h3>Password</h3></div>
            <p style="font-size:12.5px;color:var(--ink-500);margin:0;">
              Keep your account secure by using a strong personal password.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" @click="showChangePassword = true">
            Set new password
          </button>
        </div>

        <ChangePasswordForm
          v-if="showChangePassword"
          @close="showChangePassword = false"
          @success="showChangePassword = false"
        />
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page-head {
  margin-bottom: 24px;
}
.page-head h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.02em;
  margin: 0;
}
.page-head p {
  font-size: 13px;
  color: var(--ink-400);
  margin-top: 4px;
}
.section-title {
  margin-bottom: 16px;
}
.section-title h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-900);
  margin: 0;
}
</style>
