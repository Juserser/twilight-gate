'use strict';
// 파티 캐릭터 · 슬라임 · 이펙트 메쉬 · 매 동료

// ===================================================================
// 파티 (캐릭터)
// ===================================================================
const party = [
  { key: 'berserker', x: -0.9, z: 2.6 },
  { key: 'hawk', x: 2.4, z: 1.0 },
  { key: 'assassin', x: -3.5, z: 0.5 },
].map(p => {
  const set = HERO_FRAMES[p.key];
  const conv = arr => arr.map(f => ({ r: tex(f.c), l: tex(f.l), gr: f.gc && tex(f.gc), gl: f.gl && tex(f.gl) }));
  const fr = { idle: conv(set.idle), walk: conv(set.walk), atk: conv(set.atk), skill: set.skill ? conv(set.skill) : null };
  const mat = new THREE.MeshLambertMaterial({ map: fr.idle[0].r, alphaTest: 0.5, side: THREE.DoubleSide });
  const mesh = addBB(mat, HW, HH, p.x, p.z);
  const sh = contactShadow(0.85, 0.45);
  // 빛나는 부분(가면 눈, 단검 끝)은 조명 영향 없는 밝은 층으로 한 번 더 그림
  let glowMat = null;
  if (fr.idle[0].gr) {
    glowMat = new THREE.MeshBasicMaterial({ map: fr.idle[0].gr, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.5, 1.5), fog: false });
    const gm = new THREE.Mesh(mesh.geometry, glowMat); gm.position.z = 0.03; mesh.add(gm);
  }
  const max = { berserker: 4820, hawk: 2950, assassin: 3260 }[p.key];
  return Object.assign(p, { cl: HEROES[p.key], fr, mat, glowMat, mesh, sh, face: 1, state: 'idle', t: Math.random() * 2, at: 0, af: -1, fired: false, step: 0,
    hp: max, max, mp: 300, mpMax: 300, idg: 40, charm: 0, berserk: 0, cd: { Q: 0, E: 0, R: 0, F: 0, Z: 0, X: 0, C: 0, V: 0, G: 0 }, orbs: 0, chain: 0, stealth: 0, fCh: 2, lib: 0, rest: 0, aimCd: 0, windT: 0, y: 0, sk: null, kx: 0, kz: 0, inv: 0, hurtFlash: 0, dash: 0, dashCd: 0, ghostT: 0, dx: 0, dz: 0, down: false, downT: 0 });
});
let active = 0;

const ghosts = [];

// 이펙트 메쉬
const slashFrames = makeSlashFrames().map(c => ({ r: tex(c), l: tex(flipCanvas(c)) }));
const slashMat = new THREE.MeshBasicMaterial({ map: slashFrames[0].r, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.7, 1.7, 1.8), fog: false });
const slashMesh = new THREE.Mesh(bbGeo(44 * PX * 1.2, 44 * PX * 1.2), slashMat); slashMesh.visible = false; scene.add(slashMesh); billboards.push(slashMesh);
let slashT = -1, slashFace = 1;
const arrowC = makeArrow().canvas(), arrowTex = { r: tex(arrowC), l: tex(flipCanvas(arrowC)) };
const orbTex = tex(makeOrb().canvas());
const projs = [];
const orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.2, 0.7, 1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
orbGlow.scale.set(0.6, 0.6, 1);

// 매 동료
const HAWK_PAL = { B: '#3a2618', b: '#6a4428', c: '#d8c8a8', W: '#f0ece0', k: '#101010', Y: '#e8b030', t: '#4a3020', T: '#7a5434' };
const HAWK_ROWS = [[
  "......BB............",
  ".....BBbB...........",
  "....BBbbB...........",
  "...BBbb.B...........",
  "...Bbb...B.....WW...",
  "..Bbb....BbbbbWWkY..",
  "..bb....BbbbbbbWWYY.",
  ".bB....BbbcccbbbW...",
  ".......BbccccbbB....",
  "........Bbcccbb.....",
  ".........BbbbbB.....",
  "........tTt..YY.....",
  ".......tTTt.........",
], [
  "....................",
  "....................",
  "...............WW...",
  "..............WWkY..",
  "........BbbbbbbWWYY.",
  ".......BbbcccbbbW...",
  "......BbbccccbbB....",
  ".....BBbbcccbbB.....",
  "....BBbb.BbbbB......",
  "...BBbb..tTt........",
  "..BBbb..tTTt........",
  ".BBb.....YY.........",
  "Bb..................",
]];
const hawkTex = HAWK_ROWS.map(rows => { const g = new Pix(22, 15); g.stamp(1, 1, rows, HAWK_PAL); g.outline(OUT); const c = g.canvas(); return { r: tex(c), l: tex(flipCanvas(c)) }; });
const hawkMat = new THREE.MeshLambertMaterial({ map: hawkTex[0].r, alphaTest: 0.5, side: THREE.DoubleSide });
const hawk = { mesh: addBB(hawkMat, 22, 15, 2.4, 1, { s: 1.1 }), sh: contactShadow(0.45, 0.22), a: 0, mode: 'orbit', t: 0, x: 2.4, y: 3.1, z: 1, sx: 0, sy: 0, sz: 0, tg: null, face: 1, px: 2.4, pz: 1, scl: 1, sclT: 1, cmd: null, libT: 0, elec: 0 };
