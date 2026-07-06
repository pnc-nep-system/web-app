<script setup>
</script>

<template>
  <div class="login-view">
    <div class="login-visual">
      <div class="grain"></div>
      <div class="content">
        <div class="brand-mark">NEP</div>
        <h1>Tell NEP what your organisation does — once, kept current.</h1>
        <p>Your programme entry feeds the shared map NEP uses to spot overlap, avoid duplication, and connect you with organisations doing complementary work.</p>
        <div class="login-stat-row">
          <div class="login-stat"><b>5</b><span>sections per entry</span></div>
          <div class="login-stat"><b>18mo</b><span>review cycle</span></div>
          <div class="login-stat"><b>1</b><span>account per organisation</span></div>
        </div>
      </div>
    </div>
    <div class="login-panel">
      <h2>Organisation sign in</h2>
      <p class="sub">Accounts are organisational, not individual — staff turnover never costs you access. NEP staff use a separate portal.</p>

      <form @submit.prevent>
        <div class="field">
            <label>Organisation email</label>
            <input type="email" placeholder="programmes@riverkids.org" />
        </div>
        <div class="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; justify-content: center;">Sign in</button>
      </form>

      <div class="demo-box" style="margin-top: 24px;">
        <b>Demo accounts</b>
        <p>Working prototype backed by a local JSON data store — no real backend. Try any of the three:</p>
        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" type="button">Riverkids Cambodia</button>
          <button class="btn btn-secondary btn-sm" type="button">ChildWell Cambodia</button>
          <button class="btn btn-secondary btn-sm" type="button">New Hope Learning (no entries yet)</button>
        </div>
        <p style="margin-top:10px;color:var(--ink-400);">Password for every demo account: <code class="mono">demo1234</code></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(160deg,var(--teal-900),var(--teal-800) 55%,var(--teal-700));
}
.login-visual {
  flex: 1.1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 64px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.login-visual .grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 30%, rgba(217,119,6,.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.08), transparent 40%);
}
.login-visual .content {
  position: relative;
  max-width: 440px;
}
.login-visual .brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg,var(--amber-600),var(--amber-700));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lexend';
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 22px;
}
.login-visual h1 {
  font-size: 30px;
  line-height: 1.25;
  color: #fff;
  font-weight: 600;
}
.login-visual p {
  color: rgba(255,255,255,.65);
  font-size: 14px;
  margin-top: 14px;
  line-height: 1.7;
}
.login-stat-row {
  display: flex;
  gap: 26px;
  margin-top: 36px;
}
.login-stat b {
  display: block;
  font-family: 'Lexend';
  font-size: 22px;
}
.login-stat span {
  font-size: 11.5px;
  color: rgba(255,255,255,.55);
  display: block;
}
.login-panel {
  width: 440px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px;
  flex-shrink: 0;
}
.login-panel h2 {
  font-size: 20px;
  margin-bottom: 8px;
}
.login-panel p.sub {
  color: var(--ink-500);
  font-size: 13px;
  margin-bottom: 26px;
}
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12.5px; font-weight: 600; color: var(--ink-700); margin-bottom: 6px; }
.field input { width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:13.3px;font-family:inherit;color:var(--ink-900);background:#fff; }
.demo-box{background:var(--amber-50);border:1px solid var(--amber-100);border-radius:9px;padding:14px 16px;font-size:11.8px;color:var(--amber-700);}
.demo-box b{display:block;font-size:12.5px;margin-bottom:4px;}
.demo-box p{color:var(--amber-700);opacity:.9;line-height:1.6;display:block;}

@media(max-width:900px){
  .login-visual{display:none;}
  .login-panel{width:100%;}
}
</style>
