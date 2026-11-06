'use strict';
// 4지역: 얼어붙은 왕릉 (기획서 3장) — 눈보라 속 왕릉, 서리 망령 · 골렘, 지역 보스 서리의 왕, 약점 화염
// 지역 규칙: 냉기 — 서리 공격에 맞으면 냉기가 쌓여 느려지고, 4중첩이면 1.2초 얼어붙는다 (이동 · 대시 불가)

const IP = {
  ice: ['#1a2a3e', '#2a4462', '#406a92', '#6a9ac4', '#a8d0ec', '#e4f4ff'], wraith: ['#2a3448', '#46546e', '#6a7a96', '#98a8c0', '#cad6e6'],
  frostbone: ['#5a6474', '#8a94a4', '#b8c2d0', '#e0e8f0'], steel: ['#141a24', '#243042', '#3a4a62', '#566a86', '#7a90ae'],
  blackice: ['#06080e', '#10141e', '#1c2232', '#2a3248', '#3e4a66'], robe: ['#0e1420', '#18223a', '#243456', '#344a74'],
  crown: ['#3a5a7a', '#6aa0c8', '#a8e0ff', '#ffffff'], cape: ['#1a0e2a', '#2a1844', '#3e2462', '#563482'],
};
const FROST = [1.6, 2.4, 3.0];
function drawWraith(g, G, p, blue) {
  const W = IP.wraith, st = p.st, bob = st === 'idle' || st === 'move' ? p.i * 0.8 : 0, lean = st === 'act' ? 4 : st === 'wind' ? -2 : 0;
  for (let i = 0; i < 8; i++) { const y = 28 + i * 2.2 + bob, x = 15 - i * 0.6 + Math.sin(i * 1.3 + p.i) * 1.5; blob(g, x, y, 6 - i * 0.6, 1.6, W.slice(0, 4), { rough: 0.6 }); g.line(x - 4 + i * 0.4, y, x - 5, y + 3, W[1]); }
  blob(g, 16 + lean * 0.4, 21 + bob, 7, 9, W, { rough: 0.45 });
  blob(g, 18 + lean, 11 + bob, 4.4, 4.6, IP.frostbone, { lit: 0.1 }); blob(g, 17 + lean, 9 + bob, 5.6, 4, W, { rough: 0.3 });
  g.rect(18 + lean, 11 + bob, 2, 2, '#04060a'); g.rect(21 + lean, 11 + bob, 2, 2, '#04060a');
  const ec = blue ? '#4ab8ff' : '#b8f0ff'; G.set(18.5 + lean, 11.5 + bob, ec); G.set(21.5 + lean, 11.5 + bob, ec);
  const cl = st === 'wind' ? [[8, 6], [30, 6]] : st === 'act' ? [[32, 18], [34, 24]] : [[8, 26 + bob], [27, 25 + bob]];
  for (const [hx, hy] of cl) { limb(g, 16, 18 + bob, hx, hy, 2, 1.2, W.slice(0, 4)); for (let k = -1; k <= 1; k++) g.line(hx, hy, hx + (hx > 16 ? 2 : -2), hy + k * 1.5 + 1, IP.ice[4]); }
  for (let i = 0; i < 6; i++) G.set(10 + i * 2.4, 34 + (i % 2) * 3 + bob, blue ? '#4ab8ff' : IP.ice[4]);
}
function drawCaster(g, G, p) {
  const R = IP.robe, st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0;
  eachPx(g, 5, 18, 27, 46, (px, py, X, Y) => { const hw = 5 + (Y - 18) * 0.3; if (Math.abs(X - 16) < hw) g.fset(px, py, R[shadeAt(0.55 - (X - 16) / hw * 0.3 + (vnoise(X * 0.4, Y * 0.4) - 0.5) * 0.3, 4, px, py)]); });
  for (let x = 8; x < 25; x += 2) g.line(x, 43, x + 1, 46, R[2]);
  blob(g, 16, 13 + bob, 5.4, 5.8, R, { lit: 0.1 }); blob(g, 17, 14 + bob, 3.2, 3.6, IP.frostbone); g.rect(16, 13 + bob, 1, 2, '#04060a'); g.rect(18.5, 13 + bob, 1, 2, '#04060a');
  G.set(16, 13.5 + bob, '#7ad8ff'); G.set(18.5, 13.5 + bob, '#7ad8ff');
  const top = st === 'wind' ? 1 : 6 + bob;
  g.line(25, top + 4, 25, 46, '#4a5a6a'); g.line(26, top + 4, 26, 46, '#2a3442');
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.45; g.line(25.5, top + 3, 25.5 + Math.cos(a) * 4, top + 3 + Math.sin(a) * 4, IP.ice[4]); } G.rect(24.5, top + 1, 2, 2, st === 'wind' ? '#ffffff' : '#a8e4ff');
  limb(g, 20, 21 + bob, 25, st === 'wind' ? 10 : 22, 2.4, 2, R);
}
function drawGuard(g, G, p, black) {
  const A = black ? IP.blackice : IP.steel, st = p.st, sw = st === 'move' ? (p.i ? 1.5 : -1.5) : 0, push = st === 'act' ? 3 : st === 'wind' ? -1 : 0;
  limb(g, 17, 31, 15 - sw, 43, 3, 2.4, A); limb(g, 23, 31, 25 + sw, 43, 3, 2.4, A);
  const sp = st === 'wind' ? [6, 0] : st === 'act' ? [36, 22] : [9, 4];
  limb(g, 16, 20, sp[0] + 2, sp[1] + 6, 2.6, 2.2, A); g.line(sp[0] + 2, sp[1] + 6, sp[0] - 1, 44, '#5a4a3a'); for (let k = 0; k < 5; k++) g.set(sp[0] + 2 - k * 0.2, sp[1] + 5 - k, IP.ice[4]);
  blob(g, 20, 23, 8, 8.5, A, { rough: 0.3, lit: 0.05 });
  for (let k = 0; k < 3; k++) g.line(14, 20 + k * 3, 26, 20 + k * 3, A[3]);
  blob(g, 21, 11, 4.6, 4.6, A, { lit: 0.12 }); g.rect(17, 6, 9, 3, A[3]); for (let k = 0; k < 4; k++) limb(g, 18 + k * 2.2, 6, 17.5 + k * 2.4, 2 - (k % 2), 1.2, 0.6, IP.ice);
  g.rect(19, 11, 5, 1, '#02040a'); G.set(20, 11, black ? '#4a7aff' : '#a8e4ff'); G.set(22.5, 11, black ? '#4a7aff' : '#a8e4ff');
  const sx = 26 + push;
  eachPx(g, sx, 12, sx + 11, 41, (px, py, X, Y) => { const e = X < sx + 1 || X > sx + 10 || Y < 13 || Y > 40; g.fset(px, py, e ? IP.ice[3 + ((Y | 0) % 2)] : A[shadeAt(0.65 - (X - sx) / 11 * 0.4 + (vnoise(X, Y) - 0.5) * 0.2, 5, px, py)]); });
  for (let k = 0; k < 6; k++) G.set(sx + 5.5 + Math.cos(k * 1.05) * 2.4, 26 + Math.sin(k * 1.05) * 2.4, black ? '#4a7aff' : '#7ad8ff');
}
function drawKeeper(g, G, p) {
  const st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, sw = st === 'move' ? (p.i ? 1 : -1) : 0;
  limb(g, 14, 32, 13 - sw, 44, 2.6, 2.2, IP.robe); limb(g, 19, 32, 21 + sw, 44, 2.6, 2.2, IP.robe);
  blob(g, 17, 25 + bob, 7, 9, ['#1a1a20', '#2a2a34', '#3a3a48', '#4e4e60'], { rough: 0.4 });
  blob(g, 21, 14 + bob, 4.6, 4.2, ['#2a2a34', '#3a3a48', '#4e4e60']); blob(g, 23, 15 + bob, 2.6, 2.8, IP.frostbone);
  G.set(23, 14.5 + bob, '#7affd0');
  const up = st === 'wind'; const lx = up ? 26 : 25, ly = up ? 6 : 26 + bob;
  limb(g, 19, 20 + bob, lx, ly, 2.4, 2, ['#2a2a34', '#3a3a48']);
  g.line(lx, ly, lx, ly + 3, '#6a6a7a'); g.rect(lx - 1.5, ly + 3, 3, 4, '#3a3a48'); G.rect(lx - 0.5, ly + 4, 1, 2, up ? '#ffffff' : '#7affd0');
  g.line(10, 10 + bob, 14, 40, '#5a4a3a'); g.rect(8, 6 + bob, 5, 4, '#6a7080');
}
function drawFrostGolem(g, G, p) {
  const I = IP.ice, st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, step = st === 'move' ? (p.i ? 1.2 : -1.2) : 0, cx = 23;
  const shard = (x, y, w, h, a) => eachPx(g, x - w - h, y - h - w, x + w + h, y + h + w, (px, py, X, Y) => { const dx = X - x, dy = Y - y, u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(u) / w + Math.abs(v) / h < 1) g.fset(px, py, I[shadeAt(0.7 - u / w * 0.25 - v / h * 0.2 + (vnoise(X, Y) - 0.5) * 0.15, 6, px, py)]); });
  shard(cx - 7 + step, 43, 4, 6, 0); shard(cx + 7 - step, 43, 4, 6, 0);
  const arm = (sd) => { const [fx, fy] = st === 'wind' ? [cx + sd * 9, 6] : st === 'act' ? [cx + sd * 17, 44] : [cx + sd * 16, 35 + bob]; limb(g, cx + sd * 11, 22 + bob, fx, fy, 6, 5, I.slice(1, 5)); shard(fx, fy, 4, 5, sd * 0.4); };
  arm(-1);
  shard(cx, 28 + bob, 12, 13, 0.1); shard(cx - 6, 20 + bob, 5, 8, -0.5); shard(cx + 7, 19 + bob, 4, 9, 0.6);
  for (let k = 0; k < 4; k++) G.line(cx - 3 + k * 2, 24 + bob + k * 2, cx - 1 + k * 2, 30 + bob + k * 2, st === 'wind' ? '#ffffff' : '#7ad8ff');
  shard(cx + 1, 12 + bob, 5, 4.4, 0); g.rect(cx - 1, 12 + bob, 6, 2, '#0a1424'); G.rect(cx - 1, 12 + bob, 2, 2, '#c8f4ff'); G.rect(cx + 3, 12 + bob, 2, 2, '#c8f4ff');
  arm(1);
}
function drawKing(g, G, p) {
  const St = IP.steel, C = IP.cape, Bo = IP.frostbone, st = p.st, bob = st === 'idle' ? p.i * 0.8 : 0, cx = 32;
  // 망토
  eachPx(g, 10, 30, 52, 88, (px, py, X, Y) => { const hw = 9 + (Y - 30) * 0.3 + Math.sin(Y * 0.4 + p.i) * 1; if (Math.abs(X - cx + 2) < hw && Y < 86 - Math.abs(Math.sin(X * 0.7)) * 3) g.fset(px, py, C[shadeAt(0.5 - (X - cx) / hw * 0.25 + (vnoise(X * 0.2, Y * 0.2) - 0.5) * 0.3, 4, px, py)]); });
  limb(g, cx - 4, 62, cx - 6, 86, 4.4, 3.6, St); limb(g, cx + 4, 62, cx + 6, 86, 4.4, 3.6, St);
  blob(g, cx, 48 + bob, 10, 15, St, { rough: 0.3, lit: 0.05 });
  for (let k = 0; k < 5; k++) g.line(cx - 7, 40 + k * 4 + bob, cx + 7, 40 + k * 4 + bob, St[3]);
  G.rect(cx - 1, 42 + bob, 2, 10, '#7ad8ff');
  // 해골 머리와 얼음 왕관
  blob(g, cx + 1, 27 + bob, 6, 6.4, Bo, { lit: 0.1 }); g.rect(cx - 2, 26 + bob, 2, 3, '#02040a'); g.rect(cx + 3, 26 + bob, 2, 3, '#02040a'); g.rect(cx - 1, 31 + bob, 5, 1, '#3a4454');
  const ec = st === 'wind' ? '#ffffff' : '#7ad8ff'; G.rect(cx - 2, 27 + bob, 1, 1, ec); G.rect(cx + 3, 27 + bob, 1, 1, ec);
  for (let k = 0; k < 7; k++) { const x = cx - 6 + k * 2, h = [5, 8, 6, 12, 6, 8, 5][k]; limb(g, x, 21 + bob, x + (k - 3) * 0.3, 21 - h + bob, 2, 0.6, IP.crown); }
  G.set(cx, 11 + bob, '#ffffff');
  // 팔: 얼음 대검 — 준비(머리 위) · 공격(앞으로 내려침)
  const hand = st === 'wind' ? [cx + 4, 6] : st === 'act' ? [cx + 22, 58] : [cx + 14, 54 + bob];
  limb(g, cx + 8, 38 + bob, hand[0], hand[1], 4, 3.2, St);
  const ang = st === 'wind' ? -Math.PI / 2 - 0.3 : st === 'act' ? 0.5 : -1.2, L = 30;
  for (let i = 0; i < L; i++) { const x = hand[0] + Math.cos(ang) * i, y = hand[1] + Math.sin(ang) * i, w = 2.6 * (1 - i / L) + 0.6; for (let o = -w; o <= w; o += 0.5) g.set(x - Math.sin(ang) * o, y + Math.cos(ang) * o, Math.abs(o) < 0.6 ? '#ffffff' : IP.ice[4 - (Math.abs(o) > w * 0.6 ? 1 : 0)]); }
  limb(g, cx - 8, 38 + bob, cx - 16, 58 + bob, 4, 3.2, St); blob(g, cx - 16, 60 + bob, 3, 3, IP.ice);
}
Object.assign(MON_ART, {
  wraith: { w: 36, h: 46, draw: (g, G, p) => drawWraith(g, G, p, false) }, wraithB: { w: 36, h: 46, draw: (g, G, p) => drawWraith(g, G, p, true) },
  caster: { w: 32, h: 47, draw: drawCaster }, guard: { w: 40, h: 45, draw: (g, G, p) => drawGuard(g, G, p, false) }, guardB: { w: 40, h: 45, draw: (g, G, p) => drawGuard(g, G, p, true) },
  keeper: { w: 32, h: 46, draw: drawKeeper }, fgolem: { w: 46, h: 50, draw: drawFrostGolem }, king: { w: 64, h: 90, draw: drawKing },
});
for (const k of ['wraith', 'wraithB', 'caster', 'guard', 'guardB', 'keeper', 'fgolem', 'king']) MON_FRAMES[k] = bakeMonster(k);

// ---- 냉기 ----
function chill(n) {
  const A = hero(); if (A.down || A.inv > 0) return;
  A.chill = Math.min(4, (A.chill || 0) + n); A.chillT = 4;
  if (A.chill >= 4 && !(A.frozenT > 0)) { A.frozenT = 1.2; A.chill = 0; floaters.push({ x: A.x, y: 3, z: A.z, t: 0, text: '얼어붙음!', crit: false, big: true, vx: 0, color: '#a8e4ff' }); shockwave(A.x, A.z, 1.6, FROST, 0.3); }
}
function updateChill(dt) {
  for (const c of party) {
    if (c.chillT > 0) { c.chillT -= dt; if (c.chillT <= 0) { c.chill = Math.max(0, (c.chill || 0) - 1); c.chillT = c.chill ? 2 : 0; } }
    if (c.frozenT > 0) { c.frozenT -= dt; c.kx = c.kz = 0; if (Math.random() < dt * 20) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.8, y: Math.random() * 2.2, z: c.z, vy: 0.2, life: 0.4, c: FROST, size: PX }); }
    const ch = c.frozenT > 0 ? 1 : (c.chill || 0) / 4;
    if (ch > 0 && c.hurtFlash <= 0) c.mat.color.setRGB(1 - ch * 0.35, 1 - ch * 0.15, 1 + ch * 0.4); else if (!(c.stealth > 0)) c.mat.color.setRGB(1, 1, 1);
  }
}
const chillMove = c => (c.frozenT > 0 ? 0 : 1 - (c.chill || 0) * 0.12);

// ---- 몬스터 ----
const SNOW = ['#e4f4ff', '#a8d0ec', '#6a9ac4'];
Object.assign(MON, {
  wraith:  { name: '서리 망령', lv: 66, hp: 1400, r: 0.55, top: 2.6, s: 1.0, speed: 3.8, aggro: 10, fly: 0.4, spark: '#c8e4ff', blood: SNOW, glow: [1.6, 2.6, 3.0], pats: ['frostclaw'], exp: 0.03, weak: 'fire' },
  wraithB: { name: '푸른 불꽃 망령', lv: 67, hp: 1600, r: 0.55, top: 2.6, s: 1.05, speed: 4.4, aggro: 11, fly: 0.4, spark: '#4ab8ff', blood: ['#4ab8ff', '#a8d0ec', '#2a4462'], glow: [0.6, 1.8, 3.0], pats: ['frostclawB'], exp: 0.035, weak: 'fire' },
  caster:  { name: '얼음 마녀', lv: 66, hp: 1100, r: 0.5, top: 2.9, s: 1.0, speed: 2.6, aggro: 11, keep: 6.5, spark: '#a8e4ff', blood: SNOW, glow: [1.6, 2.6, 3.0], pats: ['shards', 'icefloor'], exp: 0.03, weak: 'fire' },
  guard:   { name: '왕릉 수호병', lv: 67, hp: 2300, r: 0.75, top: 2.7, s: 1.05, speed: 2.0, aggro: 8, heavy: true, shield: true, spark: '#a8c0d8', blood: ['#566a86', '#a8d0ec', '#3a4a62'], glow: [1.6, 2.6, 3.0], pats: ['spear', 'shieldbash'], exp: 0.045, weak: 'fire' },
  guardB:  { name: '검은 얼음 수호병', lv: 68, hp: 2600, r: 0.75, top: 2.7, s: 1.05, speed: 2.3, aggro: 9, heavy: true, shield: true, spark: '#6a7aa0', blood: ['#1c2232', '#4a7aff', '#2a3248'], glow: [0.6, 1.2, 3.0], pats: ['spearB', 'shieldbash'], exp: 0.05, weak: 'fire' },
  keeper:  { name: '무덤지기', lv: 67, hp: 1700, r: 0.55, top: 2.8, s: 1.0, speed: 1.8, aggro: 10, keep: 5.5, summon: 'wraith', spark: '#7affd0', blood: ['#3a3a48', '#7affd0', '#4e4e60'], glow: [0.6, 2.8, 2.0], pats: ['wake', 'lantern'], exp: 0.045, weak: 'fire' },
  fgolem:  { name: '서리 골렘', lv: 68, hp: 5600, r: 1.0, top: 3.1, s: 1.05, speed: 1.4, aggro: 9, heavy: true, stag: 150, elite: true, spark: '#a8d0ec', blood: SNOW, glow: [1.6, 2.6, 3.0], pats: ['icering', 'breath'], exp: 0.09, weak: 'fire' },
  king:    { name: '서리의 왕 알데리크', lv: 70, hp: 38000, r: 1.5, top: 5.6, s: 1.0, speed: 1.1, aggro: 16, heavy: true, stag: 300, boss: true, summon: 'wraith', spark: '#e4f4ff', blood: ['#3a4a62', '#a8d0ec', '#e4f4ff'], glow: [1.6, 2.6, 3.0], pats: ['kingcleave', 'spears', 'nova'], exp: 0.55, weak: 'fire',
    phases: [{ at: 0.7, add: 'icicles', name: '왕릉의 천장이 얼어붙는다' }, { at: 0.4, add: 'glacier', name: '영원한 겨울' }] },
});
function snowBurst(x, z, n = 16, pow = 1) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = (1 + Math.random() * 4) * pow; soft.emit({ x, y: 0.3, z, vx: Math.cos(a) * s, vy: (2 + Math.random() * 3) * pow, vz: Math.sin(a) * s * 0.7, grav: 8, drag: 1, life: 1, c: lc(SNOW[i % 3]), size: PX * (1.2 + Math.random() * 1.4), upd: settle }); } }
function iceSpike(x, z, h, life) {
  const g = new THREE.PlaneGeometry(h * 0.62, h); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: TTEX.crystal, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.3, 1.4, 1.6), emissive: new THREE.Color(0.08, 0.16, 0.26) })); m.castShadow = true; addFx(m, life, f => { const k = f.t / life, up = Math.min(1, k * 10), dn = k > 0.7 ? (k - 0.7) / 0.3 : 0; m.position.set(x, -h + h * up - h * dn, z); }, true);
  snowBurst(x, z, 6, 0.6);
}
// 맞으면 냉기도 쌓는 판정
function hurtChill(m, ok, dmg, n = 1) { const A = hero(); if (!A.down && ok(A)) { hurtPlayer(A, dmg, m.x, m.z); chill(n); } }
Object.assign(PAT, {
  frostclaw: { range: 4, wind: 0.45, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 3.6; return 0.24; },
    run(m, u) { const k = Math.min(1, u / 0.22); m.x = m.ax + m.aim[0] * m.dl * k; m.z = m.az + m.aim[1] * m.dl * k; collide(m, 0.5); glow.emit({ x: m.x, y: 1.2, z: m.z, life: 0.3, c: FROST, size: PX });
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.1) { m.hitDone = true; hurtPlayer(A, 20, m.x, m.z); chill(1); } } } },
  frostclawB: { range: 5, wind: 0.35, cd: 1.8, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 4.6; return 0.26; }, run(m, u) { PAT.frostclaw.run(m, u); } },
  shards: { range: 10, min: 2.5, wind: 0.7, cd: 2.6, cut: true,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.22, 0, 0.22].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 9, 0.45)); },
    fire(m) { m.fan.forEach(([x, z]) => mShoot(m, x, z, { dmg: 14, speed: 9, size: 0.6, r: 0.45, col: FROST, onHit: () => chill(1) })); return 0.2; } },
  icefloor: { range: 9, wind: 1.0, cd: 4.4, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 2.2); },
    fire(m) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; iceSpike(m.px + Math.cos(a) * 1.4, m.pz + Math.sin(a) * 1.1, 1.4, 1.1); } shockwave(m.px, m.pz, 2.6, FROST, 0.35); hurtChill(m, inCircle(m.px, m.pz, 2.2), 24, 2); return 0.3; } },
  spear: { range: 3.8, wind: 0.75, cd: 2.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 3.8, 1.0); },
    fire(m) { const px = m.x + m.aim[0] * 2.8, pz = m.z + m.aim[1] * 2.8; shockwave(px, pz, 1.3, FROST, 0.3); snowBurst(px, pz, 8); hurtChill(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 3.8, 1.0), 26, 1); return 0.25; } },
  spearB: { range: 4.4, wind: 0.6, cd: 2.0, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4.4, 1.0); },
    fire(m) { const px = m.x + m.aim[0] * 3, pz = m.z + m.aim[1] * 3; shockwave(px, pz, 1.3, [0.6, 1.2, 3.0], 0.3); hurtChill(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 4.4, 1.0), 28, 2); return 0.25; } },
  shieldbash: { range: 2.4, wind: 0.6, cd: 2.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 2.6, 1.8); },
    fire(m) { m.x += m.aim[0] * 0.8; m.z += m.aim[1] * 0.8; shockwave(m.x + m.aim[0], m.z + m.aim[1], 1.8, [1.6, 1.8, 2.2], 0.3); shake = Math.max(shake, 0.25); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 2.4, 1.8), 24); return 0.25; } },
  wake: { range: 99, wind: 1.2, cd: 9, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 1.5); },
    fire(m) { const kind = m.def.summon; if (mons.filter(o => o.kind === kind && o.state !== 'dead').length < 3) [-1, 1].forEach(sd => { const [rx, rz] = camRight(); const x = m.x + rx * sd * 2.2, z = m.z + rz * sd * 2.2 + 0.8; snowBurst(x, z, 20); spawnMon(kind, x, z, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul * 0.45 : 1 }); }); shockwave(m.x, m.z, 3, [0.6, 2.6, 1.8], 0.4); return 0.3; } },
  lantern: { range: 10, min: 2.5, wind: 0.8, cd: 2.8, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 9, 0.7); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 20, speed: 5.5, size: 1.1, r: 0.65, col: [0.6, 2.8, 2.0] }); return 0.2; } },
  icering: { range: 3.2, wind: 1.0, cd: 3.4, cut: true, rec: 1.0,
    begin(m) { teleCircle(m, m.x, m.z, 3); },
    fire(m) { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; iceSpike(m.x + Math.cos(a) * 2.2, m.z + Math.sin(a) * 1.9, 1.8, 1.2); } impact(m.x, m.z, 3.4, FROST); shake = Math.max(shake, 0.45); hurtChill(m, inCircle(m.x, m.z, 3), 34, 2); return 0.3; } },
  breath: { range: 5, wind: 0.9, cd: 3.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], 5, 1.0); },
    fire(m) { for (let i = 0; i < 40; i++) { const a = Math.atan2(m.aim[1], m.aim[0]) + (Math.random() - 0.5) * 1, s = 4 + Math.random() * 6; soft.emit({ x: m.x + m.aim[0], y: 1.8, z: m.z + m.aim[1], vx: Math.cos(a) * s, vy: 0.5, vz: Math.sin(a) * s, drag: 1.2, life: 0.8, c: lc(SNOW[i % 3]), size: PX * 2, grow: 1.6, a: 0.85 }); } hurtChill(m, inCone(m.x, m.z, m.aim[0], m.aim[1], 5, 1.0), 26, 2); return 0.35; } },
  kingcleave: { range: 6, wind: 1.1, cd: 3.0, cut: true, rec: 0.8,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 8, 2.6); },
    fire(m) { const [rx, rz] = camRight(), f = (m.aim[0] * rx + m.aim[1] * rz) >= 0 ? 1 : -1; spawnSlash({ x: m.x, y: 2, z: m.z, size: 9, rot: 70, face: f, color: FROST, life: 0.3, grow: 0.2 }); for (let i = 0; i < 7; i++) later(i * 0.035, () => iceSpike(m.x + m.aim[0] * (1.2 + i), m.z + m.aim[1] * (1.2 + i), 2, 1.2)); shake = Math.max(shake, 0.5); hurtChill(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 8, 2.6), 44, 2); return 0.35; } },
  spears: { range: 12, wind: 1.0, cd: 3.4,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.5, 0, 0.5].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 11, 1.3)); },
    fire(m) { m.fan.forEach(([x, z]) => { for (let i = 0; i < 10; i++) later(i * 0.04, () => iceSpike(m.x + x * (1 + i * 1.05), m.z + z * (1 + i * 1.05), 1.6, 1.1)); }); shake = Math.max(shake, 0.3); hurtChill(m, A => m.fan.some(([x, z]) => inRect(m.x, m.z, x, z, 11, 1.3)(A)), 32, 1); return 0.5; } },
  nova: { range: 7, wind: 1.3, cd: 4.2, rec: 0.8,
    begin(m) { teleDonut(m, m.x, m.z, 2.6, 7); },
    fire(m) { shockwave(m.x, m.z, 7.4, [0.6, 0.9, 1.3], 0.5); later(0.1, () => shockwave(m.x, m.z, 6.2, [0.4, 0.6, 0.9], 0.45)); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; iceSpike(m.x + Math.cos(a) * 5, m.z + Math.sin(a) * 4.4, 1.6, 1.1); } shake = Math.max(shake, 0.45); const A = hero(), d = Math.hypot(A.x - m.x, A.z - m.z); if (!A.down && d > 2.4 && d < 7.3) { hurtPlayer(A, 38, m.x, m.z); chill(2); } return 0.4; } },
  icicles: { range: 14, wind: 1.2, cd: 4.4, rec: 0.6,
    begin(m, T) { m.drops = [[T.x, T.z], ...[0, 1, 2, 3, 4].map(() => [-8 + Math.random() * 16, -7 + Math.random() * 15])]; m.drops.forEach(([x, z]) => teleCircle(m, x, z, 1.7)); },
    fire(m) { m.drops.forEach(([x, z], i) => later(i * 0.05, () => { pillar(x, z, 0.4, 7, FROST, 0.4); iceSpike(x, z, 2.2, 1.4); shockwave(x, z, 2.2, FROST, 0.35); hurtChill(m, inCircle(x, z, 1.7), 34, 2); })); shake = Math.max(shake, 0.4); return 0.4; } },
  // 영원한 겨울: 십자 얼음 줄기 → 반 박자 뒤 대각선 줄기 (사이 칸으로 피한다)
  glacier: { range: 20, wind: 1.3, cd: 5.2, rec: 0.6,
    begin(m) { const r0 = Math.random() * 0.4; m.ga = [0, 1, 2, 3].map(i => r0 + i * Math.PI / 2); m.gb = m.ga.map(a => a + Math.PI / 4); m.ga.forEach(a => teleRect(m, m.x, m.z, Math.cos(a), Math.sin(a), 12, 1.6)); },
    fire(m) { m.gs = 0; return 1.0; },
    run(m, u) {
      const wave = (angs, n) => { angs.forEach(a => { const x = Math.cos(a), z = Math.sin(a); for (let i = 0; i < 11; i++) later(i * 0.03, () => iceSpike(m.x + x * (1 + i * 1.05), m.z + z * (1 + i * 1.05), 1.8, 1.0)); }); shake = Math.max(shake, 0.35); hurtChill(m, A => angs.some(a => inRect(m.x, m.z, Math.cos(a), Math.sin(a), 12, 1.6)(A)), 36, n); };
      if (m.gs === 0) { m.gs = 1; wave(m.ga, 1); m.gb.forEach(a => teleRect(m, m.x, m.z, Math.cos(a), Math.sin(a), 12, 1.6)); }
      if (m.gs === 1) { for (const t of m.teles) t.setK(Math.min(1, u / 0.6)); }
      if (m.gs === 1 && u >= 0.6) { m.gs = 2; clearTele(m); wave(m.gb, 2); }
    } },
});

// ---- 왕릉 방 ----
const TTEX = (() => {
  const wall = new Pix(48, 40, S);
  eachPx(wall, 0, 0, 48, 40, (px, py, X, Y) => { const row = Math.floor(Y / 5), bx = (X + (row % 2) * 4) % 8, by = Y % 5; let c = ['#1e2a3a', '#2a3a50', '#3a4e68', '#4e6684', '#6a84a4'][shadeAt(0.55 + (hash2(Math.floor((X + (row % 2) * 4) / 8), row) - 0.5) * 0.3 - Y / 140, 5, px, py)]; if (bx < 0.5 || by < 0.5) c = '#121a26'; if (Y < 6 && hash2(px >> 1, 3) > 0.4) c = '#e4f4ff'; wall.fset(px, py, c); });
  for (let x = 2; x < 48; x += 5) for (let k = 0; k < 2 + (x % 3); k++) wall.set(x, 6 + k, '#a8d0ec');
  eachPx(wall, 18, 12, 30, 34, (px, py, X, Y) => { const inside = Y > 18 ? Math.abs(X - 24) < 5 : Math.hypot((X - 24) / 5, (Y - 18) / 6) < 1; if (inside) wall.fset(px, py, '#0a0e16'); });
  const tomb = new Pix(30, 14, S); tomb.rect(1, 4, 28, 9, '#4e6684'); tomb.rect(1, 4, 28, 2, '#6a84a4'); tomb.rect(3, 2, 24, 3, '#3a4e68'); tomb.rect(12, 6, 6, 5, '#2a3a50'); for (let x = 2; x < 28; x += 3) tomb.set(x, 1, '#e4f4ff');
  const crystal = new Pix(16, 26, S); eachPx(crystal, 0, 0, 16, 26, (px, py, X, Y) => { for (const [cx, w, h] of [[8, 3.6, 24], [4, 2.2, 14], [12, 2.4, 16]]) { const t = (26 - Y) / h; if (t > 0 && t < 1 && Math.abs(X - cx) < w * (1 - t * 0.8)) crystal.fset(px, py, IP.ice[shadeAt(0.7 - (X - cx) / w * 0.3 + t * 0.2, 6, px, py)]); } });
  const statue = new Pix(18, 44, S); eachPx(statue, 0, 0, 18, 44, (px, py, X, Y) => { let ok = false; if (Y > 38) ok = Math.abs(X - 9) < 8; else if (Y > 14) ok = Math.abs(X - 9) < 4.5 + (Y - 14) * 0.08; else ok = Math.hypot(X - 9, Y - 10) < 4; if (Y < 7 && Y > 3 && Math.abs(X - 9) < 4) ok = true; if (ok) statue.fset(px, py, ['#2a3a50', '#3a4e68', '#4e6684', '#6a84a4', '#8aa4c4'][shadeAt(0.6 - (X - 9) / 9 * 0.4 + (vnoise(X, Y * 0.3) - 0.5) * 0.25, 5, px, py)]); }); for (let x = 3; x < 16; x += 2) statue.set(x, 14, '#e4f4ff');
  const brazier = new Pix(12, 18, S); brazier.rect(2, 4, 8, 4, '#3a4454'); brazier.rect(1, 3, 10, 1, '#566070'); brazier.rect(5, 8, 2, 9, '#2a3240'); brazier.rect(3, 16, 6, 2, '#1e2430');
  return { wall: tex(wall.canvas()), tomb: tex(tomb.outline(OUT).canvas()), crystal: tex(crystal.outline(OUT).canvas()), statue: tex(statue.outline(OUT).canvas()), brazier: tex(brazier.outline(OUT).canvas()) };
})();
const tombGroundTex = (() => {
  const W = GW * 8, H = GD * 8, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { const v = 52 + hash2(x, y) * 14 | 0; g.fillStyle = `rgb(${v - 20},${v - 4},${v + 18})`; g.fillRect(x + (y / 16 % 2) * 8, y, 15, 15); }
  for (let i = 0; i < 700; i++) { const x = hash2(i, 11) * W, y = hash2(i, 12) * H, v = 200 + hash2(i, 13) * 55 | 0; g.fillStyle = `rgba(${v},${v + 10},255,${0.15 + hash2(i, 14) * 0.25})`; g.fillRect(x, y, 2 + hash2(i, 15) * 6, 2 + hash2(i, 16) * 3); }
  const az = (1.5 - GZ0) * 8; g.fillStyle = 'rgba(30,50,90,.35)'; g.fillRect(0, az - 12, W, 24);
  return tex(c);
})();
const TMAT = Object.fromEntries(Object.entries(TTEX).map(([k, t]) => [k, k === 'wall' ? new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }) : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })]));
function buildTomb(seed, boss) {
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); }, add = m => { scene.add(m); DUN.objs.push(m); return m; };
  for (let x = -14; x <= 14; x += 4) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), TMAT.wall)); w.position.set(x, 1.7, -9.95); }
  for (const sd of [-1, 1]) for (let z = -8; z <= 10; z += 4) { if (Math.abs(z - 1.5) < 2.5) continue; const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), TMAT.wall)); w.position.set(sd * 11.9, 1.7, z); w.rotation.y = sd * -Math.PI / 2; }
  for (const sd of [-1, 1]) for (const z of [-7.5, -3.5, 5.5, 9]) { const m = dBB(TMAT.statue, 18, 44, sd * 9.3, z, { s: 1.1 }); const oc = { mesh: m, r: 1.0, h: 3.2 }; occluders.push(oc); DUN.occ.push(oc); obs(sd * 9.3, z, 0.55); }
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13; if (Math.hypot(x + 7, z - 1.5) < 3 || Math.abs(z - 1.5) < 1) continue; if (r() < 0.55) { dBB(TMAT.tomb, 30, 14, x, z, { s: 1.05 }); obs(x, z, 0.9); } else { dBB(TMAT.crystal, 16, 26, x, z, { s: 1.1 }); obs(x, z, 0.5); } }
  for (let i = 0; i < 8; i++) dBB(TMAT.crystal, 16, 26, (r() < 0.5 ? -1 : 1) * (6.5 + r() * 2.5), -8 + r() * 17, { s: 0.5 + r() * 0.4, cast: false });
  for (const [x, z] of [[-7.2, -8.4], [7.2, -8.4], [-7.2, 8.4], [7.2, 8.4]]) { dBB(TMAT.brazier, 12, 18, x, z); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.6, 1.4, 2.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.setScalar(1.2); sp.position.set(x, 1.45, z + 0.05); add(sp); }
  for (const [x, z] of [[-7, -8], [7, 8]]) { const l = new THREE.PointLight(0x7ab8ff, 5, 9, 1.6); l.position.set(x, 2, z); scene.add(l); DUN.lights.push(l); }
}
function updateRegion4(dt) {
  updateChill(dt);
  if (!(DUN.on && DUN.d && DUN.d.region === 4)) return;
  if (Math.random() < dt * 40) soft.emit({ x: -11 + Math.random() * 22, y: 5 + Math.random() * 1.5, z: -9 + Math.random() * 20, vx: 0.8 + Math.random() * 0.6, vy: -1.2 - Math.random() * 0.6, life: 4, c: lc(SNOW[(Math.random() * 2) | 0]), size: PX * (0.8 + Math.random() * 0.8), a: 0.85, ph: Math.random() * 6, upd: (p, d) => { p.vx += Math.sin(p.t * 2 + p.ph) * d; settle(p); } });
}
Object.assign(REGION.ground, { 4: tombGroundTex }); REGION.build[4] = buildTomb; REGION.under[4] = 0x1a2434; REGION.update.push(updateRegion4);
REGION.look[4] = { sun: [0xc8e0ff, 2.6], hemi: [0xa8c8ff, 0x1a2434, 1.6], fog: [0x6a7e9a, 22, 74], ground: [0.85, 0.88, 0.95] };
REGION.prefix[4] = { 일반: '서리 낀', 고급: '얼음 박힌', 희귀: '창백한 서리의', 영웅: '얼어붙은 왕릉의', 전설: '알데리크의', 유물: '영원한 겨울의', 태초: '태초 빙하의' };

// ---- 던전 ----
DUNGEONS.push(
  { id: 'snowgate', region: 4, tier: 0, ilv: 1500, name: '눈보라 묘역', lv: 66, seed: 601, hpMul: 2.6, dmgMul: 1.35, desc: '왕릉 바깥 묘역. 서리에 맞으면 냉기가 쌓이고, 네 번이면 얼어붙는다. 얼기 전에 물러나라.', boss: '푸른 불꽃 망령 무리',
    rooms: [{ mons: [['wraith', 3], ['caster', 1]] }, { mons: [['wraith', 2], ['caster', 2]] }, { mons: [['wraithB', 2], ['caster', 2]] }, { boss: true, mons: [['wraithB', 3], ['caster', 2]] }] },
  { id: 'crypt', region: 4, tier: 0, ilv: 1510, name: '수호병의 납골실', lv: 67, seed: 602, hpMul: 2.7, dmgMul: 1.4, desc: '왕릉 수호병이 지키는 회랑. 방패는 앞을 막는다. 무덤지기는 망령을 깨운다.', boss: '무덤지기 둘',
    rooms: [{ mons: [['guard', 1], ['wraith', 2]] }, { mons: [['keeper', 1], ['guard', 1]] }, { mons: [['guardB', 2], ['caster', 1]] }, { boss: true, mons: [['keeper', 2], ['guardB', 1]] }] },
  { id: 'glacierhall', region: 4, tier: 1, ilv: 1520, name: '빙하의 전당', lv: 68, seed: 603, hpMul: 2.8, dmgMul: 1.45, desc: '정예 던전. 방 여섯 개, 서리 골렘이 숨결로 얼린다.', boss: '서리 골렘 둘',
    rooms: [{ mons: [['wraith', 3], ['caster', 1]] }, { mons: [['guard', 2], ['keeper', 1]] }, { mons: [['fgolem', 1], ['caster', 2]] }, { mons: [['wraithB', 3], ['guardB', 1]] }, { mons: [['keeper', 1], ['caster', 2]] }, { boss: true, mons: [['fgolem', 2]] }] },
  { id: 'throneice', region: 4, tier: 2, ilv: 1540, name: '서리 왕좌', lv: 70, seed: 604, hpMul: 2.8, dmgMul: 1.5, desc: '지역 보스 던전. 서리의 왕 알데리크가 영원한 겨울을 부른다. 70% · 40%에서 패턴이 늘어난다.', boss: '서리의 왕 알데리크',
    rooms: [{ mons: [['guardB', 2], ['caster', 2]] }, { mons: [['fgolem', 1], ['wraithB', 2]] }, { boss: true, mons: [['king', 1]] }] },
);
REGIONS.push({ id: 4, name: '얼어붙은 왕릉', lv: '66~70', need: 'pit', needName: '여왕의 모래 구덩이' });
