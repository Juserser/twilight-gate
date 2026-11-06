'use strict';
// 몬스터 공용 시스템: 종류 정의 · 상태(출현→대기→추적→준비→공격→회복, 무력화, 죽음) · 패턴 · 바닥 예고 표시
// 데미지는 hurtPlayer 기준(×28). 무력화 수치는 기획서 등급(하4 중10 상25 최상50).

const MON = {
  wolf:    { name: '그림자 늑대', lv: 51, hp: 900, r: 0.6, top: 1.7, s: 1.15, speed: 4.2, aggro: 8, keep: 3.2, spark: '#8a6ab0', blood: ['#2a1e3a', '#4e3a66', '#160f22'], glow: [2.6, 0.4, 0.7], pats: ['lunge'], exp: 0.02 },
  rotwood: { name: '썩은 나무 정령', lv: 52, hp: 1800, r: 0.75, top: 2.5, s: 1.0, speed: 1.5, aggro: 7, spark: '#c09060', blood: ['#3e2a1c', '#563c28', '#3e5c2e'], glow: [2.8, 1.8, 0.6], pats: ['roots', 'smack'], exp: 0.03 },
  crow:    { name: '뼈 까마귀', lv: 50, hp: 600, r: 0.55, top: 1.3, s: 1.0, speed: 3.4, aggro: 8, keep: 3.8, fly: 1.25, spark: '#e0d8c4', blood: ['#a89e88', '#221c28', '#d4ccb6'], glow: [2.8, 0.8, 0.4], pats: ['dive'], exp: 0.02 },
  golem:   { name: '이끼 골렘', lv: 53, hp: 3600, r: 1.0, top: 3.1, s: 1.05, speed: 1.25, aggro: 7, heavy: true, stag: 150, elite: true, spark: '#8a8aa0', blood: ['#42404e', '#5a5868', '#3e5c2e'], glow: [0.8, 2.8, 1.8], pats: ['slam', 'boulder'], exp: 0.06 },
  boss:    { name: '시든 숲의 군주 모르그라스', lv: 55, hp: 24000, r: 1.6, top: 4.8, s: 0.98, speed: 1.1, aggro: 14, heavy: true, stag: 300, boss: true, spark: '#d0a060', blood: ['#3e2a1c', '#b85a20', '#d88a30'], glow: [2.8, 2.0, 0.6], pats: ['sweep', 'ring', 'lines'], exp: 0.35 },
};
const mons = [];
let focusMon = null;

// ---- 바닥 예고 표시 ----
function teleMat(op, fill) { return new THREE.MeshBasicMaterial({ color: fill ? new THREE.Color(1.4, 0.1, 0.2) : new THREE.Color(2.0, 0.25, 0.3), transparent: true, opacity: op, depthWrite: false, fog: false, side: THREE.DoubleSide }); }
function teleAdd(m, obj, setK) { obj.renderOrder = 2; scene.add(obj); const t = { obj, setK }; m.teles.push(t); return t; }
function teleCircle(m, x, z, R) {
  const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 48).rotateX(-Math.PI / 2), teleMat(0.9)), fill = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), teleMat(0.32, true));
  ring.scale.setScalar(R); g.add(ring, fill); g.position.set(x, 0.035, z);
  return teleAdd(m, g, k => { fill.scale.setScalar(R * Math.max(0.01, k)); ring.material.opacity = 0.6 + 0.4 * Math.sin(k * 40); });
}
function teleDonut(m, x, z, R0, R1) {
  const g = new THREE.Group(), edge = new THREE.Mesh(new THREE.RingGeometry(R1 * 0.97, R1, 64).rotateX(-Math.PI / 2), teleMat(0.9)), fill = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 64).rotateX(-Math.PI / 2), teleMat(0.0, true));
  g.add(edge, fill); g.position.set(x, 0.036, z);
  return teleAdd(m, g, k => { fill.material.opacity = 0.32 * k; edge.material.opacity = 0.6 + 0.4 * Math.sin(k * 40); });
}
function teleRect(m, x, z, dx, dz, L, W) {
  const g = new THREE.Group(), base = new THREE.Mesh(new THREE.PlaneGeometry(1, W).translate(0.5, 0, 0).rotateX(-Math.PI / 2), teleMat(0.14, true)), fill = new THREE.Mesh(new THREE.PlaneGeometry(1, W).translate(0.5, 0, 0).rotateX(-Math.PI / 2), teleMat(0.35, true));
  const e1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.06).translate(0.5, 0, 0).rotateX(-Math.PI / 2), teleMat(0.9)), e2 = e1.clone(); e2.material = teleMat(0.9);
  base.scale.x = L; e1.scale.x = e2.scale.x = L; e1.position.z = W / 2; e2.position.z = -W / 2;
  g.add(base, fill, e1, e2); g.position.set(x, 0.035, z); g.rotation.y = Math.atan2(-dz, dx);
  return teleAdd(m, g, k => { fill.scale.x = Math.max(0.01, L * k); });
}
function teleCone(m, x, z, dx, dz, R, ang) {
  const g = new THREE.Group(), edge = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 32, 1, -ang / 2, ang).rotateX(-Math.PI / 2), teleMat(0.9)), fill = new THREE.Mesh(new THREE.CircleGeometry(1, 32, -ang / 2, ang).rotateX(-Math.PI / 2), teleMat(0.32, true));
  edge.scale.setScalar(R); g.add(edge, fill); g.position.set(x, 0.035, z); g.rotation.y = Math.atan2(-dz, dx);
  return teleAdd(m, g, k => { fill.scale.setScalar(R * Math.max(0.01, k)); });
}
function clearTele(m) { for (const t of m.teles) { scene.remove(t.obj); disposeObj(t.obj); } m.teles.length = 0; }

// ---- 맞히기 판정 (조작 중인 캐릭터만 맞는다) ----
const hero = () => party[active];
function hurtIf(m, ok, dmg) { const A = hero(); if (!A.down && ok(A)) hurtPlayer(A, dmg, m.x, m.z); }
const inCircle = (x, z, R) => A => Math.hypot(A.x - x, A.z - z) < R + 0.3;
const inRect = (x, z, dx, dz, L, W) => A => { const ox = A.x - x, oz = A.z - z, al = ox * dx + oz * dz; return al > -0.3 && al < L + 0.3 && Math.abs(-ox * dz + oz * dx) < W / 2 + 0.3; };
const inCone = (x, z, dx, dz, R, ang) => A => { const ox = A.x - x, oz = A.z - z, d = Math.hypot(ox, oz); return d < R + 0.3 && (d < 0.5 || (ox * dx + oz * dz) / d > Math.cos(ang / 2)); };
function rootSpike(x, z, h, life) {
  const g = new THREE.PlaneGeometry(h * 0.45, h); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: rootTex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(2.2, 1.9, 1.7), emissive: new THREE.Color(0.18, 0.08, 0.03) })); m.castShadow = true;
  addFx(m, life, f => { const k = f.t / life, up = Math.min(1, k * 10), dn = k > 0.7 ? (k - 0.7) / 0.3 : 0; m.position.set(x, -h + h * up - h * dn, z); }, true);
  dustRing(x, z, 5, 1.6, '#6a5040');
}
function rootLine(m, x, z, dx, dz, L, W, dmg, dur) {
  const st = { n: 0, hit: false }, N = Math.ceil(L / 0.7);
  addFx(new THREE.Group(), dur + 0.1, f => {
    while (st.n < N && f.t >= st.n / N * dur) {
      const d = 0.6 + st.n * 0.7, px = x + dx * d, pz = z + dz * d; st.n++;
      rootSpike(px + (Math.random() - 0.5) * 0.3, pz, 1.1 + Math.random() * 0.6, 1.3); if (st.n % 2) rootSpike(px - dz * 0.5, pz + dx * 0.5, 0.8, 1.2);
      if (!st.hit) { const A = hero(); if (!A.down && Math.hypot(A.x - px, A.z - pz) < W / 2 + 0.45) { st.hit = true; hurtPlayer(A, dmg, px, pz); } }
    }
  });
}

// ---- 패턴 ----
// begin: 조준하고 예고 표시 · fire: 실제 공격(act 동안 매 프레임 run) · cut: 끊기 가능
const PAT = {
  lunge: { range: 4.6, wind: 0.5, cd: 2.6, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 5.2, 1.3); },
    fire(m) { m.ax = m.x; m.az = m.z; m.hitDone = false; return 0.3; },
    run(m, u) {
      const k = Math.min(1, u / 0.3); m.x = m.ax + m.aim[0] * 5 * k; m.z = m.az + m.aim[1] * 5 * k; collide(m, m.def.r * 0.8);
      soft.emit({ x: m.x, y: 0.4 + Math.random() * 0.8, z: m.z, vx: -m.aim[0] * 2, vz: -m.aim[1] * 2, drag: 3, life: 0.4, c: lc('#160f22'), size: PX * 3, grow: 1.5, a: 0.7 });
      if (!m.hitDone) { const A = hero(); if (!A.down && Math.hypot(A.x - m.x, A.z - m.z) < 1.2) { m.hitDone = true; hurtPlayer(A, 18, m.x, m.z); } }
    } },
  roots: { range: 7, wind: 0.9, cd: 3.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 7, 1.4); },
    fire(m) { rootLine(m, m.x, m.z, m.aim[0], m.aim[1], 7, 1.4, 24, 0.45); shake = Math.max(shake, 0.15); return 0.5; } },
  smack: { range: 2.4, wind: 0.7, cd: 2.4, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); m.px = m.x + m.aim[0] * 1.2; m.pz = m.z + m.aim[1] * 1.2; teleCircle(m, m.px, m.pz, 1.8); },
    fire(m) { shockwave(m.px, m.pz, 2.2, [1.6, 1.1, 0.6], 0.3); dustRing(m.px, m.pz, 16, 3.5, '#6a5040'); debris(m.px, m.pz, 8, 0.5); shake = Math.max(shake, 0.25); hurtIf(m, inCircle(m.px, m.pz, 1.8), 20); return 0.2; } },
  dive: { range: 6.5, wind: 0.65, cd: 2.8, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 1.3); },
    fire(m) { m.ax = m.x; m.az = m.z; m.ay = m.y; m.hitDone = false; return 0.32; },
    run(m, u) {
      const k = Math.min(1, u / 0.28), e = k * k; m.x = m.ax + (m.px - m.ax) * e; m.z = m.az + (m.pz - m.az) * e; m.y = m.ay + (0.5 - m.ay) * e;
      glow.emit({ x: m.x, y: m.y + 0.6, z: m.z, life: 0.25, c: [1.6, 1.4, 1.2], size: PX });
      if (k >= 1 && !m.hitDone) { m.hitDone = true; dustRing(m.px, m.pz, 12, 3, '#9c8466'); for (let i = 0; i < 10; i++) soft.emit({ x: m.px, y: 0.4, z: m.pz, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, grav: 12, life: 0.7, c: lc('#d4ccb6'), size: PX * 1.4, upd: settle }); hurtIf(m, inCircle(m.px, m.pz, 1.3), 16); }
    } },
  slam: { range: 2.8, wind: 1.0, cd: 3.2, cut: true, rec: 1.0,
    begin(m) { teleCircle(m, m.x, m.z, 2.6); },
    fire(m) { impact(m.x, m.z, 3.4, [1.4, 1.6, 1.0]); shake = Math.max(shake, 0.5); hitstop = Math.max(hitstop, 0.05); hurtIf(m, inCircle(m.x, m.z, 2.6), 36); return 0.3; } },
  boulder: { range: 9, min: 3.5, wind: 1.0, cd: 3.6, cut: true,
    begin(m, T) { m.px = T.x; m.pz = T.z; teleCircle(m, m.px, m.pz, 1.6); },
    fire(m) {
      const sx = m.x, sz = m.z, tx = m.px, tz = m.pz;
      const b = new THREE.Mesh(bbGeo(20 * PX, 16 * PX), new THREE.MeshLambertMaterial({ map: boulderTex, alphaTest: 0.5, side: THREE.DoubleSide }));
      addFx(b, 0.6, f => { const k = Math.min(1, f.t / 0.55); b.position.set(sx + (tx - sx) * k, 3 * Math.sin(k * Math.PI) + 2.4 * (1 - k), sz + (tz - sz) * k); b.rotation.z = -k * 6;
        if (k >= 1 && !f.hit) { f.hit = true; impact(tx, tz, 2.2, [1.4, 1.6, 1.0]); shake = Math.max(shake, 0.35); hurtIf(m, inCircle(tx, tz, 1.6), 28); } }, true);
      return 0.4; } },
  sweep: { range: 5.5, wind: 1.1, cd: 3.0, cut: true, rec: 0.8,
    begin(m, T) { m.aim = dirTo(m, T); teleCone(m, m.x, m.z, m.aim[0], m.aim[1], 5.5, Math.PI * 2 / 3); },
    fire(m) {
      const [rx, rz] = camRight(), f = (m.aim[0] * rx + m.aim[1] * rz) >= 0 ? 1 : -1;
      spawnSlash({ x: m.x, y: 1.6, z: m.z, size: 9, rot: -10, face: f, color: [2.2, 1.2, 0.5], life: 0.3, grow: 0.2 });
      for (let i = 0; i < 30; i++) { const a = Math.atan2(m.aim[1], m.aim[0]) + (Math.random() - 0.5) * 2, d = 1 + Math.random() * 4.5; soft.emit({ x: m.x + Math.cos(a) * d, y: 0.5 + Math.random() * 2, z: m.z + Math.sin(a) * d, vx: Math.cos(a) * 3, vy: 1, vz: Math.sin(a) * 3, grav: 2, drag: 2, life: 1.2, c: lc(MPAL.leaf[1 + (i % 4)]), size: PX * 1.6, upd: settle }); }
      shake = Math.max(shake, 0.5); hurtIf(m, inCone(m.x, m.z, m.aim[0], m.aim[1], 5.5, Math.PI * 2 / 3), 44); return 0.3; } },
  ring: { range: 6.5, wind: 1.3, cd: 4.2, rec: 0.8,
    begin(m) { teleCircle(m, m.x, m.z, 3); teleDonut(m, m.x, m.z, 3, 6.5); },
    fire(m) { m.ringStep = 0; return 0.75; },
    run(m, u) {
      if (m.ringStep === 0) { m.ringStep = 1; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; rootSpike(m.x + Math.cos(a) * 2, m.z + Math.sin(a) * 1.8, 1.6, 1.2); } shockwave(m.x, m.z, 3.4, [1.8, 1.0, 0.4], 0.35); shake = Math.max(shake, 0.4); hurtIf(m, inCircle(m.x, m.z, 3), 40); }
      if (m.ringStep === 1 && u >= 0.4) { m.ringStep = 2; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, R = 3.6 + (i % 3) * 0.9; rootSpike(m.x + Math.cos(a) * R, m.z + Math.sin(a) * R * 0.9, 1.4, 1.2); } shockwave(m.x, m.z, 7, [1.8, 1.0, 0.4], 0.45); shake = Math.max(shake, 0.45); const A = hero(), d = Math.hypot(A.x - m.x, A.z - m.z); if (!A.down && d > 2.8 && d < 6.8) hurtPlayer(A, 36, m.x, m.z); }
    } },
  lines: { range: 12, wind: 1.0, cd: 3.4,
    begin(m, T) { const [dx, dz] = dirTo(m, T); m.fan = [-0.45, 0, 0.45].map(a => [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)]); m.fan.forEach(([x, z]) => teleRect(m, m.x, m.z, x, z, 10, 1.3)); },
    fire(m) { m.fan.forEach(([x, z]) => rootLine(m, m.x, m.z, x, z, 10, 1.3, 30, 0.55)); shake = Math.max(shake, 0.3); return 0.6; } },
  summon: { range: 99, wind: 1.0, cd: 3.0,
    begin(m) { teleCircle(m, m.x, m.z, 2.2); floaters.push({ x: m.x, y: m.def.top + 1, z: m.z, t: 0, text: '군주의 부름', crit: false, big: true, vx: 0, color: '#ffb050' }); },
    fire(m) {
      shockwave(m.x, m.z, 6, [2.0, 1.0, 0.4], 0.5); shake = Math.max(shake, 0.4);
      [-1, 1].forEach(sd => { const [rx, rz] = camRight(); spawnMon(m.def.summon || 'wolf', m.x + rx * sd * 3, m.z + rz * sd * 3 + 1, { aggro: true, hpMul: DUN.on ? DUN.d.hpMul : 1 }); });
      return 0.3; } },
};
const dirTo = (m, T) => { const dx = T.x - m.x, dz = T.z - m.z, d = Math.hypot(dx, dz) || 1; return [dx / d, dz / d]; };
const boulderTex = tex(makeRock(9, 20, 16).outline(OUT).canvas());

// ---- 생성 · 제거 ----
function spawnMon(kind, x, z, opt = {}) {
  const D = MON[kind], F = MON_FRAMES[kind], A = MON_ART[kind];
  const mat = new THREE.MeshLambertMaterial({ map: F.idle[0].r, alphaTest: 0.5, side: THREE.DoubleSide });
  const mesh = addBB(mat, A.w, A.h, x, z, { s: D.s });
  const glowMat = new THREE.MeshBasicMaterial({ map: F.idle[0].gr, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(...D.glow), fog: false });
  const gm = new THREE.Mesh(mesh.geometry, glowMat); gm.position.z = 0.03; mesh.add(gm);
  const sh = contactShadow(D.r * 1.5, D.r * 0.75);
  const HP = Math.round(D.hp * (opt.hpMul || 1));
  const m = { kind, def: D, F, mat, glowMat, mesh, sh, x, z, y: D.fly || 0, lift: 0, vlift: 0, hp: HP, max: HP, trail: HP, stagger: D.stag || 0,
    state: 'spawn', t: 0, dir: Math.PI, face: -1, cd: 1 + Math.random(), flash: 0, hurtT: 0, slowT: 0, rootT: 0, teles: [], hx: x, hz: z, wanderT: 0, strafe: Math.random() < 0.5 ? 1 : -1, aggro: !!opt.aggro, spawner: opt.spawner, summoned: { 0.6: false, 0.3: false }, pats: D.pats.slice(), phase: 0 };
  m.tg = { mon: m, get x() { return m.x; }, get z() { return m.z; }, r: D.r, top: D.top, spark: D.spark, alive: () => m.state !== 'dead' && m.state !== 'spawn' && !m.burrowed, y: () => m.y + m.lift, onHit: (dmg, nx, nz) => monHurt(m, dmg, nx, nz) };
  targets.push(m.tg); mons.push(m);
  smokeRise(x, z, D.r);
  return m;
}
function smokeRise(x, z, r) { for (let i = 0; i < 20 + r * 10; i++) { const a = Math.random() * TAU, d = Math.random() * r * 1.2; soft.emit({ x: x + Math.cos(a) * d, y: 0.1, z: z + Math.sin(a) * d, vy: 0.8 + Math.random() * 1.5, drag: 1.5, life: 1, c: lc(['#160f22', '#241a34', '#2a1c12'][i % 3]), size: PX * (2 + Math.random() * 2), grow: 2, a: 0.8 }); } }
function removeMon(m) {
  clearTele(m); scene.remove(m.mesh, m.sh); billboards.splice(billboards.indexOf(m.mesh), 1); m.mat.dispose(); m.glowMat.dispose();
  const ti = targets.indexOf(m.tg); if (ti >= 0) targets.splice(ti, 1);
  const mi = mons.indexOf(m); if (mi >= 0) mons.splice(mi, 1);
  if (focusMon === m) focusMon = null;
}

// ---- 맞음 · 무력화 · 끊기 · 죽음 ----
function monHurt(m, dmg, nx, nz) {
  const D = m.def; if (m.state === 'dead') return;
  m.hp -= dmg; m.flash = 0.09; m.hurtT = 0.25; m.aggro = true;
  if (!D.heavy && (m.state === 'chase' || m.state === 'recover' || m.state === 'idle')) { m.x += nx * 0.25; m.z += nz * 0.25; collide(m, D.r * 0.8); }
  for (let i = 0; i < 8; i++) soft.emit({ x: m.x + (Math.random() - 0.5) * D.r, y: m.y + m.lift + D.top * (0.3 + Math.random() * 0.4), z: m.z + 0.05, vx: nx * 3 + (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 3, vz: nz * 3, grav: 14, drag: 0.6, life: 0.7 + Math.random() * 0.4, c: lc(D.blood[(Math.random() * 3) | 0]), size: PX * (1.3 + Math.random() * 1.4), upd: settle });
  if (m.hp <= 0) monDie(m);
}
function monStagger(m, v) {
  const D = m.def; if (m.state === 'dead' || m.state === 'spawn' || m.state === 'stun') return;
  if (!D.stag) { if (v >= 25 && m.state === 'wind') monInterrupt(m, true); return; } // 일반 몬스터: 상 이상이면 준비 동작이 끊긴다
  m.stagger -= v;
  if (m.stagger <= 0) {
    m.stagger = 0; clearTele(m); m.state = 'stun'; m.t = 0; if (!D.fly) m.y = 0;
    floaters.push({ x: m.x, y: D.top + 1, z: m.z, t: 0, text: '무력화!', crit: false, big: true, vx: 0, color: '#ffe070' });
    shake = Math.max(shake, 0.4); toast('무력화 성공', `${D.name}이(가) ${D.boss ? 4 : 3.5}초 동안 행동 불능`, '#ffe070'); log(`${D.name}을(를) 무력화했습니다!`, '전투');
    questProg('stagger');
  }
}
// 준비 중인 공격을 끊는다 (보스는 끊을 수 있는 패턴만)
function monInterrupt(m, quiet) {
  if (m.state !== 'wind' || (m.def.boss && !PAT[m.pat].cut)) return false;
  clearTele(m); m.state = 'recover'; m.t = 0; m.recDur = 0.9; m.flash = 0.15; m.burrowed = false; m.sink = 0;
  if (!quiet) floaters.push({ x: m.x, y: m.def.top + 0.6, z: m.z, t: 0, text: '끊기!', crit: false, big: true, vx: 0, color: '#ff6a5a' });
  return true;
}
function monDie(m) {
  const D = m.def; m.hp = 0; m.state = 'dead'; m.t = 0; clearTele(m);
  if (D.raidBoss && !mons.some(o => o !== m && o.def.raidBoss && o.state !== 'dead')) for (const o of [...mons]) if (o !== m && o.state !== 'dead') later(0.05, () => { if (o.state !== 'dead') monDie(o); });
  gainExp(D.exp); questProg('hunt'); dropLoot(m); if (DUN.on) { DUN.exp += D.exp; DUN.kills++; } if (D.boss) questProg('kill');
  log(`${D.name}을(를) 처치했습니다.`, '전투');
  if (D.boss || D.elite) toast('처치 완료', D.name, D.boss ? '#ffd040' : '#c8b8ff');
  shake = Math.max(shake, D.boss ? 1 : 0.35); hitstop = Math.max(hitstop, D.boss ? 0.2 : 0.1); fxFlash = 1.5; fxLight.color.setRGB(D.glow[0] / 3, D.glow[1] / 3, D.glow[2] / 3); fxLight.position.set(m.x, 1.2, m.z);
  const n = D.boss ? 160 : 50;
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 2 + Math.random() * (D.boss ? 9 : 5); soft.emit({ x: m.x, y: 0.5 + Math.random() * D.top, z: m.z, vx: Math.cos(a) * sp, vy: 1 + Math.random() * 4, vz: Math.sin(a) * sp * 0.7, grav: 10, drag: 0.8, life: 1.2 + Math.random(), c: lc(D.blood[i % 3]), size: PX * (1.4 + Math.random() * 2), upd: settle }); }
  for (let i = 0; i < n / 2; i++) { const a = Math.random() * TAU, sp = 1 + Math.random() * 4; glow.emit({ x: m.x, y: 1 + Math.random() * D.top * 0.6, z: m.z, vx: Math.cos(a) * sp, vy: 1 + Math.random() * 3, vz: Math.sin(a) * sp * 0.6, drag: 1.5, life: 0.8 + Math.random() * 0.6, c: D.glow, size: PX * 1.2 }); }
  floaters.push({ x: m.x, y: D.top + 0.8, z: m.z, t: -0.2, text: '처치!', crit: false, big: true, vx: 0, color: D.boss ? '#ffd040' : '#e0c8ff' });
  if (D.boss) { slowT = 0.8; flashW = 0.5; flashCol = '255,220,160'; }
}

// 노리는 대상: 분신(보스는 처음 1.5초만) → 은신 · 연막 · 쓰러짐이면 놓침 → 조작 중인 캐릭터
function monAggro(m, A) {
  const lost = { x: m.x + Math.cos(m.dir) * 2, z: m.z + Math.sin(m.dir) * 2, down: true };
  if (typeof aClone !== 'undefined' && aClone && (!m.def.boss || aClone.t < 1.5) && Math.hypot(aClone.x - m.x, aClone.z - m.z) < 14) return aClone;
  if (A.down) return lost;
  if (A.key === 'assassin' && (A.stealth > 0 || inSmoke(A.x, A.z))) return lost;
  return A;
}

// ---- 갱신 ----
function updateMons(dt) { for (const m of [...mons]) updateMon(m, dt); updateSpawners(dt); updateMprojs(dt); }
// ---- 몬스터 투사체: 대시 무적으로 피할 수 있다 ----
const mprojs = [];
function mShoot(m, dx, dz, o = {}) {
  const mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(...(o.col || [0.6, 1.4, 2.6])), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  mesh.scale.setScalar(o.size || 0.9); scene.add(mesh);
  mprojs.push({ mesh, x: m.x + dx * 0.8, z: m.z + dz * 0.8, y: o.y ?? 1.4, vx: dx * (o.speed || 7), vz: dz * (o.speed || 7), life: o.life || 2, dmg: o.dmg || 16, r: o.r || 0.55, onHit: o.onHit, col: o.col || [0.6, 1.4, 2.6], src: m });
}
function updateMprojs(dt) {
  const A = party[active];
  for (let i = mprojs.length - 1; i >= 0; i--) {
    const p = mprojs[i]; p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt;
    p.mesh.position.set(p.x, p.y, p.z); if (dt > 0) glow.emit({ x: p.x, y: p.y, z: p.z, life: 0.3, c: p.col, size: PX * 1.2 });
    let done = p.life <= 0 || Math.abs(p.x) > 12 || p.z < -10 || p.z > 12;
    if (!done && !A.down && Math.hypot(A.x - p.x, A.z - p.z) < p.r + 0.3) { const wasInv = A.inv > 0; hurtPlayer(A, p.dmg, p.x - p.vx, p.z - p.vz); if (p.onHit && !wasInv) p.onHit(); done = true; }
    if (done) { embers(p.x, p.y, p.z, 10, p.col, 3); scene.remove(p.mesh); p.mesh.material.dispose(); mprojs.splice(i, 1); }
  }
}
function clearMprojs() { for (const p of mprojs) { scene.remove(p.mesh); p.mesh.material.dispose(); } mprojs.length = 0; }
function updateMon(m, dt) {
  const D = m.def, F = m.F;
  m.t += dt; m.flash -= dt; m.hurtT -= dt; m.slowT -= dt; m.rootT -= dt;
  m.trail += (m.hp - m.trail) * Math.min(1, dt * 2.5);
  if (!D.heavy) { m.vlift -= 26 * dt; m.lift += m.vlift * dt; if (m.lift <= 0) { if (m.vlift < -7) { dustRing(m.x, m.z, 12, 2.4, '#9c8466'); shake = Math.max(shake, 0.15); } m.lift = 0; m.vlift = 0; } }
  const T = monAggro(m, hero()), dx = T.x - m.x, dz = T.z - m.z, d = Math.hypot(dx, dz) || 1;
  // 방향: 평소엔 빠르게, 공격 준비 중엔 초당 90°만 돈다 (뒤치기 틈)
  if (m.state === 'chase' || m.state === 'wind' || m.state === 'recover' || m.state === 'idle') {
    const want = Math.atan2(dz, dx); let dd = want - m.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
    const rate = m.state === 'chase' ? 7 : m.state === 'idle' ? 2 : Math.PI / 2;
    if (m.state !== 'idle' || m.aggro) m.dir += clamp(dd, -rate * dt, rate * dt);
  }
  const [rx, rz] = camRight(), fs = Math.cos(m.dir) * rx + Math.sin(m.dir) * rz; if (Math.abs(fs) > 0.05) m.face = fs > 0 ? 1 : -1;
  const spd = D.speed * (m.slowT > 0 ? 0.7 : 1) * (m.rootT > 0 ? 0 : 1);
  if (D.fly && m.state !== 'act' && m.state !== 'dead') m.y += ((m.state === 'wind' ? 2.4 : m.state === 'stun' ? 0.4 : D.fly + Math.sin(m.t * 3) * 0.15) - m.y) * Math.min(1, dt * 4);
  let spawnK = 1;
  switch (m.state) {
    case 'spawn': spawnK = Math.min(1, m.t / 0.8); if (m.t >= 0.8) { m.state = m.aggro ? 'chase' : 'idle'; m.t = 0; } break;
    case 'idle': {
      if (m.aggro || (!T.down && d < D.aggro)) { m.aggro = true; m.state = 'chase'; m.t = 0; floaters.push({ x: m.x, y: D.top + 0.5, z: m.z, t: 0, text: '!', crit: false, big: true, vx: 0, color: '#ff6a5a' }); break; }
      m.wanderT -= dt; if (m.wanderT <= 0) { m.wanderT = 2 + Math.random() * 3; const a = Math.random() * TAU; m.wx = m.hx + Math.cos(a) * 1.5; m.wz = m.hz + Math.sin(a) * 1.5; }
      const wx = (m.wx ?? m.x) - m.x, wz = (m.wz ?? m.z) - m.z, wd = Math.hypot(wx, wz);
      if (wd > 0.2) { m.x += wx / wd * spd * 0.3 * dt; m.z += wz / wd * spd * 0.3 * dt; m.dir = Math.atan2(wz, wx); m.moving = true; } else m.moving = false;
      break;
    }
    case 'chase': {
      m.cd -= dt * (D.boss && m.hp < m.max * 0.3 ? 1.55 : 1) * (m.enr ? 1.6 : 1);
      m.moving = false;
      if (!T.down) {
        const want = D.keep ? D.keep : D.r + 1.1;
        if (d > want + 0.3) { m.x += dx / d * spd * dt; m.z += dz / d * spd * dt; m.moving = true; }
        else if (D.keep) { m.x += -dz / d * m.strafe * spd * 0.5 * dt; m.z += dx / d * m.strafe * spd * 0.5 * dt; m.moving = true; if (Math.random() < dt * 0.5) m.strafe *= -1; }
      }
      // 보스: 체력 60% · 30%에서 늑대를 부른다
      if (D.boss && !D.phases && !D.raidBoss) for (const th of [0.6, 0.3]) if (!m.summoned[th] && m.hp < m.max * th) { m.summoned[th] = true; startPat(m, 'summon', T); break; }
      // 페이즈: 체력 비율마다 패턴 하나 추가 · 무력화 게이지 다시 채움 · 소환
      if (D.phases && m.phase < D.phases.length && m.hp < m.max * D.phases[m.phase].at) {
        const ph = D.phases[m.phase++]; if (ph.add && !m.pats.includes(ph.add)) m.pats.push(ph.add); m.stagger = D.stag || 0;
        DUN.banner = { t: 0, name: `${m.phase + 1} 페이즈`, sub: ph.name || D.name };
        floaters.push({ x: m.x, y: D.top + 1.2, z: m.z, t: 0, text: ph.name || '페이즈 전환', crit: false, big: true, vx: 0, color: '#9ad8ff' });
        if (D.summon) startPat(m, 'summon', T);
      }
      if (m.state === 'chase' && m.cd <= 0 && !T.down && !(m.rootT > 0)) {
        const can = m.pats.filter(k => d <= PAT[k].range && d >= (PAT[k].min || 0));
        if (can.length) startPat(m, can[(Math.random() * can.length) | 0], T);
      }
      break;
    }
    case 'wind': {
      const P = PAT[m.pat], k = Math.min(1, m.t / P.wind);
      for (const t of m.teles) t.setK(k);
      if (m.t >= P.wind) { clearTele(m); m.actDur = P.fire(m) || 0.2; m.state = 'act'; m.t = 0; }
      break;
    }
    case 'act': { const P = PAT[m.pat]; if (P.run) P.run(m, m.t); if (m.t >= m.actDur) { m.state = 'recover'; m.t = 0; m.recDur = P.rec ?? 0.6; m.cd = P.cd * (0.8 + Math.random() * 0.4); } break; }
    case 'recover': if (m.t >= m.recDur) { m.state = 'chase'; m.t = 0; } break;
    case 'stun':
      if (Math.random() < dt * 10) glow.emit({ x: m.x + Math.cos(uTime.value * 6) * D.r, y: m.y + D.top + 0.2, z: m.z + Math.sin(uTime.value * 6) * D.r * 0.5, vy: 0.2, life: 0.4, c: [2.6, 2.4, 0.6], size: PX * 1.5 });
      if (m.t > (D.boss ? 4 : 3.5)) { m.state = 'chase'; m.t = 0; m.stagger = D.stag; m.cd = 1; }
      break;
    case 'dead': if (m.t > 1.2) { removeMon(m); return; } break;
  }
  if (m.state !== 'dead' && m.state !== 'spawn') {
    collide(m, D.r * 0.8);
    for (const o of mons) { if (o === m || o.state === 'dead') continue; const ox = m.x - o.x, oz = m.z - o.z, od = Math.hypot(ox, oz), rr = (D.r + o.def.r) * 0.8; if (od < rr && od > 1e-4) { m.x += ox / od * (rr - od) * 0.5; m.z += oz / od * (rr - od) * 0.5; } }
  }
  // 그림
  const fr = m.state === 'wind' ? F.wind[0] : m.state === 'act' ? F.act[0] : m.moving && (m.state === 'chase' || m.state === 'idle') ? F.move[Math.floor(m.t * 7) % 2] : F.idle[Math.floor(m.t * 2.5) % 2];
  m.mat.map = m.face > 0 ? fr.r : fr.l; m.glowMat.map = m.face > 0 ? fr.gr : fr.gl;
  const cutGlow = m.state === 'wind' && PAT[m.pat].cut ? 0.07 + 0.07 * Math.sin(uTime.value * 18) : 0;
  m.mat.emissive.setRGB(m.flash > 0 ? 0.5 : cutGlow, m.flash > 0 ? 0.5 : 0, m.flash > 0 ? 0.5 : 0);
  const sink = m.state === 'dead' ? Math.min(1, m.t / 1.2) : 0;
  m.mat.opacity = 1; m.mesh.visible = sink < 0.98;
  m.mesh.position.set(m.x, m.y + m.lift - (1 - spawnK) * D.top - sink * D.top * 0.8 - (m.sink || 0) * D.top, m.z);
  const hs = 1 / (1 + (m.y + m.lift) * 0.25); m.sh.scale.set(D.r * 1.5 * hs, 1, D.r * 0.75 * hs); m.sh.position.set(m.x, 0.015, m.z); m.sh.visible = m.state !== 'dead';
}
function startPat(m, key, T) {
  const P = PAT[key]; m.pat = key; m.state = 'wind'; m.t = 0; P.begin(m, T);
  if (P.cut && m.def.boss) floaters.push({ x: m.x, y: m.def.top + 0.4, z: m.z, t: 0, text: '!', crit: false, big: true, vx: 0, color: '#ff4a3a' });
}

// ---- 출현 지점: 죽으면 잠시 뒤 다시 나온다 ----
const spawners = [];
function addSpawner(kind, x, z, delay = 8) { const sp = { kind, x, z, delay, t: 0, m: null }; sp.m = spawnMon(kind, x, z, { spawner: sp }); spawners.push(sp); return sp; }
function updateSpawners(dt) {
  for (const sp of spawners) {
    if (sp.m && mons.includes(sp.m)) continue;
    sp.t += dt; if (sp.t >= sp.delay) { sp.t = 0; sp.m = spawnMon(sp.kind, sp.x, sp.z, { spawner: sp }); }
  }
}
// 보스 체력바에 띄울 대상: 살아 있는 보스 → 마지막에 때린 몬스터
function barMon() {
  const b = mons.find(m => m.def.boss && m.state !== 'dead'); if (b) return b;
  if (focusMon && mons.includes(focusMon)) return focusMon;
  return null;
}
// 스킬이 '주 대상'을 고를 때: 보스 → 마지막에 때린 몬스터 → 가장 가까운 대상
function mainTarget(c, R) { const b = barMon(); if (b && b.state !== 'dead' && Math.hypot(b.x - c.x, b.z - c.z) < R) return b.tg; return nearestTarget(c, R); }
