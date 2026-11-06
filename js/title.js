'use strict';
// 타이틀 화면 · 저장 슬롯 3개 · 새로 시작 (이름 · 처음 조작할 직업)
//  게임은 고정 저장 키(twilight.save · .emb · .tri · .lamp)를 쓰고, 슬롯마다 그 묶음을 따로 보관한다.
//  슬롯을 고르면 그 묶음을 고정 키로 옮겨 놓고 다시 읽는다. 나중에 클라우드 저장도 이 묶음을 그대로 올리면 된다.

const SLOT_KEYS = ['twilight.save', 'twilight.emb', 'twilight.tri', 'twilight.lamp'];
const SLOT_N = 3;
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: k => { try { localStorage.removeItem(k); } catch (e) {} } };
const slotRec = n => { try { return JSON.parse(ls.get('twilight.s' + n) || 'null'); } catch (e) { return null; } };
const curSlot = () => +(ls.get('twilight.slot') || 0);
function syncSlot() {
  const n = curSlot(); if (!n || TITLE.open) return;
  const rec = slotRec(n) || {}, A = party[active];
  rec.data = Object.fromEntries(SLOT_KEYS.map(k => [k, ls.get(k)]));
  Object.assign(rec, { name: player.name, cls: A.key, level: player.level, ilv: Math.round((A.gs || calcStats(A)).ilv), at: Date.now(), play: (rec.play || 0) + (performance.now() - (syncSlot.last || performance.now())) / 1000 });
  syncSlot.last = performance.now(); ls.set('twilight.s' + n, JSON.stringify(rec));
}
// 예전 저장(슬롯 이전)은 슬롯 1로 옮긴다
if (!slotRec(1) && ls.get('twilight.save')) { ls.set('twilight.s1', JSON.stringify({ name: player.name, cls: 'berserker', level: player.level, ilv: 0, at: Date.now(), data: Object.fromEntries(SLOT_KEYS.map(k => [k, ls.get(k)])) })); ls.set('twilight.slot', '1'); }

const TITLE = { open: false, t: 0 };
const skipTitle = location.search.length > 1 || sessionStorage.getItem('twilight.play');
// 게임 중: 슬롯 프로필(이름 · 직업)을 적용하고 주기적으로 슬롯에 저장
if (sessionStorage.getItem('twilight.play')) {
  const rec = slotRec(curSlot());
  if (rec) { if (rec.name) player.name = rec.name; const ci = party.findIndex(c => c.key === rec.cls); if (ci >= 0) { active = ci; camTarget.set(party[ci].x, 0, party[ci].z); } }
  syncSlot.last = performance.now(); setInterval(() => syncSlot(), 5000); addEventListener('beforeunload', () => syncSlot());
}
function startSlot(n, fresh, prof) {
  if (fresh) { for (const k of SLOT_KEYS) ls.del(k); ls.set('twilight.s' + n, JSON.stringify({ name: prof.name, cls: prof.cls, level: 52, ilv: 1310, at: Date.now(), play: 0, data: {} })); }
  else { const rec = slotRec(n); for (const k of SLOT_KEYS) { const v = rec && rec.data && rec.data[k]; if (v != null) ls.set(k, v); else ls.del(k); } }
  ls.set('twilight.slot', String(n)); sessionStorage.setItem('twilight.play', '1');
  TITLE.leaving = true; document.getElementById('title').classList.add('out'); setTimeout(() => location.reload(), 450);
}
function toTitle() { syncSlot(); sessionStorage.removeItem('twilight.play'); location.reload(); }

// ---- 화면 ----
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#title{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Galmuri11,sans-serif;color:#e8e0d0;
  background:radial-gradient(ellipse at 50% 40%,rgba(10,6,20,0) 30%,rgba(6,3,12,.75) 80%),linear-gradient(180deg,rgba(10,6,20,.35),rgba(6,3,12,.85));transition:opacity .45s}
#title.out{opacity:0;pointer-events:none}
#title .logo{font-size:64px;letter-spacing:10px;background:linear-gradient(180deg,#fff4d0,#f0b860 45%,#a8601a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,170,80,.55)) drop-shadow(0 3px 0 #2a1408)}
#title .sub{font-size:13px;letter-spacing:8px;color:#c8a878;margin:4px 0 36px;opacity:.85}
#title .slots{display:flex;gap:14px}
#title .tslot{width:230px;padding:14px 16px;background:linear-gradient(180deg,rgba(40,30,22,.92),rgba(14,10,8,.95));border:1px solid #6a5438;box-shadow:0 0 0 1px #000,inset 0 1px 0 rgba(255,220,160,.2);cursor:pointer;transition:transform .15s,border-color .15s}
#title .tslot:hover{transform:translateY(-3px);border-color:#e8c070;box-shadow:0 0 18px rgba(232,192,112,.35),0 0 0 1px #000}
#title .tslot .n{font-size:11px;color:#a89070}#title .tslot .nm{font-size:18px;color:#ffe0a0;margin:6px 0 2px}#title .tslot .d{font-size:11px;color:#b8a888;line-height:1.7}
#title .tslot .e{font-size:13px;color:#8a7a60;margin:18px 0}
#title .tslot .x{float:right;font-size:11px;color:#8a6a5a;padding:0 4px}#title .tslot .x:hover{color:#ff8a6a}
#title .new{display:none;flex-direction:column;align-items:center;gap:12px;padding:20px 26px;background:linear-gradient(180deg,rgba(40,30,22,.95),rgba(14,10,8,.97));border:1px solid #8a6a3a}
#title .new.on{display:flex}#title .new input{font:inherit;font-size:16px;padding:8px 12px;width:260px;background:#0e0c0a;border:1px solid #6a5438;color:#ffe0a0;text-align:center}
#title .cls{display:flex;gap:10px}#title .cls div{width:110px;padding:10px 6px;text-align:center;border:1px solid #4a3a28;background:#14100c;cursor:pointer;font-size:12px}#title .cls div.on{border-color:#ffe08a;box-shadow:0 0 10px rgba(255,224,138,.4)}#title .cls img{width:100px;height:100px;object-fit:cover;object-position:50% 20%;image-rendering:pixelated;display:block;margin:0 auto 4px}
#title button{font:inherit;font-size:13px;padding:9px 22px;cursor:pointer;border:1px solid #000;border-radius:3px;background:linear-gradient(180deg,#e8c070,#9a6a24);color:#1a1208}#title button.b2{background:#16161c;border-color:#4a4030;color:#d8d0c0}
#title .foot{position:absolute;bottom:18px;font-size:11px;color:#7a6a58}` }));
const titleEl = mk('div', '', '', document.body); titleEl.id = 'title';
const fmtT = s => { s = Math.floor(s || 0); return s < 3600 ? `${Math.floor(s / 60)}분` : `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`; };
function renderTitle() {
  titleEl.innerHTML = `<div class="logo">황혼의 문</div><div class="sub">TWILIGHT GATE</div><div class="slots"></div>
    <div class="new"><div style="color:#ffe0a0">새로 시작 · 슬롯 <span class="sn"></span></div><input maxlength="10" placeholder="이름을 지어 주세요"><div class="cls"></div><div style="display:flex;gap:8px"><button class="b2" data-a="back">돌아가기</button><button data-a="go">시작</button></div></div>
    <div class="foot">진행은 이 브라우저에 슬롯별로 저장됩니다 · 클릭으로 시작</div>`;
  const box = titleEl.querySelector('.slots');
  for (let n = 1; n <= SLOT_N; n++) {
    const r = slotRec(n), d = mk('div', 'tslot', '', box);
    if (r) { d.innerHTML = `<span class="x" title="슬롯 비우기">✕</span><div class="n">슬롯 ${n}</div><div class="nm">${r.name || '이름 없음'}</div><div class="d">Lv.${r.level} · ${CLSNAME[r.cls] || ''}<br>아이템 레벨 ${r.ilv || '-'}<br>플레이 ${fmtT(r.play)} · ${new Date(r.at).toLocaleDateString('ko-KR')}</div>`;
      d.onclick = e => { if (e.target.classList.contains('x')) { if (confirm(`슬롯 ${n}을(를) 비울까요? 되돌릴 수 없습니다.`)) { ls.del('twilight.s' + n); if (typeof cloudDelete === 'function') cloudDelete(n); renderTitle(); } return; } startSlot(n, false); }; }
    else { d.innerHTML = `<div class="n">슬롯 ${n}</div><div class="e">+ 새로 시작</div>`; d.onclick = () => openNew(n); }
  }
}
function openNew(n) {
  const nw = titleEl.querySelector('.new'), cls = nw.querySelector('.cls'); titleEl.querySelector('.slots').style.display = 'none'; nw.classList.add('on'); nw.querySelector('.sn').textContent = n;
  let pick = 'berserker'; cls.innerHTML = '';
  for (const k of ['berserker', 'hawk', 'assassin']) { const c = document.createElement('canvas'); c.width = HW * S; c.height = HH * S; c.getContext('2d').drawImage(HERO_FRAMES[k].idle[0].c, 0, 0); const d = mk('div', k === pick ? 'on' : '', `<img src="${c.toDataURL()}">${CLSNAME[k]}`, cls); d.onclick = () => { pick = k; [...cls.children].forEach(x => x.classList.toggle('on', x === d)); }; }
  const inp = nw.querySelector('input'); inp.value = ''; setTimeout(() => inp.focus(), 50);
  nw.querySelector('[data-a=back]').onclick = () => renderTitle();
  const go = () => { const name = inp.value.trim() || '이름 없는 문지기'; startSlot(n, true, { name, cls: pick }); };
  nw.querySelector('[data-a=go]').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); e.stopPropagation(); };
}
if (!skipTitle) {
  TITLE.open = true; uiRoot.style.display = 'none'; renderTitle();
  // 타이틀 동안 키 입력을 막고 카메라가 야영지를 천천히 돈다
  addEventListener('keydown', e => { if (TITLE.open && e.target.tagName !== 'INPUT') e.stopImmediatePropagation(); }, true);
  const spin = () => { if (!TITLE.open) return; camYaw += 0.0012; requestAnimationFrame(spin); }; spin();
} else titleEl.remove();
// 설정 창에 '타이틀로' 버튼
const _renderSet = renderSet;
renderSet = function () { _renderSet(); if (!sessionStorage.getItem('twilight.play')) return; const b = mk('button', 'b2', '타이틀로', setBd.querySelector('.sbtn')); setBd.querySelector('.sbtn').prepend(b); b.onclick = () => toTitle(); };
if (TITLE.open && location.hash === '#new') openNew(1);
