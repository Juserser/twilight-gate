'use strict';
// 제작 (기획서 9장 · 10장): 지역 정수 + 골드로 그 지역 장비를 만든다 (운이 없어도 바닥은 보장)
//  · 지역 정수: 그 지역 던전 몬스터가 떨군다 (일반 35% · 정예 2개 · 보스 6개, 난이도 보상 배율 적용)
//  · 제작: 원하는 부위를 고르면 영웅 장비 확정 (숨은 옵션 3줄), 5% 확률로 전설
//  · 교환: 레이드 증표로 원하는 부위의 문지기 세트 (전설)

const ESS = {
  1: ['시든 수액', '#a8d860', ['#3a5a1a', '#a8d860']], 2: ['검은 성수', '#7ab0ff', ['#1a2a5a', '#7ab0ff']], 3: ['붉은 사암 가루', '#e0a060', ['#6a3a1a', '#e0a060']],
  4: ['영원한 서리', '#bfefff', ['#2a4a6a', '#bfefff']], 5: ['용암 핵', '#ff7a30', ['#6a1a08', '#ff9a40']], 6: ['공허 조각', '#d070ff', ['#2a1040', '#d070ff']],
};
for (const r in ESS) { const k = 'ess' + r; if (MATS[k] == null) MATS[k] = 0; MATN[k] = [ESS[r][0], ESS[r][1]]; MAT_ICON[k] = iconURL('gem', ...ESS[r][2]); }
MATS.token = MATS.token || 0; MAT_ICON.token = iconURL('charm');

// ---- 정수 드랍 ----
const _dropLootC = dropLoot;
dropLoot = function (m) {
  _dropLootC(m);
  if (!DUN.on || !DUN.d || !ESS[DUN.d.region]) return;
  const D = m.def, n = D.boss ? 6 : D.elite ? 2 : Math.random() < 0.35 ? 1 : 0;
  if (n) dropItem(m.x, m.z, { mat: 'ess' + DUN.d.region, n: Math.max(1, Math.round(n * diffRew())) });
};
// 인벤토리에 정수 · 증표도 보이게
const _renderInv = renderInv;
renderInv = function () {
  _renderInv();
  const grid = invBd.querySelector('.grid'); if (!grid) return;
  const extra = Object.keys(MATS).filter(k => (k.startsWith('ess') || k === 'token') && MATS[k] > 0);
  const empties = [...grid.querySelectorAll('.slot.empty')];
  extra.forEach((k, i) => { const s = empties[i]; if (!s) return; s.classList.remove('empty'); s.innerHTML = '<img><span class="k"></span><div class="cd"></div><span class="ct"></span><span class="n"></span>'; s.querySelector('img').src = MAT_ICON[k]; s.querySelector('.n').textContent = MATS[k]; bindTip(s, () => `<div class="th lp"><div class="tn" style="color:${MATN[k][1]}">${MATN[k][0]}</div><div class="dim">재료 · 보유 ${fmt(MATS[k])}</div></div>`); });
};

// ---- 제작 · 교환 탭 ----
const CR = { region: 1, slot: '무기', tslot: '무기' };
const regionCleared = r => DUNGEONS.some(d => d.region === r && (PROG.clears[d.id] || PROG.clears[d.id + '@0'])) || location.search.includes('unlock');
const regionIlv = r => Math.max(...DUNGEONS.filter(d => d.region === r && d.tier < 2).map(d => d.ilv));
function craftCost(r, slot) { const w = slot === '무기'; return { ['ess' + r]: w ? 40 : 30, gold: 6000 * r, shard: 30 + r * 10, [w ? 'steel' : 'guard']: 30 + r * 8 }; }
const TOKEN_COST = sl => sl === '무기' ? 18 : 12;
function costHTML(cost) { return Object.entries(cost).map(([k, v]) => `<span style="color:${MATS[k] >= v ? '#c8e8a0' : '#ff7a7a'}">${MATN[k][0]} ${fmt(v)} <span class="dim">(${fmt(MATS[k] || 0)})</span></span>`).join(' · '); }
function renderCraft() {
  const bd = smithBd, cls = curCls();
  const pan = mk('div', 'pan', '', bd);
  if (SM.tab === '제작') {
    const chips = mk('div', 'crs', '', pan);
    REGIONS.filter(rg => ESS[rg.id]).forEach(rg => { const ok = regionCleared(rg.id), c = mk('span', 'cr' + (CR.region === rg.id ? ' on' : '') + (ok ? '' : ' lk'), `${ok ? '' : '🔒 '}${rg.name}`, chips); c.style.setProperty('--cc', ESS[rg.id][1]); if (ok) c.onclick = () => { CR.region = rg.id; renderSmith(); }; });
    if (!regionCleared(CR.region)) CR.region = 1;
    const r = CR.region, il = regionIlv(r);
    mk('div', 'dim', `${REGIONS.find(x => x.id === r).name} 장비를 만듭니다. 그 지역 던전을 한 번 이상 깨면 열립니다. 정수는 그 지역 몬스터가 떨굽니다.`, pan).style.cssText = 'font-size:11px;margin:6px 0';
    const sg = mk('div', 'crslots', '', pan);
    SLOTS.forEach(sl => { const b = sl.replace(/\d/, ''); if (sl.endsWith('2')) return; const d = mk('span', 'cs' + (CR.slot === b ? ' on' : ''), `<img src="${iconURL(PIECE[b], ...GICON['영웅'])}">${b === '무기' ? WNAME[cls] : b}`, sg); d.onclick = () => { CR.slot = b; renderSmith(); }; });
    const cost = craftCost(r, CR.slot), ok = Object.entries(cost).every(([k, v]) => MATS[k] >= v) && BAG.length < 40;
    mk('div', '', `<div style="color:${GRADE['영웅']};margin-top:8px">${REGION.prefix[r] ? REGION.prefix[r]['영웅'] : PREFIX['영웅']} ${CR.slot === '무기' ? WNAME[cls] : PNAME[CR.slot]}</div><div class="dim">영웅 확정 · 아이템 레벨 ${il + 30} · 숨은 옵션 3줄 · <span style="color:${GRADE['전설']}">5% 확률로 전설</span>${CR.slot === '무기' ? ` · ${CLSNAME[cls]} 전용` : ''}</div><div class="cost" style="margin-top:6px">${costHTML(cost)}</div>`, pan);
    const b = mk('button', '', BAG.length >= 40 ? '가방이 가득 찼습니다' : '제작', pan); b.disabled = !ok;
    b.onclick = () => {
      if (!ok) return; for (const k in cost) MATS[k] -= cost[k];
      const g = Math.random() < 0.05 ? '전설' : '영웅', it = makeItem(CR.slot, g, il, cls);
      it.name = `${(REGION.prefix[r] || PREFIX)[g]} ${CR.slot === '무기' ? WNAME[cls] : PNAME[CR.slot]}`; BAG.push(it);
      toast(g === '전설' ? '제작 대성공!' : '제작 완료', it.name, GRADE[g]); log(`[제작] ${it.name} (${g})`, '시스템');
      const A = party[active]; embers(A.x, 1.5, A.z, g === '전설' ? 60 : 30, g === '전설' ? [2.8, 1.8, 0.6] : [2, 1.2, 2.6], 6); saveGame(); renderSmith();
    };
  } else {
    mk('div', 'dim', `레이드 증표로 원하는 부위의 문지기 세트(전설)를 얻습니다. 증표는 레이드 관문 주간 보상으로 받습니다. 보유 증표 ${MATS.token || 0}개`, pan).style.cssText = 'font-size:11px;margin:6px 0';
    const sg = mk('div', 'crslots', '', pan);
    SET_SLOTS.forEach(b => { const d = mk('span', 'cs' + (CR.tslot === b ? ' on' : ''), `<img src="${iconURL(PIECE[b], ...GICON['전설'])}">${b === '무기' ? WNAME[cls] : b}`, sg); d.onclick = () => { CR.tslot = b; renderSmith(); }; });
    const need = TOKEN_COST(CR.tslot), ok = (MATS.token || 0) >= need && BAG.length < 40;
    mk('div', '', `<div style="color:${SETS.raid.col};margin-top:8px">문지기의 ${CR.tslot === '무기' ? WNAME[cls] : PNAME[CR.tslot]}</div><div class="dim">전설 · 아이템 레벨 1710 · 문지기 세트</div><div class="cost" style="margin-top:6px"><span style="color:${ok ? '#c8e8a0' : '#ff7a7a'}">레이드 증표 ${need} (${MATS.token || 0})</span></div>`, pan);
    const b = mk('button', '', '교환', pan); b.disabled = !ok;
    b.onclick = () => { if (!ok) return; MATS.token -= need; const it = makeItem(CR.tslot, '전설', 1700, cls); it.set = 'raid'; it.name = `문지기의 ${CR.tslot === '무기' ? WNAME[cls] : PNAME[CR.tslot]}`; BAG.push(it); toast('교환 완료', it.name, SETS.raid.col); party.forEach(recalc); saveGame(); renderSmith(); };
  }
}
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wSmith .crs{display:flex;flex-wrap:wrap;gap:4px}#wSmith .cr{font-size:11px;padding:3px 9px;border:1px solid #3a3428;background:#14141a;color:var(--cc);cursor:pointer;border-radius:2px}#wSmith .cr.on{border-color:var(--cc);box-shadow:0 0 6px var(--cc)}#wSmith .cr.lk{opacity:.4;cursor:default}
#wSmith .crslots{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}#wSmith .cs{display:flex;align-items:center;gap:6px;padding:4px 6px;border:1px solid #2e2b24;background:rgba(0,0,0,.25);font-size:11px;cursor:pointer}#wSmith .cs.on{border-color:#ffe08a;background:rgba(232,200,120,.1)}#wSmith .cs img{width:26px;height:26px;image-rendering:pixelated}` }));
// 확인용: ?ctest=1 재료를 주고 제작 · 교환 버튼을 눌러 본다
if (location.search.includes('ctest')) { MATS.ess1 = 200; MATS.token = 40; MATS.gold = 1e6; toggleWin('wSmith', true); SM.tab = '제작'; renderSmith(); [...document.querySelectorAll('#wSmith button')].pop().click(); SM.tab = '교환'; renderSmith(); [...document.querySelectorAll('#wSmith button')].pop().click(); console.log('CTEST bag=' + BAG.map(i => i.grade + ':' + i.name + (i.set ? '[' + i.set + ']' : '')).join(', ')); SM.tab = '제작'; renderSmith(); }
if (location.search.includes('cdrop')) setTimeout(() => console.log('CDROP ess2=' + MATS.ess2 + ' drops=' + drops.length), 1500);
