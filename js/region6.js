'use strict';
// 6지역: 문 너머 공허 (기획서 3장) — 무너진 이계, 공허의 존재, 약점 "어둠 외" (어둠이 아닌 속성 모두 1.5배)
// 지역 규칙: 잠식된 시야 — 내 주변만 보이고 나머지는 어둠. 공격 예고는 어둠 속에서도 빛난다
// 지역 보스: 공허의 사도 니힐 (마지막 문 '문을 삼킨 자'는 레이드에서)

const VP = {
  flesh: ['#08040e', '#160a22', '#26123a', '#3a1c54', '#542a74'], teal: ['#06201e', '#0e3a36', '#1a5a52', '#2a8a7a', '#5ad8c0'],
  shell: ['#0a0a10', '#16161e', '#24242e', '#363644', '#4c4c5e'], mag: '#ff4ad8', cyan: '#5affe0', white: '#f0e8ff',
};
const VOIDC = [1.8, 0.6, 2.8], VCYAN = [0.6, 2.6, 2.4];
function drawVoidling(g, G, p, b) {
  const F = b ? VP.teal : VP.flesh, st = p.st, bob = p.i * 0.8, low = st === 'wind' ? 2 : 0;
  for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.9 + i * 0.36, w = Math.sin(p.i * 2 + i) * 2; limb(g, 16 + Math.cos(a) * 4, 24, 16 + Math.cos(a) * 11 + w, 30 + Math.abs(Math.sin(a)) * 2, 2.4, 0.8, F.slice(0, 4)); }
  blob(g, 16, 18 + low + bob * 0.5, 9 - low * 0.5, 8 + low * 0.5, F, { rough: 0.5 });
  const eye = (x, y, r) => { blob(g, x, y, r, r, ['#e8e0f0', '#ffffff']); g.rect(x - 0.5, y - 0.5, 1, 1.5, '#000'); G.set(x, y, b ? VP.cyan : VP.mag); };
  eye(18, 15 + bob * 0.5, 2.4); eye(13, 18 + bob * 0.5, 1.6); eye(20, 20 + bob * 0.5, 1.2);
  if (st === 'act' || st === 'wind') { g.rect(12, 22 + low, 9, 2, '#000'); for (let k = 0; k < 5; k++) g.set(12.5 + k * 2, 22 + low, '#e8e0f0'); }
  for (let k = 0; k < 4; k++) G.set(10 + k * 3, 12 + (k % 2) * 2 + bob * 0.5, b ? VP.cyan : VP.mag);
}
function drawEye(g, G, p, b) {
  const st = p.st, bob = p.i, open = st === 'wind' || st === 'act';
  for (let i = 0; i < 5; i++) { const a = Math.PI * 0.25 + i * 0.32; limb(g, 16 + Math.cos(a) * 6, 18 + Math.sin(a) * 6, 16 + Math.cos(a) * 14 + Math.sin(p.i * 3 + i) * 2, 30 + i, 1.6, 0.6, VP.flesh.slice(0, 4)); }
  blob(g, 16, 16 + bob, 10, 10, VP.flesh, { rough: 0.3 });
  blob(g, 17, 16 + bob, 7, open ? 6 : 2.5, ['#c8c0d8', '#e8e0f0', '#ffffff'], { rough: 0.1 });
  if (open) { blob(g, 18, 16 + bob, 3.6, 3.6, b ? ['#0a3a34', '#1a8a7a', '#5ad8c0'] : ['#3a0a34', '#8a1a7a', '#ff4ad8'], { lit: 0.1 }); g.rect(17.5, 14 + bob, 1.2, 4, '#000'); G.rect(19, 15 + bob, 1, 1, VP.white); }
  for (let k = 0; k < 6; k++) G.set(8 + k * 3, 7 + (k % 2) * 2 + bob, b ? VP.cyan : VP.mag);
}
function drawHusk(g, G, p) {
  const A = VP.shell, st = p.st, sw = st === 'move' ? (p.i ? 1.5 : -1.5) : 0, push = st === 'act' ? 3 : st === 'wind' ? -1 : 0;
  limb(g, 17, 31, 15 - sw, 43, 3, 2.4, A); limb(g, 23, 31, 25 + sw, 43, 3, 2.4, A);
  const bl = st === 'wind' ? [6, 0] : st === 'act' ? [36, 26] : [8, 26];
  limb(g, 16, 20, bl[0] + 2, bl[1] + 5, 2.6, 2.2, A); for (let k = 0; k < 9; k++) G.set(bl[0] + 2 - k * 0.25, bl[1] + 4 - k, VP.mag);
  blob(g, 20, 23, 8, 8.5, A, { rough: 0.3, lit: 0.05 });
  // 갈라진 가슴 속 공허
  blob(g, 20, 23, 3, 5, ['#000000', '#08040e']); for (let k = 0; k < 5; k++) G.set(19 + (k % 2), 20 + k * 1.4, VP.mag);
  blob(g, 21, 11, 4.6, 4.8, A, { lit: 0.12 }); g.rect(18, 9, 7, 6, '#000'); G.set(20, 11, VP.mag); G.set(23, 11, VP.mag);
  const sx = 26 + push;
  eachPx(g, sx, 12, sx + 11, 41, (px, py, X, Y) => { const cx = sx + 5.5, hw = 5.5 - Math.max(0, Y - 34) * 0.7; if (Math.abs(X - cx) > hw) return; const e = Math.abs(X - cx) > hw - 1 || Y < 13; g.fset(px, py, e ? VP.teal[3] : A[shadeAt(0.65 - (X - sx) / 11 * 0.4 + (vnoise(X, Y) - 0.5) * 0.2, 5, px, py)]); });
  for (let k = 0; k < 8; k++) G.set(sx + 5.5 + Math.cos(k * 0.8) * 2.6, 24 + Math.sin(k * 0.8) * 3.4, VP.cyan);
}
function drawCaller(g, G, p) {
  const st = p.st, bob = p.i * 0.8;
  eachPx(g, 5, 16, 27, 46, (px, py, X, Y) => { const hw = 4 + (Y - 16) * 0.3 + Math.sin(Y * 0.7 + p.i) * 0.8; if (Math.abs(X - 16) < hw && Y < 45 - Math.abs(Math.sin(X)) * 2) g.fset(px, py, VP.flesh[shadeAt(0.5 - (X - 16) / hw * 0.3 + (vnoise(X * 0.4, Y * 0.4) - 0.5) * 0.3, 5, px, py)]); });
  blob(g, 16, 11 + bob, 5, 6, VP.flesh, { lit: 0.1 }); g.rect(13.5, 9 + bob, 5, 5, '#000');
  for (let k = 0; k < 3; k++) G.set(14 + k * 1.5, 11 + bob, VP.cyan);
  const up = st === 'wind'; for (const sd of [-1, 1]) { const hx = 16 + sd * (up ? 8 : 9), hy = up ? 4 + bob : 24 + bob; limb(g, 16 + sd * 3, 20 + bob, hx, hy, 2.2, 1.6, VP.flesh); for (let a = 0; a < TAU; a += 0.6) G.set(hx + Math.cos(a + p.i) * 2, hy - 2 + Math.sin(a + p.i) * 2, VP.mag); }
}
function drawStalker(g, G, p) {
  const S0 = VP.shell, st = p.st, sw = st === 'move' ? (p.i ? 2 : -2) : 0, lean = st === 'act' ? 5 : st === 'wind' ? -3 : 0, bob = p.i * 0.5;
  limb(g, 20, 34, 16 - sw, 48, 2.6, 1.6, S0); limb(g, 26, 34, 30 + sw, 48, 2.6, 1.6, S0);
  blob(g, 23 + lean * 0.3, 26 + bob, 6, 10, S0, { rough: 0.3 }); for (let k = 0; k < 5; k++) G.set(23 + lean * 0.3, 20 + k * 2.5 + bob, VP.cyan);
  blob(g, 26 + lean, 13 + bob, 4, 5, S0, { lit: 0.1 }); limb(g, 24 + lean, 9 + bob, 18 + lean, 3 + bob, 2.2, 0.6, S0); limb(g, 28 + lean, 9 + bob, 33 + lean, 2 + bob, 2.2, 0.6, S0);
  G.set(27 + lean, 13 + bob, VP.cyan); G.set(29 + lean, 13 + bob, VP.cyan);
  // 긴 낫 팔 두 개
  for (const sd of [-1, 1]) { const tip = st === 'wind' ? [23 + sd * 14, 2] : st === 'act' ? [46, 30 + sd * 4] : [23 + sd * 15, 36 + bob]; limb(g, 23 + sd * 4, 20 + bob, (23 + tip[0]) / 2, (20 + tip[1]) / 2 - 3, 2.2, 1.6, S0); for (let k = 0; k <= 10; k++) { const t = k / 10, x = (23 + tip[0]) / 2 + (tip[0] - (23 + tip[0]) / 2) * t, y = (20 + tip[1]) / 2 - 3 + (tip[1] - (20 + tip[1]) / 2 + 3) * t + Math.sin(t * Math.PI) * 3; g.set(x, y, '#d0c8e0'); G.set(x, y + 0.5, k % 2 ? VP.cyan : '#ffffff'); } }
}
function drawApostle(g, G, p) {
  const st = p.st, bob = p.i * 1.2, cx = 40;
  // 날개처럼 펼친 공허 조각
  for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + sd * (0.5 + k * 0.32), L = 22 + (k % 2) * 6, x0 = cx + sd * 6, y0 = 30 + bob; limb(g, x0, y0, x0 + Math.cos(a) * L * (st === 'wind' ? 1.15 : 1), y0 + Math.sin(a) * L * 0.8, 3, 0.6, VP.flesh.slice(0, 4)); G.set(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L * 0.8, k % 2 ? VP.mag : VP.cyan); }
  eachPx(g, 20, 34, 60, 90, (px, py, X, Y) => { const hw = 8 + (Y - 34) * 0.32 + Math.sin(Y * 0.3 + p.i) * 1.2; if (Math.abs(X - cx) < hw && Y < 88 - Math.abs(Math.sin(X * 0.5)) * 4) g.fset(px, py, VP.flesh[shadeAt(0.5 - (X - cx) / hw * 0.25 + (vnoise(X * 0.2, Y * 0.2) - 0.5) * 0.3, 5, px, py)]); });
  for (let y = 40; y < 84; y += 3) G.set(cx + Math.sin(y * 0.4) * 2, y, VP.mag);
  // 텅 빈 얼굴에 떠 있는 고리
  blob(g, cx, 26 + bob, 7, 8, VP.shell, { lit: 0.1 }); blob(g, cx, 27 + bob, 5, 6, ['#000000', '#04020a']);
  G.set(cx - 2, 26 + bob, VP.white); G.set(cx + 2, 26 + bob, VP.white);
  for (let a = 0; a < TAU; a += 0.08) { if (Math.sin(a * 4 + p.i) > 0.8) continue; G.set(cx + Math.cos(a) * 12, 14 + bob + Math.sin(a) * 3.5, st === 'wind' ? VP.white : VP.cyan); }
  const hand = st === 'wind' ? [[cx - 16, 10], [cx + 16, 10]] : st === 'act' ? [[cx - 8, 52], [cx + 26, 46]] : [[cx - 14, 54 + bob], [cx + 14, 54 + bob]];
  for (const [hx, hy] of hand) { limb(g, cx + Math.sign(hx - cx) * 7, 38 + bob, hx, hy, 3.2, 2, VP.shell); blob(g, hx, hy, 3, 3, ['#3a0a34', '#8a1a7a', '#ff4ad8'], { lit: 0.2 }); }
}
Object.assign(MON_ART, {
  voidling: { w: 32, h: 33, draw: (g, G, p) => drawVoidling(g, G, p, false) }, voidlingB: { w: 32, h: 33, draw: (g, G, p) => drawVoidling(g, G, p, true) },
  veye: { w: 32, h: 36, draw: (g, G, p) => drawEye(g, G, p, false) }, veyeB: { w: 32, h: 36, draw: (g, G, p) => drawEye(g, G, p, true) },
  husk: { w: 40, h: 45, draw: drawHusk }, caller: { w: 32, h: 47, draw: drawCaller }, stalker: { w: 48, h: 50, draw: drawStalker }, apostle: { w: 80, h: 92, draw: drawApostle },
});
for (const k of ['voidling', 'voidlingB', 'veye', 'veyeB', 'husk', 'caller', 'stalker', 'apostle']) MON_FRAMES[k] = bakeMonster(k);

// ---- 몬스터 ----
const VBLOOD = ['#26123a', '#ff4ad8', '#08040e'];
Object.assign(MON, {
  voidling:  { name: '공허 잔해', lv: 76, hp: 1800, r: 0.55, top: 2.0, s: 1.05, speed: 4.2, aggro: 9, spark: '#ff4ad8', blood: VBLOOD, glow: [2.8, 0.8, 2.4], pats: ['vlunge'], exp: 0.035, weak: 'notdark' },
  voidlingB: { name: '청록 공허 잔해', lv: 77, hp: 2000, r: 0.55, top: 2.0, s: 1.1, speed: 4.8, aggro: 10, spark: '#5affe0', blood: ['#0e3a36', '#5affe0', '#06201e'], glow: [0.6, 2.8, 2.4], pats: ['vlungeB'], exp: 0.04, weak: 'notdark' },
  veye:      { name: '떠도는 눈', lv: 76, hp: 1500, r: 0.6, top: 2.0, s: 1.0, speed: 2.4, aggro: 12, keep: 7, fly: 1.4, spark: '#ff4ad8', blood: VBLOOD, glow: [2.8, 0.8, 2.4], pats: ['vbeam'], exp: 0.035, weak: 'notdark' },
  veyeB:     { name: '청록 눈', lv: 77, hp: 1700, r: 0.6, top: 2.0, s: 1.05, speed: 2.4, aggro: 12, keep: 7, fly: 1.4, spark: '#5affe0', blood: ['#0e3a36', '#5affe0', '#06201e'], glow: [0.6, 2.8, 2.4], pats: ['vbeam2'], exp: 0.04, weak: 'notdark' },
  husk:      { name: '공허 껍데기 기사', lv: 77, hp: 3200, r: 0.75, top: 2.7, s: 1.05, speed: 2.1, aggro: 8, heavy: true, shield: true, spark: '#8a8aa0', blood: ['#24242e', '#ff4ad8', '#363644'], glow: [2.8, 0.8, 2.4], pats: ['vcleave', 'shieldbash'], exp: 0.06, weak: 'notdark' },
  caller:    { name: '균열 소환사', lv: 77, hp: 2300, r: 0.55, top: 2.9, s: 1.0, speed: 2.0, aggro: 11, keep: 6, fly: 0.3, summon: 'voidling', spark: '#5affe0', blood: VBLOOD, glow: [0.6, 2.8, 2.4], pats: ['rift', 'vorb'], exp: 0.06, weak: 'notdark' },
  stalker:   { name: '공허 추적자', lv: 78, hp: 7000, r: 0.9, top: 3.1, s: 1.05, speed: 2.6, aggro: 12, heavy: true, stag: 150, elite: true, spark: '#5affe0', blood: ['#24242e', '#5affe0', '#0a0a10'], glow: [0.6, 2.8, 2.4], pats: ['blink', 'scythes'], exp: 0.12, weak: 'notdark' },
  apostle:   { name: '공허의 사도 니힐', lv: 80, hp: 64000, r: 1.6, top: 5.6, s: 1.0, speed: 1.0, aggro: 18, heavy: true, stag: 300, boss: true, fly: 0.4, summon: 'voidling', spark: '#f0e8ff', blood: VBLOOD, glow: [2.6, 1.6, 2.8], pats: ['vcone', 'barrage', 'blink'], exp: 0.7, weak: 'notdark',
    phases: [{ at: 0.7, add: 'gravity', name: '모든 것이 끌려간다' }, { at: 0.4, add: 'crossrift', name: '균열이 세계를 가른다' }] },
});
function voidBurst(x, z, n = 16, col = VOIDC) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 4; glow.emit({ x, y: 0.4 + Math.random(), z, vx: Math.cos(a) * s, vy: Math.random() * 2, vz: Math.sin(a) * s * 0.7, drag: 2, life: 0.6, c: col, size: PX * 1.2 }); } for (let i = 0; i < n / 2; i++) soft.emit({ x, y: 0.4, z, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 2, drag: 1.5, life: 1, c: lc('#08040e'), size: PX * 3, grow: 1.6, a: 0.8 }); }
function vbeam(m, dx, dz, L, W, dmg, col) { const n = Math.ceil(L / 0.4); for (let i = 0; i < n; i++) later(i * 0.008, () => { const d = 0.8 + i * 0.4; glow.emit({ x: m.x + dx * d, y: 1.3, z: m.z + dz * d, vy: 0.4, life: 0.35, c: col, size: PX * 2.2 }); }); lightLine(m.x, m.z, dx, dz, L, col, 0.35, 1.3); if (dmg) hurtIf(m, inRect(m.x, m.z, dx, dz, L, W), dmg); }
Object.assign(PAT, {
  vlunge: { range: 4.2, wind: 0.4, cd: 2.0, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4.2, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 3.8; return 0.22; },
    run(m, u) { const k = Math.min(1, u / 0.2); m.x = m.ax + m.aim[0] * m.dl * k; m.z = m.az + m.aim[1] * m.dl * k; collide(m, 0.5); glow.emit({ x: m.x, y: 0.8, z: m.z, life: 0.3, c: m.def.glow, size: PX });
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.1) { m.hitDone = true; hurtPlayer(A, 24, m.x, m.z); } } } },
  vlungeB: { range: 5.2, wind: 0.32, cd: 1.7, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5.2, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 4.8; return 0.24; }, run(m, u) { PAT.vlunge.run(m, u); } },
  // 눈: 긴 광선 (예고가 다 차면 즉시)
  vbeam: { range: 12, min: 2.5, wind: 0.9, cd: 2.8, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 12, 0.9); },
    fire(m) { vbeam(m, m.aim[0], m.aim[1], 12, 0.9, 24, VOIDC); return 0.3; } },
  vbeam2: { range: 12, min: 2.5, wind: 1.0, cd: 3.0, cut: true,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.3, 0.3].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 12, 0.9)); },
    fire(m) { m.fan.forEach(([x, z]) => vbeam(m, x, z, 12, 0.9, 24, VCYAN)); return 0.3; } },
  vcleave: { range: 3, wind: 0.9, cd: 2.8, cut: true, rec: 0.6,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], 3.2, 1.6); },
    fire(m) { const [rx, rz] = camRight(), f = (m.aim[0] * rx + m.aim[1] * rz) >= 0 ? 1 : -1; spawnSlash({ x: m.x, y: 1.3, z: m.z, size: 5, rot: -10, face: f, color: VOIDC, life: 0.24 }); shake = Math.max(shake, 0.35); hurtIf(m, inCone(m.x, m.z, m.aim[0], m.aim[1], 3.2, 1.6), 32); return 0.3; } },
  rift: { range: 99, wind: 1.2, cd: 9, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 1.5); },
    fire(m) { const kind = m.def.summon; if (mons.filter(o => o.kind === kind && o.state !== 'dead').length < 3) [-1, 1].forEach(sd => { const [rx, rz] = camRight(); const x = m.x + rx * sd * 2.4, z = m.z + rz * sd * 2.4 + 0.8; voidBurst(x, z, 24); spawnMon(kind, x, z, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul * 0.45 : 1 }); }); shockwave(m.x, m.z, 3, VCYAN, 0.4); return 0.3; } },
  vorb: { range: 10, min: 2.5, wind: 0.8, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 9, 0.7); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 22, speed: 6, size: 1.1, r: 0.65, col: VCYAN }); return 0.2; } },
  // 추적자 · 사도: 사라졌다가 등 뒤에 나타나 벤다
  blink: { range: 14, wind: 0.5, cd: 4.0, rec: 0.6,
    begin(m) { voidBurst(m.x, m.z, 20, VCYAN); },
    fire(m) { const A = hero(), a = Math.atan2(A.z - m.z, A.x - m.x); m.x = A.x + Math.cos(a) * 1.6; m.z = A.z + Math.sin(a) * 1.6; collide(m, m.def.r * 0.8); m.dir = a + Math.PI; m.bx = A.x; m.bz = A.z; m.bt = teleCircle(m, A.x, A.z, m.def.boss ? 2.4 : 1.8); voidBurst(m.x, m.z, 20, VCYAN); m.hitDone = false; return 0.75; },
    run(m, u) { m.sink = u < 0.2 ? 1 - u / 0.2 : 0; if (m.bt) m.bt.setK(Math.min(1, u / 0.55));
      if (u >= 0.55 && !m.hitDone) { m.hitDone = true; clearTele(m); m.bt = null; m.sink = 0; [40, -40].forEach(r => spawnSlash({ x: m.bx, y: 1.2, z: m.bz, size: 3.6, rot: r, face: 1, color: VCYAN, life: 0.2 })); shake = Math.max(shake, 0.4); hurtIf(m, inCircle(m.bx, m.bz, m.def.boss ? 2.4 : 1.8), m.def.boss ? 40 : 34); } } },
  scythes: { range: 3.2, wind: 0.8, cd: 2.6, cut: true,
    begin(m) { teleCircle(m, m.x, m.z, 3); },
    fire(m) { [1, -1].forEach(fc => spawnSlash({ x: m.x, y: 1.2, z: m.z, size: 6, rot: 0, face: fc, color: VCYAN, life: 0.26, grow: 0.15 })); shake = Math.max(shake, 0.35); hurtIf(m, inCircle(m.x, m.z, 3), 32); return 0.3; } },
  vcone: { range: 6, wind: 1.0, cd: 3.0, cut: true, rec: 0.6,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], 6.5, 1.4); },
    fire(m) { const [rx, rz] = camRight(), f = (m.aim[0] * rx + m.aim[1] * rz) >= 0 ? 1 : -1; spawnSlash({ x: m.x, y: 1.6, z: m.z, size: 10, rot: -6, face: f, color: VOIDC, life: 0.3, grow: 0.2 }); for (let i = 0; i < 14; i++) { const a = Math.atan2(m.aim[1], m.aim[0]) + (i / 13 - 0.5) * 1.4; voidBurst(m.x + Math.cos(a) * 4.5, m.z + Math.sin(a) * 4.5, 4); } shake = Math.max(shake, 0.5); hurtIf(m, inCone(m.x, m.z, m.aim[0], m.aim[1], 6.5, 1.4), 46); return 0.35; } },
  barrage: { range: 14, wind: 0.9, cd: 3.6,
    begin(m) { m.ra = Math.random() * TAU; for (let i = 0; i < 8; i++) { const a = m.ra + i / 8 * TAU; teleRect(m, m.x, m.z, Math.cos(a), Math.sin(a), 9, 0.5); } },
    fire(m) { for (let w = 0; w < 2; w++) later(w * 0.45, () => { for (let i = 0; i < 8; i++) { const a = m.ra + (i + w * 0.5) / 8 * TAU; mShoot(m, Math.cos(a), Math.sin(a), { dmg: 22, speed: 6.5, size: 1, col: w ? VCYAN : VOIDC }); } }); return 0.6; } },
  // 모든 것이 끌려간다: 1초 동안 보스 쪽으로 끌어당긴 뒤 중심 폭발 (반대로 걸어 버텨야 한다)
  gravity: { range: 20, wind: 0.6, cd: 5.6, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 3.4); },
    fire(m) { m.gs = 0; m.lu = 0; return 1.5; },
    run(m, u) {
      const A = hero(), du = Math.max(0, u - m.lu); m.lu = u;
      if (u < 1.1 && !A.down) { const dx = m.x - A.x, dz = m.z - A.z, d = Math.hypot(dx, dz) || 1; if (d > 1.5) { A.x += dx / d * 2.6 * du; A.z += dz / d * 2.6 * du; collide(A, 0.35); }
        if (Math.random() < 0.6) { const a = Math.random() * TAU, R = 6 + Math.random() * 4; glow.emit({ x: m.x + Math.cos(a) * R, y: 0.3 + Math.random() * 2, z: m.z + Math.sin(a) * R, vx: -Math.cos(a) * 8, vz: -Math.sin(a) * 8, life: 0.6, c: VOIDC, size: PX * 1.2 }); } }
      for (const t of m.teles) t.setK(Math.min(1, u / 1.1));
      if (u >= 1.1 && !m.gs) { m.gs = 1; clearTele(m); impact(m.x, m.z, 4.2, VOIDC); voidBurst(m.x, m.z, 40); shake = Math.max(shake, 0.6); hurtIf(m, inCircle(m.x, m.z, 3.4), 48); }
    } },
  // 균열이 세계를 가른다: 방 네 귀퉁이 균열에서 엇갈리는 광선
  crossrift: { range: 30, wind: 1.3, cd: 5.4, rec: 0.6,
    begin(m) { const k = Math.random() < 0.5 ? 0 : 1; m.rifts = k ? [[-9, -7, 1, 0.9], [9, 9, -1, -0.9]] : [[-9, 9, 1, -0.9], [9, -7, -1, 0.9]]; m.rifts.push(k ? [-9, 1.5, 1, 0] : [0, -8, 0, 1]); m.rifts = m.rifts.map(([x, z, dx, dz]) => { const l = Math.hypot(dx, dz); return [x, z, dx / l, dz / l]; }); m.rifts.forEach(([x, z, dx, dz]) => teleRect(m, x, z, dx, dz, 22, 1.4)); },
    fire(m) { m.rifts.forEach(([x, z, dx, dz], i) => later(i * 0.12, () => { voidBurst(x, z, 30, VCYAN); vbeam({ x, z }, dx, dz, 22, 1.4, 0, i % 2 ? VCYAN : VOIDC); hurtIf(m, inRect(x, z, dx, dz, 22, 1.4), 38); })); shake = Math.max(shake, 0.5); return 0.6; } },
});

// ---- 공허 방 ----
const VTEX = (() => {
  const obel = new Pix(14, 56, S); eachPx(obel, 0, 0, 14, 56, (px, py, X, Y) => { const top = 8 + Math.sin(X * 1.7) * 4; if (Y < top) return; const hw = 5.2 - Y * 0.02; if (Math.abs(X - 7) < hw) obel.fset(px, py, VP.shell[shadeAt(0.62 - (X - 7) / hw * 0.35 + (vnoise(X, Y * 0.3) - 0.5) * 0.25, 5, px, py)]); }); for (let y = 14; y < 52; y += 4) obel.set(7, y, (y / 4) % 2 ? VP.mag : VP.cyan);
  const crys = new Pix(16, 26, S); eachPx(crys, 0, 0, 16, 26, (px, py, X, Y) => { for (const [cx, w, h] of [[8, 3.6, 24], [4, 2.2, 14], [12, 2.4, 16]]) { const t = (26 - Y) / h; if (t > 0 && t < 1 && Math.abs(X - cx) < w * (1 - t * 0.8)) crys.fset(px, py, VP.flesh[shadeAt(0.8 - (X - cx) / w * 0.3 + t * 0.2, 5, px, py)]); } });
  const rock = new Pix(28, 14, S); eachPx(rock, 0, 0, 28, 14, (px, py, X, Y) => { const hw = 13 - Math.abs(Y - 4) * (Y > 4 ? 2.2 : 3); if (Math.abs(X - 14) < hw) rock.fset(px, py, Y < 3 ? '#2a2a36' : VP.shell[shadeAt(0.5 - Y / 30 + (vnoise(X, Y) - 0.5) * 0.3, 5, px, py)]); });
  return { obel: tex(obel.outline(OUT).canvas()), crys: tex(crys.outline(OUT).canvas()), rock: tex(rock.outline(OUT).canvas()) };
})();
const voidGroundTex = (() => {
  const W = GW * 8, H = GD * 8, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#0a0612'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) { if (hash2(x, y) < 0.35) continue; const v = 22 + hash2(x + 1, y) * 14 | 0; g.fillStyle = `rgb(${v},${v - 6},${v + 10})`; g.fillRect(x + 1, y + 1, 18, 18); }
  for (let i = 0; i < 900; i++) { g.fillStyle = hash2(i, 5) > 0.5 ? 'rgba(255,74,216,.5)' : 'rgba(90,255,224,.45)'; g.fillRect(hash2(i, 1) * W, hash2(i, 2) * H, 1.5, 1.5); }
  for (let i = 0; i < 30; i++) { let x = hash2(i, 3) * W, y = hash2(i, 4) * H; g.strokeStyle = 'rgba(255,74,216,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash2(i, k + 7) - 0.5) * 40; y += (hash2(i, k + 13) - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  return tex(c);
})();
const VMAT = Object.fromEntries(Object.entries(VTEX).map(([k, t]) => [k, new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })]));
const floaters6 = [];
function buildVoid(seed, boss) {
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); }, add = m => { scene.add(m); DUN.objs.push(m); return m; };
  floaters6.length = 0;
  for (const sd of [-1, 1]) for (const z of [-7.5, -3.5, 5.5, 9]) { const m = dBB(VMAT.obel, 14, 56, sd * 9.3, z, { s: 1.1 }); const oc = { mesh: m, r: 1.0, h: 3.8 }; occluders.push(oc); DUN.occ.push(oc); obs(sd * 9.3, z, 0.55); }
  // 공중에 떠도는 바위 · 멀리 떠 있는 섬
  for (let i = 0; i < 12; i++) { const x = -14 + r() * 28, z = -14 + r() * 8 - (i % 2 ? 0 : 6), y = 3 + r() * 6, m = dBB(VMAT.rock, 28, 14, x, z, { y, s: 0.8 + r() * 1.4, cast: false }); floaters6.push({ m, y, ph: r() * 6 }); }
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13; if (Math.hypot(x + 7, z - 1.5) < 3 || Math.abs(z - 1.5) < 1) continue; dBB(VMAT.crys, 16, 26, x, z, { s: 1.1 }); obs(x, z, 0.5); }
  for (let i = 0; i < 8; i++) dBB(VMAT.crys, 16, 26, (r() < 0.5 ? -1 : 1) * (6.5 + r() * 2.5), -8 + r() * 17, { s: 0.4 + r() * 0.4, cast: false });
  // 장식 균열 소용돌이 (북쪽 하늘)
  for (const x of [-6, 6]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), new THREE.MeshBasicMaterial({ map: swirlTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.4, 0.4, 1.8), fog: false })); sw.position.set(x, 5, -12); add(sw); floaters6.push({ m: sw, spin: true }); }
  for (const [x, z, c] of [[-7, -8, 0xff4ad8], [7, 8, 0x5affe0], [7, -8, 0xff4ad8]]) { const l = new THREE.PointLight(c, 5, 9, 1.6); l.position.set(x, 1.6, z); scene.add(l); DUN.lights.push(l); }
}
function updateRegion6(dt) {
  if (!(DUN.on && DUN.d && DUN.d.region === 6)) return;
  for (const f of floaters6) { if (f.spin) { f.m.rotation.z -= dt * 1.5; continue; } f.m.position.y = f.y + Math.sin(uTime.value * 0.8 + f.ph) * 0.4; }
  if (Math.random() < dt * 20) glow.emit({ x: -11 + Math.random() * 22, y: 0.1, z: -9 + Math.random() * 20, vy: 0.6 + Math.random(), life: 2.5, c: Math.random() < 0.5 ? VOIDC : VCYAN, size: PX, fadeIn: 0.4 });
}
// 잠식된 시야: 내 캐릭터 주변만 밝다
function drawVoidVision(g, w, h) {
  if (!(DUN.on && DUN.d && DUN.d.region === 6) || DUN.fade >= 1) return;
  const A = party[active], v = new THREE.Vector3(A.x, 1.2, A.z).project(camera), sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h;
  const R = Math.min(w, h) * (0.58 + 0.02 * Math.sin(uTime.value * 1.5)), gr = g.createRadialGradient(sx, sy, R * 0.35, sx, sy, R * 1.25);
  gr.addColorStop(0, 'rgba(4,0,10,0)'); gr.addColorStop(0.6, 'rgba(4,0,10,.4)'); gr.addColorStop(1, 'rgba(4,0,10,.78)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
Object.assign(REGION.ground, { 6: voidGroundTex }); REGION.build[6] = buildVoid; REGION.under[6] = 0x050208; REGION.update.push(updateRegion6); (REGION.hud = REGION.hud || []).push(drawVoidVision);
REGION.look[6] = { sun: [0xd8b8ff, 3.0], hemi: [0xb890ff, 0x281838, 2.0], fog: [0x1a0e2a, 24, 76], ground: [1.4, 1.3, 1.5] };
REGION.prefix[6] = { 일반: '닳아 없어질', 고급: '균열 묻은', 희귀: '공허빛', 영웅: '문 너머의', 전설: '니힐의', 유물: '세계를 삼킨', 태초: '태초 공허의' };

// ---- 던전 ----
DUNGEONS.push(
  { id: 'rim', region: 6, tier: 0, ilv: 1620, name: '무너진 경계', lv: 76, seed: 801, hpMul: 2.6, dmgMul: 1.45, desc: '문 너머의 첫 땅. 시야가 좁다. 바닥의 예고만은 어둠 속에서도 빛난다. 떠도는 눈의 광선을 조심하라.', boss: '청록 공허 무리',
    rooms: [{ mons: [['voidling', 3], ['veye', 1]] }, { mons: [['voidling', 2], ['veye', 2]] }, { mons: [['voidlingB', 2], ['veyeB', 2]] }, { boss: true, mons: [['voidlingB', 3], ['veyeB', 2]] }] },
  { id: 'hollow', region: 6, tier: 0, ilv: 1630, name: '텅 빈 성채', lv: 77, seed: 802, hpMul: 2.7, dmgMul: 1.5, desc: '껍데기만 남은 기사들이 지키는 성채. 균열 소환사는 공허 잔해를 끝없이 끌어낸다.', boss: '균열 소환사 둘',
    rooms: [{ mons: [['husk', 1], ['voidling', 2]] }, { mons: [['caller', 1], ['husk', 1]] }, { mons: [['husk', 2], ['veye', 1]] }, { boss: true, mons: [['caller', 2], ['husk', 1]] }] },
  { id: 'abyssal', region: 6, tier: 1, ilv: 1640, name: '추적자의 미로', lv: 78, seed: 803, hpMul: 2.8, dmgMul: 1.55, desc: '정예 던전. 방 여섯 개, 공허 추적자가 등 뒤로 나타난다. 발밑에 원이 생기면 바로 벗어나라.', boss: '공허 추적자 둘',
    rooms: [{ mons: [['voidling', 3], ['veye', 1]] }, { mons: [['husk', 2], ['caller', 1]] }, { mons: [['stalker', 1], ['veye', 2]] }, { mons: [['voidlingB', 3], ['husk', 1]] }, { mons: [['caller', 1], ['veyeB', 2]] }, { boss: true, mons: [['stalker', 2]] }] },
  { id: 'nihil', region: 6, tier: 2, ilv: 1660, name: '사도의 제단', lv: 80, seed: 804, hpMul: 2.8, dmgMul: 1.6, desc: '지역 보스 던전. 공허의 사도 니힐이 마지막 문을 지킨다. 70% · 40%에서 패턴이 늘어난다.', boss: '공허의 사도 니힐',
    rooms: [{ mons: [['husk', 2], ['veyeB', 2]] }, { mons: [['stalker', 1], ['voidlingB', 2]] }, { boss: true, mons: [['apostle', 1]] }] },
);
REGIONS.push({ id: 6, name: '문 너머 공허', lv: '76~80', need: 'heart', needName: '용암의 심장' });
