'use strict';
// 2지역: 가라앉은 수도원 (기획서 3장) — 물에 잠긴 성당, 언데드 · 유령, 지역 보스 타락한 사제장, 약점 번개
// 역할 5종(돌격 · 원거리 · 방어 · 소환 · 정예) + 변형 2종, 보스는 70% · 40%에서 페이즈 전환

// ---- 그림 ----
const RP = {
  skin: ['#141c18', '#24322c', '#3a4c44', '#54685c', '#748a7c'], robe: ['#0e1016', '#1a1e28', '#28303e', '#384256', '#4a566c'],
  ghost: ['#162438', '#243a58', '#36557c', '#5478a4', '#86a8d0', '#c4dcf6'], ghostP: ['#2a3040', '#465064', '#68748a', '#949eb2', '#c4ccd8', '#f0f4fa'],
  rust: ['#1e140e', '#3a2618', '#5a3e28', '#7a5a3a'], iron: ['#14161c', '#262a34', '#3c4250', '#58607a'], bone: MPAL.bone,
  navy: ['#06080e', '#0e1422', '#182236', '#24324c'], stone: ['#1a1e28', '#2a303e', '#3e4656', '#566070', '#727e90'],
  vio: ['#0c0612', '#1a0e24', '#2a1638', '#3e2250'], gold: ['#5a3a10', '#8a6020', '#c09030', '#f0c860'],
};
function drawGhoul(g, G, p, red) {
  const S1 = RP.skin, R = RP.robe, st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, sw = st === 'move' ? (p.i ? 2.5 : -2.5) : st === 'act' ? 3 : 0, low = st === 'wind' ? 2 : 0;
  limb(g, 14, 30, 12 - sw * 0.6, 41, 2.6, 1.8, S1); limb(g, 19, 30, 22 + sw, 41, 2.6, 1.8, S1);
  blob(g, 16, 25 + low + bob, 5.2, 7, R, { rough: 0.4 }); blob(g, 19, 19 + low + bob, 4.6, 4, R, { rough: 0.35, lit: 0.08 });
  for (let x = 11; x < 24; x += 2) g.line(x, 30 + low, x + (x % 3) - 1, 34 + (x % 4), R[1 + (x % 2)]);
  const hx = 24 + (st === 'act' ? 3 : 0), hy = 15 + low * 1.5 + bob;
  for (let i = 0; i < 5; i++) g.line(hx - 4 + i * 1.5, hy - 3, hx - 5 + i * 1.6, hy + 4 + (i % 3), '#0a0c0a');
  blob(g, hx, hy, 4.2, 4, S1, { lit: 0.08 });
  const arm = st === 'wind' ? [8, 9] : st === 'act' ? [35, 21] : [29, 31 + bob];
  limb(g, 20, 19 + low, arm[0], arm[1], 2.6, 1.6, S1); for (let k = -1; k <= 1; k++) g.line(arm[0], arm[1], arm[0] + 2, arm[1] + k * 1.4 + 1.5, '#d8e0d0');
  if (st === 'act' || st === 'wind') { g.rect(hx + 1, hy + 2, 3, 2, '#040606'); }
  const eye = red ? '#ff3a3a' : '#5affe0'; G.set(hx + 1, hy - 1, eye); G.set(hx + 3, hy - 1, eye);
  [[12, 35], [16, 36], [21, 35]].forEach(([x, y]) => G.set(x, y + bob, '#5a8ab0'));
}
function drawChoir(g, G, p, pale) {
  const P = pale ? RP.ghostP : RP.ghost, st = p.st, bob = p.st === 'idle' || p.st === 'move' ? p.i * 0.8 : 0;
  for (let i = 0; i < 9; i++) blob(g, 15 + Math.sin(i * 0.9 + p.i) * 1.2, 33 + i * 1.2 + bob, 5 - i * 0.45, 1.6, P.slice(0, 4), { rough: 0.6 });
  blob(g, 15, 22 + bob, 7, 11, P, { rough: 0.3, lit: 0.1 });
  blob(g, 16, 9 + bob, 5.2, 5.2, P, { lit: 0.12 });
  blob(g, 17.5, 10 + bob, 3, 3.3, ['#020408', '#060a12'], { rough: 0.1 });
  const ey = 9 + bob, ec = pale ? '#ffffff' : '#a8e8ff'; G.set(16.5, ey, ec); G.set(18.5, ey, ec);
  if (st === 'wind' || st === 'act') { G.rect(16.5, ey + 2, 2, 2, ec); }
  // 촛불을 든 손
  const hx = st === 'act' ? 25 : 21, hy = st === 'wind' ? 15 : 22;
  limb(g, 18, 18 + bob, hx, hy + bob, 2.2, 1.6, P); g.rect(hx, hy - 3 + bob, 1, 3, '#e8e0d0'); G.set(hx, hy - 4 + bob, '#ffe080'); G.set(hx, hy - 5 + bob, '#fff4c0');
  for (let i = 0; i < 6; i++) G.set(9 + i * 2, 30 + (i % 2) + bob, P[4]);
}
function drawKnight(g, G, p) {
  const B = RP.bone, RU = RP.rust, I = RP.iron, st = p.st, sw = st === 'move' ? (p.i ? 1.5 : -1.5) : 0, push = st === 'act' ? 3 : st === 'wind' ? -1 : 0;
  limb(g, 17, 31, 15 - sw, 43, 2.6, 2.2, B); limb(g, 23, 31, 25 + sw, 43, 2.6, 2.2, B);
  g.rect(13, 41, 5, 2, I[1]); g.rect(23, 41, 5, 2, I[1]);
  // 철퇴 (뒤 팔)
  const mace = st === 'wind' ? [9, 2] : st === 'act' ? [30, 26] : [10, 26];
  limb(g, 16, 18, mace[0] + 2, mace[1] + 4, 2.4, 2, RU); limb(g, mace[0] + 2, mace[1] + 4, mace[0], mace[1], 1.4, 1.4, I); blob(g, mace[0], mace[1], 2.6, 2.6, I);
  blob(g, 20, 24, 8, 8, RU, { rough: 0.4 });
  for (let k = 0; k < 4; k++) g.line(15, 21 + k * 2, 25, 21 + k * 2, B[2]);
  blob(g, 21, 11, 4.4, 4.2, B, { lit: 0.08 }); g.rect(17, 7, 9, 3, I[2]); g.rect(17, 7, 9, 1, I[3]);
  g.rect(20, 11, 4, 2, '#060404'); G.set(21, 11.5, '#ffb848'); G.set(23, 11.5, '#ffb848');
  // 탑 방패 (정면) · 종 문양
  const sx = 26 + push;
  eachPx(g, sx, 13, sx + 10, 40, (px, py, X, Y) => { const e = X < sx + 1 || X > sx + 9 || Y < 14 || Y > 39; g.fset(px, py, e ? RP.gold[1 + ((Y | 0) % 2)] : I[shadeAt(0.65 - (X - sx) / 10 * 0.4 + (vnoise(X, Y) - 0.5) * 0.2, 4, px, py)]); });
  blob(g, sx + 5, 25, 2.4, 3, RP.gold); g.rect(sx + 4, 28, 3, 1, RP.gold[3]);
}
function drawWarden(g, G, p) {
  const N = RP.navy, st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, sw = st === 'move' ? (p.i ? 1 : -1) : 0;
  eachPx(g, 6, 16, 28, 46, (px, py, X, Y) => { const hw = 5 + (Y - 16) * 0.32 + Math.sin(Y * 0.8 + sw) * 0.6; if (Math.abs(X - 17) < hw) g.fset(px, py, N[shadeAt(0.55 - (X - 17) / hw * 0.3 + (vnoise(X * 0.4, Y * 0.4) - 0.5) * 0.3, 4, px, py)]); });
  for (let i = 0; i < 6; i++) g.line(10 + i * 3, 30 + (i % 3) * 3, 9 + i * 3 + (i % 2), 44, '#2a4a30');
  blob(g, 17, 12 + bob, 5.5, 5.5, N, { lit: 0.1 }); blob(g, 18.5, 13 + bob, 3, 3.2, RP.bone.slice(1, 4)); g.rect(17, 12 + bob, 1, 1, '#060606'); g.rect(20, 12 + bob, 1, 1, '#060606');
  G.set(17, 12 + bob, '#7affd0'); G.set(20, 12 + bob, '#7affd0');
  const top = st === 'wind' ? 1 : 6 + bob;
  g.line(26, top, 26, 45, '#4a3a28'); g.line(27, top, 27, 45, '#2a2018');
  limb(g, 20, 20 + bob, 26, st === 'wind' ? 10 : 22 + bob, 2.4, 2, N);
  g.rect(24, top - 4, 5, 5, '#2a2a30'); G.rect(25, top - 3, 3, 3, st === 'wind' ? '#c0ffe8' : '#5adcb0');
}
function drawGargoyle(g, G, p) {
  const St = RP.stone, st = p.st, up = st === 'wind' ? -6 : st === 'act' ? 4 : (p.i ? -1 : 1);
  // 날개
  for (const sd of [-1, 1]) { const wx = sd < 0 ? 8 : 40; limb(g, 24, 20, wx, 8 + up, 3, 1.4, St.slice(0, 4)); for (let k = 0; k < 4; k++) limb(g, wx - sd * k * 3, 8 + up + k * 1.5, 24 - sd * 2, 26, 1.2, 0.8, St.slice(0, 3)); }
  const low = st === 'act' ? 3 : 0;
  limb(g, 18, 34 + low, 15, 45, 4, 3, St); limb(g, 30, 34 + low, 33, 45, 4, 3, St);
  blob(g, 24, 28 + low, 10, 9, St, { rough: 0.45 });
  const claw = st === 'act' ? [40, 40] : [36, 34];
  limb(g, 30, 24 + low, claw[0], claw[1], 3.4, 2.4, St); for (let k = -1; k <= 1; k++) g.line(claw[0], claw[1], claw[0] + 2, claw[1] + 2 + k, '#c8ccd8');
  blob(g, 30, 16 + low, 5, 4.4, St, { lit: 0.1 });
  limb(g, 27, 13 + low, 25, 7 + low, 2, 0.8, St); limb(g, 31, 13 + low, 33, 7 + low, 2, 0.8, St);
  g.rect(31, 18 + low, 4, 2, '#060608'); G.set(29, 15 + low, '#ff6a3a'); G.set(32, 15 + low, '#ff6a3a');
  for (let k = 0; k < 4; k++) g.line(19 + k * 3, 24 + low, 20 + k * 3, 32 + low, St[1]);
}
function drawPriest(g, G, p) {
  const V = RP.vio, Au = RP.gold, st = p.st, bob = st === 'idle' ? p.i * 0.8 : 0;
  // 부서진 후광
  for (let a = 0; a < TAU; a += 0.04) { if (Math.sin(a * 3) > 0.75) continue; const x = 32 + Math.cos(a) * 13, y = 22 + Math.sin(a) * 13 + bob; G.set(x, y, st === 'wind' ? '#fff0a0' : '#d8a840'); }
  // 아래는 검은 물 촉수
  for (let i = 0; i < 7; i++) { const x0 = 22 + i * 3.4, sw = Math.sin(i + p.i) * 3; limb(g, x0, 60, x0 + (i - 3) * 2.4 + sw, 88, 4, 1, ['#04060a', '#0a1220', '#14223a']); }
  eachPx(g, 14, 30, 50, 66, (px, py, X, Y) => { const hw = 9 + (Y - 30) * 0.22; if (Math.abs(X - 32) < hw) g.fset(px, py, V[shadeAt(0.55 - (X - 32) / hw * 0.3 + (vnoise(X * 0.3, Y * 0.3) - 0.5) * 0.25, 4, px, py)]); });
  g.rect(31, 32, 2, 33, Au[2]); for (let y = 36; y < 64; y += 6) g.rect(28, y, 8, 1, Au[1]);
  // 머리 · 주교관
  blob(g, 32, 24 + bob, 5.5, 5.5, ['#0c0a10', '#18141e'], { rough: 0.1 });
  G.set(30, 24 + bob, '#ffffff'); G.set(34, 24 + bob, '#ffffff');
  eachPx(g, 25, 6, 39, 20, (px, py, X, Y) => { const hw = (Y - 6) * 0.5 + 1; if (Math.abs(X - 32) < hw) g.fset(px, py, Math.abs(X - 32) < 0.8 || Y > 18 ? Au[3] : Au[shadeAt(0.6 - (X - 32) / hw * 0.3, 3, px, py)]); });
  // 팔: 준비(높이) · 공격(앞으로)
  const hand = st === 'wind' ? [[18, 8], [46, 8]] : st === 'act' ? [[14, 40], [56, 36]] : [[17, 44], [47, 44 + bob]];
  limb(g, 24, 34, hand[0][0], hand[0][1], 4, 2.6, V); limb(g, 40, 34, hand[1][0], hand[1][1], 4, 2.6, V);
  // 향로와 사슬
  const [cx, cy] = hand[1]; g.line(cx, cy, cx + 3, cy + 9, '#8a8070'); blob(g, cx + 3, cy + 11, 2.6, 2.6, Au); G.set(cx + 3, cy + 11, '#7affd0'); G.set(cx + 2, cy + 13, '#5adcb0');
}
Object.assign(MON_ART, {
  ghoul: { w: 38, h: 43, draw: (g, G, p) => drawGhoul(g, G, p, false) }, ghoulR: { w: 38, h: 43, draw: (g, G, p) => drawGhoul(g, G, p, true) },
  choir: { w: 30, h: 46, draw: (g, G, p) => drawChoir(g, G, p, false) }, choirP: { w: 30, h: 46, draw: (g, G, p) => drawChoir(g, G, p, true) },
  knight: { w: 40, h: 45, draw: drawKnight }, warden: { w: 32, h: 47, draw: drawWarden }, gargoyle: { w: 50, h: 47, draw: drawGargoyle }, priest: { w: 64, h: 90, draw: drawPriest },
});
for (const k of ['ghoul', 'ghoulR', 'choir', 'choirP', 'knight', 'warden', 'gargoyle', 'priest']) MON_FRAMES[k] = bakeMonster(k);

// ---- 몬스터 ----
const WATER = ['#5a8ab0', '#8ab8d8', '#c8e4f4'];
Object.assign(MON, {
  ghoul:   { name: '익사한 망자', lv: 56, hp: 1100, r: 0.6, top: 2.5, s: 1.0, speed: 3.6, aggro: 9, spark: '#8aa898', blood: ['#3a4c44', '#54685c', '#5a8ab0'], glow: [0.6, 2.6, 2.2], pats: ['claw'], exp: 0.02, weak: 'bolt' },
  ghoulR:  { name: '붉은 눈 망자', lv: 57, hp: 1300, r: 0.6, top: 2.5, s: 1.05, speed: 4.4, aggro: 10, spark: '#c08080', blood: ['#3a4c44', '#7a3030', '#5a8ab0'], glow: [2.8, 0.5, 0.5], pats: ['clawR'], exp: 0.025, weak: 'bolt' },
  choir:   { name: '유령 성가대원', lv: 56, hp: 700, r: 0.5, top: 2.7, s: 1.0, speed: 2.6, aggro: 11, keep: 6, fly: 0.5, spark: '#a8d8ff', blood: WATER, glow: [1.4, 2.2, 2.8], pats: ['orb'], exp: 0.02, weak: 'bolt' },
  choirP:  { name: '창백한 성가대원', lv: 57, hp: 850, r: 0.5, top: 2.7, s: 1.05, speed: 2.6, aggro: 11, keep: 6.5, fly: 0.5, spark: '#e0e8f0', blood: ['#c4ccd8', '#949eb2', '#f0f4fa'], glow: [2.6, 2.6, 2.8], pats: ['orb3'], exp: 0.025, weak: 'bolt' },
  knight:  { name: '종지기 해골기사', lv: 57, hp: 1700, r: 0.75, top: 2.7, s: 1.05, speed: 1.9, aggro: 8, heavy: true, shield: true, spark: '#c0a070', blood: ['#a89e88', '#5a3e28', '#3c4250'], glow: [2.8, 1.8, 0.6], pats: ['bash', 'mace'], exp: 0.035, weak: 'bolt' },
  warden:  { name: '물의 인도자', lv: 58, hp: 1400, r: 0.6, top: 2.9, s: 1.0, speed: 1.6, aggro: 10, keep: 5, summon: 'ghoul', spark: '#7affd0', blood: ['#182236', '#2a4a30', '#5a8ab0'], glow: [0.6, 2.8, 2.0], pats: ['raise', 'bolt'], exp: 0.035, weak: 'bolt' },
  gargoyle:{ name: '성당 수호상', lv: 58, hp: 4400, r: 1.1, top: 2.9, s: 1.1, speed: 1.7, aggro: 9, heavy: true, stag: 150, elite: true, spark: '#a8b0c0', blood: ['#3e4656', '#566070', '#727e90'], glow: [2.8, 0.8, 0.4], pats: ['swoop', 'stomp'], exp: 0.07, weak: 'bolt' },
  priest:  { name: '타락한 사제장 베르무스', lv: 60, hp: 30000, r: 1.4, top: 5.6, s: 1.0, speed: 1.2, aggro: 15, heavy: true, stag: 300, boss: true, summon: 'ghoul', spark: '#d8c070', blood: ['#2a1638', '#0a1220', '#c09030'], glow: [2.6, 2.4, 1.6], pats: ['tide', 'bell'], exp: 0.45, weak: 'bolt',
    phases: [{ at: 0.7, add: 'orbs5', name: '검은 성수가 끓어오른다' }, { at: 0.4, add: 'deluge', name: '제단이 물에 잠긴다' }] },
});
function splash(x, z, n = 16) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 4; soft.emit({ x, y: 0.2, z, vx: Math.cos(a) * s, vy: 2 + Math.random() * 3, vz: Math.sin(a) * s * 0.7, grav: 14, drag: 0.6, life: 0.7, c: lc(WATER[i % 3]), size: PX * (1.2 + Math.random()), upd: settle }); } }
const BLUE = [1.0, 1.8, 2.6];
Object.assign(PAT, {
  claw: { range: 3.8, wind: 0.45, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 3.8, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; return 0.22; },
    run(m, u) { const k = Math.min(1, u / 0.22); m.x = m.ax + m.aim[0] * 3.4 * k; m.z = m.az + m.aim[1] * 3.4 * k; collide(m, 0.5); if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.1) { m.hitDone = true; hurtPlayer(A, 20, m.x, m.z); splash(A.x, A.z, 8); } } } },
  clawR: { range: 5, wind: 0.35, cd: 1.8, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5, 1.2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; return 0.24; },
    run(m, u) { PAT.claw.run(m, u); const k = Math.min(1, u / 0.24); m.x = m.ax + m.aim[0] * 4.6 * k; m.z = m.az + m.aim[1] * 4.6 * k; } },
  orb: { range: 10, min: 2, wind: 0.6, cd: 2.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 9, 0.5); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 16, speed: 7.5, col: BLUE }); return 0.2; } },
  orb3: { range: 10, min: 2, wind: 0.7, cd: 2.8, cut: true,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.35, 0, 0.35].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 9, 0.5)); },
    fire(m) { m.fan.forEach(([x, z]) => mShoot(m, x, z, { dmg: 15, speed: 7, col: [2.2, 2.2, 2.6] })); return 0.2; } },
  bash: { range: 2.8, wind: 0.8, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 3, 1.8); },
    fire(m) { const px = m.x + m.aim[0] * 1.5, pz = m.z + m.aim[1] * 1.5; m.x += m.aim[0] * 0.8; m.z += m.aim[1] * 0.8; shockwave(px, pz, 2, [2.2, 1.8, 1.0], 0.3); shake = Math.max(shake, 0.25); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 2.6, 1.8), 26); return 0.25; } },
  mace: { range: 2.4, wind: 1.0, cd: 3.0, cut: true, rec: 0.8,
    begin(m, T) { m.aim = dirTo(m, T); m.px = m.x + m.aim[0] * 1.3; m.pz = m.z + m.aim[1] * 1.3; teleCircle(m, m.px, m.pz, 1.7); },
    fire(m) { impact(m.px, m.pz, 2.2, [1.6, 1.6, 1.8]); shake = Math.max(shake, 0.4); hurtIf(m, inCircle(m.px, m.pz, 1.7), 30); return 0.3; } },
  raise: { range: 99, wind: 1.2, cd: 9, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 1.5); },
    fire(m) { if (mons.filter(o => o.kind === 'ghoul' && o.state !== 'dead').length < 3) [-1, 1].forEach(sd => { const [rx, rz] = camRight(); const x = m.x + rx * sd * 2.2, z = m.z + rz * sd * 2.2 + 0.8; splash(x, z, 20); spawnMon('ghoul', x, z, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul * 0.45 : 1 }); }); shockwave(m.x, m.z, 3, [0.6, 2.4, 1.8], 0.4); return 0.3; } },
  bolt: { range: 10, min: 2.5, wind: 0.8, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 9, 0.7); },
    fire(m) { mShoot(m, m.aim[0], m.aim[1], { dmg: 20, speed: 5.5, size: 1.2, r: 0.7, col: [0.6, 2.6, 1.9] }); return 0.2; } },
  swoop: { range: 8, min: 2.5, wind: 0.8, cd: 3.2, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; return 0.45; },
    run(m, u) { const k = Math.min(1, u / 0.4); m.x = m.ax + (m.px - m.ax) * k; m.z = m.az + (m.pz - m.az) * k; m.lift = Math.sin(k * Math.PI) * 3;
      if (k >= 1 && !m.hitDone) { m.hitDone = true; m.lift = 0; impact(m.px, m.pz, 2.6, [1.4, 1.6, 2.0]); shake = Math.max(shake, 0.45); hurtIf(m, inCircle(m.px, m.pz, 2), 32); } } },
  stomp: { range: 3, wind: 1.0, cd: 3.4, cut: true, rec: 1.0,
    begin(m) { teleCircle(m, m.x, m.z, 2.8); },
    fire(m) { impact(m.x, m.z, 3.6, [1.4, 1.6, 2.0]); shake = Math.max(shake, 0.5); hurtIf(m, inCircle(m.x, m.z, 2.8), 36); return 0.3; } },
  tide: { range: 11, wind: 1.1, cd: 3.2, cut: true, rec: 0.7,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 11, 2.4); },
    fire(m) { for (let i = 0; i < 10; i++) later(i * 0.04, () => { const px = m.x + m.aim[0] * (1 + i * 1.05), pz = m.z + m.aim[1] * (1 + i * 1.05); shockwave(px, pz, 1.8, BLUE, 0.35); splash(px, pz, 10); }); shake = Math.max(shake, 0.35); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 11, 2.4), 40); return 0.45; } },
  bell: { range: 7, wind: 1.3, cd: 4.2, rec: 0.8,
    begin(m) { teleDonut(m, m.x, m.z, 2.6, 7); },
    fire(m) { for (let i = 0; i < 3; i++) later(i * 0.12, () => shockwave(m.x, m.z, 7.4, [2.6, 2.2, 1.0], 0.5, 0.2 + i * 0.6)); shake = Math.max(shake, 0.45); flashW = Math.max(flashW, 0.15); flashCol = '255,240,200'; const A = hero(), d = Math.hypot(A.x - m.x, A.z - m.z); if (!A.down && d > 2.4 && d < 7.3) hurtPlayer(A, 38, m.x, m.z); return 0.4; } },
  orbs5: { range: 12, wind: 0.8, cd: 3.4,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.6, -0.3, 0, 0.3, 0.6].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 10, 0.5)); },
    fire(m) { m.fan.forEach(([x, z]) => mShoot(m, x, z, { dmg: 22, speed: 6.5, size: 1.1, col: [1.4, 0.8, 2.4] })); return 0.25; } },
  deluge: { range: 14, wind: 1.2, cd: 4.6, rec: 0.6,
    begin(m, T) { m.drops = [[T.x, T.z], ...[0, 1, 2, 3].map(() => [m.x + (Math.random() - 0.5) * 12, m.z + (Math.random() - 0.5) * 10])]; m.drops.forEach(([x, z]) => teleCircle(m, x, z, 1.7)); },
    fire(m) { m.drops.forEach(([x, z], i) => later(i * 0.05, () => { pillar(x, z, 0.5, 7, BLUE, 0.4); shockwave(x, z, 2.2, BLUE, 0.35); splash(x, z, 18); hurtIf(m, inCircle(x, z, 1.7), 34); })); shake = Math.max(shake, 0.4); return 0.4; } },
});

// ---- 수도원 방 ----
const MTEX = (() => {
  const wall = new Pix(48, 40, S);
  eachPx(wall, 0, 0, 48, 40, (px, py, X, Y) => { const row = Math.floor(Y / 4), bx = (X + (row % 2) * 3) % 6, by = Y % 4; let c = RP.stone[shadeAt(0.5 + (hash2(Math.floor((X + (row % 2) * 3) / 6), row) - 0.5) * 0.35 - Y / 120, 5, px, py)]; if (bx < 0.5 || by < 0.5) c = '#141820'; wall.fset(px, py, c); });
  // 고딕 아치 창 · 스테인드글라스
  eachPx(wall, 16, 6, 32, 34, (px, py, X, Y) => { const cx = 24, top = 14, hw = 6.5; const inside = Y > top ? Math.abs(X - cx) < hw : Math.hypot((X - cx) / hw, (Y - top) / 8) < 1; if (!inside) return; const edge = Y > top ? Math.abs(X - cx) > hw - 1 : Math.hypot((X - cx) / hw, (Y - top) / 8) > 0.86; wall.fset(px, py, edge ? '#3e4656' : (Math.floor(X / 3) + Math.floor(Y / 3)) % 3 === 0 ? '#2a5a9a' : (Math.floor(X / 2) + Math.floor(Y / 4)) % 4 === 0 ? '#8a3a6a' : '#3a7ab8'); });
  wall.rect(23, 6, 2, 28, '#2a303e'); wall.rect(16, 22, 16, 1, '#2a303e');
  const pil = new Pix(14, 62, S);
  eachPx(pil, 0, 0, 14, 62, (px, py, X, Y) => { const base = Y > 56, cap = Y < 6; const hw = base || cap ? 6.5 : 4.6; if (Math.abs(X - 7) < hw) pil.fset(px, py, RP.stone[shadeAt(0.62 - (X - 7) / hw * 0.35 + (vnoise(X, Y * 0.3) - 0.5) * 0.25 + (Math.floor(X) % 3 === 0 && !base && !cap ? -0.15 : 0), 5, px, py)]); });
  const broken = new Pix(14, 62, S); broken.d = pil.d.slice(); for (let y = 0; y < 20 * S; y++) for (let x = 0; x < 14 * S; x++) if (y < (10 + Math.sin(x * 0.7) * 5) * S) broken.d[y * 14 * S + x] = null;
  const candle = new Pix(12, 26, S); candle.rect(5, 6, 2, 19, '#2a2a30'); candle.rect(2, 24, 8, 2, '#1a1a20'); candle.rect(1, 7, 10, 1, '#3a3a44'); [1, 5, 9].forEach(x => candle.rect(x, 3, 2, 4, '#e8e0d0'));
  const pew = new Pix(26, 12, S); pew.rect(1, 2, 24, 3, '#4a3020'); pew.rect(1, 2, 24, 1, '#6a4a30'); pew.rect(2, 5, 2, 6, '#3a2418'); pew.rect(22, 5, 2, 6, '#3a2418'); pew.rect(14, 1, 3, 4, null);
  return { wall: tex(wall.canvas()), pil: tex(pil.outline(OUT).canvas()), broken: tex(broken.outline(OUT).canvas()), candle: tex(candle.outline(OUT).canvas()), pew: tex(pew.outline(OUT).canvas()) };
})();
const monGroundTex = (() => {
  const W = GW * 8, H = GD * 8, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let y = 0; y < H; y += 12) for (let x = 0; x < W; x += 12) { const v = 34 + hash2(x, y) * 22 | 0; g.fillStyle = `rgb(${v},${v + 4},${v + 12})`; g.fillRect(x + (y / 12 % 2) * 6, y, 11, 11); }
  // 가운데 낡은 붉은 통로
  const ax0 = (-11 - GX0) * 8, ax1 = (11 - GX0) * 8, az = (1.5 - GZ0) * 8;
  g.fillStyle = '#3a1418'; g.fillRect(ax0, az - 12, ax1 - ax0, 24); g.fillStyle = '#5a2024'; for (let x = ax0; x < ax1; x += 2) if (hash2(x, 7) > 0.35) g.fillRect(x, az - 10, 2, 20);
  g.fillStyle = 'rgba(20,40,60,.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(hash2(i, 1) * W, hash2(i, 2) * H, 10 + hash2(i, 3) * 30, 6 + hash2(i, 4) * 14, 0, 0, TAU); g.fill(); }
  return tex(c);
})();
const MMAT = {
  pil: new THREE.MeshLambertMaterial({ map: MTEX.pil, alphaTest: 0.5, side: THREE.DoubleSide }), broken: new THREE.MeshLambertMaterial({ map: MTEX.broken, alphaTest: 0.5, side: THREE.DoubleSide }),
  candle: new THREE.MeshLambertMaterial({ map: MTEX.candle, alphaTest: 0.5, side: THREE.DoubleSide }), pew: new THREE.MeshLambertMaterial({ map: MTEX.pew, alphaTest: 0.5, side: THREE.DoubleSide }),
  wall: new THREE.MeshLambertMaterial({ map: MTEX.wall, side: THREE.DoubleSide }),
};
const puddles = [];
function buildMonastery(seed, boss) {
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); }, add = m => { scene.add(m); DUN.objs.push(m); return m; };
  // 벽: 북쪽 · 동서 (판자 벽, 카메라를 따라 돌지 않는다)
  for (let x = -14; x <= 14; x += 4) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), MMAT.wall)); w.position.set(x, 1.7, -9.95); w.receiveShadow = true; }
  for (const sd of [-1, 1]) for (let z = -8; z <= 10; z += 4) { if (Math.abs(z - 1.5) < 2.5) continue; const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), MMAT.wall)); w.position.set(sd * 11.9, 1.7, z); w.rotation.y = sd * -Math.PI / 2; }
  // 기둥 (일부는 부서짐)
  for (const sd of [-1, 1]) for (const z of [-7.5, -3.5, 5.5, 9]) { const br = r() < 0.35, m = dBB(br ? MMAT.broken : MMAT.pil, 14, 62, sd * 9.3, z, { s: 1.15 }); const oc = { mesh: m, r: 1.0, h: 4.4 }; occluders.push(oc); DUN.occ.push(oc); obs(sd * 9.3, z, 0.55); }
  // 부서진 의자 · 잔해 · 촛대
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13; if (Math.hypot(x + 7, z - 1.5) < 3 || Math.abs(z - 1.5) < 1) continue; if (r() < 0.5) { dBB(MMAT.pew, 26, 12, x, z, { s: 1.1 }); obs(x, z, 0.7); } else { const k = (r() * 3) | 0; dBB(DMAT.rock[k], [26, 16, 20][k], [18, 12, 14][k], x, z); obs(x, z, [0.8, 0.45, 0.6][k]); } }
  for (const [x, z] of [[-7.2, -8.4], [7.2, -8.4], [-7.2, 8.4], [7.2, 8.4]]) { dBB(MMAT.candle, 12, 26, x, z, { s: 1.1 }); for (let k = 0; k < 3; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.6, 1.0, 0.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.setScalar(0.5); sp.position.set(x - 0.32 + k * 0.32, 1.95, z + 0.05); add(sp); } }
  for (const [x, z] of [[-7, -8], [7, 8]]) { const l = new THREE.PointLight(0xffb060, 5, 8, 1.6); l.position.set(x, 2, z); scene.add(l); DUN.lights.push(l); }
  // 물웅덩이 · 빛줄기
  puddles.length = 0;
  for (let i = 0; i < 5 + ((r() * 3) | 0); i++) { const m = add(new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.18, 0.26), transparent: true, opacity: 0.45, depthWrite: false }))); m.scale.set(1 + r() * 2.2, 1, 0.8 + r() * 1.4); m.position.set(-8 + r() * 16, 0.03, -7 + r() * 15); m.renderOrder = 1; puddles.push(m); }
  for (let i = 0; i < 3; i++) { const m = add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 10).translate(0, 5, 0), addMat(0.25, 0.35, 0.55, 0.05))); m.position.set(-6 + r() * 12, 0, -6 + r() * 10); m.rotation.set(0, r() * TAU, 0.35); }
}
function updateRegion2(dt) {
  if (!(DUN.on && DUN.d && DUN.d.region === 2)) return;
  for (let i = 0; i < puddles.length; i++) puddles[i].material.opacity = 0.38 + 0.06 * Math.sin(uTime.value * 2 + i);
  if (Math.random() < dt * 6 && puddles.length) { const p = puddles[(Math.random() * puddles.length) | 0]; glow.emit({ x: p.position.x + (Math.random() - 0.5) * p.scale.x, y: 0.05, z: p.position.z + (Math.random() - 0.5) * p.scale.z, vy: 0.2, life: 0.6, c: [1.2, 1.8, 2.4], size: PX }); }
  if (Math.random() < dt * 8) soft.emit({ x: -10 + Math.random() * 20, y: 3 + Math.random() * 2, z: -8 + Math.random() * 18, vy: -2.5, life: 1.4, c: lc('#8ab8d8'), size: PX * 0.9, a: 0.6 });
}

// ---- 던전 ----
DUNGEONS.forEach((d, i) => Object.assign(d, { region: 1, tier: i, ilv: 1320 + i * 20 }));
DUNGEONS.push(
  { id: 'cloister', region: 2, tier: 0, ilv: 1380, name: '잠긴 회랑', lv: 56, seed: 401, hpMul: 2.4, dmgMul: 1.2, desc: '물이 차오른 회랑. 익사한 망자와 유령 성가대가 떠돈다. 성가대원의 구슬은 대시로 피할 수 있다.', boss: '창백한 성가대원 무리',
    rooms: [{ mons: [['ghoul', 3], ['choir', 1]] }, { mons: [['ghoul', 2], ['choir', 2]] }, { mons: [['ghoulR', 2], ['choir', 2]] }, { boss: true, mons: [['choirP', 2], ['ghoulR', 2]] }] },
  { id: 'ossuary', region: 2, tier: 0, ilv: 1390, name: '종탑의 납골당', lv: 57, seed: 402, hpMul: 2.5, dmgMul: 1.25, desc: '종지기 해골기사가 지키는 납골당. 방패는 앞을 막지만 등 뒤가 약하다. 인도자는 망자를 일으킨다.', boss: '물의 인도자 둘',
    rooms: [{ mons: [['knight', 1], ['ghoul', 2]] }, { mons: [['warden', 1], ['knight', 1]] }, { mons: [['knight', 2], ['choir', 1]] }, { boss: true, mons: [['warden', 2], ['knight', 1]] }] },
  { id: 'abyss', region: 2, tier: 1, ilv: 1400, name: '성가대의 심연', lv: 58, seed: 403, hpMul: 2.6, dmgMul: 1.3, desc: '정예 던전. 방 여섯 개, 중간에 성당 수호상이 깨어난다.', boss: '성당 수호상 둘',
    rooms: [{ mons: [['ghoul', 3], ['choirP', 1]] }, { mons: [['knight', 2], ['warden', 1]] }, { mons: [['gargoyle', 1], ['choir', 2]] }, { mons: [['ghoulR', 3], ['knight', 1]] }, { mons: [['warden', 1], ['choirP', 2]] }, { boss: true, mons: [['gargoyle', 2]] }] },
  { id: 'altar', region: 2, tier: 2, ilv: 1420, name: '타락한 제단', lv: 60, seed: 404, hpMul: 2.6, dmgMul: 1.35, desc: '지역 보스 던전. 타락한 사제장이 성수를 검게 물들였다. 체력 70% · 40%에서 패턴이 늘어난다.', boss: '타락한 사제장 베르무스',
    rooms: [{ mons: [['knight', 2], ['choirP', 2]] }, { mons: [['gargoyle', 1], ['ghoulR', 2]] }, { boss: true, mons: [['priest', 1]] }] },
);
const REGIONS = [{ id: 1, name: '황혼 숲', lv: '50~55' }, { id: 2, name: '가라앉은 수도원', lv: '56~60', need: 'throne', needName: '시든 왕좌' }];
const regionOpen = rg => !rg.need || PROG.clears[rg.need] || location.search.includes('unlock');
let dunTab = 1;
REGION.look[2] = { sun: [0x9ab8ff, 2.2], hemi: [0x7a98d8, 0x18202a, 1.5], fog: [0x1c2638, 20, 66], ground: [0.9, 0.92, 1.0] };
const PREFIX2 = REGION.prefix[2] = { 일반: '젖은', 고급: '녹슨 성당의', 희귀: '심연빛', 영웅: '가라앉은 수도원의', 전설: '베르무스의', 유물: '검은 성수의', 태초: '태초 성당의' };
// 던전 선택 창: 지역 탭
renderDunWin = function () {
  const n = lampLeft();
  dunBd.innerHTML = `<div class="tabs2">${REGIONS.map(rg => `<div class="${rg.id === dunTab ? 'on' : ''}${regionOpen(rg) ? '' : ' lk'}" data-r="${rg.id}">${rg.name} <span>Lv.${rg.lv}</span></div>`).join('')}</div>
    <div class="lamp">등불 ${n} / ${LAMP_MAX} ${[...Array(LAMP_MAX)].map((_, i) => `<i class="${i < n ? '' : 'off'}"></i>`).join('')}</div>`;
  const rg = REGIONS.find(r => r.id === dunTab), open = regionOpen(rg);
  if (!open) mk('div', 'dn', `<div><b>🔒 ${rg.name}</b><p>${rg.needName}을(를) 한 번 클리어하면 열립니다.</p></div>`, dunBd);
  else DUNGEONS.forEach((d, i) => { if (d.region !== dunTab) return; mk('div', 'dn', `<div><b>${d.name}</b><span class="lv">Lv.${d.lv} · ${['일반', '정예', '지역 보스', '레이드'][d.tier]} · 방 ${d.rooms.length}개${PROG.clears[d.id] ? ' · <span style="color:#9aff7a">클리어</span>' : ''}</span><p>${d.desc}<br>우두머리: ${d.boss}</p></div><button class="go" data-i="${i}" ${n > 0 ? '' : 'disabled'}>입장</button>`, dunBd); });
  dunBd.querySelectorAll('.go').forEach(b => b.onclick = () => enterDungeon(+b.dataset.i));
  dunBd.querySelectorAll('.tabs2 div').forEach(t => t.onclick = () => { dunTab = +t.dataset.r; renderDunWin(); });
};
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wDun .tabs2{display:flex;gap:4px;margin-bottom:10px}#wDun .tabs2 div{padding:6px 14px;cursor:pointer;border:1px solid #3a3428;background:#14141a;font-size:12px;color:#a89a7c}#wDun .tabs2 div span{font-size:10px;opacity:.7}
#wDun .tabs2 div.on{color:#e8d8ff;border-color:#8a6ab8;background:linear-gradient(180deg,#2e2240,#14101c)}#wDun .tabs2 div.lk{opacity:.5}` }));

Object.assign(REGION.ground, { 2: monGroundTex }); REGION.build[2] = buildMonastery; REGION.under[2] = 0x161c26; REGION.update.push(updateRegion2);
