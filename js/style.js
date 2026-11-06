'use strict';
// 스타일 연출 (던파 참고): 임팩트 프레임 · 집중선 · 카메라 펀치 · 겹 검기 · 잔상 · 스킬명 · 총합 데미지
// 스킬 코드가 once(sk, 키)로 남기는 순간을 감지해 그 순간에 연출을 얹는다 (스킬 본체는 그대로)

const VFX = { frames: [], lines: null, punch: 0, callout: null, totals: [] };
// ---- 도구 ----
// 임팩트 프레임: 아주 짧게 화면을 하얗게 / 반전 / 흑백으로
// 화면 번쩍임은 끔 (사용자 요청)
const IMPACT_FRAMES = false;
function impactFrame(mode = 'white', ms = 50) { if (!IMPACT_FRAMES) return; VFX.frames.push({ mode, t: 0, dur: ms / 1000 }); if (mode === 'invert') { cvs.style.filter = 'invert(1) hue-rotate(180deg)'; clearTimeout(impactFrame.t); impactFrame.t = setTimeout(() => cvs.style.filter = '', ms); } }
// 집중선: 캐릭터를 향해 모이는 방사선
function speedLines(dur = 0.35, col = '255,255,255', dens = 70) { VFX.lines = { t: 0, dur, col, dens, seed: Math.random() * 1000 }; }
function camPunch(v = 1) { VFX.punch = Math.min(VFX.punch - v, -v); }
// 스킬명 띄우기는 끔 (사용자 요청)
function callout(name, col = '#ffe0c0') { return; VFX.callout = { name, col, t: 0 }; }
// 겹 검기: 흰 심선 + 색 검기 + 퍼지는 잔영 + 날 끝 불티
function styleArc(c, o) {
  const base = { x: c.x, y: o.y ?? 1.2, z: c.z, rot: o.rot || 0, flipV: o.flipV, face: o.face ?? c.face };
  spawnSlash({ ...base, size: o.size * 1.18, color: o.color.map(v => v * 0.2), life: (o.life || 0.24) * 1.5, grow: 0.3 });
  spawnSlash({ ...base, size: o.size, color: o.color.map(v => v * 0.75), life: o.life || 0.24, grow: 0.12 });
  spawnSlash({ ...base, size: o.size * 0.88, color: [1.5, 1.5, 1.6], life: (o.life || 0.24) * 0.55 });
  spawnSlash({ ...base, rot: base.rot + 14, size: o.size * 1.05, color: o.color.map(v => v * 0.45), life: (o.life || 0.24) * 1.2, grow: 0.2 });
  const [rx, rz] = camRight(), f = base.face, n = (o.sparks ?? 16) * 2;
  for (let i = 0; i < n; i++) { const a = ((o.rot || 0) - 60 + i / n * 150) * Math.PI / 180 * (o.flipV ? -1 : 1), r = o.size * 0.42; glow.emit({ x: c.x + rx * f * Math.cos(a) * r, y: base.y + Math.sin(a) * r, z: c.z + rz * f * Math.cos(a) * r, vx: rx * f * 3 + (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: rz * f * 3, drag: 3, life: 0.3, c: o.color.map(v => v * 1.2), size: PX * 1.2 }); }
}
function burst(x, z, col, k = 1) {
  shockwave(x, z, 2.6 * k, col, 0.4); shockwave(x, z, 1.6 * k, col.map(v => v * 0.7), 0.3, 0.6);
  pillar(x, z, 0.35 * k, 4 * k, col.map(v => v * 0.45), 0.35);
  embers(x, 0.6, z, Math.round(40 * k), col, 6 * k); debris(x, z, Math.round(10 * k), 0.7 * k); dustRing(x, z, Math.round(18 * k), 3.5 * k, '#9c8466');
  fxFlash = Math.max(fxFlash, 2); fxLight.color.setRGB(col[0] / 3, col[1] / 3, col[2] / 3); fxLight.position.set(x, 1, z);
}
const atFront = (c, d = 1.6) => fwdPt(c, d);
function ghostTrail(c, n = 4, col = [1.4, 1.6, 2.4], gap = 0.03) { for (let i = 0; i < n; i++) later(i * gap, () => { const m = new THREE.Mesh(c.mesh.geometry, new THREE.MeshBasicMaterial({ map: c.mat.map, transparent: true, opacity: 0.55 - i * 0.08, alphaTest: 0.01, depthWrite: false, color: new THREE.Color(...col), side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.copy(c.mesh.position); m.rotation.y = camYaw; scene.add(m); ghosts.push({ m, t: 0 }); }); }
function groundStreak(c, len, col) { const [rx, rz] = camRight(); lightLine(c.x - rx * c.face * len, c.z - rz * c.face * len, rx * c.face, rz * c.face, len, col, 0.35, 0.15); }
// 총합 데미지: 스킬 하나가 준 피해를 합쳐 끝에 크게 띄운다
function addSkillDamage(c, dmg, tg) { if (!c.sk) return; c.sk.tot = (c.sk.tot || 0) + dmg; c.sk.hits = (c.sk.hits || 0) + 1; c.sk.lastTg = tg; }
function showTotal(c, sk) {
  if (!sk.tot || (sk.hits || 0) < 3) return; const tg = sk.lastTg; if (location.search.includes('sim')) console.log('TOTAL ' + sk.id + ' ' + Math.round(sk.tot) + ' hits=' + sk.hits);
  VFX.totals.push({ x: tg ? tg.x : c.x, y: (tg ? tg.y() + tg.top : 3) + 1.4, z: tg ? tg.z : c.z, v: Math.round(sk.tot), t: 0, big: sk.tot > 3000 });
}

// ---- 화면 그리기 ----
function drawStyleHUD(g, w, h) {
  tickVFX();
  const dt = 0, A = party[active];
  // 집중선
  const L = VFX.lines;
  if (L) {
    const k = L.t / L.dur; if (k >= 1) VFX.lines = null; else {
      const v = new THREE.Vector3(A.x, 1.2 + (A.y || 0), A.z).project(camera), cx = (v.x + 1) / 2 * w, cy = (1 - v.y) / 2 * h, R = Math.hypot(w, h);
      g.save(); g.globalAlpha = (1 - k) * 0.85; g.fillStyle = `rgb(${L.col})`;
      for (let i = 0; i < L.dens; i++) { const a = hash2(i, L.seed | 0) * TAU, r0 = R * (0.22 + hash2(i + 9, L.seed | 0) * 0.25) * (1 - k * 0.3), wd = 1 + hash2(i + 3, L.seed | 0) * 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a + wd * 0.004) * R, cy + Math.sin(a + wd * 0.004) * R); g.lineTo(cx + Math.cos(a - wd * 0.004) * R, cy + Math.sin(a - wd * 0.004) * R); g.fill(); }
      g.restore();
    }
  }
  // 임팩트 프레임
  for (let i = VFX.frames.length - 1; i >= 0; i--) {
    const F = VFX.frames[i]; if (F.t > F.dur) { VFX.frames.splice(i, 1); continue; }
    if (F.mode === 'white') { g.fillStyle = `rgba(255,250,240,${0.75 * (1 - F.t / F.dur)})`; g.fillRect(0, 0, w, h); }
    if (F.mode === 'black') { g.fillStyle = `rgba(0,0,0,${0.6 * (1 - F.t / F.dur)})`; g.fillRect(0, 0, w, h); }
  }
  // 스킬명: 비스듬히 미끄러져 들어온다
  const C = VFX.callout;
  if (C) {
    if (C.t > 1.1) VFX.callout = null; else {
      const inK = Math.min(1, C.t / 0.12), out = Math.max(0, (C.t - 0.8) / 0.3), x = w * 0.5 + (1 - inK) * 120 - out * 60, y = h * 0.24, a = (1 - out) * inK;
      g.save(); g.translate(x, y); g.transform(1, 0, -0.25, 1, 0, 0);
      g.fillStyle = `rgba(0,0,0,${0.55 * a})`; g.fillRect(-180, -26, 360, 44);
      g.fillStyle = C.col; g.globalAlpha = a; g.fillRect(-180, 16, 360 * inK, 3); g.restore();
      txt(C.name, x, y + 6, 26, C.col, 'center', a);
    }
  }
  // 총합 데미지
  for (let i = VFX.totals.length - 1; i >= 0; i--) {
    const T = VFX.totals[i]; if (T.t > 1.6) { VFX.totals.splice(i, 1); continue; }
    if (!SET.dmg) continue;
    const v = new THREE.Vector3(T.x, T.y + T.t * 0.4, T.z).project(camera), sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h, pop = T.t < 0.12 ? 1.6 - T.t * 5 : 1, a = 1 - Math.max(0, T.t - 1.1) / 0.5;
    txt('총 피해', sx, sy - (T.big ? 30 : 24), 13, '#ffd890', 'center', a);
    txt(fmt(T.v), sx, sy, Math.round((T.big ? 38 : 30) * pop), T.big ? '#ffb040' : '#ffe8a0', 'center', a);
  }
}
// 연출 시간은 실제 시간으로 흐른다 (히트스톱 · 슬로모션과 무관하게 짧게)
let vfxLast = performance.now();
function tickVFX() { const now = performance.now(), dt = Math.min(0.05, (now - vfxLast) / 1000); vfxLast = now;
  if (VFX.lines) VFX.lines.t += dt; for (const F of VFX.frames) F.t += dt; if (VFX.callout) VFX.callout.t += dt; for (const T of VFX.totals) T.t += dt;
  VFX.punch *= Math.pow(0.002, dt); }
(REGION.hud = REGION.hud || []).push(drawStyleHUD);

// ---- 광전사 스타일 표: 스킬 · 순간 키 → 연출 ----
const STEEL = [1.5, 1.8, 2.4], BLOOD = [2.8, 0.5, 0.4], EMBER = [2.8, 1.5, 0.6];
const bcol = c => c.berserk > 0 ? BLOOD : STEEL;
const STYLE = {
  berserker: {
    Q: {
      a: c => { styleArc(c, { size: 4.2, rot: 20, color: bcol(c) }); },
      b: c => { styleArc(c, { size: 4.4, rot: 10, flipV: true, color: bcol(c), y: 1.0 }); groundStreak(c, 2.2, [2.4, 1.6, 0.8]); },
      c: c => { { const [x, z] = atFront(c, 2.2); burst(x, z, bcol(c), 1); } styleArc(c, { size: 6, rot: 55, color: bcol(c), life: 0.3, sparks: 26 }); impactFrame('white', 45); camPunch(0.8); speedLines(0.25); },
    },
    E: {
      _init: c => { speedLines(0.4, '200,220,255', 50); ghostTrail(c, 6, [1.2, 1.5, 2.4], 0.05); callout('돌진 어깨치기', '#bfe0ff'); },
      end: c => { { const [x, z] = atFront(c, 1.4); burst(x, z, EMBER, 1); } styleArc(c, { size: 5, rot: -5, color: EMBER, life: 0.26 }); impactFrame('invert', 40); camPunch(0.9); },
    },
    R: {
      _init: c => callout('폭풍 회전참', '#bfe0ff'),
      fin: c => { burst(c.x, c.z, bcol(c), 1.4); [1, -1].forEach(f => styleArc(c, { size: 7, rot: 0, face: f, color: bcol(c), life: 0.32, sparks: 20 })); impactFrame('white', 50); speedLines(0.3); camPunch(1); },
    },
    F: {
      _init: c => callout('대지 분쇄', '#ffc890'),
      land: c => { burst(c.x, c.z, EMBER, 1.8); impactFrame('invert', 60); later(0.06, () => impactFrame('white', 50)); speedLines(0.4, '255,220,180', 90); camPunch(1.6); ghostTrail(c, 3, EMBER, 0.02); },
    },
    Z: {
      _init: c => callout('격노 난무', '#ff9a7a'),
      ...Object.fromEntries([0, 1, 2, 3, 4, 5].map(i => ['s' + i, c => { styleArc(c, { size: 4.2 + (i % 2) * 0.4, rot: [30, 20, 70, 5, -10, 80][i], flipV: i % 2 === 1, color: c.berserk > 0 ? BLOOD : EMBER, life: 0.18, sparks: 10 }); ghostTrail(c, 1, [2.6, 0.8, 0.5], 0); if (i % 2) camPunch(0.25); }])),
      x: c => { { const [x, z] = atFront(c, 1.6); burst(x, z, BLOOD, 1.6); } slowT = 0.22; impactFrame('invert', 55); later(0.05, () => impactFrame('black', 70)); speedLines(0.45, '255,180,160', 100); camPunch(1.8); [45, -45].forEach(r => styleArc(c, { size: 7.5, rot: r, color: BLOOD, life: 0.34, sparks: 24 })); },
    },
    X: {
      _init: c => callout('철혈 반격', '#bfe0ff'),
      ctr: c => { { const [x, z] = atFront(c, 1.3); burst(x, z, STEEL, 1.6); for (let i = 0; i < 8; i++) later(i * 0.03, () => { const [px, pz] = atFront(c, 1.2 + i); pillar(px, pz, 0.25, 2.5, STEEL.map(v => v * 0.4), 0.3); }); } impactFrame('white', 70); later(0.07, () => impactFrame('invert', 50)); speedLines(0.5, '220,235,255', 110); camPunch(2); styleArc(c, { size: 8, rot: 82, color: STEEL, life: 0.36, sparks: 30 }); ghostTrail(c, 5, [1.6, 1.8, 2.8], 0.03); },
    },
    C: {
      _init: c => callout('파천일격', '#ffe8a0'),
      slam: (c, sk) => { const lv = sk.lv || 1; { const [x, z] = atFront(c, 1.2); burst(x, z, lv === 3 ? [2.8, 2.2, 0.8] : STEEL, 0.8 + lv * 0.4); } impactFrame(lv === 3 ? 'invert' : 'white', 50 + lv * 15); if (lv === 3) { later(0.06, () => impactFrame('white', 90)); slowT = 0.3; } speedLines(0.3 + lv * 0.1, lv === 3 ? '255,230,160' : '220,235,255', 60 + lv * 25); camPunch(0.8 + lv * 0.5); styleArc(c, { size: 6 + lv, rot: 72, color: lv === 3 ? [2.8, 2.2, 0.8] : STEEL, life: 0.32, sparks: 30 }); },
      boom: c => { impactFrame('white', 60); camPunch(1.2); },
    },
    V: {
      roar: c => { speedLines(0.6, '255,120,100', 120); camPunch(0.6); },
      impact: c => { burst(c.x, c.z, BLOOD, 2.6); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; later(i * 0.02, () => pillar(c.x + Math.cos(a) * 4, c.z + Math.sin(a) * 3.4, 0.3, 5, [1.4, 0.3, 0.25], 0.5)); } impactFrame('invert', 80); later(0.08, () => impactFrame('white', 120)); later(0.2, () => impactFrame('black', 90)); speedLines(0.8, '255,200,180', 140); camPunch(3); },
      af0: c => camPunch(0.8), af1: c => camPunch(0.6),
    },
    G: {
      _init: c => callout('광폭화', '#ff6a5a'),
      roar: c => { burst(c.x, c.z, BLOOD, 1.4); speedLines(0.5, '255,90,70', 120); impactFrame('black', 80); camPunch(1.2); ghostTrail(c, 4, BLOOD, 0.04); },
    },
    THR: { _init: c => { speedLines(0.2, '220,235,255', 40); ghostTrail(c, 3, STEEL, 0.03); } },
  },
};

// ---- 순간 감지: 각 스킬의 update를 감싸 새로 켜진 키에 연출을 건다 ----
function hookStyles(cls, table) {
  for (const key in table) {
    const impl = (kitOf(cls) && kitOf(cls).impl[key]) || SK[key]; if (!impl || impl._styled) continue; impl._styled = true;
    const T = table[key], up = impl.update, init = impl.init;
    impl.init = function (c, sk) { if (init) init.call(this, c, sk); if (T._init && c.key === cls) T._init(c, sk); };
    if (!init && !T._init) delete impl.init;
    impl.update = function (c, sk, ...rest) {
      const r = up.call(this, c, sk, ...rest);
      if (c.key === cls) { sk._seen = sk._seen || {}; for (const k in T) if (k[0] !== '_' && sk[k] !== undefined && sk[k] !== false && !sk._seen[k]) { sk._seen[k] = true; T[k](c, sk); } }
      return r;
    };
  }
}
hookStyles('berserker', STYLE.berserker);
// 낙하 내려찍기는 기본기라 별도: 착지 순간
{ const air = SK.AIR, up = air.update; air.update = function (c, sk, ...rest) { const was = sk.land; const r = up.call(this, c, sk, ...rest); if (was === undefined && sk.land !== undefined && c.key === 'berserker') { impactFrame('white', 35); camPunch(0.7); } return r; }; }
