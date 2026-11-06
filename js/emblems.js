'use strict';
// 문장 (기획서 8장): 몬스터가 자기 문장을 떨군다 (일반 3% · 정예 1.5% · 보스 0.5%, 드물수록 강하다)
//  마을 문장사에게 장비 부위마다 1개를 새긴다. 덮어쓰면 기존 문장은 사라진다
//  문장도감: 서로 다른 문장을 모을수록 계정 전체에 작은 능력치가 쌓인다

const EMB_STATS = [['atk', 1.5], ['boss', 4], ['crit', 1.2], ['cdmg', 3], ['hp', 2], ['stag', 4], ['cdr', 1], ['elem', 12]];
const EMB_NAME = { atk: '물리 공격력 +{}%', boss: '보스 · 정예 피해 +{}%', crit: '치명타 확률 +{}%', cdmg: '치명타 피해 +{}%', hp: '최대 생명력 +{}%', stag: '무력화 +{}%', cdr: '스킬 재사용 -{}%', elem: '속성 친화 +{}' };
function embOf(kind) {
  const D = MON[kind]; if (!D) return null;
  const h = Object.keys(MON).indexOf(kind) * 3 + (D.boss ? 1 : 0);
  const [k, base] = EMB_STATS[h % EMB_STATS.length], tier = D.raidBoss ? 4 : D.boss ? 3 : D.elite ? 2 : 1;
  const mul = [0, 1, 2, 3.5, 4.5][tier], v = Math.round(base * mul * (1 + (D.lv - 50) / 60) * 10) / 10;
  return { kind, name: `${D.name}의 문장`, k, v, tier, chance: [0, 0.03, 0.015, 0.005, 0.005][tier], col: ['', '#c8c8c8', '#3d9bd4', '#f0a030', '#ff9ad8'][tier] };
}
const EMB = (() => { try { return Object.assign({ bag: {}, seen: {} }, JSON.parse(localStorage.getItem('twilight.emb') || '{}')); } catch (e) { return { bag: {}, seen: {} }; } })();
if (location.search.includes('fresh')) { EMB.bag = {}; EMB.seen = {}; }
function saveEmb() { try { localStorage.setItem('twilight.emb', JSON.stringify(EMB)); } catch (e) {} }
const embCount = () => Object.keys(EMB.seen).length;
const embTotal = () => Object.keys(MON).length;
// 도감 보너스: 모은 종류 하나당 공격력 · 생명력 +0.3%
const codexBonus = () => embCount() * 0.3;

// ---- 능력치 (calcStats에서 부른다) ----
function applyEmblems(c, s) {
  for (const sl of SLOTS) { const it = c.eq[sl]; if (!it || !it.emb) continue; const e = embOf(it.emb); if (!e) continue; if (e.k === 'elem') for (const k in s.elem) s.elem[k] += e.v; else s.line[e.k] += e.v; }
  const cb = codexBonus(); s.line.atk += cb; s.line.hp += cb;
}
function embTipHTML(it) { if (!it.emb) return ''; const e = embOf(it.emb); return e ? `<div class="ln" style="color:${e.col};margin-top:6px">◈ ${e.name}: ${EMB_NAME[e.k].replace('{}', e.v)}</div>` : ''; }

// ---- 드랍 ----
const _dropLoot = dropLoot;
dropLoot = function (m) {
  _dropLoot(m);
  if (!DUN.on) return;
  const e = embOf(m.kind); if (!e || Math.random() > e.chance * diffRew()) return;
  EMB.bag[m.kind] = (EMB.bag[m.kind] || 0) + 1; const first = !EMB.seen[m.kind]; EMB.seen[m.kind] = true; saveEmb();
  floaters.push({ x: m.x, y: m.def.top + 1.6, z: m.z, t: -0.2, text: `◈ ${e.name}`, crit: false, big: true, vx: 0, color: e.col });
  for (let i = 0; i < 30; i++) { const a = Math.random() * TAU; glow.emit({ x: m.x, y: 1.2, z: m.z, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 2, vz: Math.sin(a) * 2, drag: 2, life: 0.8, c: lc(e.col).map(v => v * 2.5), size: PX * 1.2 }); }
  toast(first ? '새 문장 · 도감 등록' : '문장 획득', e.name, e.col); log(`[문장] ${e.name}을(를) 얻었습니다.${first ? ' 문장도감에 등록되었습니다.' : ''}`, '시스템');
  if (first) party.forEach(recalc);
};

// ---- 문장사 창 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wEmb{left:calc(50% - 340px);top:90px;width:680px}
#wEmb .tabs{display:flex;gap:4px;margin-bottom:10px}#wEmb .tabs div{padding:6px 14px;cursor:pointer;border:1px solid #3a3428;background:#14141a;font-size:12px;color:#a89a7c}#wEmb .tabs div.on{color:#ffe08a;border-color:#c8a050;background:linear-gradient(180deg,#3a3020,#18140c)}
#wEmb .cols{display:grid;grid-template-columns:250px 1fr;gap:12px}
#wEmb .list{max-height:360px;overflow:auto;padding-right:4px}#wEmb .list .eq{cursor:pointer}#wEmb .list .eq.sel{border-color:#c8a050;background:rgba(232,200,120,.1)}
#wEmb .em{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;border:1px solid #2e2b24;background:rgba(0,0,0,.25);font-size:12px;cursor:pointer}#wEmb .em.sel{border-color:#ffe08a}
#wEmb .em b{font-weight:normal}#wEmb .em .n{margin-left:auto;color:#a89a7c}
#wEmb button{font:inherit;font-size:12px;padding:8px 18px;margin-top:10px;cursor:pointer;border-radius:3px;border:1px solid #000;background:linear-gradient(180deg,#e8c070,#9a6a24);color:#1a1208}#wEmb button[disabled]{filter:grayscale(1) brightness(.5);cursor:default}
#wEmb .codex{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#wEmb .codex div{padding:6px;border:1px solid #2e2b24;font-size:11px;line-height:1.5;background:rgba(0,0,0,.25)}#wEmb .codex div.no{opacity:.35}
` }));
const embBd = makeWin('wEmb', '야영지 문장사 이렌');
const EM = { tab: '새기기', item: null, emb: null };
const EMB_COST = 2000;
function renderEmb() {
  embBd.innerHTML = '';
  const tabs = mk('div', 'tabs', '', embBd);
  ['새기기', '문장도감'].forEach(t => { const d = mk('div', t === EM.tab ? 'on' : '', t, tabs); d.onclick = () => { EM.tab = t; renderEmb(); }; });
  if (EM.tab === '문장도감') {
    const cb = codexBonus();
    mk('div', 'dim', `모은 문장 ${embCount()} / ${embTotal()} · 도감 보너스: 물리 공격력 · 최대 생명력 +${cb.toFixed(1)}% (종류마다 +0.3%)`, embBd).style.cssText = 'font-size:12px;margin-bottom:8px';
    const g = mk('div', 'codex', '', embBd);
    for (const k in MON) { const e = embOf(k); mk('div', EMB.seen[k] ? '' : 'no', `<span style="color:${e.col}">${EMB.seen[k] ? MON[k].name : '???'}</span><br>${EMB_NAME[e.k].replace('{}', e.v)}`, g); }
    return;
  }
  const c = party[active];
  mk('div', 'dim', `장비 부위마다 문장 하나를 새깁니다. 이미 새긴 문장은 덮어쓰면 사라집니다. 비용 ${fmt(EMB_COST)} 골드 · 보유 ${fmt(MATS.gold)}`, embBd).style.cssText = 'font-size:11px;margin-bottom:8px';
  const cols = mk('div', 'cols', '', embBd), list = mk('div', 'list', '', cols), pan = mk('div', '', '', cols);
  const items = allGear(); if (!items.find(([it]) => it === EM.item)) EM.item = items[0] ? items[0][0] : null;
  for (const [it, w] of items) { const r = mk('div', 'eq p' + (it === EM.item ? ' sel' : ''), '', list); gslot(r, it); const e = it.emb && embOf(it.emb); mk('div', 'nm2', `<div class="dim">${w} · ${it.slot}</div><div style="color:${GRADE[it.grade]}">${it.name}</div>${e ? `<div style="color:${e.col}">◈ ${e.name}</div>` : ''}`, r); r.onclick = () => { EM.item = it; renderEmb(); }; }
  const owned = Object.keys(EMB.bag).filter(k => EMB.bag[k] > 0);
  if (!owned.length) { pan.innerHTML = '<div class="dim">가진 문장이 없습니다. 던전 몬스터가 드물게 떨굽니다.</div>'; return; }
  if (!owned.includes(EM.emb)) EM.emb = owned[0];
  for (const k of owned) { const e = embOf(k), d = mk('div', 'em' + (k === EM.emb ? ' sel' : ''), `<b style="color:${e.col}">◈ ${e.name}</b><span class="dim">${EMB_NAME[e.k].replace('{}', e.v)}</span><span class="n">×${EMB.bag[k]}</span>`, pan); d.onclick = () => { EM.emb = k; renderEmb(); }; }
  const it = EM.item, e = embOf(EM.emb);
  if (it) {
    const old = it.emb && embOf(it.emb);
    mk('div', 'dim', old ? `덮어쓰면 <span style="color:${old.col}">${old.name}</span>은(는) 사라집니다.` : `${it.name}에 새깁니다.`, pan).style.marginTop = '8px';
    const b = mk('button', '', '새기기', pan); b.disabled = MATS.gold < EMB_COST;
    b.onclick = () => { if (MATS.gold < EMB_COST) return; MATS.gold -= EMB_COST; EMB.bag[EM.emb]--; it.emb = EM.emb; saveEmb(); party.forEach(recalc); saveGame(); toast('문장 새김', `${it.name} ◈ ${e.name}`, e.col); const A = party[active]; embers(A.x, 1.5, A.z, 30, lc(e.col).map(v => v * 2.5), 5); renderEmb(); };
  }
}
const _renderWin = renderWin;
renderWin = function (id) { if (id === 'wEmb') return renderEmb(); return _renderWin(id); };

// ---- 마을의 문장사 (텐트 동쪽) ----
const engraverTex = tex((() => { const g = new Pix(24, 40, S);
  g.rect(8, 30, 3, 9, '#2a2030'); g.rect(13, 30, 3, 9, '#2a2030');
  eachPx(g, 3, 13, 21, 34, (px, py, X, Y) => { const hw = 5 + (Y - 13) * 0.2; if (Math.abs(X - 12) < hw) g.fset(px, py, ['#2a1a3a', '#3e2858', '#563a78'][shadeAt(0.55 - (X - 12) / hw * 0.3, 3, px, py)]); });
  g.rect(11, 15, 2, 18, '#c8a050'); g.rect(8, 6, 8, 8, '#d8b090'); g.rect(7, 4, 10, 4, '#3e2858'); g.rect(6, 7, 2, 6, '#3e2858'); g.rect(16, 7, 2, 6, '#3e2858'); g.set(10, 9, '#1a1010'); g.set(14, 9, '#1a1010');
  g.rect(18, 20, 2, 8, '#d8b090'); g.rect(18, 17, 2, 4, '#8a8a9a'); g.rect(3, 22, 3, 6, '#d8b090'); g.rect(1, 26, 5, 5, '#c8a050'); g.rect(2, 27, 3, 3, '#ff9ad8');
  return g.outline(OUT).canvas(); })());
const ENGRAVER = { x: 1.6, z: -6.2 };
{ const n = addBB(new THREE.MeshLambertMaterial({ map: engraverTex, alphaTest: 0.5, side: THREE.DoubleSide }), 24, 40, ENGRAVER.x, ENGRAVER.z, { s: 1.15 }); const sh = contactShadow(0.7, 0.35); sh.position.set(ENGRAVER.x, 0.015, ENGRAVER.z);
  const lamp = new THREE.PointLight(0xff9ad8, 2, 4, 1.6); lamp.position.set(ENGRAVER.x, 1.4, ENGRAVER.z + 0.4); scene.add(lamp);
  const po = { x: ENGRAVER.x, z: ENGRAVER.z, r: 0.5 }; obstacles.push(po); townObs.push(po); townObjs.push(n, sh, lamp); }
let embArmed = true;
const _updateGear = updateGear;
updateGear = function (dt) {
  _updateGear(dt);
  if (AREA !== 'town') return;
  const A = party[active], d = Math.hypot(A.x - ENGRAVER.x, A.z - ENGRAVER.z);
  if (d < 1.9 && embArmed && !A.down) { embArmed = false; toggleWin('wEmb', true); }
  if (d > 2.3) embArmed = true;
  if (Math.random() < dt * 4) glow.emit({ x: ENGRAVER.x - 0.7 + (Math.random() - 0.5) * 0.3, y: 1.1, z: ENGRAVER.z + 0.1, vy: 0.5, life: 0.6, c: [2.6, 0.9, 2.0], size: PX });
};
party.forEach(recalc);
// 확인용: ?embs=1 이면 문장 몇 개를 쥐여 준다
if (location.search.includes('embs=1')) { for (const k of ['wolf', 'golem', 'boss', 'knight', 'giant']) { EMB.bag[k] = 2; EMB.seen[k] = true; } party.forEach(recalc); }
// 확인용: ?etest=1 새기기 버튼을 눌러 본다 · ?embdrop=1 드랍 확률 50배
if (location.search.includes('etest')) { toggleWin('wEmb', true); EM.item = party[active].eq['무기']; EM.emb = 'boss'; renderEmb(); const before = party[active].gs.line.atk; [...document.querySelectorAll('#wEmb button')].pop().click(); console.log('ETEST emb=' + party[active].eq['무기'].emb + ' bossline=' + party[active].gs.line.boss + ' atk=' + before + '->' + party[active].gs.line.atk + ' codex=' + embCount()); }
if (location.search.includes('embdrop')) { const _e = embOf; embOf = k => { const e = _e(k); if (e) e.chance *= 50; return e; }; }
