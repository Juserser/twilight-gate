'use strict';
// 그림자 암살자: 연계 · 뒤치기 · 구슬 · 은신 · 스킬

// ===================================================================
// 그림자 암살자: 연계 · 뒤치기 · 그림자 구슬 · 은신 (기획서 그림자 암살자 탭)
//  스킬 후딜을 다른 스킬로 끊으면 연계 +1 (최대 5, 단계당 +3%)
//  적 등 뒤 120°에서 맞히면 뒤치기 +20% · 치명 +10%. 은신에서 첫 스킬은 기습 (+30%, 확정 치명)
// ===================================================================
const ASKILLS = {
  Q: { tier: 1, name: '그림자돌파', full: '그림자 돌파', cd: 5 },
  E: { tier: 1, name: '단검투척', full: '단검 투척 (다시 누르면 파고들기)', cd: 7 },
  R: { tier: 2, name: '그림자분신', full: '그림자 분신', cd: 16 },
  F: { tier: 2, name: '연막', full: '연막', cd: 14 },
  Z: { tier: 3, name: '천갈래', full: '천 갈래 찌르기 (누르고 있기)', cd: 12 },
  X: { tier: 3, name: '사슬', full: '사슬 낚아채기', cd: 10 },
  C: { tier: 4, name: '망자의무도', full: '망자의 무도', cd: 18 },
  V: { tier: 4, name: '월식', full: '월식', cd: 60 },
  G: { tier: 0, name: '그림자잠행', full: '그림자 잠행 (직업 게이지)', cd: 8 },
};
const AMANA = { Q: 20, E: 25, R: 40, F: 35, Z: 50, X: 40, C: 70, V: 120, G: 0 };
const PURP = [1.6, 0.55, 2.4], PINK = [2.8, 0.7, 1.6], ASH = ['#1a1222', '#2a1a34', '#3a2448'];
const AINFO = {
  Q: { lv: 10, desc: '검은 줄기가 되어 6m를 뚫고 지나가며 두 번 벤 뒤(300%×2, 돌진 중 무적), 돌아서며 역수 베기(200%, 항상 뒤치기). 800%', tri: [[['긴 그림자', '돌진 거리 9m'], ['재빠른 손', '쿨 -1초'], ['넓은 띠', '폭 2배']], [['깊은 상처', '출혈 5초, 초당 40%'], ['되돌아 돌파', '2초 안에 한 번 더 (60%)'], ['급소 노리기', '역수 베기 치명 피해 +50%']], [['그림자 낙인', '지나간 길이 1.5초 뒤 터짐 400%'], ['잔상 삼연', '잔상이 두 번 더 베기 (각 30%)']]] },
  E: { lv: 10, desc: '단검 3자루를 부채꼴로 던진다 (120%씩). 박히면 3초 안에 E를 다시 눌러 그 적의 등 뒤로 순간이동해 파고든다 (540%, 뒤치기).', tri: [[['멀리 던지기', '사거리 18m'], ['부채 펼치기', '단검 5자루'], ['긴 박힘', '재사용 6초']], [['마비 독', '박힌 적 속도 -25% 3초'], ['연기 파고들기', '파고들기가 주변 3m 피해'], ['구슬 사냥', '파고들기 구슬 +2']], [['그림자 엮기', '단검이 최대 3마리에 박힘'], ['굴절 찌르기', '파고들기 +250%, 무력화 상']]] },
  R: { lv: 25, desc: '가장 가까운 적의 반대편에 분신이 솟아 벤다 (300%). 6초 동안 내 다음 스킬 3개를 40%로 따라 하고, 분신의 타격은 항상 뒤치기. 적은 분신을 먼저 노린다 (보스는 처음 1.5초만).', tri: [[['오래 가는 그림자', '지속 9초'], ['빠른 소환', '쿨 -3초'], ['도발', '분신이 있는 동안 나를 노리지 않음 (보스 제외)']], [['더 짙은 그림자', '따라 하기 55%'], ['그림자 맞바꾸기', 'R을 다시 누르면 자리 교체'], ['구슬 흡수', '사라질 때 구슬 +1']], [['두 그림자', '분신 2개, 각 30%'], ['자폭', '사라질 때 반경 4m 600%']]] },
  F: { lv: 25, desc: '연막탄을 던져 5초 동안 반경 4m를 가린다. 터질 때 200%, 독 초당 60%. 연막 안의 아군은 몬스터가 노리지 못하고, 연막 안에서 때리면 뒤치기 보너스의 절반 (+10%).', tri: [[['넓은 연막', '반경 5.5m'], ['진한 독', '독 2배'], ['멀리 던지기', '사거리 14m']], [['숙마', '연막 안 아군 이동 +20%'], ['눈멀기', '연막 안 적 피해 -15%'], ['발밑 연막', '제자리에 터뜨리고 뒤로 도약']], [['독무 폭발', '끝날 때 남은 독 400%'], ['그림자 둥지', '연막 안에서 연계가 줄지 않음']]] },
  Z: { lv: 45, desc: '누르고 있는 동안 최대 2초 찌른다 (65%×24, 이동 40%, 슈퍼아머). 떼면 X자 마무리 340%. 최대 1,900%', tri: [[['넓은 찌르기', '각도 120°'], ['빠른 발동', '처음 0.3초 타속 +50%'], ['난도 걸음', '이동 70%']], [['깊은 찌르기', '뒤치기면 추가 +15%'], ['구슬 모으기', '8타마다 구슬 +1 (최대 3)'], ['힘주기', '지속 3초, 쿨 +4초']], [['작별 베기', '마무리가 6m 검기 1,000%'], ['피바람', '찌르는 동안 받는 피해 -30%']]] },
  X: { lv: 45, desc: '그림자 사슬을 10m 던져 맞힌 적의 등 뒤로 끌려가 3연 처형 (200 + 300 + 700%, 무력화 상). 공격을 준비하는 적에게 맞히면 그 공격을 끊고 무력화 2배. 빗나가면 쿨 절반.', tri: [[['긴 사슬', '사거리 15m'], ['빠른 사슬', '던지기 속도 +50%'], ['넓은 사슬', '판정 폭 2배']], [['사슬 깨기', '끊기 무력화 3배'], ['처형자', '체력 30% 이하면 내리찍기 +60%'], ['끌어내기', '경로의 적 최대 3마리 함께']], [['그림자 묶기', '처형 후 2초 속박'], ['두 번째 사슬', '3초 안에 한 번 더 (400%)']]] },
  C: { lv: 70, desc: '그림자 구슬을 모두 쓴다. 반경 8m의 적 주위에 0.15초마다 나타났다 사라지며 6 + 구슬 수만큼 벤다 (310%씩, 모두 뒤치기, 무적). 단검을 거두는 순간 남은 자국이 한꺼번에 터진다.', tri: [[['넓은 무도', '반경 12m'], ['빠른 발', '간격 0.1초'], ['무도의 입장', '연계 5단계에서 쓰면 +2타']], [['죽음의 표', '5초간 받는 뒤치기 피해 +10%'], ['남은 그림자', '끝난 뒤 구슬 +2'], ['심장 겨냥', '치명 피해 +40%']], [['망자의 합창', '잔상들이 한 번 더 베기 (80%)'], ['고요한 죽음', '타수 8 고정, 구슬을 쓰지 않음']]] },
  V: { lv: 70, desc: '[각성기] 달이 가려지고 적의 시간이 멈춘다. 어둠 속에서 12번 벤 뒤 (300%씩) 초승달 내리베기 3,600%. 전 구간 무적, 끝나면 구슬 5개 충전. 은신 중에 쓰면 16번에 마지막 일격이 기습.', tri: [] },
  G: { lv: 1, desc: '[직업 게이지] 그림자 구슬을 모두 써서 은신한다 (1초 + 구슬당 0.6초). 다음 스킬이 기습: 피해 +30%, 확정 치명, 뒤치기. 구슬 5개면 첫 기습 뒤 0.5초 다시 은신해 한 번 더. 구슬은 스킬 뒤치기 · 기본 공격 10타 · 연계 5단계로 찬다.', tri: [] },
};

// ---- 아이콘 ----
function makeAIcon(kind) {
  const g = new Pix(22, 22, 2);
  eachPx(g, 0, 0, 22, 22, (px, py, X, Y) => {
    const dx = X - 11, dy = Y - 11, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let c = null;
    if (kind === 'Q') { if (Math.abs(dy) < 3.2 && dx > -10 && dx < 8) c = Math.abs(dy) < 1 ? '#3a1a4a' : '#1a0c22'; if (Math.abs(dy + 1.5) < 0.5 && dx > -9 && dx < 7) c = '#ff7ab8'; if (dx > 5 && dx < 9 && Math.abs(dy) < (9 - dx) * 0.9) c = '#d8b0ff'; }
    if (kind === 'E') { for (const an of [-0.45, 0, 0.45]) { const ux = Math.cos(an), uy = Math.sin(an), t = dx * ux + dy * uy, p = -dx * uy + dy * ux; if (t > -7 && t < 8 && Math.abs(p) < (t > 3 ? (8 - t) * 0.25 : 0.9)) c = t > 3 ? '#e8e0ff' : '#7a4a9a'; } }
    if (kind === 'R') { if (Math.hypot(dx + 4, dy - 4) < 5 || Math.hypot(dx + 4, dy + 4) < 2.6) c = '#c8a8e0'; if (Math.hypot(dx - 4, dy - 4) < 5 || Math.hypot(dx - 4, dy + 4) < 2.6) c = '#120818'; if (Math.hypot(dx - 3, dy + 4.5) < 0.8) c = '#ff5aa0'; }
    if (kind === 'F') { for (const [cx, cy, rr] of [[-4, 2, 5], [3, 1, 6], [0, -4, 5]]) if (Math.hypot(dx - cx, dy - cy) < rr) c = (Math.floor(X) + Math.floor(Y)) % 3 ? '#4a3a58' : '#6a5a7a'; if (Math.hypot(dx + 1, dy + 1) < 1.4) c = '#c070ff'; }
    if (kind === 'Z') { for (let k = -3; k <= 3; k++) { const an = k * 0.18, ux = Math.cos(an), uy = Math.sin(an), t = dx * ux + dy * uy; if (t > -8 && t < 9 && Math.abs(-dx * uy + dy * ux) < 0.55) c = k === 0 ? '#ffffff' : '#c890ff'; } }
    if (kind === 'X') { for (let k = -2; k <= 2; k++) { const cx = k * 4, cy = -k * 4; const e = Math.hypot((dx - cx) * 0.8, dy - cy); if (e > 1.6 && e < 2.8) c = '#9a7ab8'; } if (dx > 6 && dy < -6) c = '#e8e0ff'; }
    if (kind === 'C') { const R5 = 8.5; for (let k = 0; k < 5; k++) { const a0 = -Math.PI / 2 + k * TAU / 5, a1 = a0 + TAU * 2 / 5, x0 = Math.cos(a0) * R5, y0 = Math.sin(a0) * R5, x1 = Math.cos(a1) * R5, y1 = Math.sin(a1) * R5, ex = x1 - x0, ey = y1 - y0, L = Math.hypot(ex, ey), t = ((dx - x0) * ex + (dy - y0) * ey) / L; if (t > 0 && t < L && Math.abs((dx - x0) * ey - (dy - y0) * ex) / L < 0.7) c = '#ff7ab8'; } if (r < 1.5) c = '#ffffff'; }
    if (kind === 'V') { if (r < 10.4) c = '#0a0410'; if (r > 6.4 && r < 8) c = Math.sin(a * 6) > 0 ? '#ff5aa0' : '#a03070'; if (r <= 6.4) c = '#000000'; if (Math.hypot(dx + 2, dy - 2) < 9 && Math.hypot(dx + 4.5, dy - 0.5) > 7.5 && r < 10 && dx > 2) c = '#ffd0e8'; }
    if (kind === 'G') { if (r < 9.5) c = Y < 13 ? '#e8e0d0' : '#c8bca8'; if (Math.hypot(dx + 3, dy + 1) < 2.2) c = '#ff3a8a'; if (Math.hypot(dx - 3, dy + 1) < 1.8) c = '#1a0c18'; if (Y > 15 && Math.abs(dx) < 4 && Math.floor(X) % 2 === 0) c = '#5a4a3a'; }
    if (c) g.fset(px, py, c);
  });
  return g.outline('#0c0814').canvas().toDataURL();
}
const A_ICON = {}; for (const k in ASKILLS) A_ICON[k] = makeAIcon(k);

// ---- 상태 ----
let aClone = null, enemyFreeze = 0, enemySlow = 0, eclipse = null, aDim = 0;
const smokes = [];
function tgDir(tg) {
  if (tg.mon) return [Math.cos(tg.mon.dir), Math.sin(tg.mon.dir)];
  const a = Math.atan2(-DUMMY.z, -DUMMY.x); return [Math.cos(a), Math.sin(a)];
}
function isBack(tg, x, z) { const [fx, fz] = tgDir(tg), dx = x - tg.x, dz = z - tg.z, d = Math.hypot(dx, dz) || 1; return (dx * fx + dz * fz) / d < -0.5; }
function behindPos(tg, d) { const [fx, fz] = tgDir(tg), R = tg.r + d; return [tg.x - fx * R, tg.z - fz * R]; }
function faceTo(c, tg) { const [rx, rz] = camRight(), sd = (tg.x - c.x) * rx + (tg.z - c.z) * rz; if (Math.abs(sd) > 0.02) c.face = sd > 0 ? 1 : -1; }
const inSmoke = (x, z) => smokes.some(s => Math.hypot(s.x - x, s.z - z) < 4);
function gainOrb(c, n) {
  const was = c.orbs || 0; c.orbs = Math.min(5, was + n);
  if (c.orbs > was) for (let i = 0; i < 8; i++) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.6, y: 1 + Math.random(), z: c.z, vy: 1.5, life: 0.4, c: PURP, size: PX });
}
function smokePuff(x, z, n = 14, y = 0.3) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 0.5 + Math.random() * 2; soft.emit({ x, y: y + Math.random() * 1.6, z, vx: Math.cos(a) * s, vy: 0.3 + Math.random(), vz: Math.sin(a) * s * 0.6, drag: 3, life: 0.6 + Math.random() * 0.4, c: lc(ASH[i % 3]), size: PX * (2 + Math.random() * 2), grow: 2, a: 0.8 }); }
  for (let i = 0; i < n / 2; i++) glow.emit({ x: x + (Math.random() - 0.5), y: 0.3 + Math.random() * 1.8, z, vx: (Math.random() - 0.5) * 2, vy: Math.random(), drag: 2, life: 0.4, c: PURP, size: PX });
}
function eyeLine(x0, z0, x1, z1) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.12); for (let i = 0; i <= n; i++) { const k = i / n; glow.emit({ x: x0 + (x1 - x0) * k, y: 2.55, z: z0 + (z1 - z0) * k, life: 0.25 + k * 0.15, c: PINK, size: PX }); } }
function aGhost(c, col = [0.8, 0.3, 1.3], op = 0.5, x, z) {
  const m = new THREE.Mesh(c.mesh.geometry, new THREE.MeshBasicMaterial({ map: c.mat.map, transparent: true, opacity: op, alphaTest: 0.01, depthWrite: false, color: new THREE.Color(...col), side: THREE.DoubleSide }));
  m.position.copy(c.mesh.position); if (x !== undefined) { m.position.x = x; m.position.z = z; }
  m.rotation.y = camYaw; scene.add(m); ghosts.push({ m, t: 0 });
}
function pinkX(tg, s = 1.8) { [45, -45].forEach(r => spawnSlash({ x: tg.x, y: tg.y() + 1.1, z: tg.z, size: s, rot: r, face: 1, color: PINK, life: 0.14 })); }
function grayFlash(ms) { cvs.style.filter = 'grayscale(1) contrast(1.2)'; clearTimeout(grayFlash.t); grayFlash.t = setTimeout(() => cvs.style.filter = '', ms); }
function breakStealth(c, amb) {
  if (!(c.stealth > 0)) return;
  if (amb && c.ambush >= 2) { c.ambush = 1; c.stealth = 0.5; smokePuff(c.x, c.z, 10); }
  else { c.stealth = 0; c.ambush = 0; }
}
// 암살자 타격: 연계 · 뒤치기 · 연막 · 기습 배율을 붙여 hitTarget 으로
function aHit(tg, base, opt = {}) {
  const c = party[2], sk = c.state === 'skill' ? c.sk : null, amb = !!(sk && sk.amb);
  const back = !!(opt.back || amb || isBack(tg, opt.fx ?? c.x, opt.fz ?? c.z)), smoke = !back && inSmoke(c.x, c.z);
  const mul = (1 + (c.chain || 0) * 0.03) * (back ? 1.2 : smoke ? 1.1 : 1) * (amb ? 1.3 : 1);
  hitTarget(tg, base, opt.fx ?? c.x, opt.fz ?? c.z, back ? '#ff7ab8' : '#d08aff', { ...opt, mul, critAdd: back ? 0.1 : 0, forceCrit: amb, numColor: back ? '#ff9ad0' : undefined });
  if (back) {
    if (!opt.quiet) pinkX(tg, 1.5);
    if (!(tg.backTxt > uTime.value)) { tg.backTxt = uTime.value + 0.4; floaters.push({ x: tg.x, y: tg.y() + tg.top + 0.6, z: tg.z, t: 0, text: amb ? '기습' : '뒤치기', crit: false, vx: 0, color: amb ? '#ffffff' : '#ff7ab8' }); }
    if (sk && !sk.orbGot) { sk.orbGot = true; gainOrb(c, 1); }
  }
  if (amb && !sk.ambUsed) { sk.ambUsed = true; grayFlash(80); hitstop = Math.max(hitstop, 0.08); breakStealth(c, true); }
  if (!sk && c.stealth > 0) breakStealth(c, false);
}
function aTargets(c, R, cone, dx, dz) {
  R *= 1 + ((curTri(c) || {}).range || 0);
  const [rx, rz] = camRight(), fx = dx ?? rx * c.face, fz = dz ?? rz * c.face;
  return targets.filter(tg => { if (!tg.alive() || tg.y() > 3) return false; const ox = tg.x - c.x, oz = tg.z - c.z, d = Math.hypot(ox, oz); if (d > R + tg.r) return false; return !cone || d < 0.3 || (ox * fx + oz * fz) / d > cone; });
}

// ---- 기본 공격: 쌍검 난도 5타 40/40/60/60/120% ----
function assSlash(c) {
  const i = c.combo || 0, f = c.face;
  stepFwd(c, 0.3);
  let hit = 0;
  if (i < 4) {
    spawnSlash({ x: c.x, y: 1.15 + (i % 2) * 0.2, z: c.z, size: 2.6, rot: [22, -26, 36, -14][i], flipV: i % 2 === 1, face: f, color: PURP, life: 0.12 });
    spawnSlash({ x: c.x, y: 1.25, z: c.z, size: 2.2, rot: [-30, 30, -20, 25][i], flipV: i % 2 === 0, face: f, color: PURP.map(v => v * 0.5), life: 0.1 });
    for (const tg of aTargets(c, 2.1, 0.2)) { aHit(tg, P([40, 40, 60, 60][i]), { stop: 0.015, shake: 0.04 }); hit++; }
  } else {
    [1, -1].forEach(fc => spawnSlash({ x: c.x, y: 1.1, z: c.z, size: 3.6, rot: 0, face: fc, color: PURP, life: 0.18 }));
    shockwave(c.x, c.z, 2.8, PURP, 0.3); smokePuff(c.x, c.z, 12, 0.1);
    for (const tg of aTargets(c, 2.5)) { aHit(tg, P(120), { stop: 0.03, shake: 0.15 }); hit++; }
  }
  if (hit) { c.bhits = (c.bhits || 0) + 1; if (c.bhits % 10 === 0) gainOrb(c, 1); }
}
// 그림자 걸음: 4m 순간이동. 적을 향해 쓰면 그 적의 등 뒤로 (2초에 한 번), 다음 기본 공격이 등 찌르기
function shadowStep(c, mx, mz) {
  const ox = c.x, oz = c.z; let tg = null;
  if (!(c.behindCd > 0)) for (const t of targets) { if (!t.alive() || t.y() > 2) continue; const dx = t.x - c.x, dz = t.z - c.z, d = Math.hypot(dx, dz); if (d < 5 && d > 0.1 && (dx * mx + dz * mz) / d > 0.6) { tg = t; break; } }
  if (tg) { [c.x, c.z] = behindPos(tg, 1.1); c.behindCd = 2; c.backStab = true; collide(c, 0.35); faceTo(c, tg); }
  else { c.x += mx * 4; c.z += mz * 4; collide(c, 0.35); }
  smokePuff(ox, oz, 12); smokePuff(c.x, c.z, 12); eyeLine(ox, oz, c.x, c.z);
  for (let k = 1; k <= 3; k++) aGhost(c, [0.5, 0.15, 0.8], 0.45, ox + (c.x - ox) * k / 4, oz + (c.z - oz) * k / 4);
  c.dash = 0.06; c.dx = c.dz = 0; c.dashCd = 0.5; c.inv = Math.max(c.inv, 0.25);
}

// ---- 단검 ----
const daggerTex = (() => { const g = new Pix(12, 5, S); g.stamp(0, 0, ['...........', 'bbb.WWWWWW.', 'bbBBWWWWWWP', 'bbb.WWWWWW.', '...........'], { b: '#3a2a4a', B: '#7a5a9a', W: '#e0d8f0', P: '#ff7ab8' }); return tex(g.outline('#0c0814').canvas()); })();
function throwDagger(c, dx, dz) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), new THREE.MeshBasicMaterial({ map: daggerTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  m.position.set(c.x + dx * 0.6, 1.4, c.z + dz * 0.6); scene.add(m); billboards.push(m);
  projs.push({ kind: 'adag', mesh: m, vx: dx * 26, vz: dz * 26, life: 12 / 26 });
}
function updateADag(p, dt) {
  const m = p.mesh, x = m.position.x, z = m.position.z;
  m.rotation.z += dt * 30; glow.emit({ x, y: 1.45, z, life: 0.2, c: PURP, size: PX });
  for (const tg of targets) {
    if (!tg.alive() || tg.y() > 2 || Math.hypot(x - tg.x, z - tg.z) > tg.r + 0.2) continue;
    aHit(tg, P(120), { stop: 0.015, shake: 0.06, fx: party[2].x, fz: party[2].z });
    const c = party[2]; c.dagTg = tg; c.dagT = 3;
    return true;
  }
  return p.life <= 0;
}
let stuckDag = null;
function updateStuck(c, dt) {
  if (c.dagT > 0 && c.dagTg && c.dagTg.alive()) {
    c.dagT -= dt;
    if (!stuckDag) { stuckDag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), new THREE.MeshBasicMaterial({ map: daggerTex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.2, 1.8) })); stuckDag.rotation.z = 0.6; scene.add(stuckDag); billboards.push(stuckDag); }
    stuckDag.position.set(c.dagTg.x - 0.2, c.dagTg.y() + 1.5, c.dagTg.z + 0.3);
    if (Math.random() < dt * 20) glow.emit({ x: stuckDag.position.x, y: stuckDag.position.y, z: stuckDag.position.z, vy: 0.5, life: 0.3, c: Math.sin(uTime.value * 12) > 0 ? PINK : PURP, size: PX });
  } else if (stuckDag) { scene.remove(stuckDag); billboards.splice(billboards.indexOf(stuckDag), 1); disposeObj(stuckDag); stuckDag = null; c.dagT = 0; }
}

// ---- 그림자 분신 ----
const ECHO = { Q: 800, E: 360, E2: 540, R: 300, F: 200, Z: 1000, X: 1200, G: 0 };
function spawnClone(x, z, tg) {
  if (aClone) killClone();
  const c = party[2], m = new THREE.Mesh(c.mesh.geometry, new THREE.MeshBasicMaterial({ map: c.mat.map, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(0.06, 0.02, 0.1) }));
  scene.add(m); billboards.push(m);
  aClone = { x, z, t: 0, life: 6, copies: 3, mesh: m, down: false, tg };
  // 내 그림자가 바닥을 타고 적 밑을 지나간다
  const sx = c.x, sz = c.z;
  for (let i = 0; i <= 10; i++) later(i * 0.025, () => soft.emit({ x: sx + (x - sx) * i / 10, y: 0.05, z: sz + (z - sz) * i / 10, vy: 0.2, drag: 2, life: 0.6, c: lc('#0a0610'), size: PX * 4, grow: 1.5, a: 0.8 }));
}
function killClone() { const cl = aClone; if (!cl) return; smokePuff(cl.x, cl.z, 16); scene.remove(cl.mesh); billboards.splice(billboards.indexOf(cl.mesh), 1); cl.mesh.material.dispose(); aClone = null; }
function updateClone(dt) {
  const cl = aClone; if (!cl) return;
  cl.t += dt; const c = party[2];
  const rise = Math.min(1, cl.t / 0.3);
  if (cl.tg && cl.tg.alive()) { const [rx, rz] = camRight(); cl.face = ((cl.tg.x - cl.x) * rx + (cl.tg.z - cl.z) * rz) >= 0 ? 1 : -1; }
  const fr = c.cur || c.fr.idle[0]; cl.mesh.material.map = cl.face > 0 ? fr.r : fr.l;
  cl.mesh.position.set(cl.x, -3.5 * PX - (1 - rise) * 2.2, cl.z);
  if (Math.random() < dt * 10) glow.emit({ x: cl.x, y: 2.55 - (1 - rise) * 2.2, z: cl.z + 0.05, vy: 0.2, life: 0.4, c: PINK, size: PX });
  if (cl.t >= 0.3 && !cl.hit) { cl.hit = true; if (cl.tg && cl.tg.alive()) { [45, -45].forEach(r => spawnSlash({ x: cl.x, y: 1.2, z: cl.z, size: 2.8, rot: r, face: cl.face, color: PURP, life: 0.16 })); aHit(cl.tg, P(300), { back: true, fx: cl.x, fz: cl.z, stop: 0.03 }); } }
  if (cl.t >= cl.life) killClone();
}
function cloneEcho(key) {
  const cl = aClone, base = ECHO[key] || 0; if (!cl || !base) return;
  later(0.08, () => {
    if (!aClone || !cl.tg || !cl.tg.alive()) return;
    for (let i = 0; i < 3; i++) later(i * 0.05, () => spawnSlash({ x: cl.x, y: 1.1 + i * 0.15, z: cl.z, size: 2.6, rot: [20, -30, 60][i], face: cl.face, color: PURP, life: 0.14 }));
    aGhost({ mesh: cl.mesh, mat: cl.mesh.material }, [0.4, 0.1, 0.6], 0.6);
    aHit(cl.tg, P(base * 0.4), { back: true, fx: cl.x, fz: cl.z, stop: 0.02 });
  });
}

// ---- 연막 ----
function smokeZone(x, z) {
  smokes.push({ x, z, t: 0, life: 5, tick: 0 });
  shockwave(x, z, 4.4, PURP, 0.4); fxFlash = 2; fxLight.color.set('#b060ff'); fxLight.position.set(x, 1, z);
  for (let i = 0; i < 60; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 4; soft.emit({ x, y: 0.3, z, vx: Math.cos(a) * s, vy: 0.4 + Math.random(), vz: Math.sin(a) * s * 0.8, drag: 2.5, life: 1.2, c: lc(ASH[i % 3]), size: PX * (4 + Math.random() * 3), grow: 2, a: 0.85 }); }
  for (const tg of targets) if (tg.alive() && tg.y() < 3 && Math.hypot(tg.x - x, tg.z - z) < 4 + tg.r) aHit(tg, P(200), { stop: 0.03, shake: 0.2 });
}
function updateSmokes(dt) {
  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i]; s.t += dt;
    if (s.t < s.life - 0.5) for (let k = 0; k < 7; k++) { const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * 3.8; soft.emit({ x: s.x + Math.cos(a) * rr, y: 0.1 + Math.random() * 2.2, z: s.z + Math.sin(a) * rr * 0.85, vx: -Math.sin(a) * 0.4, vz: Math.cos(a) * 0.4, vy: 0.1, drag: 0.5, life: 1.6, c: lc(ASH[k % 3]), size: PX * (8 + Math.random() * 6), grow: 1.8, a: 0.6, fadeIn: 0.3 }); }
    if (Math.random() < dt * 8) { const a = Math.random() * TAU, rr = Math.random() * 3.5; glow.emit({ x: s.x + Math.cos(a) * rr, y: 0.2, z: s.z + Math.sin(a) * rr, vy: 0.6, life: 0.8, c: [1.2, 0.4, 1.8], size: PX }); }
    while (s.tick < 5 && s.t >= s.tick + 1) { s.tick++; for (const tg of targets) if (tg.alive() && tg.y() < 3 && Math.hypot(tg.x - s.x, tg.z - s.z) < 4 + tg.r) hitTarget(tg, P(60), s.x, s.z, '#c070ff', { stop: 0, shake: 0, quiet: true, numColor: '#b890ff' }); }
    if (s.t >= s.life) smokes.splice(i, 1);
  }
}

// ---- 월식 화면 (HUD 캔버스) ----
function drawEclipse(g, w, h) {
  const e = eclipse; if (!e) return;
  const T = e.t, dark = T < 0.8 ? T / 0.8 * 0.35 : T < 1.0 ? 0.35 + (T - 0.8) / 0.2 * 0.55 : T < 3.0 ? 0.9 : Math.max(0, 0.9 - (T - 3.0) / 0.4 * 0.9);
  g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, w, h);
  const mx = w * 0.5, my = h * 0.2, mr = h * 0.08;
  if (T < 3.4) {
    const cor = T < 0.8 ? 0 : Math.min(1, (T - 0.8) / 0.2) * (T > 3.0 ? Math.max(0, 1 - (T - 3.0) / 0.4) : 1);
    const gr = g.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 2.2); gr.addColorStop(0, `rgba(255,90,170,${0.95 * cor})`); gr.addColorStop(0.3, `rgba(200,40,140,${0.4 * cor})`); gr.addColorStop(1, 'rgba(120,0,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(mx, my, mr * 2.2, 0, TAU); g.fill();
    const k = Math.min(1, T / 0.9);
    g.fillStyle = `rgba(255,236,200,${(1 - k) * 0.9})`; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = `rgba(0,0,0,${Math.min(1, k * 1.2)})`; g.beginPath(); g.arc(mx + (1 - k) * mr * 2, my, mr, 0, TAU); g.fill();
  }
  const burst = e.cutT > 0 ? T - e.cutT : -1;
  g.lineWidth = 2;
  for (const L of e.lines) {
    const k = Math.min(1, (T - L.t0) / 0.06), a = burst >= 0 ? Math.max(0, 1 - burst / 0.35) : 0.9;
    if (a <= 0) continue;
    g.strokeStyle = burst >= 0 ? `rgba(255,255,255,${a})` : `rgba(255,110,190,${a})`; g.lineWidth = burst >= 0 ? 4 : 2;
    g.beginPath(); g.moveTo(L.x0 * w, L.y0 * h); g.lineTo((L.x0 + (L.x1 - L.x0) * k) * w, (L.y0 + (L.y1 - L.y0) * k) * h); g.stroke();
  }
  if (burst >= 0 && burst < 0.5) {
    const a = 1 - burst / 0.5; g.strokeStyle = `rgba(255,120,190,${a})`; g.lineWidth = 34 * a + 6;
    const R = h * 1.1, a0 = Math.PI * 0.12; g.beginPath(); g.arc(w * 0.2, -h * 0.3, R, a0, a0 + Math.min(1, burst / 0.12) * Math.PI * 0.5); g.stroke(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 4; g.stroke();
  }
}
function drawAssHUD(g, w, h) {
  const A = party[active];
  if (aDim > 0.01) { g.fillStyle = `rgba(4,0,8,${aDim})`; g.fillRect(0, 0, w, h); }
  if (A.key === 'assassin' && A.stealth > 0) {
    const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, 'rgba(20,0,30,0)'); gr.addColorStop(1, 'rgba(20,0,30,.6)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  drawEclipse(g, w, h);
  if (A.key === 'assassin' && A.chain > 0) {
    const s = Math.round(30 * (1 + (A.chainPop || 0) * 0.5));
    txt(`연계 ${['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][A.chain]}`, w * 0.5 + 250, h * 0.3, s, A.chain >= 5 ? '#ffffff' : '#ff7ab8', 'left', Math.min(1, A.chainT / 0.5));
    txt(`피해 +${A.chain * 3}%`, w * 0.5 + 252, h * 0.3 + 24, 12, '#e0a8ff', 'left', Math.min(1, A.chainT / 0.5));
  }
}

// ---- 시전 훅: 연계 · 기습 · 분신 따라 하기 ----
function assOnCast(c, key, cancelled) {
  if (key === 'G' || key === 'E2') return;
  const linked = cancelled || uTime.value - (c.lastEnd ?? -9) < 0.25;
  if (key === c.lastSkill) { c.chain = 0; c.chain5 = false; }
  else if (linked) { c.chain = Math.min(5, (c.chain || 0) + 1); c.chainPop = 1; if (c.chain === 5 && !c.chain5) { c.chain5 = true; gainOrb(c, 1); } }
  c.lastSkill = key; c.chainT = 2;
  if (aClone && aClone.t > 0.3 && aClone.copies > 0 && key !== 'C' && key !== 'V' && key !== 'R') { aClone.copies--; cloneEcho(key); }
}
function updateAssKit(dt) {
  const c = party[2];
  if (c.chainT > 0) { c.chainT -= dt; if (c.chainT <= 0) { c.chain = 0; c.chain5 = false; } }
  c.chainPop = Math.max(0, (c.chainPop || 0) - dt * 3); c.behindCd = (c.behindCd || 0) - dt;
  if (c.stealth > 0) { c.stealth -= dt; if (c.stealth <= 0) { c.stealth = 0; c.ambush = 0; smokePuff(c.x, c.z, 8); } }
  const st = c.stealth > 0;
  c.mat.color.setRGB(st ? 0.14 : 1, st ? 0.08 : 1, st ? 0.2 : 1);
  if (st && !c.down && Math.random() < dt * 30) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.9, y: 0.2 + Math.random() * 2.2, z: c.z, vy: 0.4, life: 0.4, c: [0.9, 0.3, 1.4], size: PX });
  enemyFreeze -= dt; enemySlow -= dt;
  aDim += (((c.state === 'skill' && c.sk && c.sk.id === 'C') ? 0.4 : 0) - aDim) * Math.min(1, dt * 8);
  updateStuck(c, dt); updateClone(dt); updateSmokes(dt);
}

// ---- 스킬 구현 ----
const AK = {
  // 기본: 등 찌르기 (그림자 걸음으로 등 뒤를 잡은 뒤 첫 기본 공격) 180%
  STAB: {
    update(c, sk, dt, F) {
      once(sk, 'a', sk.t >= 0.05, () => { stepFwd(c, 0.3); const tg = aTargets(c, 2.2, 0)[0]; spawnSlash({ x: c.x, y: 1.2, z: c.z, size: 3, rot: 0, face: c.face, color: PINK, life: 0.16 }); if (tg) aHit(tg, P(180), { back: true, stop: 0.04, shake: 0.2 }); });
      return { f: sk.t < 0.05 ? F.atk[0] : F.atk[2], done: sk.t > 0.25 };
    },
  },
  // 기본: 낙하 찌르기 (공중 좌클릭) 200%, 반경 2m
  AIR: {
    update(c, sk, dt, F) {
      const T = sk.t;
      if (sk.land === undefined) {
        sk.vy = (sk.vy || 0) - 70 * dt; c.y = Math.max(0, c.y + Math.min(-5, sk.vy) * dt);
        glow.emit({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + 0.5 + Math.random() * 1.4, z: c.z, vy: 7, life: 0.1, c: PURP, size: PX });
        if (c.y <= 0) {
          sk.land = T; crackDecal(c.x, c.z, 2.4, 0.6, [1.6, 0.5, 2.4]); shockwave(c.x, c.z, 2.2, PURP, 0.3); smokePuff(c.x, c.z, 10, 0.1);
          for (const tg of aTargets(c, 2)) { aHit(tg, P(200), { stop: 0.04, shake: 0.25, sg: 10 }); launch(tg, 4); }
        }
        return { f: F.atk[0], done: T > 1.5 };
      }
      return { f: F.atk[2], done: T - sk.land > 0.25 };
    },
  },
  // 1차 Q 그림자 돌파: 6m 관통 돌진(무적) 300%×2 → 돌아서며 역수 베기 200% (뒤치기)
  Q: {
    cancelAt: 0.3,
    init(c, sk) { [sk.dx, sk.dz] = aimDir(c, 8); sk.sx = c.x; sk.sz = c.z; sk.hit = new Set(); },
    update(c, sk, dt, F) {
      const T = sk.t;
      if (T >= 0.1 && T < 0.3) {
        const k = (T - 0.1) / 0.2; c.x = sk.sx + sk.dx * 6 * k; c.z = sk.sz + sk.dz * 6 * k; collide(c, 0.35); c.inv = Math.max(c.inv, 0.05);
        soft.emit({ x: c.x, y: 0.4 + Math.random() * 1.6, z: c.z, vx: -sk.dx, vz: -sk.dz, drag: 2, life: 0.5, c: lc(ASH[0]), size: PX * 3, grow: 1.5, a: 0.8 });
        glow.emit({ x: c.x, y: 2.55, z: c.z, life: 0.45, c: PINK, size: PX });
        if (Math.random() < dt * 30) aGhost(c, [0.6, 0.2, 1.0], 0.5);
        for (const tg of targets) if (tg.alive() && !sk.hit.has(tg) && tg.y() < 2.5 && Math.hypot(tg.x - c.x, tg.z - c.z) < tg.r + 0.9) {
          sk.hit.add(tg); for (let k2 = 0; k2 < 2; k2++) aHit(tg, P(300), { stop: 0.03, shake: 0.18, stack: k2, quiet: k2 > 0 });
          later(0.1, () => { [40, -40].forEach(r => spawnSlash({ x: tg.x, y: tg.y() + 1.2, z: tg.z, size: 2.4, rot: r, face: 1, color: PURP, life: 0.16 })); });
        }
      }
      once(sk, 'turn', T >= 0.35, () => {
        c.face = -c.face; smokePuff(c.x, c.z, 10, 0.1);
        spawnSlash({ x: c.x, y: 1.2, z: c.z, size: 3.4, rot: -20, flipV: true, face: c.face, color: PINK, life: 0.16 });
        for (const tg of aTargets(c, 2.8, -0.2)) aHit(tg, P(200), { back: true, stop: 0.04, shake: 0.2 });
      });
      return { f: T < 0.1 ? F.atk[0] : T < 0.35 ? F.atk[2] : F.atk[1], done: T > 0.6 };
    },
  },
  // 1차 E 단검 투척: 3자루 부채꼴 120%씩, 박히면 3초 안에 다시 눌러 파고들기
  E: {
    cancelAt: 0.18,
    init(c, sk) { const [dx, dz] = aimDir(c, 12); for (let i = -1; i <= 1; i++) { const a = i * 0.26, cs = Math.cos(a), sn = Math.sin(a); throwDagger(c, dx * cs - dz * sn, dx * sn + dz * cs); } },
    update(c, sk, dt, F) { return { f: sk.t < 0.08 ? F.atk[0] : F.atk[2], done: sk.t > 0.25 }; },
    recastable(c) { return c.dagT > 0 && c.dagTg && c.dagTg.alive(); },
    recast(c) { c.state = 'skill'; c.sk = { id: 'E2', t: 0, impl: AK }; AK.E2.init(c, c.sk); },
  },
  // 파고들기: 박힌 적의 등 뒤로 순간이동해 단검을 비틀어 뽑는다 540%
  E2: {
    cancelAt: 0.3,
    init(c, sk) {
      const tg = c.dagTg; c.dagT = 0; sk.tg = tg; const ox = c.x, oz = c.z;
      [c.x, c.z] = behindPos(tg, 1.0); collide(c, 0.35); faceTo(c, tg);
      smokePuff(ox, oz, 12); smokePuff(c.x, c.z, 12); eyeLine(ox, oz, c.x, c.z);
    },
    update(c, sk, dt, F) {
      once(sk, 'stab', sk.t >= 0.1, () => {
        const tg = sk.tg; if (!tg.alive()) return;
        aHit(tg, P(540), { back: true, stop: 0.06, shake: 0.35, sg: 10 });
        shockwave(tg.x, tg.z, 2, PURP, 0.3, 1.2); embers(tg.x, 1.2, tg.z, 24, PURP, 5);
        for (let i = 0; i < 14; i++) soft.emit({ x: tg.x + (Math.random() - 0.5) * 0.5, y: 0.1, z: tg.z, vy: 3 + Math.random() * 3, drag: 1.5, life: 0.8, c: lc(ASH[i % 3]), size: PX * 3, grow: 1.5, a: 0.8 });
      });
      return { f: sk.t < 0.1 ? F.atk[0] : F.atk[2], done: sk.t > 0.45 };
    },
  },
  // 2차 R 그림자 분신
  R: {
    cancelAt: 0.15,
    init(c, sk) {
      const tg = nearestTarget(c, 12);
      if (tg) { let dx = tg.x - c.x, dz = tg.z - c.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; spawnClone(tg.x + dx * (tg.r + 1), tg.z + dz * (tg.r + 1), tg); }
      else { const [rx, rz] = camRight(); spawnClone(c.x + rx * c.face * 2, c.z + rz * c.face * 2, null); }
    },
    update(c, sk, dt, F) { return { f: F.atk[0], done: sk.t > 0.3 }; },
  },
  // 2차 F 연막: 던진 자리에 5초
  F: {
    cancelAt: 0.2,
    init(c, sk) {
      const [dx, dz, tg] = aimDir(c, 10), d = tg ? Math.min(8, Math.hypot(tg.x - c.x, tg.z - c.z)) : 6;
      Object.assign(sk, { tx: c.x + dx * d, tz: c.z + dz * d, sx: c.x, sz: c.z });
    },
    update(c, sk, dt, F) {
      const T = sk.t, k = Math.min(1, T / 0.3);
      if (T < 0.3) { const x = sk.sx + (sk.tx - sk.sx) * k, z = sk.sz + (sk.tz - sk.sz) * k, y = 1.4 + Math.sin(k * Math.PI) * 1.5; glow.emit({ x, y, z, life: 0.2, c: PURP, size: PX * 1.4 }); soft.emit({ x, y, z, life: 0.4, c: lc(ASH[1]), size: PX * 2, grow: 1.5, a: 0.7 }); }
      once(sk, 'boom', T >= 0.3, () => smokeZone(sk.tx, sk.tz));
      return { f: T < 0.1 ? F.atk[0] : F.atk[2], done: T > 0.32 };
    },
  },
  // 3차 Z 천 갈래 찌르기: 누르는 동안 최대 2초 24타, 떼면 X자 마무리
  Z: {
    init(c, sk) { sk.tick = 0; sk.n = 0; },
    update(c, sk, dt, F, ctrl) {
      const T = sk.t;
      if (sk.rel === undefined) {
        if (ctrl) moveIn(c, dt, 4.2 * 0.4);
        const [dx, dz] = aimDir(c, 6), hot = T > 1.2;
        sk.tick -= dt;
        while (sk.tick <= 0 && sk.n < 24) {
          sk.tick += 2 / 24; sk.n++;
          for (let j = 0; j < 2; j++) { const a = (Math.random() - 0.5) * 1.2, cs = Math.cos(a), sn = Math.sin(a); lightLine(c.x + dx * 0.4, c.z + dz * 0.4, dx * cs - dz * sn, dx * sn + dz * cs, 1.6 + Math.random() * 1.2, hot ? PINK : [2.0, 1.6, 2.6], 0.08, 1.0 + Math.random() * 0.9); }
          for (const tg of aTargets(c, 3, 0.57, dx, dz)) aHit(tg, P(65), { stop: 0.012, shake: 0.04, quiet: sk.n % 3 !== 0, stack: sk.n % 6 });
        }
        if (hot && Math.random() < dt * 20) soft.emit({ x: c.x + (Math.random() - 0.5), y: 0.1, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 0.3, drag: 3, life: 0.4, c: lc('#9c8466'), size: PX * 2, grow: 1.5, a: 0.6 });
        const held = keys.KeyZ || T < simHold;
        if ((!held && T > 0.25) || T > 2) sk.rel = T;
        return { f: Math.floor(T * 24) % 2 ? F.atk[1] : F.atk[2], done: false };
      }
      const u = T - sk.rel;
      once(sk, 'fin', u >= 0.08, () => {
        [55, -55].forEach(r => spawnSlash({ x: c.x, y: 1.3, z: c.z, size: 5, rot: r, face: c.face, color: PINK, life: 0.24, grow: 0.15 }));
        const [dx, dz] = aimDir(c, 6); for (const tg of aTargets(c, 3.2, 0.4, dx, dz)) aHit(tg, P(340), { stop: 0.06, shake: 0.4, sg: 10 });
        sk.canCancel = true;
      });
      return { f: u < 0.08 ? F.atk[0] : F.atk[2], done: u > 0.4 };
    },
  },
  // 3차 X 사슬 낚아채기: 맞힌 적의 등 뒤로 끌려가 3연 처형. 공격 준비 중이면 끊기
  X: {
    init(c, sk) { [sk.dx, sk.dz] = aimDir(c, 10); },
    update(c, sk, dt, F) {
      const T = sk.t;
      if (sk.tg === undefined) {
        const L = Math.min(1, T / 0.2) * 10, [rx, rz] = camRight(), qx = -sk.dz, qz = sk.dx;
        for (let i = 0; i < 6; i++) { const d = Math.random() * L; glow.emit({ x: c.x + sk.dx * d, y: 1.35 + Math.sin(d * 4) * 0.05, z: c.z + sk.dz * d, life: 0.06, c: PURP, size: PX * 1.3 }); }
        glow.emit({ x: c.x + sk.dx * L, y: 1.35, z: c.z + sk.dz * L, life: 0.08, c: [2.6, 2.4, 2.8], size: PX * 2 });
        for (const tg of targets) {
          if (!tg.alive() || tg.y() > 3) continue;
          const ox = tg.x - c.x, oz = tg.z - c.z, along = ox * sk.dx + oz * sk.dz, perp = Math.abs(ox * qx + oz * qz);
          if (along > 0 && along < L + tg.r && perp < 0.8 + tg.r) { sk.tg = tg; sk.hitT = T; break; }
        }
        if (sk.tg === undefined && T >= 0.2) { sk.tg = null; sk.miss = T; c.cd.X = ASKILLS.X.cd / 2; }
        return { f: F.atk[1], done: false };
      }
      if (sk.tg === null) return { f: F.atk[2], done: T - sk.miss > 0.3 };
      const tg = sk.tg, u = T - sk.hitT;
      once(sk, 'catch', true, () => {
        hitstop = Math.max(hitstop, 0.05); shake = Math.max(shake, 0.25);
        if (tg.mon && monInterrupt(tg.mon, true)) {
          sk.cut = true;
          floaters.push({ x: tg.x, y: tg.y() + tg.top + 0.8, z: tg.z, t: 0, text: '끊기!', crit: false, big: true, vx: 0, color: '#ff6a5a' });
          embers(tg.x, 0.3, tg.z, 40, [3, 0.4, 0.3], 7); flashW = Math.max(flashW, 0.2); flashCol = '255,120,110';
        }
        [sk.bx, sk.bz] = behindPos(tg, 1.0); sk.ox = c.x; sk.oz = c.z;
      });
      if (u < 0.2) {
        const k = u / 0.2; c.x = sk.ox + (sk.bx - sk.ox) * k; c.z = sk.oz + (sk.bz - sk.oz) * k; c.inv = Math.max(c.inv, 0.05);
        for (let i = 0; i < 4; i++) { const d = Math.random(); glow.emit({ x: c.x + (tg.x - c.x) * d, y: 1.35, z: c.z + (tg.z - c.z) * d, life: 0.06, c: PURP, size: PX * 1.3 }); }
        if (Math.random() < dt * 40) aGhost(c, [0.5, 0.15, 0.8], 0.45);
      } else faceTo(c, tg);
      const sg = sk.cut ? 50 : 25;
      once(sk, 'h1', u >= 0.25, () => { spawnSlash({ x: c.x, y: 1.4, z: c.z, size: 3.6, rot: 70, face: c.face, color: PURP, life: 0.16 }); if (tg.alive()) aHit(tg, P(200), { back: true, sg, stop: 0.03, shake: 0.15 }); });
      once(sk, 'h2', u >= 0.45, () => { [1, -1].forEach(fc => spawnSlash({ x: c.x, y: 1.1, z: c.z, size: 3.4, rot: 0, face: fc, color: PURP, life: 0.16 })); if (tg.alive()) aHit(tg, P(300), { back: true, sg, stop: 0.03, shake: 0.2 }); });
      once(sk, 'h3', u >= 0.65, () => {
        slowT = 0.15; spawnSlash({ x: c.x, y: 1.6, z: c.z, size: 4.6, rot: -70, face: c.face, color: PINK, life: 0.22, grow: 0.1 });
        crackDecal(tg.x, tg.z, 3.4, 1.4, [1.6, 0.5, 2.4]); shockwave(tg.x, tg.z, 3.2, PURP, 0.35); smokePuff(tg.x, tg.z, 20, 0.1);
        if (tg.alive()) aHit(tg, P(700), { back: true, sg, stop: 0.07, shake: 0.45 });
        sk.canCancel = true;
      });
      return { f: u < 0.25 ? F.atk[0] : u < 0.45 ? F.atk[2] : u < 0.65 ? F.atk[1] : F.atk[2], done: u > 0.9 };
    },
  },
  // 4차 C 망자의 무도: 구슬을 모두 써서 6 + 구슬 수만큼, 단검을 거두는 순간 한꺼번에
  C: {
    can(c) { return nearestTarget(c, 8) ? '' : '반경 8m 안에 대상이 없습니다'; },
    init(c, sk) { sk.n = 6 + (c.orbs || 0); c.orbs = 0; sk.ox = c.x; sk.oz = c.z; sk.hide = true; sk.pts = []; sk.k = 0; sk.px = c.x; sk.pz = c.z; enemySlow = 0.2 + sk.n * 0.15 + 0.4; smokePuff(c.x, c.z, 20); },
    update(c, sk, dt, F) {
      const T = sk.t, endT = 0.2 + sk.n * 0.15; c.inv = Math.max(c.inv, 0.1);
      const live = targets.filter(t => t.alive() && Math.hypot(t.x - sk.ox, t.z - sk.oz) < 9);
      while (sk.k < sk.n && T >= 0.2 + sk.k * 0.15) {
        const tg = live.length ? live[sk.k % live.length] : null; if (!tg) { sk.k = sk.n; break; }
        const a = sk.k * 2.4 + 0.5, R = tg.r + 1.0, px = tg.x + Math.cos(a) * R, pz = tg.z + Math.sin(a) * R * 0.8;
        // 나타난 자리에 잔상 하나가 멈춰 남고, 눈빛 선이 잔상을 잇는다
        c.x = px; c.z = pz; faceTo(c, tg);
        const fr = c.fr.atk[2], m = new THREE.Mesh(c.mesh.geometry, new THREE.MeshBasicMaterial({ map: c.face > 0 ? fr.r : fr.l, transparent: true, alphaTest: 0.01, depthWrite: false, opacity: 0.75, color: new THREE.Color(0.35, 0.12, 0.55), side: THREE.DoubleSide }));
        const life = endT + 0.45 - T; m.position.set(px, -3.5 * PX, pz);
        addFx(m, life, f => { if (f.t > life - 0.15) m.material.color.setRGB(2.6, 0.7, 1.6); }, true);
        const pdx = px - sk.px, pdz = pz - sk.pz, pl = Math.hypot(pdx, pdz);
        if (sk.k > 0 && pl > 0.1) lightLine(sk.px, sk.pz, pdx / pl, pdz / pl, pl, PINK, life, 2.5);
        sk.px = px; sk.pz = pz;
        spawnSlash({ x: tg.x, y: tg.y() + 1.1, z: tg.z, size: 2, rot: a * 57, face: 1, color: PURP.map(v => v * 0.5), life: 0.1 });
        smokePuff(px, pz, 6); sk.pts.push(tg); sk.k++;
      }
      once(sk, 'sheathe', T >= endT, () => { c.x = sk.ox; c.z = sk.oz; sk.hide = false; smokePuff(c.x, c.z, 10); });
      once(sk, 'boom', T >= endT + 0.3, () => {
        sk.pts.forEach((tg, i) => { if (!tg.alive()) return; aHit(tg, P(310), { back: true, stop: 0, shake: 0.1, quiet: true, stack: i }); pinkX(tg, 2 + (i % 3) * 0.4); });
        hitstop = 0.12; shake = Math.max(shake, 0.6); grayFlash(100); flashW = Math.max(flashW, 0.2); flashCol = '255,140,200';
      });
      return { f: T < endT ? F.atk[2] : F.idle[0], done: T > endT + 0.6 };
    },
  },
  // 4차 V 월식 (각성기)
  V: {
    init(c, sk) {
      sk.amb2 = !!sk.amb; sk.amb = false; sk.n = sk.amb2 ? 16 : 12; sk.k = 0; sk.ox = c.x; sk.oz = c.z;
      cutin = { t: 0, name: '월식', sub: '4차 · 각성기', hero: 'assassin', pal: ['rgba(10,0,16,.95)', 'rgba(90,20,110,.9)', 'rgba(8,0,12,.95)'], line: '#ff7ab8', subC: '#ffb0d8' };
      cine = 1; eclipse = { t: 0, lines: [], cutT: -1 };
    },
    update(c, sk, dt, F) {
      const T = sk.t; c.inv = Math.max(c.inv, 0.15); eclipse.t = T;
      if (T < 0.8) c.y = Math.sin(Math.min(1, T / 0.5) * Math.PI / 2) * 5;
      if (T >= 0.8 && T < 2.6) { sk.hide = true; enemyFreeze = 0.15; }
      const dI = 1.6 / sk.n;
      while (sk.k < sk.n && T >= 1.0 + sk.k * dI) {
        sk.k++;
        const cx = 0.5 + (Math.random() - 0.5) * 0.5, cy = 0.55 + (Math.random() - 0.5) * 0.35, a = Math.random() * Math.PI, L = 0.22 + Math.random() * 0.2;
        eclipse.lines.push({ t0: T, x0: cx - Math.cos(a) * L, y0: cy - Math.sin(a) * L * 1.6, x1: cx + Math.cos(a) * L, y1: cy + Math.sin(a) * L * 1.6 });
        for (const tg of targets) if (tg.alive() && Math.hypot(tg.x - sk.ox, tg.z - sk.oz) < 10) aHit(tg, P(300), { back: true, stop: 0, shake: 0.06, quiet: true, stack: sk.k % 6 });
      }
      const main = mainTarget(c, 14);
      once(sk, 'land', T >= 2.6, () => { if (main) { [c.x, c.z] = behindPos(main, 0.9); faceTo(c, main); c.face = -c.face; } c.y = 0; sk.hide = false; enemyFreeze = 0.45; smokePuff(c.x, c.z, 10, 0.1); });
      once(sk, 'cut', T >= 3.0, () => {
        eclipse.cutT = T; sk.amb = sk.amb2;
        if (main) { aHit(main, P(3600), { back: true, stop: 0.18, shake: 1.1, sg: 25 }); crackDecal(main.x, main.z, 8, 2.4, [2.4, 0.6, 1.6]); shockwave(main.x, main.z, 6, PINK, 0.5); embers(main.x, 1, main.z, 60, PINK, 9); }
        slowT = 0.4; flashW = 0.5; flashCol = '255,200,230'; shake = 1.1;
      });
      once(sk, 'end', T >= 3.4, () => { c.orbs = 5; for (let i = 0; i < 40; i++) soft.emit({ x: c.x + (Math.random() - 0.5) * 6, y: 0.2, z: c.z + (Math.random() - 0.5) * 4, vy: 0.6 + Math.random(), drag: 0.5, life: 3, c: lc(['#5a3a7a', '#3a2448'][i % 2]), size: PX * 1.4, a: 0.8 }); });
      if (T > 3.2) cine = 0;
      return { f: T < 0.8 ? F.atk[0] : T < 3.0 ? F.atk[1] : F.atk[2], done: T > 3.7 };
    },
    end(c) { eclipse = null; cine = 0; c.y = 0; },
  },
  // G 그림자 잠행: 구슬을 모두 써서 은신
  G: {
    can(c) { return !((c.orbs || 0) > 0) ? '그림자 구슬이 없습니다' : c.stealth > 0 ? '이미 잠행 중입니다' : ''; },
    init(c, sk) {
      const n = c.orbs; c.orbs = 0; c.stealth = 1 + 0.6 * n; c.ambush = n >= 5 ? 2 : 1; c.inv = Math.max(c.inv, 0.2);
      for (let i = 0; i < n; i++) later(i * 0.05, () => shockwave(c.x, c.z, 1 + i * 0.45, PURP, 0.3));
      for (let i = 0; i < 30; i++) soft.emit({ x: c.x + (Math.random() - 0.5) * 0.8, y: 0.1, z: c.z, vy: 3 + Math.random() * 3, drag: 1.5, life: 0.7, c: lc(ASH[i % 3]), size: PX * 3, grow: 1.5, a: 0.85 });
      log(`그림자 잠행: ${c.stealth.toFixed(1)}초 은신${n >= 5 ? ' (기습 2회)' : ''}`, '전투');
    },
    update(c, sk, dt, F) { return { f: F.atk[0], done: sk.t > 0.2 }; },
  },
};
