'use strict';
// 3지역: 붉은 협곡 (기획서 3장) — 사막 협곡, 도적 · 전갈 · 모래벌레, 지역 보스 모래벌레 여왕, 약점 서리
// 역할: 돌격(도적) · 원거리(석궁수) · 방어(전갈, 정면 껍질) · 소환(주술사) · 정예(모래벌레, 땅속 이동) + 변형 2종

const CP = {
  cloth: ['#2a1a0e', '#4a3018', '#6a4826', '#8a6436', '#b08a52'], red: ['#2a0a0a', '#4a1412', '#6a2018', '#8a3020', '#aa4430'],
  skin: ['#2a1810', '#4a2c1c', '#6a422a', '#8a5a3a'], carap: ['#1a0e06', '#2e1a0c', '#4a2c14', '#6a421e', '#8a5a2c'],
  black: ['#06060a', '#121218', '#1e1e28', '#2e2e3a', '#444456'], worm: ['#2a160c', '#4a2a16', '#6a4022', '#8a5832', '#aa7448'],
  maw: ['#3a0c12', '#6a1a22', '#9a3038', '#c85a60'], sand: ['#6a4020', '#8a5a2c', '#aa7a40', '#c89a5a', '#e0b878'],
};
function drawBandit(g, G, p, red, bow) {
  const C = red ? CP.red : CP.cloth, st = p.st, sw = st === 'move' ? (p.i ? 2 : -2) : st === 'act' ? 3 : 0, bob = st === 'idle' ? p.i * 0.5 : 0, low = st === 'wind' ? 1.5 : 0;
  limb(g, 15, 29, 13 - sw * 0.6, 41, 3, 2.2, CP.cloth.slice(0, 4)); limb(g, 20, 29, 22 + sw, 41, 3, 2.2, CP.cloth.slice(0, 4));
  g.rect(11, 40, 4, 2, '#1a120a'); g.rect(21 + sw, 40, 4, 2, '#1a120a');
  blob(g, 17, 23 + low + bob, 6, 8, C, { rough: 0.35 }); g.rect(11, 26 + low, 13, 2, '#3a2010');
  // 휘날리는 목도리
  for (let i = 0; i < 5; i++) blob(g, 12 - i * 1.6 - (st === 'act' ? 2 : 0), 16 + i * 0.6 + low, 2, 1.2, C.slice(1));
  const hy = 12 + low + bob; blob(g, 19, hy, 4.4, 4.2, CP.skin);
  blob(g, 18.5, hy - 2.5, 5, 3, C, { lit: 0.1 }); g.rect(15, hy + 1, 9, 3, C[2]);
  g.rect(19, hy - 0.5, 4, 1, '#0a0604'); G.set(20, hy - 0.5, red ? '#ff6a3a' : '#ffd070'); G.set(22, hy - 0.5, red ? '#ff6a3a' : '#ffd070');
  if (bow) {
    const ay = st === 'wind' ? hy + 1 : hy + 4; limb(g, 20, 18 + low, 27, ay, 2.4, 1.8, CP.skin);
    g.rect(24, ay - 1, 9, 2, '#5a3a20'); g.line(31, ay - 4, 31, ay + 4, '#3a2410'); g.line(31, ay - 4, 27, ay, '#c8c0a8'); g.line(31, ay + 4, 27, ay, '#c8c0a8'); g.rect(27, ay - 0.5, 6, 1, '#d8d0c0');
  } else {
    const blade = (sx, sy, ex, ey) => { limb(g, sx, sy, (sx + ex) / 2, (sy + ey) / 2 + 1, 2.2, 1.8, CP.skin); for (let k = 0; k < 7; k++) { const t = k / 6, bx = (sx + ex) / 2 + (ex - (sx + ex) / 2) * t * 1.6, by = (sy + ey) / 2 + 1 + (ey - (sy + ey) / 2 - 1) * t * 1.6 - Math.sin(t * Math.PI) * 1.5; g.set(bx, by, k < 1 ? '#5a3a20' : '#e0e4ec'); } };
    if (st === 'wind') { blade(14, 18 + low, 6, 6); blade(21, 18 + low, 28, 6); }
    else if (st === 'act') { blade(16, 18, 34, 18); blade(20, 20, 34, 26); }
    else { blade(14, 18 + bob, 9, 30); blade(21, 18 + bob, 29, 28); }
  }
}
function drawScorp(g, G, p, black) {
  const C = black ? CP.black : CP.carap, st = p.st, wl = st === 'move' ? (p.i ? 1 : -1) : 0;
  for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) { const x = 16 + k * 6; limb(g, x, 20, x - 3 + (k % 2 ? wl : -wl) * sd, 29, 1.6, 1.2, C.slice(0, 3)); }
  for (let k = 0; k < 4; k++) blob(g, 14 + k * 5, 19 - k * 0.3, 5 - k * 0.3, 3.6, C, { rough: 0.3, lit: 0.05 });
  // 집게
  const pinch = st === 'act' ? 4 : 0;
  limb(g, 33, 18, 40 + pinch, 15, 2.6, 2.2, C); blob(g, 42 + pinch, 14, 3, 2.4, C); g.line(43 + pinch, 12, 45 + pinch, 13, C[4]); g.line(43 + pinch, 16, 45 + pinch, 15, C[4]);
  // 꼬리: 등 위로 휘어 앞쪽을 겨눔 (준비: 더 높이, 공격: 앞으로)
  const tip = st === 'wind' ? [30, 0] : st === 'act' ? [42, 10] : [32, 4];
  const pts = [[12, 17], [7, 11], [9, 4], [18, 0], [26, 0], tip];
  for (let i = 0; i < pts.length - 1; i++) limb(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3.6 - i * 0.4, 3.2 - i * 0.4, C, { rough: 0.2 });
  G.set(tip[0], tip[1] + 2, black ? '#c060ff' : '#9aff5a'); G.set(tip[0] + 1, tip[1] + 3, black ? '#c060ff' : '#9aff5a');
  G.set(35, 17, '#ff5a2a'); G.set(36, 16.5, '#ff5a2a');
}
function drawShaman(g, G, p) {
  const st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0;
  eachPx(g, 6, 18, 28, 46, (px, py, X, Y) => { const hw = 5 + (Y - 18) * 0.28; if (Math.abs(X - 16) < hw) g.fset(px, py, CP.red[shadeAt(0.5 - (X - 16) / hw * 0.3 + (vnoise(X * 0.4, Y * 0.4) - 0.5) * 0.3, 5, px, py)]); });
  for (let k = 0; k < 7; k++) g.set(11 + k * 1.6, 21 + Math.sin(k) * 0.8, MPAL.bone[3]);
  blob(g, 16, 13 + bob, 5, 5, CP.skin);
  blob(g, 17, 13 + bob, 4, 4.4, MPAL.bone, { lit: 0.1 }); g.rect(16, 12 + bob, 1, 2, '#060404'); g.rect(19, 12 + bob, 1, 2, '#060404');
  for (let k = 0; k < 5; k++) g.line(13 + k * 1.5, 9 + bob, 11 + k * 2, 3 + (k % 2) * 2 + bob, ['#c84a2a', '#e0a040', '#3a8a8a'][k % 3]);
  const top = st === 'wind' ? 2 : 7 + bob;
  g.line(25, top, 25, 46, '#6a4a28'); g.line(26, top, 26, 46, '#4a3018'); blob(g, 25.5, top - 1, 2.6, 2.4, MPAL.bone);
  G.rect(24, top - 4, 3, 3, st === 'wind' ? '#ffe080' : '#ff9a3a');
  limb(g, 20, 21 + bob, 25, st === 'wind' ? 9 : 22, 2.4, 2, CP.red);
}
function drawWorm(g, G, p, queen) {
  const W = CP.worm, st = p.st, s = queen ? 1.7 : 1, cx = queen ? 40 : 22, base = queen ? 88 : 46, open = st === 'wind' || st === 'act';
  const lean = st === 'act' ? 6 : st === 'wind' ? -3 : Math.sin(p.i * 2) * 1.5;
  // 모래 둔덕
  blob(g, cx, base - 2 * s, 12 * s, 3.6 * s, CP.sand, { rough: 0.5, n: 0.6 });
  const N = 9;
  for (let i = 0; i < N; i++) { const t = i / (N - 1), x = cx + Math.sin(t * 2.2) * 3 * s + lean * t * t * s, y = base - 4 * s - t * 30 * s, r = (7 - t * 1.6) * s; blob(g, x, y, r, r * 0.8, W, { rough: 0.3, lit: 0.05 }); g.line(x - r * 0.9, y + r * 0.3, x + r * 0.9, y + r * 0.3, W[1]); }
  const hx = cx + Math.sin(2.2) * 3 * s + lean * s, hy = base - 4 * s - 30 * s;
  // 주둥이: 이빨 고리
  const mr = (open ? 5 : 3.2) * s;
  blob(g, hx + 2 * s, hy - 1 * s, mr + 1.4 * s, mr * 0.8 + 1.2 * s, W, { lit: 0.08 });
  blob(g, hx + 3 * s, hy - 1 * s, mr, mr * 0.7, CP.maw, { rough: 0.1 });
  for (let a = 0; a < TAU; a += TAU / (queen ? 16 : 10)) g.set(hx + 3 * s + Math.cos(a) * mr * 0.85, hy - 1 * s + Math.sin(a) * mr * 0.6, '#f0e8d0');
  if (queen) {
    // 왕관 같은 등가시 · 여러 개의 눈
    for (let i = 0; i < 6; i++) { const t = i / 5, x = cx + Math.sin(t * 2.2) * 3 * s + lean * t * t * s - 6 * s, y = base - 8 * s - t * 26 * s; limb(g, x, y, x - 5 * s, y - 4 * s, 2.4 * s, 0.8, CP.carap); }
    for (let i = 0; i < 4; i++) G.set(hx - 3 * s + i * 2, hy - 7 * s, '#ffb030');
    limb(g, hx - 4 * s, hy + 6 * s, hx + 8 * s, hy + 12 * s + (open ? 4 : 0), 3 * s, 1.2, CP.carap); limb(g, hx - 4 * s, hy + 8 * s, hx - 12 * s, hy + 14 * s, 3 * s, 1.2, CP.carap);
  } else { G.set(hx - 2, hy - 5, '#ffb030'); G.set(hx, hy - 5.5, '#ffb030'); }
}
Object.assign(MON_ART, {
  bandit: { w: 36, h: 43, draw: (g, G, p) => drawBandit(g, G, p, false, false) }, banditR: { w: 36, h: 43, draw: (g, G, p) => drawBandit(g, G, p, true, false) },
  xbow: { w: 36, h: 43, draw: (g, G, p) => drawBandit(g, G, p, false, true) },
  scorp: { w: 48, h: 31, draw: (g, G, p) => drawScorp(g, G, p, false) }, scorpB: { w: 48, h: 31, draw: (g, G, p) => drawScorp(g, G, p, true) },
  shaman: { w: 32, h: 47, draw: drawShaman }, worm: { w: 44, h: 48, draw: (g, G, p) => drawWorm(g, G, p, false) }, queen: { w: 80, h: 90, draw: (g, G, p) => drawWorm(g, G, p, true) },
});
for (const k of ['bandit', 'banditR', 'xbow', 'scorp', 'scorpB', 'shaman', 'worm', 'queen']) MON_FRAMES[k] = bakeMonster(k);

// ---- 몬스터 ----
const SANDB = ['#c89a5a', '#aa7a40', '#e0b878'];
Object.assign(MON, {
  bandit:  { name: '사막 도적', lv: 61, hp: 1250, r: 0.55, top: 2.5, s: 1.0, speed: 4.0, aggro: 9, spark: '#e0c090', blood: ['#7a2a20', '#6a4826', '#aa4430'], glow: [2.8, 2.2, 0.8], pats: ['dashcut'], exp: 0.025, weak: 'frost' },
  banditR: { name: '붉은 두건 도적', lv: 62, hp: 1450, r: 0.55, top: 2.5, s: 1.05, speed: 4.6, aggro: 10, spark: '#e08060', blood: ['#7a2a20', '#8a3020', '#aa4430'], glow: [2.8, 0.8, 0.4], pats: ['dashcutR'], exp: 0.03, weak: 'frost' },
  xbow:    { name: '도적 석궁수', lv: 61, hp: 950, r: 0.55, top: 2.5, s: 1.0, speed: 3.0, aggro: 11, keep: 6.5, spark: '#e0c090', blood: ['#7a2a20', '#6a4826', '#aa4430'], glow: [2.8, 2.2, 0.8], pats: ['xbow'], exp: 0.025, weak: 'frost' },
  scorp:   { name: '바위껍질 전갈', lv: 62, hp: 2000, r: 0.9, top: 1.9, s: 1.1, speed: 2.2, aggro: 8, heavy: true, shield: true, spark: '#c08050', blood: ['#4a2c14', '#6a421e', '#9aff5a'], glow: [1.6, 2.8, 0.8], pats: ['sting', 'pinch'], exp: 0.04, weak: 'frost' },
  scorpB:  { name: '검은 독전갈', lv: 63, hp: 2200, r: 0.9, top: 1.9, s: 1.1, speed: 2.8, aggro: 9, heavy: true, shield: true, spark: '#8a8aa0', blood: ['#121218', '#2e2e3a', '#c060ff'], glow: [2.2, 1.0, 2.8], pats: ['stingB', 'pinch'], exp: 0.045, weak: 'frost' },
  shaman:  { name: '모래 주술사', lv: 62, hp: 1500, r: 0.55, top: 2.9, s: 1.0, speed: 1.8, aggro: 10, keep: 5.5, summon: 'bandit', spark: '#ff9a3a', blood: ['#6a2018', '#c84a2a', '#e0a040'], glow: [2.8, 1.6, 0.6], pats: ['conjure', 'hexbolt'], exp: 0.04, weak: 'frost' },
  worm:    { name: '모래벌레', lv: 63, hp: 5000, r: 1.0, top: 3.0, s: 1.1, speed: 1.6, aggro: 10, heavy: true, stag: 150, elite: true, spark: '#c89a5a', blood: ['#6a4022', '#8a5832', '#c85a60'], glow: [2.8, 1.8, 0.6], pats: ['burrow', 'spit'], exp: 0.08, weak: 'frost' },
  queen:   { name: '모래벌레 여왕 사르히드', lv: 65, hp: 34000, r: 1.6, top: 5.6, s: 1.0, speed: 1.0, aggro: 16, heavy: true, stag: 300, boss: true, summon: 'scorp', spark: '#e0b878', blood: ['#6a4022', '#9a3038', '#e0b878'], glow: [2.8, 1.8, 0.6], pats: ['burrow', 'spit', 'tail'], exp: 0.5, weak: 'frost',
    phases: [{ at: 0.7, add: 'quake', name: '협곡이 무너진다' }, { at: 0.4, add: 'storm', name: '모래 폭풍이 몰아친다' }] },
});
function sandBurst(x, z, n = 18, pow = 1) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = (1 + Math.random() * 4) * pow; soft.emit({ x, y: 0.2, z, vx: Math.cos(a) * s, vy: (2 + Math.random() * 4) * pow, vz: Math.sin(a) * s * 0.7, grav: 12, drag: 0.8, life: 0.9, c: lc(SANDB[i % 3]), size: PX * (1.4 + Math.random() * 1.6), upd: settle }); } dustRing(x, z, 10, 2.5 * pow, '#b08a52'); }
const ORANGE = [2.8, 1.6, 0.6];
Object.assign(PAT, {
  dashcut: { range: 4, wind: 0.45, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4, 1.4); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 3.6; return 0.24; },
    run(m, u) { const k = Math.min(1, u / 0.22); m.x = m.ax + m.aim[0] * m.dl * k; m.z = m.az + m.aim[1] * m.dl * k; collide(m, 0.5);
      if (Math.random() < 0.6) soft.emit({ x: m.x, y: 0.2, z: m.z, vy: 0.5, drag: 3, life: 0.4, c: lc('#b08a52'), size: PX * 2, grow: 1.5, a: 0.7 });
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.2) { m.hitDone = true; hurtPlayer(A, 22, m.x, m.z); [30, -30].forEach(r => spawnSlash({ x: A.x, y: 1.2, z: A.z, size: 2.2, rot: r, face: 1, color: [2.4, 2.2, 2.0], life: 0.12 })); } } } },
  dashcutR: { range: 5.2, wind: 0.35, cd: 1.8, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5.2, 1.4); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 4.8; return 0.26; },
    run(m, u) { PAT.dashcut.run(m, u); } },
  xbow: { range: 11, min: 2.5, wind: 0.7, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 11, 0.4); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 18, speed: 12, size: 0.5, r: 0.45, col: [2.6, 2.2, 1.4], y: 1.5 }); return 0.2; } },
  sting: { range: 3.6, wind: 0.75, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 3.6, 1.1); },
    fire(m) { const px = m.x + m.aim[0] * 2.6, pz = m.z + m.aim[1] * 2.6; shockwave(px, pz, 1.4, [1.6, 2.8, 0.8], 0.3); sandBurst(px, pz, 10); shake = Math.max(shake, 0.25); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 3.6, 1.1), 26); return 0.25; } },
  stingB: { range: 4, wind: 0.6, cd: 2.0, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4, 1.1); },
    fire(m) { const px = m.x + m.aim[0] * 2.8, pz = m.z + m.aim[1] * 2.8; shockwave(px, pz, 1.4, [2.2, 1.0, 2.8], 0.3); sandBurst(px, pz, 10); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 4, 1.1), 28); return 0.25; } },
  pinch: { range: 2.4, wind: 0.6, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); m.px = m.x + m.aim[0] * 1.3; m.pz = m.z + m.aim[1] * 1.3; teleCircle(m, m.px, m.pz, 1.5); },
    fire(m) { [45, -45].forEach(r => spawnSlash({ x: m.px, y: 0.9, z: m.pz, size: 2.4, rot: r, face: 1, color: [2.4, 1.8, 1.2], life: 0.14 })); shake = Math.max(shake, 0.2); hurtIf(m, inCircle(m.px, m.pz, 1.5), 22); return 0.2; } },
  conjure: { range: 99, wind: 1.2, cd: 9, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 1.5); },
    fire(m) { const kind = m.def.summon; if (mons.filter(o => o.kind === kind && o.state !== 'dead').length < 3) [-1, 1].forEach(sd => { const [rx, rz] = camRight(); const x = m.x + rx * sd * 2.2, z = m.z + rz * sd * 2.2 + 0.8; sandBurst(x, z, 24); spawnMon(kind, x, z, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul * 0.45 : 1 }); }); shockwave(m.x, m.z, 3, ORANGE, 0.4); return 0.3; } },
  hexbolt: { range: 10, min: 2.5, wind: 0.8, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 9, 0.7); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 20, speed: 6, size: 1.1, r: 0.65, col: ORANGE }); return 0.2; } },
  // 땅속으로 파고들어 발밑에서 솟구친다 (파고든 동안은 맞지 않는다)
  burrow: { range: 14, wind: 0.5, cd: 4.2, rec: 0.8,
    begin(m) { sandBurst(m.x, m.z, 14); },
    fire(m) { m.burrowed = true; m.hitDone = false; m.bt = null; m.lu = 0; return 1.6; },
    run(m, u) {
      const A = hero(), du = Math.max(0, u - m.lu); m.lu = u;
      m.sink = Math.min(1, u / 0.25) * (u < 1.3 ? 1 : Math.max(0, 1 - (u - 1.3) / 0.15));
      if (u < 0.85) { const dx = A.x - m.x, dz = A.z - m.z, d = Math.hypot(dx, dz) || 1, sp = m.def.boss ? 7 : 8; if (d > 0.3) { m.x += dx / d * Math.min(d, sp * du); m.z += dz / d * Math.min(d, sp * du); } if (Math.random() < 0.7) soft.emit({ x: m.x + (Math.random() - 0.5), y: 0.1, z: m.z, vy: 1, drag: 2, life: 0.5, c: lc('#b08a52'), size: PX * 2.5, grow: 1.5, a: 0.8 }); }
      else if (!m.bt) { m.bt = teleCircle(m, m.x, m.z, m.def.boss ? 3.2 : 2.2); m.bx = m.x; m.bz = m.z; shake = Math.max(shake, 0.15); }
      if (m.bt) m.bt.setK(Math.min(1, (u - 0.85) / 0.45));
      if (u >= 1.3 && !m.hitDone) { m.hitDone = true; m.burrowed = false; clearTele(m); const R = m.def.boss ? 3.2 : 2.2; sandBurst(m.bx, m.bz, 40, 1.4); impact(m.bx, m.bz, R + 0.6, [2.4, 1.6, 0.8]); shake = Math.max(shake, 0.5); hurtIf(m, inCircle(m.bx, m.bz, R), m.def.boss ? 40 : 32); }
    } },
  spit: { range: 5, wind: 0.8, cd: 3.0, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], m.def.boss ? 6.5 : 4.8, 1.2); },
    fire(m) { const R = m.def.boss ? 6.5 : 4.8; for (let i = 0; i < 40; i++) { const a = Math.atan2(m.aim[1], m.aim[0]) + (Math.random() - 0.5) * 1.2, s = 4 + Math.random() * 6; soft.emit({ x: m.x + m.aim[0], y: 1.6, z: m.z + m.aim[1], vx: Math.cos(a) * s, vy: 1, vz: Math.sin(a) * s, grav: 6, drag: 1.2, life: 0.8, c: lc(SANDB[i % 3]), size: PX * 2, grow: 1.6, a: 0.85 }); } shake = Math.max(shake, 0.3); hurtIf(m, inCone(m.x, m.z, m.aim[0], m.aim[1], R, 1.2), m.def.boss ? 36 : 28); return 0.35; } },
  tail: { range: 4, wind: 1.0, cd: 3.4, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 4); },
    fire(m) { [1, -1].forEach(fc => spawnSlash({ x: m.x, y: 0.8, z: m.z, size: 9, rot: 0, face: fc, color: [2.2, 1.6, 0.9], life: 0.3, grow: 0.2 })); sandBurst(m.x, m.z, 40, 1.2); shake = Math.max(shake, 0.45); hurtIf(m, inCircle(m.x, m.z, 4), 38); return 0.3; } },
  quake: { range: 14, wind: 1.2, cd: 4.4, rec: 0.6,
    begin(m, T) { m.drops = [[T.x, T.z], ...[0, 1, 2, 3, 4].map(() => [-8 + Math.random() * 16, -7 + Math.random() * 15])]; m.drops.forEach(([x, z]) => teleCircle(m, x, z, 1.8)); },
    fire(m) { m.drops.forEach(([x, z], i) => later(i * 0.06, () => { rockSpike(x, z, 2.4, 1.4); sandBurst(x, z, 18); shockwave(x, z, 2.4, [2.2, 1.4, 0.7], 0.35); hurtIf(m, inCircle(x, z, 1.8), 34); })); shake = Math.max(shake, 0.5); return 0.45; } },
  // 모래 폭풍: 협곡을 가로지르는 띠 넷, 사이사이로 피한다
  storm: { range: 20, wind: 1.4, cd: 5.2, rec: 0.6,
    begin(m) { const off = Math.random() < 0.5 ? 0 : 2.4; m.bands = [-7.2, -2.4, 2.4, 7.2].map(z => z + off - 1.2); m.bands.forEach(z => teleRect(m, -11, z, 1, 0, 22, 1.8)); },
    fire(m) { m.bands.forEach((z, i) => later(i * 0.05, () => { for (let x = -10; x <= 10; x += 2.5) sandBurst(x, z, 6, 0.8); })); shake = Math.max(shake, 0.4); hurtIf(m, A => m.bands.some(z => Math.abs(A.z - z) < 0.9 + 0.3), 34); return 0.4; } },
});

// ---- 협곡 방 ----
const CTEX = (() => {
  const wall = new Pix(48, 48, S);
  eachPx(wall, 0, 0, 48, 48, (px, py, X, Y) => { const band = Math.floor((Y + Math.sin(X * 0.3) * 1.5) / 5) % 4, v = [0.75, 0.55, 0.65, 0.42][band] + (vnoise(X * 0.4, Y * 0.2) - 0.5) * 0.3 - Y / 160; wall.fset(px, py, ['#4a2014', '#6a2e1a', '#8a4022', '#a85a30', '#c87a44'][shadeAt(v, 5, px, py)]); });
  const spire = new Pix(18, 56, S);
  eachPx(spire, 0, 0, 18, 56, (px, py, X, Y) => { const hw = 3 + Y * 0.11 + Math.sin(Y * 0.5) * 0.8 + (Y < 10 ? 2 - Y * 0.2 : 0); if (Math.abs(X - 9) < hw) spire.fset(px, py, ['#4a2014', '#6a2e1a', '#8a4022', '#a85a30', '#c87a44'][shadeAt(0.6 - (X - 9) / hw * 0.35 + (Math.floor(Y / 5) % 2 ? 0.08 : -0.05), 5, px, py)]); });
  const tent = new Pix(40, 26, S);
  eachPx(tent, 0, 0, 40, 26, (px, py, X, Y) => { const h = 22 - Math.abs(X - 20) * 0.9; if (Y > 24 - h && Y < 25) tent.fset(px, py, (Math.floor(X / 4) % 2 ? '#8a3a24' : '#c8a070')); }); tent.rect(18, 14, 4, 11, '#2a1408');
  const barrel = new Pix(12, 14, S); barrel.rect(1, 1, 10, 12, '#6a4424'); barrel.rect(1, 3, 10, 1, '#3a2a1a'); barrel.rect(1, 10, 10, 1, '#3a2a1a'); barrel.rect(2, 1, 1, 12, '#8a6038');
  const cactus = new Pix(16, 28, S); cactus.rect(6, 4, 4, 24, '#4a6a2a'); cactus.rect(7, 4, 1, 24, '#6a8a3a'); cactus.rect(2, 10, 3, 8, '#4a6a2a'); cactus.rect(2, 16, 5, 3, '#4a6a2a'); cactus.rect(11, 8, 3, 7, '#4a6a2a'); cactus.rect(9, 13, 5, 3, '#4a6a2a');
  return { wall: tex(wall.canvas()), spire: tex(spire.outline(OUT).canvas()), tent: tex(tent.outline(OUT).canvas()), barrel: tex(barrel.outline(OUT).canvas()), cactus: tex(cactus.outline(OUT).canvas()) };
})();
const canyonGroundTex = (() => {
  const W = GW * 8, H = GD * 8, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = vnoise(x * 0.03, y * 0.06), rip = Math.sin(x * 0.12 + y * 0.05 + v * 4) > 0.75; const k = 0.8 + v * 0.3 + (rip ? 0.12 : 0); g.fillStyle = `rgb(${Math.min(255, 168 * k) | 0},${Math.min(255, 108 * k) | 0},${Math.min(255, 62 * k) | 0})`; g.fillRect(x, y, 2, 2); }
  const az = (1.5 - GZ0) * 8; g.fillStyle = 'rgba(80,40,20,.35)'; g.fillRect(0, az - 14, W, 28);
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(70,30,15,.4)'; g.fillRect(hash2(i, 9) * W, hash2(i, 8) * H, 2 + hash2(i, 7) * 6, 2); }
  return tex(c);
})();
const CMAT = Object.fromEntries(Object.entries(CTEX).map(([k, t]) => [k, k === 'wall' ? new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }) : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })]));
CMAT.rock = DMAT.rock.map(m => { const c = m.clone(); c.color.setRGB(1.0, 0.72, 0.55); return c; });
function buildCanyon(seed, boss) {
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); }, add = m => { scene.add(m); DUN.objs.push(m); return m; };
  for (let x = -16; x <= 16; x += 4.5) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.55, 6), CMAT.wall)); w.position.set(x, 3, -9.95); }
  for (const sd of [-1, 1]) for (let z = -8; z <= 10; z += 4.5) { if (Math.abs(z - 1.5) < 2.6) continue; const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.55, 5), CMAT.wall)); w.position.set(sd * 11.9, 2.5, z); w.rotation.y = sd * -Math.PI / 2; }
  for (const sd of [-1, 1]) for (const z of [-7.5, -3.8, 5.6, 9.2]) { const s = 0.9 + r() * 0.4, m = dBB(CMAT.spire, 18, 56, sd * (9.2 + r() * 0.6), z, { s }); const oc = { mesh: m, r: 1.0, h: 3.6 * s }; occluders.push(oc); DUN.occ.push(oc); obs(m.position.x, z, 0.6); }
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13; if (Math.hypot(x + 7, z - 1.5) < 3 || Math.abs(z - 1.5) < 1) continue; const t = r(); if (t < 0.25) { dBB(CMAT.tent, 40, 26, x, z, { s: 1.05 }); obs(x, z, 1.2); } else if (t < 0.5) { dBB(CMAT.barrel, 12, 14, x, z); dBB(CMAT.barrel, 12, 14, x + 0.6, z + 0.3); obs(x + 0.3, z, 0.6); } else if (t < 0.7) { dBB(CMAT.cactus, 16, 28, x, z); obs(x, z, 0.4); } else { const k = (r() * 3) | 0; dBB(CMAT.rock[k], [26, 16, 20][k], [18, 12, 14][k], x, z); obs(x, z, [0.8, 0.45, 0.6][k]); } }
  for (let i = 0; i < 6; i++) dBB(DMAT.bones, 16, 8, -7 + r() * 15, -7 + r() * 15, { cast: false });
  for (const [x, z] of [[-7, -8], [7, 8]]) { const l = new THREE.PointLight(0xff9a50, 4, 9, 1.6); l.position.set(x, 2, z); scene.add(l); DUN.lights.push(l); }
}
function updateRegion3(dt) {
  if (!(DUN.on && DUN.d && DUN.d.region === 3)) return;
  // 바람에 날리는 모래
  if (Math.random() < dt * 30) soft.emit({ x: -12, y: 0.2 + Math.random() * 2.5, z: -9 + Math.random() * 20, vx: 6 + Math.random() * 4, vy: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5), life: 2.6, c: lc(SANDB[(Math.random() * 3) | 0]), size: PX * (0.8 + Math.random()), a: 0.7 });
}
Object.assign(REGION.ground, { 3: canyonGroundTex }); REGION.build[3] = buildCanyon; REGION.under[3] = 0x4a2a18; REGION.update.push(updateRegion3);
REGION.look[3] = { sun: [0xffb878, 3.0], hemi: [0xffc8a0, 0x5a2a18, 1.4], fog: [0x8a4a34, 26, 82], ground: [1.0, 0.95, 0.9] };
REGION.prefix[3] = { 일반: '모래 먼지', 고급: '햇볕에 바랜', 희귀: '붉은 사암의', 영웅: '붉은 협곡의', 전설: '사르히드의', 유물: '모래 폭풍의', 태초: '태초 사막의' };

// ---- 던전 ----
DUNGEONS.push(
  { id: 'redroad', region: 3, tier: 0, ilv: 1440, name: '붉은 모래 길', lv: 61, seed: 501, hpMul: 2.6, dmgMul: 1.3, desc: '도적이 지키는 협곡 입구. 석궁수의 화살은 빠르니 예고선을 보고 비켜라.', boss: '붉은 두건 도적단',
    rooms: [{ mons: [['bandit', 3], ['xbow', 1]] }, { mons: [['bandit', 2], ['xbow', 2]] }, { mons: [['banditR', 2], ['xbow', 2]] }, { boss: true, mons: [['banditR', 3], ['xbow', 2]] }] },
  { id: 'nest', region: 3, tier: 0, ilv: 1450, name: '전갈 둥지', lv: 62, seed: 502, hpMul: 2.7, dmgMul: 1.35, desc: '바위껍질 전갈이 몰려 사는 골짜기. 껍질은 앞을 막는다. 주술사는 도적을 불러낸다.', boss: '모래 주술사 둘',
    rooms: [{ mons: [['scorp', 1], ['bandit', 2]] }, { mons: [['shaman', 1], ['scorp', 1]] }, { mons: [['scorpB', 2], ['xbow', 1]] }, { boss: true, mons: [['shaman', 2], ['scorpB', 1]] }] },
  { id: 'kingpass', region: 3, tier: 1, ilv: 1460, name: '도적왕의 협곡', lv: 63, seed: 503, hpMul: 2.8, dmgMul: 1.4, desc: '정예 던전. 방 여섯 개, 땅속에서 모래벌레가 솟구친다.', boss: '모래벌레 둘',
    rooms: [{ mons: [['bandit', 3], ['xbow', 1]] }, { mons: [['scorp', 2], ['shaman', 1]] }, { mons: [['worm', 1], ['xbow', 2]] }, { mons: [['banditR', 3], ['scorpB', 1]] }, { mons: [['shaman', 1], ['xbow', 2]] }, { boss: true, mons: [['worm', 2]] }] },
  { id: 'pit', region: 3, tier: 2, ilv: 1480, name: '여왕의 모래 구덩이', lv: 64, seed: 504, hpMul: 2.8, dmgMul: 1.45, desc: '지역 보스 던전. 모래벌레 여왕 사르히드가 땅속을 헤엄친다. 70% · 40%에서 패턴이 늘어난다.', boss: '모래벌레 여왕 사르히드',
    rooms: [{ mons: [['scorpB', 2], ['xbow', 2]] }, { mons: [['worm', 1], ['banditR', 2]] }, { boss: true, mons: [['queen', 1]] }] },
);
REGIONS.push({ id: 3, name: '붉은 협곡', lv: '61~65', need: 'altar', needName: '타락한 제단' });
