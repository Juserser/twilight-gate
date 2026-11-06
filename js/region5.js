'use strict';
// 5지역: 잿불 요새 (기획서 3장) — 화산 요새, 불의 군단, 지역 보스 용암 거인, 약점 서리
// 지역 규칙: 용암 웅덩이 — 화염 공격이 지나간 자리에 몇 초간 용암이 남고, 밟고 있으면 화상 피해

const FP = {
  ember: ['#2a0a04', '#4a1408', '#7a2410', '#b8401a', '#f07a2a', '#ffc860'], basalt: ['#0e0a0a', '#1c1414', '#2c2020', '#3e2e2a', '#544036'],
  obsid: ['#06040a', '#120c16', '#1e1624', '#2c2236', '#40324e'], iron: ['#141010', '#2a2220', '#403430', '#5a4a44', '#7a6660'],
  robe: ['#2a0808', '#4a1010', '#6a1a14', '#8a2a1a'], gold: ['#5a3a10', '#8a6020', '#c09030', '#f0c860'],
};
const LAVA_C = [2.8, 1.3, 0.4];
function flameHair(G, x, y, n, w, h, p) { for (let i = 0; i < n; i++) { const fx = x - w / 2 + i * w / Math.max(1, n - 1), fh = h * (0.6 + 0.4 * Math.sin(i * 2.1 + p.i * 2)); for (let k = 0; k < fh; k++) G.set(fx + Math.sin(k * 0.8 + i) * 0.6, y - k, k < fh * 0.4 ? '#ffe080' : k < fh * 0.75 ? '#ff9a30' : '#d84a10'); } }
function drawImp(g, G, p, black) {
  const E = black ? FP.obsid : FP.ember.slice(0, 5), st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, sw = st === 'move' ? (p.i ? 2 : -2) : 0, low = st === 'wind' ? 2 : 0;
  limb(g, 13, 26, 11 - sw, 34, 2.4, 1.6, E); limb(g, 18, 26, 20 + sw, 34, 2.4, 1.6, E);
  limb(g, 9, 22 + low, 3, 14 + low + Math.sin(p.i * 3) * 2, 1.6, 0.8, E); G.set(3, 13 + low, '#ff9a30');
  blob(g, 15, 21 + low + bob, 5.5, 6, E, { rough: 0.35 });
  for (let k = 0; k < 3; k++) G.line(13 + k * 1.6, 18 + low + bob, 12 + k * 1.6, 23 + low + bob, black ? '#a040ff' : '#ff7a2a');
  const hx = 18 + (st === 'act' ? 3 : 0), hy = 11 + low * 1.4 + bob;
  blob(g, hx, hy, 4.4, 4, E, { lit: 0.1 }); limb(g, hx - 2, hy - 3, hx - 4, hy - 7, 1.6, 0.6, FP.basalt); limb(g, hx + 2, hy - 3, hx + 3, hy - 7, 1.6, 0.6, FP.basalt);
  G.set(hx, hy, black ? '#d070ff' : '#ffe080'); G.set(hx + 2, hy, black ? '#d070ff' : '#ffe080');
  if (st === 'act' || st === 'wind') G.rect(hx + 1, hy + 2, 3, 1, '#ff5a2a');
  const cl = st === 'act' ? [28, 18] : st === 'wind' ? [10, 6] : [22, 24 + bob];
  limb(g, 17, 18 + low, cl[0], cl[1], 1.8, 1.2, E); for (let k = -1; k <= 1; k++) g.line(cl[0], cl[1], cl[0] + 2, cl[1] + k + 1, '#2a1a10');
  flameHair(G, hx - 1, hy - 4, 4, 5, 4, p);
}
function drawFireMage(g, G, p) {
  const R = FP.robe, st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0;
  eachPx(g, 5, 18, 27, 46, (px, py, X, Y) => { const hw = 5 + (Y - 18) * 0.3; if (Math.abs(X - 16) < hw) g.fset(px, py, R[shadeAt(0.55 - (X - 16) / hw * 0.3 + (vnoise(X * 0.4, Y * 0.4) - 0.5) * 0.3, 4, px, py)]); });
  g.rect(15, 20, 2, 25, FP.gold[2]); for (let y = 24; y < 44; y += 5) g.rect(12, y, 8, 1, FP.gold[1]);
  blob(g, 16, 13 + bob, 5.4, 5.8, R, { lit: 0.1 }); g.rect(14, 12 + bob, 6, 4, '#0a0404');
  G.set(15, 13.5 + bob, '#ffc860'); G.set(18, 13.5 + bob, '#ffc860');
  // 불꽃을 든 손
  const hand = st === 'wind' ? [23, 6] : st === 'act' ? [28, 18] : [24, 24 + bob];
  limb(g, 20, 20 + bob, hand[0], hand[1], 2.6, 2, R);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + p.i; G.set(hand[0] + Math.cos(a) * 2, hand[1] - 2 + Math.sin(a) * 2, i % 2 ? '#ff9a30' : '#ffe080'); } G.rect(hand[0] - 0.5, hand[1] - 2.5, 1, 1, '#ffffff');
}
function drawLegion(g, G, p, obs) {
  const A = obs ? FP.obsid : FP.iron, st = p.st, sw = st === 'move' ? (p.i ? 1.5 : -1.5) : 0, push = st === 'act' ? 3 : st === 'wind' ? -1 : 0;
  limb(g, 17, 31, 15 - sw, 43, 3, 2.4, A); limb(g, 23, 31, 25 + sw, 43, 3, 2.4, A);
  const ax = st === 'wind' ? [8, 2] : st === 'act' ? [34, 28] : [9, 24];
  limb(g, 16, 20, ax[0] + 2, ax[1] + 5, 2.6, 2.2, A); g.line(ax[0] + 2, ax[1] + 5, ax[0], ax[1] - 1, '#3a2a20'); blob(g, ax[0] - 1, ax[1], 2.4, 3.4, A); G.line(ax[0] - 3, ax[1] - 2, ax[0] - 3, ax[1] + 3, '#ff7a2a');
  blob(g, 20, 23, 8, 8.5, A, { rough: 0.3, lit: 0.05 });
  for (let k = 0; k < 3; k++) g.line(14, 20 + k * 3, 26, 20 + k * 3, A[3]);
  blob(g, 21, 11, 4.6, 4.6, A, { lit: 0.12 }); limb(g, 17, 9, 15, 4, 1.6, 0.8, A); limb(g, 25, 9, 27, 4, 1.6, 0.8, A);
  g.rect(18.5, 11, 6, 1.5, '#020202'); G.rect(19, 11, 5, 1, obs ? '#c050ff' : '#ff8a30');
  const sx = 26 + push;
  eachPx(g, sx, 13, sx + 11, 41, (px, py, X, Y) => { const e = X < sx + 1 || X > sx + 10 || Y < 14 || Y > 40; g.fset(px, py, e ? FP.gold[1 + ((Y | 0) % 2)] : A[shadeAt(0.65 - (X - sx) / 11 * 0.4 + (vnoise(X, Y) - 0.5) * 0.2, 5, px, py)]); });
  for (let y = 18; y < 38; y += 1) if (Math.abs(Math.sin(y * 0.6)) > 0.7) G.set(sx + 5.5 + Math.sin(y * 0.9) * 2, y, obs ? '#c050ff' : '#ff6a20');
}
function drawForge(g, G, p) {
  const st = p.st, bob = st === 'idle' ? p.i * 0.6 : 0, sw = st === 'move' ? (p.i ? 1 : -1) : 0;
  limb(g, 15, 32, 13 - sw, 44, 3.2, 2.6, FP.iron); limb(g, 21, 32, 23 + sw, 44, 3.2, 2.6, FP.iron);
  blob(g, 18, 25 + bob, 9, 9.5, ['#2a1810', '#4a2c1c', '#6a422a', '#8a5a3a'], { rough: 0.35 });
  g.rect(11, 22 + bob, 14, 12, '#3a2a20'); g.rect(11, 22 + bob, 14, 1, '#5a4030');
  blob(g, 20, 13 + bob, 5, 4.6, FP.iron, { lit: 0.1 }); g.rect(17, 13 + bob, 7, 2, '#020202'); G.rect(18, 13 + bob, 2, 1, '#ffb040'); G.rect(21, 13 + bob, 2, 1, '#ffb040');
  const up = st === 'wind', hx = up ? 26 : st === 'act' ? 30 : 27, hy = up ? 3 : st === 'act' ? 30 : 22 + bob;
  limb(g, 24, 20 + bob, hx, hy + 4, 3, 2.4, ['#4a2c1c', '#6a422a', '#8a5a3a']); g.line(hx, hy + 4, hx, hy - 2, '#3a2a20'); g.rect(hx - 3, hy - 4, 6, 3, FP.iron[3]); g.rect(hx - 3, hy - 4, 6, 1, FP.iron[4]);
  if (up) for (let k = 0; k < 6; k++) G.set(hx - 3 + k, hy - 5 - (k % 2), '#ff9a30');
}
function drawHound(g, G, p) {
  const B = FP.basalt, st = p.st, low = st === 'wind' ? 2.5 : 0, str = st === 'act' ? 3 : 0, ph = st === 'move' ? p.i * Math.PI : st === 'act' ? 1.2 : 0, stride = st === 'move' ? 3 : st === 'act' ? 4.5 : 0.6;
  const legs = (hipX, off, pal) => { const s = Math.sin(ph + off) * stride; limb(g, hipX, 18 + low, hipX + s * 0.6, 24, 4, 3, pal); limb(g, hipX + s * 0.6, 24, hipX + s, 30, 3, 2.4, pal); };
  legs(13, 0, B.slice(0, 4)); legs(32 + str * 0.6, Math.PI, B.slice(0, 4));
  blob(g, 22 + str * 0.3, 15 + low, 14 + str * 0.6, 7, B, { rough: 0.4 }); blob(g, 31 + str, 15 + low, 7, 8, B, { rough: 0.35, lit: 0.08 });
  // 등의 균열과 불꽃 갈기
  for (let x = 12; x < 34; x += 2) { G.line(x, 12 + low + Math.sin(x) * 1.5, x + 1.5, 16 + low + Math.cos(x) * 1.5, '#ff6a20'); }
  flameHair(G, 24 + str * 0.5, 9 + low, 9, 18, 6, p);
  legs(15, Math.PI, B); legs(34 + str * 0.6, 0, B);
  const hx = 40 + str, hy = 12 + low * 1.4; blob(g, hx, hy, 6, 5, B, { lit: 0.1 }); blob(g, hx + 6, hy + 2, 4, 2.6, B);
  limb(g, hx - 3, hy - 3, hx - 6, hy - 8, 2.4, 0.8, B);
  if (st === 'act' || st === 'wind') { G.rect(hx + 3, hy + 3, 7, 2, '#ffc860'); } G.rect(hx + 1, hy - 1, 3, 2, '#ffe080');
  limb(g, 6, 14 + low, 0, 8 + low, 2.4, 1, B); flameHair(G, 1, 8 + low, 3, 3, 4, p);
}
function drawGiant(g, G, p) {
  const B = FP.basalt, st = p.st, bob = st === 'idle' ? p.i * 0.8 : 0, cx = 42;
  const crack = (x0, y0, x1, y1) => { g.line(x0, y0, x1, y1, '#080404'); G.line(x0, y0, x1, y1, st === 'wind' ? '#ffe080' : '#ff7a20'); };
  blob(g, cx - 10, 80, 7, 10, B); blob(g, cx + 10, 80, 7, 10, B); crack(cx - 12, 74, cx - 9, 86); crack(cx + 9, 74, cx + 12, 86);
  const arm = (sd, far) => { const sh = [cx + sd * 18, 36 + bob]; const fist = st === 'wind' ? [cx + sd * 14, 4] : st === 'act' ? [cx + sd * 24, 82] : [cx + sd * 26, 64 + bob];
    limb(g, sh[0], sh[1], (sh[0] + fist[0]) / 2 + sd * 3, (sh[1] + fist[1]) / 2, 9, 8, far ? B.slice(0, 4) : B); limb(g, (sh[0] + fist[0]) / 2 + sd * 3, (sh[1] + fist[1]) / 2, fist[0], fist[1], 8, 9, far ? B.slice(0, 4) : B);
    blob(g, fist[0], fist[1], 8, 7, far ? B.slice(0, 4) : B); crack(fist[0] - 4, fist[1] - 2, fist[0] + 3, fist[1] + 3); };
  arm(-1, true);
  blob(g, cx, 50 + bob, 21, 22, B, { rough: 0.4, n: 0.4 });
  // 가슴의 용암 심장과 균열
  blob(g, cx, 46 + bob, 6, 6, ['#7a2410', '#b8401a', '#f07a2a', '#ffc860'], { lit: 0.2 });
  for (let i = 0; i < 6; i++) G.set(cx - 2 + (i % 3) * 2, 44 + bob + ((i / 3) | 0) * 2, '#ffe080');
  [[cx - 6, 40, cx - 15, 32], [cx + 6, 42, cx + 16, 34], [cx - 5, 52, cx - 13, 66], [cx + 5, 52, cx + 12, 68], [cx, 52, cx + 1, 70]].forEach(([a, b, c2, d]) => crack(a, b + bob, c2, d + bob));
  // 머리: 작은 바위 머리에 불꽃 왕관
  blob(g, cx + 2, 22 + bob, 9, 8, B, { lit: 0.12 }); g.rect(cx - 3, 22 + bob, 11, 3, '#080404');
  G.rect(cx - 2, 22 + bob, 3, 2, '#ffe080'); G.rect(cx + 4, 22 + bob, 3, 2, '#ffe080');
  flameHair(G, cx + 2, 14 + bob, 9, 16, st === 'wind' ? 12 : 8, p);
  arm(1, false);
}
Object.assign(MON_ART, {
  imp: { w: 32, h: 36, draw: (g, G, p) => drawImp(g, G, p, false) }, impB: { w: 32, h: 36, draw: (g, G, p) => drawImp(g, G, p, true) },
  firemage: { w: 32, h: 47, draw: drawFireMage }, legion: { w: 40, h: 45, draw: (g, G, p) => drawLegion(g, G, p, false) }, legionB: { w: 40, h: 45, draw: (g, G, p) => drawLegion(g, G, p, true) },
  forge: { w: 36, h: 46, draw: drawForge }, hound: { w: 52, h: 32, draw: drawHound }, giant: { w: 84, h: 92, draw: drawGiant },
});
for (const k of ['imp', 'impB', 'firemage', 'legion', 'legionB', 'forge', 'hound', 'giant']) MON_FRAMES[k] = bakeMonster(k);

// ---- 용암 웅덩이 ----
const lavaPools = [];
const lavaTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let y = 0; y < 64; y += 2) for (let x = 0; x < 64; x += 2) { const d = Math.hypot(x - 32, y - 32) / 32; if (d > 1) continue; const v = vnoise(x * 0.12, y * 0.12); g.fillStyle = d > 0.85 ? '#5a1408' : v > 0.6 ? '#ffd060' : v > 0.4 ? '#ff7a20' : '#c83a10'; g.fillRect(x, y, 2, 2); } return new THREE.CanvasTexture(c); })();
lavaTex.magFilter = THREE.NearestFilter;
function lavaPool(x, z, r, life) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lavaTex, transparent: true, opacity: 0, depthWrite: false, color: new THREE.Color(1.6, 1.2, 1.0), fog: false }));
  m.position.set(x, 0.045 + Math.random() * 0.01, z); m.renderOrder = 1; scene.add(m); DUN.objs.push(m);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r * 1.05, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.4, 0.15), transparent: true, opacity: 0, depthWrite: false, fog: false }));
  ring.position.set(x, 0.06, z); ring.renderOrder = 2; scene.add(ring); DUN.objs.push(ring);
  lavaPools.push({ x, z, r, t: 0, life, mesh: m, ring, tick: 0.3 });
}
function updateLava(dt) {
  if (!DUN.on) { lavaPools.length = 0; return; }
  const A = hero();
  for (let i = lavaPools.length - 1; i >= 0; i--) {
    const p = lavaPools[i]; p.t += dt;
    const k = p.t < 0.3 ? p.t / 0.3 : p.t > p.life - 0.6 ? Math.max(0, (p.life - p.t) / 0.6) : 1;
    p.mesh.material.opacity = 0.9 * k; p.mesh.rotation.y += dt * 0.2; p.ring.material.opacity = k * (0.55 + 0.35 * Math.sin(p.t * 8));
    if (Math.random() < dt * 6 * p.r) glow.emit({ x: p.x + (Math.random() - 0.5) * p.r * 1.4, y: 0.1, z: p.z + (Math.random() - 0.5) * p.r * 1.4, vy: 1 + Math.random(), life: 0.6, c: LAVA_C, size: PX });
    if (p.t > 0.4 && k > 0.5 && !A.down && Math.hypot(A.x - p.x, A.z - p.z) < p.r) { if (A.inv <= 0) { hurtPlayer(A, 10, p.x, p.z); A.kx = A.kz = 0; A.inv = 0.6; } }
    if (p.t >= p.life) { scene.remove(p.mesh, p.ring); p.mesh.geometry.dispose(); p.mesh.material.dispose(); p.ring.geometry.dispose(); p.ring.material.dispose(); lavaPools.splice(i, 1); }
  }
}

// ---- 몬스터 ----
const ASHC = ['#3e2e2a', '#7a2410', '#f07a2a'];
Object.assign(MON, {
  imp:      { name: '불꽃 임프', lv: 71, hp: 1500, r: 0.5, top: 2.1, s: 1.0, speed: 4.4, aggro: 10, spark: '#ff9a30', blood: ASHC, glow: [2.8, 1.6, 0.6], pats: ['impbite'], exp: 0.03, weak: 'frost' },
  impB:     { name: '검은 불꽃 임프', lv: 72, hp: 1700, r: 0.5, top: 2.1, s: 1.05, speed: 5.0, aggro: 11, spark: '#c050ff', blood: ['#1e1624', '#c050ff', '#40324e'], glow: [2.2, 1.0, 2.8], pats: ['impbiteB'], exp: 0.035, weak: 'frost' },
  firemage: { name: '화염 사제', lv: 71, hp: 1300, r: 0.5, top: 2.9, s: 1.0, speed: 2.6, aggro: 11, keep: 6.5, spark: '#ffc860', blood: ['#4a1010', '#f07a2a', '#6a1a14'], glow: [2.8, 1.8, 0.6], pats: ['fireball', 'flamewall'], exp: 0.035, weak: 'frost' },
  legion:   { name: '군단 방패병', lv: 72, hp: 2700, r: 0.75, top: 2.7, s: 1.05, speed: 2.0, aggro: 8, heavy: true, shield: true, spark: '#c09080', blood: ['#403430', '#f07a2a', '#5a4a44'], glow: [2.8, 1.4, 0.5], pats: ['axe', 'shieldbash'], exp: 0.05, weak: 'frost' },
  legionB:  { name: '흑요석 방패병', lv: 73, hp: 3000, r: 0.75, top: 2.7, s: 1.05, speed: 2.3, aggro: 9, heavy: true, shield: true, spark: '#8a6aa0', blood: ['#1e1624', '#c050ff', '#2c2236'], glow: [2.2, 1.0, 2.8], pats: ['axe', 'shieldbash'], exp: 0.055, weak: 'frost' },
  forge:    { name: '군단 대장장이', lv: 72, hp: 2000, r: 0.6, top: 2.8, s: 1.05, speed: 1.8, aggro: 10, keep: 5, summon: 'imp', spark: '#ffb040', blood: ['#4a2c1c', '#f07a2a', '#5a4a44'], glow: [2.8, 1.6, 0.6], pats: ['forgeimps', 'hammer'], exp: 0.05, weak: 'frost' },
  hound:    { name: '용암 사냥개', lv: 73, hp: 6200, r: 1.0, top: 2.2, s: 1.15, speed: 2.6, aggro: 11, heavy: true, stag: 150, elite: true, spark: '#ff7a20', blood: ASHC, glow: [2.8, 1.4, 0.4], pats: ['lavacharge', 'firebreath'], exp: 0.1, weak: 'frost' },
  giant:    { name: '용암 거인 이그나로스', lv: 75, hp: 42000, r: 1.8, top: 5.8, s: 1.0, speed: 0.9, aggro: 16, heavy: true, stag: 300, boss: true, summon: 'imp', spark: '#ffc860', blood: ASHC, glow: [2.8, 1.5, 0.5], pats: ['gslam', 'magma', 'fistline'], exp: 0.6, weak: 'frost',
    phases: [{ at: 0.7, add: 'eruption', name: '요새가 분화한다' }, { at: 0.4, add: 'meltdown', name: '용암의 심장이 터진다' }] },
});
function emberBurst(x, z, n = 16, pow = 1) { embers(x, 0.4, z, n, LAVA_C, 5 * pow); for (let i = 0; i < n / 2; i++) soft.emit({ x, y: 0.4, z, vx: (Math.random() - 0.5) * 4 * pow, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3 * pow, drag: 1.5, life: 1.2, c: lc('#3a2a24'), size: PX * 2.4, grow: 1.6, a: 0.7 }); }
Object.assign(PAT, {
  impbite: { range: 4, wind: 0.4, cd: 2.0, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 4, 1.1); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 3.6; return 0.22; },
    run(m, u) { const k = Math.min(1, u / 0.2); m.x = m.ax + m.aim[0] * m.dl * k; m.z = m.az + m.aim[1] * m.dl * k; collide(m, 0.5); glow.emit({ x: m.x, y: 0.8, z: m.z, life: 0.3, c: LAVA_C, size: PX });
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.0) { m.hitDone = true; hurtPlayer(A, 20, m.x, m.z); } } } },
  impbiteB: { range: 5, wind: 0.32, cd: 1.7, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5, 1.1); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.dl = 4.6; return 0.24; }, run(m, u) { PAT.impbite.run(m, u); } },
  fireball: { range: 10, min: 2.5, wind: 0.8, cd: 2.8, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 1.6); },
    fire(m) { const sx = m.x, sz = m.z, tx = m.px, tz = m.pz; const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(...LAVA_C), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); b.scale.setScalar(1);
      addFx(b, 0.6, f => { const k = Math.min(1, f.t / 0.55); b.position.set(sx + (tx - sx) * k, 2 + Math.sin(k * Math.PI) * 2.5, sz + (tz - sz) * k); glow.emit({ x: b.position.x, y: b.position.y, z: b.position.z, life: 0.3, c: LAVA_C, size: PX * 1.2 });
        if (k >= 1 && !f.hit) { f.hit = true; emberBurst(tx, tz, 20); shockwave(tx, tz, 2, LAVA_C, 0.3); hurtIf(m, inCircle(tx, tz, 1.6), 24); lavaPool(tx, tz, 1.3, 4); } });
      return 0.3; } },
  flamewall: { range: 9, wind: 1.0, cd: 4.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 8, 1.2); },
    fire(m) { for (let i = 0; i < 6; i++) later(i * 0.05, () => { const d = 1.2 + i * 1.3, x = m.x + m.aim[0] * d, z = m.z + m.aim[1] * d; pillar(x, z, 0.4, 3, [1.6, 0.7, 0.2], 0.5); emberBurst(x, z, 8); }); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 8, 1.2), 26); later(0.3, () => { for (let i = 0; i < 3; i++) lavaPool(m.x + m.aim[0] * (2 + i * 2.4), m.z + m.aim[1] * (2 + i * 2.4), 0.9, 3.5); }); return 0.35; } },
  axe: { range: 2.6, wind: 0.9, cd: 2.8, cut: true, rec: 0.6,
    begin(m, T) { m.aim = dirTo(m, T); m.px = m.x + m.aim[0] * 1.4; m.pz = m.z + m.aim[1] * 1.4; teleCircle(m, m.px, m.pz, 1.7); },
    fire(m) { impact(m.px, m.pz, 2.2, LAVA_C); shake = Math.max(shake, 0.4); hurtIf(m, inCircle(m.px, m.pz, 1.7), 30); return 0.3; } },
  forgeimps: { range: 99, wind: 1.2, cd: 9, rec: 0.6,
    begin(m) { teleCircle(m, m.x, m.z, 1.5); },
    fire(m) { const kind = m.def.summon; if (mons.filter(o => o.kind === kind && o.state !== 'dead').length < 3) [-1, 1].forEach(sd => { const [rx, rz] = camRight(); const x = m.x + rx * sd * 2.2, z = m.z + rz * sd * 2.2 + 0.8; emberBurst(x, z, 24); spawnMon(kind, x, z, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul * 0.45 : 1 }); }); shockwave(m.x, m.z, 3, LAVA_C, 0.4); return 0.3; } },
  hammer: { range: 9, min: 2.5, wind: 0.9, cd: 3.0, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 1.8); },
    fire(m) { later(0.25, () => { impact(m.px, m.pz, 2.4, LAVA_C); hurtIf(m, inCircle(m.px, m.pz, 1.8), 26); lavaPool(m.px, m.pz, 1.2, 4); }); return 0.35; } },
  lavacharge: { range: 9, min: 2, wind: 0.8, cd: 3.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 8, 2); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; m.lp = 0; return 0.5; },
    run(m, u) { const k = Math.min(1, u / 0.45); m.x = m.ax + m.aim[0] * 7.5 * k; m.z = m.az + m.aim[1] * 7.5 * k; collide(m, 0.8);
      if (k * 4 > m.lp && m.lp < 4) { m.lp++; lavaPool(m.x, m.z, 0.9, 3.5); }
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.5) { m.hitDone = true; hurtPlayer(A, 34, m.x, m.z); } } } },
  firebreath: { range: 5, wind: 0.9, cd: 3.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], 5, 1.0); },
    fire(m) { for (let i = 0; i < 40; i++) { const a = Math.atan2(m.aim[1], m.aim[0]) + (Math.random() - 0.5) * 1, s = 4 + Math.random() * 6; glow.emit({ x: m.x + m.aim[0], y: 1.4, z: m.z + m.aim[1], vx: Math.cos(a) * s, vy: 0.5, vz: Math.sin(a) * s, drag: 1.4, life: 0.6, c: LAVA_C, size: PX * 1.6 }); } hurtIf(m, inCone(m.x, m.z, m.aim[0], m.aim[1], 5, 1.0), 30); lavaPool(m.x + m.aim[0] * 3, m.z + m.aim[1] * 3, 1.4, 3.5); return 0.35; } },
  gslam: { range: 4.5, wind: 1.1, cd: 3.2, cut: true, rec: 0.8,
    begin(m) { teleCircle(m, m.x, m.z, 4.2); },
    fire(m) { impact(m.x, m.z, 5, LAVA_C); shake = Math.max(shake, 0.6); hitstop = Math.max(hitstop, 0.05); hurtIf(m, inCircle(m.x, m.z, 4.2), 44); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; lavaPool(m.x + Math.cos(a) * 3, m.z + Math.sin(a) * 2.6, 1, 4); } return 0.35; } },
  magma: { range: 13, min: 3, wind: 1.0, cd: 3.4,
    begin(m, T) { m.drops = [[T.x, T.z], [T.x + (Math.random() - 0.5) * 6, T.z + (Math.random() - 0.5) * 5], [T.x + (Math.random() - 0.5) * 6, T.z + (Math.random() - 0.5) * 5]]; m.drops.forEach(([x, z]) => teleCircle(m, x, z, 1.8)); },
    fire(m) { m.drops.forEach(([tx, tz], i) => { const sx = m.x, sz = m.z; const b = new THREE.Mesh(bbGeo(20 * PX, 16 * PX), new THREE.MeshLambertMaterial({ map: boulderTex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(0.7, 0.2, 0.05) }));
      addFx(b, 0.75, f => { const k = Math.min(1, Math.max(0, f.t - i * 0.08) / 0.6); b.position.set(sx + (tx - sx) * k, 4 * Math.sin(k * Math.PI) + 3 * (1 - k), sz + (tz - sz) * k); b.rotation.z = -k * 6; if (Math.random() < 0.5) glow.emit({ x: b.position.x, y: b.position.y, z: b.position.z, life: 0.3, c: LAVA_C, size: PX * 1.2 });
        if (k >= 1 && !f.hit) { f.hit = true; impact(tx, tz, 2.4, LAVA_C); shake = Math.max(shake, 0.35); hurtIf(m, inCircle(tx, tz, 1.8), 34); lavaPool(tx, tz, 1.5, 5); } }, true); }); return 0.5; } },
  fistline: { range: 12, wind: 1.0, cd: 3.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 12, 2.2); },
    fire(m) { for (let i = 0; i < 9; i++) later(i * 0.04, () => { const d = 1.5 + i * 1.2, x = m.x + m.aim[0] * d, z = m.z + m.aim[1] * d; rockSpike(x, z, 1.6, 1.2); emberBurst(x, z, 8); if (i % 3 === 1) lavaPool(x, z, 1, 4); }); shake = Math.max(shake, 0.45); hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 12, 2.2), 40); return 0.45; } },
  eruption: { range: 20, wind: 1.3, cd: 4.6, rec: 0.6,
    begin(m, T) { m.drops = [[T.x, T.z], ...[0, 1, 2, 3, 4, 5].map(() => [-8 + Math.random() * 16, -7 + Math.random() * 15])]; m.drops.forEach(([x, z]) => teleCircle(m, x, z, 1.6)); },
    fire(m) { m.drops.forEach(([x, z], i) => later(i * 0.06, () => { pillar(x, z, 0.5, 8, [1.6, 0.6, 0.2], 0.4); emberBurst(x, z, 14); shockwave(x, z, 2, LAVA_C, 0.35); hurtIf(m, inCircle(x, z, 1.6), 34); lavaPool(x, z, 1.3, 6); })); shake = Math.max(shake, 0.45); return 0.5; } },
  // 용암의 심장: 바깥에서 안으로 고리가 차례로 터진다 (안 → 바깥 → 안 순서로 자리를 옮긴다)
  meltdown: { range: 20, wind: 1.2, cd: 5.6, rec: 0.6,
    begin(m) { teleDonut(m, m.x, m.z, 5, 9); },
    fire(m) { m.ms = 0; return 1.2; },
    run(m, u) {
      if (m.ms === 0) { m.ms = 1; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; emberBurst(m.x + Math.cos(a) * 7, m.z + Math.sin(a) * 6.2, 6); } shockwave(m.x, m.z, 9.4, LAVA_C, 0.5); shake = Math.max(shake, 0.4); const A = hero(), d = Math.hypot(A.x - m.x, A.z - m.z); if (!A.down && d > 4.7 && d < 9.3) hurtPlayer(A, 38, m.x, m.z); teleCircle(m, m.x, m.z, 4.4); }
      if (m.ms === 1) for (const t of m.teles) t.setK(Math.min(1, u / 0.7));
      if (m.ms === 1 && u >= 0.7) { m.ms = 2; clearTele(m); impact(m.x, m.z, 5, LAVA_C); shake = Math.max(shake, 0.55); hurtIf(m, inCircle(m.x, m.z, 4.4), 44); lavaPool(m.x, m.z, 3, 4); }
    } },
});

// ---- 요새 방 ----
const FTEX = (() => {
  const wall = new Pix(48, 40, S);
  eachPx(wall, 0, 0, 48, 40, (px, py, X, Y) => { const row = Math.floor(Y / 6), bx = (X + (row % 2) * 5) % 10, by = Y % 6; let c = FP.basalt[shadeAt(0.55 + (hash2(Math.floor((X + (row % 2) * 5) / 10), row) - 0.5) * 0.3 - Y / 160, 5, px, py)]; if (bx < 0.5 || by < 0.5) c = '#2a0804'; wall.fset(px, py, c); });
  for (let i = 0; i < 6; i++) { let x = 4 + i * 8, y = 4; for (let k = 0; k < 14; k++) { wall.set(x, y, k % 3 ? '#a8300c' : '#ff7a20'); x += Math.round(Math.sin(k + i) * 1.2); y += 2; } }
  eachPx(wall, 0, 34, 48, 40, (px, py, X, Y) => wall.fset(px, py, ['#ff9a30', '#ff6a20', '#c83a10'][((X + Y) | 0) % 3]));
  const pillar = new Pix(14, 62, S); eachPx(pillar, 0, 0, 14, 62, (px, py, X, Y) => { const hw = Y > 56 || Y < 6 ? 6.5 : 4.8; if (Math.abs(X - 7) < hw) pillar.fset(px, py, FP.basalt[shadeAt(0.62 - (X - 7) / hw * 0.35 + (vnoise(X, Y * 0.3) - 0.5) * 0.25, 5, px, py)]); }); for (let y = 8; y < 56; y += 3) pillar.set(7 + Math.sin(y) * 1.5, y, '#ff6a20');
  const anvil = new Pix(20, 12, S); anvil.rect(2, 2, 16, 3, '#4a3a36'); anvil.rect(2, 2, 16, 1, '#7a6660'); anvil.rect(0, 2, 3, 2, '#4a3a36'); anvil.rect(7, 5, 6, 3, '#2a2220'); anvil.rect(4, 8, 12, 3, '#1c1414'); anvil.rect(8, 1, 3, 1, '#ff9a30');
  const cage = new Pix(16, 28, S); for (let x = 2; x < 15; x += 3) cage.rect(x, 4, 1, 22, '#3a2a24'); cage.rect(1, 3, 15, 2, '#5a4a44'); cage.rect(1, 25, 15, 2, '#5a4a44'); cage.rect(7, 0, 2, 3, '#2a1e1a');
  const banner = new Pix(14, 34, S); banner.rect(0, 0, 14, 2, '#3a2a24'); eachPx(banner, 1, 2, 13, 34, (px, py, X, Y) => { if (Y < 30 || Math.abs(X - 7) > (Y - 30) * 1.5) banner.fset(px, py, (X > 5 && X < 9 && Y > 8 && Y < 20) ? '#f0a030' : '#6a1414'); });
  return { wall: tex(wall.canvas()), pillar: tex(pillar.outline(OUT).canvas()), anvil: tex(anvil.outline(OUT).canvas()), cage: tex(cage.outline(OUT).canvas()), banner: tex(banner.outline(OUT).canvas()) };
})();
const fortGroundTex = (() => {
  const W = GW * 8, H = GD * 8, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { const v = 30 + hash2(x, y) * 16 | 0; g.fillStyle = `rgb(${v + 8},${v - 2},${v - 6})`; g.fillRect(x + (y / 16 % 2) * 8, y, 15, 15); }
  for (let i = 0; i < 70; i++) { let x = hash2(i, 1) * W, y = hash2(i, 2) * H; g.strokeStyle = i % 3 ? 'rgba(200,60,10,.55)' : 'rgba(255,150,40,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash2(i, k + 3) - 0.5) * 28; y += (hash2(i, k + 9) - 0.5) * 28; g.lineTo(x, y); } g.stroke(); }
  return tex(c);
})();
const FMAT = Object.fromEntries(Object.entries(FTEX).map(([k, t]) => [k, k === 'wall' ? new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, emissive: new THREE.Color(0.08, 0.02, 0) }) : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })]));
function buildFortress(seed, boss) {
  lavaPools.length = 0;
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); }, add = m => { scene.add(m); DUN.objs.push(m); return m; };
  for (let x = -14; x <= 14; x += 4) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), FMAT.wall)); w.position.set(x, 1.7, -9.95); }
  for (const sd of [-1, 1]) for (let z = -8; z <= 10; z += 4) { if (Math.abs(z - 1.5) < 2.5) continue; const w = add(new THREE.Mesh(new THREE.PlaneGeometry(4.02, 3.4), FMAT.wall)); w.position.set(sd * 11.9, 1.7, z); w.rotation.y = sd * -Math.PI / 2; }
  for (const sd of [-1, 1]) for (const z of [-7.5, -3.5, 5.5, 9]) { const m = dBB(FMAT.pillar, 14, 62, sd * 9.3, z, { s: 1.1 }); const oc = { mesh: m, r: 1.0, h: 4.2 }; occluders.push(oc); DUN.occ.push(oc); obs(sd * 9.3, z, 0.55); }
  for (const x of [-6, -2, 2, 6]) dBB(FMAT.banner, 14, 34, x, -9.7, { s: 1.0, cast: false });
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13; if (Math.hypot(x + 7, z - 1.5) < 3 || Math.abs(z - 1.5) < 1) continue; if (r() < 0.5) { dBB(FMAT.anvil, 20, 12, x, z, { s: 1.1 }); obs(x, z, 0.7); } else { dBB(FMAT.cage, 16, 28, x, z, { s: 1.1 }); obs(x, z, 0.6); } }
  // 가장자리 용암 도랑 (장식, 피해 없음)
  for (const sd of [-1, 1]) for (let z = -8; z <= 10; z += 2.2) { if (Math.abs(z - 1.5) < 2.5) continue; const m = add(new THREE.Mesh(new THREE.CircleGeometry(1.1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lavaTex, transparent: true, opacity: 0.45, depthWrite: false, fog: false, color: new THREE.Color(0.55, 0.3, 0.2) }))); m.position.set(sd * 10.6, 0.04, z); m.scale.set(0.7, 1, 1.2); m.renderOrder = 1; }
  for (const [x, z] of [[-7, -8], [7, 8], [7, -8]]) { const l = new THREE.PointLight(0xff6a20, 6, 9, 1.6); l.position.set(x, 1.6, z); scene.add(l); DUN.lights.push(l); }
}
function updateRegion5(dt) {
  updateLava(dt);
  if (!(DUN.on && DUN.d && DUN.d.region === 5)) return;
  if (Math.random() < dt * 25) glow.emit({ x: -11 + Math.random() * 22, y: 0.2, z: -9 + Math.random() * 20, vy: 0.8 + Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.4, life: 2.5, c: LAVA_C, size: PX, fadeIn: 0.3 });
  if (Math.random() < dt * 6) soft.emit({ x: -11 + Math.random() * 22, y: 5, z: -9 + Math.random() * 20, vy: -0.4, vx: 0.2, life: 5, c: lc('#5a4a44'), size: PX * 1.2, a: 0.7 });
}
Object.assign(REGION.ground, { 5: fortGroundTex }); REGION.build[5] = buildFortress; REGION.under[5] = 0x140806; REGION.update.push(updateRegion5);
REGION.look[5] = { sun: [0xff8a50, 2.4], hemi: [0xff9a6a, 0x2a0a06, 1.4], fog: [0x3a1410, 20, 70], ground: [1.0, 0.95, 0.9] };
REGION.prefix[5] = { 일반: '그을린', 고급: '불에 단련된', 희귀: '잿불빛', 영웅: '잿불 요새의', 전설: '이그나로스의', 유물: '용암 심장의', 태초: '태초 화산의' };

// ---- 던전 ----
DUNGEONS.push(
  { id: 'ashgate', region: 5, tier: 0, ilv: 1560, name: '잿불 성문', lv: 71, seed: 701, hpMul: 2.6, dmgMul: 1.4, desc: '요새로 들어가는 성문. 화염 사제의 불덩이가 떨어진 자리에는 용암이 남는다. 밟지 마라.', boss: '검은 불꽃 임프 무리',
    rooms: [{ mons: [['imp', 3], ['firemage', 1]] }, { mons: [['imp', 2], ['firemage', 2]] }, { mons: [['impB', 2], ['firemage', 2]] }, { boss: true, mons: [['impB', 3], ['firemage', 2]] }] },
  { id: 'forgehall', region: 5, tier: 0, ilv: 1570, name: '군단의 대장간', lv: 72, seed: 702, hpMul: 2.7, dmgMul: 1.45, desc: '불의 군단이 무기를 벼리는 곳. 방패병은 앞을 막고, 대장장이는 임프를 벼려 낸다.', boss: '군단 대장장이 둘',
    rooms: [{ mons: [['legion', 1], ['imp', 2]] }, { mons: [['forge', 1], ['legion', 1]] }, { mons: [['legionB', 2], ['firemage', 1]] }, { boss: true, mons: [['forge', 2], ['legionB', 1]] }] },
  { id: 'kennel', region: 5, tier: 1, ilv: 1580, name: '용암 사냥터', lv: 73, seed: 703, hpMul: 2.8, dmgMul: 1.5, desc: '정예 던전. 방 여섯 개, 용암 사냥개가 지나간 길에 용암을 남긴다.', boss: '용암 사냥개 둘',
    rooms: [{ mons: [['imp', 3], ['firemage', 1]] }, { mons: [['legion', 2], ['forge', 1]] }, { mons: [['hound', 1], ['firemage', 2]] }, { mons: [['impB', 3], ['legionB', 1]] }, { mons: [['forge', 1], ['firemage', 2]] }, { boss: true, mons: [['hound', 2]] }] },
  { id: 'heart', region: 5, tier: 2, ilv: 1600, name: '용암의 심장', lv: 75, seed: 704, hpMul: 2.8, dmgMul: 1.55, desc: '지역 보스 던전. 용암 거인 이그나로스가 요새의 심장을 지킨다. 70% · 40%에서 패턴이 늘어난다.', boss: '용암 거인 이그나로스',
    rooms: [{ mons: [['legionB', 2], ['firemage', 2]] }, { mons: [['hound', 1], ['impB', 2]] }, { boss: true, mons: [['giant', 1]] }] },
);
REGIONS.push({ id: 5, name: '잿불 요새', lv: '71~75', need: 'throneice', needName: '서리 왕좌' });
