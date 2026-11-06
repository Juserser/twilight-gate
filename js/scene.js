'use strict';
// 렌더러 · 조명 · 땅 · 환경 오브젝트 · 물 · 파티클

// ===================================================================
// 렌더러 / 장면
// ===================================================================
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const PR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x4a3e6a, 30, 90);
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 250);

function tex(c, opt = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = opt.mip ? THREE.NearestMipmapLinearFilter : THREE.NearestFilter;
  t.generateMipmaps = !!opt.mip;
  t.anisotropy = opt.mip ? 4 : 1;
  return t;
}
const skyTex = tex(makeSky()); scene.background = skyTex;

// 조명
const sun = new THREE.DirectionalLight(0xffb27a, 2.6);
sun.position.set(-14, 12, -11);
sun.target.position.set(0, 0, 1);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0x8a90d8, 0x3a2838, 1.25);
scene.add(hemi);
const fireLight = new THREE.PointLight(0xff8a3a, 22, 16, 1.7);
fireLight.position.set(FIRE.x, 1.0, FIRE.z);
scene.add(fireLight);
const orbLight = new THREE.PointLight(0x5ad0ff, 3, 5, 1.8);
scene.add(orbLight);
const fxLight = new THREE.PointLight(0xffffff, 0, 7, 1.6);
scene.add(fxLight);

// 바람 셰이더
const uTime = { value: 0 };
const billboards = [];
const occluders = [];   // 카메라와 캐릭터 사이에 끼면 숨길 큰 물체들 { mesh, r(반경), h(높이) }
function bbGeo(w, h) {
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.9, 0.44);
  return g;
}
function litMat(map, amp) {
  const m = new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide });
  if (amp) {
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = modelMatrix[3][0]*0.7 + modelMatrix[3][2]*0.45;
        float hh = max(position.y, 0.0);
        transformed.x += (sin(uTime*1.6+ph) + 0.4*sin(uTime*3.7+ph*2.0)) * ${amp.toFixed(4)} * hh * hh;`);
    };
    m.customProgramCacheKey = () => 'wind' + amp;
  }
  return m;
}
function addBB(mat, pw, ph, x, z, o = {}) {
  const s = o.s || 1;
  const mesh = new THREE.Mesh(bbGeo(pw * PX * s, ph * PX * s), mat);
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = true;
  mesh.position.set(x, o.y || 0, z);
  scene.add(mesh); billboards.push(mesh); return mesh;
}
const shadowGeo = new THREE.CircleGeometry(0.5, 16); shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x0a0612, transparent: true, opacity: 0.38, depthWrite: false });
function contactShadow(sx, sz) { const m = new THREE.Mesh(shadowGeo, shadowMat); m.scale.set(sx, 1, sz); m.position.y = 0.015; m.renderOrder = 1; scene.add(m); return m; }

// 땅
const GX0 = -30, GZ0 = -10, GW = 60, GD = 34;
const groundTex = tex(makeGround(GX0, GZ0, GW, GD, true), { mip: true });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshLambertMaterial({ map: groundTex }));
ground.rotation.x = -Math.PI / 2; ground.position.set(GX0 + GW / 2, 0, GZ0 + GD / 2); ground.receiveShadow = true;
scene.add(ground);

// 절벽 고원
const CLIFF_H = 3, CLIFF_Z = -10, CLIFF_D = 14;
const topTex = tex(makeGround(GX0, CLIFF_Z - CLIFF_D, GW, CLIFF_D, false), { mip: true });
const faceTex = tex(makeCliffFace(GW), { mip: true });
const faceMat = new THREE.MeshLambertMaterial({ map: faceTex });
const cliff = new THREE.Mesh(new THREE.BoxGeometry(GW, CLIFF_H, CLIFF_D),
  [faceMat, faceMat, new THREE.MeshLambertMaterial({ map: topTex }), faceMat, faceMat, faceMat]);
cliff.position.set(0, CLIFF_H / 2, CLIFF_Z - CLIFF_D / 2);
cliff.castShadow = true; cliff.receiveShadow = true;
scene.add(cliff);
const fringe = new THREE.Mesh(new THREE.PlaneGeometry(GW, 12 * PX), new THREE.MeshLambertMaterial({ map: tex(makeFringe(GW)), alphaTest: 0.5 }));
fringe.position.set(0, CLIFF_H - 6 * PX, CLIFF_Z + 0.02); fringe.receiveShadow = true;
scene.add(fringe);

// 원경
const far = (c, w, h, x, y, z, fog = true, color = 0xffffff) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(c), alphaTest: 0.5, fog, color }));
  m.position.set(x, y, z); scene.add(m); return m;
};
const treeline = far(makeTreeline(), 80, 80 * 96 / 1100, 0, CLIFF_H + 80 * 96 / 1100 / 2 - 0.6, CLIFF_Z - CLIFF_D + 1.5);
const mtn = far(makeMountains(), 240, 240 * 140 / 640, 0, 14, -80);
// 시점을 360도 돌릴 수 있으니 사방에 먼 산과 바닥을 둘러준다
[[80, 0, -Math.PI / 2], [-80, 0, Math.PI / 2], [0, 80, Math.PI]].forEach(([x, z, ry]) => { const m = mtn.clone(); m.position.set(x, 14, z); m.rotation.y = ry; scene.add(m); });
const under = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x1c3424 }));
under.rotation.x = -Math.PI / 2; under.position.y = -0.03; scene.add(under);
const sunMesh = far(makeSun(), 9, 9, -16, 13, -110, false, new THREE.Color(2.2, 2.0, 1.8));
const clouds = [[-30, 30, -100, 1], [20, 26, -100, 2], [55, 34, -100, 3], [-60, 22, -100, 4]].map(([x, y, z, s]) =>
  far(makeCloud(s), 26, 26 * 22 / 80, x, y, z, false));

// 환경 오브젝트 (숲): 여기부터 마을 물건 앞까지. 수도원 지역에서는 숨긴다
const FOREST_START = scene.children.length;
const R = rng(42);
const obstacles = [];
const oakMats = [1, 2, 3].map(s => litMat(tex(makeOak(s).canvas()), 0.0016));
const pineMat = litMat(tex(makePine(7).canvas()), 0.0012);
const bushMats = [litMat(tex(makeBush(11, true).canvas()), 0.012), litMat(tex(makeBush(12, false).canvas()), 0.012)];
const rockMats = [litMat(tex(makeRock(1, 26, 18).canvas())), litMat(tex(makeRock(2, 16, 12).canvas())), litMat(tex(makeRock(3, 10, 8).canvas()))];
const tuftMats = [0, 1, 2, 3].map(i => litMat(tex(makeTuft(20 + i, false).canvas()), 0.1));
const flowerMats = [0, 1, 2, 3].map(i => litMat(tex(makeTuft(40 + i, true).canvas()), 0.1));
const mushMat = litMat(tex(makeMushroom().canvas()));

function tree(x, z, y = 0, pine = R() < 0.35) {
  const s = 0.95 + R() * 0.3;
  const m = pine ? addBB(pineMat, 52, 100, x, z, { s, y }) : addBB(oakMats[(R() * 3) | 0], 72, 98, x, z, { s, y });
  occluders.push({ mesh: m, r: pine ? 1.4 : 2.0, h: 6 * s + y });
  if (!y) obstacles.push({ x, z, r: 0.45 });
}
// 좌우 숲
for (let i = 0; i < 26; i++) { const z = -9 + i * 1.2 + R(); tree(-13 - R() * 4, z); tree(13 + R() * 4, z); }
for (let i = 0; i < 10; i++) { tree(-10.5 - R() * 2, -8 + i * 2.4 + R()); tree(10.5 + R() * 2, -8 + i * 2.4 + R()); }
// 고원 위
for (let i = 0; i < 34; i++) tree(-26 + i * 1.6 + R(), CLIFF_Z - 1 - R() * 9, CLIFF_H);
// 전경 (카메라 쪽, 틸트시프트로 흐려짐)
tree(-7.5, 11.5); tree(8.2, 12.5); tree(-11, 9.5, 0, true); tree(11.5, 9);
// 남쪽 숲 벽 (뒤를 돌아봐도 숲이 보이게)
for (let x = -18; x <= 18; x += 1.4 + R() * 0.8) { tree(x, 13 + R() * 1.5); tree(x + 0.7, 16 + R() * 2); tree(x + 0.3, 19.5 + R() * 2.5); }
// 바깥 숲
for (let i = 0; i < 90; i++) {
  const side = i % 3, x = side === 0 ? -(18 + R() * 12) : side === 1 ? 18 + R() * 12 : -30 + R() * 60, z = side === 2 ? 22 + R() * 8 : -9 + R() * 38;
  tree(x, z);
}
// 덤불
[[-9, -6], [9.5, -7], [-6.5, 8.5], [7, 7.8], [-10, 2], [10, 3], [3.5, -8.6], [-2, -8.8], [-8.6, 7.5]].forEach(([x, z]) => {
  occluders.push({ mesh: addBB(bushMats[(R() * 2) | 0], 36, 24, x, z, { s: 1.1 }), r: 1.1, h: 1.6 }); obstacles.push({ x, z, r: 0.7 });
});
// 바위
[[-5.5, -7.8, 0], [7.8, -5.2, 0], [4.8, 6.2, 1], [-3.8, 6.8, 2], [-9.8, 6.4, 1], [10.6, -1, 0], [2, -9.2, 2]].forEach(([x, z, k]) => {
  addBB(rockMats[k], [26, 16, 10][k], [18, 12, 8][k], x, z); if (k < 2) obstacles.push({ x, z, r: k ? 0.45 : 0.8 });
});
// 풀/꽃
for (let i = 0; i < 520; i++) {
  const x = -12 + R() * 24, z = -9.6 + R() * 22;
  if (pathDist(x, z) < 0.9 || pondSDF(x, z) < 0.25 || Math.hypot(x - FIRE.x, z - FIRE.z) < 1.9) continue;
  if (Math.hypot(x - TENT.x, z - TENT.z) < 1.8) continue;
  addBB(R() < 0.18 ? flowerMats[(R() * 4) | 0] : tuftMats[(R() * 4) | 0], 16, 12, x, z, { s: 0.9 + R() * 0.4, cast: false });
}
for (let i = 0; i < 70; i++) addBB(tuftMats[(R() * 4) | 0], 16, 12, -26 + R() * 52, CLIFF_Z - 0.2 - R() * 1.2, { y: CLIFF_H, cast: false });
[[-9.6, -3], [9.2, -2.4], [-6.8, -7], [11.2, 5]].forEach(([x, z]) => { addBB(mushMat, 10, 10, x, z); addBB(mushMat, 10, 10, x + 0.35, z + 0.2, { s: 0.7 }); });
// 마을(야영지) 전용 물건: 여기부터 파티클 앞까지. 던전에서는 숨긴다
const TOWN_START = scene.children.length, TOWN_OBS = obstacles.length, TOWN_OCC = occluders.length;
// 연못 수련
const lilyTex = (() => { const g = new Pix(10, 8); for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) { const d = Math.hypot((x + .5 - 5) / 5, (y + .5 - 4) / 4); if (d < 1 && !(x > 4 && Math.abs(y - 3.5) < 1 && x < 8)) g.set(x, y, d < .55 ? '#7ab85a' : '#5a9a48'); } g.set(3, 3, '#f0b0c8'); g.set(4, 3, '#ffe0ea'); g.set(3, 2, '#f0b0c8'); return tex(g.outline('#2a5030').canvas()); })();
[[-8.4, 3.6, 0.3], [-6.2, 5.6, 1.4], [-7.6, 6.2, 2.4], [-5.9, 3.3, 4]].forEach(([x, z, r]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(10 * PX, 8 * PX), new THREE.MeshLambertMaterial({ map: lilyTex, alphaTest: 0.5 }));
  m.rotation.set(-Math.PI / 2, 0, r); m.position.set(x, 0.04, z); m.receiveShadow = true; scene.add(m);
});

// 텐트, 허수아비, 모닥불
occluders.push({ mesh: addBB(litMat(tex(makeTent().canvas())), 56, 42, TENT.x, TENT.z, { s: 1.3 }), r: 2.0, h: 3.4 });
obstacles.push({ x: TENT.x, z: TENT.z, r: 1.6 });
const dummyMesh = addBB(litMat(tex(makeDummy().canvas())), 18, 34, 0, 0, { s: 1.15 });
const dummy = new THREE.Group(); dummy.position.set(DUMMY.x, 0, DUMMY.z); scene.add(dummy);
scene.remove(dummyMesh); billboards.splice(billboards.indexOf(dummyMesh), 1);
dummyMesh.position.set(0, -2 * PX, 0); dummy.add(dummyMesh); billboards.push(dummy);
contactShadow(0.9, 0.5).position.set(DUMMY.x, 0.015, DUMMY.z);
obstacles.push({ x: DUMMY.x, z: DUMMY.z, r: 0.45 });
let dummyWob = 0, dummyVel = 0;

addBB(litMat(tex(makeLogs().canvas())), 26, 12, FIRE.x, FIRE.z + 0.05, { s: 1.1 });
const stoneMat = litMat(tex(makeRock(9, 8, 6).canvas()));
for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; addBB(stoneMat, 8, 6, FIRE.x + Math.cos(a) * 0.95, FIRE.z + Math.sin(a) * 0.7, { s: 1.1, cast: false }); }
const fireTexes = makeFireFrames().map(c => tex(c));
const fireMat = new THREE.MeshBasicMaterial({ map: fireTexes[0], alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.4, 1.2) });
const fireMesh = addBB(fireMat, 18, 28, FIRE.x, FIRE.z + 0.1, { y: 0.12, cast: false });
const glowTex = new THREE.CanvasTexture(glowCanvas());
const fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.6, 0.6, 0.15), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
fireGlow.scale.set(4.2, 4.2, 1); fireGlow.position.set(FIRE.x, 0.9, FIRE.z); scene.add(fireGlow);
obstacles.push({ x: FIRE.x, z: FIRE.z, r: 1.05 });

// 물
const water = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShaderMaterial({
  uniforms: { uTime, uC: { value: new THREE.Vector2(POND.x, POND.z) } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `
    uniform float uTime; uniform vec2 uC; varying vec3 vW;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float shape(vec2 p){ vec2 d=p-uC; float a=atan(d.y,d.x); return length(d)-(2.6+0.4*sin(3.0*a+1.0)+0.22*sin(5.0*a+2.0)); }
    vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
    void main(){
      vec2 cell = floor(vW.xz*16.0);
      vec2 p = (cell+0.5)/16.0;
      float s = shape(p);
      if (s > 0.0) discard;
      float depth = clamp(-s/1.8, 0.0, 1.0);
      float dith = h21(cell)*0.35;
      float q = floor(depth*3.0 + dith)/3.0;
      vec3 col = mix(lin(vec3(0.33,0.52,0.66)), lin(vec3(0.12,0.17,0.36)), q);
      float sky = smoothstep(uC.y+2.5, uC.y-2.5, p.y);
      col = mix(col, lin(vec3(0.78,0.45,0.42)), 0.28*sky*(1.0-q));
      float w = sin(p.x*2.6 + uTime*1.1 + sin(p.y*1.9+uTime*0.6)*1.6) * sin(p.y*3.3 - uTime*0.85);
      if (w > 0.8) col = mix(col, lin(vec3(0.85,0.75,0.8)), 0.55);
      else if (w > 0.6 && h21(cell+7.0) > 0.5) col = mix(col, lin(vec3(0.6,0.62,0.78)), 0.35);
      float fireRef = smoothstep(2.8, 0.0, abs(p.x - (uC.x+2.2))) * smoothstep(-0.6, 1.2, -(p.y-uC.y)+0.4);
      col += lin(vec3(1.0,0.5,0.2)) * 0.16 * fireRef * step(0.5, fract(p.y*4.0 + uTime*0.8 + h21(vec2(cell.y,1.0))));
      if (s > -0.1) col = lin(vec3(0.82,0.86,0.9));
      else if (s > -0.2 && h21(cell + floor(uTime*2.0)) > 0.55) col = lin(vec3(0.6,0.72,0.82));
      float sp = h21(cell + floor(uTime*3.0)*13.0);
      if (sp > 0.994 && depth > 0.15) col = vec3(2.6, 2.1, 1.5);
      gl_FragColor = vec4(col, 1.0);
    }`,
}));
water.rotation.x = -Math.PI / 2; water.position.set(POND.x, 0.02, POND.z);
scene.add(water);

const forestObjs = [cliff, fringe, treeline, ...scene.children.slice(FOREST_START, TOWN_START)], forestObs = obstacles.slice(0, TOWN_OBS), forestOcc = occluders.slice(0, TOWN_OCC);
const townObjs = scene.children.slice(TOWN_START), townObs = obstacles.slice(TOWN_OBS), townOcc = occluders.slice(TOWN_OCC);

// ===================================================================
// 파티클 (정사각 도트 파티클)
// ===================================================================
class PSys {
  constructor(n, additive) {
    this.n = n; this.p = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 } },
      vertexShader: `attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vC;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = max(1.0, aSize*uScale/-mv.z); gl_Position = projectionMatrix*mv; vC=aCol; }`,
      fragmentShader: additive
        ? `varying vec4 vC; void main(){ gl_FragColor = vec4(vC.rgb*vC.a, 1.0); }`
        : `varying vec4 vC; void main(){ if(vC.a < 0.02) discard; gl_FragColor = vC; }`,
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false;
    this.geo = g; scene.add(this.points);
  }
  emit(o) { if (window.LOW_FX && Math.random() < 0.5) return; if (this.p.length < this.n) this.p.push(Object.assign({ vx: 0, vy: 0, vz: 0, grav: 0, drag: 0, t: 0, size: PX, a: 1, fadeIn: 0, upd: null }, o)); }
  update(dt) {
    const P = this.p;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt;
      if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
      p.vy -= p.grav * dt; const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k;
      if (p.upd) p.upd(p, dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    for (let i = 0; i < P.length; i++) {
      const p = P[i], u = p.t / p.life;
      let a = p.a * (1 - Math.pow(u, 2)); if (p.fadeIn) a *= Math.min(1, p.t / p.fadeIn);
      if (p.flick) a *= 0.55 + 0.45 * Math.sin(p.t * p.flick + p.ph);
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      const c = p.c1 && p.c2 ? [p.c1[0] + (p.c2[0] - p.c1[0]) * u, p.c1[1] + (p.c2[1] - p.c1[1]) * u, p.c1[2] + (p.c2[2] - p.c1[2]) * u] : p.c;
      this.col[i * 4] = c[0]; this.col[i * 4 + 1] = c[1]; this.col[i * 4 + 2] = c[2]; this.col[i * 4 + 3] = a;
      this.size[i] = p.size * (p.grow ? 1 + u * p.grow : 1);
    }
    this.geo.setDrawRange(0, P.length);
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aCol.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true;
  }
}
const glow = new PSys(900, true), soft = new PSys(500, false);
const lc = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
