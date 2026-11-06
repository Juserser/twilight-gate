'use strict';
// 실시간 협동 (Supabase Realtime 방송 채널): 방 코드로 친구와 같은 던전을 돈다
//  방장이 몬스터를 움직이고 0.1초마다 상태를 보낸다. 참가자는 그 상태를 받아 보여 준다.
//  공격 패턴은 양쪽에서 같이 재생하고, 맞았는지는 각자 자기 캐릭터로 판정한다.
//  참가자가 몬스터를 때리면 피해를 방장에게 보내고, 몬스터의 죽음은 방장이 알린다.
//  레이드: 기둥 · 보호막 · 공용 부활 · 시간 · 관문 실패는 방장이 정하고 알린다. 사람이 늘면 AI 동료가 줄어든다.

const COOP = { ch: null, code: '', host: false, on: false, status: '', me: Math.random().toString(36).slice(2, 10), peers: new Map(),
  nid: 0, allow: false, inBuild: false, remote: false, remoteHit: false, remotePat: false, remoteDie: false, roomAt: 0,
  sendT: 0, snapT: 0, flushT: 0, hits: [], dmgOut: [], sgOut: [] };
const coopDun = () => COOP.on && DUN.on && !!DUN.d;
const coopGuest = () => coopDun() && !COOP.host;
const COOP_ST = ['spawn', 'idle', 'chase', 'wind', 'act', 'recover', 'stun', 'dead'];
const r2 = v => Math.round(v * 100) / 100;
const monByCid = id => mons.find(m => m.cid === id);
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

// ---- 연결 ----
async function coopSb() {
  await loadSupabase();
  for (let i = 0; i < 30 && !CLOUD.sb; i++) await new Promise(r => setTimeout(r, 100));
  if (!CLOUD.sb) CLOUD.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'twilight.auth' } });
  return CLOUD.sb;
}
function coopNewCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += A[(Math.random() * A.length) | 0]; return s; }
async function coopJoin(code, host) {
  if (!CLOUD.on) { toast('온라인 꺼짐', 'config.js 설정이 필요합니다', '#ff8a6a'); return; }
  await coopLeave(true);
  COOP.status = '연결 중...'; renderCoop();
  let sb; try { sb = await coopSb(); } catch (e) { COOP.status = '연결 실패: ' + (e.message || e); renderCoop(); return; }
  const ch = sb.channel('coop:' + code, { config: { broadcast: { self: false }, presence: { key: COOP.me } } });
  Object.assign(COOP, { ch, code, host, seenHost: false });
  ch.on('broadcast', { event: 'm' }, ({ payload }) => { try { coopRecv(payload); } catch (e) { console.warn('coop', e); } });
  ch.on('presence', { event: 'sync' }, coopPresence);
  ch.subscribe(async st => {
    if (ch !== COOP.ch) return;
    if (st === 'SUBSCRIBED') {
      COOP.on = true; COOP.status = host ? '' : '방장을 찾는 중...';
      await ch.track({ name: player.name, host });
      log(host ? `협동 방을 만들었습니다. 방 코드 ${code}` : `협동 방 ${code}에 들어갔습니다.`, '파티');
      if (!host) coopSend({ t: 'hello' });
      renderCoop();
    } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { COOP.status = '연결 실패 (' + st + ')'; COOP.on = false; renderCoop(); }
  });
}
async function coopLeave(quiet) {
  const ch = COOP.ch; COOP.ch = null; COOP.on = false; COOP.code = ''; COOP.status = '';
  for (const p of COOP.peers.values()) coopDropAvatar(p); COOP.peers.clear();
  if (ch) { try { await ch.untrack(); } catch (e) {} try { await CLOUD.sb.removeChannel(ch); } catch (e) {} if (!quiet) log('협동 방에서 나왔습니다.', '파티'); }
  renderCoop();
}
function coopSend(o) { if (!COOP.ch || !COOP.on) return; o.f = COOP.me; COOP.ch.send({ type: 'broadcast', event: 'm', payload: o }); }
function coopPresence() {
  const st = COOP.ch ? COOP.ch.presenceState() : {}, ids = new Set(Object.keys(st));
  let hostHere = false;
  for (const [id, metas] of Object.entries(st)) {
    if (id === COOP.me) continue; const meta = metas[0] || {};
    const p = coopPeer(id); p.name = meta.name || p.name; p.isHost = !!meta.host; if (p.isHost) hostHere = true;
  }
  for (const [id, p] of [...COOP.peers]) if (!ids.has(id)) { coopDropAvatar(p); COOP.peers.delete(id); log(`${esc(p.name || '동료')}님이 방을 나갔습니다.`, '파티'); }
  if (!COOP.host) {
    if (hostHere) { if (!COOP.seenHost) { COOP.seenHost = true; COOP.status = ''; } }
    else if (COOP.seenHost) { toast('방장이 나갔습니다', '협동 방이 닫혔습니다', '#ff8a6a'); coopLeave(true); return; }
  }
  renderCoop();
}
function coopPeer(id) {
  let p = COOP.peers.get(id);
  if (!p) { p = { id, name: '동료', x: 0, z: 0, y: 0, last: 0, tg: { x: 0, z: 0, down: true, key: 'peer' } }; COOP.peers.set(id, p); }
  return p;
}

// ---- 받기 ----
function coopRecv(o) {
  if (!o || o.f === COOP.me) return;
  const p = coopPeer(o.f);
  switch (o.t) {
    case 'p': Object.assign(p, { name: o.n, key: o.k, x: o.x, z: o.z, y: o.y, fc: o.fc, fs: o.fs, fi: o.fi, dn: o.dn, hp: o.hp, mx: o.mx, ar: o.ar, dk: o.dk, rm: o.rm, last: performance.now() });
      Object.assign(p.tg, { x: o.x, z: o.z, down: !!o.dn }); break;
    case 'hello': if (COOP.host) coopSendState(); break;
    case 'chat': log(`${esc(o.n)}: ${esc(o.s)}`, '파티'); break;
    case 'dun': if (!COOP.host) coopFollowDun(o.di, o.df); break;
    case 'st': if (!COOP.host) { if (!DUN.on || DUN.di !== o.di) coopFollowDun(o.di, o.df); if (DUN.on && DUN.room !== o.rm) { COOP.remote = true; buildRoom(o.rm); COOP.remote = false; } } break;
    case 'room': if (coopDun() && o.rm !== DUN.room && o.di === DUN.di) fadeTo(() => { if (DUN.room === o.rm) return; COOP.remote = true; buildRoom(o.rm); COOP.remote = false; }); break;
    case 'leave': if (!COOP.host && DUN.on) { COOP.remote = true; leaveDungeon(); COOP.remote = false; toast('방장이 던전을 나갔습니다', '마을로 돌아갑니다', '#9ad8ff'); } break;
    case 'snap': if (coopGuest() && o.rm === DUN.room) coopApplySnap(o.m); break;
    case 'sp': if (coopGuest() && o.rm === DUN.room && !monByCid(o.id) && MON[o.kind]) { COOP.allow = true; const m = spawnMon(o.kind, o.x, o.z, { aggro: true, hpMul: o.hm }); COOP.allow = false; m.cid = o.id; } break;
    case 'pat': if (coopGuest() && o.rm === DUN.room) { const m = monByCid(o.id); if (m && m.state !== 'dead' && PAT[o.k]) { clearTele(m); m.burrowed = false; m.sink = 0; COOP.remotePat = true; startPat(m, o.k, { x: o.tx, z: o.tz, down: false }); COOP.remotePat = false; } } break;
    case 'die': if (coopGuest() && o.rm === DUN.room) { const m = monByCid(o.id); if (m && m.state !== 'dead') { COOP.remoteDie = true; monDie(m); COOP.remoteDie = false; } } break;
    case 'cut': if (coopGuest() && o.rm === DUN.room) { const m = monByCid(o.id); if (m && m.state === 'wind') { clearTele(m); Object.assign(m, { state: 'recover', t: 0, recDur: 0.9, burrowed: false, sink: 0, flash: 0.15 }); } } break;
    case 'cutq': if (COOP.host && coopDun() && o.rm === DUN.room) { const m = monByCid(o.id); if (m) monInterrupt(m); } break;
    case 'dmg': if (COOP.host && coopDun() && o.rm === DUN.room) coopApplyDmg(o); break;
    case 'rs': if (coopGuest() && o.rm === DUN.room) COOP.rs = o; break;
    case 'rdown': if (COOP.host && coopDun() && raidOn() && o.rm === DUN.room && !DUN.cleared) { RAID.revives--; const p2 = COOP.peers.get(o.f); floaters.push({ x: p2 ? p2.x : 0, y: 3, z: p2 ? p2.z : 0, t: 0, text: RAID.revives >= 0 ? `공용 부활 ${RAID.revives}회 남음` : '부활 없음', crit: false, big: true, vx: 0, color: '#ff8a8a' }); } break;
    case 'rfail': if (coopGuest() && raidOn() && o.rm === DUN.room) _coopRaidFail(o.why); break;
    case 'hx': if (coopGuest() && o.rm === DUN.room) for (const [id, d] of o.h) { const m = monByCid(id); if (m) { m.flash = 0.09; coopFloat(m, d); } } break;
  }
  if (o.t === 'p' && COOP.peers.size && !p.named) { p.named = true; renderCoop(); }
}
function coopFloat(m, d) { floaters.push({ x: m.x + (Math.random() - 0.5) * 0.6, y: m.y + m.lift + m.def.top + 0.2, z: m.z, t: 0, text: String(d), crit: false, vx: (Math.random() - 0.5) * 0.25, color: '#7ad8ff' }); }
function coopSendState() { if (coopDun()) coopSend({ t: 'st', di: DUN.di, df: DUN.d.diff || 0, rm: DUN.room }); }
function coopFollowDun(di, df) {
  const d = DUNGEONS[di]; if (!d) return;
  if (!d.raid) DIFFSEL[d.id] = df || 0; COOP.remote = true;
  try { enterDungeon(di, true); } finally { COOP.remote = false; }
  if (DUN.on && DUN.di === di) toast('함께 입장', d.name, '#9ad8ff');
  else coopSend({ t: 'chat', n: '알림', s: `${player.name}님은 아이템 레벨이 부족해 ${d.name}에 들어가지 못했습니다` });
}
// 방장의 몬스터 상태: 위치 · 체력 · 상태를 맞춘다. 방장에게 없는 몬스터는 지운다.
function coopApplySnap(rows) {
  const seen = new Set();
  for (const [id, x, z, hp, st, dir, sg, iv] of rows) {
    const m = monByCid(id); seen.add(id); if (!m) continue;
    m.sx = x; m.sz = z; m.shp = hp; m.sst = COOP_ST[st]; m.sdir = dir; if (sg != null) m.stagger = sg; m.invuln = !!iv;
  }
  if (performance.now() - COOP.roomAt > 1500) for (const m of [...mons]) if (m.cid != null && !seen.has(m.cid) && m.state !== 'dead') removeMon(m);
}
function coopApplyDmg(o) {
  COOP.remoteHit = true;
  try {
    for (const [id, v] of o.s || []) { const m = monByCid(id); if (m && m.state !== 'dead') monStagger(m, v); }
    for (const [id, d, nx, nz] of o.h || []) { const m = monByCid(id); if (m && m.state !== 'dead' && !m.invuln) { coopFloat(m, d); monHurt(m, d, nx / 100, nz / 100); } }
  } finally { COOP.remoteHit = false; }
}

// ---- 몬스터 쪽 연결 (방장: 알린다 / 참가자: 따른다) ----
const _coopSpawnMon = spawnMon;
spawnMon = function (kind, x, z, opt = {}) {
  // 참가자 쪽에서 패턴이 부르는 소환은 방장이 따로 알려 주므로 만들자마자 지운다
  if (coopGuest() && !COOP.allow) { const m = _coopSpawnMon(kind, x, z, opt); removeMon(m); m.state = 'dead'; return m; }
  const m = _coopSpawnMon(kind, x, z, opt);
  if (DUN.on) m.cid = COOP.nid++;
  if (coopDun() && COOP.host && !COOP.inBuild) coopSend({ t: 'sp', rm: DUN.room, id: m.cid, kind, x: r2(x), z: r2(z), hm: r2(m.max / m.def.hp) });
  return m;
};
const _coopBuildRoom = buildRoom;
buildRoom = function (k) {
  COOP.nid = 0; COOP.inBuild = true; COOP.allow = true; COOP.roomAt = performance.now();
  try { _coopBuildRoom(k); } finally { COOP.inBuild = false; COOP.allow = false; }
  if (coopDun() && !COOP.remote) coopSend({ t: 'room', di: DUN.di, rm: k });
};
const _coopStartPat = startPat;
startPat = function (m, key, T) {
  if (coopGuest() && m.cid != null && !COOP.remotePat) return; // 참가자는 스스로 공격을 고르지 않는다
  _coopStartPat(m, key, T);
  if (coopDun() && COOP.host && m.cid != null) coopSend({ t: 'pat', rm: DUN.room, id: m.cid, k: key, tx: r2(T.x), tz: r2(T.z) });
};
const _coopMonHurt = monHurt;
monHurt = function (m, dmg, nx, nz) {
  if (coopGuest() && m.cid != null && !COOP.remoteHit) {
    if (m.state === 'dead') return;
    COOP.dmgOut.push([m.cid, Math.round(dmg), Math.round(nx * 100), Math.round(nz * 100)]);
    m.hp = Math.max(1, m.hp - dmg); return _coopMonHurt(m, 0, nx, nz); // 죽음은 방장이 정한다
  }
  if (coopDun() && COOP.host && m.cid != null && !COOP.remoteHit && m.state !== 'dead') COOP.hits.push([m.cid, Math.round(dmg)]);
  return _coopMonHurt(m, dmg, nx, nz);
};
const _coopMonStagger = monStagger;
monStagger = function (m, v) {
  if (coopGuest() && m.cid != null && !COOP.remoteHit) { if (v > 0) COOP.sgOut.push([m.cid, r2(v)]); if (!m.def.stag && v >= 25 && m.state === 'wind') monInterrupt(m, true); return; }
  return _coopMonStagger(m, v);
};
const _coopMonInterrupt = monInterrupt;
monInterrupt = function (m, quiet) {
  const ok = _coopMonInterrupt(m, quiet);
  if (ok && coopDun() && m.cid != null) coopSend({ t: COOP.host ? 'cut' : 'cutq', rm: DUN.room, id: m.cid });
  return ok;
};
const _coopMonDie = monDie;
monDie = function (m) {
  if (coopGuest() && m.cid != null && !COOP.remoteDie) return;
  _coopMonDie(m);
  if (coopDun() && COOP.host && m.cid != null) coopSend({ t: 'die', rm: DUN.room, id: m.cid });
};
// 방장의 몬스터는 가장 가까운 동료도 노린다
const _coopMonAggro = monAggro;
monAggro = function (m, A) {
  const r = _coopMonAggro(m, A);
  if (!coopDun() || !COOP.host || !COOP.peers.size || (r !== A && !r.down)) return r; // 분신 등은 그대로
  return coopPick(m, r === A ? A : null, r);
};
function coopPick(m, A, fallback) {
  let best = A, bd = A ? Math.hypot(A.x - m.x, A.z - m.z) - (m.ctg === A ? 1.5 : 0) : 1e9;
  const now = performance.now();
  for (const p of COOP.peers.values()) {
    if (!coopSameRoom(p) || p.dn || now - p.last > 3000) continue;
    const d = Math.hypot(p.x - m.x, p.z - m.z) - (m.ctg === p.tg ? 1.5 : 0);
    if (d < bd) { bd = d; best = p.tg; }
  }
  m.ctg = best; return best || fallback;
}
const coopSameRoom = p => DUN.on ? p.ar === 'dungeon' && p.dk === DUN.di && p.rm === DUN.room : p.ar === 'town' && AREA === 'town';
// 참가자: 몬스터는 방장이 보낸 자리 · 방향 · 상태를 따라간다
const _coopUpdateMon = updateMon;
updateMon = function (m, dt) {
  if (!coopGuest() || m.cid == null) return _coopUpdateMon(m, dt);
  if (m.state !== 'dead' && m.state !== 'spawn' && m.sst) {
    if (m.sst === 'stun' && m.state !== 'stun') { clearTele(m); m.state = 'stun'; m.t = 0; }
    else if (m.state === 'stun' && m.sst !== 'stun') { m.state = 'chase'; m.t = 0; }
  }
  if (m.sdir != null && (m.state === 'chase' || m.state === 'idle' || m.state === 'recover')) m.dir = m.sdir;
  m.rootT = Math.max(m.rootT, 0.05); // 스스로 걷지 않는다
  const px = m.x, pz = m.z;
  _coopUpdateMon(m, dt);
  if (!mons.includes(m) || m.state === 'dead') return;
  if (m.shp != null) m.hp = Math.min(m.hp, Math.max(1, m.shp));
  if (m.sx != null) {
    const k = Math.min(1, dt * (m.state === 'act' ? 3 : 9));
    m.x += (m.sx - m.x) * k; m.z += (m.sz - m.z) * k;
    if (Math.hypot(m.sx - m.x, m.sz - m.z) > 5) { m.x = m.sx; m.z = m.sz; }
    if (m.state === 'chase' || m.state === 'idle') {
      const F = m.F, mv = Math.hypot(m.x - px, m.z - pz) > dt * 0.6, fr = mv ? F.move[Math.floor(m.t * 7) % 2] : F.idle[Math.floor(m.t * 2.5) % 2];
      m.mat.map = m.face > 0 ? fr.r : fr.l; m.glowMat.map = m.face > 0 ? fr.gr : fr.gl;
    }
    m.mesh.position.x = m.x; m.mesh.position.z = m.z; m.sh.position.x = m.x; m.sh.position.z = m.z;
  }
};

// ---- 던전 들어가기 · 나가기 ----
const _coopEnterDungeon = enterDungeon;
enterDungeon = function (di, free) {
  const raid = !!DUNGEONS[di].raid;
  if (COOP.on && !COOP.host && !COOP.remote) { toast('방장이 던전을 고릅니다', '방장이 들어가면 함께 들어갑니다', '#9ad8ff'); toggleWin('wDun', false); return; }
  const can = free || lampLeft() > 0;
  _coopEnterDungeon(di, free);
  if ((raid ? DUN.on && DUN.di === di : can) && COOP.on && COOP.host) coopSend({ t: 'dun', di, df: DIFFSEL[DUNGEONS[di].id] || 0 });
};
const _coopLeaveDungeon = leaveDungeon;
leaveDungeon = function () {
  const was = coopDun();
  _coopLeaveDungeon();
  if (was && COOP.host && !COOP.remote) coopSend({ t: 'leave' });
};

// ---- 동료 캐릭터 그리기 ----
const COOP_FR = {};
for (const c of party) {
  const mp = new Map();
  for (const s of ['idle', 'walk', 'atk', 'skill']) (c.fr[s] || []).forEach((f, i) => { mp.set(f.r, [s, i, 1]); mp.set(f.l, [s, i, -1]); });
  COOP_FR[c.key] = mp;
}
function coopAvatar(p) {
  if (p.av && p.av.key === p.key) return p.av;
  coopDropAvatar(p);
  const src = party.find(c => c.key === p.key); if (!src) return null;
  const mat = new THREE.MeshLambertMaterial({ map: src.fr.idle[0].r, alphaTest: 0.5, side: THREE.DoubleSide });
  const mesh = addBB(mat, HW, HH, p.x, p.z), sh = contactShadow(0.85, 0.45);
  let glowMat = null;
  if (src.fr.idle[0].gr) { glowMat = new THREE.MeshBasicMaterial({ map: src.fr.idle[0].gr, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.5, 1.5), fog: false }); const gm = new THREE.Mesh(mesh.geometry, glowMat); gm.position.z = 0.03; mesh.add(gm); }
  p.av = { key: p.key, src, mat, glowMat, mesh, sh, x: p.x, z: p.z, y: 0 };
  return p.av;
}
function coopDropAvatar(p) {
  const a = p.av; if (!a) return; p.av = null;
  scene.remove(a.mesh, a.sh); const i = billboards.indexOf(a.mesh); if (i >= 0) billboards.splice(i, 1);
  a.mat.dispose(); if (a.glowMat) a.glowMat.dispose();
}
function coopDrawPeers(dt) {
  for (const p of COOP.peers.values()) {
    const show = p.key && coopSameRoom(p) && performance.now() - p.last < 5000;
    if (!show) { if (p.av) { p.av.mesh.visible = false; p.av.sh.visible = false; } continue; }
    const a = coopAvatar(p); if (!a) continue;
    const k = Math.min(1, dt * 12);
    if (Math.hypot(p.x - a.x, p.z - a.z) > 4) { a.x = p.x; a.z = p.z; } else { a.x += (p.x - a.x) * k; a.z += (p.z - a.z) * k; }
    a.y += ((p.y || 0) - a.y) * k;
    const set = a.src.fr[p.fs] || a.src.fr.idle, f = set[p.fi] || set[0];
    a.mat.map = p.fc > 0 ? f.r : f.l; if (a.glowMat) a.glowMat.map = p.fc > 0 ? f.gr : f.gl;
    a.mesh.visible = true; a.sh.visible = true;
    a.mesh.rotation.z = p.dn ? p.fc * Math.PI / 2 : 0;
    a.mesh.position.set(a.x, -3.5 * PX + (p.dn ? 0 : a.y), a.z); a.sh.position.set(a.x, 0.015, a.z);
  }
}
// 이름표 · 체력
(REGION.hud = REGION.hud || []).push((g, w, h) => {
  for (const p of COOP.peers.values()) {
    const a = p.av; if (!a || !a.mesh.visible) continue;
    const v = new THREE.Vector3(a.x, 2.9 + a.y, a.z).project(camera); if (v.z > 1) continue;
    const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h;
    txt(p.name || '동료', sx, sy, 13, '#9ad8ff', 'center');
    if (p.mx) { const bw = 56, k = clamp(p.hp / p.mx, 0, 1); g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(sx - bw / 2 - 1, sy + 5, bw + 2, 6); g.fillStyle = p.dn ? '#6a6a6a' : '#5ad86a'; g.fillRect(sx - bw / 2, sy + 6, bw * k, 4); }
  }
});

// ---- 매 프레임: 보내기 · 그리기 ----
const _coopUpdateWorld = updateWorld;
updateWorld = function (dt) {
  _coopUpdateWorld(dt);
  if (!COOP.on) return;
  coopDrawPeers(dt);
  const now = performance.now();
  if (now - COOP.sendT > 80) {
    COOP.sendT = now;
    const c = party[active], fm = COOP_FR[c.key].get(c.mat.map) || ['idle', 0, c.face];
    coopSend({ t: 'p', n: player.name, k: c.key, x: r2(c.x), z: r2(c.z), y: r2(c.y || 0), fc: fm[2], fs: fm[0], fi: fm[1], dn: c.down ? 1 : 0, hp: Math.round(c.hp), mx: c.max, ar: AREA, dk: DUN.on ? DUN.di : -1, rm: DUN.room });
  }
  if (!coopDun()) { COOP.hits.length = COOP.dmgOut.length = COOP.sgOut.length = 0; return; }
  if (COOP.host && now - COOP.snapT > 100) {
    COOP.snapT = now;
    coopSend({ t: 'snap', rm: DUN.room, m: mons.filter(m => m.cid != null && m.state !== 'dead').map(m => [m.cid, r2(m.x), r2(m.z), Math.round(m.hp), COOP_ST.indexOf(m.state), r2(m.dir), Math.round(m.stagger || 0), m.invuln ? 1 : 0]) });
  }
  if (COOP.host && raidOn() && now - (COOP.rsT || 0) > 250) {
    COOP.rsT = now;
    coopSend({ t: 'rs', rm: DUN.room, rt: r2(RAID.t), rv: RAID.revives, sh: r2(RAID.shieldT), en: DUN.enrage || 1, pl: RAID.pillars.map(p => [Math.round(p.hp), Math.round(p.charge), p.dead ? 1 : 0, r2(p.rt)]) });
  }
  if (now - COOP.flushT > 100) {
    COOP.flushT = now;
    if (COOP.host && COOP.hits.length) { coopSend({ t: 'hx', rm: DUN.room, h: COOP.hits.splice(0, 60) }); COOP.hits.length = 0; }
    if (!COOP.host && (COOP.dmgOut.length || COOP.sgOut.length)) { coopSend({ t: 'dmg', rm: DUN.room, h: COOP.dmgOut.splice(0), s: COOP.sgOut.splice(0) }); }
  }
};

// ---- 파티 대화: 채팅창 글을 동료에게도 보낸다 ----
chatIn.addEventListener('keydown', e => { if (e.key === 'Enter' && COOP.on) { const v = chatIn.value.trim(); if (v) coopSend({ t: 'chat', n: player.name, s: v.slice(0, 200) }); } }, { capture: true });

// ---- 협동 창 (O) ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wCoop{left:calc(50% - 180px);top:130px;width:360px}
#wCoop .row{display:flex;gap:6px;margin:8px 0}
#wCoop input{flex:1;font:inherit;font-size:16px;letter-spacing:6px;text-transform:uppercase;text-align:center;padding:6px;background:#0e0c0a;border:1px solid #4a3a28;color:#ffe0a0}
#wCoop button{font:inherit;font-size:12px;padding:8px 14px;cursor:pointer;border-radius:3px;border:1px solid #000;background:linear-gradient(180deg,#9ad8ff,#3a78a8);color:#08141e}
#wCoop button.b2{background:#16161c;border-color:#4a4030;color:#d8d0c0}
#wCoop .code{font-size:34px;letter-spacing:10px;text-align:center;color:#9ad8ff;margin:4px 0;text-shadow:0 0 12px rgba(120,200,255,.5)}
#wCoop .mem{display:flex;justify-content:space-between;padding:6px 8px;margin-top:4px;background:rgba(0,0,0,.3);border:1px solid #2e3a48;font-size:12px}
#wCoop .st{color:#ffb07a;font-size:12px;margin-top:6px}
#wCoop .dim{line-height:1.6}` }));
const coopBd = makeWin('wCoop', '실시간 협동');
mk('div', 'mb', '<em>⚔</em>협동<small>O</small>', menuEl).onclick = () => toggleWin('wCoop');
addEventListener('keydown', e => { if (!uiTyping && e.code === 'KeyO' && !e.repeat) toggleWin('wCoop'); });
function renderCoop() {
  if (!document.getElementById('wCoop').classList.contains('open')) return;
  const where = p => !p.key ? '연결 중' : p.ar === 'dungeon' ? (DUNGEONS[p.dk] ? `${DUNGEONS[p.dk].name} · 방 ${p.rm + 1}` : '던전') : '야영지';
  const cls = k => (HEROES[k] && HEROES[k].name) || '';
  if (!COOP.ch) {
    coopBd.innerHTML = `<div class="dim">친구와 같은 던전에 들어가 함께 싸웁니다. 방을 만들고 방 코드를 친구에게 알려 주세요.</div>
      <div class="row"><button data-a="make" style="flex:1">방 만들기</button></div>
      <div class="dim" style="margin-top:10px">친구의 방 코드로 참가</div>
      <div class="row"><input maxlength="4" placeholder="CODE"><button data-a="join">참가</button></div>
      ${COOP.status ? `<div class="st">${esc(COOP.status)}</div>` : ''}`;
    const inp = coopBd.querySelector('input');
    inp.onfocus = () => { uiTyping = true; for (const k in keys) keys[k] = false; }; inp.onblur = () => { uiTyping = false; };
    const join = () => { const c = inp.value.trim().toUpperCase(); if (c.length !== 4) { COOP.status = '4글자 방 코드를 넣어 주세요.'; renderCoop(); return; } inp.blur(); coopJoin(c, false); };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') join(); };
    coopBd.querySelector('[data-a=make]').onclick = () => coopJoin(coopNewCode(), true);
    coopBd.querySelector('[data-a=join]').onclick = join;
    return;
  }
  const mems = [`<div class="mem"><span>${esc(player.name)} (나)${COOP.host ? ' · 방장' : ''}</span><span class="dim">${cls(party[active].key)} · ${DUN.on ? DUN.d.name : '야영지'}</span></div>`,
    ...[...COOP.peers.values()].map(p => `<div class="mem"><span>${esc(p.name || '동료')}${p.isHost ? ' · 방장' : ''}</span><span class="dim">${cls(p.key)} · ${esc(where(p))}</span></div>`)];
  coopBd.innerHTML = `<div class="dim" style="text-align:center">방 코드</div><div class="code">${COOP.code}</div>
    <div class="dim" style="text-align:center;margin-bottom:8px">${COOP.host ? '친구가 이 코드로 참가하면 됩니다. 방장이 던전에 들어가면 모두 함께 들어갑니다.' : '방장이 던전에 들어가면 자동으로 함께 들어갑니다.'}</div>
    ${mems.join('')}
    ${COOP.status ? `<div class="st">${esc(COOP.status)}</div>` : ''}
    <div class="dim" style="margin-top:8px">채팅(Enter)은 동료에게도 보입니다. 레이드에서는 사람이 늘어난 만큼 AI 동료가 빠집니다.</div>
    <div class="row" style="justify-content:flex-end"><button class="b2" data-a="copy">코드 복사</button><button class="b2" data-a="leave">방 나가기</button></div>`;
  coopBd.querySelector('[data-a=copy]').onclick = () => { try { navigator.clipboard.writeText(COOP.code); toast('복사했습니다', COOP.code, '#9ad8ff'); } catch (e) {} };
  coopBd.querySelector('[data-a=leave]').onclick = () => coopLeave();
}
const _coopRenderWin = renderWin;
renderWin = function (id) { if (id === 'wCoop') return renderCoop(); return _coopRenderWin(id); };
setInterval(() => { if (COOP.on) renderCoop(); }, 2000);
// 시험용: ?coop=CODE (방장) · ?coopj=CODE (참가)
{
  const q = new URLSearchParams(location.search);
  if (q.get('coop')) coopJoin(q.get('coop').toUpperCase(), true).then(() => { if (q.get('cdun')) setTimeout(() => enterDungeon(q.get('cdun') === 'raid' ? DUNGEONS.findIndex(d => d.raid) : +q.get('cdun'), true), 2500); });
  else if (q.get('coopj')) coopJoin(q.get('coopj').toUpperCase(), false);
  if (q.get('coophit')) setInterval(() => { const m = mons.find(m => m.cid != null && m.state !== 'dead' && m.state !== 'spawn' && !m.invuln); if (DUN.on && m) hitTarget(m.tg, +q.get('coophit'), m.x - 1, m.z, '#ffffff'); }, 700);
  if (q.get('coopexit')) setInterval(() => { if (DUN.on && exitGate.open) { party[active].x = exitGate.x; party[active].z = exitGate.z; } }, 500);
  if (q.get('coopdbg')) setInterval(() => console.log('COOP', JSON.stringify({ host: COOP.host, on: COOP.on, peers: [...COOP.peers.values()].map(p => [p.name, p.key, p.ar, p.rm, !!(p.av && p.av.mesh.visible)]), dun: DUN.on, room: DUN.room, hp: Math.round(party[active].hp), raid: raidOn() ? [RAID.revives, r2(RAID.shieldT), RAID.pillars.map(p => Math.round(p.charge)).join('/'), coopAICount(), Math.round(RAID.t)] : 0, cleared: DUN.cleared, mons: mons.map(m => m.cid + ':' + Math.round(m.hp) + ':' + m.state) })), 2000);
}

// ---- 레이드 ----
// 함께 있는 사람 수만큼 AI 동료를 뺀다 (참가자는 AI 동료 없음)
function coopAICount() {
  if (!COOP.on || !raidOn()) return 2;
  if (!COOP.host) return 0;
  let n = 1; const now = performance.now();
  for (const p of COOP.peers.values()) if (p.ar === 'dungeon' && p.dk === DUN.di && now - p.last < 5000) n++;
  return Math.max(0, 3 - n);
}
const _coopRaidFail = raidFail;
raidFail = function (why) { if (coopDun() && COOP.host) coopSend({ t: 'rfail', rm: DUN.room, why }); return _coopRaidFail(why); };
// 참가자의 레이드 갱신: 스스로 실패하거나 촉수를 부르지 않고, 방장이 보낸 상태를 따른다
function coopGuestRaid(dt) {
  if (RAID.room !== DUN.room) raidSetup();
  const A = party[active];
  if (!DUN.cleared) RAID.t += dt;
  if (A.down && !RAID.downed && !DUN.cleared) coopSend({ t: 'rdown', rm: DUN.room });
  RAID.downed = A.down; RAID.fail = false;
  if (DUN.cleared) { if (!RAID.rewarded) { RAID.rewarded = true; raidReward(DUN.room); } return; }
  RAID.rewarded = false;
  const S = COOP.rs; if (!S || S.rm !== DUN.room) return;
  RAID.t = S.rt; RAID.revives = S.rv;
  const bosses = mons.filter(m => m.def.raidBoss && m.state !== 'dead');
  if (DUN.room === 0) {
    RAID.pillars.forEach((p, i) => {
      const s = S.pl[i]; if (!s) return;
      const dead = !!s[2];
      if (dead && !p.dead) { p.mesh.visible = false; voidBurst(p.x, p.z, 30); toast('빛 기둥이 무너졌다', '8초 뒤 다시 세워진다', '#ff8ad8'); }
      if (!dead && p.dead) p.mesh.visible = true;
      p.hp = s[0]; p.charge = s[1]; p.dead = dead; p.rt = s[3];
      if (p.dead) { p.ring.material.opacity = 0.15; return; }
      p.ring.material.opacity = 0.4 + 0.4 * (p.charge / 100); p.ring.scale.setScalar(0.6 + p.charge / 250);
      if (Math.random() < dt * (4 + p.charge / 10)) glow.emit({ x: p.x + (Math.random() - 0.5) * 0.6, y: 0.2 + Math.random() * 3, z: p.z, vy: 1.5, life: 0.6, c: [2.4, 2.4, 2.8], size: PX });
    });
    if (S.sh > 0 && RAID.shieldT <= 0) { flashW = 0.4; flashCol = '240,240,255'; shake = 0.6; RAID.pillars.forEach(p => pillar(p.x, p.z, 0.6, 10, [2, 2, 2.6], 0.8)); toast('보호막 붕괴!', '15초 동안 보스를 공격하라', '#ffffff'); }
    if (S.sh <= 0 && RAID.shieldT > 0) toast('보호막 복구', '기둥을 다시 채워라', '#c8a0ff');
    RAID.shieldT = S.sh;
    const maw = bosses[0]; if (maw && maw.invuln && Math.random() < dt * 20) { const a = Math.random() * TAU; glow.emit({ x: maw.x + Math.cos(a) * 2.6, y: 1 + Math.random() * 4, z: maw.z + Math.sin(a) * 2, life: 0.4, c: [1.6, 1.6, 2.6], size: PX * 1.2 }); }
  } else if (DUN.room === 1) {
    const enr = S.en > 1;
    if (bosses.length && enr !== !!bosses[0].enr && enr) toast('갈라진 자 광폭!', '체력 차이가 10%를 넘었다', '#ff6a6a');
    for (const m of bosses) m.enr = enr;
    DUN.enrage = S.en;
    if (enr && Math.random() < dt * 30) for (const m of bosses) glow.emit({ x: m.x + (Math.random() - 0.5) * 2, y: Math.random() * 5, z: m.z, vy: 2, life: 0.4, c: [3, 0.4, 0.4], size: PX * 1.3 });
  }
}
{ const i = REGION.update.indexOf(updateRaid); if (i >= 0) REGION.update[i] = dt => (coopGuest() && raidOn() ? coopGuestRaid(dt) : updateRaid(dt)); }
