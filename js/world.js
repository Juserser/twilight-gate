'use strict';
// 마을(야영지) · 던전: 지역 전환, 방 구성, 출구, 등불(하루 20판), 던전 선택 · 결과 창, 방 지도
// 던전은 방을 차례로 지나 마지막 방의 우두머리를 잡으면 끝난다. 숲 테두리는 그대로 두고 방 안의 물건 · 빛 · 안개만 바꾼다.

const DUNGEONS = [
  { id: 'edge', name: '황혼 숲 어귀', lv: 50, seed: 101, hpMul: 2.6, dmgMul: 1.15, desc: '숲으로 들어가는 길목. 그림자 늑대 무리와 뼈 까마귀가 길을 지킨다.', boss: '이끼 골렘',
    rooms: [{ mons: [['wolf', 2], ['crow', 1]] }, { mons: [['rotwood', 2], ['wolf', 1]] }, { mons: [['crow', 2], ['wolf', 2]] }, { boss: true, mons: [['golem', 1], ['wolf', 2]] }] },
  { id: 'root', name: '썩은 뿌리 골짜기', lv: 52, seed: 202, hpMul: 2.8, dmgMul: 1.25, desc: '죽은 나무뿌리가 땅을 뒤덮은 골짜기. 나무 정령과 골렘이 잠들어 있다.', boss: '이끼 골렘 둘',
    rooms: [{ mons: [['rotwood', 2], ['crow', 2]] }, { mons: [['golem', 1], ['rotwood', 1]] }, { mons: [['wolf', 3], ['crow', 2]] }, { mons: [['rotwood', 2], ['golem', 1]] }, { boss: true, mons: [['golem', 2]] }] },
  { id: 'throne', name: '시든 왕좌', lv: 55, seed: 303, hpMul: 2.9, dmgMul: 1.3, desc: '숲을 시들게 한 군주가 뿌리를 내린 곳. 끊을 수 있는 공격을 노려라.', boss: '시든 숲의 군주 모르그라스',
    rooms: [{ mons: [['wolf', 2], ['rotwood', 2]] }, { mons: [['golem', 1], ['crow', 3]] }, { mons: [['rotwood', 2], ['wolf', 2], ['crow', 1]] }, { boss: true, mons: [['boss', 1]] }] },
];
const PROG = { clears: {} };
const REGION = { look: {}, ground: {}, build: {}, under: {}, prefix: {}, update: [] };   // 던전별 클리어 기록 (다음 지역 해금)
const DUN = { on: false, d: null, di: 0, room: 0, cleared: false, time: 0, deaths: 0, exp: 0, kills: 0, objs: [], obs: [], occ: [], lights: [], fade: 0, fadeDir: 0, fadeFn: null, banner: null, gateArmed: true, downs: [false, false, false] };

// ---- 등불: 던전 한 판에 하나, 매일 20개로 다시 채워진다 ----
const LAMP_MAX = 20;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const LAMP = (() => { try { const v = JSON.parse(localStorage.getItem('twilight.lamp') || 'null'); if (v && v.day === today()) return v; } catch (e) {} return { n: LAMP_MAX, day: today() }; })();
function saveLamp() { try { localStorage.setItem('twilight.lamp', JSON.stringify(LAMP)); } catch (e) {} }
function lampLeft() { if (LAMP.day !== today()) { LAMP.day = today(); LAMP.n = LAMP_MAX; saveLamp(); } return LAMP.n; }

// ---- 던전 소품 ----
const DMAT = {
  tree: [1, 2, 3].map(s => { const m = litMat(tex(makeOak(s + 10).canvas()), 0.0016); m.color.setRGB(0.42, 0.34, 0.52); return m; }),
  pine: (() => { const m = litMat(tex(makePine(9).canvas()), 0.0012); m.color.setRGB(0.36, 0.32, 0.48); return m; })(),
  rock: [[1, 26, 18], [2, 16, 12], [5, 20, 14]].map(([s, w, h]) => { const m = litMat(tex(makeRock(s, w, h).canvas())); m.color.setRGB(0.62, 0.56, 0.72); return m; }),
  bones: litMat(tex((() => { const g = new Pix(16, 8, S); g.stamp(1, 1, ['..ww.....w.ww..', '.wWWw...wWwWWw.', '..ww..www.wwW..', '...wWWWww..ww..', '......w........', '..Ww.....wWW...'], { w: '#b8ae98', W: '#e6dec8' }); return g.outline(OUT).canvas(); })())),
  shroom: new THREE.MeshBasicMaterial({ map: tex((() => { const g = new Pix(10, 8, S); g.stamp(0, 0, ['..gG....', '.gGGg..gG', '..||..gGGg', '..||...||', '.......||'], { g: '#7a3ad8', G: '#d898ff', '|': '#c8b8d8' }); return g.canvas(); })()), alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.8, 1.6, 2.2) }),
};
const dunGroundTex = tex(makeGround(GX0, GZ0, GW, GD, false), { mip: true });
// 그룹 없이 장면에 바로 넣고, 방을 떠날 때 지운다
function dBB(mat, pw, ph, x, z, o = {}) { const m = addBB(mat, pw, ph, x, z, o); DUN.objs.push(m); return m; }
function clearRoom() {
  for (const m of DUN.objs) { scene.remove(m); const i = billboards.indexOf(m); if (i >= 0) billboards.splice(i, 1); }
  for (const l of DUN.lights) scene.remove(l);
  for (const o of DUN.obs) { const i = obstacles.indexOf(o); if (i >= 0) obstacles.splice(i, 1); }
  for (const o of DUN.occ) { const i = occluders.indexOf(o); if (i >= 0) occluders.splice(i, 1); }
  DUN.objs = []; DUN.obs = []; DUN.occ = []; DUN.lights = [];
}
function buildProps(seed, boss) {
  const r = rng(seed), obs = (x, z, rr) => { const o = { x, z, r: rr }; obstacles.push(o); DUN.obs.push(o); };
  // 안쪽 숲 경계: 시든 나무
  for (let i = 0; i < 9; i++) for (const sd of [-1, 1]) {
    const x = sd * (8.6 + r() * 1.6), z = -8 + i * 2.1 + r(), pine = r() < 0.3, s = 0.9 + r() * 0.3;
    if (sd < 0 && Math.abs(z - 1.5) < 2.2) continue; // 들어온 길
    if (sd > 0 && Math.abs(z - 1.5) < 2.4) continue; // 출구
    const m = pine ? dBB(DMAT.pine, 52, 100, x, z, { s }) : dBB(DMAT.tree[(r() * 3) | 0], 72, 98, x, z, { s });
    const oc = { mesh: m, r: pine ? 1.4 : 2.0, h: 6 * s }; occluders.push(oc); DUN.occ.push(oc); obs(x, z, 0.45);
  }
  // 엄폐용 바위 · 뼈 무더기 · 빛나는 버섯
  const n = boss ? 2 : 3 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) { const x = -5 + r() * 11, z = -6 + r() * 13, k = (r() * 3) | 0; if (Math.hypot(x + 8, z - 1.5) < 3) continue; dBB(DMAT.rock[k], [26, 16, 20][k], [18, 12, 14][k], x, z); obs(x, z, [0.8, 0.45, 0.6][k]); }
  for (let i = 0; i < 6; i++) dBB(DMAT.bones, 16, 8, -7 + r() * 15, -7 + r() * 15, { cast: false });
  for (let i = 0; i < 10; i++) { const x = (r() < 0.5 ? -1 : 1) * (6 + r() * 3), z = -8 + r() * 17; dBB(DMAT.shroom, 10, 8, x, z, { cast: false }); }
  for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xa060ff, 4, 7, 1.6); l.position.set(i ? 7.5 : -7, 0.8, -3 + r() * 8); scene.add(l); DUN.lights.push(l); }
}

// ---- 문: 마을의 던전 입구 · 방의 출구 ----
const gateRockMat = litMat(tex(makeRock(7, 14, 22).canvas()));
const swirlTex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 40; i++) { const a = i / 40 * TAU * 3, rr = 4 + i * 0.7; g.fillStyle = `rgba(255,255,255,${0.9 - i / 50})`; g.fillRect(32 + Math.cos(a) * rr - 2, 32 + Math.sin(a) * rr - 2, 4, 4); } return c; })());
function makeGate(x, z) {
  const parts = [], add = m => { parts.push(m); return m; };
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) add(addBB(gateRockMat, 14, 22, x, z + sd * 1.3, { y: k * 1.1, s: 0.8 - k * 0.08 }));
  add(addBB(gateRockMat, 14, 22, x, z, { y: 2.9, s: 0.9 }));
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshBasicMaterial({ map: swirlTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.2, 0.5, 2.2), fog: false }));
  sw.position.set(x, 1.5, z); scene.add(sw); billboards.push(sw); parts.push(sw);
  const light = new THREE.PointLight(0xb070ff, 0, 6, 1.6); light.position.set(x, 1.6, z); scene.add(light); parts.push(light);
  return { x, z, parts, sw, light, open: true };
}
function setGate(gt, open) { gt.open = open; gt.sw.visible = open; gt.light.intensity = open ? 6 : 0; }
function animGate(gt, dt) {
  if (!gt.open) return;
  gt.sw.rotation.z -= dt * 2.4; gt.sw.material.opacity = 0.75 + 0.2 * Math.sin(uTime.value * 4);
  if (Math.random() < dt * 25) { const a = Math.random() * TAU; glow.emit({ x: gt.x + Math.cos(a) * 0.3, y: 1.5 + Math.sin(a) * 1.2, z: gt.z + Math.sin(a) * 0.9, vx: -Math.cos(a) * 0.6, vy: -Math.sin(a) * 0.6, life: 0.8, c: [1.6, 0.6, 2.6], size: PX }); }
}
// 마을 입구는 야영지 동쪽, 마을 물건과 함께 숨는다
const townGate = makeGate(9.3, 2.4); townObjs.push(...townGate.parts);
{ const po = [{ x: 9.3, z: 1.1, r: 0.4 }, { x: 9.3, z: 3.7, r: 0.4 }]; obstacles.push(...po); townObs.push(...po); }
const exitGate = makeGate(9.6, 1.5); exitGate.parts.forEach(p => p.visible = false); setGate(exitGate, false);

// ---- 지역 전환 ----
const AREA_LOOK = {
  town: { sun: [0xffb27a, 2.6], hemi: [0x8a90d8, 0x3a2838, 1.25], fog: [0x4a3e6a, 30, 90], ground: [1, 1, 1] },
  dungeon: { sun: [0xd8b4ff, 2.9], hemi: [0x9a8ae0, 0x34243e, 1.7], fog: [0x342a4c, 24, 80], ground: [0.86, 0.8, 0.95] },
};
function setArea(a, region = 1) {
  AREA = a; const town = a === 'town', mon = !town && region !== 1, L = (!town && REGION.look[region]) || AREA_LOOK[a];
  for (const o of forestObjs) o.visible = !mon;
  for (const o of forestObs) { const i = obstacles.indexOf(o); if (!mon && i < 0) obstacles.push(o); if (mon && i >= 0) obstacles.splice(i, 1); }
  for (const o of forestOcc) { const i = occluders.indexOf(o); if (!mon && i < 0) occluders.push(o); if (mon && i >= 0) occluders.splice(i, 1); }
  under.material.color.set((mon && REGION.under[region]) || 0x1c3424);
  for (const o of townObjs) o.visible = town;
  for (const o of townObs) { const i = obstacles.indexOf(o); if (town && i < 0) obstacles.push(o); if (!town && i >= 0) obstacles.splice(i, 1); }
  for (const o of townOcc) { const i = occluders.indexOf(o); if (town && i < 0) occluders.push(o); if (!town && i >= 0) occluders.splice(i, 1); }
  exitGate.parts.forEach(p => p.visible = !town); if (!town) setGate(exitGate, false);
  sun.color.set(L.sun[0]); sun.intensity = L.sun[1]; hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  scene.fog.color.set(L.fog[0]); scene.fog.near = L.fog[1]; scene.fog.far = L.fog[2];
  ground.material.map = town ? groundTex : (mon && REGION.ground[region]) || dunGroundTex; ground.material.color.setRGB(...L.ground); ground.material.needsUpdate = true;
  for (const m of [...mons]) removeMon(m); spawners.length = 0; clearRoom(); clearMprojs();
  for (const p of [...projs]) { scene.remove(p.mesh); const i = billboards.indexOf(p.mesh); if (i >= 0) billboards.splice(i, 1); } projs.length = 0;
}
function placeParty(x, z, face) {
  party.forEach((c, i) => { c.x = x - (i === active ? 0 : 1.2); c.z = z + (i === active ? 0 : i === 0 || (active === 0 && i === 1) ? -1.3 : 1.3); c.face = face; c.kx = c.kz = 0; c.dash = 0; if (c.state === 'skill') endSkill(c); c.state = 'idle'; c.y = 0; });
  hawk.x = party[1].x; hawk.z = party[1].z; camTarget.set(party[active].x, 0, party[active].z);
}
function fadeTo(fn) { DUN.fadeDir = 1; DUN.fadeFn = fn; }

// ---- 던전 진행 ----
function enterDungeon(di, free) {
  if (!free) { if (lampLeft() <= 0) { toast('등불이 없습니다', '내일 다시 채워집니다', '#ff8a6a'); return; } LAMP.n--; saveLamp(); }
  toggleWin('wDun', false); toggleWin('wRes', false);
  const go = () => { setArea('dungeon', DUNGEONS[di].region); Object.assign(DUN, { on: true, d: (typeof diffDun === 'function' ? diffDun(di) : DUNGEONS[di]), di, room: 0, pots: 0, time: 0, deaths: 0, exp: 0, kills: 0, loot: [], downs: party.map(c => c.down) }); buildRoom(0); log(`[${DUN.d.name}]에 들어섰습니다. 남은 등불 ${LAMP.n}`, '시스템'); };
  if (free) go(); else fadeTo(go);
}
function buildRoom(k) {
  const D = DUN.d, R0 = D.rooms[k]; DUN.room = k; DUN.cleared = false;
  for (const m of [...mons]) removeMon(m); clearRoom();
  clearMprojs(); (REGION.build[D.region] || buildProps)(D.seed + k * 17, !!R0.boss);
  setGate(exitGate, false);
  placeParty(-6.8, 1.5, 1);
  const r = rng(D.seed * 7 + k), spots = [];
  for (const [kind, n] of R0.mons) for (let i = 0; i < n; i++) {
    let x, z, tries = 0;
    do { x = MON[kind].boss ? 4.5 : 0.5 + r() * 7.5; z = MON[kind].boss ? 1.5 : -6 + r() * 14; tries++; } while (tries < 20 && (spots.some(([a, b]) => Math.hypot(a - x, b - z) < 2) || obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1)));
    spots.push([x, z]); spawnMon(kind, x, z, { aggro: true, hpMul: MON[kind].boss ? D.hpMul * 0.6 : D.hpMul });
  }
  if (R0.boss) { const b = mons.find(m => m.def.boss) || mons.find(m => m.def.elite); DUN.banner = { t: 0, name: b ? b.def.name : D.boss, sub: `${D.name} · 마지막 방` }; }
  else DUN.banner = { t: 0, name: `${k + 1} / ${D.rooms.length}`, sub: D.name, small: true };
}
function finishDungeon() {
  const D = DUN.d, t = DUN.time, n = D.rooms.length;
  let g = t < n * 70 ? 0 : t < n * 110 ? 1 : 2; g = Math.max(g, DUN.deaths >= 3 ? 2 : DUN.deaths >= 1 ? 1 : 0);
  DUN.result = { grade: ['S', 'A', 'B'][g], t, deaths: DUN.deaths, exp: DUN.exp, kills: DUN.kills };
  PROG.clears[D.id] = true; PROG.clears[D.id + '@' + (D.diff || 0)] = true; saveGame();
  toast('던전 클리어', D.name, '#ffd040'); log(`[${D.name}] 클리어! ${DUN.result.grade} 등급`, '시스템');
  bossChest(() => toggleWin('wRes', true));
}
function leaveDungeon() { toggleWin('wRes', false); fadeTo(() => { DUN.on = false; setArea('town'); placeParty(6.6, 2.4, -1); DUN.gateArmed = false; }); }

function updateWorld(dt) {
  // 화면 페이드 (실제 시간 기준)
  if (DUN.fadeDir) {
    DUN.fade = clamp(DUN.fade + DUN.fadeDir * dt / 0.35, 0, 1);
    if (DUN.fadeDir > 0 && DUN.fade >= 1) { const fn = DUN.fadeFn; DUN.fadeFn = null; if (fn) fn(); DUN.fadeDir = -1; }
    else if (DUN.fadeDir < 0 && DUN.fade <= 0) DUN.fadeDir = 0;
  }
  if (DUN.banner) { DUN.banner.t += dt; if (DUN.banner.t > 2.6) DUN.banner = null; }
  const A = party[active];
  if (AREA === 'town') {
    animGate(townGate, dt);
    const near = Math.hypot(A.x - townGate.x, A.z - townGate.z) < 1.6;
    if (near && DUN.gateArmed && !DUN.fadeDir && !A.down) { DUN.gateArmed = false; toggleWin('wDun', true); }
    if (!near) DUN.gateArmed = true;
    return;
  }
  if (!DUN.on) return;
  if (!DUN.result || !DUN.cleared) DUN.time += dt;
  party.forEach((c, i) => { if (c.down && !DUN.downs[i]) DUN.deaths++; DUN.downs[i] = c.down; });
  // 보라 포자가 떠다닌다
  if (Math.random() < dt * 10) glow.emit({ x: -10 + Math.random() * 20, y: 0.2 + Math.random() * 2.5, z: -8 + Math.random() * 18, vy: 0.15, vx: (Math.random() - 0.5) * 0.3, life: 3, c: DUN.d.region === 3 ? [2.0, 1.2, 0.6] : DUN.d.region === 2 ? [0.6, 1.2, 1.8] : [1.0, 0.4, 1.6], size: PX, fadeIn: 0.8 });
  for (const fn of REGION.update) fn(dt);
  if (!DUN.cleared && !mons.some(m => m.state !== 'dead')) {
    DUN.cleared = true;
    if (DUN.room >= DUN.d.rooms.length - 1) finishDungeon();
    else { setGate(exitGate, true); toast('방 정리 완료', '동쪽 출구로 나아가세요', '#c8a8ff'); }
  }
  animGate(exitGate, dt);
  if (exitGate.open && !DUN.fadeDir && Math.hypot(A.x - exitGate.x, A.z - exitGate.z) < 1.4) fadeTo(() => buildRoom(DUN.room + 1));
}

// ---- 화면 (HUD 캔버스): 페이드 · 방 이름 띄우기 ----
function drawWorldHUD(g, w, h) {
  for (const fn of REGION.hud || []) fn(g, w, h);
  const b = DUN.banner;
  if (b) {
    const a = Math.min(1, b.t / 0.3) * Math.min(1, (2.6 - b.t) / 0.5), y = h * 0.3;
    if (!b.small) { g.fillStyle = `rgba(0,0,0,${0.55 * a})`; g.fillRect(0, y - 46, w, 84); g.fillStyle = `rgba(255,190,90,${0.8 * a})`; g.fillRect(0, y - 46, w, 2); g.fillRect(0, y + 36, w, 2); }
    txt(b.name, w / 2, y, b.small ? 30 : 38, b.small ? '#e8d8ff' : '#ffd890', 'center', a);
    txt(b.sub, w / 2, y + (b.small ? 26 : 28), 14, '#c8b8a0', 'center', a);
  }
  // 출구가 열리면 방향 화살표 (화면 밖이면 가장자리에)
  if (DUN.on && exitGate.open && !DUN.fadeDir) {
    const v = new THREE.Vector3(exitGate.x, 1.6, exitGate.z).project(camera), behind = v.z > 1;
    let sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h; if (behind) { sx = w - sx; sy = h - sy; }
    const m = 70, out = behind || sx < m || sx > w - m || sy < m || sy > h - m;
    const cx = clamp(sx, m, w - m), cy = clamp(sy, m, h - m * 2.4), a = Math.atan2(sy - h / 2, sx - w / 2), p = 0.6 + 0.4 * Math.sin(uTime.value * 6);
    g.save(); g.translate(cx, cy); if (out) g.rotate(a); else g.rotate(Math.PI / 2);
    g.fillStyle = `rgba(200,150,255,${p})`; g.beginPath(); g.moveTo(18, 0); g.lineTo(-6, -12); g.lineTo(-2, 0); g.lineTo(-6, 12); g.closePath(); g.fill(); g.restore();
    txt('출구', cx, cy + (out ? 28 : -24), 14, '#e8d8ff', 'center', p);
  }
  if (DUN.fade > 0) { g.fillStyle = `rgba(4,2,8,${DUN.fade})`; g.fillRect(0, 0, w, h); }
}
// 미니맵 자리에 방 지도
function drawRoomMap(g, W) {
  g.fillStyle = '#0e0a16'; g.fillRect(0, 0, W, W);
  const D = DUN.d, n = D.rooms.length, cw = 26, gap = 8, x0 = (W - (n * cw + (n - 1) * gap)) / 2, y0 = W / 2 - cw / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap), cur = i === DUN.room, done = i < DUN.room || (cur && DUN.cleared), boss = !!D.rooms[i].boss;
    if (i < n - 1) { g.fillStyle = done ? '#8a6ab8' : '#3a2e4a'; g.fillRect(x + cw, y0 + cw / 2 - 2, gap, 4); }
    g.fillStyle = cur ? '#c8a0ff' : done ? '#4a3a62' : '#1e1828'; g.fillRect(x, y0, cw, cw);
    g.strokeStyle = boss ? '#ff7a4a' : cur ? '#ffffff' : '#5a4a72'; g.lineWidth = cur ? 2 : 1; g.strokeRect(x + 0.5, y0 + 0.5, cw - 1, cw - 1);
    if (boss) { g.fillStyle = cur ? '#5a1010' : '#ff7a4a'; g.font = 'bold 13px Galmuri11, sans-serif'; g.textAlign = 'center'; g.fillText('☠', x + cw / 2, y0 + cw / 2 + 5); }
    else if (cur) { g.fillStyle = '#ffffff'; g.fillRect(x + cw / 2 - 3, y0 + cw / 2 - 3, 6, 6); }
  }
  g.fillStyle = '#c8b8e0'; g.font = '11px Galmuri11, sans-serif'; g.textAlign = 'center';
  g.fillText(D.name, W / 2, 40); g.fillText(`방 ${DUN.room + 1} / ${n}`, W / 2, W - 34);
  const tm = Math.floor(DUN.time); g.fillText(`${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, W / 2, W - 18);
  g.textAlign = 'left';
}

// ---- 창: 던전 선택 · 결과 · 던전 막대 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wDun{left:calc(50% - 300px);top:110px;width:600px}
#wDun .lamp{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:#e8c878}
#wDun .lamp i{display:inline-block;width:9px;height:14px;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,#fff0b0,#f0a030 60%,#8a4a10);box-shadow:0 0 6px rgba(255,180,60,.8)}
#wDun .lamp i.off{background:#2a2420;box-shadow:none}
#wDun .dn{display:flex;gap:12px;align-items:center;padding:10px;margin-bottom:8px;background:linear-gradient(90deg,rgba(60,40,90,.45),rgba(20,16,30,.6));border:1px solid #4a3a62;border-radius:3px}
#wDun .dn b{font-size:15px;color:#e8d8ff;font-weight:normal}#wDun .dn .lv{color:#ffd890;font-size:11px;margin-left:6px}
#wDun .dn p{margin:4px 0 0;font-size:11px;color:#a89ab8;line-height:1.5}
#wDun .dn .go{margin-left:auto;padding:8px 18px;font:inherit;font-size:12px;cursor:pointer;background:linear-gradient(180deg,#c8a0ff,#6a3aa8);border:1px solid #000;color:#140a20;border-radius:3px;white-space:nowrap}
#wDun .dn .go[disabled]{filter:grayscale(1) brightness(.5);cursor:default}
#wRes{left:calc(50% - 210px);top:150px;width:420px;text-align:center}
#wRes .gr{font-size:64px;line-height:1;margin:6px 0 2px;text-shadow:0 0 18px currentColor}
#wRes .st{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin:12px 20px;font-size:12px;text-align:left}#wRes .st span{color:#a89ab8}#wRes .st b{font-weight:normal;color:#fff;text-align:right}
#wRes .loot{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 10px}#wRes .li{display:flex;align-items:center;gap:6px;padding:3px 8px 3px 3px;border:1px solid;background:rgba(0,0,0,.35);font-size:11px}#wRes .li img{width:28px;height:28px;image-rendering:pixelated}
#wRes .bt{display:flex;gap:8px;justify-content:center;margin-top:14px}#wRes button{font:inherit;font-size:12px;padding:8px 16px;cursor:pointer;border-radius:3px;border:1px solid #000}
#wRes .b1{background:linear-gradient(180deg,#e8c070,#9a6a24);color:#1a1208}#wRes .b2{background:#16161c;border-color:#4a4030;color:#d8d0c0}
.dunBar{position:absolute;left:12px;top:212px;display:none;align-items:center;gap:10px;padding:6px 10px;font-size:12px;color:#e8d8ff;background:linear-gradient(90deg,rgba(30,20,46,.92),rgba(14,10,22,.85));border:1px solid #4a3a62;border-radius:3px;pointer-events:auto}
.dunBar button{font:inherit;font-size:11px;padding:3px 8px;cursor:pointer;background:#1e1626;color:#c8b8d8;border:1px solid #5a4a72;border-radius:2px}
` }));
const dunBd = makeWin('wDun', '던전 입구'), resBd = makeWin('wRes', '던전 클리어');
const dunBar = mk('div', 'dunBar lp', '<span class="nm"></span><button>던전 나가기</button>', uiRoot);
dunBar.querySelector('button').onclick = () => { if (DUN.on) leaveDungeon(); };
function renderDunWin() {
  const n = lampLeft();
  dunBd.innerHTML = `<div class="lamp">등불 ${n} / ${LAMP_MAX} ${[...Array(LAMP_MAX)].map((_, i) => `<i class="${i < n ? '' : 'off'}"></i>`).join('')}</div>
    <div class="dim" style="font-size:11px;margin:-4px 0 10px">던전에 한 번 들어갈 때마다 등불 하나를 씁니다. 매일 자정에 다시 채워집니다.</div>` +
    DUNGEONS.map((d, i) => `<div class="dn"><div><b>${d.name}</b><span class="lv">Lv.${d.lv} · 방 ${d.rooms.length}개</span><p>${d.desc}<br>우두머리: ${d.boss}</p></div><button class="go" data-i="${i}" ${n > 0 ? '' : 'disabled'}>입장</button></div>`).join('');
  dunBd.querySelectorAll('.go').forEach(b => b.onclick = () => enterDungeon(+b.dataset.i));
}
function renderResWin() {
  const r = DUN.result || { grade: '-', t: 0, deaths: 0, exp: 0, kills: 0 }, col = { S: '#ffd040', A: '#c8a0ff', B: '#a8c8e0' }[r.grade] || '#fff';
  const mm = Math.floor(r.t / 60), ss = String(Math.floor(r.t % 60)).padStart(2, '0');
  resBd.innerHTML = `<div class="dim">${DUN.d ? DUN.d.name : ''}</div><div class="gr" style="color:${col}">${r.grade}</div><div class="dim">등급</div>
    <div class="st"><span>걸린 시간</span><b>${mm}:${ss}</b><span>처치</span><b>${r.kills}</b><span>쓰러진 횟수</span><b>${r.deaths}</b><span>경험치</span><b>+${(r.exp * 100).toFixed(1)}%</b><span>남은 등불</span><b>${lampLeft()} / ${LAMP_MAX}</b></div>
    <div class="loot">${(DUN.loot || []).map(it => `<div class="li" style="border-color:${GRADE[it.grade]}"><img src="${itemIconURL(it)}"><span style="color:${GRADE[it.grade]}">${it.name}</span></div>`).join('') || '<span class="dim">얻은 장비 없음</span>'}</div>
    <div class="bt"><button class="b2" data-a="town">마을로</button><button class="b1" data-a="again" ${lampLeft() > 0 ? '' : 'disabled'}>다시 도전 (등불 1)</button></div>`;
  resBd.querySelector('[data-a=town]').onclick = leaveDungeon;
  resBd.querySelector('[data-a=again]').onclick = () => { if (lampLeft() > 0) { toggleWin('wRes', false); enterDungeon(DUN.di); } };
}
function uiWorld() {
  dunBar.style.display = DUN.on ? 'flex' : 'none';
  if (DUN.on) { const nm = `${DUN.d.name} · 방 ${DUN.room + 1}/${DUN.d.rooms.length}`; const el = dunBar.querySelector('.nm'); if (el.textContent !== nm) el.textContent = nm; }
}
