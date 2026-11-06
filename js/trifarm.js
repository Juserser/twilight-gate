'use strict';
// 트라이포드 파밍: 트라이포드 낱장이 던전에서 떨어지고, 가진 것만 스킬창에서 고를 수 있다
//  등급 희귀 · 영웅 · 전설 · 초전설 = 설명 수치의 60 · 80 · 100 · 130%
//  같은 낱장을 또 얻으면 공명 포인트가 쌓여 등급이 오른다 (3 · 5 · 8)
//  처음에는 모든 스킬의 Ⅰ단계 첫 선택지를 희귀로 가진다

const TGR = [
  { name: '희귀', mul: 0.6, col: '#3d9bd4' }, { name: '영웅', mul: 0.8, col: '#b05ae0' },
  { name: '전설', mul: 1.0, col: '#f0a030' }, { name: '초전설', mul: 1.3, col: '#ff5ad8' },
];
const TUP = [3, 5, 8];
const TRIO = (() => { try { return Object.assign({ own: {}, pts: {} }, JSON.parse(localStorage.getItem('twilight.tri') || '{}')); } catch (e) { return { own: {}, pts: {} }; } })();
if (location.search.includes('fresh')) { TRIO.own = {}; TRIO.pts = {}; }
const saveTri = () => { try { localStorage.setItem('twilight.tri', JSON.stringify(TRIO)); } catch (e) {} };
const tid = (cls, key, ti, oi) => `${cls}:${key}:${ti}:${oi}`;
const triGrade = (cls, key, ti, oi) => TRIO.own[tid(cls, key, ti, oi)] ?? -1;
// 시작 지급 · 확인용 전부 지급
for (const cls of ['berserker', 'hawk', 'assassin']) { const kit = kitOf(cls); for (const k in kit.info) if (kit.info[k].tri.length) { const id = tid(cls, k, 0, 0); if (TRIO.own[id] === undefined) TRIO.own[id] = 0; } }
if (location.search.includes('triall')) for (const cls of ['berserker', 'hawk', 'assassin']) { const kit = kitOf(cls); for (const k in kit.info) kit.info[k].tri.forEach((tier, ti) => tier.forEach((_, oi) => TRIO.own[tid(cls, k, ti, oi)] = 2)); }
saveTri();
// 고른 것이 없는 선택지면 그 단계에서 가진 것 중 가장 높은 등급으로 맞춘다
function fixTriSel(cls, key) {
  const inf = kitOf(cls).info[key]; if (!inf || !inf.tri.length) return;
  const ts = tsel(cls, key, inf.tri.length);
  inf.tri.forEach((tier, ti) => { if (triGrade(cls, key, ti, ts[ti]) >= 0) return; let best = -1, bi = ts[ti]; tier.forEach((_, oi) => { const g = triGrade(cls, key, ti, oi); if (g > best) { best = g; bi = oi; } }); ts[ti] = bi; });
}
for (const cls of ['berserker', 'hawk', 'assassin']) for (const k in kitOf(cls).info) fixTriSel(cls, k);

// ---- 효과: 가진 것만, 등급만큼 수치를 키운다 ----
const SCALE_KEYS = ['dmg', 'range', 'spd', 'dr', 'stag', 'crit', 'cdmg', 'cd', 'heal', 'healOnce', 'gaugeAdd', 'slow'];
function scaleTri(p, mul) {
  const q = { ...p };
  for (const k of SCALE_KEYS) if (typeof q[k] === 'number') q[k] *= mul;
  if (q.boom) q.boom = [q.boom[0], q.boom[1] * mul];
  if (q.wave) q.wave = [q.wave[0], q.wave[1] * mul];
  if (q.dot) q.dot = [q.dot[0] * mul, q.dot[1], q.dot[2]];
  if (q.ms) q.ms = [q.ms[0], q.ms[1] * mul];
  return q;
}

// ---- 드랍 ----
function rollTriGrade(boss, elite) {
  const d = (DUN.d && DUN.d.diff) || 0, r = Math.random() - d * 0.06 - (boss ? 0.25 : elite ? 0.1 : 0);
  return r < 0.01 ? 3 : r < 0.1 ? 2 : r < 0.4 ? 1 : 0;
}
function gainTri(cls, key, ti, oi, g) {
  const id = tid(cls, key, ti, oi), cur = TRIO.own[id] ?? -1, inf = kitOf(cls).info[key], o = inf.tri[ti][oi], sk = kitOf(cls).defs[key];
  let msg;
  if (g > cur) { TRIO.own[id] = g; TRIO.pts[id] = 0; msg = cur < 0 ? '새 트라이포드' : '트라이포드 등급 상승'; }
  else if (cur < 3) { TRIO.pts[id] = (TRIO.pts[id] || 0) + 1; if (TRIO.pts[id] >= TUP[cur]) { TRIO.own[id] = cur + 1; TRIO.pts[id] = 0; msg = '공명 · 등급 상승'; } else msg = `공명 ${TRIO.pts[id]} / ${TUP[cur]}`; }
  else msg = '초전설 (최대)';
  const ng = TRIO.own[id], col = TGR[ng].col;
  saveTri(); for (const k in triCache) delete triCache[k]; for (const k in setFxCache) delete setFxCache[k];
  if (cur < 0) { const ts = tsel(cls, key, inf.tri.length); if (triGrade(cls, key, ti, ts[ti]) < 0) ts[ti] = oi; }
  const A = party[active];
  floaters.push({ x: A.x, y: 3.4, z: A.z, t: -0.1, text: `[${sk.name}] ${o[0]}`, crit: false, big: true, vx: 0, color: col });
  toast(`${msg} · ${TGR[ng].name}`, `${CLSNAME[cls]} · ${sk.full} · ${['Ⅰ', 'Ⅱ', 'Ⅲ'][ti]} ${o[0]}`, col);
  log(`[트라이포드] ${CLSNAME[cls]} ${sk.full} - ${o[0]} (${TGR[ng].name}) ${msg}`, '시스템');
  for (let i = 0; i < 24; i++) { const a = Math.random() * TAU; glow.emit({ x: A.x, y: 1.4, z: A.z, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 2, vz: Math.sin(a) * 2, drag: 2, life: 0.8, c: lc(col).map(v => v * 2.5), size: PX * 1.2 }); }
  if (document.getElementById('wSkill').classList.contains('open')) renderWin('wSkill');
}
function dropTri(m) {
  const D = m.def, p = (D.boss ? 0.6 : D.elite ? 0.15 : 0.025) * diffRew() * (location.search.includes('tridrop') ? 40 : 1); if (Math.random() > p) return;
  const cls = Math.random() < 0.7 ? curCls() : pick(['berserker', 'hawk', 'assassin']), kit = kitOf(cls);
  const keys = Object.keys(kit.info).filter(k => kit.info[k].tri.length), key = pick(keys), inf = kit.info[key];
  const ti = (Math.random() * inf.tri.length) | 0, oi = (Math.random() * inf.tri[ti].length) | 0;
  gainTri(cls, key, ti, oi, rollTriGrade(D.boss, D.elite));
}
const _dropLootT = dropLoot;
dropLoot = function (m) { _dropLootT(m); if (DUN.on) dropTri(m); };

// ---- 스킬창 꾸밈 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wSkill .op.lk{opacity:.35;cursor:default;filter:grayscale(.8)}
#wSkill .op .tg{font-size:10px;margin-left:6px;padding:0 5px;border:1px solid currentColor;border-radius:2px}
#wSkill .op .tp{display:block;font-size:10px;color:#a89a7c;margin-top:2px}
.tgx{animation:tgx 1.2s infinite alternate;text-shadow:0 0 6px #ff5ad8}
@keyframes tgx{from{color:#ff5ad8}to{color:#ffd0f4}}` }));
if (location.search.includes('tridrop')) setTimeout(() => console.log('TRIDROP owned=' + Object.keys(TRIO.own).length), 1500);
