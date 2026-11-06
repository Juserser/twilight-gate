'use strict';
// 레이드: 문을 삼킨 자 (기획서 11장) — 관문 3개, 플레이어 1명 + AI 동료 2명
//  관문 1 촉수의 정원: 보스 무적, 빛 기둥 3개를 지켜 다 채우면 보호막이 깨진다 (15초)
//  관문 2 갈라진 자: 두 보스의 체력 차가 10%를 넘으면 둘 다 광폭 (피해 ×1.5, 공격이 잦아짐)
//  관문 3 문을 삼킨 자: 3페이즈, 마지막 페이즈의 전멸기는 시전 중 무력화해야 끊긴다
//  규칙: 관문당 10분 (넘기면 전멸), 파티 공용 부활 2회, 실패하면 관문 처음부터. 보상은 관문마다 주 1회 (연습은 무제한)

// ---- 그림 ----
function drawTendril(g, G, p) {
  const st = p.st, sway = st === 'act' ? 6 : st === 'wind' ? -4 : Math.sin(p.i * 2) * 2;
  blob(g, 14, 38, 8, 2.6, ['#08040e', '#160a22', '#26123a'], { rough: 0.6 });
  for (let i = 0; i < 12; i++) { const t = i / 11, x = 14 + Math.sin(t * 3) * 2 + sway * t * t, y = 37 - t * 32, r = 4 - t * 2.6; blob(g, x, y, r, r * 0.9, VP.flesh, { rough: 0.2 }); if (i % 3 === 1) G.set(x + r * 0.5, y, VP.mag); }
}
function drawMaw(g, G, p) {
  const st = p.st, open = st === 'wind' || st === 'act', cx = 42, cy = 46;
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + p.i * 0.2, L = 26 + (i % 3) * 6, w = Math.sin(p.i * 2 + i) * 4; limb(g, cx + Math.cos(a) * 14, cy + Math.sin(a) * 12, cx + Math.cos(a) * L + w, cy + Math.sin(a) * L * 0.85, 5, 1, VP.flesh); G.set(cx + Math.cos(a) * L + w, cy + Math.sin(a) * L * 0.85, i % 2 ? VP.mag : VP.cyan); }
  blob(g, cx, cy, 20, 18, VP.flesh, { rough: 0.35 });
  const mr = open ? 12 : 8; blob(g, cx, cy, mr, mr * 0.85, ['#000000', '#08020c']);
  for (let a = 0; a < TAU; a += TAU / 22) g.set(cx + Math.cos(a) * mr * 0.9, cy + Math.sin(a) * mr * 0.78, '#e8e0f0');
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, x = cx + Math.cos(a) * 16, y = cy + Math.sin(a) * 14; blob(g, x, y, 2.2, 2.2, ['#c8c0d8', '#ffffff']); G.set(x, y, VP.mag); }
}
function drawTwin(g, G, p, cyan) {
  const st = p.st, bob = p.i * 0.8, cx = 30, col = cyan ? VP.cyan : VP.mag, pal = cyan ? VP.teal : VP.flesh, sd = cyan ? -1 : 1;
  eachPx(g, 10, 30, 50, 80, (px, py, X, Y) => { const hw = 7 + (Y - 30) * 0.3; if (Math.abs(X - cx) < hw && Y < 78 - Math.abs(Math.sin(X * 0.6)) * 3) { const cut = (X - cx) * sd < -1 + Math.sin(Y * 0.7) * 1.5; if (!cut) g.fset(px, py, pal[shadeAt(0.5 - (X - cx) / hw * 0.25 + (vnoise(X * 0.2, Y * 0.2) - 0.5) * 0.3, pal.length, px, py)]); } });
  for (let y = 30; y < 78; y += 2) G.set(cx - sd * 0.5 + Math.sin(y * 0.7) * 1.5, y, col);
  blob(g, cx + sd * 2, 22 + bob, 7, 8, VP.shell, { lit: 0.1 }); g.rect(cx + sd * 2 - 2, 20 + bob, 4, 6, '#000'); G.set(cx + sd * 3, 22 + bob, col);
  const hand = st === 'wind' ? [cx + sd * 14, 4] : st === 'act' ? [cx + sd * 26, 44] : [cx + sd * 18, 50 + bob];
  limb(g, cx + sd * 7, 34 + bob, hand[0], hand[1], 4, 2.6, VP.shell);
  for (let k = 0; k <= 12; k++) { const t = k / 12, x = hand[0] + sd * t * 10, y = hand[1] - t * 6; g.set(x, y, '#e0d8f0'); G.set(x, y + 0.5, col); }
}
function drawDevourer(g, G, p) {
  const st = p.st, bob = p.i * 1, cx = 48;
  // 문틀 같은 몸: 두 기둥과 아치, 가운데는 공허
  for (const sd of [-1, 1]) { eachPx(g, cx + sd * 26 - 7, 22, cx + sd * 26 + 7, 96, (px, py, X, Y) => { if (Math.abs(X - cx - sd * 26) < 6 - (Y > 88 ? 0 : 0)) g.fset(px, py, VP.shell[shadeAt(0.6 - (X - cx - sd * 26) / 6 * 0.3 + (vnoise(X * 0.3, Y * 0.2) - 0.5) * 0.3, 5, px, py)]); }); for (let y = 30; y < 92; y += 5) G.set(cx + sd * 26, y, (y / 5) % 2 ? VP.mag : VP.cyan); }
  for (let a = Math.PI; a <= TAU; a += 0.01) for (let r = 24; r < 32; r += 0.5) g.set(cx + Math.cos(a) * r, 26 + Math.sin(a) * r * 0.7, VP.shell[2 + ((r | 0) % 2)]);
  eachPx(g, cx - 20, 10, cx + 20, 92, (px, py, X, Y) => { const inside = Y > 26 ? Math.abs(X - cx) < 20 : Math.hypot((X - cx) / 24, (Y - 26) / 16.8) < 1; if (inside) g.fset(px, py, (hash2(px, py) > 0.985) ? '#ff4ad8' : (hash2(px + 7, py) > 0.988) ? '#5affe0' : '#04020a'); });
  // 문 속의 거대한 눈
  const er = st === 'wind' ? 11 : 8; blob(g, cx, 52 + bob, er + 4, er, ['#c8c0d8', '#e8e0f0', '#ffffff'], { rough: 0.1 });
  blob(g, cx + 1, 52 + bob, er * 0.55, er * 0.75, ['#3a0a34', '#8a1a7a', '#ff4ad8'], { lit: 0.15 }); g.rect(cx, 52 + bob - er * 0.5, 2, er, '#000'); G.rect(cx + 3, 49 + bob, 2, 2, '#ffffff');
  // 문틀에서 뻗는 촉수 팔
  const reach = st === 'act' ? 1.3 : st === 'wind' ? 0.6 : 1;
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const y0 = 40 + k * 16, x1 = cx + sd * (30 + 14 * reach), y1 = y0 + (st === 'act' ? 14 : 6) + k * 2; limb(g, cx + sd * 26, y0, x1, y1, 3.6, 1, VP.flesh); G.set(x1, y1, VP.mag); }
}
Object.assign(MON_ART, {
  tendril: { w: 28, h: 41, draw: drawTendril }, maw: { w: 84, h: 84, draw: drawMaw },
  twinA: { w: 60, h: 82, draw: (g, G, p) => drawTwin(g, G, p, false) }, twinB: { w: 60, h: 82, draw: (g, G, p) => drawTwin(g, G, p, true) }, devourer: { w: 96, h: 98, draw: drawDevourer },
});
for (const k of ['tendril', 'maw', 'twinA', 'twinB', 'devourer']) MON_FRAMES[k] = bakeMonster(k);

// ---- 레이드 상태 ----
const RAID = { room: -1, t: 0, revives: 2, downed: false, pillars: [], shieldT: 0, addT: 0, doomT: 18, fail: false, claimed: {} };
const RAID_LIMIT = 600;
const weekKey = () => { const d = new Date(), s = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-' + Math.floor(((d - s) / 864e5 + s.getDay()) / 7); };
const raidOn = () => DUN.on && DUN.d && DUN.d.raid;

// ---- 몬스터 ----
Object.assign(MON, {
  tendril:  { name: '정원의 촉수', lv: 80, hp: 2600, r: 0.55, top: 2.6, s: 1.0, speed: 2.2, aggro: 30, spark: '#ff4ad8', blood: VBLOOD, glow: [2.8, 0.8, 2.4], pats: ['lashP'], exp: 0.01, weak: 'notdark', hunt: m => nearestPillar(m) },
  maw:      { name: '촉수의 정원 · 굶주린 아가리', lv: 80, hp: 38000, r: 2.0, top: 5.2, s: 1.0, speed: 0, aggro: 40, heavy: true, stag: 300, boss: true, raidBoss: true, spark: '#ff4ad8', blood: VBLOOD, glow: [2.8, 0.9, 2.4], pats: ['barrage', 'mawring', 'quake'], exp: 0.5, weak: 'notdark' },
  twinA:    { name: '갈라진 자 · 분홍 반쪽', lv: 80, hp: 34000, r: 1.4, top: 5.0, s: 1.0, speed: 1.3, aggro: 40, heavy: true, stag: 260, boss: true, raidBoss: true, spark: '#ff4ad8', blood: VBLOOD, glow: [2.8, 0.8, 2.4], pats: ['vcone', 'blink'], exp: 0.4, weak: 'notdark' },
  twinB:    { name: '갈라진 자 · 청록 반쪽', lv: 80, hp: 34000, r: 1.4, top: 5.0, s: 1.0, speed: 1.3, aggro: 40, heavy: true, stag: 260, boss: true, raidBoss: true, spark: '#5affe0', blood: ['#0e3a36', '#5affe0', '#06201e'], glow: [0.6, 2.8, 2.4], pats: ['barrage', 'vbeam2'], exp: 0.4, weak: 'notdark' },
  devourer: { name: '문을 삼킨 자', lv: 80, hp: 90000, r: 2.2, top: 6.0, s: 1.0, speed: 0.7, aggro: 40, heavy: true, stag: 300, boss: true, raidBoss: true, summon: 'voidlingB', spark: '#f0e8ff', blood: VBLOOD, glow: [2.6, 1.8, 2.8], pats: ['vcone', 'barrage', 'crossrift'], exp: 1.0, weak: 'notdark',
    phases: [{ at: 0.7, add: 'gravity', name: '문이 숨을 들이쉰다' }, { at: 0.4, add: 'blink', name: '마지막 페이즈 · 문이 닫히려 한다' }] },
});
Object.assign(PAT, {
  // 촉수: 기둥을 후려친다 (가까이 있으면 플레이어도)
  lashP: { range: 2.8, wind: 0.9, cd: 2.2, cut: true,
    begin(m, T) { m.aim = dirTo(m, T); teleRect(m, m.x, m.z, m.aim[0], m.aim[1], 2.8, 1.4); },
    fire(m) { const p = nearestPillar(m); if (p && Math.hypot(p.x - m.x, p.z - m.z) < 3.2) { p.hp -= 12; shockwave(p.x, p.z, 1.6, VOIDC, 0.3); floaters.push({ x: p.x, y: 3.2, z: p.z, t: 0, text: '기둥 공격!', crit: false, vx: 0, color: '#ff8ad8' }); } hurtIf(m, inRect(m.x, m.z, m.aim[0], m.aim[1], 2.8, 1.4), 22); return 0.25; } },
  mawring: { range: 7, wind: 1.2, cd: 4.0, rec: 0.6,
    begin(m) { teleDonut(m, m.x, m.z, 3, 7.5); },
    fire(m) { shockwave(m.x, m.z, 8, VOIDC, 0.5); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; voidBurst(m.x + Math.cos(a) * 5.5, m.z + Math.sin(a) * 4.8, 4); } shake = Math.max(shake, 0.45); const A = hero(), d = Math.hypot(A.x - m.x, A.z - m.z); if (!A.down && d > 2.8 && d < 7.8) hurtPlayer(A, 32, m.x, m.z); return 0.4; } },
  // 전멸기: 9초 시전, 그 사이 무력화하면 끊긴다
  doom: { range: 99, wind: 9, cd: 20, rec: 0.6,
    begin(m) { m.stagger = 150; teleCircle(m, m.x, m.z, 14); DUN.banner = { t: 0, name: '문이 닫힌다', sub: '무력화로 끊어라!' }; floaters.push({ x: m.x, y: m.def.top + 1.5, z: m.z, t: 0, text: '전멸기 시전', crit: false, big: true, vx: 0, color: '#ff4a6a' }); },
    fire(m) { flashW = 0.8; flashCol = '255,200,240'; shake = 1.2; RAID.fail = '문이 닫혀 파티가 전멸했다'; return 0.3; } },
});
const _monAggro = monAggro;
monAggro = function (m, A) { if (m.def.hunt) { const t = m.def.hunt(m); if (t) return t; } return _monAggro(m, A); };

// ---- 빛 기둥 (관문 1) ----
const pillarMat = new THREE.MeshLambertMaterial({ map: VTEX.obel, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.8, 1.8, 2.2), emissive: new THREE.Color(0.2, 0.2, 0.3) });
function nearestPillar(m) { let best = null, bd = 99; for (const p of RAID.pillars) { if (p.dead) continue; const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < bd) { bd = d; best = p; } } return best; }
function makePillars() {
  RAID.pillars = [[-1.5, -5.5], [-1.5, 8], [-5.5, 1.5]].map(([x, z]) => {
    const mesh = dBB(pillarMat, 14, 56, x, z, { s: 1.0 }); const o = { x, z, r: 0.5 }; obstacles.push(o); DUN.obs.push(o);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.35, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2, 2.6), transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
    ring.position.set(x, 0.06, z); scene.add(ring); DUN.objs.push(ring);
    return { x, z, hp: 100, charge: 0, dead: false, rt: 0, mesh, ring };
  });
}

// ---- AI 동료: 조작하지 않는 두 명이 보스(관문 1은 촉수)를 친다 ----
function companionAI(dt) {
  if (!raidOn()) return;
  const live = mons.filter(m => m.state !== 'dead' && m.state !== 'spawn' && !m.burrowed);
  let k = 0;
  for (let i = 0; i < party.length; i++) {
    if (i === active) continue; const c = party[i], idx = k++; if (c.down) continue;
    // 대상: 관문 1은 기둥을 치는 촉수 먼저, 관문 2는 동료마다 다른 반쪽, 그 외 보스
    let tg = null;
    if (RAID.room === 0) tg = live.filter(m => m.kind === 'tendril').sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0];
    if (!tg && RAID.room === 1) tg = live.find(m => m.kind === (idx ? 'twinB' : 'twinA'));
    if (!tg) tg = live.find(m => m.def.boss) || live[0];
    if (!tg) continue;
    const want = c.key === 'hawk' ? 6 : tg.def.r + 1.4, dx = tg.x - c.x, dz = tg.z - c.z, d = Math.hypot(dx, dz) || 1;
    let moving = false;
    if (d > want + 0.3) { c.x += dx / d * 4.2 * dt; c.z += dz / d * 4.2 * dt; collide(c, 0.35); moving = true; }
    const [rx, rz] = camRight(); c.face = (dx * rx + dz * rz) >= 0 ? 1 : -1;
    c.cAtk = (c.cAtk || 0) - dt;
    let f = moving ? c.fr.walk[Math.floor(uTime.value * 10) % c.fr.walk.length] : c.fr.idle[Math.floor(uTime.value * 3) % 4];
    if (!moving && c.cAtk <= 0 && d < want + 1) {
      c.cAtk = 0.75; c.cSwing = 0.2;
      const dmg = Math.round(P(170) * gearDmgMul(c, tg.tg) * (0.9 + Math.random() * 0.2) * (tg.invuln ? 0 : 1));
      const col = { berserker: [1.6, 1.8, 2.4], hawk: [0.9, 2.4, 2.0], assassin: [1.6, 0.55, 2.4] }[c.key];
      if (c.key === 'hawk') lightLine(c.x, c.z, dx / d, dz / d, d, col, 0.15, 1.5);
      else spawnSlash({ x: tg.x, y: (tg.y + tg.lift) + 1.2, z: tg.z, size: 2.6, rot: Math.random() * 60 - 30, face: c.face, color: col, life: 0.14 });
      if (dmg > 0) { tg.tg.onHit(dmg, dx / d, dz / d); monStagger(tg, 3); floaters.push({ x: tg.x, y: (tg.y + tg.lift) + tg.def.top, z: tg.z, t: 0, text: String(dmg), crit: false, vx: (Math.random() - 0.5) * 0.3, color: '#b8b0c8' }); }
    }
    if (c.cSwing > 0) { c.cSwing -= dt; f = c.fr.atk[2]; }
    c.mat.map = c.face > 0 ? f.r : f.l; if (c.glowMat) c.glowMat.map = c.face > 0 ? f.gr : f.gl;
    c.mesh.position.set(c.x, -3.5 * PX, c.z); c.sh.position.set(c.x, 0.015, c.z);
  }
}

// ---- 진행 ----
function raidSetup() {
  RAID.room = DUN.room; RAID.t = 0; RAID.revives = 2; RAID.downed = party[active].down; RAID.fail = false; RAID.pillars = []; RAID.shieldT = 0; RAID.addT = 3; RAID.doomT = 14; DUN.enrage = 1;
  if (DUN.room === 0) { makePillars(); for (const m of mons) if (m.kind === 'maw') { m.invuln = true; m.x = 5; m.z = 1.5; } }
  const names = ['관문 1 · 촉수의 정원', '관문 2 · 갈라진 자', '관문 3 · 문을 삼킨 자'], subs = ['빛 기둥 셋을 지켜 보호막을 깨라', '두 반쪽의 체력을 맞춰라 (차이 10% 이상이면 광폭)', '마지막 페이즈의 전멸기는 무력화로 끊어라'];
  DUN.banner = { t: 0, name: names[DUN.room], sub: subs[DUN.room] };
  // 동료를 곁에 세운다
  party.forEach((c, i) => { if (i !== active) { c.down = false; c.hp = c.max; } });
}
function raidFail(why) {
  toast('관문 실패', why, '#ff6a6a'); log(`[레이드] ${why}. 관문을 처음부터 다시 시작합니다.`, '시스템');
  RAID.fail = false; RAID.room = -1;
  fadeTo(() => { party.forEach(c => { c.down = false; c.hp = c.max; c.mesh.rotation.z = 0; }); buildRoom(DUN.room); });
}
function raidReward(gate) {
  const wk = weekKey(); PROG.raid = PROG.raid && PROG.raid.week === wk ? PROG.raid : { week: wk, gates: [] };
  if (PROG.raid.gates[gate]) { toast(`관문 ${gate + 1} 클리어`, '이번 주 보상은 이미 받았습니다 (연습)', '#c8b8d8'); return; }
  PROG.raid.gates[gate] = true;
  MATS.token = (MATS.token || 0) + 3 + gate * 2;
  const r = Math.random(), g = r < 0.008 ? '태초' : r < 0.2 ? '유물' : '전설';
  const it = makeSetItem('raid', g, 1700 + gate * 10, curCls());
  dropItem(4, 1.5, it); dropItem(4, 1.5, { mat: 'gold', n: 20000 + gate * 10000 }); dropItem(4, 1.5, { mat: 'awaken', n: 10 + gate * 5 });
  toast(`관문 ${gate + 1} 보상`, `레이드 증표 +${3 + gate * 2}`, '#ff9ad8'); saveGame();
}
function updateRaid(dt) {
  if (!raidOn()) { DUN.enrage = 1; return; }
  if (RAID.room !== DUN.room) raidSetup();
  const A = party[active];
  if (!DUN.cleared) RAID.t += dt;
  // 부활 · 시간 제한 · 전멸
  if (A.down && !RAID.downed) { RAID.revives--; floaters.push({ x: A.x, y: 3, z: A.z, t: 0, text: RAID.revives >= 0 ? `공용 부활 ${RAID.revives}회 남음` : '부활 없음', crit: false, big: true, vx: 0, color: '#ff8a8a' }); }
  RAID.downed = A.down;
  if (!DUN.fadeDir && !DUN.cleared) {
    if (RAID.revives < 0) return raidFail('공용 부활을 모두 썼다');
    if (RAID.t > RAID_LIMIT) return raidFail('10분이 지나 보스가 광폭했다');
    if (RAID.fail) return raidFail(RAID.fail);
  }
  if (DUN.cleared) { if (!RAID.rewarded) { RAID.rewarded = true; raidReward(DUN.room); } return; }
  RAID.rewarded = false;
  const bosses = mons.filter(m => m.def.raidBoss && m.state !== 'dead');
  if (DUN.room === 0) {
    const maw = bosses[0];
    // 촉수가 기둥을 노리고 계속 올라온다
    RAID.addT -= dt;
    if (RAID.addT <= 0 && maw) { RAID.addT = 7; if (mons.filter(m => m.kind === 'tendril' && m.state !== 'dead').length < 4) for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; const x = maw.x + Math.cos(a) * 3.5, z = maw.z + Math.sin(a) * 3.5; voidBurst(x, z, 16); spawnMon('tendril', x, z, { aggro: true, hpMul: DUN.d.hpMul * 0.5 }); } }
    for (const p of RAID.pillars) {
      if (p.dead) { p.rt -= dt; p.ring.material.opacity = 0.15; if (p.rt <= 0) { p.dead = false; p.hp = 100; p.charge = 0; p.mesh.visible = true; } continue; }
      if (p.hp <= 0) { p.dead = true; p.rt = 6; p.mesh.visible = false; voidBurst(p.x, p.z, 30); toast('빛 기둥이 무너졌다', '8초 뒤 다시 세워진다', '#ff8ad8'); continue; }
      if (RAID.shieldT <= 0) p.charge = Math.min(100, p.charge + dt * 100 / 18);
      p.ring.material.opacity = 0.4 + 0.4 * (p.charge / 100); p.ring.scale.setScalar(0.6 + p.charge / 250);
      if (Math.random() < dt * (4 + p.charge / 10)) glow.emit({ x: p.x + (Math.random() - 0.5) * 0.6, y: 0.2 + Math.random() * 3, z: p.z, vy: 1.5, life: 0.6, c: [2.4, 2.4, 2.8], size: PX });
    }
    if (maw) {
      if (RAID.shieldT > 0) { RAID.shieldT -= dt; maw.invuln = false; if (RAID.shieldT <= 0) { maw.invuln = true; RAID.pillars.forEach(p => p.charge = 0); toast('보호막 복구', '기둥을 다시 채워라', '#c8a0ff'); } }
      else if (RAID.pillars.length && RAID.pillars.every(p => !p.dead && p.charge >= 100)) {
        RAID.shieldT = 15; maw.invuln = false; flashW = 0.4; flashCol = '240,240,255'; shake = 0.6;
        RAID.pillars.forEach(p => pillar(p.x, p.z, 0.6, 10, [2, 2, 2.6], 0.8)); toast('보호막 붕괴!', '15초 동안 보스를 공격하라', '#ffffff');
      }
      if (maw.invuln && Math.random() < dt * 20) { const a = Math.random() * TAU; glow.emit({ x: maw.x + Math.cos(a) * 2.6, y: 1 + Math.random() * 4, z: maw.z + Math.sin(a) * 2, life: 0.4, c: [1.6, 1.6, 2.6], size: PX * 1.2 }); }
    }
  } else if (DUN.room === 1 && bosses.length === 2) {
    const [a, b] = bosses, diff = Math.abs(a.hp / a.max - b.hp / b.max), enr = diff > 0.1;
    if (enr !== !!a.enr) { a.enr = b.enr = enr; if (enr) { toast('갈라진 자 광폭!', '체력 차이가 10%를 넘었다', '#ff6a6a'); } }
    DUN.enrage = enr ? 1.5 : 1;
    if (enr && Math.random() < dt * 30) for (const m of bosses) glow.emit({ x: m.x + (Math.random() - 0.5) * 2, y: Math.random() * 5, z: m.z, vy: 2, life: 0.4, c: [3, 0.4, 0.4], size: PX * 1.3 });
  } else if (DUN.room === 1) { DUN.enrage = 1; for (const m of bosses) m.enr = false; }
  else if (DUN.room === 2) {
    const dv = bosses[0];
    if (dv && dv.phase >= 2 && dv.state === 'chase') { RAID.doomT -= dt; if (RAID.doomT <= 0) { RAID.doomT = 22; startPat(dv, 'doom', A); } }
  }
}
function raidDoomInfo() { const dv = mons.find(m => m.kind === 'devourer' && m.state === 'wind' && m.pat === 'doom'); return dv ? { k: dv.t / PAT.doom.wind, sg: dv.stagger / 150 } : null; }

// ---- 화면 ----
function drawRaidHUD(g, w, h) {
  if (!raidOn() || DUN.fade >= 1) return;
  const left = Math.max(0, RAID_LIMIT - RAID.t), mm = Math.floor(left / 60), ss = String(Math.floor(left % 60)).padStart(2, '0');
  const x0 = w / 2, y0 = 92;
  g.fillStyle = 'rgba(10,6,18,.78)'; g.fillRect(x0 - 230, y0 - 14, 460, DUN.room === 0 ? 62 : DUN.room === 1 ? 44 : 30);
  txt(`관문 ${DUN.room + 1} · 남은 시간 ${mm}:${ss}`, x0 - 220, y0 + 4, 13, left < 60 ? '#ff6a6a' : '#e8d8ff', 'left');
  txt(`공용 부활 ${'♥'.repeat(Math.max(0, RAID.revives))}${'♡'.repeat(Math.max(0, 2 - Math.max(0, RAID.revives)))}`, x0 + 220, y0 + 4, 13, '#ff8a9a', 'right');
  if (DUN.room === 0) {
    RAID.pillars.forEach((p, i) => { const bx = x0 - 220 + i * 150, by = y0 + 18; g.fillStyle = '#1a1424'; g.fillRect(bx, by, 140, 8); g.fillStyle = p.dead ? '#5a2a3a' : '#e8e8ff'; g.fillRect(bx, by, 140 * (p.dead ? 0 : p.charge / 100), 8); g.fillStyle = '#ff4ad8'; g.fillRect(bx, by + 10, 140 * Math.max(0, p.hp) / 100, 3); txt(p.dead ? `기둥 ${i + 1} 붕괴 ${Math.ceil(p.rt)}` : `기둥 ${i + 1}`, bx, by + 28, 11, '#c8b8e0', 'left'); });
    txt(RAID.shieldT > 0 ? `보호막 붕괴 ${RAID.shieldT.toFixed(1)}초` : '보호막', x0 + 220, y0 + 46, 12, RAID.shieldT > 0 ? '#ffffff' : '#a090c8', 'right');
  } else if (DUN.room === 1) {
    const [a, b] = mons.filter(m => m.def.raidBoss);
    if (a && b) { const pa = Math.max(0, a.hp / a.max), pb = Math.max(0, b.hp / b.max), diff = Math.abs(pa - pb); txt(`분홍 ${(pa * 100).toFixed(1)}%   청록 ${(pb * 100).toFixed(1)}%   차이 ${(diff * 100).toFixed(1)}%${diff > 0.1 ? '  광폭!' : ''}`, x0, y0 + 24, 13, diff > 0.1 ? '#ff6a6a' : diff > 0.07 ? '#ffd060' : '#9affc8', 'center'); }
  }
  const dm = raidDoomInfo();
  if (dm) { const bw = 520, bx = x0 - bw / 2, by = h * 0.62; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(bx - 4, by - 24, bw + 8, 50); txt('문이 닫힌다 — 무력화로 끊어라!', x0, by - 8, 15, '#ff8aa8', 'center'); g.fillStyle = '#3a0a1a'; g.fillRect(bx, by, bw, 10); g.fillStyle = '#ff4a6a'; g.fillRect(bx, by, bw * dm.k, 10); g.fillStyle = '#ffe070'; g.fillRect(bx, by + 13, bw * Math.max(0, dm.sg), 5); }
}
(REGION.hud = REGION.hud || []).push(drawRaidHUD);
REGION.update.push(updateRaid, companionAI);
REGION.build[7] = (seed, boss) => buildVoid(seed, boss);
Object.assign(REGION.ground, { 7: voidGroundTex }); REGION.under[7] = 0x050208;
REGION.look[7] = { sun: [0xe0c8ff, 3.0], hemi: [0xc0a0ff, 0x2a1a3a, 2.0], fog: [0x1a0e2a, 26, 80], ground: [1.4, 1.3, 1.5] };
REGION.prefix[7] = { 일반: '문지기의', 고급: '문지기의', 희귀: '문지기의', 영웅: '문지기의', 전설: '문지기의', 유물: '문을 닫은 자의', 태초: '태초의 문지기' };
MATN.token = ['레이드 증표', '#ff9ad8'];
CHEST.push({ hero: 1, leg: 1, relic: 0.2 });

// ---- 던전 · 입장 ----
const RAID_ILV = 1580;
DUNGEONS.push({ id: 'raid1', raid: true, region: 7, tier: 3, ilv: 1700, name: '문을 삼킨 자', lv: 80, seed: 901, hpMul: 2.6, dmgMul: 1.55,
  desc: `레이드 · 관문 3개. 아이템 레벨 ${RAID_ILV} 이상. 등불을 쓰지 않는다. 관문당 10분, 파티 공용 부활 2회, 보상은 관문마다 주 1회 (그 뒤는 연습).`, boss: '굶주린 아가리 → 갈라진 자 → 문을 삼킨 자',
  rooms: [{ boss: true, mons: [['maw', 1]] }, { boss: true, mons: [['twinA', 1], ['twinB', 1]] }, { boss: true, mons: [['devourer', 1]] }] });
REGIONS.push({ id: 7, name: '레이드', lv: '80', need: 'nihil', needName: '사도의 제단' });
const _enterDungeon = enterDungeon;
enterDungeon = function (di, free) {
  const d = DUNGEONS[di];
  if (d && d.raid) { const il = (party[active].gs || calcStats(party[active])).ilv; if (il < RAID_ILV && !location.search.includes('unlock')) { toast('입장할 수 없습니다', `아이템 레벨 ${RAID_ILV} 이상 (지금 ${il.toFixed(0)})`, '#ff8a6a'); return; } return _enterDungeon(di, true); }
  return _enterDungeon(di, free);
};
// 관문 2: 두 반쪽이 나란히 선다
const _buildRoom = buildRoom;
buildRoom = function (k) {
  _buildRoom(k);
  if (raidOn()) { const bs = mons.filter(m => m.def.raidBoss); if (bs.length === 2) { bs[0].x = 4; bs[0].z = -2.5; bs[1].x = 4; bs[1].z = 5.5; } RAID.room = -1; }
};
