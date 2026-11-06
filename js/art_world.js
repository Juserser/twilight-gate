'use strict';
// 자연물 · 지형 도트 (절차적 생성)

// ===================================================================
// 자연물 도트 (절차적 생성)
// ===================================================================
const LEAF = ['#1a3226', '#24452e', '#335e36', '#4a7a3e', '#6a9a48', '#8cbc5a'];
const LEAF_PINE = ['#142a26', '#1c3a32', '#28503e', '#386a4a', '#548a58'];
const BARK = ['#2e1c14', '#4a3020', '#6a4a30', '#86603e'];
const GRASSC = ['#1f3c2a', '#2e5434', '#43703e', '#5f904a', '#86b45a'];
const ROCKC = ['#2a2636', '#423e52', '#5e5c72', '#82849a', '#a8acbe'];
// 실제 픽셀마다 논리 좌표(X, Y)를 넘겨주는 반복
function eachPx(g, x0, y0, x1, y1, fn) {
  const s = g.s;
  for (let py = Math.max(0, Math.floor(y0 * s)); py < Math.min(g.h, Math.ceil(y1 * s)); py++)
    for (let px = Math.max(0, Math.floor(x0 * s)); px < Math.min(g.w, Math.ceil(x1 * s)); px++)
      fn(px, py, (px + 0.5) / s, (py + 0.5) / s);
}
function canopy(g, blobs, pal, holes, seedOff) {
  blobs.sort((a, b) => a.y - b.y);
  for (const bl of blobs) {
    eachPx(g, bl.x - bl.r - 2, bl.y - bl.r - 2, bl.x + bl.r + 2, bl.y + bl.r + 2, (px, py, X, Y) => {
      const nx = (X - bl.x) / bl.r, ny = (Y - bl.y) / bl.r, d = Math.hypot(nx, ny);
      const edge = 1 + (vnoise(X * 0.35 + seedOff, Y * 0.35) - 0.5) * 0.3 + (vnoise(X * 1.2, Y * 1.2 + seedOff) - 0.5) * 0.14;
      if (d > edge) return;
      if (holes && d > 0.84 * edge && hash2(px + seedOff * 7, py) < 0.3) return;
      let v = 0.5 + (-0.55 * nx - 0.75 * ny) * 0.42 + (vnoise(X * 0.45 + seedOff, Y * 0.45) - 0.5) * 0.4 + (vnoise(X * 1.4, Y * 1.4 + seedOff * 3) - 0.5) * 0.28;
      if (ny > 0.35 && d > 0.75 * edge) v -= 0.25;
      if (hash2((px >> 1) + seedOff, py >> 1) < 0.07 && v > 0.45) v += 0.2;
      g.fset(px, py, pal[clamp(Math.floor(v * pal.length + bay(px, py) - 0.5), 0, pal.length - 1)]);
    });
  }
}
function trunk(g, cx, y0, y1, w0, w1) {
  eachPx(g, cx - w1 - 1, y0, cx + w1 + 1, y1 + 1, (px, py, X, Y) => {
    const t = clamp((Y - y0) / (y1 - y0), 0, 1), w = w0 + (w1 - w0) * Math.pow(t, 3);
    if (Math.abs(X - cx) > w) return;
    const rel = (X - (cx - w)) / (2 * w + 0.01);
    let i = rel < 0.28 ? 3 : rel < 0.55 ? 2 : rel < 0.8 ? 1 : 0;
    if (hash2(px, py >> 2) < 0.15) i = Math.max(0, i - 1);
    g.fset(px, py, BARK[i]);
  });
}
function thick(g, x0, y0, x1, y1, c, w) { for (let o = -w / 2; o <= w / 2; o += 0.5) g.line(x0 + o, y0, x1 + o, y1, c); }
function makeOak(seed) {
  const r = rng(seed), g = new Pix(72, 98, S);
  trunk(g, 36, 46, 95, 3.5, 7);
  thick(g, 36, 60, 24, 46, BARK[1], 1.5); thick(g, 37, 58, 48, 44, BARK[1], 1.5);
  const blobs = [{ x: 36, y: 34, r: 23 }];
  for (let i = 0; i < 8; i++) blobs.push({ x: 36 + (r() - 0.5) * 38, y: 30 + (r() - 0.5) * 30, r: 9 + r() * 9 });
  blobs.push({ x: 22, y: 50, r: 9 }, { x: 50, y: 49, r: 10 });
  canopy(g, blobs, LEAF, true, seed);
  return g.outline(OUT);
}
function makePine(seed) {
  const g = new Pix(52, 100, S);
  trunk(g, 26, 70, 97, 2.5, 4.5);
  for (let i = 0; i < 6; i++) {
    const top = 2 + i * 12, h = 22, half = 5 + i * 3.6;
    eachPx(g, 26 - half - 2, top, 26 + half + 2, top + h, (px, py, X, Y) => {
      const t = (Y - top) / h, w = half * Math.pow(t, 0.85) + 1;
      if (Math.abs(X - 26) > w) return;
      if (Y > top + h - 4 && hash2(px, py + i * 31) < 0.45) return;
      const nx = (X - 26) / (w + 0.01);
      let v = 0.55 - nx * 0.38 - t * 0.25 + (vnoise(X * 0.5 + seed, Y * 0.5) - 0.5) * 0.3 + (vnoise(X * 1.5, Y * 1.5) - 0.5) * 0.22;
      if (Y > top + h - 6) v -= 0.18;
      g.fset(px, py, LEAF_PINE[clamp(Math.floor(v * 5 + bay(px, py) - 0.5), 0, 4)]);
    });
  }
  return g.outline(OUT);
}
function makeBush(seed, berries) {
  const r = rng(seed), g = new Pix(36, 24, S), blobs = [];
  for (let i = 0; i < 5; i++) blobs.push({ x: 8 + r() * 20, y: 12 + r() * 6, r: 6 + r() * 4 });
  canopy(g, blobs, LEAF, true, seed);
  if (berries) for (let i = 0; i < 14; i++) {
    const px = Math.floor((6 + r() * 24) * S), py = Math.floor((8 + r() * 12) * S);
    if (!g.get(px, py)) continue;
    g.fset(px + 1, py, '#e04a5a'); g.fset(px, py + 1, '#a02838'); g.fset(px + 1, py + 1, '#c03848'); g.fset(px, py, '#ffb0b8');
  }
  return g.outline(OUT);
}
function makeRock(seed, w, h) {
  const g = new Pix(w, h, S), cx = w / 2, cy = h * 0.62;
  eachPx(g, 0, 0, w, h, (px, py, X, Y) => {
    const nx = (X - cx) / (w / 2 - 1), ny = (Y - cy) / (h * 0.62 - 1);
    const d = Math.hypot(nx, ny * (ny > 0 ? 1.8 : 1)) + (vnoise(X * 0.4 + seed, Y * 0.4) - 0.5) * 0.25;
    if (d > 1) return;
    let v = 0.55 - nx * 0.3 - ny * 0.45 + (vnoise(X * 0.6 + seed, Y * 0.6) - 0.5) * 0.3 + (vnoise(X * 1.7, Y * 1.7 + seed) - 0.5) * 0.16;
    if (Math.abs(vnoise(X * 0.45 + seed * 2, Y * 0.45) - 0.5) < 0.025) v -= 0.3;
    let c = ROCKC[clamp(Math.floor(v * 5 + bay(px, py) - 0.5), 0, 4)];
    if (ny < -0.45 && vnoise(X * 0.5, Y * 0.5 + seed) > 0.45) c = v > 0.6 ? '#7aa050' : '#577a3e';
    g.fset(px, py, c);
  });
  return g.outline(OUT);
}
function makeTuft(seed, flowers) {
  const r = rng(seed), g = new Pix(16, 12, S);
  for (let i = 0; i < 13; i++) {
    const bx = 3 + r() * 10, h = 4 + r() * 7, lean = (r() - 0.5) * 5, n = Math.ceil(h * S);
    for (let j = 0; j <= n; j++) {
      const t = j / n, x = Math.floor((bx + lean * t * t) * S), y = 12 * S - 1 - j;
      g.fset(x, y, GRASSC[clamp(Math.floor(t * 4.2 + 0.3), 0, 4)]);
      if (t < 0.45) g.fset(x + 1, y, GRASSC[clamp(Math.floor(t * 4.2), 0, 4)]);
    }
  }
  if (flowers) {
    const fc = [['#f6f0e0', '#ffd860'], ['#f0c040', '#fff0a0'], ['#e870a0', '#ffd0e0'], ['#9aa0f0', '#e0e4ff']][(r() * 4) | 0];
    for (let i = 0; i < 2; i++) {
      const cx = Math.floor((4 + r() * 8) * S), cy = Math.floor((1.5 + r() * 3) * S);
      for (let y = cy + 2; y < 12 * S; y++) g.fset(cx, y, GRASSC[2]);
      [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => g.fset(cx + dx, cy + dy, fc[0]));
      g.fset(cx, cy, fc[1]);
    }
  }
  return g;
}
function makeMushroom() {
  const g = new Pix(10, 10, S);
  g.stamp(0, 0, ["..rrrrr...", ".rRwrrrr..", "rRRrrrwrr.", "rrrrrrrrrr", "..dssssd..", "...ssss...", "...sSss...", "...ssss...", "..dsssssd."],
    { r: '#c83a3a', R: '#f07060', w: '#fff0e0', s: '#e8dcc0', S: '#fff8e8', d: '#8a7a60' });
  return g.outline(OUT);
}
function makeTent() {
  const W = 56, H = 42, g = new Pix(W, H, S), ax = 28, ay = 4, by = 39, half = 25;
  eachPx(g, 0, ay, W, by + 1, (px, py, X, Y) => {
    const t = (Y - ay) / (by - ay), w = half * t;
    if (Math.abs(X - ax) > w) return;
    const left = X < ax;
    let c = left ? '#cdb88c' : '#9e8662';
    if (Math.floor((Y - ay) * S) % (7 * S) === 0) c = left ? '#b8a27a' : '#8a7452';
    if (hash2(px, py) < 0.06) c = left ? '#c4ae82' : '#94805c';
    const ow = 9 * Math.max(0, (Y - 16) / (by - 16));
    if (Y > 16 && Math.abs(X - (ax + 2)) < ow) c = (X < ax + 2 - ow + 3) ? '#e6d6b0' : '#2a1e18';
    if (Y > 16 && Math.abs(X - (ax + 2)) < ow - 3 && Y > by - 3) c = '#3a2a1e';
    g.fset(px, py, c);
  });
  g.line(ax, 0, ax, ay, '#6a4a30');
  g.line(ax - half, by, 1, by + 2, '#d8c8a0'); g.line(ax + half, by, W - 2, by + 2, '#d8c8a0');
  g.line(ax, ay, 2, by - 6, '#b8a27a');
  g.set(ax, 0, '#e04a3a'); g.set(ax + 1, 0, '#e04a3a'); g.set(ax + 1, 1, '#e04a3a');
  return g.outline(OUT);
}
function makeDummy() {
  const g = new Pix(18, 34, S);
  g.stamp(1, 1, [
    ".....bbbbbb.....",
    "....bBBBBBBb....",
    "...bBBBBBBBBb...",
    "...bkBkBkBkBb...",
    "...bBkBBBkBBb...",
    "...bkBkBkBkBb...",
    "...bbBBBBBBbb...",
    ".....bbbbbbb....",
    ".......wv.......",
    "yyyyyyyyyyyyyyyy",
    "yYYYYYYYYYYYYYYy",
    ".yyy.yYYYYy.yyy.",
    ".....yYrrYy.....",
    "....yYrRRrYy....",
    "....yrRxxRry....",
    "....yrRxxRry....",
    "....yYrRRrYy....",
    ".....yYrrYy.....",
    ".....yYYYYy.....",
    "......nnnn......",
    ".....yYYYYy.....",
    "......yYYy......",
    ".......wv.......", ".......Wv.......", ".......wv.......", ".......Wv.......", ".......wv.......", ".......Wv.......",
    ".....vwwWwv.....",
    "....vvvvvvvv....",
  ], { b: '#8a6a4a', B: '#b8946a', k: '#3a2a1a', y: '#a88232', Y: '#e0c070', r: '#c03a2a', R: '#f2ead8', x: '#e04a3a', n: '#6a4a2a', w: '#7a4a2a', W: '#a46c3c', v: '#4a2a1a' });
  // 짚 결
  for (let i = 0; i < 40; i++) { const px = Math.floor((2 + hash2(i, 1) * 15) * S), py = Math.floor((10 + hash2(i, 2) * 12) * S); if (g.get(px, py) === '#e0c070') g.fset(px, py, '#c8a048'); }
  return g.outline(OUT);
}
function makeLogs() {
  const g = new Pix(26, 12, S);
  const log = (x0, y0, x1, y1) => {
    for (const [o, c] of [[-1, '#86603e'], [-0.5, '#7a5636'], [0, '#6a4a30'], [0.5, '#5a3e28'], [1, '#4a3020'], [1.5, '#3a2618'], [2, '#2e1c14']]) g.line(x0, y0 + o, x1, y1 + o, c);
    g.set(x1, y1 - 1, '#d8b888'); g.set(x1, y1, '#c8a070'); g.set(x1, y1 + 1, '#a07848');
  };
  log(2, 8, 22, 4); log(3, 4, 23, 8); log(6, 9, 20, 9);
  for (let i = 0; i < 10; i++) g.fset((8 + i * 1.3) * S, (7 + (i & 1)) * S, '#ff9a40');
  return g.outline(OUT);
}
function makeFireFrames() {
  const out = [];
  for (let f = 0; f < 6; f++) {
    const W = 18, H = 28, g = new Pix(W, H, S);
    eachPx(g, 0, 0, W, H, (px, py, X, Y) => {
      const fy = (H - Y) / H;
      const cx = 9 + Math.sin(f * 1.05 + fy * 5) * fy * 2.4;
      const width = 7 * Math.pow(Math.max(0, 1 - fy), 0.6) * (0.85 + 0.35 * vnoise(X * 0.3 + f * 3, Y * 0.25 - f * 1.3));
      const d = Math.abs(X - cx) / (width + 0.01);
      const it = 1 - d - fy * 0.35 + (vnoise(X * 0.55, Y * 0.32 + f * 1.7) - 0.5) * 0.7 + (vnoise(X * 1.5, Y * 1.1 + f * 2.3) - 0.5) * 0.25;
      if (it <= 0.04) return;
      g.fset(px, py, it > 0.78 ? '#fff6d0' : it > 0.55 ? '#ffd24a' : it > 0.3 ? '#ff8a22' : '#e0401a');
    });
    for (let i = 0; i < 6; i++) g.fset((4 + hash2(f, i) * 10) * S, (2 + hash2(i, f) * 8) * S, '#ffd24a');
    out.push(g.canvas());
  }
  return out;
}
function makeSlashFrames() {
  const out = [];
  [[-80, -5], [-80, 70], [-30, 85]].forEach(([a0, a1], f) => {
    const W = 44, H = 44, g = new Pix(W, H, S), cx = 6, cy = 22, Ro = 20;
    eachPx(g, 0, 0, W, H, (px, py, X, Y) => {
      const dx = X - cx, dy = Y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
      if (a < a0 || a > a1) return;
      const mid = (a0 + a1) / 2, span = (a1 - a0) / 2;
      const thick = 7 * Math.cos(((a - mid) / span) * Math.PI / 2);
      if (r > Ro || r < Ro - thick) return;
      if (f === 2 && bay(px, py) < 0.45) return;
      g.fset(px, py, r > Ro - 1.5 ? '#ffffff' : r > Ro - 3.5 ? '#d8f6ff' : '#7ad8ff');
    });
    out.push(g.canvas());
  });
  return out;
}
function makeArrow() {
  const g = new Pix(18, 5, S);
  g.line(1, 1, 15, 1, '#c08850');
  g.line(0, 0, 2, 1, '#e05050'); g.line(0, 2, 2, 1, '#e05050'); g.line(1, 0, 3, 1, '#e05050'); g.line(1, 2, 3, 1, '#e05050');
  g.line(14, 0, 17, 1, '#dfe6ee'); g.line(14, 2, 17, 1, '#9aa4b4'); g.line(15, 1, 17, 1, '#ffffff');
  return g.outline(OUT);
}
const SLIME_C = ['#4a1a50', '#74307a', '#a044a4', '#cc62c4', '#ee90dc', '#ffc4f0'];
function makeSlime(face) {
  const W = 36, H = 30, g = new Pix(W, H, S), cx = 18, cy = 17;
  eachPx(g, 0, 0, W, H, (px, py, X, Y) => {
    const nx = (X - cx) / 16.5, ny = (Y - cy) / (Y < cy ? 15 : 11.5), d = Math.hypot(nx, ny);
    if (d > 1) return;
    let v = 0.6 - nx * 0.28 - ny * 0.38 + (vnoise(X * 0.3, Y * 0.3) - 0.5) * 0.12;
    if (ny > 0.2 && d > 0.84) v -= 0.3;
    if (d < 0.5 && ny > 0) v -= 0.08;
    g.fset(px, py, SLIME_C[clamp(Math.floor(v * 5 + bay(px, py) - 0.5), 0, 4)]);
  });
  // 광택
  g.stamp(8, 6, ["..xx", ".xXXx", "xXXx.", "xx..."], { x: SLIME_C[4], X: '#fff0fa' });
  g.set(14, 5, '#fff0fa'); g.set(7, 12, SLIME_C[5]);
  // 자두 꼭지와 잎
  g.rect(17, 0, 2, 3, '#5a3a20'); g.set(17, 0, '#7a5a30');
  g.stamp(19, 0, [".llL", "lLLLl", ".lll"], { l: '#4a8a3a', L: '#7ac05a' });
  const K = '#24082a', Wt = '#ffffff';
  if (face === 'hurt') {
    for (const [ex, dir] of [[21, 1], [29, -1]]) { g.set(ex, 13, K); g.set(ex + dir, 14, K); g.set(ex + dir * 2, 15, K); g.set(ex + dir, 16, K); g.set(ex, 17, K); }
    [[22, 21], [23, 20], [24, 21], [25, 20], [26, 21], [27, 20]].forEach(([x, y]) => g.set(x, y, K));
  } else {
    g.rect(21, 13, 3, 5, K); g.rect(27, 13, 3, 5, K);
    g.set(21, 13, Wt); g.set(22, 14, Wt); g.set(27, 13, Wt); g.set(28, 14, Wt);
    if (face === 'angry') {
      thick(g, 19, 10, 23, 12, K, 1); thick(g, 31, 10, 27, 12, K, 1);
      g.rect(22, 20, 7, 3, K); g.set(23, 20, Wt); g.set(27, 20, Wt); g.rect(23, 22, 5, 1, '#d04a6a');
    } else {
      [[23, 20], [24, 21], [25, 21], [26, 21], [27, 20]].forEach(([x, y]) => g.set(x, y, K));
      g.rect(18, 19, 2, 1, '#ff8ab8'); g.rect(31, 19, 2, 1, '#ff8ab8');
    }
  }
  return g.outline(OUT);
}
function makeOrb() {
  const g = new Pix(12, 12, S);
  eachPx(g, 0, 0, 12, 12, (px, py, X, Y) => {
    const d = Math.hypot(X - 6, Y - 6);
    if (d < 5.5) g.fset(px, py, d < 2 ? '#ffffff' : d < 3.5 ? '#bff6ff' : '#4ad0f0');
  });
  return g;
}

// ===================================================================
// 지형 텍스처
// ===================================================================
const POND = { x: -7.5, z: 4.5 };
const pondR = a => 2.6 + 0.4 * Math.sin(3 * a + 1) + 0.22 * Math.sin(5 * a + 2);
const pondSDF = (x, z) => { const dx = x - POND.x, dz = z - POND.z; return Math.hypot(dx, dz) - pondR(Math.atan2(dz, dx)); };
const FIRE = { x: 0, z: 0 }, TENT = { x: -4.2, z: -4.8 }, DUMMY = { x: 6, z: -1.6 };
const PATHS = [
  [[0.5, 24], [1.3, 15], [0.2, 8], [0.7, 2.2]],
  [[-0.6, -0.8], [-2.4, -2.6], [-3.8, -3.6]],
  [[1.2, 0.8], [3.6, -0.4], [5.6, -1.2]],
];
function segD(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az, t = clamp(((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz), 0, 1);
  return Math.hypot(px - ax - vx * t, pz - az - vz * t);
}
function pathDist(x, z) {
  let d = 1e9;
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) d = Math.min(d, segD(x, z, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]));
  return d;
}
function grassPixel(px, py, wx, wz, lush) {
  const b = bay(px, py);
  let v = fbm(wx * 0.28, wz * 0.28) * 0.8 + vnoise(wx * 1.6, wz * 1.6) * 0.3 + (vnoise(wx * 5, wz * 5) - 0.5) * 0.14 - 0.08 - lush;
  let gi = clamp(Math.floor(v * 5 + b - 0.5), 0, 4);
  if (hash2(px, py) < 0.03 || hash2(px, py + 1) < 0.03 || hash2(px, py + 2) < 0.03) gi = Math.min(4, gi + 1);
  if (hash2(px + 7, py) < 0.02) gi = Math.max(0, gi - 1);
  return GRASSC[gi];
}
function makeGround(X0, Z0, W, D, full) {
  const R16 = 16 * S, w = W * R16, h = D * R16, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  const DIRT = ['#4e3828', '#64482f', '#7e5c3c', '#98724a'], MUD = ['#2e2c22', '#4a4230', '#5e5438'];
  const FLOW = ['#f6f0e0', '#f2c040', '#e870a0', '#9aa0f0'];
  const rgb = {}; const toRGB = col => rgb[col] || (rgb[col] = hexRGB(col));
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const wx = X0 + (px + 0.5) / R16, wz = Z0 + (py + 0.5) / R16, b = bay(px, py);
    let col;
    if (!full) col = grassPixel(px, py, wx, wz, 0);
    else {
      const ps = pondSDF(wx, wz);
      col = grassPixel(px, py, wx, wz, ps < 1.2 ? 0.22 * (1.2 - ps) : 0);
      const pd = pathDist(wx, wz) + (vnoise(wx * 2.2, wz * 2.2) - 0.5) * 0.5 + (vnoise(wx * 7, wz * 7) - 0.5) * 0.08;
      if (hash2(px >> 2, py >> 2) < 0.003 && pd > 1.4 && ps > 0.8) col = FLOW[(hash2(py >> 2, px >> 2) * 4) | 0];
      if (pd < 0.74) {
        const dv = vnoise(wx * 3, wz * 3) * 0.5 + vnoise(wx * 9, wz * 9) * 0.15 + 0.4 - (pd / 0.74) * 0.4;
        col = DIRT[clamp(Math.floor(dv * 4 + b - 0.5), 0, 3)];
        if (hash2(px >> 1, py >> 1) < 0.012) col = '#b4ac98';
        else if (hash2(px >> 1, (py >> 1) - 1) < 0.012) col = '#3a2a20';
      } else if (pd < 0.86 && b > 0.45) col = DIRT[0];
      const fr = Math.hypot(wx - FIRE.x, wz - FIRE.z);
      if (fr < 1.7 && (1.7 - fr) / 1.7 + (b - 0.5) * 0.45 > 0.3) col = hash2(px, py) < 0.5 ? '#2a221e' : '#3c302a';
      if (fr < 0.7 && hash2(px, py) < 0.05) col = '#ff7a30';
      if (ps < 0.5) col = ps < 0 ? MUD[0] : ps < 0.22 ? MUD[1] : (b < 0.5 ? MUD[2] : col);
    }
    const [r, gg, bb] = toRGB(col), i = (py * w + px) * 4;
    im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = bb; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
function makeCliffFace(W) {
  const w = W * 16, h = 48, g = new Pix(w, h, S);
  eachPx(g, 0, 0, w, h, (px, py, x, y) => {
    const sh = vnoise(x * 0.07, 3) * 7;
    let v = fbm(x * 0.06, y * 0.2) * 0.75 + vnoise(x * 0.3, y * 0.3) * 0.3 + (vnoise(x * 1.2, y * 1.2) - 0.5) * 0.14 + (1 - y / h) * 0.18 - 0.08;
    const sy = (y + sh) % 12;
    if (sy < 0.6) v -= 0.45; else if (sy < 1.8) v += 0.16;
    if (hash2(Math.floor(x / 11), Math.floor((y + sh) / 12)) < 0.25 && Math.floor(x * S) % (11 * S) === 0) v -= 0.4;
    let c = ROCKC[clamp(Math.floor(v * 5 + bay(px, py) - 0.5), 0, 4)];
    const mossLine = 3 + vnoise(x * 0.25, 1) * 6;
    if (y < mossLine) c = GRASSC[clamp(Math.floor((1 - y / mossLine) * 3 + bay(px, py)), 1, 4)];
    else if (y < mossLine + 4 && vnoise(x * 0.5, y * 0.5) > 0.6) c = '#3e5a36';
    if (y > h - 4 && bay(px, py) < (y - (h - 4)) / 4) c = '#1e1a28';
    g.fset(px, py, c);
  });
  return g.canvas();
}
function makeFringe(W) {
  const w = W * 16, g = new Pix(w, 12, S);
  for (let px = 0; px < w * S; px++) {
    const x = (px + 0.5) / S, len = (2 + Math.floor(vnoise(x * 0.35, 9) * 6 + hash2(px, 3) * 3)) * S;
    for (let j = 0; j < len; j++) g.fset(px, j, GRASSC[clamp(3 - Math.floor(j / len * 3.5), 0, 4)]);
  }
  return g.canvas();
}
function makeTreeline() {
  const w = 1100, h = 96, g = new Pix(w, h);
  for (let layer = 0; layer < 2; layer++) {
    const cols = layer ? ['#1c2238', '#222a42'] : ['#2a3150', '#323a5a'];
    for (let x = 0; x < w; x++) {
      const k = x % 26, peak = 30 + layer * 22 + vnoise(x * 0.02 + layer * 9, layer) * 26;
      const tip = peak + Math.abs(k - 13) * 1.6 + hash2(x >> 3, layer) * 4;
      for (let y = Math.floor(tip); y < h; y++) g.set(x, y, cols[(bay(x, y) < 0.5 ^ (y > tip + 6)) ? 0 : 1]);
    }
  }
  return g.canvas();
}
function makeMountains() {
  const w = 640, h = 140, g = new Pix(w, h);
  const layers = [
    { base: 40, amp: 60, f: 0.006, cols: ['#3e3460', '#4a3e6c', '#5e4e7c'], snow: true },
    { base: 80, amp: 40, f: 0.011, cols: ['#2e2a4c', '#363056', '#40385e'] },
  ];
  for (const L of layers) for (let x = 0; x < w; x++) {
    const top = L.base + (1 - fbm(x * L.f, L.base)) * L.amp;
    for (let y = Math.floor(top); y < h; y++) {
      const s = vnoise(x * 0.08, y * 0.08) * 0.4 + (x % 37 < 18 ? 0.25 : 0) + (1 - (y - top) / 60) * 0.35;
      let c = L.cols[clamp(Math.floor(s * 3 + bay(x, y) - 0.5), 0, 2)];
      if (L.snow && y < top + 6 && top < 62) c = bay(x, y) < 0.6 ? '#d8c8e8' : '#b0a0c8';
      g.set(x, y, c);
    }
  }
  return g.canvas();
}
function makeSky() {
  const w = 16, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  const stops = ['#141432', '#22224a', '#3a2c5e', '#5e3a6e', '#8e4a6c', '#c8605e', '#ec8a5c', '#ffb46c'].map(hexRGB);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = Math.pow(y / (h - 1), 1.25) * (stops.length - 1), i = Math.floor(t), f = t - i;
    const col = stops[Math.min(stops.length - 1, i + (f > bay(x, y) ? 1 : 0))];
    const k = (y * w + x) * 4; im.data[k] = col[0]; im.data[k + 1] = col[1]; im.data[k + 2] = col[2]; im.data[k + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
function makeCloud(seed) {
  const r = rng(seed), g = new Pix(80, 22);
  const blobs = []; for (let i = 0; i < 7; i++) blobs.push({ x: 12 + r() * 56, y: 12 + r() * 4, r: 5 + r() * 6 });
  for (let y = 0; y < 22; y++) for (let x = 0; x < 80; x++) {
    let inside = false, ny = 0;
    for (const b of blobs) { const d = Math.hypot(x - b.x, (y - b.y) * 1.3); if (d < b.r) { inside = true; ny = Math.max(ny, (y - b.y + b.r) / (2 * b.r)); } }
    if (!inside || y > 17) continue;
    g.set(x, y, ny + (bay(x, y) - 0.5) * 0.3 < 0.4 ? '#ffd0b0' : ny < 0.7 ? '#e89090' : '#9a6088');
  }
  return g.canvas();
}
function makeSun() {
  const g = new Pix(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 20);
    if (d < 19) g.set(x, y, d + (bay(x, y) - 0.5) * 3 < 13 ? '#fff4d8' : '#ffc070');
  }
  return g.canvas();
}
function glowCanvas() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
