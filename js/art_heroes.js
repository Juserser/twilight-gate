'use strict';
// 캐릭터 도트: 관절 리그와 세 직업의 그림

// ===================================================================
// 캐릭터 도트
// ===================================================================
// 관절(뼈대) 위에 부위를 칠하고, 부위별로 명암/외곽선을 자동으로 넣는 방식
const HW = 96, HH = 68, OX = 48, WALK_N = 6;
function pip(px, py, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function ik(a, b, l1, l2, sign) {
  const dx = b.x - a.x, dy = b.y - a.y, d = clamp(Math.hypot(dx, dy), 0.01, l1 + l2 - 0.01);
  const a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), an = Math.atan2(dy, dx) - sign * a1;
  return { x: a.x + Math.cos(an) * l1, y: a.y + Math.sin(an) * l1 };
}
class Rig {
  constructor() { this.W = HW * S; this.H = HH * S; this.reg = new Int16Array(this.W * this.H).fill(-1); this.parts = []; this.ids = {}; }
  part(name, ramp, opt = {}) {
    if (this.ids[name] == null) { this.ids[name] = this.parts.length; this.parts.push(Object.assign({ ramp }, opt)); }
    return this.ids[name];
  }
  put(px, py, id) { if (px >= 0 && py >= 0 && px < this.W && py < this.H) this.reg[py * this.W + px] = id; }
  // 실제 픽셀 하나 (논리 좌표, 0.5 단위로 세밀하게 찍을 수 있음)
  fpx(id, x, y) { this.put(Math.floor((x + OX) * S), Math.floor(y * S), id); }
  // 논리 한 칸 (S×S)
  px(id, x, y) {
    const X = Math.round(x + OX) * S, Y = Math.round(y) * S;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) this.put(X + i, Y + j, id);
  }
  disc(id, cx, cy, r) {
    const CX = (cx + OX) * S, CY = cy * S, rr = r * S, R2 = rr * rr;
    for (let py = Math.floor(CY - rr); py <= Math.ceil(CY + rr); py++)
      for (let px = Math.floor(CX - rr); px <= Math.ceil(CX + rr); px++)
        if ((px + 0.5 - CX) ** 2 + (py + 0.5 - CY) ** 2 <= R2) this.put(px, py, id);
  }
  capsule(id, x0, y0, r0, x1, y1, r1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * S * 1.5) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n; this.disc(id, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t); }
  }
  ellipse(id, cx, cy, rx, ry) {
    for (let py = Math.floor((cy - ry) * S); py <= Math.ceil((cy + ry) * S); py++)
      for (let px = Math.floor((cx - rx + OX) * S); px <= Math.ceil((cx + rx + OX) * S); px++) {
        const X = (px + 0.5) / S - OX, Y = (py + 0.5) / S;
        if (((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1) this.put(px, py, id);
      }
  }
  poly(id, pts) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    for (let py = Math.floor(Math.min(...ys) * S); py <= Math.ceil(Math.max(...ys) * S); py++)
      for (let px = Math.floor((Math.min(...xs) + OX) * S); px <= Math.ceil((Math.max(...xs) + OX) * S); px++)
        if (pip((px + 0.5) / S - OX, (py + 0.5) / S, pts)) this.put(px, py, id);
  }
  rect(id, x, y, w, h) {
    for (let py = Math.round(y * S); py < Math.round((y + h) * S); py++)
      for (let px = Math.round((x + OX) * S); px < Math.round((x + w + OX) * S); px++) this.put(px, py, id);
  }
  line(id, x0, y0, x1, y1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 0.5) * S * 1.5);
    for (let i = 0; i <= n; i++) this.fpx(id, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
  }
  render() {
    const W = this.W, H = this.H, R = this.reg, g = new Pix(W, H), gl = new Pix(W, H);
    let glow = false;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? -1 : R[y * W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const id = R[y * W + x]; if (id < 0) continue;
      const P = this.parts[id];
      let col;
      if (P.flat) col = P.ramp[0];
      else {
        const s = (dx, dy) => at(x + dx, y + dy) === id;
        let k = 2;
        if (!s(1, 0) || !s(0, 1)) k = 0;
        else if (!s(2, 0) || !s(0, 2) || !s(3, 0)) k = 1;
        else if (!s(-1, 0) || !s(0, -1)) k = (!s(-1, 0) && !s(0, -1)) ? 4 : 3;
        else if (!s(-2, 0) || !s(0, -2)) k = 3;
        else if ((!s(4, 0) || !s(0, 4)) && bay(x, y) < 0.5) k = 1;
        col = P.ramp[k];
      }
      g.d[y * W + x] = col;
      if (P.glow) { gl.d[y * W + x] = col; glow = true; }
    }
    g.outline(OUT);
    return { g, gl: glow ? gl : null };
  }
}

const RAMP = {
  skin: ['#5a2e26', '#94584a', '#c88a6c', '#e6b08c', '#f6d0ac'],
  steel: ['#14141c', '#242632', '#3a4052', '#5c647c', '#98a2ba'],
  blade: ['#2a2e3a', '#5a6278', '#9aa4ba', '#cad2e2', '#f4f8ff'],
  red: ['#260a0e', '#481216', '#701c22', '#9c2e2e', '#c44c46'],
  fur: ['#2e2420', '#4a3c34', '#6a5a4c', '#8c7a68', '#b4a28c'],
  lthD: ['#16100c', '#261c14', '#3a2a1e', '#523c2a', '#6c5238'],
  lth: ['#2a1a12', '#42281a', '#5e3e26', '#7e5634', '#a07246'],
  silver: ['#34343f', '#555566', '#84849a', '#b4b4c8', '#e2e2ee'],
  teal: ['#0c1618', '#142426', '#1e3a38', '#2f5650', '#48766a'],
  beige: ['#3e3226', '#5e4c3a', '#86705a', '#ab967a', '#d0bc9c'],
  wood: ['#2a180e', '#4a2c18', '#6e4426', '#946036', '#b47e4c'],
  black: ['#08060e', '#120e1c', '#1e182c', '#2e2642', '#443a5c'],
  black2: ['#100c18', '#221c30', '#342c48', '#4a4064', '#685a86'],
  purple: ['#1c0a2c', '#32144c', '#4e2270', '#723698', '#9a56c0'],
  bone: ['#3a3640', '#6a6672', '#9a96a2', '#c4c0cc', '#ecebf0'],
  dblade: ['#1a1824', '#3a3650', '#6a6688', '#a8a4c8', '#e8e4ff'],
};
const FLAT = c => [c];
const pt = (x, y) => ({ x, y });

function basePose(o = {}) {
  const b = o.bob || 0, l = o.lean || 0;
  const P = {
    bob: b, lean: l, swing: 0,
    hipB: pt(-2 + l * 0.3, 43), hipF: pt(2 + l * 0.3, 43),
    ankB: pt(-3, 60), ankF: pt(3, 60),
    shB: pt(-4 + l, 30 + b), shF: pt(4 + l, 30 + b),
    handB: pt(-6, 42 + b), handF: pt(7, 42 + b),
    head: pt(1 + l, 22 + b),
  };
  if (o.walk != null) {
    const p = o.walk;
    P.ankF.x = 3 + Math.sin(p) * 5; P.ankF.y = 60 - Math.max(0, Math.cos(p)) * 2.5;
    P.ankB.x = -3 - Math.sin(p) * 5; P.ankB.y = 60 - Math.max(0, -Math.cos(p)) * 2.5;
    P.swing = Math.sin(p);
  }
  return P;
}
function torsoPts(P, wt, ww) {
  const b = P.bob, l = P.lean;
  return [[-wt + l, 29 + b], [wt + l, 29 + b], [wt + 1 + l * 0.7, 33 + b], [ww + l * 0.3, 40 + b * 0.5], [-ww + l * 0.3, 40 + b * 0.5], [-wt - 1 + l * 0.7, 33 + b]];
}
function drawLeg(R, hip, ank, ids) {
  const knee = ik(hip, ank, 9, 9, 1);
  R.capsule(ids.thigh, hip.x, hip.y, 2.8, knee.x, knee.y, 2.2);
  R.capsule(ids.shin, knee.x, knee.y, 2.2, ank.x, ank.y - 1, 1.9);
  R.capsule(ids.boot, ank.x, ank.y - 2, 2.1, ank.x, ank.y, 2.0);
  R.capsule(ids.boot, ank.x, ank.y + 0.5, 1.7, ank.x + 4.5, Math.min(62.4, ank.y + 1.8), 1.3);
}
function drawArm(R, sh, hand, ids, r = 1.9) {
  const el = ik(sh, hand, 7, 7, -1);
  R.capsule(ids.upper, sh.x, sh.y, r + 0.3, el.x, el.y, r);
  R.capsule(ids.fore, el.x, el.y, r, hand.x, hand.y, r - 0.2);
  R.disc(ids.hand, hand.x, hand.y, 1.6);
}
function face(R, P, skin) {
  const h = P.head;
  R.ellipse(skin, h.x, h.y, 4.6, 5.3);
  R.px(skin, h.x + 5, h.y + 1); R.px(skin, h.x + 4, h.y + 3);
}
function xf(hand, ang) {
  const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return (u, v) => [hand.x + u * c - v * s, hand.y + u * s + v * c];
}
function greatsword(R, ids, hand, ang) {
  const T = xf(hand, ang);
  R.poly(ids.blade, [T(4, -2.6), T(33, -2.2), T(38, 0), T(33, 2.2), T(4, 2.6)]);
  R.line(ids.fuller, ...T(6, 0), ...T(29, 0));
  R.poly(ids.guard, [T(2.4, -5), T(4.6, -5), T(4.6, 5), T(2.4, 5)]);
  R.capsule(ids.grip, ...T(-5, 0), 1.1, ...T(2, 0), 1.1);
  R.disc(ids.pommel, ...T(-6.6, 0), 1.7);
}
function dagger(R, blade, grip, tip, hand, ang) {
  const T = xf(hand, ang);
  R.poly(blade, [T(1, -1.3), T(8, -0.8), T(11, 0), T(8, 0.8), T(1, 1.3)]);
  R.line(grip, ...T(0.5, -2.2), ...T(0.5, 2.2));
  R.capsule(grip, ...T(-3, 0), 0.9, ...T(0, 0), 0.9);
  R.line(tip, ...T(7, -0.7), ...T(10.5, 0));
}
function longbow(R, ids, hand, draw, arrow) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = -1 + i / 6, at = Math.abs(t);
    pts.push(pt(hand.x + 3.2 * (1 - t * t) - 3.2 + (at > 0.8 ? (at - 0.8) * 8 : 0), hand.y + t * 15));
  }
  for (let i = 0; i < 12; i++) R.capsule(ids.bow, pts[i].x, pts[i].y, 1.0, pts[i + 1].x, pts[i + 1].y, 1.0);
  R.capsule(ids.grip, hand.x, hand.y - 2.5, 1.4, hand.x, hand.y + 2.5, 1.4);
  const pull = pt(hand.x - 3.2 - draw, hand.y);
  R.line(ids.string, pts[0].x, pts[0].y, pull.x, pull.y);
  R.line(ids.string, pull.x, pull.y, pts[12].x, pts[12].y);
  if (arrow) {
    R.line(ids.shaft, pull.x, hand.y, hand.x + 7, hand.y);
    R.line(ids.head, hand.x + 6.5, hand.y - 1, hand.x + 8.5, hand.y); R.line(ids.head, hand.x + 6.5, hand.y + 1, hand.x + 8.5, hand.y);
    R.line(ids.fletch, pull.x + 0.5, hand.y - 1, pull.x + 2.5, hand.y); R.line(ids.fletch, pull.x + 0.5, hand.y + 1, pull.x + 2.5, hand.y);
  }
}

const HEROES = {
  berserker: {
    name: '광전사',
    pose(st, i) {
      if (st === 'skill') {
        const A = [
          { lean: 1, bob: 1, hf: [14, 35], hb: [11, 36], ang: 2, af: 6, ab: -6, bf: true },
          { lean: -1, bob: 1, hf: [-11, 35], hb: [-8, 36], ang: 178, af: 6, ab: -6 },
          { lean: 0, bob: -2, hf: [-2, 18], hb: [-4, 20], ang: -150, af: 5, ab: -2, ay: 55 },
          { lean: -1, bob: 3, hf: [-8, 45], hb: [-6, 45], ang: 160, af: 7, ab: -7 },
          { lean: 4, bob: 2, hf: [7, 41], hb: [3, 42], ang: 200, af: 8, ab: -8 },             // 4 돌진 (어깨를 앞으로)
          { lean: 1, bob: -1, hf: [8, 19], hb: [6, 20], ang: -78, af: 5, ab: -4, bf: true },  // 5 올려베기
          { lean: -2, bob: 0, hf: [15, 27], hb: [-13, 27], ang: -35, af: 6, ab: -6, up: 1 },  // 6 포효
          { lean: 0, bob: -1, hf: [5, 31], hb: [3, 32], ang: 92, af: 4, ab: -3, ay: 56, bf: true }, // 7 내려꽂기
        ][i];
        const P = basePose({ lean: A.lean, bob: A.bob });
        P.handF = pt(...A.hf); P.handB = pt(...A.hb); P.ang = A.ang; P.ankF.x = A.af; P.ankB.x = A.ab; P.backFront = !!A.bf;
        if (A.ay) { P.ankF.y = A.ay; P.ankB.y = A.ay - 1; }
        if (A.up) P.head.y -= 1;
        return P;
      }
      if (st === 'idle') { const P = basePose({ bob: [0, 0, 1, 1][i] }); P.handF = pt(8, 34 + P.bob); P.handB = pt(-6, 42 + P.bob); P.ang = -118; return P; }
      if (st === 'walk') { const P = basePose({ walk: i / WALK_N * TAU, bob: i % 3 === 1 ? -1 : 0 }); P.handF = pt(8, 34 + P.bob); P.handB = pt(-6 + P.swing * 3, 42 + P.bob); P.ang = -118 + P.swing * 4; return P; }
      const A = [
        { lean: -1, bob: 0, hf: [-2, 19], hb: [-4, 21], ang: -165, af: 4, ab: -4 },
        { lean: 2, bob: 1, hf: [13, 33], hb: [10, 34], ang: 28, af: 7, ab: -6 },
        { lean: 2, bob: 2, hf: [11, 46], hb: [8, 46], ang: 78, af: 7, ab: -6 },
      ][i];
      const P = basePose({ lean: A.lean, bob: A.bob });
      P.handF = pt(...A.hf); P.handB = pt(...A.hb); P.ang = A.ang; P.ankF.x = A.af; P.ankB.x = A.ab; P.backFront = i > 0;
      return P;
    },
    draw(R, P) {
      const p = (n, r, o) => R.part(n, r, o);
      const I = {
        paulB: p('paulB', RAMP.steel), armB: p('armB', RAMP.steel), gauntB: p('gauntB', RAMP.steel), handB: p('handB', RAMP.lthD),
        thighB: p('thighB', RAMP.lthD), greaveB: p('greaveB', RAMP.steel), bootB: p('bootB', RAMP.lthD),
        thighF: p('thighF', RAMP.lthD), greaveF: p('greaveF', RAMP.steel), bootF: p('bootF', RAMP.lthD),
        tabard: p('tabard', RAMP.red), chest: p('chest', RAMP.steel), belt: p('belt', RAMP.lth), gold: p('gold', FLAT('#d8a838')),
        fur: p('fur', RAMP.fur), blade: p('blade', RAMP.blade), fuller: p('fuller', FLAT('#5a6278')), guard: p('guard', RAMP.lth),
        grip: p('grip', RAMP.lthD), pommel: p('pommel', RAMP.steel),
        skin: p('skin', RAMP.skin), hair: p('hair', RAMP.silver), eye: p('eye', FLAT('#140c10')), brow: p('brow', FLAT('#44445a')), scar: p('scar', FLAT('#9a3a36')),
        paulF: p('paulF', RAMP.steel), trim: p('trim', RAMP.red), armF: p('armF', RAMP.steel), gauntF: p('gauntF', RAMP.steel), handF: p('handF', RAMP.lthD),
      };
      const b = P.bob, h = P.head, sw = P.swing, l = P.lean;
      const backArm = () => { R.ellipse(I.paulB, P.shB.x - 1, P.shB.y, 3.4, 3); drawArm(R, P.shB, P.handB, { upper: I.armB, fore: I.gauntB, hand: I.handB }, 2); };
      if (!P.backFront) backArm();
      drawLeg(R, P.hipB, P.ankB, { thigh: I.thighB, shin: I.greaveB, boot: I.bootB });
      drawLeg(R, P.hipF, P.ankF, { thigh: I.thighF, shin: I.greaveF, boot: I.bootF });
      R.poly(I.tabard, [[-3 + l * 0.3, 40], [4 + l * 0.3, 40], [3 + sw, 54], [-2 + sw, 53]]);
      R.poly(I.chest, torsoPts(P, 7, 5.5));
      R.rect(I.belt, -6 + l * 0.3, 39 + b * 0.5, 13, 3); R.rect(I.gold, l * 0.3, 39 + b * 0.5, 2, 2);
      R.ellipse(I.fur, l, 29 + b, 7.5, 3);
      if (P.backFront) backArm();
      greatsword(R, I, P.handF, P.ang);
      face(R, P, I.skin);
      R.ellipse(I.hair, h.x - 2.5, h.y - 3.2, 4.2, 2.8);
      R.ellipse(I.hair, h.x - 4, h.y + 0.5, 1.8, 3.6);
      R.poly(I.hair, [[h.x - 5, h.y - 3], [h.x - 10, h.y - 6], [h.x - 4, h.y - 6]]);
      R.poly(I.hair, [[h.x - 3, h.y - 5], [h.x - 4, h.y - 10], [h.x + 1, h.y - 6]]);
      R.poly(I.hair, [[h.x, h.y - 6], [h.x + 4, h.y - 9], [h.x + 4, h.y - 4]]);
      R.poly(I.hair, [[h.x + 1, h.y - 6], [h.x + 5.5, h.y - 4], [h.x + 2, h.y - 3]]);
      R.line(I.brow, h.x + 1.5, h.y - 1, h.x + 4, h.y - 1.5); R.line(I.brow, h.x + 1.5, h.y - 0.5, h.x + 3.5, h.y - 1);
      R.fpx(I.eye, h.x + 2.5, h.y); R.fpx(I.eye, h.x + 3, h.y); R.fpx(I.eye, h.x + 3, h.y + 0.5); R.fpx(R.part('eyeW', FLAT('#e8e0d8')), h.x + 3.5, h.y);
      R.line(I.scar, h.x + 1.5, h.y + 1.5, h.x + 3.5, h.y + 3.5);
      R.ellipse(I.paulF, P.shF.x + 1, P.shF.y - 0.5, 4.6, 3.6);
      R.rect(I.trim, P.shF.x - 3, P.shF.y + 2.5, 8, 1); [[-2, -1.5], [1, -2.5], [4, -1.5]].forEach(([dx, dy]) => R.fpx(I.gold, P.shF.x + dx, P.shF.y + dy)); R.line(I.trim, P.lean - 2, 31 + b, P.lean + 3, 31 + b);
      drawArm(R, P.shF, P.handF, { upper: I.armF, fore: I.gauntF, hand: I.handF }, 2.1);
    },
  },
  hawk: {
    name: '매사냥꾼',
    pose(st, i) {
      if (st === 'idle') { const P = basePose({ bob: [0, 0, 1, 1][i] }); P.handF = pt(8, 40 + P.bob); P.handB = pt(-6, 42 + P.bob); P.draw = 0; return P; }
      if (st === 'walk') { const P = basePose({ walk: i / WALK_N * TAU, bob: i % 3 === 1 ? -1 : 0 }); P.handF = pt(8 - P.swing * 2, 40 + P.bob); P.handB = pt(-6 + P.swing * 3, 42 + P.bob); P.draw = 0; return P; }
      const A = [{ hb: [2, 32], draw: 6, arrow: 1 }, { hb: [-1, 32], draw: 9, arrow: 1 }, { hb: [-5, 34], draw: 0, arrow: 0 }][i];
      const P = basePose({ lean: 1 });
      P.handF = pt(12, 32); P.handB = pt(...A.hb); P.draw = A.draw; P.arrow = A.arrow; P.backFront = true; P.ankF.x = 5; P.ankB.x = -4;
      return P;
    },
    draw(R, P) {
      const p = (n, r, o) => R.part(n, r, o);
      const I = {
        scarfT: p('scarfT', RAMP.beige), quiver: p('quiver', RAMP.lth), fletch: p('fletch', FLAT('#c04a3a')), coatB: p('coatB', RAMP.teal),
        armB: p('armB', RAMP.teal), bracerB: p('bracerB', RAMP.lth), handB: p('handB', RAMP.lthD),
        thighB: p('thighB', RAMP.lthD), bootB: p('bootB', RAMP.lth), thighF: p('thighF', RAMP.lthD), bootF: p('bootF', RAMP.lth),
        vest: p('vest', RAMP.lth), coatF: p('coatF', RAMP.teal), belt: p('belt', RAMP.lthD), pouch: p('pouch', RAMP.lth), skirt: p('skirt', RAMP.teal),
        scarf: p('scarf', RAMP.beige), hood: p('hood', RAMP.teal), brim: p('brim', RAMP.teal), skin: p('skin', RAMP.skin), mask: p('mask', RAMP.beige),
        eye: p('eye', FLAT('#140c10')), bow: p('bow', RAMP.wood), grip: p('grip', RAMP.lthD), string: p('string', FLAT('#d8d0c0')),
        shaft: p('shaft', FLAT('#a07040')), head: p('head', FLAT('#c8d0dc')),
        armF: p('armF', RAMP.teal), bracerF: p('bracerF', RAMP.lth), handF: p('handF', RAMP.lthD),
      };
      const b = P.bob, h = P.head, sw = P.swing, l = P.lean;
      R.poly(I.scarfT, [[-1 + l, 28 + b], [-4 + l, 28 + b], [-12 + sw, 32 + b], [-10 + sw, 35 + b]]);
      R.capsule(I.quiver, -6 + l, 26 + b, 2.2, -4, 39 + b, 2);
      [-7, -6, -5].forEach((x, k) => { R.px(I.fletch, x + l, 23 + b + (k % 2)); R.px(I.fletch, x + l, 24 + b + (k % 2)); });
      R.poly(I.coatB, [[-6 + l, 35 + b], [1, 38], [-1 + sw, 55], [-10 + sw * 1.5, 53]]);
      const backArm = () => drawArm(R, P.shB, P.handB, { upper: I.armB, fore: I.bracerB, hand: I.handB }, 1.8);
      if (!P.backFront) backArm();
      drawLeg(R, P.hipB, P.ankB, { thigh: I.thighB, shin: I.bootB, boot: I.bootB });
      drawLeg(R, P.hipF, P.ankF, { thigh: I.thighF, shin: I.bootF, boot: I.bootF });
      R.poly(I.vest, torsoPts(P, 6, 5));
      R.poly(I.coatF, [[1 + l, 29 + b], [6.5 + l, 29 + b], [7.5 + l * 0.7, 33 + b], [6, 41], [2, 41]]);
      R.rect(I.belt, -6 + l * 0.3, 39 + b * 0.5, 13, 2); R.rect(I.pouch, 3, 40, 3, 3);
      R.poly(I.skirt, [[1, 40], [7, 40], [8 + sw, 49], [3 + sw, 50]]);
      R.ellipse(I.scarf, 0.5 + l, 28.5 + b, 5.5, 2.5);
      if (P.backFront) backArm();
      R.ellipse(I.hood, h.x - 1, h.y - 1, 6, 6.5);
      R.poly(I.hood, [[h.x - 5, h.y - 2], [h.x - 10, h.y + 4], [h.x - 4, h.y + 5]]);
      R.ellipse(I.skin, h.x + 2.2, h.y + 0.8, 3.4, 4);
      R.poly(I.mask, [[h.x - 0.5, h.y + 2], [h.x + 6, h.y + 1.5], [h.x + 6, h.y + 4.5], [h.x, h.y + 5.5]]);
      R.poly(I.brim, [[h.x - 3, h.y - 7], [h.x + 3, h.y - 7.5], [h.x + 6.5, h.y - 3], [h.x + 1, h.y - 3.5]]);
      R.fpx(I.eye, h.x + 2.5, h.y); R.fpx(I.eye, h.x + 3, h.y); R.fpx(I.eye, h.x + 3, h.y + 0.5); R.fpx(R.part('eyeW', FLAT('#e8e0d8')), h.x + 3.5, h.y);
      longbow(R, I, P.handF, P.draw, P.arrow);
      drawArm(R, P.shF, P.handF, { upper: I.armF, fore: I.bracerF, hand: I.handF }, 1.8);
    },
  },
  assassin: {
    name: '그림자 암살자',
    pose(st, i) {
      let P;
      if (st === 'idle') { P = basePose({ bob: [1, 1, 2, 2][i], lean: 1 }); P.ankF.x = 5; P.ankB.x = -5; P.handF = pt(8, 40 + P.bob); P.handB = pt(-7, 40 + P.bob); P.angF = 112; P.angB = 105; return P; }
      if (st === 'walk') { P = basePose({ walk: i / WALK_N * TAU, bob: i % 3 === 1 ? 0 : 1, lean: 1 }); P.handF = pt(8 - P.swing * 3, 40 + P.bob); P.handB = pt(-7 + P.swing * 3, 40 + P.bob); P.angF = 112; P.angB = 105; return P; }
      const A = [
        { lean: -1, bob: 3, hf: [3, 36], af: -70, hb: [1, 35], ab: -120, fx: 4, bx: -4 },
        { lean: 4, bob: 2, hf: [16, 31], af: 15, hb: [-10, 35], ab: 195, fx: 9, bx: -8 },
        { lean: 3, bob: 2, hf: [12, 44], af: 80, hb: [-8, 29], ab: -150, fx: 9, bx: -8 },
      ][i];
      P = basePose({ lean: A.lean, bob: A.bob });
      P.handF = pt(...A.hf); P.handB = pt(...A.hb); P.angF = A.af; P.angB = A.ab; P.ankF.x = A.fx; P.ankB.x = A.bx;
      return P;
    },
    draw(R, P) {
      const p = (n, r, o) => R.part(n, r, o);
      const I = {
        scarfT: p('scarfT', RAMP.purple), scarfT2: p('scarfT2', RAMP.purple), cloak: p('cloak', RAMP.black),
        armB: p('armB', RAMP.black2), gloveB: p('gloveB', RAMP.black), handB: p('handB', RAMP.black),
        bladeB: p('bladeB', RAMP.dblade), gripB: p('gripB', RAMP.lthD), tip: p('tip', FLAT('#d080ff'), { glow: true }),
        thighB: p('thighB', RAMP.black2), bootB: p('bootB', RAMP.lthD), thighF: p('thighF', RAMP.black2), bootF: p('bootF', RAMP.lthD), strap: p('strap', FLAT('#723698')),
        suit: p('suit', RAMP.black2), sash: p('sash', RAMP.purple), belt: p('belt', RAMP.lthD), scarf: p('scarf', RAMP.purple),
        hood: p('hood', RAMP.black), brim: p('brim', RAMP.black), mask: p('mask', RAMP.bone), eye: p('eye', FLAT('#ff3a7a'), { glow: true }), mline: p('mline', FLAT('#3a3640')),
        armF: p('armF', RAMP.black2), gloveF: p('gloveF', RAMP.black), handF: p('handF', RAMP.black), bladeF: p('bladeF', RAMP.dblade), gripF: p('gripF', RAMP.lthD),
      };
      const b = P.bob, h = P.head, sw = P.swing, l = P.lean;
      R.poly(I.scarfT, [[-1 + l, 28 + b], [-4 + l, 28 + b], [-16 + sw * 2, 30 + b], [-15 + sw * 2, 32 + b]]);
      R.poly(I.scarfT2, [[-2 + l, 29 + b], [-4 + l, 30 + b], [-13 + sw, 37 + b], [-11 + sw, 38 + b]]);
      R.poly(I.cloak, [[-6 + l, 29 + b], [l, 30 + b], [-1 + sw, 51], [-11 + sw * 1.5, 52], [-9 + l * 0.5, 40 + b]]);
      dagger(R, I.bladeB, I.gripB, I.tip, P.handB, P.angB);
      drawArm(R, P.shB, P.handB, { upper: I.armB, fore: I.gloveB, hand: I.handB }, 1.7);
      drawLeg(R, P.hipB, P.ankB, { thigh: I.thighB, shin: I.thighB, boot: I.bootB });
      drawLeg(R, P.hipF, P.ankF, { thigh: I.thighF, shin: I.thighF, boot: I.bootF });
      R.rect(I.strap, P.ankB.x - 2, P.ankB.y - 3, 4, 1); R.rect(I.strap, P.ankF.x - 2, P.ankF.y - 3, 4, 1);
      R.poly(I.suit, torsoPts(P, 5.5, 4.5));
      R.poly(I.sash, [[-6 + l * 0.6, 37 + b], [6 + l * 0.6, 34 + b], [6 + l * 0.6, 36.5 + b], [-6 + l * 0.6, 39.5 + b]]);
      R.rect(I.belt, -5 + l * 0.3, 39 + b * 0.5, 11, 2);
      R.ellipse(I.scarf, 0.5 + l, 28.5 + b, 5.2, 2.4);
      R.ellipse(I.hood, h.x - 1, h.y - 1, 5.8, 6.4);
      R.poly(I.hood, [[h.x - 5, h.y - 3], [h.x - 8, h.y + 7], [h.x - 2, h.y + 5]]);
      R.ellipse(I.mask, h.x + 2, h.y + 0.8, 3.4, 4.2);
      R.line(I.eye, h.x + 2.5, h.y + 0.2, h.x + 4.6, h.y - 0.2);
      R.line(I.mline, h.x + 1.5, h.y + 2.5, h.x + 4.8, h.y + 2.5); [2, 3, 4].forEach(dx => R.fpx(I.mline, h.x + dx, h.y + 3)); R.line(I.mline, h.x + 0.5, h.y - 1.5, h.x + 1.5, h.y + 1.5);
      R.poly(I.brim, [[h.x - 3, h.y - 7], [h.x + 3, h.y - 7.5], [h.x + 6, h.y - 3], [h.x + 1, h.y - 3]]);
      dagger(R, I.bladeF, I.gripF, I.tip, P.handF, P.angF);
      drawArm(R, P.shF, P.handF, { upper: I.armF, fore: I.gloveF, hand: I.handF }, 1.7);
    },
  },
};
