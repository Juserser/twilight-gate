'use strict';
// 공통 상수 · 노이즈 · 도트 캔버스(Pix) · 회전 스탬프

const PX = 1 / 16;           // 1 도트 = 1/16 월드 단위 (모든 그래픽 공통 밀도)
const TAU = Math.PI * 2;
const OUT = '#1a1024';       // 외곽선 색
const SHEET = location.search.includes('sheet');
const GAME_SPEED = 1.21;     // 게임 전체 속도 (이동 · 공격 · 몬스터 · 쿨타임 모두)
let AREA = 'town';           // 'town' (야영지) | 'dungeon'

// ===================================================================
// 노이즈 / 디더 유틸
// ===================================================================
function hash2(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.03 + 17, y * 2.03 + 5) * 0.3 + vnoise(x * 4.1 + 3, y * 4.1 + 11) * 0.15;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };

// ===================================================================
// 도트 캔버스
// ===================================================================
// S = 도트 밀도 배수. 화면에서 보이는 크기는 같고, 도트 한 칸이 1/S 크기가 된다.
const S = 2;
class Pix {
  constructor(w, h, s = 1) { this.s = s; this.w = w * s; this.h = h * s; this.d = new Array(this.w * this.h).fill(null); this.tx = 0; this.ty = 0; }
  // 실제 픽셀 하나
  fset(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (c == null || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  // 논리 좌표 한 칸 (s×s 블록)
  set(x, y, c) {
    x = Math.round(x) + this.tx; y = Math.round(y) + this.ty;
    for (let j = 0; j < this.s; j++) for (let i = 0; i < this.s; i++) this.fset(x * this.s + i, y * this.s + j, c);
  }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // 실제 해상도로 그리는 가는 선
  line(x0, y0, x1, y1, c) {
    const s = this.s, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * s;
    for (let i = 0; i <= n; i++) this.fset((x0 + (x1 - x0) * i / n + 0.5) * s, (y0 + (y1 - y0) * i / n + 0.5) * s, c);
  }
  stamp(x, y, rows, pal) {
    for (let j = 0; j < rows.length; j++) { const r = rows[j]; for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch !== '.') this.set(x + i, y + j, pal[ch]); } }
  }
  outline(c) {
    const o = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y * this.w + x]) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) o[y * this.w + x] = c;
    }
    this.d = o; return this;
  }
  canvas() {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const g = c.getContext('2d'), im = g.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const v = this.d[i]; if (!v) continue;
      const [r, gg, b] = hexRGB(v);
      im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  }
}
function flipCanvas(c) {
  const f = document.createElement('canvas'); f.width = c.width; f.height = c.height;
  const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f;
}
// 회전 스탬프 (역방향 샘플링이라 구멍이 안 생김)
function stampRot(g, rows, pal, pvx, pvy, hx, hy, ang) {
  const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const H = rows.length, W = Math.max(...rows.map(r => r.length));
  const R = Math.ceil(Math.hypot(Math.max(pvx, W - pvx), Math.max(pvy, H - pvy))) + 1;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const sx = Math.round(pvx + c * dx + s * dy), sy = Math.round(pvy - s * dx + c * dy);
    if (sy < 0 || sy >= H || sx < 0 || sx >= W) continue;
    const ch = rows[sy][sx]; if (!ch || ch === '.') continue;
    g.set(hx + dx, hy + dy, pal[ch]);
  }
}
const rotPt = (dx, dy, ang) => { const a = ang * Math.PI / 180; return [Math.cos(a) * dx - Math.sin(a) * dy, Math.sin(a) * dx + Math.cos(a) * dy]; };
