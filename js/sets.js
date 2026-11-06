'use strict';
// 장비 세트 (기획서 8장): 지역 보스 · 레이드마다 세트. 무기 + 방어구 5부위 중 3개 · 5개를 끼면 효과
//  3세트: 능력치 · 5세트: 직업마다 스킬 하나가 바뀐다 (트라이포드 엔진에 효과를 얹는다)

const SET_SLOTS = ['무기', '투구', '견갑', '상의', '하의', '장갑'];
const SETS = {
  forest:   { region: 1, name: '시든 군주', col: '#d88a30', s3: ['atk', 6], s5: {
    berserker: ['F', '대지 분쇄의 착지가 반경 6m 대폭발 (500%) + 3초 화상', { boom: [6, 500], dot: [60, 3, '화상'] }],
    hawk: ['R', '화살비가 독을 머금는다: 중독 4초 초당 80% + 둔화', { dot: [80, 4, '중독'], slow: 0.3 }],
    assassin: ['F', '연막이 끝나며 독무가 터진다 (반경 4m 600%)', { boom: [4, 600] }] } },
  abbey:    { region: 2, name: '베르무스의 성의', col: '#9ab8ff', s3: ['hp', 8], s5: {
    berserker: ['X', '철혈 반격이 생명력 12% 회복 · 막는 동안 받는 피해 -30%', { healOnce: 0.12, dr: 0.3 }],
    hawk: ['E', '매 강습 적중마다 생명력 1% 회복 · 피해 +30%', { heal: 0.01, dmg: 0.3 }],
    assassin: ['R', '그림자 분신이 더 짙어진다: 피해 +50%', { dmg: 0.5 }] } },
  canyon:   { region: 3, name: '사르히드의 모래', col: '#e0b878', s3: ['crit', 5], s5: {
    berserker: ['E', '돌진 어깨치기 재사용 -3초 · 마무리 모래 폭발 400%', { cd: -3, boom: [3, 400] }],
    hawk: ['X', '바람 가르기 도약 재사용 -3초 · 착지 때 사방으로 바람 칼날 6개', { cd: -3, wave: [6, 140] }],
    assassin: ['Q', '그림자 돌파 재사용 -1.5초 · 지나간 자리 모래 폭발 400%', { cd: -1.5, boom: [2.5, 400] }] } },
  tomb:     { region: 4, name: '알데리크의 왕관', col: '#a8e4ff', s3: ['boss', 10], s5: {
    berserker: ['Z', '격노 난무가 얼린다: 1초 속박 · 둔화 · 피해 +25%', { stun: 1, slow: 0.3, dmg: 0.25 }],
    hawk: ['Z', '연환 속사가 얼린다: 둔화 · 피해 +30%', { slow: 0.3, dmg: 0.3 }],
    assassin: ['Z', '천 갈래 찌르기가 얼린다: 1초 속박 · 피해 +30%', { stun: 1, dmg: 0.3 }] } },
  fortress: { region: 5, name: '이그나로스의 심장', col: '#ff7a40', s3: ['cdmg', 12], s5: {
    berserker: ['R', '폭풍 회전참이 끝날 때 사방으로 검기 8개를 날린다 (150%)', { wave: [8, 150] }],
    hawk: ['C', '천둥 매가 돌아온 자리에 용암 폭발 (반경 4m 800%)', { boom: [4, 800] }],
    assassin: ['C', '망자의 무도가 끝나며 화염 폭발 (반경 5m 900%)', { boom: [5, 900] }] } },
  void:     { region: 6, name: '니힐의 장막', col: '#d070ff', s3: ['cdr', 6], s5: {
    berserker: ['C', '파천일격 차지 속도 +50% · 피해 +30%', { spd: 0.5, dmg: 0.3 }],
    hawk: ['Q', '관통 화살 재사용 -1.5초 · 표식 +2', { cd: -1.5, mark: 2 }],
    assassin: ['X', '사슬 낚아채기 재사용 -4초 · 구슬 +2', { cd: -4, orb: 2 }] } },
  raid:     { region: 7, name: '문지기', col: '#ff9ad8', s3: ['stag', 15], s5: {
    berserker: ['V', '각성기 재사용 -15초 · 피해 +40% · 끝에 공허 폭발 (1,500%)', { cd: -15, dmg: 0.4, boom: [6, 1500] }],
    hawk: ['V', '각성기 재사용 -15초 · 피해 +40% · 끝에 공허 폭발 (1,500%)', { cd: -15, dmg: 0.4, boom: [6, 1500] }],
    assassin: ['V', '각성기 재사용 -15초 · 피해 +40% · 끝에 공허 폭발 (1,500%)', { cd: -15, dmg: 0.4, boom: [6, 1500] }] } },
};
const SET_OF_REGION = Object.fromEntries(Object.entries(SETS).map(([k, v]) => [v.region, k]));
const LINE_NAME = { atk: '물리 공격력 +{}%', hp: '최대 생명력 +{}%', crit: '치명타 확률 +{}%', boss: '보스 · 정예 피해 +{}%', cdmg: '치명타 피해 +{}%', cdr: '스킬 재사용 -{}%', stag: '무력화 +{}%' };

function setCounts(c) { const n = {}; for (const sl of SET_SLOTS) { const it = c.eq[sl]; if (it && it.set) n[it.set] = (n[it.set] || 0) + 1; } return n; }
// 3세트 능력치 (calcStats에서 부른다)
function applySets(c, s) { const n = setCounts(c); for (const id in n) if (n[id] >= 3) s.line[SETS[id].s3[0]] += SETS[id].s3[1]; }
// 5세트 스킬 변화: 트라이포드 효과에 얹는다
const _triFx = triFx, setFxCache = {};
triFx = function (c, key) {
  const base = _triFx(c, key), n = setCounts(c), mods = [];
  for (const id in n) if (n[id] >= 5) { const m = SETS[id].s5[c.key]; if (m && m[0] === key) mods.push(m[2]); }
  if (!mods.length) return base;
  const kit = kitOf(c.key), inf = kit && kit.info[key], sig = c.key + key + (inf && inf.tri.length ? tsel(c.key, key, inf.tri.length).join() : '') + Object.keys(n).filter(id => n[id] >= 5).join();
  if (setFxCache[sig]) return setFxCache[sig];
  const f = Object.assign({ dmg: 0, range: 0, spd: 0, dr: 0, stag: 0, crit: 0, cdmg: 0, cd: 0, names: [] }, base || {});
  for (const p of mods) for (const k in p) { if (typeof p[k] === 'number' && typeof f[k] === 'number') f[k] += p[k]; else f[k] = p[k]; }
  return (setFxCache[sig] = f);
};
// V(각성기)는 트라이포드가 없어 기존 curTri가 null을 돌려준다. 세트 효과는 걸리게 한다
const _curTri = curTri;
curTri = function (c) { if (c && c.state === 'skill' && c.sk && kitOf(c.key) && kitOf(c.key).info[c.sk.id]) return triFx(c, c.sk.id); return _curTri(c); };

// ---- 세트 장비 만들기 ----
function makeSetItem(setId, grade, ilv, cls) {
  const slot = pick(SET_SLOTS), g = GRADES.indexOf(grade) < 3 ? '영웅' : grade, it = makeItem(slot, g, ilv, cls);
  it.set = setId; it.name = `${SETS[setId].name}의 ${slot === '무기' ? WNAME[cls] : PNAME[slot]}`;
  return it;
}
function setTipHTML(it, c) {
  if (!it.set) return '';
  const S = SETS[it.set], n = c ? (setCounts(c)[it.set] || 0) : 0, m = S.s5[c ? c.key : 'berserker'];
  const ln = (need, text) => `<div class="ln" style="color:${n >= need ? S.col : '#666'}">[${need}세트] ${text}</div>`;
  return `<div class="ln" style="color:${S.col};margin-top:6px">${S.name} 세트 (${n} / 6)</div>` + ln(3, LINE_NAME[S.s3[0]].replace('{}', S.s3[1])) + ln(5, m[1]);
}

// ---- 연결: 보스 상자 · 레이드 보상 · 툴팁 · 캐릭터 창 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `.setbox div{display:flex;justify-content:space-between;padding:3px 6px;margin-bottom:3px;background:rgba(255,255,255,.04);border-left:2px solid;font-size:11px;line-height:1.5}` }));
function renderSetBox(par, c) {
  const n = setCounts(c), ids = Object.keys(n); if (!ids.length) return;
  const box = mk('div', 'setbox', '<div class="gold" style="border:none;background:none;padding:10px 0 4px">세트 효과</div>', par);
  for (const id of ids) { const S = SETS[id]; mk('div', '', `<span style="color:${S.col}">${S.name} ${n[id]}/6</span><span style="color:${n[id] >= 5 ? S.col : n[id] >= 3 ? '#c8c0b0' : '#666'}">${n[id] >= 5 ? '5세트' : n[id] >= 3 ? '3세트' : '-'}</span>`, box).style.borderLeftColor = S.col; }
}
party.forEach(c => recalc(c));
// 확인용: ?setgear=fortress 면 지금 캐릭터에게 그 세트 6부위
if (new URLSearchParams(location.search).get('setgear')) { const id = new URLSearchParams(location.search).get('setgear'); party.forEach(c => { for (const sl of SET_SLOTS) { const it = makeSetItem(id, '유물', 1650, c.key); it.slot = sl; it.name = `${SETS[id].name}의 ${sl === '무기' ? WNAME[c.key] : PNAME[sl]}`; if (sl !== '무기') { delete it.atk; it.hp = Math.round(it.ilv * 0.12 * 1.4); it.def = Math.round(it.ilv * 0.08 * 1.4); } else { it.cls = c.key; it.atk = Math.round(it.ilv * 0.75 * 1.4); delete it.hp; delete it.def; delete it.crit; } c.eq[sl] = it; } recalc(c); }); }
