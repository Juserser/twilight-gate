'use strict';
// 난이도 단계 (기획서 7장): 같은 던전을 더 어렵게 — 보통 · 숙련 · 전문가 · 악몽
//  그 던전을 한 단계 아래에서 깨면 다음 단계가 열린다. 레이드에는 없다.

const DIFF = [
  { name: '보통', col: '#c8c8c8', ilv: 0, hp: 1, dmg: 1, rew: 1, hero: 0, leg: 0, relic: 0 },
  { name: '숙련', col: '#7ad0ff', ilv: 40, hp: 1.8, dmg: 1.4, rew: 1.5, hero: 0.25, leg: 0.02, relic: 0 },
  { name: '전문가', col: '#ffb040', ilv: 80, hp: 3, dmg: 2, rew: 2, hero: 0.5, leg: 0.08, relic: 0.004 },
  { name: '악몽', col: '#ff4a6a', ilv: 120, hp: 5, dmg: 2.8, rew: 3, hero: 1, leg: 0.2, relic: 0.04, potLimit: 3 },
];
const DIFFSEL = {};
const diffCleared = (id, k) => k === 0 ? !!PROG.clears[id] || !!PROG.clears[id + '@0'] : !!PROG.clears[id + '@' + k];
const diffOpen = (id, k) => k === 0 || diffCleared(id, k - 1) || location.search.includes('unlock');
// 입장할 때 쓰는 던전: 고른 난이도만큼 체력 · 피해 · 아이템 레벨 · 보상을 바꾼 사본
function diffDun(di) {
  const base = DUNGEONS[di], k = base.raid ? 0 : (DIFFSEL[base.id] || 0); if (!k) return Object.assign(Object.create(base), { diff: 0 });
  const D = DIFF[k];
  return Object.assign(Object.create(base), { diff: k, name: `${base.name} · ${D.name}`, hpMul: base.hpMul * D.hp, dmgMul: base.dmgMul * D.dmg, ilv: base.ilv + D.ilv, rew: D.rew, potLimit: D.potLimit });
}
// 보스 상자 확률
function diffChest(P) {
  const D = DIFF[(DUN.d && DUN.d.diff) || 0];
  return { hero: Math.min(1, P.hero + D.hero), leg: P.leg + D.leg, relic: P.relic + D.relic };
}
const diffRew = () => (DUN.on && DUN.d && DUN.d.rew) || 1;

// ---- 던전 선택 창: 던전마다 난이도 칩 ----
const _renderDunWin = renderDunWin;
renderDunWin = function () {
  _renderDunWin();
  const il = (party[active].gs || calcStats(party[active])).ilv;
  dunBd.querySelectorAll('.dn').forEach(row => {
    const b = row.querySelector('.go'); if (!b) return;
    const d = DUNGEONS[+b.dataset.i]; if (d.raid) return;
    const sel = DIFFSEL[d.id] || 0, bar = mk('div', 'dfs', '', row.querySelector('div'));
    DIFF.forEach((D, k) => {
      const open = diffOpen(d.id, k), need = d.ilv - 20 + D.ilv;
      const c = mk('span', 'df' + (k === sel ? ' on' : '') + (open ? '' : ' lk'), `${open ? '' : '🔒 '}${D.name}${diffCleared(d.id, k) ? ' ✓' : ''}`, bar);
      c.style.setProperty('--dc', D.col); c.title = open ? `권장 아이템 레벨 ${need} · 체력 ×${D.hp} · 피해 ×${D.dmg} · 보상 ×${D.rew}${D.potLimit ? ` · 생명의 물약 ${D.potLimit}개 제한` : ''}` : `${DIFF[k - 1].name} 클리어 필요`;
      if (open) c.onclick = () => { DIFFSEL[d.id] = k; renderDunWin(); };
    });
    const D = DIFF[sel], need = d.ilv - 20 + D.ilv;
    mk('span', 'dfi', `권장 ${need} · 내 ${il.toFixed(0)}`, bar).style.color = il >= need ? '#9aff7a' : il >= need - 30 ? '#ffd060' : '#ff7a7a';
    if (sel) b.textContent = `입장 (${D.name})`;
  });
};
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#wDun{left:calc(50% - 370px);width:740px}
#wDun .tabs2 div{padding:6px 9px;white-space:nowrap;font-size:11px}
#wDun .dfs{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:6px}
#wDun .df{font-size:11px;padding:2px 8px;border:1px solid #3a3428;background:#14141a;color:var(--dc);cursor:pointer;border-radius:2px}
#wDun .df.on{border-color:var(--dc);background:rgba(255,255,255,.08);box-shadow:0 0 6px var(--dc)}
#wDun .df.lk{opacity:.4;cursor:default}
#wDun .dfi{font-size:10px;margin-left:6px}` }));

// ---- 악몽: 회복 제한 ----
const _useItem = useItem;
useItem = function (id) {
  if (id === 'hp' && DUN.on && DUN.d && DUN.d.potLimit) {
    DUN.pots = DUN.pots || 0;
    if (DUN.pots >= DUN.d.potLimit) { floaters.push({ x: party[active].x, y: 3, z: party[active].z, t: 0, text: '회복 제한 (악몽)', crit: false, vx: 0, color: '#ff6a6a' }); return; }
    const before = ITEMS.hp.n; _useItem(id); if (ITEMS.hp.n < before) DUN.pots++; return;
  }
  return _useItem(id);
};
