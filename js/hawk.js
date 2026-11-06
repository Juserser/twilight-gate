'use strict';
// 매사냥꾼: 표식 · 매 동료 · 덫 · 스킬

// ===================================================================
// 매사냥꾼: 표식 · 매 동료 · 스킬 8개 · 매 해방 (기획서 매사냥꾼 탭)
//  화살로 표식을 쌓고(최대 5), 매가 터뜨린다. 6m 이상 떨어져 쏘면 화살 피해 +15%
// ===================================================================
const HSKILLS = {
  Q: { tier: 1, name: '관통화살', full: '관통 화살', cd: 4 },
  E: { tier: 1, name: '매강습', full: '매 강습', cd: 6 },
  R: { tier: 2, name: '화살비', full: '화살비', cd: 9 },
  F: { tier: 2, name: '매듭덫', full: '매듭 덫 (2회 충전)', cd: 10 },
  Z: { tier: 3, name: '연환속사', full: '연환 속사 (누르고 있기)', cd: 11 },
  X: { tier: 3, name: '바람가르기', full: '바람 가르기 도약', cd: 9 },
  C: { tier: 4, name: '천둥매', full: '천둥 매', cd: 16 },
  V: { tier: 4, name: '황금대붕', full: '황금 대붕 강림', cd: 60 },
  G: { tier: 0, name: '매해방', full: '매 해방 (직업 게이지)', cd: 0 },
};
const HMANA = { Q: 20, E: 25, R: 40, F: 35, Z: 50, X: 40, C: 70, V: 120, G: 0 };
const LIB_DUR = 16; // 12초 + 4차 효과 4초
const TEAL = [0.9, 2.4, 2.0], GOLDH = [2.8, 2.1, 0.8], ELEC = [1.6, 2.2, 3.0];
const HINFO = {
  Q: { lv: 10, desc: '시위를 당겨 굵은 화살을 쏜다. 전방 12m를 관통하며 맞은 적 모두에게 표식 +2. 600%', tri: [[['빠른 시위', '당기는 시간 -40%'], ['걸으며 쏘기', '당기는 중 이동 100%'], ['넓은 화살', '폭 2배']], [['깊은 표식', '표식 +3'], ['반동 도약', '발사 후 2m 뒤로 도약'], ['약점 관통', '뚫을수록 피해 +10%, 최대 +50%']], [['세 갈래', '3발 부채꼴, 각 60% 위력'], ['폭발 화살', '끝 지점 반경 3m 폭발 300%']]] },
  E: { lv: 10, desc: '매에게 신호를 보내 가장 가까운 적(15m)을 3번 할퀴고, 쌓인 표식을 터뜨린다. 150×3 + 표식당 80%. 매가 때리는 동안 자유롭게 움직인다.', tri: [[['빠른 날갯짓', '비행 속도 +50%'], ['멀리 보는 눈', '사거리 +50%'], ['세 번째 부리', '할퀴기 +1회']], [['찢는 발톱', '출혈 5초, 초당 50%'], ['표식 갈취', '표식 폭발 피해 +50%'], ['눈 쪼기', '3초간 받는 무력화 +30%']], [['쌍매', '환영 매가 함께 공격, 피해 +70%'], ['귀환의 바람', '돌아올 때 주변 적을 밀쳐냄 200%']]] },
  R: { lv: 30, desc: '하늘로 쏜 화살이 3초 동안 반경 4m에 비처럼 내린다. 60×15 = 900%, 둔화 30%, 0.6초마다 표식 +1.', tri: [[['빠른 사격', '시전 -50%'], ['넓은 하늘', '반경 +25%'], ['먼 하늘', '거리 4~14m 조절']], [['무거운 비', '둔화 50%'], ['표식의 비', '표식 획득 2배'], ['지속', '4.5초']], [['폭풍우', '끝에 큰 화살 600% + 다운'], ['독화살 비', '중독 5초 초당 40%, 3중첩']]] },
  F: { lv: 30, desc: '발앞에 덫을 놓는다 (최대 3개, 30초). 밟은 적을 2초 묶고 폭발 400%. 덫을 화살로 맞히면 즉시 반경 4m 폭발 600%. 2회 충전.', tri: [[['빠른 설치', '걸으며 놓기'], ['넓은 덫', '감지 범위 +50%'], ['세 번째 덫', '충전 +1']], [['강철 사슬', '속박 3초'], ['감속 지대', '폭발 후 3초 둔화 장판'], ['표식 덫', '폭발 시 표식 5개 즉시']], [['연쇄 폭발', '원격 기폭 시 6m 안의 덫도 함께'], ['매 미끼', '덫 위로 매가 적을 끌어모음']]] },
  Z: { lv: 50, desc: '누르고 있는 동안 초당 10발 연사 (최대 2초, 이동 40%), 놓으면 강화 화살 800%. 55×20 + 800 = 최대 1,900%. 0.5초마다 표식 +1.', tri: [[['냉정한 손', '이동 80%'], ['빠른 장전', '연사 속도 +25%'], ['넓은 탄막', '좌우로 퍼짐, 각 70%']], [['연장 사격', '최대 3초'], ['표식 집중', '표식 획득 2배'], ['견고한 자세', '받는 피해 -30%']], [['마무리 저격', '강화 화살 +100%, 무력화 상'], ['매 협공', '연사 중 매가 0.5초마다 쪼기 120%']]] },
  X: { lv: 50, desc: '뒤로 6m 공중제비 (무적)하며 전방 부채꼴로 화살 7발 (140%씩, 넉백 3m). 착지 후 2초 이동 속도 +40%.', tri: [[['높은 도약', '거리 9m'], ['방향 도약', '입력한 방향으로 도약'], ['넓은 부채', '화살 +3']], [['회피 장전', '착지 후 관통 화살 쿨 초기화'], ['바람 장벽', '착지 지점에 2초 바람벽'], ['표식 확산', '화살마다 표식 +2']], [['폭풍 도약', '착지 지점에 4초 회오리'], ['연속 도약', '충전 2회']]] },
  C: { lv: 70, desc: '번개를 맞은 매가 15m를 왕복 돌진한다. 가는 길 900%, 오는 길 900%, 감전 240%, 표식당 300%. 표식 5개를 터뜨리면 무력화 최상.', tri: [[['빠른 충전', '준비 -40%'], ['넓은 번개', '폭 +60%'], ['긴 비행', '거리 +50%']], [['과충전', '감전 피해 2배'], ['뇌운', '경로에 3초 번개 장판, 초당 100%'], ['연쇄 번개', '적중한 적마다 주변 2명에게 200%']], [['천둥의 왕', '표식당 300 → 450%'], ['폭풍의 눈', '돌아온 매가 4초간 주변을 돌며 공격']]] },
  V: { lv: 70, desc: '[각성기] 거대해진 대붕을 타고 8번 급강하 (750%씩)한 뒤 하늘에서 거대 화살 (1,200%). 전 구간 무적. 매 해방 중에는 12번, 피해 +40%.', tri: [] },
  G: { lv: 1, desc: '[직업 게이지] 표식을 터뜨리고 매가 때리면 찬다. 16초 동안 매가 커져 1초마다 급강하 (250%), 화살 관통, 자동 강습 표식 5 → 3, 매 피해 +30%, 이동 +25%, 구르기 쿨 절반, 표식 있는 적이 받는 피해 +10%. 끝나면 매가 3초 쉰다.', tri: [] },
};

// ---- 아이콘 ----
function makeHIcon(kind) {
  const g = new Pix(22, 22, 2);
  eachPx(g, 0, 0, 22, 22, (px, py, X, Y) => {
    const dx = X - 11, dy = Y - 11, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let c = null;
    if (kind === 'Q') { if (r > 8.8 && r < 10 && Math.sin(a * 3) > 0.2) c = '#2a8a78'; if (Math.abs(dy + dx * 0.25) < 0.8 && dx > -8 && dx < 5) c = '#e8f0f0'; if (dx >= 4 && dx < 9 && Math.abs(dy + dx * 0.25) < (9 - dx) * 0.6) c = '#bff8e8'; if (dx < -6 && dx > -10 && Math.abs(dy + dx * 0.25) < 2.6 && Math.abs(dy + dx * 0.25) > 0.8) c = '#4ac8a8'; }
    if (kind === 'E') { for (let i = -1; i <= 1; i++) if (Math.abs(dx - i * 5 - (dy + 2) * 0.35) < 1.2 && dy > -7 && dy < 7) c = dy > 4 ? '#ffffff' : '#ffd060'; if (r > 9 && r < 10.2) c = '#b8862a'; }
    if (kind === 'R') { if (Y > 17) c = '#2a4a3a'; else if ((X + Y * 0.45) % 4.4 < 0.9 && Y > 2) c = Y > 14 ? '#ffffff' : '#bff8e8'; if (Y > 16 && Y < 17.6 && Math.abs(dx) < 7) c = '#4ac8a8'; }
    if (kind === 'F') { if (r < 8.4 && r > 6.6) c = '#a8b0b8'; else if (r <= 6.6 && r > 4.4 && Math.floor((a + Math.PI) / TAU * 14) % 2 === 0) c = '#e0e8f0'; if (r < 2.2) c = '#4ac8a8'; if (Math.abs(dy) < 0.6 && r < 8.4) c = '#5a6270'; }
    if (kind === 'Z') { for (const k of [-5, 0, 5]) { if (Math.abs(dy - k) < 0.6 && dx > -9 && dx < 5) c = '#e8f0f0'; if (dx >= 4 && dx < 8 && Math.abs(dy - k) < (8 - dx) * 0.55) c = '#bff8e8'; } if (r > 9 && r < 10.2 && Math.sin(a * 4) > 0) c = '#2a8a78'; }
    if (kind === 'X') { if (r > 6 && r < 8.5 && dx < 1 && dy < 4) c = r > 7.6 ? '#ffffff' : '#7affc8'; for (const an of [-0.5, 0, 0.5]) { const ux = Math.cos(an), uy = Math.sin(an), t = dx * ux + dy * uy; if (t > 1 && t < 10 && Math.abs(-dx * uy + dy * ux) < 0.6) c = '#e8f0f0'; } }
    if (kind === 'C') { if (r < 10.4) c = '#0e1830'; const zz = ((Y % 6) < 3 ? (Y % 3) * 1.6 : -(Y % 3) * 1.6) - 1; if (Math.abs(dx - zz) < 1.5 && Y > 1 && Y < 21) c = Math.abs(dx - zz) < 0.6 ? '#ffffff' : '#7ab8ff'; }
    if (kind === 'V') { if (r < 10.4) c = '#2a1c06'; if (Math.abs(dy + 2 - Math.abs(dx) * 0.55) < 2.2 && Math.abs(dx) < 10) c = Math.abs(dx) > 6 ? '#ffe8a0' : '#f0b030'; if (Math.abs(dx) < 1.4 && dy > -4 && dy < 6) c = '#fff4d0'; }
    if (kind === 'G') { const hw = 3.2 * (1 - Math.abs(dy) / 10); if (Math.abs(dx - dy * 0.3) < hw && Math.abs(dy) < 10) c = Math.abs(dx - dy * 0.3) < 0.6 ? '#fff8e0' : (Math.floor(Y) % 3 ? '#f0b030' : '#ffd860'); }
    if (c) g.fset(px, py, c);
  });
  return g.outline('#0c0814').canvas().toDataURL();
}
const H_ICON = {}; for (const k in HSKILLS) H_ICON[k] = makeHIcon(k);

// ---- 직업별 스킬 묶음 ----
function kitOf(key) {
  if (key === 'assassin') return { defs: ASKILLS, mana: AMANA, info: AINFO, icon: A_ICON, impl: AK };
  if (key === 'hawk') return { defs: HSKILLS, mana: HMANA, info: HINFO, icon: H_ICON, impl: HSK };
  if (key === 'berserker') return { defs: SKILLS, mana: MANA, info: SKILL_INFO, icon: SKILL_ICON_URL, impl: SK };
  return null;
}

// ---- 공용 도우미 ----
function later(t, fn) { addFx(new THREE.Group(), t, f => { if (f.t >= t && !f.fired) { f.fired = true; fn(); } }); }
function moveIn(c, dt, spd) { const [mx, mz, ok] = inputDir(); if (ok) { c.x += mx * spd * dt; c.z += mz * spd * dt; collide(c, 0.35); } }
function nearestTarget(c, R) {
  let best = null, bd = R;
  // 허수아비보다 몬스터를 먼저 노린다
  for (const tg of targets) { if (!tg.alive()) continue; const d = Math.hypot(tg.x - c.x, tg.z - c.z); if (d < R && d + (tg === targets[0] ? 6 : 0) < bd) { bd = d + (tg === targets[0] ? 6 : 0); best = tg; } }
  return best;
}
// 가장 가까운 적을 향한 방향 (없으면 바라보는 쪽)
function aimDir(c, R = 15) {
  const tg = nearestTarget(c, R), [rx, rz] = camRight();
  if (!tg) return [rx * c.face, rz * c.face, null];
  let dx = tg.x - c.x, dz = tg.z - c.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const sd = dx * rx + dz * rz; if (Math.abs(sd) > 0.05) c.face = sd > 0 ? 1 : -1;
  return [dx, dz, tg];
}
const farMul = tg => Math.hypot(tg.x - party[1].x, tg.z - party[1].z) >= 6 ? 1.15 : 1;
function feathers(x, y, z, n, col = ['#ffe08a', '#f0c050', '#fff4d0']) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = 1 + Math.random() * 4;
    soft.emit({ x, y, z, vx: Math.cos(a) * s, vy: 1 + Math.random() * 3, vz: Math.sin(a) * s * 0.7, grav: 2.5, drag: 2.2, life: 1.6 + Math.random() * 1.4, c: lc(col[i % col.length]), size: PX * (1.3 + Math.random()), ph: Math.random() * 6, upd: (p, d) => { p.vx += Math.sin(p.t * 5 + p.ph) * d * 3; settle(p); } });
  }
}
function lightLine(x, z, dx, dz, L, col, life, y = 1.6) {
  const g = new THREE.PlaneGeometry(L, 0.09); g.translate(L / 2, 0, 0);
  const m = new THREE.Mesh(g, addMat(...col, 0.9)); m.position.set(x, y, z); m.rotation.y = Math.atan2(-dz, dx);
  addFx(m, life, f => { m.material.opacity = 0.9 * (1 - f.t / life); });
}
function stuckArrow(x, z) {
  const inner = new THREE.Mesh(bbGeo(18 * PX, 5 * PX), new THREE.MeshBasicMaterial({ map: arrowTex.r, alphaTest: 0.5, side: THREE.DoubleSide, transparent: true }));
  inner.rotation.z = -0.9; const g = new THREE.Group(); g.add(inner); g.position.set(x, 0.05, z);
  addFx(g, 1, f => { inner.material.opacity = f.t > 0.7 ? 1 - (f.t - 0.7) / 0.3 : 1; }, true);
  dustRing(x, z, 6, 1.2, '#9c8466');
}
// 지그재그 번개
function boltFx(x0, y0, z0, x1, y1, z1, br = 1) {
  const N = 9, pts = [[x0, y0, z0]];
  for (let i = 1; i < N; i++) { const k = i / N; pts.push([x0 + (x1 - x0) * k + (Math.random() - 0.5) * 0.9, y0 + (y1 - y0) * k, z0 + (z1 - z0) * k + (Math.random() - 0.5) * 0.5]); }
  pts.push([x1, y1, z1]);
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.07);
    for (let j = 0; j < n; j++) { const k = j / n; glow.emit({ x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, z: a[2] + (b[2] - a[2]) * k, life: 0.16, c: j % 3 ? ELEC : [3, 3, 3], size: PX * 1.3 }); }
    if (br > 0 && Math.random() < 0.3) boltFx(b[0], b[1], b[2], b[0] + (Math.random() - 0.5) * 2, b[1] - 0.6 - Math.random(), b[2] + (Math.random() - 0.5), br - 1);
  }
}
const zigTex = (() => {
  const g = new Pix(96, 16, S), r = rng(7);
  let y = 8;
  for (let x = 0; x < 96; x += 3) { const ny = 3 + r() * 10; g.line(x, y, x + 3, ny, '#ffffff'); g.line(x, y + 1, x + 3, ny + 1, '#7ab8ff'); if (r() < 0.2) g.line(x, y, x + 2, y + (r() < 0.5 ? -4 : 4), '#7ab8ff'); y = ny; }
  return tex(g.canvas());
})();
function zigDecal(x, z, dx, dz, L, W, life) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(L, W).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: zigTex, transparent: true, alphaTest: 0.02, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(...ELEC), fog: false }));
  m.position.set(x + dx * L / 2, 0.05, z + dz * L / 2); m.rotation.y = Math.atan2(-dz, dx);
  addFx(m, life, f => { m.material.opacity = 1 - f.t / life; });
}

// ---- 표식 ----
const markThr = () => party[1].lib > 0 ? 3 : 5;
function gainLib(v) { const c = party[1]; if (!(c.lib > 0) && !(c.rest > 0)) c.idg = Math.min(100, c.idg + v); }
function addMark(tg, n) { if (!tg.alive() || !n) return; tg.marks = Math.min(5, (tg.marks || 0) + n); tg.markT = 4; }
// 표식 터뜨리기: 표식 하나당 per% · 표식 수만큼 금빛 링
function popMarks(tg, per, opt = {}) {
  const n = tg.marks || 0; if (!n || !tg.alive()) return 0;
  tg.marks = 0; tg.fullT = undefined;
  const ty = tg.y();
  for (let i = 0; i < n; i++) shockwave(tg.x, tg.z, 1.4 + i * 0.75, GOLDH, 0.3 + i * 0.07, 0.1 + i * 0.02);
  embers(tg.x, ty + tg.top, tg.z, 8 * n, GOLDH, 5);
  hitTarget(tg, P(per * n) * (party[1].lib > 0 ? 1.3 : 1), hawk.x, hawk.z, '#ffe08a', { stop: n >= 5 ? 0.08 : 0.04, shake: n >= 5 ? 0.45 : 0.22, sg: opt.sg, stack: 1 });
  floaters.push({ x: tg.x, y: ty + tg.top + 0.9, z: tg.z, t: -0.05, text: `표식 ${n}`, crit: false, vx: 0, color: '#ffd860' });
  gainLib(4 * n);
  return n;
}
function updateMarks(dt) {
  for (const tg of targets) {
    if (!tg.alive()) { tg.marks = 0; tg.fullT = undefined; continue; }
    if (!(tg.marks > 0)) continue;
    tg.markT -= dt; if (tg.markT <= 0) { tg.marks--; tg.markT = 4; }
    // 다 찬 뒤 2초 안에 직접 안 터뜨리면 매가 자동 강습
    if (tg.marks >= markThr()) {
      tg.fullT = (tg.fullT ?? 2) - dt;
      if (tg.fullT <= 0) { if (hawkCmd({ kind: 'auto', tg })) tg.fullT = undefined; else tg.fullT = 0.3; }
    } else tg.fullT = undefined;
  }
}
function drawMarks(g, w, h) {
  for (const tg of targets) {
    if (!(tg.marks > 0) || !tg.alive()) continue;
    const v = new THREE.Vector3(tg.x, tg.y() + tg.top + 0.3, tg.z).project(camera); if (v.z > 1) continue;
    const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h, full = tg.marks >= markThr(), blink = full && Math.floor(uTime.value * 10) % 2;
    for (let i = 0; i < 5; i++) {
      const on = i < tg.marks;
      g.save(); g.translate(sx + (i - 2) * 13, sy);
      g.beginPath(); g.moveTo(0, -7); g.lineTo(4, 0); g.lineTo(0, 7); g.lineTo(-4, 0); g.closePath();
      g.fillStyle = on ? (blink ? '#fff6c0' : '#ffc840') : 'rgba(20,16,10,.7)'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = on ? '#4a2e06' : 'rgba(255,220,140,.4)'; g.stroke();
      if (on) { g.fillStyle = '#fff8e0'; g.fillRect(-0.5, -5, 1, 10); }
      g.restore();
    }
    if (full && tg.fullT !== undefined) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(sx - 32, sy + 10, 64, 3); g.fillStyle = '#ff9a40'; g.fillRect(sx - 32, sy + 10, 64 * Math.max(0, tg.fullT) / 2, 3); }
  }
}

// ---- 매 동료: 새 명령이 우선 (나가 있던 매를 즉시 불러들인다) ----
function hawkCmd(cmd) {
  const h = hawk; if (h.mode === 'ctrl' || party[1].rest > 0) return false;
  Object.assign(h, { mode: 'cmd', cmd, t: 0, sx: h.x, sy: h.y, sz: h.z });
  return true;
}
function hawkHit(tg, dmg, opt = {}) {
  hitTarget(tg, dmg * (party[1].lib > 0 ? 1.3 : 1), hawk.x, hawk.z, opt.color || '#ffe6a0', { stop: 0.03, shake: 0.12, ...opt });
  gainLib(2);
  feathers(tg.x, tg.y() + 1.4, tg.z, 5, ['#d8c8a8', '#6a4428', '#f0ece0']);
}
function goldX(tg) { [45, -45].forEach(r => spawnSlash({ x: tg.x, y: tg.y() + 1.1, z: tg.z, size: 1.7, rot: r, face: 1, color: [1.5, 1.1, 0.35], life: 0.14 })); }
function thunderHits(h, set) {
  for (const tg of targets) {
    if (!tg.alive() || set.has(tg) || tg.y() > 3 || Math.hypot(tg.x - h.x, tg.z - h.z) > 1.25 + tg.r) continue;
    set.add(tg); hawkHit(tg, P(900), { sg: 10, stop: 0.05, shake: 0.3, color: '#bfe0ff' });
    boltFx(tg.x, tg.y() + 2.4, tg.z, tg.x + (Math.random() - 0.5) * 1.5, 0.1, tg.z, 1);
  }
}
function hawkRun(h, cmd, dt, o) {
  const T = h.t;
  if (cmd.kind === 'dive' || cmd.kind === 'auto') {
    const tg = cmd.tg; if (!tg.alive()) { h.mode = 'orbit'; return; }
    const k = Math.min(1, T / 0.32), e = k * k;
    h.x = h.sx + (tg.x - h.sx) * e; h.z = h.sz + (tg.z - h.sz) * e; h.y = h.sy + (tg.y() + 0.9 - h.sy) * e;
    glow.emit({ x: h.x + (Math.random() - 0.5) * 0.4, y: h.y + 0.4, z: h.z, life: 0.2, c: GOLDH, size: PX });
    if (k >= 1) {
      if (cmd.kind === 'auto') {
        hawkHit(tg, P(200), { sg: 4, stop: 0.05, shake: 0.25 });
        const n = tg.marks || 0; tg.marks = 0; tg.fullT = undefined;
        for (let i = 0; i < n; i++) shockwave(tg.x, tg.z, 1.2 + i * 0.5, GOLDH, 0.3, 0.1);
        floaters.push({ x: tg.x, y: tg.y() + tg.top + 0.9, z: tg.z, t: 0, text: '자동 강습', crit: false, vx: 0, color: '#d8b870' });
      } else hawkHit(tg, cmd.dmg, { sg: 4 });
      goldX(tg); h.mode = 'orbit'; h.t = 0;
    }
  } else if (cmd.kind === 'strike') {
    // 매 강습: 0.3초 날아가 0.15초 간격으로 3번 할퀴고 표식을 터뜨린다
    const tg = cmd.tg; if (!tg.alive()) { h.mode = 'orbit'; return; }
    if (T < 0.3) { const k = T / 0.3, e = k * k; h.x = h.sx + (tg.x - h.sx) * e; h.z = h.sz + (tg.z - h.sz) * e; h.y = h.sy + (tg.y() + 1.5 - h.sy) * e; for (let i = 0; i < 2; i++) glow.emit({ x: h.x + (Math.random() - 0.5) * 0.6, y: h.y + 0.4, z: h.z, life: 0.25, c: GOLDH, size: PX }); }
    else { h.x = tg.x + Math.sin(T * 26) * 0.5; h.z = tg.z + 0.05; h.y = tg.y() + 1.5 + Math.sin(T * 34) * 0.25; }
    for (let i = 0; i < 3; i++) once(cmd, 'r' + i, T >= 0.3 + i * 0.15, () => { hawkHit(tg, P(150), { sg: 10 }); goldX(tg); });
    once(cmd, 'pop', T >= 0.75, () => popMarks(tg, 80, { sg: 25 }));
    if (T > 0.85) { h.mode = 'orbit'; h.t = 0; }
  } else if (cmd.kind === 'thunder') {
    // 천둥 매: 번개를 맞고 15m 왕복 돌진 → 돌아오며 경로 전체 폭발
    if (cmd.ox === undefined) { Object.assign(cmd, { ox: o.x, oz: o.z, hit: new Set(), back: new Set() }); h.elec = 1.3; }
    const L = cmd.L, ex = cmd.ox + cmd.dx * L, ez = cmd.oz + cmd.dz * L;
    once(cmd, 'bolt', true, () => {
      boltFx(h.x + 0.5, 14, h.z, h.x, h.y + 0.5, h.z, 2); boltFx(h.x - 1.5, 14, h.z + 0.3, h.x, h.y + 0.5, h.z, 1); boltFx(h.x + 2, 14, h.z - 0.3, h.x, h.y + 0.5, h.z, 1);
      flashW = Math.max(flashW, 0.3); flashCol = '200,220,255'; fxFlash = 2.5; fxLight.color.set('#9ac8ff'); fxLight.position.set(h.x, 3, h.z); shake = Math.max(shake, 0.3);
    });
    if (T < 0.2) { const k = Math.min(1, dt * 12); h.x += (cmd.ox - h.x) * k; h.z += (cmd.oz - h.z) * k; h.y += (3.4 - h.y) * k; }
    else if (T < 0.45) {
      once(cmd, 'decal', true, () => zigDecal(cmd.ox, cmd.oz, cmd.dx, cmd.dz, L, 2.5, 1.4));
      const k = (T - 0.2) / 0.25; h.x = cmd.ox + cmd.dx * L * k; h.z = cmd.oz + cmd.dz * L * k; h.y = 1.5;
      thunderHits(h, cmd.hit);
      for (let i = 0; i < 4; i++) glow.emit({ x: h.x + (Math.random() - 0.5), y: 0.3 + Math.random() * 1.8, z: h.z + (Math.random() - 0.5) * 0.5, vy: 1, life: 0.3, c: ELEC, size: PX * 1.2 });
    } else if (T < 0.6) { h.x = ex; h.z = ez; h.y = 1.5 + (T - 0.45) * 4; if (Math.random() < 0.5) boltFx(h.x, h.y + 0.6, h.z, h.x + (Math.random() - 0.5) * 2, 0.1, h.z, 0); }
    else if (T < 0.85) { const k = (T - 0.6) / 0.25; h.x = ex + (o.x - ex) * k; h.z = ez + (o.z - ez) * k; h.y = 2.1 - k * 0.4; thunderHits(h, cmd.back); }
    else {
      once(cmd, 'boom', true, () => {
        for (let i = 0; i <= 5; i++) { const px = cmd.ox + cmd.dx * L * i / 5, pz = cmd.oz + cmd.dz * L * i / 5; later(i * 0.03, () => { shockwave(px, pz, 2.2, ELEC, 0.35); embers(px, 0.4, pz, 10, ELEC, 5); }); }
        const all = new Set([...cmd.hit, ...cmd.back]);
        for (const tg of all) { if (!tg.alive()) continue; hitTarget(tg, P(240), h.x, h.z, '#bfe0ff', { stop: 0.04, shake: 0.3, quiet: true, stack: 2 }); popMarks(tg, 300, { sg: tg.marks >= 5 ? 50 : 25 }); }
        flashW = Math.max(flashW, 0.3); flashCol = '210,230,255'; hitstop = Math.max(hitstop, 0.1); shake = Math.max(shake, 0.6);
      });
      h.mode = 'orbit'; h.t = 0;
    }
  }
}
function updateHawk(dt) {
  const o = party[1], h = hawk; h.t += dt;
  const lib = o.lib > 0;
  h.scl += ((h.mode === 'ctrl' ? h.sclT : lib ? 1.8 : 1) - h.scl) * Math.min(1, dt * 6);
  if (h.mode === 'orbit') {
    if (o.rest > 0) {
      // 해방이 끝나면 지쳐서 어깨에 앉아 쉰다
      const [rx, rz] = camRight(), k = Math.min(1, dt * 8);
      h.x += (o.x - rx * o.face * 0.25 - h.x) * k; h.z += (o.z - rz * o.face * 0.25 + 0.03 - h.z) * k; h.y += (2.1 - h.y) * k;
    } else {
      h.a += dt * 1.6; const k = Math.min(1, dt * 4);
      h.x += (o.x + Math.cos(h.a) * 1.4 - h.x) * k; h.z += (o.z + Math.sin(h.a) * 0.8 - h.z) * k;
      h.y += (3.2 + Math.sin(h.t * 2.3) * 0.2 - h.y) * k;
      if (lib) { h.libT -= dt; if (h.libT <= 0) { const tg = nearestTarget(o, 15); h.libT = tg ? 1 : 0.2; if (tg) hawkCmd({ kind: 'dive', tg, dmg: P(250) }); } }
    }
  } else if (h.mode === 'cmd') hawkRun(h, h.cmd, dt, o);
  const [rx, rz] = camRight(), sd = (h.x - h.px) * rx + (h.z - h.pz) * rz;
  if (Math.abs(sd) > 0.002) h.face = sd > 0 ? 1 : -1;
  const fast = Math.hypot(h.x - h.px, h.z - h.pz) > dt * 6;
  h.px = h.x; h.pz = h.z;
  // 해방 중 금빛 잔상, 천둥 매 전광
  h.elec = Math.max(0, (h.elec || 0) - dt);
  if ((lib || h.mode === 'ctrl') && Math.random() < 0.6) glow.emit({ x: h.x + (Math.random() - 0.5) * h.scl * 0.6, y: h.y + Math.random() * h.scl * 0.8, z: h.z, life: 0.35, c: GOLDH, size: PX });
  if (h.elec > 0 && Math.random() < 0.8) glow.emit({ x: h.x + (Math.random() - 0.5) * 0.8, y: h.y + Math.random() * 0.9, z: h.z, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 0.12, c: [3, 3, 3], size: PX });
  hawkMat.emissive.setRGB(h.elec > 0 ? 0.35 : lib ? 0.16 : 0, h.elec > 0 ? 0.45 : lib ? 0.1 : 0, h.elec > 0 ? 0.7 : lib ? 0.02 : 0);
  const fr = hawkTex[(h.mode === 'cmd' && fast) ? 1 : o.rest > 0 && h.mode === 'orbit' ? 0 : Math.floor(h.t * (h.scl > 2 ? 5 : 9)) % 2];
  hawkMat.map = h.face > 0 ? fr.r : fr.l;
  h.mesh.scale.setScalar(h.scl);
  h.mesh.position.set(h.x, h.y, h.z); h.sh.position.set(h.x, 0.015, h.z); h.sh.scale.set(0.45 * h.scl, 1, 0.22 * h.scl);
}

// ---- 화살 ----
function shootArrow(c, dx, dz, o) {
  const s = o.scale || 1, [rx, rz] = camRight(), f = (dx * rx + dz * rz) >= 0 ? 1 : -1, gold = party[1].lib > 0;
  const m = new THREE.Mesh(bbGeo(18 * PX * s, 5 * PX * s), new THREE.MeshBasicMaterial({ map: f > 0 ? arrowTex.r : arrowTex.l, alphaTest: 0.5, side: THREE.DoubleSide, color: gold ? new THREE.Color(1.6, 1.3, 0.7) : new THREE.Color(1, 1, 1) }));
  m.position.set(c.x + dx * 0.8, (o.y ?? 1.55) + (c.y || 0), c.z + dz * 0.8); scene.add(m); billboards.push(m);
  const sp = o.speed || 22;
  projs.push({ kind: 'harrow', mesh: m, vx: dx * sp, vz: dz * sp, life: (o.range || 15) * (1 + ((curTri(c) || {}).range || 0)) / sp, dmg: o.dmg, mark: o.mark ?? 1, pierce: o.pierce || party[1].lib > 0, hit: new Set(), sg: o.sg, spiral: o.spiral || 0, color: gold ? '#ffe08a' : '#bff8e8', stop: o.stop ?? 0.02, shake: o.shake ?? 0.08, kb: o.kb, onHit: o.onHit, onEnd: o.onEnd, age: 0, tail: gold ? GOLDH : TEAL });
}
function updateHArrow(p, dt) {
  const m = p.mesh, x = m.position.x, z = m.position.z, y = m.position.y + 2.5 * PX;
  p.age += dt;
  if (dt > 0) {
    glow.emit({ x, y, z, life: 0.1, c: [2.4, 2.6, 2.5], size: PX });
    glow.emit({ x: x + (Math.random() - 0.5) * 0.12, y: y + (Math.random() - 0.5) * 0.12, z, vx: -p.vx * 0.04, vz: -p.vz * 0.04, drag: 2, life: 0.3, c: p.tail, size: PX });
    const sp = Math.hypot(p.vx, p.vz) || 1, qx = -p.vz / sp, qz = p.vx / sp;
    for (let k = 0; k < p.spiral; k++) { const a = p.age * 40 + k * TAU / p.spiral; glow.emit({ x: x + qx * Math.cos(a) * 0.25, y: y + Math.sin(a) * 0.25, z: z + qz * Math.cos(a) * 0.25, life: 0.25, c: p.tail, size: PX }); }
  }
  // 덫을 쏘면 원격 기폭
  for (const tr of traps) if (!tr.boom && Math.hypot(tr.x - x, tr.z - z) < 0.8) { detonate(tr, true); if (!p.pierce) return true; }
  for (const tg of targets) {
    if (!tg.alive() || p.hit.has(tg) || tg.y() > 1.8 || Math.hypot(x - tg.x, z - tg.z) >= tg.r + 0.15) continue;
    p.hit.add(tg);
    hitTarget(tg, p.dmg, x - p.vx, z - p.vz, p.color, { mul: farMul(tg), stop: p.stop, shake: p.shake, sg: p.sg });
    addMark(tg, p.mark);
    if (p.kb) knock(tg, party[1].x, party[1].z, p.kb);
    if (p.onHit) p.onHit(tg, x, z);
    for (let i = 0; i < 8; i++) glow.emit({ x: tg.x, y: y, z: tg.z, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 2, drag: 3, life: 0.25, c: p.tail, size: PX });
    if (!p.pierce) { if (p.onEnd) p.onEnd(x, z, true); return true; }
  }
  if (p.life <= 0) { if (p.onEnd) p.onEnd(x, z, false); return true; }
  return false;
}
// 기본 공격: 속사 70% · 3발째 강화 140% · 구르기 후 조준 사격 220% · 공중이면 낙하 사격
function hawkShot(c) {
  if ((c.y || 0) > 0.6) { aerialShot(c); return; }
  const [dx, dz] = aimDir(c, 15);
  c.shotN = (c.shotN || 0) + 1;
  if (c.aimReady) {
    c.aimReady = false; c.aimCd = 3;
    shootArrow(c, dx, dz, { dmg: P(220), mark: 2, pierce: true, scale: 1.5, spiral: 2, speed: 30, stop: 0.04, shake: 0.18 });
    embers(c.x + dx * 0.9, 1.6, c.z + dz * 0.9, 16, TEAL, 3); fxFlash = 1.2; fxLight.color.set('#8affe0'); fxLight.position.set(c.x + dx, 1.6, c.z + dz);
  } else if (c.shotN % 3 === 0) shootArrow(c, dx, dz, { dmg: P(140), scale: 1.3, spiral: 1, speed: 26, stop: 0.03, shake: 0.12 });
  else shootArrow(c, dx, dz, { dmg: P(70) });
  for (let i = 0; i < 4; i++) glow.emit({ x: c.x + dx * 0.4, y: 1.3 + i * 0.12, z: c.z + dz * 0.4, life: 0.05, c: [3, 3, 3], size: PX });
}
function aerialShot(c) {
  c.vy = Math.max(c.vy || 0, 2.4); // 잠깐 체공
  const [dx, dz] = aimDir(c, 15), sy = c.y + 1.4, sx = c.x, sz = c.z, fc = c.face;
  [-0.35, 0, 0.35].forEach((a, i) => {
    const cs = Math.cos(a), sn = Math.sin(a), ddx = dx * cs - dz * sn, ddz = dx * sn + dz * cs, dist = 2.6 + i * 0.4;
    const tx = sx + ddx * dist, tz = sz + ddz * dist;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.06), addMat(2.2, 2.6, 2.4, 0.9)); m.rotation.z = fc > 0 ? -0.8 : 0.8;
    addFx(m, 0.14, f => { const k = Math.min(1, f.t / 0.14); m.position.set(sx + (tx - sx) * k, sy * (1 - k) + 0.1, sz + (tz - sz) * k); }, true);
    later(0.14, () => {
      dustRing(tx, tz, 6, 1.4, '#9c8466'); embers(tx, 0.2, tz, 6, TEAL, 3);
      for (const tg of targets) if (tg.alive() && tg.y() < 1.5 && Math.hypot(tg.x - tx, tg.z - tz) < 1.3 + tg.r) { hitTarget(tg, P(90), sx, sz, '#bff8e8', { mul: farMul(tg), stop: 0.02, shake: 0.06, stack: i }); addMark(tg, 1); }
    });
  });
}

// ---- 화살비 ----
function rainStreak(px, pz, R) {
  const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * R, tx = px + Math.cos(a) * rr, tz = pz + Math.sin(a) * rr * 0.9;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.75), addMat(1.2, 1.9, 1.8, 0.6)); m.rotation.z = 0.35;
  addFx(m, 0.2, f => {
    const k = Math.min(1, f.t / 0.2); m.position.set(tx - 2 * (1 - k), 0.6 + 7 * (1 - k), tz);
    if (k >= 1 && !f.sp) { f.sp = true; glow.emit({ x: tx, y: 0.1, z: tz, vy: 1.5, life: 0.2, c: TEAL, size: PX }); soft.emit({ x: tx, y: 0.08, z: tz, vy: 0.4, drag: 3, life: 0.4, c: lc('#9c8466'), size: PX * 1.6, grow: 1.4, a: 0.6 }); }
  }, true);
}
function arrowRain(px, pz) {
  const R = 4, st = { n: 0 };
  const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.12, R, 64).rotateX(-Math.PI / 2), addMat(...TEAL, 0.8)); ring.position.set(px, 0.06, pz);
  addFx(ring, 3.8, f => {
    const t = f.t; ring.material.opacity = t > 3.4 ? 0.8 * (3.8 - t) / 0.4 : 0.5 + 0.25 * Math.sin(t * 8);
    if (t > 0.15 && t < 3.25) rainStreak(px, pz, R);
    while (st.n < 15 && t >= 0.2 + st.n * 0.2) {
      st.n++;
      for (const tg of targets) if (tg.alive() && tg.y() < 2 && Math.hypot(tg.x - px, tg.z - pz) < R + tg.r * 0.5) {
        hitTarget(tg, P(60), px, pz, '#bff8e8', { mul: farMul(tg), stop: 0.01, shake: 0.04, quiet: true, stack: st.n % 4 });
        if (st.n % 3 === 0) addMark(tg, 1);
        if (tg.mon) tg.mon.slowT = 0.35;
      }
    }
    if (t >= 3.7 && !st.end) { st.end = true; for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, rr = Math.random() * R; glow.emit({ x: px + Math.cos(a) * rr, y: 0.1, z: pz + Math.sin(a) * rr, vy: 1 + Math.random() * 2, life: 0.6, c: TEAL, size: PX }); } }
  });
}

// ---- 매듭 덫 ----
const traps = [];
const trapTex = (() => {
  const g = new Pix(18, 18, S);
  eachPx(g, 0, 0, 18, 18, (px, py, X, Y) => {
    const r = Math.hypot(X - 9, Y - 9), a = Math.atan2(Y - 9, X - 9);
    if (r < 8 && r > 6.4) g.fset(px, py, '#8a92a0');
    else if (r <= 6.4 && r > 4.6 && Math.floor((a + Math.PI) / TAU * 16) % 2 === 0) g.fset(px, py, '#d8e0e8');
    else if (r < 2.2) g.fset(px, py, '#4ac8a8');
    if (Math.abs(Y - 9) < 0.6 && r < 8.5) g.fset(px, py, '#5a6270');
  });
  return tex(g.outline('#101418').canvas());
})();
function placeTrap(x, z) {
  if (traps.length >= 3) removeTrap(traps[0]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: trapTex, alphaTest: 0.5 }));
  m.position.set(x, 0.04, z); m.receiveShadow = true; scene.add(m);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 6).rotateX(-Math.PI / 2), addMat(...TEAL, 0.6)); ring.position.set(x, 0.05, z); scene.add(ring);
  traps.push({ x, z, t: 0, m, ring });
  dustRing(x, z, 8, 1.5, '#9c8466');
}
function removeTrap(tr) { const i = traps.indexOf(tr); if (i >= 0) traps.splice(i, 1); scene.remove(tr.m, tr.ring); disposeObj(tr.m); disposeObj(tr.ring); }
function detonate(tr, remote) {
  if (tr.boom) return; tr.boom = true;
  const R = remote ? 4 : 2, dmg = P(remote ? 600 : 400);
  shockwave(tr.x, tr.z, R + 0.4, [1.6, 2.6, 2.4], 0.4); shockwave(tr.x, tr.z, R * 0.6, [2.4, 2.6, 2.6], 0.25, 0.1);
  if (remote) { shockwave(tr.x, tr.z, R * 0.8, [2.2, 2.6, 2.4], 0.5, 0.12); embers(tr.x, 0.8, tr.z, 30, [3, 3, 3], 8); flashW = Math.max(flashW, 0.2); flashCol = '210,255,240'; shake = Math.max(shake, 0.45); }
  else shake = Math.max(shake, 0.3);
  debris(tr.x, tr.z, remote ? 20 : 10, 0.7); embers(tr.x, 0.4, tr.z, remote ? 40 : 20, [1.6, 2.8, 2.4], 6);
  fxFlash = 2; fxLight.color.set('#8affe0'); fxLight.position.set(tr.x, 0.8, tr.z);
  for (const tg of targets) if (tg.alive() && tg.y() < 2.5 && Math.hypot(tg.x - tr.x, tg.z - tr.z) < R + tg.r) hitTarget(tg, dmg, tr.x, tr.z, '#bff8e8', { stop: 0.06, shake: 0.35, sg: 10 });
  removeTrap(tr);
}
function updateTraps(dt) {
  for (const tr of [...traps]) {
    tr.t += dt; const armed = tr.t > 0.5;
    tr.ring.material.opacity = armed ? (Math.sin(tr.t * 6) > 0 ? 0.75 : 0.3) : 0.15; tr.ring.rotation.y += dt * 0.6;
    if (tr.t > 30) { removeTrap(tr); continue; }
    if (tr.trig !== undefined) { tr.trig += dt; if (tr.trig >= 0.3) detonate(tr, false); continue; }
    if (!armed) continue;
    for (const tg of targets) if (tg.alive() && tg.y() < 0.8 && Math.hypot(tg.x - tr.x, tg.z - tr.z) < 0.9 + tg.r) {
      tr.trig = 0; if (tg.mon) tg.mon.rootT = 2;
      // 밧줄 3가닥이 휘감는다
      for (let i = 0; i < 3; i++) {
        const rg = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32).rotateX(-Math.PI / 2 + 0.3 * (i - 1)), addMat(...TEAL, 0.9)), hy = 0.4 + i * 0.5;
        addFx(rg, 2, f => { const s = Math.max(tg.r + 0.1, 1.7 - f.t * 4); rg.scale.set(s, 1, s); rg.position.set(tg.x, tg.y() + hy, tg.z); rg.material.opacity = f.t > 1.7 ? (2 - f.t) / 0.3 * 0.9 : 0.9; });
      }
      tr.m.position.y = 0.3; break;
    }
  }
}

// ---- 매 해방 진행 · 버프 ----
function updateHawkKit(dt) {
  const c = party[1];
  if (c.lib > 0) {
    c.lib -= dt;
    if (c.lib <= 0) { c.lib = 0; c.rest = 3; log('매 해방이 끝났습니다. 매가 3초 동안 쉽니다.', '전투'); floaters.push({ x: c.x, y: 3, z: c.z, t: 0, text: '매 휴식', crit: false, vx: 0, color: '#c8b8a0' }); }
    if (!c.down && Math.random() < dt * 12) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.8, y: 0.5 + Math.random() * 1.8, z: c.z, vy: 0.8, life: 0.5, c: GOLDH, size: PX });
  } else if (c.rest > 0) c.rest = Math.max(0, c.rest - dt);
  if (c.windT > 0 && Math.random() < dt * 30) { const a = uTime.value * 12 + Math.random(); glow.emit({ x: c.x + Math.cos(a) * 0.45, y: 0.15 + Math.random() * 0.3, z: c.z + Math.sin(a) * 0.3, vx: -Math.sin(a) * 2, vz: Math.cos(a) * 1.4, vy: 0.6, life: 0.3, c: TEAL, size: PX }); }
  updateMarks(dt); updateTraps(dt);
}

// ---- 스킬 구현 ----
const HSK = {
  // 1차 Q 관통 화살: 0.3초 당김(이동 30%) → 12m 관통, 표식 +2
  Q: {
    init(c, sk) { [sk.dx, sk.dz] = aimDir(c, 15); shockwave(c.x, c.z, 1.4, TEAL, 0.3); },
    update(c, sk, dt, F, ctrl) {
      const T = sk.t;
      if (T < 0.3) {
        if (ctrl) moveIn(c, dt, 4.2 * 0.3);
        const bx = c.x + sk.dx * 0.9, bz = c.z + sk.dz * 0.9, a = Math.random() * TAU;
        glow.emit({ x: bx + Math.cos(a) * 0.7, y: 1.6 + Math.sin(a) * 0.5, z: bz, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 2, life: 0.2, c: TEAL, size: PX });
      }
      once(sk, 'fire', T >= 0.3, () => {
        lightLine(c.x + sk.dx * 0.8, c.z + sk.dz * 0.8, sk.dx, sk.dz, 12, TEAL, 0.4);
        shootArrow(c, sk.dx, sk.dz, { dmg: P(600), mark: 2, pierce: true, scale: 2, spiral: 2, speed: 34, range: 12, sg: 4, stop: 0.04, shake: 0.2, onEnd: (x, z) => stuckArrow(x, z) });
        c.x -= sk.dx * 0.3; c.z -= sk.dz * 0.3; collide(c, 0.35);
        embers(c.x + sk.dx, 1.6, c.z + sk.dz, 14, TEAL, 4); shake = Math.max(shake, 0.15);
      });
      return { f: T < 0.3 ? F.atk[1] : F.atk[2], done: T > 0.5 };
    },
  },
  // 1차 E 매 강습: 신호만 보내고 플레이어는 자유
  E: {
    can(c) { if (c.rest > 0) return '매가 지쳐 쉬고 있습니다'; if (!nearestTarget(c, 15)) return '사거리 안에 대상이 없습니다'; return ''; },
    init(c, sk) { hawkCmd({ kind: 'strike', tg: nearestTarget(c, 15) }); const [rx, rz] = camRight(); embers(c.x + rx * c.face * 0.4, 2.4, c.z + rz * c.face * 0.4, 12, GOLDH, 2.5); },
    update(c, sk, dt, F) { return { f: F.atk[0], done: sk.t > 0.15 }; },
  },
  // 2차 R 화살비: 하늘로 한 발 → 3초 동안 반경 4m
  R: {
    init(c, sk) { const [dx, dz, tg] = aimDir(c, 15), d = tg ? Math.min(12, Math.hypot(tg.x - c.x, tg.z - c.z)) : 8; sk.px = c.x + dx * d; sk.pz = c.z + dz * d; },
    update(c, sk, dt, F) {
      const T = sk.t;
      once(sk, 'up', T >= 0.15, () => {
        const sx = c.x, sz = c.z, m = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 1.6), addMat(2.2, 2.6, 2.4, 1));
        addFx(m, 0.35, f => { const k = f.t / 0.35; m.position.set(sx, 2 + k * 12, sz); m.material.opacity = 1 - k; }, true);
        camZoomT = 1.2; later(1.4, () => { if (camZoomT === 1.2) camZoomT = 0; });
      });
      once(sk, 'zone', T >= 0.4, () => arrowRain(sk.px, sk.pz));
      return { f: T < 0.15 ? F.atk[1] : F.atk[2], done: T > 0.55 };
    },
  },
  // 2차 F 매듭 덫 (2회 충전)
  F: {
    charges: 2,
    init(c, sk) { const [rx, rz] = camRight(); placeTrap(c.x + rx * c.face, c.z + rz * c.face); },
    update(c, sk, dt, F) { return { f: F.atk[2], done: sk.t > 0.22 }; },
  },
  // 3차 Z 연환 속사: 누르는 동안 초당 10발, 놓으면 강화 화살
  Z: {
    init(c, sk) {
      sk.n = 0; sk.tick = 0;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 6), addMat(...TEAL, 0.9));
      addFx(ring, 3, f => { const [rx, rz] = camRight(); ring.position.set(c.x + rx * c.face * 0.95, 1.62, c.z + rz * c.face * 0.95 + 0.05); ring.rotation.z += 0.25; if (sk.rel !== undefined) ring.material.opacity *= 0.8; }, true);
    },
    update(c, sk, dt, F, ctrl) {
      const T = sk.t;
      if (sk.rel === undefined) {
        if (ctrl) moveIn(c, dt, 4.2 * 0.4);
        if (T >= 0.1) { sk.tick -= dt; while (sk.tick <= 0) { sk.tick += 0.1; sk.n++; const [dx, dz] = aimDir(c, 12), j = (Math.random() - 0.5) * 0.05; shootArrow(c, dx - dz * j, dz + dx * j, { dmg: P(55), mark: sk.n % 5 === 0 ? 1 : 0, speed: 34, range: 12, stop: 0.012, shake: 0.04 }); } }
        if (Math.random() < dt * 8) soft.emit({ x: c.x + (Math.random() - 0.5) * 0.6, y: 0.6, z: c.z, vy: -0.3, drag: 1, life: 1.2, c: lc('#d8c8a8'), size: PX * 1.2, upd: settle });
        const held = keys.KeyZ || T < simHold;
        if ((!held && T > 0.6) || T > 2.1) sk.rel = T;
        return { f: Math.floor(T * 20) % 2 ? F.atk[1] : F.atk[2], done: false };
      }
      const u = T - sk.rel;
      once(sk, 'big', u >= 0.12, () => {
        const [dx, dz] = aimDir(c, 12);
        shootArrow(c, dx, dz, { dmg: P(800), mark: 1, scale: 2.2, spiral: 3, speed: 34, range: 12, sg: 10, stop: 0.08, shake: 0.4,
          onHit: tg => { for (let i = 0; i < 8; i++) later(0.04 * i, () => { const ox = (Math.random() - 0.5) * 1.2, oy = Math.random() * 1.4; shockwave(tg.x + ox, tg.z, 0.8, TEAL, 0.2, tg.y() + 0.6 + oy); embers(tg.x + ox, tg.y() + 0.8 + oy, tg.z, 6, TEAL, 3); }); } });
        c.x -= dx; c.z -= dz; collide(c, 0.35); shockwave(c.x, c.z, 1.6, TEAL, 0.3); shake = Math.max(shake, 0.2);
      });
      return { f: u < 0.12 ? F.atk[1] : F.atk[2], done: u > 0.45 };
    },
  },
  // 3차 X 바람 가르기 도약: 뒤로 6m 공중제비(무적) + 부채꼴 7발, 착지 후 이동 +40%
  X: {
    init(c, sk) {
      [sk.dx, sk.dz] = aimDir(c, 15); sk.sx = c.x; sk.sz = c.z;
      shockwave(c.x, c.z, 2.2, [2, 2.4, 2.2], 0.3);
      for (let i = 0; i < 16; i++) { const a = Math.random() * TAU; soft.emit({ x: c.x, y: 0.2, z: c.z, vx: Math.cos(a) * 4, vy: 2 + Math.random() * 2, vz: Math.sin(a) * 3, grav: 6, drag: 1.5, life: 0.8, c: lc(['#5f904a', '#86b45a'][i % 2]), size: PX * 1.4, upd: settle }); }
    },
    update(c, sk, dt, F) {
      const T = sk.t;
      if (T >= 0.05 && T < 0.55) { const k = (T - 0.05) / 0.5, e = 1 - (1 - k) ** 2; c.x = sk.sx - sk.dx * 6 * e; c.z = sk.sz - sk.dz * 6 * e; collide(c, 0.35); c.y = Math.sin(k * Math.PI) * 2.2; c.inv = Math.max(c.inv, 0.05); if (Math.random() < dt * 25) spawnGhost(c); }
      once(sk, 'fire', T >= 0.3, () => {
        for (let i = 0; i < 7; i++) { const a = (i - 3) / 3 * Math.PI / 4, cs = Math.cos(a), sn = Math.sin(a); shootArrow(c, sk.dx * cs - sk.dz * sn, sk.dx * sn + sk.dz * cs, { dmg: P(140), mark: 1, speed: 28, range: 10, kb: 0.45, y: 1.2 }); }
        // 초록 초승달 바람 칼날
        const [rx, rz] = camRight(), f = (sk.dx * rx + sk.dz * rz) >= 0 ? 1 : -1, sx = c.x, sz = c.z, sy = c.y + 1.2;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), addMat(0.8, 2.4, 1.2, 0.8, ARC[3])); m.scale.x = f;
        addFx(m, 0.35, fx => { const k = fx.t / 0.35; m.position.set(sx + sk.dx * 10 * k, sy, sz + sk.dz * 10 * k); m.material.opacity = 0.8 * (1 - k); }, true);
      });
      once(sk, 'land', T >= 0.55, () => { c.y = 0; c.windT = 2; dustRing(c.x, c.z, 12, 2.5, '#9c8466'); spawnGhost(c); });
      return { f: T < 0.05 ? F.atk[0] : T < 0.55 ? F.atk[1] : F.atk[2], done: T > 0.7 };
    },
  },
  // 4차 C 천둥 매: 하늘로 번개 화살 → 매에게 번개 (이후 플레이어 자유)
  C: {
    can(c) { return c.rest > 0 ? '매가 지쳐 쉬고 있습니다' : ''; },
    init(c, sk) { [sk.dx, sk.dz] = aimDir(c, 15); },
    update(c, sk, dt, F) {
      const T = sk.t;
      once(sk, 'up', T >= 0.1, () => { const sx = c.x, sz = c.z, m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.8), addMat(...ELEC, 1)); addFx(m, 0.25, f => { const k = f.t / 0.25; m.position.set(sx, 2 + k * 12, sz); m.material.opacity = 1 - k; }, true); });
      once(sk, 'go', T >= 0.35, () => hawkCmd({ kind: 'thunder', dx: sk.dx, dz: sk.dz, L: 15 }));
      return { f: T < 0.1 ? F.atk[1] : F.atk[2], done: T > 0.45 };
    },
  },
  // 4차 V 황금 대붕 강림 (각성기): 대붕을 타고 급강하 8회 → 하늘에서 거대 화살
  V: {
    init(c, sk) {
      const L = c.lib > 0;
      cutin = { t: 0, name: '황금 대붕 강림', sub: '4차 · 각성기', hero: 'hawk', pal: ['rgba(0,26,24,.94)', 'rgba(150,110,20,.9)', 'rgba(0,20,18,.94)'], line: '#ffe8a0', subC: '#ffe8a0' };
      cine = 1; camZoomT = 3; dimT = 0.4;
      Object.assign(sk, { L, n: L ? 12 : 8, hx: hawk.x, hy: hawk.y, hz: hawk.z, px: c.x, pz: c.z });
      hawk.mode = 'ctrl'; hawk.sclT = 1;
    },
    update(c, sk, dt, F) {
      const T = sk.t, h = hawk, mul = sk.L ? 1.4 : 1, dI = 2.0 / sk.n, hh = 15 * PX * 1.1;
      c.inv = Math.max(c.inv, 0.15);
      const ride = () => { c.x = h.x; c.z = h.z + 0.02; c.y = h.y + hh * h.scl * 0.42; };
      if (T < 0.8) {
        const k = T / 0.8; h.x = sk.hx + (c.x - sk.hx) * k; h.z = sk.hz + (c.z - sk.hz) * k; h.y = sk.hy + (5.5 - sk.hy) * Math.sin(k * Math.PI / 2);
        once(sk, 'grow', T >= 0.45, () => { h.sclT = 3.2; flashW = Math.max(flashW, 0.35); flashCol = '255,230,160'; embers(h.x, h.y + 1, h.z, 80, GOLDH, 9); feathers(h.x, h.y + 1, h.z, 60); });
      } else if (T < 1.2) {
        const k = (T - 0.8) / 0.4;
        if (k < 0.5) { h.x = sk.px; h.z = sk.pz; h.y = 5.5 - 4.7 * (k / 0.5); }
        else { h.y = 0.8 + 3.7 * ((k - 0.5) / 0.5); ride(); }
        once(sk, 'board', k >= 0.5, () => { shockwave(sk.px, sk.pz, 4, GOLDH, 0.4); feathers(sk.px, 1.5, sk.pz, 30); dustRing(sk.px, sk.pz, 30, 6, '#9c8466'); });
      } else if (T < 1.2 + sk.n * dI) {
        const i = Math.min(sk.n - 1, Math.floor((T - 1.2) / dI)), u = (T - 1.2 - i * dI) / dI;
        if (sk.cur !== i) {
          sk.cur = i; sk.fx = h.x; sk.fz = h.z;
          const live = targets.filter(t => t.alive()), tg = live.length ? live[(i + 1) % live.length] : null, a = i * 2.4;
          sk.tx = tg ? tg.x + Math.cos(a) * 1.4 : sk.px + Math.cos(a) * 4; sk.tz = tg ? tg.z + Math.sin(a) * 1.0 : sk.pz + Math.sin(a) * 4;
        }
        h.x = sk.fx + (sk.tx - sk.fx) * Math.min(1, u * 1.6); h.z = sk.fz + (sk.tz - sk.fz) * Math.min(1, u * 1.6); h.y = 4.5 - 3.7 * Math.sin(u * Math.PI);
        ride();
        once(sk, 'd' + i, u >= 0.5, () => {
          shockwave(sk.tx, sk.tz, 4.4, GOLDH, 0.4); shockwave(sk.tx, sk.tz, 2.6, [2.6, 2.4, 1.8], 0.25, 0.1);
          feathers(sk.tx, 1, sk.tz, 18); dustRing(sk.tx, sk.tz, 26, 6, '#9c8466'); pillar(sk.tx, sk.tz, 0.5, 3, [1.4, 1.1, 0.5], 0.4); debris(sk.tx, sk.tz, 10, 0.7);
          shake = Math.max(shake, 0.4); fxFlash = 2; fxLight.color.set('#ffd070'); fxLight.position.set(sk.tx, 1, sk.tz);
          hitArea(c, { cx: sk.tx, cz: sk.tz, range: 4, dmg: P(750) * mul, sg: 25, stop: 0.04, shake: 0.4, maxY: 6, color: '#ffe08a', stack0: i % 4 });
        });
      } else {
        // 상공에서 거대 화살 → 착지
        const main = mainTarget(c, 30) || { x: sk.px, z: sk.pz, y: () => 0 };
        if (T < 3.4) { const k = Math.min(1, dt * 4); h.y += (5 - h.y) * k; ride(); }
        once(sk, 'arrowIn', T >= 3.22, () => {
          sk.mx = main.x; sk.mz = main.z;
          const g = new THREE.PlaneGeometry(1.6, 7); const m = new THREE.Mesh(g, addMat(2.8, 2.2, 1.0, 1));
          addFx(m, 0.18, f => { const k = f.t / 0.18; m.position.set(sk.mx, 12 - 9 * k, sk.mz); }, true);
        });
        once(sk, 'boom', T >= 3.4, () => {
          hitstop = 0.18; flashW = 0.6; flashCol = '255,240,200'; shake = 1.1; slowT = 0.4;
          impact(sk.mx, sk.mz, 6, GOLDH); pillar(sk.mx, sk.mz, 1.0, 14, [2.2, 1.7, 0.6], 0.6); crackDecal(sk.mx, sk.mz, 12, 3, [2.8, 2.1, 0.8]);
          feathers(sk.mx, 2, sk.mz, 50); embers(sk.mx, 0.5, sk.mz, 80, GOLDH, 10);
          hitArea(c, { cx: sk.mx, cz: sk.mz, range: 6, dmg: P(1200) * mul, sg: 25, launch: 8, stop: 0.18, shake: 1.1, maxY: 6, color: '#ffe08a' });
        });
        if (T >= 3.4) { const k = Math.min(1, (T - 3.4) / 0.4); h.y = 5 * (1 - k) + 0.2 * k; ride(); if (k >= 1) c.y = 0; }
      }
      if (T > 3.1) cine = 0;
      return { f: T < 0.8 ? F.atk[0] : T < 3.3 ? F.atk[1] : F.atk[2], done: T > 3.9 };
    },
    end(c, sk) {
      c.y = 0; collide(c, 0.35); hawk.mode = 'orbit'; hawk.t = 0; hawk.sclT = 1; cine = 0; camZoomT = 0;
      for (let i = 0; i < 6; i++) later(i * 0.4, () => feathers(c.x + (Math.random() - 0.5) * 6, 5, c.z + (Math.random() - 0.5) * 4, 8));
    },
  },
  // G 매 해방: 매가 솟구쳐 커지고, 날갯짓 2번으로 주변을 밀쳐낸다
  G: {
    can(c) { if (c.lib > 0) return '이미 매 해방 중입니다'; if (c.rest > 0) return '매가 지쳐 쉬고 있습니다'; if (!noCD && c.idg < 100) return '매 해방 게이지가 부족합니다'; return ''; },
    init(c, sk) { c.inv = Math.max(c.inv, 0.9); Object.assign(sk, { hx: hawk.x, hy: hawk.y, hz: hawk.z }); hawk.mode = 'ctrl'; hawk.sclT = 1; },
    update(c, sk, dt, F) {
      const T = sk.t, h = hawk;
      if (T < 0.35) { const k = T / 0.35; h.x = sk.hx + (c.x - sk.hx) * k; h.z = sk.hz + (c.z + 0.05 - sk.hz) * k; h.y = sk.hy + (8 - sk.hy) * k; }
      once(sk, 'grow', T >= 0.35, () => { c.lib = LIB_DUR; hawk.libT = 0.6; h.sclT = 1.8; flashW = Math.max(flashW, 0.25); flashCol = '255,230,160'; embers(h.x, h.y, h.z, 60, GOLDH, 8); feathers(h.x, h.y, h.z, 40); log(`매 해방! ${LIB_DUR}초 동안 매가 날뛴다.`, '전투'); });
      if (T >= 0.35 && T < 0.6) { const k = (T - 0.35) / 0.25; h.x = c.x; h.z = c.z + 0.05; h.y = 8 - 4.8 * k * k; }
      if (T >= 0.6) { h.x = c.x; h.z = c.z + 0.05; h.y = 3.2 + Math.sin(T * 20) * 0.15; }
      [0.65, 0.85].forEach((tt, i) => once(sk, 'w' + i, T >= tt, () => {
        shockwave(c.x, c.z, 4.5, [1.3, 1.4, 0.9], 0.4); shockwave(c.x, c.z, 3, [1.5, 1.2, 0.5], 0.3, 0.6); feathers(c.x, 3, c.z, 20);
        hitArea(c, { range: 3.5, dmg: P(200), kb: 1.5, stop: 0.05, shake: 0.3, color: '#ffe08a' });
      }));
      return { f: T < 0.6 ? F.atk[0] : F.atk[2], done: T > 1.0 };
    },
    end() { if (hawk.mode === 'ctrl') { hawk.mode = 'orbit'; hawk.t = 0; } },
  },
};
