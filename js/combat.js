'use strict';
// 전투 공통: 피격 · 타격 · 슬라임 AI

// ===================================================================
// 게임 로직
// ===================================================================
const floaters = [];
let hitstop = 0, shake = 0, fxFlash = 0;
const camRight = () => [Math.cos(camYaw), -Math.sin(camYaw)];

let hurtVig = 0;
function inputDir() {
  const [rx, rz] = camRight(), fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
  const ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const mx = fx * iz + rx * ix, mz = fz * iz + rz * ix, ml = Math.hypot(mx, mz);
  return ml ? [mx / ml, mz / ml, 1] : [0, 0, 0];
}
function jump(c) {
  if (c.down || c.state === 'skill' || (c.y || 0) > 0.01 || c.dash > 0) return;
  c.vy = 8.2; c.y = 0.01;
  dustRing(c.x, c.z, 8, 1.6, '#9c8466');
}
function attack(c) {
  if (c.state === 'atk' || c.state === 'skill' || c.down || c.dash > 0) return;
  if (c.key === 'berserker') {
    if ((c.y || 0) > 0.6) { c.state = 'skill'; c.sk = { id: 'AIR', t: 0 }; return; }
    if (c.postDash > 0 && !(c.thrustCd > 0)) { c.thrustCd = 2; c.state = 'skill'; c.sk = { id: 'THR', t: 0 }; SK.THR.init(c, c.sk); return; }
    const now = uTime.value;
    c.combo = now - (c.lastAtk ?? -9) < 0.75 ? ((c.combo || 0) + 1) % (c.berserk > 0 ? 4 : 3) : 0;
    c.lastAtk = now;
  }
  if (c.key === 'assassin') {
    if ((c.y || 0) > 0.6) { c.state = 'skill'; c.sk = { id: 'AIR', t: 0, impl: AK }; return; }
    if (c.backStab) { c.backStab = false; c.state = 'skill'; c.sk = { id: 'STAB', t: 0, impl: AK }; return; }
    const now = uTime.value;
    c.combo = now - (c.lastAtk ?? -9) < 0.6 ? ((c.combo || 0) + 1) % 5 : 0; c.lastAtk = now;
  }
  c.state = 'atk'; c.at = 0; c.af = 0; c.fired = false;
}
function dash(c) {
  if (c.frozenT > 0) return;
  if (c.down || c.dash > 0 || c.dashCd > 0 || (c.state === 'atk' && c.key === 'berserker') || c.state === 'skill') return;
  if (c.state === 'atk') c.state = 'idle';
  let [mx, mz, ok] = inputDir();
  if (!ok) { const [rx, rz] = camRight(); mx = rx * c.face; mz = rz * c.face; }
  c.dx = mx; c.dz = mz; c.dash = 0.2; c.dashCd = 0.45; c.inv = Math.max(c.inv, 0.3); c.ghostT = 0;
  if (c.key === 'assassin') { shadowStep(c, mx, mz); return; }
  if (c.key === 'hawk') { c.dash = 0.28; c.dashCd = c.lib > 0 ? 0.25 : 0.5; if (!(c.aimCd > 0)) c.aimReady = true; }
  dustRing(c.x, c.z, 10, 2.5, '#9c8466');
}
const ATK_DUR = [0.08, 0.09, 0.22];
const settle = p => { if (p.y < 0.03) { p.y = 0.03; p.vx = p.vy = p.vz = 0; } };
function dustRing(x, z, n, sp, col) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + Math.random() * 0.3;
    soft.emit({ x: x + Math.cos(a) * 0.5, y: 0.1, z: z + Math.sin(a) * 0.4, vx: Math.cos(a) * sp, vy: 0.4 + Math.random() * 0.6, vz: Math.sin(a) * sp * 0.75, drag: 3, life: 0.7 + Math.random() * 0.3, c: lc(col), size: PX * 2.5, grow: 2, a: 0.75 });
  }
}

// 맞을 수 있는 대상들
const targets = [
  { get x() { return DUMMY.x; }, get z() { return DUMMY.z; }, r: 0.55, top: 2.2, spark: '#e0c070', alive: () => AREA === 'town', y: () => 0,
    onHit(dmg, nx, nz) { const [rx, rz] = camRight(); dummyVel += (nx * rx + nz * rz >= 0 ? 1 : -1) * 6; } },
];
function hitTarget(tg, base, fx, fz, color, opt = {}) {
  if (tg.mon && tg.mon.invuln) { if (!(tg.mon.ivT > uTime.value)) { tg.mon.ivT = uTime.value + 0.4; floaters.push({ x: tg.x, y: tg.y() + tg.top + 0.5, z: tg.z, t: 0, text: '무적', crit: false, vx: 0, color: '#c8c0e0' }); } return; }
  const bz = party[active].key === 'berserker' && party[active].berserk > 0;
  const ch = party[active].charm > 0 ? 1.2 : 1;
  const __tf = opt.noTri ? null : curTri(party[active]);
  let __blk = false;
  if (tg.mon && tg.mon.def.shield && tg.mon.state !== 'stun' && tg.mon.state !== 'dead') { const m = tg.mon, ax = fx - m.x, az = fz - m.z, al = Math.hypot(ax, az) || 1; __blk = (ax * Math.cos(m.dir) + az * Math.sin(m.dir)) / al > 0.35; }
  const crit = opt.forceCrit || Math.random() < gearCrit(party[active]) + (__tf ? __tf.crit : 0) + (bz ? 0.15 : 0) + (opt.critAdd || 0), dmg = Math.round(base * ch * (bz ? 1.3 : 1) * (opt.mul || 1) * (__blk ? 0.35 : 1) * gearDmgMul(party[active], tg) * (__tf ? 1 + __tf.dmg : 1) * (tg.marks > 0 && party[1].lib > 0 ? 1.1 : 1) * (crit ? gearCritMul(party[active]) * (__tf ? 1 + __tf.cdmg : 1) : 1) * (0.9 + Math.random() * 0.2));
  if (party[active].key === 'berserker' && !bz && !(party[active].exhaust > 0)) party[active].idg = Math.min(100, party[active].idg + 1.2 * ((__tf && __tf.gauge) || 1));
  if (tg.mon) { monStagger(tg.mon, (opt.sg ?? 4) * gearStag(party[active]) * (__tf ? 1 + __tf.stag : 1)); focusMon = tg.mon; }
  if (tg === targets[0]) questProg('dummy');
  if (bz && party[active].sk && party[active].sk.id === 'V' && tg.mon) questProg('ult');
  if (!opt.noTri) triOnHit(party[active], tg);
  if (__blk && !(tg.blkTxt > uTime.value)) { tg.blkTxt = uTime.value + 0.5; floaters.push({ x: tg.x, y: tg.y() + tg.top + 0.7, z: tg.z, t: 0, text: '막음', crit: false, vx: 0, color: '#a8b0c0' }); embers(tg.x, 1.3, tg.z, 8, [2.4, 2.4, 2.6], 4); }
  if (typeof addSkillDamage === 'function') addSkillDamage(party[active], dmg, tg);
  const st = opt.stack || 0;
  let nx = tg.x - fx, nz = tg.z - fz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
  hitstop = Math.max(hitstop, opt.stop ?? (crit ? 0.09 : 0.06)); shake = Math.max(shake, opt.shake ?? (crit ? 0.3 : 0.18)); fxFlash = Math.max(fxFlash, 1);
  const ty = tg.y();
  fxLight.position.set(tg.x, ty + 1.2, tg.z); fxLight.color.set(color);
  floaters.push({ x: tg.x, y: ty + tg.top + st * 0.36, z: tg.z, t: -st * 0.045, text: String(dmg), crit, vx: (Math.random() - 0.5) * 0.25, color: opt.numColor || (bz ? (crit ? '#ffd25a' : '#ff8a6a') : undefined) });
  if (opt.quiet) { tg.onHit(dmg, nx, nz); return; }
  const cc = lc(color);
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * TAU, s = 2 + Math.random() * 5;
    glow.emit({ x: tg.x, y: ty + 1.1 + Math.random() * 0.6, z: tg.z, vx: Math.cos(a) * s, vy: 1 + Math.random() * 4, vz: Math.sin(a) * s * 0.6, grav: 12, drag: 2, life: 0.35 + Math.random() * 0.3, c: [cc[0] * 3, cc[1] * 3, cc[2] * 3], size: PX * 1.2 });
  }
  for (let i = 0; i < 10; i++) soft.emit({ x: tg.x + (Math.random() - 0.5) * 0.6, y: ty + 1 + Math.random(), z: tg.z, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, grav: 6, drag: 1, life: 0.8, c: lc(tg.spark), size: PX * 1.3 });
  tg.onHit(dmg, nx, nz);
}

function hurtPlayer(c, dmg, fx, fz) {
  if (c.inv > 0 || c.down) return;
  // 철혈 반격 자세 중에 맞으면 즉시 반격 (정면 180°는 피해 없음, 옆·뒤는 절반)
  if (c.state === 'skill' && c.sk && c.sk.id === 'X' && c.sk.t >= 0.08 && c.sk.par === undefined && !c.sk.fail) {
    const [rx, rz] = camRight(), front = ((fx - c.x) * rx + (fz - c.z) * rz) * c.face >= 0;
    parry(c, fx, fz); if (front) return; dmg *= 0.5;
  }
  const charging = c.state === 'skill' && c.sk && c.sk.id === 'C' && c.sk.rel === undefined;
  dmg = Math.round(dmg * 28 * (DUN.on ? DUN.d.dmgMul * (DUN.enrage || 1) : 1) * (0.9 + Math.random() * 0.2) * (c.berserk > 0 ? 1.1 : 1) * (charging ? 0.7 : 1) * gearDef(c) * (1 - ((curTri(c) || {}).dr || 0)));
  c.hp = Math.max(0, c.hp - dmg); c.inv = 1.0; c.hurtFlash = 0.15;
  if (c.key === 'berserker' && !(c.berserk > 0) && !(c.exhaust > 0)) c.idg = Math.min(100, c.idg + dmg / c.max * 40);
  if (c.state !== 'skill' && !(c.berserk > 0)) { c.state = 'idle'; let nx = c.x - fx, nz = c.z - fz; const nl = Math.hypot(nx, nz) || 1; c.kx = nx / nl * 9; c.kz = nz / nl * 9; }
  hurtVig = 0.7; shake = Math.max(shake, 0.35); hitstop = Math.max(hitstop, 0.08);
  floaters.push({ x: c.x, y: 2.4, z: c.z, t: 0, text: '-' + dmg.toLocaleString(), crit: false, vx: 0, color: '#ff5a5a' });
  for (let i = 0; i < 12; i++) glow.emit({ x: c.x, y: 1.1, z: c.z, vx: (Math.random() - 0.5) * 5, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 2, grav: 10, drag: 2, life: 0.4, c: [2.8, 0.5, 0.4], size: PX * 1.2 });
  if (c.hp <= 0) { endSkill(c); c.down = true; c.downT = 0; floaters.push({ x: c.x, y: 3, z: c.z, t: -0.2, text: '전투 불능', crit: false, vx: 0, color: '#c8b8d8' }); }
}
function spawnGhost(c) {
  const m = new THREE.Mesh(c.mesh.geometry, new THREE.MeshBasicMaterial({ map: c.mat.map, transparent: true, opacity: 0.55, alphaTest: 0.01, depthWrite: false, color: new THREE.Color(0.7, 0.9, 1.6), side: THREE.DoubleSide }));
  m.position.copy(c.mesh.position); m.rotation.y = camYaw; scene.add(m); ghosts.push({ m, t: 0 });
}
