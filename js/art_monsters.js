'use strict';
// 몬스터 도트: 황혼 숲 (그림자 늑대 · 썩은 나무 정령 · 뼈 까마귀 · 이끼 골렘 · 시든 숲의 군주)
// 모두 오른쪽을 보는 그림. 빛나는 부분(눈, 균열, 버섯)은 따로 발광층(G)에 그린다.

const MPAL = {
  shade: ['#0a0612', '#160f22', '#241a34', '#36284a', '#4e3a66'],
  bark: ['#160e0a', '#2a1c12', '#3e2a1c', '#563c28', '#705034'],
  barkD: ['#100a08', '#1e140e', '#2c1e14', '#3c2a1c', '#4a3424'],
  moss: ['#1a2a18', '#2a4222', '#3e5c2e', '#56783a'],
  bone: ['#4a4238', '#7a7060', '#a89e88', '#d4ccb6', '#eee6d2'],
  feather: ['#08060c', '#141018', '#221c28', '#322a3a'],
  stone: ['#1e1c26', '#2e2c38', '#42404e', '#5a5868', '#74748a'],
  leaf: ['#5a2010', '#8a3818', '#b85a20', '#d88a30', '#f0b850'],
};
const shadeAt = (v, n, px, py) => clamp(Math.floor(v * n + bay(px, py) - 0.5), 0, n - 1);
// 타원 덩어리: 왼쪽 위에서 빛을 받는다
function blob(g, cx, cy, rx, ry, pal, o = {}) {
  const n = o.n ?? 0.35, rough = o.rough ?? 0.25, lit = o.lit ?? 0;
  eachPx(g, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (px, py, X, Y) => {
    const nx = (X - cx) / rx, ny = (Y - cy) / ry, d = nx * nx + ny * ny; if (d > 1) return;
    let v = 0.6 + lit - nx * 0.25 - ny * 0.35 + (vnoise(X * n + cx, Y * n) - 0.5) * rough;
    if (o.edge !== false && d > 0.78) v -= 0.18;
    g.fset(px, py, pal[shadeAt(v, pal.length, px, py)]);
  });
}
// 굵기가 변하는 막대 (팔다리 · 가지 · 뿌리)
function limb(g, x0, y0, x1, y1, w0, w1, pal, o = {}) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) + 1;
  for (let i = 0; i <= n; i++) { const k = i / n, w = (w0 + (w1 - w0) * k) / 2; blob(g, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, Math.max(0.6, w), Math.max(0.6, w), pal, { rough: 0.12, edge: false, ...o }); }
}
// 꺾이며 뻗는 가지 (끝이 갈라진다)
function branch(g, x, y, a, len, w, pal, depth, r) {
  const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
  limb(g, x, y, x1, y1, w, Math.max(0.8, w * 0.6), pal);
  if (depth > 0) { branch(g, x1, y1, a - 0.45 - r() * 0.3, len * 0.7, w * 0.6, pal, depth - 1, r); if (r() < 0.8) branch(g, x1, y1, a + 0.35 + r() * 0.3, len * 0.6, w * 0.55, pal, depth - 1, r); }
  return [x1, y1];
}

// ---- 그림자 늑대 ----
function drawWolf(g, G, p) {
  const P = MPAL.shade, far = P.slice(0, 4);
  const low = p.st === 'wind' ? 2.5 : 0, str = p.st === 'act' ? 3 : 0, bob = p.st === 'idle' ? p.i * 0.6 : 0;
  const ph = p.st === 'move' ? p.i * Math.PI : p.st === 'act' ? 1.2 : 0, stride = p.st === 'move' ? 3 : p.st === 'act' ? 4.5 : 0.6;
  // 연기처럼 풀어지는 꼬리
  for (let i = 0; i < 10; i++) blob(g, 9 - i * 0.9 - str, 12.5 - i * 0.55 + low * 0.5 + bob + Math.sin(i * 0.9 + p.i) * 0.6, 2.8 - i * 0.2, 1.9 - i * 0.13, P, { rough: 0.5 });
  const legs = (hipX, off, pal) => { const s = Math.sin(ph + off) * stride; limb(g, hipX, 16 + low, hipX + s * 0.6, 20.5 + low * 0.3, 3.2, 2.4, pal); limb(g, hipX + s * 0.6, 20.5 + low * 0.3, hipX + s, 25, 2.4, 1.6, pal); };
  legs(13 - str * 0.3, 0, far); legs(26 + str * 0.6, Math.PI, far);
  blob(g, 19 + str * 0.3, 14 + low + bob * 0.5, 11 + str * 0.6, 6 - str * 0.15, P, { rough: 0.3 });
  blob(g, 26 + str * 0.8, 14.5 + low + bob * 0.5, 5.5, 6.5, P, { rough: 0.3, lit: 0.08 });
  legs(15 - str * 0.3, Math.PI, P); legs(28 + str * 0.6, 0, P);
  // 등을 따라 솟은 그림자 갈기
  for (let x = 11; x < 29; x += 1.5) { const h = 3 + ((x * 7) % 3); thick(g, x + str * 0.3, 10 + low + bob * 0.5, x - 1.6 + str * 0.3, 10 - h + low + bob * 0.5, P[3], 1); }
  const hx = 31 + str, hy = 10 + low * 1.4 + bob * 0.5;
  blob(g, hx, hy, 5.2, 4.2, P); blob(g, hx + 5, hy + 1.6 + (p.st === 'act' ? -0.5 : 0), 3.4, 2.1, P);
  // 귀
  limb(g, hx - 2, hy - 3, hx - 3.5, hy - 7.5, 2.4, 0.8, P); limb(g, hx + 0.5, hy - 3, hx, hy - 7.5, 2.4, 0.8, P);
  if (p.st === 'act' || p.st === 'wind') { g.rect(Math.round(hx + 3), Math.round(hy + 2.5), 5, 2, '#0a0408'); g.set(hx + 4, hy + 2.5, '#e8e0d8'); g.set(hx + 6, hy + 2.5, '#e8e0d8'); g.set(hx + 5, hy + 3.5, '#e8e0d8'); }
  g.rect(Math.round(hx + 1), Math.round(hy - 1), 3, 2, '#0a0408');
  G.set(hx + 2, hy - 1, '#ff3a5a'); G.set(hx + 3, hy - 1, '#ffa0b0');
  if (p.st === 'wind') { G.set(hx + 1, hy - 1, '#ff3a5a'); }
}

// ---- 썩은 나무 정령 ----
function drawRotwood(g, G, p) {
  const B = MPAL.bark, M = MPAL.moss, r = rng(11);
  const bob = p.st === 'idle' ? p.i * 0.7 : p.st === 'move' ? (p.i ? 1 : 0) : 0;
  const cx = 18;
  // 뿌리 다리
  const sw = p.st === 'move' ? (p.i ? 1.5 : -1.5) : 0;
  [[-7, 4], [-3, 1], [3, 1], [7, 4]].forEach(([dx, sp], i) => limb(g, cx + dx * 0.5, 33, cx + dx + Math.sign(dx) * sp + (i % 2 ? sw : -sw), 41, 3.2, 1.2, MPAL.barkD));
  // 몸통 (위로 갈수록 가늘다)
  for (let y = 34; y >= 12; y -= 1.5) { const k = (34 - y) / 22, w = 9 - k * 2.2 + Math.sin(y * 0.6) * 0.5; blob(g, cx + Math.sin(y * 0.25) * 0.8, y + bob * (1 - k), w, 2.2, B, { rough: 0.35 }); }
  // 나무껍질 결
  for (let i = 0; i < 9; i++) { const x = cx - 7 + i * 1.7; g.line(x, 16 + bob, x + Math.sin(i) * 0.8, 33, B[1]); }
  // 얼굴 구멍
  blob(g, cx + 1, 21 + bob, 5.2, 4.2, ['#050302', '#0c0806'], { rough: 0.1 });
  g.line(cx - 3, 24.5 + bob, cx + 5, 24.5 + bob, '#050302');
  const eyeC = p.st === 'wind' ? '#ffe070' : '#ffb040';
  G.rect(cx - 2, 19 + bob, 2, 2, eyeC); G.rect(cx + 3, 19 + bob, 2, 2, eyeC); G.set(cx - 1, 19 + bob, '#fff4c0'); G.set(cx + 4, 19 + bob, '#fff4c0');
  [[-2, 25], [0, 26], [2, 25], [4, 26]].forEach(([dx, dy]) => G.set(cx + dx, dy + bob, '#8a3a10'));
  // 팔 가지: 기본 · 들어 올림(준비) · 내려침(공격)
  const ay = p.st === 'wind' ? -12 : p.st === 'act' ? 10 : -4 + bob;
  branch(g, cx - 7, 18 + bob, Math.atan2(ay - 4, -8), 8, 3.2, B, 1, r);
  branch(g, cx + 7, 18 + bob, Math.atan2(ay - 2, 9), 8.5, 3.2, B, 1, r);
  // 이끼 모자와 흘러내린 이끼
  blob(g, cx, 11.5 + bob, 9.5, 3.6, M, { rough: 0.5, n: 0.6 });
  for (let i = 0; i < 6; i++) { const x = cx - 8 + i * 3.2 + r() * 1.5; g.line(x, 12 + bob, x, 14.5 + r() * 4 + bob, M[1 + (i % 2)]); }
  // 빛나는 버섯 포자
  [[cx - 6, 27], [cx + 7, 30], [cx - 4, 31], [cx + 5, 14]].forEach(([x, y]) => { G.set(x, y + bob, '#b8ff6a'); G.set(x + 1, y + bob, '#6ad84a'); });
}

// ---- 뼈 까마귀 ----
function drawCrow(g, G, p) {
  const F = MPAL.feather, Bo = MPAL.bone;
  const up = p.st === 'act' ? 0 : (p.st === 'move' || p.st === 'idle') ? (p.i ? -1 : 1) : -1;
  const by = 15 + (p.st === 'idle' ? p.i * 0.5 : 0);
  // 날개: 뼈대 + 찢어진 깃
  const wing = (sx, sy, dir, far) => {
    const tipY = p.st === 'act' ? sy - 2 : sy + up * 10;
    const pal = far ? F.slice(0, 3) : F;
    if (p.st === 'act') { limb(g, sx, sy, sx - 13, sy - 3, 3, 1, pal); g.line(sx, sy, sx - 13, sy - 3, Bo[2]); return; }
    for (let k = 0; k < 5; k++) { const tx = sx - 4 - k * 2.6, ty = tipY + (up > 0 ? -k * 0.6 : k * 0.6); limb(g, sx - 1, sy, tx, ty, 2.6, 0.9, pal); }
    g.line(sx, sy, sx - 6, tipY * 0.5 + sy * 0.5, Bo[3]); g.line(sx - 6, tipY * 0.5 + sy * 0.5, sx - 12, tipY, Bo[2]);
  };
  wing(18, by - 2, 1, true);
  // 꼬리깃
  for (let k = 0; k < 4; k++) limb(g, 12, by + 1, 4 - k * 0.5, by + 1 + k * 1.3, 2, 0.8, F);
  blob(g, 16, by, 6.5, 4.2, F, { rough: 0.3 });
  // 갈비뼈
  for (let k = 0; k < 4; k++) g.line(13 + k * 1.8, by + 1, 13.5 + k * 1.8, by + 3.6, Bo[3]);
  // 다리와 발톱
  limb(g, 17, by + 3.5, 17, by + 7.5, 1.2, 1, Bo); g.line(16, by + 8, 19, by + 8, Bo[2]);
  // 해골 머리와 부리
  blob(g, 24, by - 4, 4.4, 3.6, Bo, { rough: 0.15, lit: 0.1 });
  limb(g, 27, by - 3.5, 32.5, by - 2, 2.4, 0.8, ['#3a3228', '#5a5040', '#7a7060']);
  g.rect(24, by - 5, 2, 2, '#060404'); G.set(24.5, by - 4.5, '#ff5a3a'); G.set(25, by - 4.5, '#ff5a3a');
  g.line(22, by - 2.5, 26, by - 1.5, Bo[1]);
  wing(18, by - 1, 1, false);
}

// ---- 이끼 골렘 ----
function drawGolem(g, G, p) {
  const St = MPAL.stone, M = MPAL.moss, r = rng(23);
  const bob = p.st === 'idle' ? p.i * 0.6 : 0, step = p.st === 'move' ? (p.i ? 1.2 : -1.2) : 0;
  const cx = 23;
  blob(g, cx - 7 + step, 43, 5, 6, St); blob(g, cx + 7 - step, 43, 5, 6, St);
  // 팔: 기본 · 머리 위로 들어 올림 · 바닥 내려침
  const arm = (side, far) => {
    const sx = cx + side * 12, sy = 22 + bob;
    const [fx, fy] = p.st === 'wind' ? [cx + side * 9, 6] : p.st === 'act' ? [cx + side * 17, 45] : [cx + side * 17, 36 + bob];
    limb(g, sx, sy, fx, fy - side * 0, 7, 6, far ? St.slice(0, 4) : St); blob(g, fx, fy, 5, 4.6, far ? St.slice(0, 4) : St);
  };
  arm(-1, true);
  blob(g, cx, 29 + bob, 14, 12.5, St, { rough: 0.35, n: 0.5 });
  // 바위 균열과 그 속의 빛
  const crack = [[cx - 1, 23], [cx + 1, 26], [cx - 1, 29], [cx + 2, 32], [cx, 35]];
  for (let i = 0; i < crack.length - 1; i++) { g.line(crack[i][0], crack[i][1] + bob, crack[i + 1][0], crack[i + 1][1] + bob, '#08080c'); G.line(crack[i][0], crack[i][1] + bob, crack[i + 1][0], crack[i + 1][1] + bob, p.st === 'wind' ? '#c0ffe0' : '#4adca0'); }
  // 이끼 덮개와 흘러내림
  blob(g, cx, 18.5 + bob, 13, 4.5, M, { rough: 0.6, n: 0.7 });
  for (let i = 0; i < 9; i++) { const x = cx - 11 + i * 2.7 + r(); g.line(x, 20 + bob, x, 22 + r() * 6 + bob, M[1 + (i % 3)]); }
  // 머리
  blob(g, cx + 1, 14 + bob, 5.4, 4.2, St, { lit: 0.1 });
  g.rect(cx - 1, 14 + bob, 6, 2, '#08080c');
  G.rect(cx - 1, 14 + bob, 2, 2, '#7affc0'); G.rect(cx + 3, 14 + bob, 2, 2, '#7affc0');
  arm(1, false);
  [[cx - 9, 34], [cx + 10, 27], [cx - 4, 39]].forEach(([x, y]) => blob(g, x, y + bob, 2, 1.2, M));
}

// ---- 시든 숲의 군주 (보스) ----
function drawBoss(g, G, p) {
  const B = MPAL.bark, BD = MPAL.barkD, L = MPAL.leaf, r = rng(5);
  const bob = p.st === 'idle' ? p.i * 0.8 : 0, cx = 38;
  // 뿌리
  for (let i = 0; i < 7; i++) { const dx = (i - 3) * 5.5, sw = p.st === 'move' ? (p.i ? 1 : -1) * (i % 2 ? 1 : -1) : 0; limb(g, cx + dx * 0.4, 72, cx + dx * 1.6 + sw, 89, 5, 1.4, BD); }
  // 비틀린 몸통
  for (let y = 74; y >= 30; y -= 1.5) { const k = (74 - y) / 44, w = 14 - k * 3 + Math.sin(y * 0.35) * 0.8; blob(g, cx + Math.sin(y * 0.12) * 2.5, y + bob * k, w, 2.4, B, { rough: 0.35 }); }
  for (let i = 0; i < 12; i++) { const x = cx - 11 + i * 2; g.line(x, 34 + bob, x + Math.sin(i * 1.7) * 1.5, 72, B[1]); }
  // 왕관: 죽은 가지와 황혼빛 잎
  const tips = [];
  for (let i = 0; i < 7; i++) tips.push(branch(g, cx + (i - 3) * 2.5, 33 + bob, -Math.PI / 2 + (i - 3) * 0.32 + (r() - 0.5) * 0.2, 10 + r() * 6, 3.6, B, 2, r));
  for (let i = 0; i < 14; i++) { const [tx, ty] = tips[i % tips.length]; blob(g, tx + (r() - 0.5) * 10, ty + (r() - 0.5) * 8 + 2, 2.4 + r() * 1.6, 1.8 + r(), L, { rough: 0.6, n: 0.9 }); }
  for (let i = 0; i < 10; i++) { const x = cx - 14 + r() * 28; g.line(x, 30 + bob, x + (r() - 0.5) * 2, 36 + r() * 9 + bob, '#1e2a16'); }
  // 얼굴: 깊은 구멍과 금빛 눈, 갈라진 입
  blob(g, cx + 1, 49 + bob, 8.5, 7.5, ['#040201', '#0a0604'], { rough: 0.1 });
  const ey = 46 + bob, eyeC = p.st === 'wind' ? '#fff0a0' : '#ffd040';
  G.rect(cx - 3, ey, 3, 2, eyeC); G.rect(cx + 3, ey, 3, 2, eyeC); G.set(cx - 2, ey, '#ffffff'); G.set(cx + 4, ey, '#ffffff');
  const mouth = [[cx - 4, 53], [cx - 2, 55], [cx, 53], [cx + 2, 56], [cx + 4, 53], [cx + 6, 55]];
  for (let i = 0; i < mouth.length - 1; i++) G.line(mouth[i][0], mouth[i][1] + bob, mouth[i + 1][0], mouth[i + 1][1] + bob, p.st === 'wind' ? '#ff9a30' : '#c85a18');
  // 가슴의 갈라진 빛
  G.line(cx - 2, 60 + bob, cx + 1, 66 + bob, '#c85a18'); G.line(cx + 1, 66 + bob, cx - 1, 70 + bob, '#8a3a10');
  // 팔 가지: 휘두르기 준비(뒤로 높이) · 휘두름(앞으로 낮게)
  const armL = p.st === 'act' ? [6, 70] : [6, 58 + bob];
  const armR = p.st === 'wind' ? [64, 12] : p.st === 'act' ? [75, 74] : [70, 58 + bob];
  branch(g, cx - 11, 46 + bob, Math.atan2(armL[1] - 46, armL[0] - (cx - 11)), Math.hypot(armL[0] - cx + 11, armL[1] - 46) * 0.75, 5, B, 2, r);
  branch(g, cx + 11, 46 + bob, Math.atan2(armR[1] - 46, armR[0] - (cx + 11)), Math.hypot(armR[0] - cx - 11, armR[1] - 46) * 0.75, 5, B, 2, r);
  // 빛나는 버섯
  [[cx - 9, 66], [cx + 10, 62], [cx - 6, 40], [cx + 12, 70], [cx - 12, 56]].forEach(([x, y]) => { G.set(x, y + bob, '#ffb860'); G.set(x + 1, y + bob, '#d87a30'); });
}

const MON_ART = {
  wolf: { w: 42, h: 27, draw: drawWolf },
  rotwood: { w: 36, h: 42, draw: drawRotwood },
  crow: { w: 34, h: 26, draw: drawCrow },
  golem: { w: 46, h: 50, draw: drawGolem },
  boss: { w: 78, h: 90, draw: drawBoss },
};
// 프레임 굽기: 대기 2 · 이동 2 · 준비 1 · 공격 1
function bakeMonster(kind) {
  const A = MON_ART[kind], out = {};
  const one = (st, i) => {
    const g = new Pix(A.w, A.h, S), G = new Pix(A.w, A.h, S);
    A.draw(g, G, { st, i }); g.outline(OUT);
    const c = g.canvas(), gc = G.canvas();
    return { c, r: tex(c), l: tex(flipCanvas(c)), gr: tex(gc), gl: tex(flipCanvas(gc)) };
  };
  out.idle = [one('idle', 0), one('idle', 1)]; out.move = [one('move', 0), one('move', 1)]; out.wind = [one('wind', 0)]; out.act = [one('act', 0)];
  return out;
}
const MON_FRAMES = {}; for (const k in MON_ART) MON_FRAMES[k] = bakeMonster(k);

// 썩은 뿌리 가시 (나무 정령 · 군주 패턴)
const rootTex = (() => {
  const g = new Pix(10, 22, S);
  eachPx(g, 0, 0, 10, 22, (px, py, X, Y) => {
    const hw = 4.2 * Math.min(1, Y / 18) + 0.3, cx = 5 + Math.sin(Y * 0.5) * 1.2;
    if (Math.abs(X - cx) < hw) g.fset(px, py, MPAL.bark[shadeAt(0.6 - (X - cx) / hw * 0.3 + (vnoise(X, Y * 0.5) - 0.5) * 0.3, 5, px, py)]);
  });
  return tex(g.outline(OUT).canvas());
})();
