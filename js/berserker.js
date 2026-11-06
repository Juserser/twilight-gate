'use strict';
// 광전사 스킬 · 이펙트 도우미

// ===================================================================
// 광전사 스킬 1차~4차 (각 2개)
//  참고: 로스트아크 버서커(휠윈드/숄더 차지/마운틴 크래쉬/템페스트 슬래쉬/레드 더스트/폭주/각성기)
//        메이플 히어로(브랜디쉬/레이징 블로우/라이징 레이지/발할라/월드 리버) - 이름·그림·연출은 새로 만듦
// ===================================================================
const SKILLS = {
  Q: { tier: 1, name: '삼연참', full: '삼연참' },
  E: { tier: 1, name: '어깨치기', full: '돌진 어깨치기' },
  R: { tier: 2, name: '폭풍회전', full: '폭풍 회전참 (누르고 있기)' },
  F: { tier: 2, name: '대지분쇄', full: '대지 분쇄' },
  Z: { tier: 3, name: '격노난무', full: '격노 난무' },
  X: { tier: 3, name: '철혈반격', full: '철혈 반격' },
  C: { tier: 4, name: '파천일격', full: '파천일격 (누르고 있다 놓기)' },
  V: { tier: 4, name: '종말의대검', full: '종말의 대검' },
  G: { tier: 0, name: '광폭화', full: '광폭화 (직업 게이지)' },
};
Object.assign(SKILLS.Q, { cd: 4 }); Object.assign(SKILLS.E, { cd: 6 }); Object.assign(SKILLS.R, { cd: 8 }); Object.assign(SKILLS.F, { cd: 9 });
Object.assign(SKILLS.Z, { cd: 10 }); Object.assign(SKILLS.X, { cd: 9 }); Object.assign(SKILLS.C, { cd: 16 }); Object.assign(SKILLS.V, { cd: 60 }); Object.assign(SKILLS.G, { cd: 0 });
// 계수(%) → 피해. 기본 공격 1타 100% 기준
const P = pct => pct * 0.3;
const BZ_DUR = 20; // 광폭화 15초 + 4차 효과 5초
const SKILL_KEYS = ['Q', 'E', 'R', 'F', 'Z', 'X', 'C', 'V'];
let camZoom = 0, camZoomT = 0, camLift = 0, flashW = 0, flashCol = '255,236,230', redW = 0;
let timeScale = 1, slowT = 0, cine = 0, cineAmt = 0, dimW = 0, dimT = 0, noCD = false, cutin = null;

// ---- 이펙트 관리 ----
const fxs = [];
function addFx(obj, life, upd, bb) { scene.add(obj); if (bb) billboards.push(obj); const f = { obj, t: 0, life, upd, bb }; fxs.push(f); return f; }
function disposeObj(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); }); }
function updateFxs(dt) {
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]; f.t += dt; if (f.upd) f.upd(f, dt);
    if (f.t >= f.life) { scene.remove(f.obj); if (f.bb) billboards.splice(billboards.indexOf(f.obj), 1); disposeObj(f.obj); fxs.splice(i, 1); }
  }
}
const addMat = (r, g, b, op, map) => new THREE.MeshBasicMaterial({ map: map || null, color: new THREE.Color(r, g, b), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
function shockwave(x, z, R, col, life, y = 0.08) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 64).rotateX(-Math.PI / 2), addMat(...col, 0.9));
  m.position.set(x, y, z);
  addFx(m, life, f => { const k = f.t / f.life, s = R * (0.12 + 0.88 * (1 - (1 - k) ** 3)); m.scale.set(s, 1, s); m.material.opacity = 0.9 * (1 - k); });
}

// ---- 검기(초승달) 텍스처: 흰색으로 그리고 색은 재질로 입힌다 ----
function makeArcFrames() {
  const out = [];
  for (let f = 0; f < 5; f++) {
    const W = 64, H = 64, g = new Pix(W, H, S), cx = 10, cy = 32, Ro = 30;
    const head = -70 + Math.min(1, (f + 1) / 3) * 160, tail = -70 + Math.max(0, (f - 1) / 3) * 160;
    eachPx(g, 0, 0, W, H, (px, py, X, Y) => {
      const dx = X - cx, dy = Y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
      if (a < tail || a > head) return;
      const u = (a - tail) / Math.max(1, head - tail);
      const thick = 2 + 10 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.5) * (u > 0.93 ? (1 - u) / 0.07 : 1);
      if (r > Ro || r < Ro - thick) return;
      if (u < 0.4 && bay(px, py) > u / 0.4) return;
      const e = (Ro - r) / thick;
      let c = e < 0.16 ? '#ffffff' : e < 0.42 ? '#d8e2ee' : e < 0.72 ? '#8a96aa' : '#4a5468';
      if (hash2(px >> 1, Math.floor(r * 3)) < 0.06 && e > 0.25) c = '#ffffff';
      g.fset(px, py, c);
    });
    out.push(tex(g.canvas()));
  }
  return out;
}
const ARC = makeArcFrames();
function spawnSlash(o) {
  const size = o.size || 3, face = o.face || 1, fv = o.flipV ? -1 : 1, life = o.life || 0.22;
  const mat = new THREE.MeshBasicMaterial({ map: ARC[0], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(...o.color), fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.position.x = (0.5 - 10 / 64) * size;
  const pivot = new THREE.Group(); pivot.add(mesh);
  pivot.scale.set(face, fv, 1); pivot.rotation.z = (o.rot || 0) * Math.PI / 180 * face * fv;
  const root = new THREE.Group(); root.add(pivot); root.position.set(o.x, o.y, o.z);
  addFx(root, life, f => {
    const k = f.t / life; mat.map = ARC[Math.min(4, Math.floor(k * 5))];
    if (o.grow) pivot.scale.set(face * (1 + k * o.grow), fv * (1 + k * o.grow), 1);
    if (o.follow) root.position.set(o.follow.x, o.y + (o.follow.y || 0), o.follow.z);
  }, true);
}
function spawnStreak(c, face) {
  const len = 0.8 + Math.random() * 1.4, m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.05), addMat(1.8, 1.7, 1.6, 0.85));
  const root = new THREE.Group(); root.add(m); root.position.set(c.x, 0.3 + Math.random() * 2.4, c.z);
  const off = (Math.random() - 0.3) * 1.6;
  addFx(root, 0.2, f => { const k = f.t / 0.2; m.position.x = -face * (off + k * 3); m.material.opacity = 0.85 * (1 - k); }, true);
}
const pillarTex = (() => {
  const c = document.createElement('canvas'); c.width = 8; c.height = 64; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 64); g.fillStyle = 'rgba(255,255,255,.3)'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 8, 1);
  const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; return t;
})();
function pillar(x, z, r, h, col, life) {
  const mat = addMat(...col, 1, pillarTex), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.2, h, 32, 1, true), mat);
  addFx(m, life, f => { const k = f.t / life, sy = Math.min(1, k * 7); m.scale.set(1 - k * 0.65, sy, 1 - k * 0.65); m.position.set(x, h / 2 * sy, z); mat.opacity = 1 - k * k; });
}
function makeCrack(seed) {
  const r = rng(seed), N = 64, g = new Pix(N, N, S), c = N / 2;
  const walk = (x, y, a, len, w) => {
    for (let i = 0; i < len; i++) {
      a += (r() - 0.5) * 0.7;
      const nx = x + Math.cos(a), ny = y + Math.sin(a);
      for (let o = -w; o <= w; o += 0.5) g.line(x + o * 0.3, y + o * 0.3, nx + o * 0.3, ny + o * 0.3, Math.abs(o) < w * 0.45 ? '#ffe2a0' : '#ff6a20');
      x = nx; y = ny; w = Math.max(0.5, w * 0.96);
      if (r() < 0.08 && len - i > 6) walk(x, y, a + (r() < 0.5 ? 0.9 : -0.9), (len - i) * 0.6, w * 0.7);
    }
  };
  for (let i = 0; i < 9; i++) walk(c, c, i / 9 * TAU + r() * 0.4, 14 + r() * 14, 1.6);
  return g.canvas();
}
const crackTexs = [1, 2, 3].map(s => tex(makeCrack(s)));
function crackDecal(x, z, size, life, hot = [2.4, 1.4, 0.7]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crackTexs[(Math.random() * 3) | 0], transparent: true, alphaTest: 0.02, depthWrite: false, color: new THREE.Color(...hot), fog: false }));
  m.position.set(x, 0.04 + Math.random() * 0.01, z); m.rotation.y = Math.random() * TAU; m.renderOrder = 1;
  addFx(m, life, f => { const k = f.t / life; m.material.opacity = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45; m.material.color.setRGB(hot[0] * (1 - k * 0.7), hot[1] * (1 - k * 0.8), hot[2] * (1 - k * 0.8)); });
}
function debris(x, z, n, pow) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = (1.5 + Math.random() * 4) * pow;
    soft.emit({ x: x + Math.cos(a) * 0.5, y: 0.2, z: z + Math.sin(a) * 0.4, vx: Math.cos(a) * sp, vy: (4 + Math.random() * 5) * pow, vz: Math.sin(a) * sp * 0.8, grav: 16, drag: 0.3, life: 1.4 + Math.random() * 0.8, c: lc(['#5e5c72', '#82849a', '#6e5038', '#4a3a2e'][(Math.random() * 4) | 0]), size: PX * (2 + Math.random() * 2.5), upd: settle });
  }
}
function embers(x, y, z, n, col, sp = 5) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = (1 + Math.random()) * sp * 0.5; glow.emit({ x, y, z, vx: Math.cos(a) * s, vy: 1 + Math.random() * sp * 0.8, vz: Math.sin(a) * s * 0.7, grav: 7, drag: 1.2, life: 0.6 + Math.random() * 0.6, c: col, size: PX * 1.3 }); }
}
function impact(x, z, R, col) {
  shockwave(x, z, R, col, 0.5); shockwave(x, z, R * 0.6, [2, 2, 2], 0.3, 0.1);
  crackDecal(x, z, R * 1.8, 2.6); debris(x, z, 36, 1); embers(x, 0.3, z, 30, [3, 1.4, 0.4], 6);
  dustRing(x, z, 40, 8, '#9c8466');
  fxFlash = 2; fxLight.color.set('#ff9a40'); fxLight.position.set(x, 1, z);
}

// 거대 검 (종말의 대검)
function makeBigSword() {
  const W = 40, H = 150, g = new Pix(W, H, S), cx = 20;
  eachPx(g, 0, 0, W, H, (px, py, X, Y) => {
    let c = null;
    if (Y > 30 && Y < 147) { const t = (Y - 30) / 117, hw = 8 * (1 - t ** 4) + 0.6, dx = X - cx; if (Math.abs(dx) < hw) { const e = Math.abs(dx) / hw; c = e > 0.84 ? '#ffffff' : Math.abs(dx) < 0.8 ? '#ffe0d0' : e > 0.55 ? '#ff9a8a' : '#c83838'; if (hash2(px >> 1, py >> 2) < 0.04) c = '#ffd0c0'; } }
    if (Y >= 23 && Y <= 30 && Math.abs(X - cx) < 19 - Math.abs(Y - 26.5) * 1.2) c = Math.abs(Y - 26.5) < 1 ? '#fff0e0' : '#ffb090';
    if (Y >= 6 && Y < 23 && Math.abs(X - cx) < 2.6) c = Math.floor(Y) % 4 < 2 ? '#ff7060' : '#b83030';
    if (Math.hypot(X - cx, Y - 4) < 4) c = '#ffd8c8';
    if (c) g.fset(px, py, c);
  });
  return tex(g.canvas());
}
const bigSwordTex = makeBigSword();

// 광폭화 오라
const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.6, 0.15, 0.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
aura.scale.set(3.2, 4.2, 1); aura.visible = false; scene.add(aura);

// ---- 스킬 아이콘 ----
function makeIcon(kind) {
  const g = new Pix(22, 22, 2);
  eachPx(g, 0, 0, 22, 22, (px, py, X, Y) => {
    const dx = X - 11, dy = Y - 11, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let c = null;
    if (kind === 'Q') for (let i = -1; i <= 1; i++) { if (Math.abs(dx - dy * 0.8 - i * 6) < 1.3 - Math.abs(dy) * 0.08 && Math.abs(dy) < 8) c = i === 0 ? '#ffffff' : '#a8d4ff'; }
    if (kind === 'E') { for (const o of [-4, 3]) if (Math.abs(Math.abs(dy) - (o + 4 - dx)) < 1.3 && dx < o + 4 && Math.abs(dy) < 7) c = '#ffb060'; if (dx < -5 && Math.abs(dy) < 6 && Math.floor(Y) % 3 === 0) c = '#ffe0b0'; }
    if (kind === 'R') { const sp = (a / TAU + r / 9) % 1; if (r < 10 && r > 2 && (sp + 1) % 1 < 0.22) c = r > 7 ? '#ffffff' : r > 4.5 ? '#bff0ff' : '#5ab8e8'; }
    if (kind === 'F') { if (Y > 14) c = Y > 18 ? '#3a2a20' : '#5e4430'; if (Math.abs(dx + Math.sin(Y * 0.9) * 1.5) < 1 && Y > 12) c = '#ffb040'; if (Y < 13 && Math.abs(dx) < 1.4 && Y > 2) c = '#cad2e2'; if (Y < 13 && Y > 10 && Math.abs(dx) < 4) c = '#7e5634'; }
    if (kind === 'Z') { if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 1.5 && r < 9.5) c = r < 3 ? '#ffffff' : '#ff5a4a'; if (r > 9 && r < 10.2) c = '#7a1a1a'; }
    if (kind === 'X') { const md = Math.abs(dx) + Math.abs(dy) * 0.8; if (md < 9.6 && md > 7.6) c = '#d8ecff'; else if (md <= 7.6) c = (Math.floor(X) + Math.floor(Y)) % 3 ? '#1a2a48' : '#28406a'; if (Math.abs(dx) < 1.1 && Y > 3 && Y < 19) c = Y < 7 ? '#ffffff' : '#9ad0ff'; if (Y > 13.5 && Y < 15 && Math.abs(dx) < 3.6) c = '#e8c070'; }
    if (kind === 'C') { if (Y > 15) c = Y > 18 ? '#2a2018' : '#4a3828'; if (Y > 14 && Math.abs(dx + Math.sin(Y * 1.3) * 1.4) < 1.1) c = '#ffd060'; if (Y < 15 && Y > 4 && Math.abs(dx) < 2.8 * (1 - (Y - 4) / 12) + 0.5) c = Math.abs(dx) < 0.7 ? '#fff6d0' : '#e8b040'; if (Y >= 2 && Y <= 4 && Math.abs(dx) < 5) c = '#c8a050'; if (Y < 2 && Math.abs(dx) < 1) c = '#8a6a30'; }
    if (kind === 'G') { const t = (Y - 3) / 18, hw = 8 * Math.sin(Math.min(1, t) * Math.PI) * (0.75 + 0.25 * Math.sin(X * 1.7)); if (t > 0 && Math.abs(dx) < hw) c = t < 0.35 ? '#ffd27a' : t < 0.65 ? '#ff6a3a' : '#a01818'; if (Y > 12 && Y < 14 && (Math.abs(dx + 3) < 1 || Math.abs(dx - 3) < 1)) c = '#1a0000'; }
    if (kind === 'V') { if (r < 10.5) c = r < 6 ? '#4a0a0a' : '#2a0606'; if (Y > 7 && Y < 21 && Math.abs(dx) < 2.6 * (1 - (Y - 7) / 15) + 0.4) c = Math.abs(dx) > 1.2 ? '#ffffff' : '#ff6a5a'; if (Y >= 5 && Y <= 7 && Math.abs(dx) < 6) c = '#ffb090'; if (Y < 5 && Y > 1 && Math.abs(dx) < 1) c = '#ff7060'; }
    if (c) g.fset(px, py, c);
  });
  return g.outline('#0c0814').canvas();
}
const ICONS = {}; [...SKILL_KEYS, 'G'].forEach(k => ICONS[k] = makeIcon(k));

// ---- 공통 도우미 ----
const once = (sk, key, cond, fn) => { if (cond && !sk[key]) { sk[key] = true; fn(); } };
function fwdPt(c, d) { const [rx, rz] = camRight(); return [c.x + rx * c.face * d, c.z + rz * c.face * d]; }
function stepFwd(c, d) { const [rx, rz] = camRight(); c.x += rx * c.face * d; c.z += rz * c.face * d; collide(c, 0.35); }
function berserkCol(col) { return party[0].berserk > 0 ? [col[0] * 0.6 + 1.6, col[1] * 0.35, col[2] * 0.3] : col; }
function launch(tg, v) {
  const m = tg.mon;
  if (m) { if (m.def.heavy || m.state === 'dead') return; m.vlift = Math.max(m.vlift, v); if (m.state === 'wind') monInterrupt(m, true); }
  else if (tg === targets[0]) dummyVel += 10;
}
function knock(tg, fx, fz, p) {
  const m = tg.mon;
  if (m && !m.def.heavy && (m.state === 'chase' || m.state === 'recover' || m.state === 'idle')) {
    const dx = m.x - fx, dz = m.z - fz, d = Math.hypot(dx, dz) || 1;
    m.x += dx / d * p; m.z += dz / d * p; collide(m, m.def.r * 0.8);
  }
}
function hitArea(c, o) {
  const [rx, rz] = camRight(), f = c.face, cx = o.cx ?? c.x, cz = o.cz ?? c.z, RR = o.range * (1 + ((curTri(c) || {}).range || 0));
  let n = 0;
  for (const tg of targets) {
    if (!tg.alive() || tg.y() > (o.maxY ?? 4)) continue;
    const dx = tg.x - cx, dz = tg.z - cz;
    if (Math.hypot(dx, dz) > RR + tg.r) continue;
    if (o.cone && (dx * rx + dz * rz) * f < -0.4) continue;
    for (let k = 0; k < (o.hits || 1); k++) hitTarget(tg, o.dmg, cx, cz, o.color || '#ffe0c0', { stack: (o.stack0 || 0) + k, stop: o.stop, shake: o.shake, quiet: k > 0, sg: o.sg });
    if (o.launch) launch(tg, o.launch);
    if (o.kb) knock(tg, cx, cz, o.kb);
    n++;
  }
  return n;
}

// ---- 새 스킬용 도우미 ----
// 철혈 반격 방패 문양
const shieldTex = (() => {
  const g = new Pix(32, 32, S);
  eachPx(g, 0, 0, 32, 32, (px, py, X, Y) => {
    const md = Math.abs(X - 16) + Math.abs(Y - 16) * 0.78;
    if (md < 15 && md > 12.6) g.fset(px, py, '#ffffff');
    else if (md <= 12.6 && md > 11.2) g.fset(px, py, '#7ab0ff');
    else if (md <= 11.2 && (Math.floor(X) + Math.floor(Y)) % 4 === 0) g.fset(px, py, '#4a78c8');
    if (md < 4 && Math.abs(X - 16) < 1) g.fset(px, py, '#ffffff');
  });
  return tex(g.canvas());
})();
// 파천일격 바위 기둥
const spikeTex = (() => {
  const g = new Pix(12, 22, S);
  eachPx(g, 0, 0, 12, 22, (px, py, X, Y) => {
    const hw = 5.2 * Math.min(1, Y / 18) + 0.4, cx = 6 + (Y < 9 ? (9 - Y) * 0.18 : 0);
    if (Math.abs(X - cx) < hw) g.fset(px, py, X < cx - hw * 0.3 ? '#8a8496' : X > cx + hw * 0.4 ? '#3e3a48' : (hash2(px >> 2, py >> 2) < 0.2 ? '#5a5466' : '#6a6476'));
  });
  return tex(g.outline('#141018').canvas());
})();
function rockSpike(x, z, h, life) {
  const g = new THREE.PlaneGeometry(h * 0.55, h); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: spikeTex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.4, 1.5), emissive: new THREE.Color(0.12, 0.07, 0.04) })); m.castShadow = true;
  addFx(m, life, f => { const k = f.t / life, up = Math.min(1, k * 9), dn = k > 0.75 ? (k - 0.75) / 0.25 : 0; m.position.set(x, -h + h * up - h * dn, z); }, true);
}
// 막는 순간
function parry(c, fx, fz) {
  const sk = c.sk; sk.par = sk.t; c.inv = Math.max(c.inv, 0.9);
  const [rx, rz] = camRight(), sd = (fx - c.x) * rx + (fz - c.z) * rz; if (Math.abs(sd) > 0.1) c.face = sd > 0 ? 1 : -1;
  slowT = 0.25; flashW = 0.5; flashCol = '230,240,255'; camZoomT = -1.2; hitstop = Math.max(hitstop, 0.1); shake = Math.max(shake, 0.45);
  const [px, pz] = fwdPt(c, 0.8);
  shockwave(px, pz, 2.6, [1.1, 1.25, 1.5], 0.3, 1.3); shockwave(c.x, c.z, 2.2, [0.9, 1.1, 1.5], 0.3);
  embers(px, 1.3, pz, 30, [2.2, 2.3, 2.8], 8);
  fxFlash = 2; fxLight.color.set('#cfe4ff'); fxLight.position.set(px, 1.3, pz);
  floaters.push({ x: c.x, y: 3, z: c.z, t: 0, text: '반격!', crit: false, big: true, vx: 0, color: '#bfe0ff' });
  log('철혈 반격 성공!', '전투');
}

// ---- 스킬 구현 ----
const SK = {
  // 기본: 돌진 찌르기 (대시 후 0.3초 안 좌클릭, 2초에 한 번) 150%, 2m 관통
  THR: {
    init(c, sk) { sk.hit = new Set(); spawnSlash({ x: c.x, y: 1.2, z: c.z, size: 3.6, rot: 0, face: c.face, color: berserkCol([1.6, 1.8, 2.4]), life: 0.2, follow: c }); },
    update(c, sk, dt, F) {
      const T = sk.t;
      if (T < 0.14) {
        stepFwd(c, 2 * dt / 0.14); if (Math.random() < dt * 80) spawnStreak(c, c.face);
        for (const tg of targets) if (tg.alive() && !sk.hit.has(tg) && tg.y() < 2 && Math.hypot(tg.x - c.x, tg.z - c.z) < tg.r + 1.4) { sk.hit.add(tg); hitTarget(tg, P(150), c.x, c.z, '#cfe8ff', { stop: 0.05, shake: 0.18 }); }
      }
      return { f: T < 0.05 ? F.atk[0] : F.atk[2], done: T > 0.32 };
    },
  },
  // 기본: 낙하 내려찍기 (공중 좌클릭) 200%, 반경 2m, 띄운 적을 다운
  AIR: {
    update(c, sk, dt, F) {
      const T = sk.t;
      if (sk.land === undefined) {
        sk.vy = (sk.vy || 0) - 60 * dt; c.y = Math.max(0, c.y + Math.min(-4, sk.vy) * dt);
        for (let i = 0; i < 2; i++) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.9, y: c.y + 0.4 + Math.random() * 1.6, z: c.z, vy: 7, life: 0.1, c: [1.6, 1.8, 2.2], size: PX });
        if (c.y <= 0) {
          sk.land = T;
          shockwave(c.x, c.z, 2.4, [1.8, 1.9, 2.2], 0.35); crackDecal(c.x, c.z, 2.6, 1.5, [1.6, 1.8, 2.4]); dustRing(c.x, c.z, 20, 4, '#9c8466'); debris(c.x, c.z, 10, 0.6);
          shake = Math.max(shake, 0.35);
          for (const m of mons) if (m.lift > 0.3 && Math.hypot(m.x - c.x, m.z - c.z) < 3) m.vlift = Math.min(m.vlift, -14);
          hitArea(c, { range: 2, dmg: P(200), sg: 10, stop: 0.07, shake: 0.35, maxY: 6, color: '#cfe8ff' });
        }
        return { f: F.atk[0], done: T > 1.5 };
      }
      return { f: F.atk[2], done: T - sk.land > 0.3 };
    },
  },
  // 3차 X 철혈 반격: 0.8초 막기. 맞으면 슬로모션 → 상승 검기 900%×2 + 바닥을 달리는 빛의 파도. 안 맞으면 밀쳐내기 300%
  X: {
    init(c, sk) {
      const [rx, rz] = camRight();
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), addMat(1.2, 1.6, 2.4, 0, shieldTex));
      m.position.set(c.x + rx * c.face * 0.75, 1.3, c.z + rz * c.face * 0.75 + 0.05);
      addFx(m, 1.4, f => { const done = sk.par !== undefined || sk.fail; m.material.opacity = done ? m.material.opacity * 0.82 : Math.min(0.85, sk.t * 9) * (0.75 + 0.25 * Math.sin(sk.t * 30)); }, true);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.1, 4).rotateX(-Math.PI / 2), addMat(1.0, 1.4, 2.2, 0.7));
      ring.position.set(c.x, 0.06, c.z);
      addFx(ring, 1.4, f => { ring.rotation.y += 0.05; if (sk.par !== undefined || sk.fail) ring.material.opacity *= 0.85; });
    },
    update(c, sk, dt, F) {
      const T = sk.t;
      if (sk.par !== undefined) {
        const u = T - sk.par;
        once(sk, 'ctr', u >= 0.16, () => {
          const col = berserkCol([1.6, 1.9, 2.6]);
          spawnSlash({ x: c.x, y: 1.7, z: c.z, size: 7, rot: 82, face: c.face, color: col.map(v => v * 0.8), life: 0.34, grow: 0.25 });
          spawnSlash({ x: c.x, y: 1.4, z: c.z, size: 5.2, rot: 70, flipV: true, face: c.face, color: col.map(v => v * 0.6), life: 0.26 });
          const [px, pz] = fwdPt(c, 1.3); pillar(px, pz, 0.35, 4.2, col.map(v => v * 0.45), 0.4);
          hitstop = 0.18; shake = Math.max(shake, 0.7); flashW = Math.max(flashW, 0.3); camZoomT = -0.6;
          hitArea(c, { range: 3.4, cone: true, dmg: P(900), hits: 2, sg: 50, launch: 9, stop: 0.18, shake: 0.7, color: '#d8ecff' });
          if (!(c.berserk > 0) && !(c.exhaust > 0)) c.idg = Math.min(100, c.idg + 30);
          sk.wave = 0;
        });
        // 바닥을 따라 8m 달리는 빛의 파도
        if (sk.ctr) for (; sk.wave < 8 && u >= 0.16 + sk.wave * 0.035; sk.wave++) {
          const [fx, fz] = fwdPt(c, 1.2 + sk.wave), col = berserkCol([1.4, 1.8, 2.6]);
          shockwave(fx, fz, 1.5, col, 0.35);
          for (let i = 0; i < 6; i++) glow.emit({ x: fx + (Math.random() - 0.5) * 0.8, y: 0.1, z: fz + (Math.random() - 0.5) * 0.5, vy: 3 + Math.random() * 3, drag: 2, life: 0.4, c: col, size: PX * 1.2 });
          if (sk.wave % 2 === 0) crackDecal(fx, fz, 1.8, 1.1, col);
        }
        if (u > 0.5) camZoomT = 0;
        return { f: u < 0.16 ? F.skill[3] : F.skill[5], done: u > 0.85 };
      }
      if (T >= 0.8 && !sk.fail) {
        sk.fail = T;
        spawnSlash({ x: c.x, y: 1.1, z: c.z, size: 4.2, rot: -6, face: c.face, color: berserkCol([1.6, 1.8, 2.3]), life: 0.22 });
        const [fx, fz] = fwdPt(c, 1.3); shockwave(fx, fz, 2.2, [1.6, 1.8, 2.3], 0.3); dustRing(fx, fz, 12, 3, '#9c8466');
        hitArea(c, { range: 2.6, cone: true, dmg: P(300), sg: 10, kb: 1.8, stop: 0.06, shake: 0.25, color: '#cfe8ff' });
      }
      if (sk.fail) return { f: T - sk.fail < 0.06 ? F.atk[0] : F.atk[2], done: T > 1.05 };
      return { f: F.skill[3], done: false };
    },
  },
  // 4차 C 파천일격: 누르고 있으면 3단계 차지(0.5/1.0/1.5초), 놓으면 내려찍어 직선 균열 6/9/12m · 1,000/1,900/3,200%
  C: {
    init(c, sk) { sk.stage = 0; },
    update(c, sk, dt, F, ctrl) {
      const T = sk.t, [rx, rz] = camRight();
      const GOLD = [2.8, 2.0, 0.7], STEEL = berserkCol([1.4, 1.8, 2.6]);
      if (sk.rel === undefined) {
        if (ctrl) { const [mx, mz, ok] = inputDir(); if (ok) { const sd = mx * rx + mz * rz; if (sd > 0.15) c.face = 1; else if (sd < -0.15) c.face = -1; } }
        const st = T >= 1.5 ? 3 : T >= 1.0 ? 2 : T >= 0.5 ? 1 : 0, col = st === 3 ? GOLD : STEEL;
        const [tx, tz] = fwdPt(c, -0.9);
        if (st > sk.stage) {
          sk.stage = st;
          embers(tx, 2.3, tz, 18 + st * 8, col, 4); shockwave(c.x, c.z, 1.6 + st * 0.6, col, 0.3);
          fxFlash = 1.5; fxLight.color.setRGB(col[0] / 3, col[1] / 3, col[2] / 3); fxLight.position.set(tx, 2.2, tz);
          floaters.push({ x: c.x, y: 3.1, z: c.z, t: 0, text: ['', '◆◇◇', '◆◆◇', '◆◆◆ 풀차지'][st], crit: false, vx: 0, color: st === 3 ? '#ffe08a' : '#bfe0ff' });
          if (st === 2) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.85, 6).rotateX(-Math.PI / 2), addMat(...STEEL, 0.8));
            ring.position.set(c.x, 0.06, c.z);
            addFx(ring, 4, f => { ring.rotation.y += 0.03; if (sk.stage === 3) ring.material.color.setRGB(...GOLD); if (sk.rel !== undefined) ring.material.opacity *= 0.85; });
          }
          if (st === 3) { camZoomT = -0.8; flashW = Math.max(flashW, 0.12); flashCol = '255,230,170'; }
        }
        if (st >= 1 && Math.random() < dt * 40) glow.emit({ x: c.x + (Math.random() - 0.5) * 1.2, y: 0.2 + Math.random() * 2.2, z: c.z, vy: 1.4, drag: 1, life: 0.5, c: col, size: PX * 1.2 });
        if (st >= 2 && Math.random() < dt * 14) { const a = Math.random() * TAU, rr = 1 + Math.random() * 1.5; soft.emit({ x: c.x + Math.cos(a) * rr, y: 0.1, z: c.z + Math.sin(a) * rr * 0.7, vy: 1.1 + Math.random() * 0.6, drag: 0.5, life: 1.1, c: lc(['#5e5c72', '#6e5038'][Math.random() * 2 | 0]), size: PX * (1.6 + Math.random() * 1.6) }); }
        if (st === 3) {
          shake = Math.max(shake, 0.08);
          if (Math.random() < dt * 50) { const a = Math.random() * TAU; glow.emit({ x: c.x + Math.cos(a) * 3, y: 0.4 + Math.random() * 2, z: c.z + Math.sin(a) * 2.2, vx: -Math.cos(a) * 6, vz: -Math.sin(a) * 4.4, life: 0.45, c: GOLD, size: PX * 1.2 }); }
        }
        const held = keys.KeyC || T < simHold;
        if ((!held && T > 0.12) || T > 2.5) { sk.rel = T; sk.lv = Math.max(1, sk.stage); sk.hit = new Set(); sk.cr = 0; }
        return { f: F.atk[0], done: false };
      }
      const u = T - sk.rel, lv = sk.lv, L = [0, 6, 9, 12][lv], col = lv === 3 ? GOLD : STEEL;
      once(sk, 'slam', u >= 0.15, () => {
        spawnSlash({ x: c.x, y: 1.6, z: c.z, size: 5 + lv, rot: 72, face: c.face, color: col, life: 0.28, grow: 0.15 });
        const [fx, fz] = fwdPt(c, 1.2); shockwave(fx, fz, 2.5 + lv, col, 0.4); dustRing(fx, fz, 24, 5, '#9c8466'); debris(fx, fz, 14, 0.8);
        hitstop = 0.18; shake = Math.max(shake, 0.45 + lv * 0.12);
        if (lv === 3) { flashW = 0.55; flashCol = '255,236,190'; }
        fxFlash = 2; fxLight.color.setRGB(col[0] / 3, col[1] / 3, col[2] / 3); fxLight.position.set(fx, 1, fz);
      });
      // 균열이 0.3초 동안 앞으로 달리며, 지나는 자리의 적을 치고 양옆에 바위 기둥을 세운다
      if (sk.slam) for (; sk.cr < L && u >= 0.15 + sk.cr / L * 0.3; sk.cr++) {
        const d = 1.2 + sk.cr, [px, pz] = fwdPt(c, d), qx = -rz, qz = rx;
        crackDecal(px, pz, 2.3, 1.6 + lv * 0.4, lv === 3 ? [2.8, 2.0, 0.8] : [1.6, 1.8, 2.4]);
        debris(px, pz, 4, 0.6); dustRing(px, pz, 6, 2, '#9c8466');
        if (sk.cr % 2 === 0) [-1, 1].forEach(sd => rockSpike(px + qx * sd * (1.1 + Math.random() * 0.3), pz + qz * sd * (1.1 + Math.random() * 0.3), 0.6 + Math.random() * 0.4 + lv * 0.15, 1.4));
        for (const tg of targets) {
          if (!tg.alive() || sk.hit.has(tg) || tg.y() > 4) continue;
          const ox = tg.x - c.x, oz = tg.z - c.z, along = (ox * rx + oz * rz) * c.face, perp = Math.abs(ox * qx + oz * qz);
          if (along > d - 1.6 && along < d + 0.6 && perp < 1 + tg.r) {
            sk.hit.add(tg);
            hitTarget(tg, P([0, 1000, 1900, 3200][lv]), px, pz, lv === 3 ? '#ffe08a' : '#cfe8ff', { stop: 0.14 + lv * 0.02, shake: 0.6, sg: [0, 10, 25, 50][lv] });
            launch(tg, 4 + lv * 2);
          }
        }
      }
      once(sk, 'boom', lv === 3 && u >= 0.5, () => { const [ex, ez] = fwdPt(c, 1.2 + L); impact(ex, ez, 4.2, GOLD); pillar(ex, ez, 0.6, 6, [2.4, 1.8, 0.6], 0.5); shake = Math.max(shake, 0.8); });
      if (u > 0.4) camZoomT = 0;
      return { f: u < 0.15 ? F.atk[0] : F.atk[2], done: u > 0.8 };
    },
  },
  // 1차 Q 삼연참: 밀고 들어가며 내려베기 → 올려베기 → 내려찍기
  Q: {
    update(c, sk, dt, F) {
      const T = sk.t, col = berserkCol([1.5, 1.7, 2.1]);
      once(sk, 'a', T >= 0.07, () => { stepFwd(c, 0.45); spawnSlash({ x: c.x, y: 1.25, z: c.z, size: 3.8, rot: 20, face: c.face, color: col }); hitArea(c, { range: 2.7, cone: true, dmg: P(140), color: '#cfe8ff' }); });
      once(sk, 'b', T >= 0.36, () => { stepFwd(c, 0.45); spawnSlash({ x: c.x, y: 1.0, z: c.z, size: 4.0, rot: 10, flipV: true, face: c.face, color: col }); hitArea(c, { range: 2.8, cone: true, dmg: P(160), color: '#cfe8ff' }); });
      once(sk, 'c', T >= 0.68, () => {
        stepFwd(c, 0.6); spawnSlash({ x: c.x, y: 1.4, z: c.z, size: 5.4, rot: 55, face: c.face, color: col, life: 0.28, grow: 0.15 });
        const [fx, fz] = fwdPt(c, 2.2); shockwave(fx, fz, 2.6, [1.8, 1.9, 2.2], 0.35); crackDecal(fx, fz, 3.6, 1.4, [1.6, 1.8, 2.4]); dustRing(fx, fz, 18, 4, '#9c8466');
        hitArea(c, { range: 3.2, cone: true, dmg: P(150), hits: 2, sg: 10, kb: 1.2, stop: 0.09, shake: 0.35, color: '#cfe8ff' });
      });
      const f = T < 0.07 ? F.atk[0] : T < 0.3 ? F.atk[2] : T < 0.36 ? F.skill[3] : T < 0.6 ? F.skill[5] : T < 0.68 ? F.atk[0] : F.atk[2];
      return { f, done: T > 1.0 };
    },
  },
  // 1차 E 돌진 어깨치기: 어깨로 밀고 나가며 경로의 적을 치고 마무리 베기
  E: {
    init(c, sk) {
      const [mx, mz, ok] = inputDir(), [rx, rz] = camRight();
      sk.dx = ok ? mx : rx * c.face; sk.dz = ok ? mz : rz * c.face; sk.hit = new Set();
      const sd = sk.dx * rx + sk.dz * rz; if (Math.abs(sd) > 0.1) c.face = sd > 0 ? 1 : -1;
    },
    update(c, sk, dt, F) {
      const T = sk.t; let f = F.skill[3];
      if (T >= 0.12 && T < 0.47) {
        f = F.skill[4]; c.inv = Math.max(c.inv, 0.05);
        c.x += sk.dx * 18 * dt; c.z += sk.dz * 18 * dt; collide(c, 0.35);
        if (Math.random() < dt * 70) spawnStreak(c, c.face);
        if (Math.random() < dt * 50) soft.emit({ x: c.x, y: 0.1, z: c.z, vx: -sk.dx * 2, vz: -sk.dz * 2, vy: 0.8, drag: 3, life: 0.5, c: lc('#9c8466'), size: PX * 2.2, grow: 1.5, a: 0.7 });
        for (const tg of targets) if (tg.alive() && !sk.hit.has(tg) && Math.hypot(tg.x - c.x, tg.z - c.z) < tg.r + 1.1) {
          sk.hit.add(tg);
          for (let k = 0; k < 2; k++) hitTarget(tg, P(180), c.x - sk.dx, c.z - sk.dz, '#ffd0a0', { stack: k, quiet: k > 0, stop: 0.07, shake: 0.35, sg: 10 });
          knock(tg, c.x - sk.dx * 2, c.z - sk.dz * 2, 1.6);
        }
      }
      once(sk, 'end', T >= 0.47, () => {
        const [fx, fz] = fwdPt(c, 1.2);
        shockwave(fx, fz, 2.6, [2.4, 1.6, 0.9], 0.3); dustRing(c.x, c.z, 16, 4, '#9c8466');
        spawnSlash({ x: c.x, y: 1.1, z: c.z, size: 4.4, rot: -5, face: c.face, color: berserkCol([2.2, 1.5, 1.0]) });
        hitArea(c, { range: 2.6, cone: true, dmg: P(220), sg: 10, stack0: 2, kb: 1.4, stop: 0.08, shake: 0.35, color: '#ffd0a0' });
      });
      if (T >= 0.47) f = F.atk[2];
      return { f, done: T > 0.8 };
    },
  },
  // 2차 R 폭풍 회전참: 누르고 있는 동안 회전(최대 3초), 놓으면 양쪽으로 마무리 일격
  R: {
    init(c, sk) {
      sk.spin = new THREE.Group(); scene.add(sk.spin); sk.tick = 0; sk.n = 0;
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), addMat(...berserkCol([0.8, 1.0, 1.4]), 0.6, ARC[2]));
        m.rotation.x = -Math.PI / 2; m.position.x = (0.5 - 10 / 64) * 6.6;
        blade.add(m); blade.rotation.y = i / 3 * TAU; blade.position.y = 0.6 + i * 0.4; sk.spin.add(blade);
      }
    },
    update(c, sk, dt, F, ctrl) {
      const T = sk.t;
      if (!sk.fin) {
        if (ctrl) { const [mx, mz, ok] = inputDir(); if (ok) { c.x += mx * 2.6 * dt; c.z += mz * 2.6 * dt; collide(c, 0.35); } }
        sk.spin.position.set(c.x, 0, c.z); sk.spin.rotation.y -= dt * 17;
        sk.spin.children.forEach((b, i) => b.children[0].material.opacity = Math.min(1, T * 6) * (0.5 + 0.25 * Math.sin(T * 30 + i * 2)));
        sk.tick -= dt; if (sk.tick <= 0) { sk.tick = 0.15; hitArea(c, { range: 3.0, dmg: P(45), stack0: sk.n % 5, stop: 0.02, shake: 0.1, color: '#cfe8ff' }); sk.n++; }
        if (Math.random() < dt * 45) { const a = Math.random() * TAU; soft.emit({ x: c.x + Math.cos(a) * 2.4, y: 0.1, z: c.z + Math.sin(a) * 2.4, vx: -Math.sin(a) * 6 - Math.cos(a), vz: Math.cos(a) * 6 - Math.sin(a), vy: 0.8, drag: 3, life: 0.45, c: lc('#9c8466'), size: PX * 2.2, grow: 1.5, a: 0.6 }); }
        if (Math.random() < dt * 30) { const a = Math.random() * TAU; glow.emit({ x: c.x + Math.cos(a) * 2.8, y: 0.6 + Math.random() * 1.2, z: c.z + Math.sin(a) * 2.8, vx: -Math.sin(a) * 7, vz: Math.cos(a) * 7, drag: 4, life: 0.3, c: berserkCol([1.4, 1.8, 2.6]), size: PX }); }
        const k = Math.floor(T * 16), held = keys.KeyR || T < simHold;
        if ((T > 0.8 && !held) || T > 3.0) {
          sk.fin = T;
          [1, -1].forEach(fc => spawnSlash({ x: c.x, y: 1.2, z: c.z, size: 6, rot: 0, face: fc, color: berserkCol([1.8, 2.0, 2.4]), life: 0.3, grow: 0.25 }));
          shockwave(c.x, c.z, 4, [1.8, 2.0, 2.4], 0.4); dustRing(c.x, c.z, 30, 7, '#9c8466');
          hitArea(c, { range: 3.6, dmg: P(200), hits: 2, sg: 10, kb: 2, stop: 0.1, shake: 0.5, color: '#cfe8ff' });
        }
        return { f: F.skill[k % 2], face: Math.floor(k / 2) % 2 ? 1 : -1, done: false };
      }
      const u = T - sk.fin;
      sk.spin.children.forEach(b => b.children[0].material.opacity *= 0.8);
      return { f: u < 0.08 ? F.skill[0] : F.atk[2], done: u > 0.4 };
    },
    end(c, sk) { scene.remove(sk.spin); disposeObj(sk.spin); },
  },
  // 2차 F 대지 분쇄: 도약해 내리찍고 바깥으로 여진 3번
  F: {
    init(c, sk) {
      const [mx, mz, ok] = inputDir(), [rx, rz] = camRight();
      const dx = ok ? mx : rx * c.face, dz = ok ? mz : rz * c.face;
      Object.assign(sk, { sx: c.x, sz: c.z, tx: c.x + dx * 4.5, tz: c.z + dz * 4.5 });
      const sd = dx * rx + dz * rz; if (Math.abs(sd) > 0.1) c.face = sd > 0 ? 1 : -1;
    },
    update(c, sk, dt, F) {
      const T = sk.t; let f = F.atk[0];
      if (T >= 0.2 && T < 0.62) {
        const k = (T - 0.2) / 0.42; f = F.skill[2];
        c.x = sk.sx + (sk.tx - sk.sx) * k; c.z = sk.sz + (sk.tz - sk.sz) * k; collide(c, 0.35);
        c.y = Math.sin(k * Math.PI) * 3.0; c.inv = Math.max(c.inv, 0.05);
        if (Math.random() < dt * 30) glow.emit({ x: c.x, y: c.y + 1.4, z: c.z, vy: -0.5, life: 0.3, c: [2.4, 1.4, 0.6], size: PX });
      }
      once(sk, 'land', T >= 0.62, () => { c.y = 0; impact(c.x, c.z, 4.4, [2.6, 1.5, 0.6]); shake = 0.7; hitstop = Math.max(hitstop, 0.12); hitArea(c, { range: 3.2, dmg: P(250), hits: 2, sg: 25, launch: 8, stop: 0.12, shake: 0.7, color: '#ffb070' }); });
      [0.9, 1.15, 1.4].forEach((tt, i) => once(sk, 'w' + i, T >= tt, () => {
        const R = 4.6 + i * 1.6;
        shockwave(c.x, c.z, R + 0.8, [2.2, 1.2, 0.5], 0.45);
        for (let j = 0; j < 26; j++) { const a = j / 26 * TAU; soft.emit({ x: c.x + Math.cos(a) * R, y: 0.1, z: c.z + Math.sin(a) * R, vx: Math.cos(a) * 2, vz: Math.sin(a) * 2, vy: 1.5 + Math.random() * 2, drag: 2, life: 0.7, c: lc('#9c8466'), size: PX * 3, grow: 1.8, a: 0.7 }); }
        for (let j = 0; j < 3; j++) { const a = Math.random() * TAU; crackDecal(c.x + Math.cos(a) * R * 0.8, c.z + Math.sin(a) * R * 0.8, 3, 1.6); debris(c.x + Math.cos(a) * R * 0.8, c.z + Math.sin(a) * R * 0.8, 8, 0.7); }
        shake = Math.max(shake, 0.35);
        hitArea(c, { range: R + 0.5, dmg: P(120), stack0: 2 + i, stop: 0.04, shake: 0.3, color: '#ffb070' });
      }));
      if (T >= 0.62) f = T < 0.95 ? F.atk[2] : F.skill[3];
      return { f, done: T > 1.6 };
    },
  },
  // 3차 Z 격노 난무: 6연속 베기 후 X자 마무리
  Z: {
    update(c, sk, dt, F) {
      const T = sk.t, col = berserkCol([2.6, 0.7, 0.55]);
      const seq = [[0.04, 30, false, F.atk[2]], [0.18, 20, true, F.skill[5]], [0.32, 70, false, F.atk[2]], [0.46, 5, true, F.skill[5]], [0.6, -10, false, F.skill[0]], [0.74, 80, true, F.skill[1]]];
      let f = F.atk[0];
      seq.forEach(([tt, rot, fv, pf], i) => {
        if (T >= tt) f = pf;
        once(sk, 's' + i, T >= tt, () => {
          stepFwd(c, 0.15);
          spawnSlash({ x: c.x, y: 1.0 + Math.random() * 0.5, z: c.z, size: 3.6 + Math.random(), rot, flipV: fv, face: c.face, color: col, life: 0.18 });
          hitArea(c, { range: 2.7, cone: true, dmg: P(110), hits: 2, sg: 10, stack0: (i * 2) % 6, stop: 0.03, shake: 0.15, color: '#ff9a8a' });
          redW = Math.max(redW, 0.1);
        });
      });
      if (T >= 0.88) f = T < 0.95 ? F.atk[0] : F.atk[2];
      once(sk, 'x', T >= 0.95, () => {
        [45, -45].forEach(r => spawnSlash({ x: c.x, y: 1.3, z: c.z, size: 6.2, rot: r, face: c.face, color: col, life: 0.32, grow: 0.2 }));
        const [fx, fz] = fwdPt(c, 1.6); shockwave(fx, fz, 3.2, [2.6, 0.5, 0.4], 0.35); embers(fx, 1.2, fz, 36, [3, 0.5, 0.4], 7);
        hitArea(c, { range: 3.2, cone: true, dmg: P(180), hits: 4, sg: 25, kb: 2, stop: 0.13, shake: 0.55, color: '#ff9a8a' });
        flashW = 0.25; flashCol = '255,120,110';
      });
      return { f, done: T > 1.4 };
    },
  },
  // G 광폭화 (직업 게이지): 포효(무적) → 20초 폭주, 끝나면 3초 탈진
  G: {
    init(c, sk) { c.inv = Math.max(c.inv, 0.6); },
    update(c, sk, dt, F) {
      const T = sk.t;
      once(sk, 'roar', T >= 0.35, () => {
        c.berserk = BZ_DUR; log(`광폭화! ${BZ_DUR}초 동안 피해 +30%, 속도 +20%, 슈퍼아머.`, '전투');
        shockwave(c.x, c.z, 5, [2.6, 0.4, 0.3], 0.55); shockwave(c.x, c.z, 3, [2.6, 1.2, 0.8], 0.35, 0.1);
        pillar(c.x, c.z, 0.9, 5, [1.6, 0.3, 0.25], 0.7); embers(c.x, 1.2, c.z, 60, [3, 0.4, 0.3], 8); dustRing(c.x, c.z, 30, 7, '#9c8466');
        flashW = 0.2; flashCol = '255,60,50'; shake = 0.6; redW = 0.6; crackDecal(c.x, c.z, 5.5, 2.2, [2.8, 0.4, 0.3]);
        hitArea(c, { range: 3.4, dmg: P(300), hits: 3, kb: 3, stop: 0.08, color: '#ff9a8a' });
      });
      return { f: T < 0.3 ? F.skill[3] : F.skill[6], done: T > 0.85 };
    },
  },
  // 4차 V 종말의 대검: 컷신 → 도약 → 하늘에서 거대한 검이 떨어지며 함께 내려꽂기 → 8연타
  V: {
    init(c, sk) {
      cutin = { t: 0, name: c.berserk > 0 ? '종말의 대검 · 핏빛' : '종말의 대검', sub: '4차 · 각성기' }; cine = 1; camZoomT = -2; dimT = 0.4;
      const [fx, fz] = fwdPt(c, 3.2); Object.assign(sk, { tx: fx, tz: fz, sx: c.x, sz: c.z, multi: 0, bz: c.berserk > 0 });
    },
    update(c, sk, dt, F) {
      const T = sk.t; let f = F.skill[6];
      once(sk, 'roar', T >= 0.3, () => { shockwave(c.x, c.z, 3.6, [2.6, 0.4, 0.3], 0.5); shake = 0.4; embers(c.x, 1.2, c.z, 40, [3, 0.4, 0.3], 6); });
      if (T >= 0.9 && T < 1.3) { f = F.skill[2]; const k = (T - 0.9) / 0.4; c.y = (1 - (1 - k) ** 2) * 4.2; c.inv = 0.1; }
      once(sk, 'sword', T >= 1.0, () => {
        const g = new THREE.PlaneGeometry(2.8, 10.5); g.translate(0, 5.25, 0);
        const mat = new THREE.MeshBasicMaterial({ map: bigSwordTex, transparent: true, alphaTest: 0.1, opacity: 0, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(1.4, 0.7, 0.65), fog: false }), m = new THREE.Mesh(g, mat), root = new THREE.Group(); root.add(m);
        root.position.set(sk.tx, 10, sk.tz); sk.sword = root;
        addFx(root, 2.3, f2 => {
          const t = sk.t;
          if (t < 1.3) { root.position.y = 10 - (t - 1.0) * 3; mat.opacity = Math.min(1, (t - 1.0) * 5); }
          else if (t < 1.62) { const k = (t - 1.3) / 0.32; root.position.y = 9.1 * (1 - k * k) - 1.6 * k * k; mat.opacity = 1; }
          else { root.position.y = -1.6; mat.opacity = Math.max(0, 1 - (t - 2.4) / 0.9); }
          if (Math.random() < 0.5) glow.emit({ x: sk.tx + (Math.random() - 0.5) * 2, y: root.position.y + 1.6 + Math.random() * 8, z: sk.tz, vy: 0.6, life: 0.6, c: [3, 0.5, 0.45], size: PX * 1.3 });
        }, true);
      });
      if (T >= 1.3 && T < 1.62) {
        f = F.skill[7]; const k = (T - 1.3) / 0.32;
        c.y = 4.2 * (1 - k * k); c.x = sk.sx + (sk.tx - sk.sx) * k * 0.6; c.z = sk.sz + (sk.tz - sk.sz) * k * 0.6; c.inv = 0.1;
      }
      once(sk, 'impact', T >= 1.62, () => {
        c.y = 0; hitstop = 0.18; flashW = 0.6; flashCol = '255,240,230'; shake = 1.1; slowT = 0.45; camZoomT = -1;
        impact(sk.tx, sk.tz, 7, [2.4, 0.6, 0.4]); shockwave(sk.tx, sk.tz, 4.5, [1.6, 1.4, 1.3], 0.35, 0.12);
        crackDecal(sk.tx, sk.tz, 13, 3.2, [2.8, 0.9, 0.6]); pillar(sk.tx, sk.tz, 0.8, 9, [1.5, 0.3, 0.26], 0.6);
        debris(sk.tx, sk.tz, 50, 1.3); embers(sk.tx, 0.5, sk.tz, 80, [3, 0.6, 0.4], 10);
      });
      if (sk.impact && sk.multi < 8 && T >= 1.62 + sk.multi * 0.07) {
        hitArea(c, { cx: sk.tx, cz: sk.tz, range: 5, dmg: P(900) * (c.berserk > 0 ? 1.4 : 1), sg: 25, stack0: sk.multi, stop: 0.03, shake: 0.4, launch: sk.multi === 0 ? 7 : 0, color: '#ff8a7a' });
        sk.multi++;
      }
      (sk.bz ? [1.95, 2.2, 2.45, 2.7] : [1.95, 2.2]).forEach((tt, i) => once(sk, 'af' + i, T >= tt, () => { shockwave(sk.tx, sk.tz, 8 + i * 2, i > 1 ? [3, 0.25, 0.2] : [2.4, 0.6, 0.4], 0.5); if (i > 1) crackDecal(sk.tx, sk.tz, 10 + i, 1.6, [2.8, 0.3, 0.25]); shake = Math.max(shake, 0.3); hitArea(c, { cx: sk.tx, cz: sk.tz, range: 8 + i * 2, dmg: P(i > 1 ? 300 : 150), stop: 0.03, shake: 0.3, color: '#ff8a7a' }); }));
      if (T >= 1.62) f = T < 2.4 ? F.atk[2] : F.skill[3];
      if (T > 2.6) { cine = 0; camZoomT = 0; }
      return { f, done: T > 3.2 };
    },
  },
};
