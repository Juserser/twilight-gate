'use strict';
// 장비 · 성장 (기획서 8 · 9 · 10장)
//  등급 7단계 · 장비 11칸 · 강화 +0~+20(파괴 없음) · 숨은 옵션(희귀 1줄, 영웅 이상 3줄, 1줄 잠금, 승급 천장)
//  속성 친화 4종(가장 높은 값 하나, 약점이면 1.5배) · 몬스터 드랍 · 보스 상자(던전별 확률, 전설 천장) · 분해 · 저장

GRADE['태초'] = '#f0e2b0'; GRADE_BG['태초'] = '#3a3426';
const GRADES = ['일반', '고급', '희귀', '영웅', '전설', '유물', '태초'];
const GMUL = [0.8, 0.9, 1, 1.12, 1.25, 1.4, 1.6];
const GICON = { 일반: ['#5e5e66', '#9a9aa6'], 고급: ['#3a6a2a', '#8ac060'], 희귀: ['#2a4a8a', '#70a0e0'], 영웅: ['#5a2a8a', '#c08aff'], 전설: ['#8a5010', '#ffb040'], 유물: ['#8a2a10', '#ff7a40'], 태초: ['#8a7a50', '#fff0c0'] };
const SLOTS = ['무기', '투구', '견갑', '상의', '하의', '장갑', '목걸이', '귀걸이1', '귀걸이2', '반지1', '반지2'];
const PIECE = { 무기: 'weapon', 투구: 'helmet', 견갑: 'shoulder', 상의: 'chest', 하의: 'pants', 장갑: 'gloves', 목걸이: 'necklace', 귀걸이: 'earring', 반지: 'ring' };
const ARMOR = ['투구', '견갑', '상의', '하의', '장갑'], ACCS = ['목걸이', '귀걸이', '반지'];
const WNAME = { berserker: '대검', hawk: '장궁', assassin: '쌍단검' }, CLSNAME = { berserker: '광전사', hawk: '매사냥꾼', assassin: '그림자 암살자' };
const PNAME = { 투구: '두건', 견갑: '어깨덮개', 상의: '흉갑', 하의: '각반', 장갑: '장갑', 목걸이: '목걸이', 귀걸이: '귀걸이', 반지: '반지' };
const PREFIX = { 일반: '낡은', 고급: '단단한', 희귀: '황혼빛', 영웅: '시든 숲의', 전설: '모르그라스의', 유물: '왕좌를 삼킨', 태초: '태초 숲의' };
const ELEM = { fire: ['화염', '#ff7a4a'], frost: ['서리', '#7ad0ff'], bolt: ['번개', '#ffe060'], dark: ['어둠', '#c08aff'] };
const TIER = ['희귀', '영웅', '전설', '태초'], TIERC = ['#3d9bd4', '#b05ae0', '#f0a030', '#f0e2b0'];
// 숨은 옵션 줄: 등급(희귀 → 태초)별 수치
const LINES = {
  atk: ['물리 공격력 +{}%', [3, 6, 9, 12]], boss: ['보스 · 정예 피해 +{}%', [8, 15, 22, 30]], cdmg: ['치명타 피해 +{}%', [4, 8, 12, 16]],
  crit: ['치명타 확률 +{}%', [2, 4, 6, 8]], cdr: ['스킬 재사용 -{}%', [2, 3, 5, 6]], stag: ['무력화 +{}%', [5, 8, 12, 15]],
  hp: ['최대 생명력 +{}%', [3, 6, 9, 12]], elem: ['속성 친화 +{}', [20, 40, 60, 80]],
};
const LINE_KEYS = Object.keys(LINES);
const UP_P = [0.06, 0.018, 0.003], UP_PITY = [50, 180, 600];   // 희귀→영웅 · 영웅→전설 · 전설→태초
// 몬스터 약점 속성
Object.assign(MON.wolf, { weak: 'bolt' }); Object.assign(MON.rotwood, { weak: 'fire' }); Object.assign(MON.crow, { weak: 'frost' }); Object.assign(MON.golem, { weak: 'bolt' }); Object.assign(MON.boss, { weak: 'fire' });

// ---- 아이템 만들기 ----
let uidN = 1;
const pick = a => a[(Math.random() * a.length) | 0];
function rollLine(maxTier) { return { k: pick(LINE_KEYS), t: Math.min(maxTier, Math.random() < 0.25 ? 1 : 0) }; }
function makeItem(slot, grade, ilv, cls) {
  const gi = GRADES.indexOf(grade), gm = GMUL[gi], it = { uid: uidN++, slot, grade, ilv: ilv + gi * 10, enh: 0, fails: 0, pity: [0, 0, 0] };
  if (slot === '무기') { it.cls = cls; it.atk = Math.round(it.ilv * 0.75 * gm); }
  else if (ARMOR.includes(slot)) { it.hp = Math.round(it.ilv * 0.12 * gm); it.def = Math.round(it.ilv * 0.08 * gm); }
  else { it.crit = Math.round(it.ilv * 0.05 * gm); it.hp = Math.round(it.ilv * 0.04 * gm); }
  const nl = gi >= 3 ? 3 : gi === 2 ? 1 : 0, maxT = gi >= 5 ? 2 : gi >= 4 ? 1 : 0;
  it.lines = [...Array(nl)].map(() => rollLine(maxT));
  if (gi >= 4 && maxT >= 1) it.lines[0].t = Math.max(it.lines[0].t, gi >= 5 ? 2 : 1);
  if (gi >= 3 || (gi === 2 && Math.random() < 0.4)) it.elem = { k: pick(Object.keys(ELEM)), v: Math.round(it.ilv * 0.03 * gm) };
  it.name = `${((DUN.on && DUN.d && REGION.prefix[DUN.d.region]) || PREFIX)[grade]} ${slot === '무기' ? WNAME[cls] : PNAME[slot]}`;
  return it;
}
const enhMul = n => 1 + n * 0.04 + n * n * 0.002;
const itemIconURL = (() => { const cache = {}; return it => { const k = PIECE[it.slot] + it.grade; return cache[k] || (cache[k] = iconURL(PIECE[it.slot], ...GICON[it.grade])); }; })();
const slotOf = it => it.slot;      // 귀걸이 · 반지는 1/2 칸 중 빈 곳
function equipSlotFor(c, it) { if (it.slot === '귀걸이' || it.slot === '반지') { const a = it.slot + '1', b = it.slot + '2'; return !c.eq[a] ? a : !c.eq[b] ? b : a; } return it.slot; }

// ---- 보관함 · 재화 ----
const BAG = [];          // 장비 (최대 40)
const MATS = { gold: 0, steel: 0, guard: 0, shard: 0, crystal: 0, awaken: 0 };
const MATN = { gold: ['골드', '#ffd27a'], steel: ['붉은 강철 조각', '#d07060'], guard: ['푸른 수호석', '#70a0e0'], shard: ['황혼의 파편', '#d0a0ff'], crystal: ['돌파의 결정', '#ffe080'], awaken: ['각성석', '#7affc0'] };
const MAT_ICON = { steel: iconURL('ore', '#8a3a3a', '#d07060'), guard: iconURL('ore', '#2a4a8a', '#70a0e0'), shard: iconURL('shard', '#7a3ab0', '#d0a0ff'), crystal: iconURL('gem', '#c89020', '#ffe080'), awaken: iconURL('gem', '#1a7a5a', '#7affc0') };
let legendPity = 0;
party.forEach(c => c.eq = {});

// ---- 능력치 ----
const BASE_HP = { berserker: 4000, hawk: 2900, assassin: 2900 };
function calcStats(c) {
  const s = { atk: 0, hp: 0, def: 0, crit: 0, line: {}, elem: { fire: 0, frost: 0, bolt: 0, dark: 0 }, ilv: 0, n: 0 };
  for (const k of LINE_KEYS) s.line[k] = 0;
  for (const sl of SLOTS) {
    const it = c.eq[sl]; if (!it) continue;
    const em = enhMul(it.enh); s.n++; s.ilv += it.ilv + it.enh * 5;
    if (it.atk) s.atk += it.atk * em; if (it.hp) s.hp += it.hp * em; if (it.def) s.def += it.def * em; if (it.crit) s.crit += it.crit * em;
    for (const L of it.lines) s.line[L.k] += LINES[L.k][1][L.t];
    if (it.elem) s.elem[it.elem.k] += it.elem.v;
  }
  for (const k in s.elem) s.elem[k] += s.line.elem;
  if (typeof applySets === 'function') applySets(c, s);
  if (typeof applyEmblems === 'function') applyEmblems(c, s);
  s.ilv = s.n ? s.ilv / SLOTS.length : 0;
  s.atkMul = Math.max(0.3, s.atk / 1000) * (1 + s.line.atk / 100);
  s.critP = 0.12 + s.crit / 2000 + s.line.crit / 100;
  s.critMul = 2 * (1 + s.line.cdmg / 100);
  s.maxHp = Math.round((BASE_HP[c.key] + s.hp + (player.level - 50) * 40) * (1 + s.line.hp / 100));
  s.defRed = s.def / (s.def + 4000);
  s.bestElem = Object.keys(s.elem).reduce((a, b) => s.elem[a] >= s.elem[b] ? a : b);
  return s;
}
function recalc(c) { const r = c.max ? c.hp / c.max : 1; c.gs = calcStats(c); c.max = c.gs.maxHp; c.hp = Math.round(c.max * r); }
// 전투에 쓰는 값 (hitTarget · hurtPlayer · useSkill에서 부른다)
function gearDmgMul(c, tg) {
  const s = c.gs; if (!s) return 1;
  let m = s.atkMul; const D = tg.mon && tg.mon.def;
  if (D && (D.boss || D.elite)) m *= 1 + s.line.boss / 100;
  const ev = s.elem[s.bestElem] * (D && (D.weak === s.bestElem || (D.weak === 'notdark' && s.bestElem !== 'dark')) ? 1.5 : 1);
  return m * (1 + ev / 600);
}
const gearCrit = c => c.gs ? c.gs.critP : 0.2, gearCritMul = c => c.gs ? c.gs.critMul : 2;
const gearCdr = c => c.gs ? 1 - c.gs.line.cdr / 100 : 1, gearStag = c => c.gs ? 1 + c.gs.line.stag / 100 : 1, gearDef = c => c.gs ? 1 - c.gs.defRed : 1;

// ---- 드랍 ----
const drops = [];
function dropItem(x, z, it) {
  const isMat = !it.slot, col = isMat ? (MATN[it.mat] || MATN.gold)[1] : GRADE[it.grade];
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: tex(isMat ? (it.mat === 'gold' ? itemIcon('gem', '#a07010', '#ffd27a') : itemIcon(it.mat === 'steel' || it.mat === 'guard' ? 'ore' : 'gem', ...(it.mat === 'steel' ? ['#8a3a3a', '#d07060'] : it.mat === 'guard' ? ['#2a4a8a', '#70a0e0'] : ['#1a7a5a', '#7affc0']))) : itemIcon(PIECE[it.slot], ...GICON[it.grade])), alphaTest: 0.4, side: THREE.DoubleSide }));
  scene.add(icon); billboards.push(icon);
  const gi = isMat ? 0 : GRADES.indexOf(it.grade), beam = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3 + gi * 0.6).translate(0, (3 + gi * 0.6) / 2, 0), addMat(...lc(col).map(v => v * 2.2), gi >= 3 ? 0.7 : 0.35, pillarTex));
  scene.add(beam); billboards.push(beam);
  const a = Math.random() * TAU, sp = 1.5 + Math.random() * 2;
  drops.push({ it, icon, beam, x, z, y: 0.6, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 4, t: 0, col });
}
function updateDrops(dt) {
  const A = party[active];
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.t += dt;
    if (d.t < 0.9) { d.vy -= 16 * dt; d.x += d.vx * dt; d.z += d.vz * dt; d.y = Math.max(0.35, d.y + d.vy * dt); if (d.y <= 0.35) { d.vx *= 0.8; d.vz *= 0.8; d.vy = Math.abs(d.vy) * 0.3; } }
    else { const k = Math.min(1, (d.t - 0.9) * 2.5), dx = A.x - d.x, dz = A.z - d.z, dd = Math.hypot(dx, dz) || 1; d.x += dx / dd * Math.min(dd, (6 + k * 14) * dt); d.z += dz / dd * Math.min(dd, (6 + k * 14) * dt); d.y += (1.2 - d.y) * dt * 4;
      if (Math.random() < 0.5) glow.emit({ x: d.x, y: d.y, z: d.z, life: 0.3, c: lc(d.col).map(v => v * 2.5), size: PX });
      if (dd < 0.6) { collect(d.it); scene.remove(d.icon, d.beam); billboards.splice(billboards.indexOf(d.icon), 1); billboards.splice(billboards.indexOf(d.beam), 1); disposeObj(d.icon); disposeObj(d.beam); drops.splice(i, 1); continue; } }
    d.icon.position.set(d.x, d.y + Math.sin(d.t * 5) * 0.08, d.z); d.beam.position.set(d.x, 0, d.z); d.beam.material.opacity = (d.t < 0.9 ? 0.9 : Math.max(0, 1 - (d.t - 0.9) * 2)) * 0.7;
  }
}
function collect(it) {
  if (!it.slot) { MATS[it.mat] += it.n; floaters.push({ x: party[active].x, y: 2.8, z: party[active].z, t: 0, text: `+${fmt(it.n)} ${MATN[it.mat][0]}`, crit: false, vx: 0, color: MATN[it.mat][1] }); return; }
  if (BAG.length >= 40) { MATS.steel += 20; toast('가방이 가득 찼습니다', `${it.name}을(를) 분해했습니다`, '#ff8a6a'); return; }
  BAG.push(it); if (DUN.on) (DUN.loot = DUN.loot || []).push(it);
  const gi = GRADES.indexOf(it.grade);
  floaters.push({ x: party[active].x, y: 3, z: party[active].z, t: 0, text: it.name, crit: false, big: gi >= 3, vx: 0, color: GRADE[it.grade] });
  if (gi >= 3) toast(`${it.grade} 장비 획득`, it.name, GRADE[it.grade]);
  log(`[${it.grade}] ${it.name}을(를) 얻었습니다.`, '시스템'); saveGame();
  if (document.getElementById('wRes').classList.contains('open')) renderWin('wRes');
}
const dunIlv = () => (DUN.d && DUN.d.ilv) || 1320;
function randSlot(cls) { return Math.random() < 0.7 ? pick(['무기', ...ARMOR]) : pick(ACCS); }
const curCls = () => party[active].key;
// 몬스터: 골드 · 재료 · 낮은 확률로 장비
function dropLoot(m) {
  if (!DUN.on) return;
  const D = m.def, k = D.boss ? 6 : D.elite ? 3 : 1;
  dropItem(m.x, m.z, { mat: 'gold', n: Math.round(D.lv * (20 + Math.random() * 20) * k * diffRew()) });
  if (Math.random() < 0.5 * k) dropItem(m.x, m.z, { mat: pick(['steel', 'guard']), n: Math.round((4 + Math.random() * 6) * k) });
  if (D.elite || D.boss) dropItem(m.x, m.z, { mat: 'awaken', n: D.boss ? 6 : 2 });
  if (Math.random() < (D.elite ? 0.35 : 0.06)) dropItem(m.x, m.z, makeItem(randSlot(), D.elite && Math.random() < 0.15 ? '영웅' : pick(['고급', '고급', '희귀']), dunIlv(), curCls()));
}
// 보스 상자: 기획서 9장 확률 (일반 · 정예 · 지역 보스) + 전설 천장 60판
const CHEST = [{ hero: 0.15, leg: 0, relic: 0 }, { hero: 0.45, leg: 0.02, relic: 0 }, { hero: 1, leg: 0.08, relic: 0.005 }];
const chestTex = tex((() => { const g = new Pix(20, 16, S); g.rect(1, 6, 18, 9, '#5a3a1e'); g.rect(1, 2, 18, 5, '#7a5028'); g.rect(1, 6, 18, 1, '#c8a050'); g.rect(8, 5, 4, 4, '#ffd060'); g.rect(1, 2, 1, 13, '#c8a050'); g.rect(18, 2, 1, 13, '#c8a050'); g.rect(9, 6, 2, 2, '#3a2010'); return g.outline(OUT).canvas(); })());
function bossChest(done) {
  const di = DUN.d.tier, rg = (DUN.d.region || 1) * diffRew(), P = diffChest(CHEST[di]), x = 3.5, z = 1.5;
  const m = new THREE.Mesh(bbGeo(20 * PX * 1.4, 16 * PX * 1.4), new THREE.MeshLambertMaterial({ map: chestTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  m.position.set(x, 3, z); scene.add(m); billboards.push(m); DUN.objs.push(m);
  addFx(new THREE.Group(), 1.6, f => {
    const k = Math.min(1, f.t / 0.5); m.position.y = 3 * (1 - k * k); if (k >= 1 && !f.land) { f.land = true; dustRing(x, z, 18, 3, '#9c8466'); shake = Math.max(shake, 0.3); }
    if (f.t >= 1.2 && !f.open) {
      f.open = true; legendPity++;
      shockwave(x, z, 3.5, [2.6, 2.0, 0.8], 0.5); embers(x, 0.8, z, 50, [2.8, 2.2, 0.8], 7); fxFlash = 2; fxLight.color.set('#ffd070'); fxLight.position.set(x, 1, z);
      const items = [], n = 2 + (Math.random() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        let g = '희귀';
        if (i === 0) { const r = Math.random(); g = r < P.relic ? '유물' : r < P.relic + P.leg || (di === 2 && legendPity >= 60) ? '전설' : r < P.hero ? '영웅' : '희귀'; }
        else g = Math.random() < 0.3 ? '희귀' : '고급';
        if (g === '전설' || g === '유물') legendPity = 0;
        items.push(makeItem(randSlot(), g, dunIlv() + 10, curCls()));
      }
      if (typeof makeSetItem === 'function' && DUN.d.tier >= 2 && SET_OF_REGION[DUN.d.region]) items[0] = makeSetItem(SET_OF_REGION[DUN.d.region], items[0].grade, dunIlv() + 10, curCls());
      items.forEach(it => dropItem(x, z, it));
      dropItem(x, z, { mat: 'gold', n: (1500 + di * 1200) * rg }); dropItem(x, z, { mat: 'shard', n: Math.round((30 + di * 20) * diffRew()) }); if (di >= 1) dropItem(x, z, { mat: 'crystal', n: di * 3 });
    }
  });
  setTimeout(done, 3200);
}

// ---- 장착 ----
function equip(c, it) {
  if (it.slot === '무기' && it.cls !== c.key) { toast('착용할 수 없습니다', `${CLSNAME[it.cls]} 전용 무기`, '#ff8a6a'); return; }
  const sl = equipSlotFor(c, it), old = c.eq[sl];
  BAG.splice(BAG.indexOf(it), 1); if (old) BAG.push(old);
  c.eq[sl] = it; recalc(c); saveGame(); log(`${it.name} 착용`, '시스템');
}
function unequip(c, sl) { const it = c.eq[sl]; if (!it || BAG.length >= 40) return; delete c.eq[sl]; BAG.push(it); recalc(c); saveGame(); }

// ---- 툴팁 ----
function gearTip(it, c) {
  const em = enhMul(it.enh), main = it.atk ? `무기 공격력 ${fmt(it.atk * em)}` : it.def ? `생명력 +${fmt(it.hp * em)} · 방어 +${fmt(it.def * em)}` : `치명 +${fmt(it.crit * em)} · 생명력 +${fmt(it.hp * em)}`;
  const lines = it.lines.map(L => `<div class="ln" style="color:${TIERC[L.t]}">[${TIER[L.t]}] ${LINES[L.k][0].replace('{}', LINES[L.k][1][L.t])}</div>`).join('');
  const el = it.elem ? `<div class="ln" style="color:${ELEM[it.elem.k][1]}">${ELEM[it.elem.k][0]} 친화 +${it.elem.v}</div>` : '';
  const worn = c && c.eq[equipSlotFor(c, it)];
  const cmp = worn && worn !== it ? `<div class="ln dim">착용 중: <span style="color:${GRADE[worn.grade]}">${worn.enh ? '+' + worn.enh + ' ' : ''}${worn.name}</span></div>` : '';
  return `<div class="th lp" style="background:linear-gradient(180deg,${GRADE_BG[it.grade]},#0c0d12)"><div class="tn" style="color:${GRADE[it.grade]}">${it.enh ? '+' + it.enh + ' ' : ''}${it.name}</div><div class="dim">${it.grade} ${it.slot}${it.cls ? ' · ' + CLSNAME[it.cls] : ''}</div></div>
  <div class="tb lp" style="border-top:none"><div class="gold">아이템 레벨 ${it.ilv + it.enh * 5}</div><div>${main}</div>${el}${lines ? '<div class="ln gold" style="margin-top:4px">숨은 옵션</div>' + lines : ''}${typeof setTipHTML === 'function' ? setTipHTML(it, c || party[active]) : ''}${typeof embTipHTML === 'function' ? embTipHTML(it) : ''}${cmp}</div>`;
}

// ---- 캐릭터 · 인벤토리 창 ----
function gslot(par, it, cls = '') {
  const s = slotEl(par, cls);
  if (!it) { s.classList.add('empty'); return s; }
  s.img.src = itemIconURL(it); s.style.background = `radial-gradient(circle at 50% 35%,${GRADE_BG[it.grade]},#0c0d12)`; s.style.borderColor = GRADE[it.grade];
  if (it.enh) s.k.textContent = '+' + it.enh;
  return s;
}
function renderChar() {
  const c = party[active], s = c.gs || calcStats(c); charBd.innerHTML = '';
  const L = mk('div', '', '', charBd), M = mk('div', '', '', charBd), Rr = mk('div', '', '', charBd);
  const row = (par, sl) => { const it = c.eq[sl], r = mk('div', 'eq p', '', par); gslot(r, it); mk('div', 'nm2', `<div class="dim">${sl.replace(/\d/, '')}</div><div style="color:${it ? GRADE[it.grade] : '#555'}">${it ? (it.enh ? '+' + it.enh + ' ' : '') + it.name : '비어 있음'}</div>`, r); if (it) { bindTip(r, () => gearTip(it) + '<div class="tb lp" style="border-top:none"><div class="ln gold">우클릭으로 벗기</div></div>'); r.oncontextmenu = e => { e.preventDefault(); unequip(c, sl); hideTip(); renderWin('wChar'); }; } };
  SLOTS.slice(0, 6).forEach(sl => row(L, sl));
  const pv = mk('div', 'pv', `<div class="il"><div class="dim">아이템 레벨</div><div class="v">${s.ilv.toFixed(1)}</div><div style="margin-top:4px">Lv.${player.level} <span class="gold">${active === 0 ? player.name : c.cl.name}</span> · ${CLSNAME[c.key]}</div></div><img>`, M);
  const big = document.createElement('canvas'); big.width = HW * S; big.height = HH * S; big.getContext('2d').drawImage(HERO_FRAMES[c.key].idle[0].c, 0, 0); pv.querySelector('img').src = big.toDataURL();
  mk('div', 'st', [['공격력', fmt(s.atk * (1 + s.line.atk / 100))], ['최대 생명력', fmt(s.maxHp)], ['치명타 확률', (s.critP * 100).toFixed(1) + '%'], ['치명타 피해', '×' + s.critMul.toFixed(2)], ['보스 피해', '+' + s.line.boss + '%'], ['피해 감소', (s.defRed * 100).toFixed(1) + '%'], ['스킬 재사용', '-' + s.line.cdr + '%'], ['무력화', '+' + s.line.stag + '%']].map(([a, b]) => `<div><span class="dim">${a}</span><span>${b}</span></div>`).join(''), M);
  SLOTS.slice(6).forEach(sl => row(Rr, sl));
  mk('div', 'eng', '<div class="gold" style="border:none;background:none;padding:0 0 4px">속성 친화 <span class="dim">(가장 높은 값 · 약점이면 1.5배)</span></div>' + Object.keys(ELEM).map(k => `<div><span style="color:${ELEM[k][1]}">${ELEM[k][0]}${k === s.bestElem ? ' ◆' : ''}</span><span>${s.elem[k]}</span></div>`).join(''), Rr);
}
function renderInv() {
  invBd.innerHTML = '';
  const grid = mk('div', 'grid', '', invBd), c = party[active];
  const cells = [];
  for (const id of ['hp', 'mp', 'bomb', 'charm']) cells.push({ use: id });
  for (const k of ['steel', 'guard', 'shard', 'crystal', 'awaken']) if (MATS[k] > 0) cells.push({ mat: k });
  for (const it of BAG) cells.push({ gear: it });
  for (let i = 0; i < 48; i++) {
    const e = cells[i];
    if (!e) { slotEl(grid, 'p').classList.add('empty'); continue; }
    if (e.gear) {
      const s = gslot(grid, e.gear, 'p'); bindTip(s, () => gearTip(e.gear, c) + '<div class="tb lp" style="border-top:none"><div class="ln gold">우클릭으로 착용</div></div>');
      s.oncontextmenu = ev => { ev.preventDefault(); equip(c, e.gear); hideTip(); renderWin('wInv'); if (document.getElementById('wChar').classList.contains('open')) renderWin('wChar'); };
    } else if (e.use) {
      const it = ITEMS[e.use], s = slotEl(grid, 'p'); s.img.src = it.icon; s.style.background = `radial-gradient(circle at 50% 35%,${GRADE_BG[it.grade]},#0c0d12)`; s.style.borderColor = GRADE[it.grade]; s.n.textContent = it.n;
      bindTip(s, () => itemTip(it, '<div class="ln gold">우클릭으로 사용</div>')); s.oncontextmenu = ev => { ev.preventDefault(); useItem(e.use); renderWin('wInv'); };
    } else {
      const s = slotEl(grid, 'p'); s.img.src = MAT_ICON[e.mat]; s.n.textContent = MATS[e.mat] >= 10000 ? Math.floor(MATS[e.mat] / 1000) + 'k' : MATS[e.mat];
      bindTip(s, () => `<div class="th lp"><div class="tn" style="color:${MATN[e.mat][1]}">${MATN[e.mat][0]}</div><div class="dim">재료 · 보유 ${fmt(MATS[e.mat])}</div></div>`);
    }
  }
  mk('div', 'money', `<span class="dim">가방 ${BAG.length} / 40</span><span><span style="color:#ffd27a">●</span> ${fmt(MATS.gold)}</span>`, invBd);
}

// ---- 대장장이: 강화 · 숨은 옵션 · 분해 · 상점 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wSmith{left:calc(50% - 330px);top:90px;width:660px}
#wSmith .tabs{display:flex;gap:4px;margin-bottom:10px}#wSmith .tabs div{padding:6px 14px;cursor:pointer;border:1px solid #3a3428;background:#14141a;font-size:12px;color:#a89a7c}#wSmith .tabs div.on{color:#ffe08a;border-color:#c8a050;background:linear-gradient(180deg,#3a3020,#18140c)}
#wSmith .cols{display:grid;grid-template-columns:250px 1fr;gap:12px}
#wSmith .list{max-height:360px;overflow:auto;padding-right:4px}#wSmith .list .eq{cursor:pointer}#wSmith .list .eq.sel{border-color:#c8a050;background:rgba(232,200,120,.1)}
#wSmith .pan{padding:10px;border:1px solid #2e2b24;background:rgba(0,0,0,.25);font-size:12px;line-height:1.7;min-height:300px}
#wSmith .big{font-size:22px;color:#ffe08a;margin:4px 0}#wSmith .cost{margin-top:8px;padding-top:8px;border-top:1px solid #2e2b24}
#wSmith button{font:inherit;font-size:12px;padding:8px 18px;margin-top:10px;cursor:pointer;border-radius:3px;border:1px solid #000;background:linear-gradient(180deg,#e8c070,#9a6a24);color:#1a1208}#wSmith button[disabled]{filter:grayscale(1) brightness(.5);cursor:default}
#wSmith .ln2{display:flex;align-items:center;gap:8px;padding:4px 6px;margin:3px 0;background:rgba(255,255,255,.03);border-left:2px solid #444}#wSmith .ln2 .lk{margin-left:auto;cursor:pointer;color:#888;font-size:11px}#wSmith .ln2 .lk.on{color:#ffe08a}
#wSmith .shop{display:grid;grid-template-columns:1fr 1fr;gap:8px}#wSmith .shop>div{display:flex;gap:8px;align-items:center;padding:6px;border:1px solid #2e2b24}#wSmith .shop img{width:36px;height:36px;image-rendering:pixelated}#wSmith .shop button{margin:0 0 0 auto;padding:5px 10px}
` }));
const smithBd = makeWin('wSmith', '야영지 대장장이 브론');
const SM = { tab: '강화', sel: null, lock: -1 };
const ENH_P = n => n < 7 ? 1 : n < 10 ? [0.8, 0.7, 0.6][n - 7] : n < 15 ? 0.5 - (n - 10) * 0.05 : 0.2 - (n - 15) * 0.0375;
function enhCost(it) { const n = it.enh, w = it.slot === '무기'; return { gold: 300 + n * n * 60, mat: w ? 'steel' : 'guard', m: 8 + n * 4, shard: 4 + n * 2, crystal: n >= 10 ? 1 + ((n - 10) >> 1) : 0 }; }
const rollCost = it => (GRADES.indexOf(it.grade) >= 3 ? 4 : 2) * (SM.lock >= 0 ? 3 : 1);
function allGear() { const c = party[active], out = []; for (const sl of SLOTS) if (c.eq[sl]) out.push([c.eq[sl], '착용']); for (const it of BAG) out.push([it, '가방']); return out; }
function renderSmith() {
  smithBd.innerHTML = '';
  const tabs = mk('div', 'tabs', '', smithBd);
  ['강화', '숨은 옵션', '분해', '상점', '제작', '교환'].forEach(t => { const d = mk('div', t === SM.tab ? 'on' : '', t, tabs); d.onclick = () => { SM.tab = t; SM.lock = -1; renderSmith(); }; });
  mk('div', 'dim', `<span style="color:#ffd27a">●</span> ${fmt(MATS.gold)} · ${['steel', 'guard', 'shard', 'crystal', 'awaken'].map(k => `<span style="color:${MATN[k][1]}">${MATN[k][0]}</span> ${fmt(MATS[k])}`).join(' · ')}`, smithBd).style.cssText = 'font-size:11px;margin-bottom:8px';
  if ((SM.tab === '제작' || SM.tab === '교환') && typeof renderCraft === 'function') return renderCraft();
  if (SM.tab === '상점') {
    const sh = mk('div', 'shop', '', smithBd);
    [['hp', 50], ['mp', 50], ['bomb', 200], ['charm', 500]].forEach(([id, price]) => {
      const it = ITEMS[id], d = mk('div', '', `<img src="${it.icon}"><div><div style="color:${GRADE[it.grade]}">${it.name}</div><div class="dim">보유 ${it.n} · ${price} 골드</div></div>`, sh), b = mk('button', '', '구매', d);
      b.disabled = MATS.gold < price; b.onclick = () => { if (MATS.gold < price) return; MATS.gold -= price; it.n++; saveGame(); renderSmith(); };
    });
    return;
  }
  const cols = mk('div', 'cols', '', smithBd), list = mk('div', 'list', '', cols), pan = mk('div', 'pan', '', cols);
  const items = allGear().filter(([it, w]) => SM.tab === '분해' ? w === '가방' : SM.tab === '숨은 옵션' ? it.lines.length > 0 : true);
  if (!items.find(([it]) => it === SM.sel)) SM.sel = items[0] ? items[0][0] : null;
  for (const [it, w] of items) { const r = mk('div', 'eq p' + (it === SM.sel ? ' sel' : ''), '', list); gslot(r, it); mk('div', 'nm2', `<div class="dim">${w} · ${it.slot}</div><div style="color:${GRADE[it.grade]}">${it.enh ? '+' + it.enh + ' ' : ''}${it.name}</div>`, r); r.onclick = () => { SM.sel = it; SM.lock = -1; renderSmith(); }; bindTip(r, () => gearTip(it)); }
  const it = SM.sel; if (!it) { pan.innerHTML = '<div class="dim">대상 장비가 없습니다.</div>'; return; }
  if (SM.tab === '강화') {
    const p = Math.min(1, ENH_P(it.enh) + (it.enh >= 10 ? it.fails * 0.05 : 0)), pity = it.enh >= 15 ? Math.min(100, it.fails * 25) : 0, C = enhCost(it);
    const ok = it.enh < 20 && MATS.gold >= C.gold && MATS[C.mat] >= C.m && MATS.shard >= C.shard && MATS.crystal >= C.crystal;
    pan.innerHTML = `<div style="color:${GRADE[it.grade]}">${it.name}</div><div class="big">+${it.enh} → +${Math.min(20, it.enh + 1)}</div>
      <div>성공 확률 <span class="gold">${(p * 100).toFixed(1)}%</span>${it.enh >= 15 ? ` · 천장 ${pity}%` : ''}</div>
      <div class="dim">${it.enh < 7 ? '실패 없음' : it.enh < 10 ? '실패하면 단계 유지' : '실패하면 1단계 하락 · 실패할 때마다 다음 확률 +5%'}${it.enh >= 15 ? ' · 실패 4번이면 확정 성공' : ''}. 장비가 부서지지는 않습니다.</div>
      <div>주 능력치 ×${enhMul(it.enh).toFixed(2)} → ×${enhMul(Math.min(20, it.enh + 1)).toFixed(2)}</div>
      <div class="cost">골드 ${fmt(C.gold)} · ${MATN[C.mat][0]} ${C.m} · 황혼의 파편 ${C.shard}${C.crystal ? ` · 돌파의 결정 ${C.crystal}` : ''}</div>`;
    const b = mk('button', '', it.enh >= 20 ? '최대 강화' : '강화', pan); b.disabled = !ok;
    b.onclick = () => {
      if (!ok) return; MATS.gold -= C.gold; MATS[C.mat] -= C.m; MATS.shard -= C.shard; MATS.crystal -= C.crystal;
      const win = (it.enh >= 15 && it.fails >= 4) || Math.random() < p, A = party[active];
      if (win) { it.enh++; it.fails = 0; toast('강화 성공', `+${it.enh} ${it.name}`, '#ffe08a'); embers(A.x, 1.5, A.z, 40, [2.8, 2.2, 0.8], 6); shockwave(A.x, A.z, 2.5, [2.6, 2.0, 0.8], 0.4); }
      else { it.fails++; if (it.enh >= 10) it.enh--; toast('강화 실패', it.enh >= 10 ? `+${it.enh}(으)로 내려갔습니다` : '단계는 유지됩니다', '#ff8a6a'); }
      party.forEach(recalc); saveGame(); renderSmith();
    };
  } else if (SM.tab === '숨은 옵션') {
    const cost = rollCost(it);
    pan.innerHTML = `<div style="color:${GRADE[it.grade]}">${it.name}</div><div class="dim" style="margin-bottom:4px">각성석을 내고 줄을 다시 돌립니다. 1줄을 잠글 수 있고, 잠그면 비용이 3배입니다.</div>`;
    it.lines.forEach((L, i) => { const d = mk('div', 'ln2', `<span style="color:${TIERC[L.t]}">[${TIER[L.t]}]</span> ${LINES[L.k][0].replace('{}', LINES[L.k][1][L.t])}<span class="lk${SM.lock === i ? ' on' : ''}">${SM.lock === i ? '🔒 잠금' : '잠금'}</span>`, pan); d.style.borderLeftColor = TIERC[L.t]; d.querySelector('.lk').onclick = () => { SM.lock = SM.lock === i ? -1 : i; renderSmith(); }; });
    mk('div', 'dim', `승급 천장: 희귀→영웅 ${it.pity[0]}/${UP_PITY[0]} · 영웅→전설 ${it.pity[1]}/${UP_PITY[1]} · 전설→태초 ${it.pity[2]}/${UP_PITY[2]}`, pan).style.marginTop = '6px';
    mk('div', 'cost', `각성석 ${cost}개 (보유 ${MATS.awaken})`, pan);
    const b = mk('button', '', '돌리기', pan); b.disabled = MATS.awaken < cost;
    b.onclick = () => {
      if (MATS.awaken < cost) return; MATS.awaken -= cost;
      const capT = GRADES.indexOf(it.grade) >= 6 ? 3 : GRADES.indexOf(it.grade) >= 4 ? 2 : 1;
      it.lines = it.lines.map((L, i) => {
        if (i === SM.lock) return L;
        // 줄의 등급은 유지되고, 한 단계 위로 오를 확률이 있다 (천장 도달 시 확정)
        let t = Math.min(L.t, capT);
        if (t < capT) { it.pity[t]++; if (Math.random() < UP_P[t] || it.pity[t] >= UP_PITY[t]) { it.pity[t] = 0; t++; toast('숨은 옵션 승급!', `[${TIER[t]}] 등급 줄`, TIERC[t]); } }
        return { k: pick(LINE_KEYS), t };
      });
      party.forEach(recalc); saveGame(); renderSmith();
    };
  } else {
    const gi = GRADES.indexOf(it.grade), gain = { steel: it.slot === '무기' ? 10 + gi * 8 : 0, guard: it.slot !== '무기' ? 10 + gi * 8 : 0, shard: 5 + gi * 5, awaken: gi >= 3 ? gi - 1 : 0, gold: 100 * (gi + 1) };
    pan.innerHTML = `<div style="color:${GRADE[it.grade]}">${it.enh ? '+' + it.enh + ' ' : ''}${it.name}</div><div class="dim">필요 없는 장비를 재료로 바꿉니다.</div><div class="cost">얻는 것: ${Object.entries(gain).filter(([, v]) => v).map(([k, v]) => `${MATN[k][0]} ${v}`).join(' · ')}</div>`;
    const b = mk('button', '', '분해', pan);
    b.onclick = () => { for (const k in gain) MATS[k] += gain[k]; BAG.splice(BAG.indexOf(it), 1); SM.sel = null; toast('분해 완료', it.name, '#c8b8a0'); saveGame(); renderSmith(); };
  }
}

// 마을의 대장장이 (텐트 옆). 가까이 가면 창이 열린다
const smithTex = tex((() => { const g = new Pix(26, 40, S);
  g.rect(9, 30, 3, 9, '#2a1e16'); g.rect(14, 30, 3, 9, '#2a1e16'); g.rect(8, 38, 4, 2, '#1a120c'); g.rect(14, 38, 4, 2, '#1a120c');
  g.rect(6, 15, 14, 17, '#5a3a24'); g.rect(8, 17, 10, 15, '#7a4e2c'); g.rect(9, 20, 8, 12, '#3a2a1e'); g.rect(6, 15, 14, 2, '#8a6038');
  g.rect(3, 16, 3, 11, '#6a4428'); g.rect(20, 16, 3, 9, '#6a4428'); g.rect(3, 27, 3, 2, '#d8a880'); g.rect(21, 25, 2, 3, '#d8a880');
  g.rect(21, 10, 2, 16, '#6a5040'); g.rect(19, 8, 6, 4, '#8a8aa0'); g.rect(19, 8, 6, 1, '#c8c8d8');
  g.rect(9, 5, 8, 9, '#d8a880'); g.rect(8, 4, 10, 3, '#3a2a20'); g.rect(9, 11, 8, 5, '#a86a3a'); g.rect(10, 13, 6, 4, '#8a5028'); g.set(11, 8, '#1a1010'); g.set(15, 8, '#1a1010');
  return g.outline(OUT).canvas(); })());
const anvilTex = tex((() => { const g = new Pix(20, 12, S); g.rect(2, 2, 16, 3, '#5a5a6a'); g.rect(2, 2, 16, 1, '#9a9aaa'); g.rect(0, 2, 3, 2, '#5a5a6a'); g.rect(7, 5, 6, 3, '#3a3a48'); g.rect(4, 8, 12, 3, '#2a2a36'); return g.outline(OUT).canvas(); })());
const SMITH = { x: -2.2, z: -5.6 };
{ const n = addBB(new THREE.MeshLambertMaterial({ map: smithTex, alphaTest: 0.5, side: THREE.DoubleSide }), 26, 40, SMITH.x, SMITH.z, { s: 1.15 }); const a = addBB(new THREE.MeshLambertMaterial({ map: anvilTex, alphaTest: 0.5, side: THREE.DoubleSide }), 20, 12, SMITH.x + 1.3, SMITH.z + 0.2, { s: 1.1 }); const sh = contactShadow(0.7, 0.35); sh.position.set(SMITH.x, 0.015, SMITH.z);
  const po = { x: SMITH.x, z: SMITH.z, r: 0.5 }; obstacles.push(po); townObs.push(po); townObjs.push(n, a, sh); }
let smithArmed = true;
function updateGear(dt) {
  updateDrops(dt);
  if (AREA === 'town') {
    const A = party[active], d = Math.hypot(A.x - SMITH.x, A.z - SMITH.z);
    if (d < 1.9 && smithArmed && !A.down) { smithArmed = false; toggleWin('wSmith', true); }
    if (d > 2.3) smithArmed = true;
  }
  saveT -= dt; if (saveT <= 0) { saveT = 15; saveGame(); }
}

// ---- 저장 ----
let saveT = 15;
function saveGame() {
  try {
    localStorage.setItem('twilight.save', JSON.stringify({ v: 1, level: player.level, exp: player.exp, mats: MATS, bag: BAG, uidN, legendPity,
      eq: Object.fromEntries(party.map(c => [c.key, c.eq])), items: Object.fromEntries(Object.entries(ITEMS).map(([k, v]) => [k, v.n])), quests: QUESTS.map(q => q.cur), prog: PROG }));
  } catch (e) {}
}
(function loadGame() {
  let sv = null; try { sv = JSON.parse(localStorage.getItem('twilight.save') || 'null'); } catch (e) {}
  if (sv && sv.v === 1 && !location.search.includes('fresh')) {
    player.level = sv.level; player.exp = sv.exp; Object.assign(MATS, sv.mats); BAG.push(...sv.bag); uidN = sv.uidN || 1000; legendPity = sv.legendPity || 0;
    party.forEach(c => c.eq = sv.eq[c.key] || {}); for (const k in sv.items) if (ITEMS[k]) ITEMS[k].n = sv.items[k];
    (sv.quests || []).forEach((v, i) => { if (QUESTS[i]) QUESTS[i].cur = v; }); renderQuest();
    if (sv.prog) Object.assign(PROG.clears, sv.prog.clears);
  } else {
    // 처음 시작: 고급 · 희귀 기본 장비 한 벌
    Object.assign(MATS, { gold: 25000, steel: 120, guard: 160, shard: 80, crystal: 4, awaken: 12 });
    party.forEach(c => { for (const sl of SLOTS) { const base = sl.replace(/\d/, ''); const gq = +new URLSearchParams(location.search).get('gear'); c.eq[sl] = gq ? makeItem(base, '영웅', gq, c.key) : makeItem(base, sl === '무기' ? '희귀' : '고급', 1300, c.key); } });
    BAG.push(makeItem('반지', '영웅', 1310, 'berserker'), makeItem('무기', '희귀', 1310, 'berserker'));
  }
  party.forEach(c => { c.hp = 1; c.max = 1; recalc(c); c.hp = c.max; });
})();
