'use strict';
// 스킬 실행기: 사용 · 진행 · 종료 (모든 직업 공통)

function useSkill(c, key) {
  const kit = kitOf(c.key);
  if (!kit) { floaters.push({ x: c.x, y: 3, z: c.z, t: 0, text: '아직 스킬이 없어요', crit: false, vx: 0, color: '#c8b8d8' }); return; }
  if (c.down || c.dash > 0 || (c.state === 'atk' && c.key === 'berserker')) return;
  const impl = kit.impl[key]; if (!impl) return;
  let cancelled = false;
  if (c.state === 'skill') {
    // 암살자: 후딜을 다른 스킬로 끊을 수 있다
    const cur = c.sk && (c.sk.impl || SK)[c.sk.id];
    if (!(c.key === 'assassin' && cur && c.sk.id !== key && ((cur.cancelAt !== undefined && c.sk.t >= cur.cancelAt) || c.sk.canCancel))) return;
    cancelled = true;
  }
  if (impl.recastable && impl.recastable(c)) { if (cancelled) endSkill(c); impl.recast(c); if (c.stealth > 0) c.sk.amb = true; assOnCast(c, 'E2', cancelled); return; }
  if (impl.charges) { if (!noCD && !(c.fCh > 0)) return; } else if (c.cd[key] > 0 && !noCD) return;
  if (!noCD && c.mp < kit.mana[key]) { floaters.push({ x: c.x, y: 3, z: c.z, t: 0, text: '마나가 부족합니다', crit: false, vx: 0, color: '#7ab8ff' }); log('마나가 부족합니다.'); return; }
  let msg = impl.can ? impl.can(c) : '';
  if (!msg && c.key === 'berserker' && key === 'G') msg = c.berserk > 0 ? '이미 광폭화 중입니다' : c.exhaust > 0 ? '탈진 중입니다' : !noCD && c.idg < 100 ? '광폭화 게이지가 부족합니다' : '';
  if (msg) { floaters.push({ x: c.x, y: 3, z: c.z, t: 0, text: msg, crit: false, vx: 0, color: '#ff8a6a' }); return; }
  if (cancelled) endSkill(c);
  if (!noCD) c.mp -= kit.mana[key];
  if (key === 'G') c.idg = 0;
  c.state = 'skill';
  if (impl.charges) { if (!noCD) { c.fCh--; if (c.cd[key] <= 0) c.cd[key] = Math.max(0.5, kit.defs[key].cd + ((triFx(c, key) || {}).cd || 0)) * gearCdr(c); } }
  else c.cd[key] = noCD ? 0 : Math.max(0.5, kit.defs[key].cd + ((triFx(c, key) || {}).cd || 0)) * gearCdr(c);
  c.sk = { id: key, t: 0, impl: kit.impl };
  if (c.key === 'assassin' && c.stealth > 0 && key !== 'G') c.sk.amb = true;
  if (impl.init) impl.init(c, c.sk);
  triOnStart(c, key);
  if (c.key === 'assassin') assOnCast(c, key, cancelled);
}
function endSkill(c) {
  if (!c.sk) return;
  const impl = (c.sk.impl || SK)[c.sk.id]; if (impl.end) impl.end(c, c.sk);
  triOnEnd(c, c.sk);
  if (typeof showTotal === 'function') showTotal(c, c.sk);
  if (c.sk.id === 'V' || c.sk.id === 'C' || c.sk.id === 'X') { cine = 0; camZoomT = 0; }
  if (c.key === 'assassin') c.lastEnd = uTime.value;
  c.state = 'idle'; c.t = 0; c.y = 0; c.sk = null;
}
function updateSkill(c, dt, ctrl) {
  const sk = c.sk, fast = c.berserk > 0 && sk.id !== 'G' && sk.id !== 'V' && sk.id !== 'C';
  sk.t += dt * (fast ? 1.2 : 1) * (1 + ((curTri(c) || {}).spd || 0));
  const r = (sk.impl || SK)[sk.id].update(c, sk, dt, c.fr, ctrl);
  const face = r.face ?? c.face;
  c.mat.map = face > 0 ? r.f.r : r.f.l;
  c.mesh.position.set(c.x, -3.5 * PX + (c.y || 0), c.z);
  c.sh.position.set(c.x, 0.015, c.z);
  const hs = 1 / (1 + (c.y || 0) * 0.4); c.sh.scale.set(0.85 * hs, 1, 0.45 * hs);
  c.mesh.visible = !sk.hide; c.cur = r.f;
  if (r.done) { endSkill(c); c.sh.scale.set(0.85, 1, 0.45); }
}

let simHold = 0;
