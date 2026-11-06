'use strict';
// 클라우드 저장 (Supabase): 이메일 로그인, 슬롯 묶음을 saves 테이블에 올리고 내려받는다
//  config.js에 주소 · 키가 없으면 아무것도 하지 않는다 (로컬 저장만)

const CLOUD = { on: !!(SUPABASE_URL && SUPABASE_KEY), ready: false, sb: null, user: null, busy: '', err: '', lastPush: 0 };
function loadSupabase() {
  return new Promise((ok, no) => {
    if (window.supabase) return ok();
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    s.onload = ok; s.onerror = () => no(new Error('supabase-js를 불러오지 못했습니다')); document.head.appendChild(s);
  });
}
async function cloudInit() {
  if (!CLOUD.on) return;
  try {
    await loadSupabase();
    CLOUD.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'twilight.auth' } });
    const { data } = await CLOUD.sb.auth.getSession(); CLOUD.user = data.session ? data.session.user : null;
    CLOUD.ready = true;
    if (CLOUD.user) await cloudPull();
  } catch (e) { CLOUD.err = String(e.message || e); }
  cloudRefreshUI();
}
// 내려받기: 클라우드 쪽이 더 최근이면 로컬 슬롯을 덮어쓴다
async function cloudPull() {
  if (!CLOUD.user) return;
  CLOUD.busy = '불러오는 중'; cloudRefreshUI();
  const { data, error } = await CLOUD.sb.from('saves').select('slot, data, updated_at');
  CLOUD.busy = '';
  if (error) { CLOUD.err = error.message; return; }
  for (const row of data) { const loc = slotRec(row.slot), cloudAt = new Date(row.updated_at).getTime(); if (!loc || (loc.at || 0) < cloudAt) ls.set('twilight.s' + row.slot, JSON.stringify({ ...row.data, at: cloudAt })); }
}
// 올리기: 지금 슬롯 (또는 모든 슬롯)
async function cloudPush(all) {
  if (!CLOUD.user || !CLOUD.sb) return;
  const rows = [];
  for (let n = 1; n <= SLOT_N; n++) { if (!all && n !== curSlot()) continue; const r = slotRec(n); if (r) rows.push({ user_id: CLOUD.user.id, slot: n, data: r, updated_at: new Date(r.at || Date.now()).toISOString() }); }
  if (!rows.length) return;
  const { error } = await CLOUD.sb.from('saves').upsert(rows);
  if (error) CLOUD.err = error.message; else { CLOUD.err = ''; CLOUD.lastPush = Date.now(); }
}
async function cloudDelete(n) { if (CLOUD.user) await CLOUD.sb.from('saves').delete().eq('slot', n); }
async function cloudAuth(mode, email, pw) {
  CLOUD.err = ''; CLOUD.busy = mode === 'up' ? '가입 중' : '로그인 중'; cloudRefreshUI();
  const fn = mode === 'up' ? CLOUD.sb.auth.signUp({ email, password: pw }) : CLOUD.sb.auth.signInWithPassword({ email, password: pw });
  const { data, error } = await fn; CLOUD.busy = '';
  if (error) { CLOUD.err = error.message; cloudRefreshUI(); return; }
  CLOUD.user = data.user && data.session ? data.user : null;
  if (!CLOUD.user && mode === 'up') CLOUD.err = '가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.';
  if (CLOUD.user) { await cloudPull(); await cloudPush(true); }
  cloudRefreshUI();
}
async function cloudSignOut() { await cloudPush(true); await CLOUD.sb.auth.signOut(); CLOUD.user = null; cloudRefreshUI(); }

// ---- 타이틀 오른쪽 위: 계정 칸 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#acct{position:fixed;top:18px;right:18px;z-index:51;width:270px;padding:12px 14px;font-family:Galmuri11,sans-serif;font-size:12px;color:#d8d0c0;background:linear-gradient(180deg,rgba(40,30,22,.92),rgba(14,10,8,.95));border:1px solid #6a5438;box-shadow:0 0 0 1px #000}
#acct .h{color:#ffe0a0;margin-bottom:8px}#acct input{font:inherit;width:100%;box-sizing:border-box;margin-bottom:6px;padding:6px 8px;background:#0e0c0a;border:1px solid #4a3a28;color:#ffe0a0}
#acct .r{display:flex;gap:6px}#acct button{flex:1;font:inherit;font-size:12px;padding:6px;cursor:pointer;border:1px solid #000;border-radius:2px;background:linear-gradient(180deg,#e8c070,#9a6a24);color:#1a1208}#acct button.b2{background:#16161c;border-color:#4a4030;color:#d8d0c0}
#acct .e{color:#ff9a7a;margin-top:6px;line-height:1.5}#acct .d{color:#9a8a70;line-height:1.6}` }));
let acctEl = null;
function cloudRefreshUI() {
  if (typeof TITLE === 'undefined' || !TITLE.open) return;
  if (!acctEl) { acctEl = mk('div', '', '', document.body); acctEl.id = 'acct'; }
  if (!CLOUD.on) { acctEl.innerHTML = '<div class="h">온라인 저장 꺼짐</div><div class="d">js/config.js에 Supabase 주소와 키를 넣으면 계정으로 저장할 수 있습니다.</div>'; return; }
  if (!CLOUD.ready) { acctEl.innerHTML = `<div class="h">온라인 연결 중...</div>${CLOUD.err ? `<div class="e">${CLOUD.err}</div>` : ''}`; return; }
  if (CLOUD.user) {
    acctEl.innerHTML = `<div class="h">☁ ${CLOUD.user.email}</div><div class="d">슬롯이 계정에 저장됩니다. 다른 기기에서도 이어할 수 있습니다.${CLOUD.busy ? `<br>${CLOUD.busy}...` : ''}</div><div class="r" style="margin-top:8px"><button class="b2" data-a="out">로그아웃</button></div>${CLOUD.err ? `<div class="e">${CLOUD.err}</div>` : ''}`;
    acctEl.querySelector('[data-a=out]').onclick = () => cloudSignOut().then(() => renderTitle());
  } else {
    acctEl.innerHTML = `<div class="h">계정 로그인</div><input type="email" placeholder="이메일" autocomplete="email"><input type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password"><div class="r"><button data-a="in">로그인</button><button class="b2" data-a="up">가입</button></div><div class="d" style="margin-top:6px">로그인하지 않아도 이 브라우저에 저장됩니다.${CLOUD.busy ? `<br>${CLOUD.busy}...` : ''}</div>${CLOUD.err ? `<div class="e">${CLOUD.err}</div>` : ''}`;
    const [em, pw] = acctEl.querySelectorAll('input');
    for (const i of [em, pw]) i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') go('in'); };
    const go = m => { if (!em.value || pw.value.length < 6) { CLOUD.err = '이메일과 6자 이상 비밀번호를 넣어 주세요.'; cloudRefreshUI(); return; } cloudAuth(m, em.value.trim(), pw.value).then(() => renderTitle()); };
    acctEl.querySelector('[data-a=in]').onclick = () => go('in'); acctEl.querySelector('[data-a=up]').onclick = () => go('up');
  }
}
// ---- 타이틀 · 저장과 연결 ----
const _renderTitle = renderTitle;
renderTitle = function () { _renderTitle(); cloudRefreshUI(); };
const _syncSlot = syncSlot;
syncSlot = function () { _syncSlot(); if (CLOUD.user && Date.now() - CLOUD.lastPush > 30000) cloudPush(false); };
const _toTitle = toTitle;
toTitle = function () { _syncSlot(); if (CLOUD.user) cloudPush(false).finally(() => _toTitle()); else _toTitle(); };
const _startSlot = startSlot;
startSlot = function (n, fresh, prof) { _startSlot(n, fresh, prof); if (CLOUD.user) cloudPush(false); };
cloudInit();
if (TITLE.open) cloudRefreshUI();
