'use strict';
// 게임 UI: 콘솔 · 창 · 툴팁 · 채팅 · 퀘스트

// ===================================================================
// 게임 UI (로스트아크 참고)
//  하단: 버프 · 광폭화 게이지(아이덴티티) · 체력 · 스킬 8칸 · 배틀 아이템 4칸 · 마나 · 경험치
//  상단: 보스 체력바(여러 줄) + 무력화 게이지 / 오른쪽: 미니맵 · 퀘스트 / 왼쪽: 파티 · 채팅 / 오른쪽 아래: 메뉴
//  창: 캐릭터(P) · 인벤토리(I) · 스킬(K)
// ===================================================================
const GRADE = { 일반: '#c8c8c8', 고급: '#8dd43d', 희귀: '#3d9bd4', 영웅: '#b05ae0', 전설: '#f0a030', 유물: '#f06a2a', 고대: '#e8d8a8' };
const GRADE_BG = { 일반: '#2a2a2e', 고급: '#1e3414', 희귀: '#132a3e', 영웅: '#2c1640', 전설: '#3e2a0a', 유물: '#3e1a0a', 고대: '#3a3426' };
const uiRoot = document.getElementById('ui');
const mk = (tag, cls, html, par) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (par) par.appendChild(e); return e; };
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const MANA = { Q: 20, E: 30, R: 40, F: 45, Z: 60, X: 35, C: 70, V: 120, G: 0 };
const player = { name: '붉은갈기', level: 52, exp: 0.42 };
let uiTyping = false;

// ---- 아이템 아이콘 (도트) ----
function itemIcon(kind, a = '#9aa4b4', b = '#e8eef8') {
  const g = new Pix(16, 16, 2);
  eachPx(g, 0, 0, 16, 16, (px, py, X, Y) => {
    const dx = X - 8, dy = Y - 8;
    let c = null;
    if (kind === 'potion') {
      if (Y > 2 && Y < 4.6 && Math.abs(dx) < 1.7) c = '#8a6a4a';
      else if (Y >= 4.6 && Y < 7 && Math.abs(dx) < 1.3) c = '#b8c4d4';
      const br = Math.hypot(dx, (Y - 10.5) * 1.05);
      if (br < 4.9) c = Y < 8.6 ? '#b8c4d4' : br > 4 ? a : (dx < -1.4 ? b : a);
      if (br < 4.9 && dx < -2 && Y > 8.2 && Y < 10.4) c = '#ffffff';
    } else if (kind === 'bomb') {
      const r = Math.hypot(dx, Y - 9.5);
      if (r < 5) c = dx + (Y - 9.5) < -3.5 ? '#6a6a7a' : r > 4.2 ? '#14141a' : '#2c2c36';
      if (Math.abs((X - 9.5) - (5 - Y) * 0.8) < 0.7 && Y > 2 && Y < 5) c = '#8a6a4a';
      if (Math.hypot(X - 11.6, Y - 2) < 1.4) c = Math.hypot(X - 11.6, Y - 2) < 0.7 ? '#ffffff' : '#ffb030';
    } else if (kind === 'charm') {
      if (X > 4 && X < 12 && Y > 1 && Y < 15) c = (X < 5 || X > 11 || Y < 2 || Y > 14) ? '#b89048' : '#ecd89a';
      if (X > 4 && X < 12 && Y > 1 && Y < 15) {
        if (Math.abs(dx) < 0.6 && Y > 4 && Y < 13) c = '#c02020';
        if (Math.abs(Math.hypot(dx, Y - 6) - 2) < 0.55) c = '#c02020';
        if (Math.abs(Y - 10) < 0.5 && Math.abs(dx) < 2.5) c = '#c02020';
      }
    } else if (kind === 'ore') {
      for (const [cx, cy, w, hh] of [[5.5, 10, 2.6, 5], [9.5, 8.5, 3, 6.5], [12, 11, 2, 3.6]]) {
        const v = Math.abs(X - cx) / w + Math.abs(Y - cy) / hh;
        if (v < 1) c = X < cx ? b : a;
      }
      if (Y > 13 && X > 3 && X < 14) c = '#3a3430';
    } else if (kind === 'gem') {
      const v = Math.abs(dx) / 5.5 + Math.abs(dy) / 6.5;
      if (v < 1) c = dy < -1 ? b : (dx < 0 ? a : '#8a6010');
      if (v < 0.3 && dy < 0) c = '#ffffff';
    } else if (kind === 'shard') {
      for (const [cx, cy, s] of [[6, 7, 3], [10, 10, 3.5], [7, 12, 2]]) if (Math.abs(X - cx) + Math.abs(Y - cy) * 0.6 < s && Y > cy - s * 1.4) c = X < cx ? b : a;
    } else if (kind === 'helmet') {
      if (Y < 10 && Math.hypot(dx, Y - 9) < 6) c = dx < -2 ? b : a;
      if (Y >= 9 && Y < 14 && Math.abs(dx) < 5.5 - (Y - 9) * 0.4) c = a;
      if (Y >= 10 && Y < 11 && Math.abs(dx) < 3.5) c = '#0c0c10';
      if (Math.abs(dx) < 0.6 && Y > 3 && Y < 9) c = '#c83030';
    } else if (kind === 'shoulder') {
      for (const s of [-1, 1]) { const r = Math.hypot(X - (8 + s * 3.6), (Y - 9) * 1.3); if (r < 3.6 && Y < 10.5) c = r > 3 ? '#c8a050' : (X < 8 + s * 3.6 ? b : a); }
    } else if (kind === 'chest') {
      if (Y > 2 && Y < 14 && Math.abs(dx) < 6 - Math.max(0, Y - 9) * 0.5) c = Math.abs(dx) < 1.5 ? '#9a2a2a' : dx < -3 ? b : a;
      if (Y > 2 && Y < 4 && Math.abs(dx) < 3) c = null;
    } else if (kind === 'pants') {
      if (Y > 2 && Y < 5 && Math.abs(dx) < 5) c = '#5a3e26';
      if (Y >= 5 && Y < 15 && Math.abs(Math.abs(dx) - 2.6) < 2.1) c = Math.abs(dx) > 3 ? a : b;
    } else if (kind === 'gloves') {
      if (Y > 3 && Y < 14 && X > 4 && X < 12) c = Y < 6 ? '#c8a050' : X < 6 ? b : a;
      if (Y > 8 && Y < 12 && X >= 12 && X < 14) c = a;
      if (Y > 11 && Y < 12.5 && X > 4 && X < 12) c = '#14141a';
    } else if (kind === 'weapon') {
      const u = (X + Y) / 2, v = (X - Y);
      if (Math.abs(v) < 1.6 && u < 12.5 && u > 4) c = Math.abs(v) < 0.6 ? '#ffffff' : a;
      if (Math.abs(u - 4.2) < 0.7 && Math.abs(v) < 4) c = '#c8a050';
      if (u < 4 && u > 1.5 && Math.abs(v) < 0.8) c = '#6a3a2a';
    } else if (kind === 'necklace') {
      if (Math.abs(Math.hypot(dx, Y - 4) - 6) < 0.6 && Y > 4) c = '#d8b860';
      if (Math.abs(dx) / 2.5 + Math.abs(Y - 11.5) / 3 < 1) c = Y < 11 ? b : a;
    } else if (kind === 'earring') {
      if (Math.abs(Math.hypot(X - 8, Y - 4) - 2) < 0.5 && X < 9) c = '#d8b860';
      if (Math.abs(dx) / 2 + Math.abs(Y - 11) / 3.6 < 1) c = Y < 10.5 ? b : a;
      if (Math.abs(dx) < 0.5 && Y > 6 && Y < 8) c = '#d8b860';
    } else if (kind === 'ring') {
      const r = Math.hypot(dx, Y - 9.5);
      if (r > 3.4 && r < 5) c = Y < 9 ? '#ffe08a' : '#b88a30';
      if (Math.abs(dx) / 2.2 + Math.abs(Y - 4.5) / 2.2 < 1) c = Y < 4.5 ? b : a;
    }
    if (c) g.fset(px, py, c);
  });
  return g.outline('#0a0a10').canvas();
}
const iconURL = (...a) => itemIcon(...a).toDataURL();
const SKILL_ICON_URL = {}; for (const k in ICONS) SKILL_ICON_URL[k] = ICONS[k].toDataURL();

// ---- 아이템 / 장비 데이터 ----
const ITEMS = {
  hp: { name: '생명의 물약', grade: '고급', icon: iconURL('potion', '#c83030', '#ff8a7a'), n: 32, cd: 8, type: '배틀 아이템', desc: '최대 생명력의 35%를 즉시 회복한다.' },
  mp: { name: '마나 물약', grade: '고급', icon: iconURL('potion', '#2a5ad0', '#8ab8ff'), n: 18, cd: 8, type: '배틀 아이템', desc: '최대 마나의 50%를 즉시 회복한다.' },
  bomb: { name: '파쇄 폭탄', grade: '희귀', icon: iconURL('bomb'), n: 9, cd: 12, type: '배틀 아이템', desc: '가장 가까운 적에게 던져 폭발 피해를 주고, 무력화 게이지를 크게 깎는다.' },
  charm: { name: '전투의 부적', grade: '영웅', icon: iconURL('charm'), n: 5, cd: 30, type: '배틀 아이템', desc: '15초 동안 주는 피해가 20% 증가한다.' },
};
const ITEM_KEYS = [['hp', '5'], ['mp', '6'], ['bomb', '7'], ['charm', '8']];
const itemCd = { hp: 0, mp: 0, bomb: 0, charm: 0 };
const EQUIP = [
  { slot: '투구', name: '+18 황혼 수호자의 투구', grade: '유물', icon: iconURL('helmet', '#5e667e', '#9aa4ba'), q: 92, lv: 1640 },
  { slot: '견갑', name: '+18 황혼 수호자의 견갑', grade: '유물', icon: iconURL('shoulder', '#5e667e', '#9aa4ba'), q: 88, lv: 1640 },
  { slot: '상의', name: '+18 황혼 수호자의 흉갑', grade: '유물', icon: iconURL('chest', '#5e667e', '#9aa4ba'), q: 95, lv: 1640 },
  { slot: '하의', name: '+17 황혼 수호자의 각반', grade: '유물', icon: iconURL('pants', '#3a3e4c', '#5e667e'), q: 79, lv: 1635 },
  { slot: '장갑', name: '+18 황혼 수호자의 건틀릿', grade: '유물', icon: iconURL('gloves', '#5e667e', '#9aa4ba'), q: 100, lv: 1640 },
  { slot: '무기', name: '+21 종말을 부르는 대검', grade: '고대', icon: iconURL('weapon', '#9aa4ba', '#ffffff'), q: 97, lv: 1655 },
];
const ACC = [
  { slot: '목걸이', name: '붉은 맹세의 목걸이', grade: '유물', icon: iconURL('necklace', '#a01818', '#ff6a5a'), q: 85 },
  { slot: '귀걸이', name: '피의 서약 귀걸이', grade: '유물', icon: iconURL('earring', '#a01818', '#ff6a5a'), q: 71 },
  { slot: '귀걸이', name: '분노의 귀걸이', grade: '유물', icon: iconURL('earring', '#6a1a8a', '#d08aff'), q: 93 },
  { slot: '반지', name: '쇠락한 왕의 반지', grade: '유물', icon: iconURL('ring', '#a01818', '#ff6a5a'), q: 64 },
  { slot: '반지', name: '광전사의 인장 반지', grade: '전설', icon: iconURL('ring', '#2a6ad0', '#8ab8ff'), q: 100 },
];
const INV = [
  { ref: 'hp' }, { ref: 'mp' }, { ref: 'bomb' }, { ref: 'charm' },
  { name: '붉은 강철 조각', grade: '일반', icon: iconURL('ore', '#8a3a3a', '#d07060'), n: 1240, type: '강화 재료', desc: '무기 강화에 쓰이는 재료.' },
  { name: '푸른 수호석', grade: '일반', icon: iconURL('ore', '#2a4a8a', '#70a0e0'), n: 980, type: '강화 재료', desc: '방어구 강화에 쓰이는 재료.' },
  { name: '황혼의 파편', grade: '고급', icon: iconURL('shard', '#7a3ab0', '#d0a0ff'), n: 15300, type: '강화 재료', desc: '강화 시 함께 소모되는 파편.' },
  { name: '돌파의 결정', grade: '희귀', icon: iconURL('gem', '#c89020', '#ffe080'), n: 120, type: '강화 재료', desc: '강화 성공 확률을 높여 준다.' },
  { name: '+15 황혼 수호자의 견갑', grade: '유물', icon: iconURL('shoulder', '#5e667e', '#9aa4ba'), n: 1, type: '견갑', desc: '예비 장비. 품질 64' },
  { name: '잊힌 왕의 투구', grade: '전설', icon: iconURL('helmet', '#7a6030', '#c8a050'), n: 1, type: '투구', desc: '오래된 투구. 품질 41' },
  { name: '빛바랜 반지', grade: '영웅', icon: iconURL('ring', '#6a1a8a', '#d08aff'), n: 1, type: '반지', desc: '치명 +210' },
  { name: '수련자의 대검', grade: '희귀', icon: iconURL('weapon', '#5e667e', '#c8d0dc'), n: 1, type: '무기', desc: '연습용 대검.' },
];
const ENGRAVE = [['혈투', 3], ['강철 의지', 3], ['예리한 일격', 3], ['질풍', 2], ['광기의 숨결', 1]];
// 스킬 설명 / 트라이포드 (로아의 3단 트라이포드 구조를 참고, 이름·효과는 새로 만듦)
const SKILL_INFO = {
  Q: { lv: 10, desc: "한 걸음씩 밀고 들어가며 내려베기, 올려베기, 내려찍기 3연타. 3타는 전방으로 균열을 내며 적을 밀쳐낸다. 140 / 160 / 150×2%", tri: [[["신속한 손놀림","시전 속도 +20%"],["단단한 자세","시전 중 받는 피해 -20%"],["넓은 베기","범위 +25%"]],[["깊은 상처","3타 출혈, 6초간 초당 40%"],["파고들기","전진 거리 2배, 1·2타 관통"],["연속 압박","적중 시 재사용 -1초"]],[["대지 가르기","3타 균열이 6m 지진파로, +250%"],["분노 축적","광폭화 게이지 획득 2배"],["네 번째 칼","회전 베기 1타 추가, 200%"]]] },
  E: { lv: 10, desc: "어깨를 앞세워 6.3m 돌진하며 경로의 적에게 2회, 마무리 가로베기 1회 피해. 돌진 중 무적. 180×2 + 220%", tri: [[["도약 준비","준비 동작 50% 단축"],["긴 돌진","거리 +40%"],["넓은 어깨","판정 +30%"]],[["충돌 기절","마무리 시 1초 기절"],["연속 돌진","3초 안에 1회 더, 두 번째는 마나 0"],["강철 몸","돌진 후 2초 받는 피해 -20%"]],[["폭발 돌진","마무리가 반경 3m 폭발 400%로"],["질주","3초 이동 속도 +30%, 다음 기본 공격이 바로 3타"]]] },
  R: { lv: 30, desc: "누르고 있는 동안 회전하며 주변을 갈고(최대 3초), 키를 떼면 양쪽으로 마무리 일격. 45×20 + 200×2 = 최대 1,300%", tri: [[["회전 가속","타격 간격 -25%"],["자유 이동","회전 중 이동 속도 100%"],["폭풍의 눈","범위 +20%"]],[["끌어당기기","반경 5m 적을 중심으로 당김"],["피의 회오리","적중마다 생명력 0.3% 회복"],["연장","최대 회전 4초"]],[["폭풍 마무리","마무리 피해 +80%, 무력화 상"],["칼날 폭풍","마무리 때 사방으로 검기 8개, 각 150%"]]] },
  F: { lv: 30, desc: "도약해 대지를 내리찍어 적을 띄우고, 바깥으로 퍼지는 여진 3회. 250×2 + 120×3 = 860%", tri: [[["빠른 도약","도약 시간 -30%"],["정밀 착지","착지 범위 +25%"],["무게 실린 일격","착지 피해 +30%"]],[["연쇄 여진","여진 +2회"],["지면 붕괴","여진 범위 +30%, 3초간 적 이동 -30%"],["뒤흔들기","무력화 +50%"]],[["용암 균열","균열 위 적에게 3초 화상, 초당 60%"],["대지의 분노","여진이 안쪽으로 2회 더, 끝에 중심 폭발 300%"]]] },
  Z: { lv: 50, desc: "6연속 베기 뒤 X자 2연 베기로 마무리. 전 구간 슈퍼아머. 110×12 + 180×4 = 2,040%", tri: [[["광란","공격 속도 +25%"],["피의 갈증","적중마다 생명력 0.5% 회복"],["넓은 난무","범위 +20%"]],[["추가 난무","베기 +2회"],["약점 공략","치명타 확률 +20%"],["단단한 의지","시전 중 받는 피해 -30%"]],[["십자 처형","X 마무리 피해 +100%"],["분노 폭발","X 뒤 전방 4m 폭발 500%, 광폭화 게이지 +15"]]] },
  X: { lv: 50, desc: "0.8초 동안 막는 자세. 그 사이 공격을 받으면 정면은 피해 무효, 옆·뒤는 절반으로 받고 즉시 반격한다 (900×2%, 무력화 최상, 광폭화 게이지 +30). 아무도 안 때리면 밀쳐내기 300%.", tri: [[["넓은 자세","막기 시간 0.8 → 1.1초"],["빠른 반격","반격 동작 30% 빠르게"],["전방위 방어","옆·뒤도 피해 무효"]],[["피의 대가","반격 성공 시 생명력 8% 회복"],["철벽","실패 밀쳐내기도 무력화 상"],["반격 연쇄","성공 후 2초 안에 한 번 더 (마나 0, 피해 50%)"]],[["응징","반격 피해 +70%"],["광기의 각성","반격 성공 시 광폭화 게이지 +60"]]] },
  C: { lv: 70, desc: "누르고 있으면 3단계 차지(0.5 / 1.0 / 1.5초), 놓으면 내려찍어 직선 균열을 낸다. 1,000 / 1,900 / 3,200%, 길이 6 / 9 / 12m. 차지 중 받는 피해 -30%, 풀차지 1초 뒤 자동 발동.", tri: [[["빠른 집중","차지 시간 -25%"],["흔들리지 않는 자세","차지 중 받는 피해 -60%"],["넓은 균열","폭 +50%"]],[["대지 해방","균열 길이 +50%"],["무력화 특화","무력화 +50%"],["즉발","차지 없이 바로 2단계 위력, 풀차지 불가"]],[["하늘 가르기","풀차지 시 빛의 칼날 3개, +800%"],["분노의 차지","차지 중 광폭화 게이지 초당 +15"]]] },
  V: { lv: 70, desc: "[각성기] 하늘에서 소환한 거대한 대검과 함께 내려꽂혀 8연타, 여진 2회. 전 구간 무적. 900×8 = 7,200%. 광폭화 중에는 핏빛 강화판 (피해 +40%, 여진 2회 추가).", tri: [] },
  G: { lv: 1, desc: "[직업 게이지] 게이지가 가득 차면 포효(무적)와 함께 20초 폭주: 피해 +30%, 치명타 +15%, 속도 +20%, 재사용 회복 1.5배, 슈퍼아머, 받는 피해 +10%. 끝나면 3초 탈진.", tri: [] },
};
const triSel = {}; for (const k in SKILL_INFO) triSel[k] = SKILL_INFO[k].tri.map(() => 0);
let skillPts = { used: 384, max: 420 };

// ---- 채팅 ----
const CHAT_COL = { 시스템: '#f0d070', 전투: '#ff9a6a', 파티: '#7ad8ff', 일반: '#e8e2d4', 퀘스트: '#9aff7a' };
const chatMsgs = []; let chatTab = '전체';
function log(text, type = '시스템') { chatMsgs.push({ text, type }); if (chatMsgs.length > 100) chatMsgs.shift(); renderChat(); }
// ---- 알림 ----
function toast(a, b, col = '#e8c878') {
  const t = mk('div', 'toast', `<div class="a" style="color:${col}">${a}</div>${b ? `<div class="b">${b}</div>` : ''}`, document.getElementById('toasts'));
  setTimeout(() => t.remove(), 3000);
}
// ---- 퀘스트 ----
const QUESTS = [
  { id: 'kill', ty: 'm', tyn: '메인', title: '시든 숲의 군주', obj: '모르그라스 처치', cur: 0, max: 1, exp: 0.35 },
  { id: 'hunt', ty: 'n', tyn: '일반', title: '황혼 숲 정리', obj: '숲의 괴물 처치', cur: 0, max: 15, exp: 0.15 },
  { id: 'dummy', ty: 'n', tyn: '일반', title: '수련의 시간', obj: '허수아비 공격', cur: 0, max: 30, exp: 0.12 },
  { id: 'stagger', ty: 'n', tyn: '일반', title: '흔들리는 거체', obj: '골렘 · 군주 무력화', cur: 0, max: 2, exp: 0.15 },
  { id: 'ult', ty: 'c', tyn: '도전', title: '분노의 끝', obj: '광폭화 중 종말의 대검 적중', cur: 0, max: 1, exp: 0.25 },
];
function questProg(id, n = 1) {
  const q = QUESTS.find(q => q.id === id); if (!q || q.cur >= q.max) return;
  q.cur = Math.min(q.max, q.cur + n);
  if (q.cur >= q.max) { toast('퀘스트 완료', `[${q.tyn}] ${q.title}`, '#9aff7a'); log(`[${q.tyn}] ${q.title} 퀘스트를 완료했습니다.`, '퀘스트'); gainExp(q.exp); }
  renderQuest();
}
function gainExp(f) {
  player.exp += f;
  while (player.exp >= 1) { player.exp -= 1; player.level++; skillPts.max += 3; party.forEach(c => { recalc(c); c.hp = c.max; }); toast(`레벨 업!`, `Lv.${player.level} 달성`, '#ffe08a'); log(`레벨이 ${player.level}(으)로 올랐습니다.`); }
}

// ---- 툴팁 ----
const tip = document.getElementById('tip');
function showTip(html, e) { tip.innerHTML = html; tip.style.display = 'block'; moveTip(e); }
function moveTip(e) { const r = tip.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - r.width - 8, e.clientX + 16) + 'px'; tip.style.top = Math.min(innerHeight - r.height - 8, e.clientY + 12) + 'px'; }
function hideTip() { tip.style.display = 'none'; }
function bindTip(el, fn) { el.addEventListener('mouseenter', e => showTip(fn(), e)); el.addEventListener('mousemove', moveTip); el.addEventListener('mouseleave', hideTip); }
function itemTip(it, extra = '') {
  return `<div class="th lp" style="background:linear-gradient(180deg,${GRADE_BG[it.grade]},#0c0d12)"><div class="tn" style="color:${GRADE[it.grade]}">${it.name}</div><div class="dim">${it.grade} ${it.type || it.slot || ''}</div></div>
  <div class="tb lp" style="border-top:none">${it.lv ? `<div class="gold">아이템 레벨 ${it.lv}</div>` : ''}${it.q != null ? `<div>품질 <span style="color:${qCol(it.q)}">${it.q}</span></div>` : ''}<div class="ln">${it.desc || ''}</div>${it.n > 1 ? `<div class="ln">보유 ${fmt(it.n)}개</div>` : ''}${extra}</div>`;
}
const tsel = (ck, k, n) => triSel[ck + k] || (triSel[ck + k] = Array(n).fill(0));
function skillTip(k) {
  const A = party[active], kit = kitOf(A.key), s = kit && kit.defs[k], inf = kit && kit.info[k]; if (!s || !inf) return '<div class="tb lp">빈 슬롯</div>';
  const ts = tsel(A.key, k, inf.tri.length);
  const tri = inf.tri.map((t, i) => { const g = typeof triGrade === 'function' ? triGrade(A.key, k, i, ts[i]) : 2; return g < 0 ? '' : `<div class="ln" style="color:${typeof TGR !== 'undefined' ? TGR[g].col : '#e8c878'}">${['Ⅰ', 'Ⅱ', 'Ⅲ'][i]} ${t[ts[i]][0]}${typeof TGR !== 'undefined' ? ' · ' + TGR[g].name : ''}</div>`; }).join('');
  return `<div class="th lp"><div class="tn gold">${s.full}</div><div class="dim">${s.tier}차 스킬 · 스킬 레벨 ${inf.lv}</div></div>
  <div class="tb lp" style="border-top:none"><div>재사용 대기시간 <span class="blu">${s.cd}초</span> · 마나 <span class="blu">${kit.mana[k]}</span></div><div class="ln">${inf.desc}</div>${tri}</div>`;
}
const qCol = q => q >= 100 ? '#f0a030' : q >= 90 ? '#b05ae0' : q >= 70 ? '#3d9bd4' : q >= 30 ? '#8dd43d' : '#e8d070';

// ===================================================================
// UI 만들기
// ===================================================================
function slotEl(par, cls = '') { const s = mk('div', 'slot ' + cls, '<img><span class="k"></span><div class="cd"></div><span class="ct"></span><span class="n"></span>', par); s.img = s.querySelector('img'); s.k = s.querySelector('.k'); s.cd = s.querySelector('.cd'); s.ct = s.querySelector('.ct'); s.n = s.querySelector('.n'); return s; }
// 파티
const partyEl = mk('div', '', null, uiRoot); partyEl.id = 'party';
const partyRows = party.map((c, i) => {
  const r = mk('div', 'pm lp p', `<img class="pf"><div class="in"><div class="r1"><span><span class="gold">${i + 1}</span> ${c.cl.name}</span><span class="dim">Lv.${50 + i}</span></div><div class="bar hp"><i class="f"></i><b></b></div></div>`, partyEl);
  const cv = document.createElement('canvas'); cv.width = 52; cv.height = 52; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(HERO_FRAMES[c.key].idle[0].c, 72, 20, 52, 52, 0, 0, 52, 52); r.querySelector('.pf').src = cv.toDataURL();
  r.onclick = () => { active = i; };
  r.fill = r.querySelector('i.f'); r.txt = r.querySelector('b');
  return r;
});
// 보스
const bossEl = mk('div', 'lp', `<div class="t"><span class="lv">Lv.55</span><span class="nm"></span><span class="tag"></span><span class="mul"></span></div>
<div class="bar bb"><i class="bg"></i><i class="tr"></i><i class="fg"></i><b></b></div><div class="bar sb"><i></i></div><div class="db"></div>`, uiRoot); bossEl.id = 'boss';
const bossQ = { mul: bossEl.querySelector('.mul'), bg: bossEl.querySelector('.bg'), tr: bossEl.querySelector('.tr'), fg: bossEl.querySelector('.fg'), txt: bossEl.querySelector('.bb b'), sb: bossEl.querySelector('.sb i'), db: bossEl.querySelector('.db') };
bossQ.bg.style.width = '100%';
// 미니맵
const miniEl = mk('div', 'lp', `<div class="z"><span class="gold">황혼의 야영지</span><span class="dim clk"></span></div><canvas width="188" height="188"></canvas>`, uiRoot); miniEl.id = 'mini';
const miniCv = miniEl.querySelector('canvas'), miniG = miniCv.getContext('2d'), miniClk = miniEl.querySelector('.clk');
// 퀘스트
const questEl = mk('div', '', null, uiRoot); questEl.id = 'quest';
function renderQuest() {
  questEl.innerHTML = '<h4>퀘스트 (J)</h4>' + QUESTS.map(q => `<div class="q ${q.cur >= q.max ? 'done' : ''}"><div><span class="ty ${q.ty}">${q.tyn}</span><span class="tt">${q.title}</span></div><div class="ob">${q.obj} ${q.cur >= q.max ? '완료' : `${q.cur}/${q.max}`}</div></div>`).join('');
}
// 채팅
const chatEl = mk('div', 'p', `<div class="tabs"></div><div class="lg"></div><input placeholder="Enter 키로 대화 입력" maxlength="80">`, uiRoot); chatEl.id = 'chat';
const chatLog = chatEl.querySelector('.lg'), chatIn = chatEl.querySelector('input'), chatTabs = chatEl.querySelector('.tabs');
['전체', '시스템', '전투', '파티'].forEach(t => { const s = mk('span', t === chatTab ? 'on' : '', t, chatTabs); s.onclick = () => { chatTab = t; [...chatTabs.children].forEach(c => c.classList.toggle('on', c === s)); renderChat(); }; });
function renderChat() {
  const list = chatMsgs.filter(m => chatTab === '전체' || m.type === chatTab || (chatTab === '시스템' && m.type === '퀘스트'));
  chatLog.innerHTML = list.slice(-60).map(m => `<div style="color:${CHAT_COL[m.type]}">${m.type === '일반' ? '' : `[${m.type}] `}${m.text}</div>`).join('');
  chatLog.scrollTop = 1e9;
}
chatIn.addEventListener('focus', () => { uiTyping = true; for (const k in keys) keys[k] = false; });
chatIn.addEventListener('blur', () => { uiTyping = false; });
chatIn.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') { const v = chatIn.value.trim(); if (v) log(`${player.name}: ${v.replace(/</g, '&lt;')}`, '일반'); chatIn.value = ''; chatIn.blur(); }
  if (e.key === 'Escape') chatIn.blur();
});
// 메뉴
const menuEl = mk('div', 'lp p', '', uiRoot); menuEl.id = 'menu';
[['캐릭터', 'P', '◈', 'wChar'], ['인벤토리', 'I', '▣', 'wInv'], ['스킬', 'K', '✦', 'wSkill'], ['퀘스트', 'J', '❖', 'quest']].forEach(([n, k, ic, id]) => {
  const b = mk('div', 'mb', `<em>${ic}</em>${n}<small>${k}</small>`, menuEl); b.onclick = () => toggleWin(id);
});
// ---- 하단 전투 콘솔 (던파식 HP/MP 구슬 + 로아식 스킬판) ----
const conEl = mk('div', 'con', `
  <div class="plate"><span class="lv"></span><span class="pn"></span><span class="cl"></span></div>
  <div class="frame">
    <div class="buffs2"></div>
    <div class="orbw l"><canvas width="132" height="132"></canvas><div class="ov"><b></b><small></small></div><span class="lab">HP</span></div>
    <div class="center"><div class="idg2"><img class="ic"><div class="segs"></div><span class="t"></span></div><div class="sk2"></div></div>
    <div class="its2"></div>
    <div class="orbw r"><canvas width="132" height="132"></canvas><div class="ov"><b></b><small></small></div><span class="lab">MP</span></div>
  </div>
  <div class="exp2"><i></i><div class="ticks"></div><span></span></div>`, uiRoot);
const CQ = {
  lv: conEl.querySelector('.plate .lv'), pn: conEl.querySelector('.plate .pn'), cl: conEl.querySelector('.plate .cl'),
  hpW: conEl.querySelector('.orbw.l'), hpCv: conEl.querySelector('.orbw.l canvas'), hpB: conEl.querySelector('.orbw.l b'), hpS: conEl.querySelector('.orbw.l small'),
  mpCv: conEl.querySelector('.orbw.r canvas'), mpB: conEl.querySelector('.orbw.r b'), mpS: conEl.querySelector('.orbw.r small'),
  idg: conEl.querySelector('.idg2'), idgT: conEl.querySelector('.idg2 .t'), buffs: conEl.querySelector('.buffs2'),
  exp: conEl.querySelector('.exp2 i'), expT: conEl.querySelector('.exp2 span'),
};
conEl.querySelector('.idg2 .ic').src = SKILL_ICON_URL.G;
const idgSegs = [...Array(10)].map(() => mk('div', 'seg', '', conEl.querySelector('.idg2 .segs')));
function slot2(par, key, small) {
  const s = mk('div', 'sl2 p', `<div class="ic"><img><div class="cdr"></div><span class="ct"></span><span class="${small ? 'n' : 'mp'}"></span></div><span class="k">${key}</span>`, par);
  s.img = s.querySelector('img'); s.cdr = s.querySelector('.cdr'); s.ct = s.querySelector('.ct'); s.sub = s.querySelector(small ? '.n' : '.mp'); s.wasCd = false;
  return s;
}
const skillSlots = SKILL_KEYS.map(k => { const s = slot2(conEl.querySelector('.sk2'), k); bindTip(s, () => skillTip(k)); return s; });
const itemSlots = ITEM_KEYS.map(([id, key]) => { const s = slot2(conEl.querySelector('.its2'), key, true); s.img.src = ITEMS[id].icon; bindTip(s, () => itemTip(ITEMS[id], `<div class="ln gold">재사용 대기시간 ${ITEMS[id].cd}초 · 단축키 ${key}</div>`)); s.onclick = () => useItem(id); return s; });
function cdSweep(s, cd, tot) {
  if (cd > 0) { const deg = cd / tot * 360; s.cdr.style.background = `conic-gradient(rgba(0,0,0,.74) ${deg}deg, rgba(0,0,0,0) ${deg}deg)`; s.ct.textContent = cd < 1 ? cd.toFixed(1) : Math.ceil(cd); }
  else { s.cdr.style.background = 'none'; s.ct.textContent = ''; }
  if (s.wasCd && cd <= 0) { s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash'); }
  s.wasCd = cd > 0;
}
// 액체가 출렁이는 구슬
function drawOrb(cv, ratio, col, t) {
  const g = cv.getContext('2d'), W = 132, cx = 66, cy = 66, R = 52;
  ratio = clamp(ratio, 0, 1);
  g.clearRect(0, 0, W, W);
  let gr = g.createRadialGradient(cx - 10, cy - 10, R - 4, cx, cy, R + 12);
  gr.addColorStop(0, '#2a2010'); gr.addColorStop(0.35, '#f0d088'); gr.addColorStop(0.55, '#9a7434'); gr.addColorStop(0.8, '#e8c070'); gr.addColorStop(1, '#2a1c08');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R + 10, 0, TAU); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + 10, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, R + 1, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, x = cx + Math.cos(a) * (R + 5), y = cy + Math.sin(a) * (R + 5); g.fillStyle = '#000'; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#fff0c0'; g.fillRect(x - 2, y - 2, 4, 4); }
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  g.fillStyle = '#060508'; g.fillRect(0, 0, W, W);
  const top = cy + R - ratio * 2 * R, wave = x => top + Math.sin(x * 0.09 + t * 3.2) * 2.4 + Math.sin(x * 0.045 - t * 2.1) * 1.6;
  g.beginPath(); g.moveTo(0, W); for (let x = 0; x <= W; x += 2) g.lineTo(x, wave(x)); g.lineTo(W, W); g.closePath();
  gr = g.createLinearGradient(0, top - 4, 0, cy + R); gr.addColorStop(0, col[0]); gr.addColorStop(0.35, col[1]); gr.addColorStop(1, col[2]);
  g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.beginPath(); for (let x = 0; x <= W; x += 2) x ? g.lineTo(x, wave(x) + 1) : g.moveTo(x, wave(x) + 1); g.stroke();
  for (let i = 0; i < 7; i++) { const bx = cx - 30 + ((i * 41) % 60), by = cy + R - ((t * (14 + i * 3) + i * 31) % (R * 2)); if (by > wave(bx) + 3) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx | 0, by | 0, 2, 2); } }
  gr = g.createRadialGradient(cx, cy, R * 0.45, cx, cy, R); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, W);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(cx - 12, cy - 24, 26, 14, -0.45, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(cx - 20, cy - 30, 9, 4, -0.45, 0, TAU); g.fill();
  g.restore();
}
mk('div', '', null, uiRoot).id = 'toasts';

// ---- 창 ----
function makeWin(id, title) {
  const w = mk('div', 'win lp', `<div class="hd">${title}<span class="x">✕</span></div><div class="bd"></div>`, uiRoot); w.id = id;
  w.querySelector('.x').onclick = () => toggleWin(id, false);
  const hd = w.querySelector('.hd'); let drag = null;
  hd.addEventListener('mousedown', e => { const r = w.getBoundingClientRect(); drag = [e.clientX - r.left, e.clientY - r.top]; e.preventDefault(); });
  addEventListener('mousemove', e => { if (drag) { const z = +uiRoot.style.zoom || 1; w.style.left = (e.clientX - drag[0]) / z + 'px'; w.style.top = (e.clientY - drag[1]) / z + 'px'; } });
  addEventListener('mouseup', () => drag = null);
  return w.querySelector('.bd');
}
function toggleWin(id, force) {
  if (id === 'quest') { questEl.style.display = questEl.style.display === 'none' ? '' : 'none'; return; }
  const w = document.getElementById(id), open = force ?? !w.classList.contains('open');
  w.classList.toggle('open', open);
  if (open) { if (document.pointerLockElement) { selfUnlock = true; document.exitPointerLock(); } renderWin(id); }
  hideTip();
}
const anyWin = () => !!document.querySelector('.win.open');
// 캐릭터 창
const charBd = makeWin('wChar', '캐릭터 정보');
// 인벤토리 창
const invBd = makeWin('wInv', '인벤토리');
// 스킬 창
const skillBd = makeWin('wSkill', '스킬');
let selSkill = 'Q';
function eqRow(par, e) {
  const r = mk('div', 'eq p', '', par), s = slotEl(r); s.img.src = e.icon; s.style.background = `radial-gradient(circle at 50% 35%,${GRADE_BG[e.grade]},#0c0d12)`; s.style.borderColor = GRADE[e.grade];
  mk('div', 'nm2', `<div class="dim">${e.slot}</div><div style="color:${GRADE[e.grade]}">${e.name}</div><div class="qb"><i style="width:${e.q}%;background:${qCol(e.q)}"></i></div>`, r);
  bindTip(r, () => itemTip(e));
}
function renderWin(id) {
  if (id === 'wDun') return renderDunWin();
  if (id === 'wRes') return renderResWin();
  if (id === 'wChar') { renderChar(); if (typeof renderSetBox === 'function') renderSetBox(charBd.lastChild, party[active]); return; }
  if (id === 'wInv') return renderInv();
  if (id === 'wSmith') return renderSmith();
  if (id === 'wChar') {
    charBd.innerHTML = '';
    const L = mk('div', '', '', charBd), M = mk('div', '', '', charBd), Rr = mk('div', '', '', charBd);
    EQUIP.forEach(e => eqRow(L, e));
    const avg = EQUIP.reduce((a, e) => a + e.lv, 0) / EQUIP.length;
    const pv = mk('div', 'pv', `<div class="il"><div class="dim">아이템 레벨</div><div class="v">${avg.toFixed(2)}</div><div style="margin-top:4px">Lv.${player.level} <span class="gold">${player.name}</span> · 광전사</div></div><img>`, M);
    const big = document.createElement('canvas'); big.width = HW * S; big.height = HH * S; big.getContext('2d').drawImage(HERO_FRAMES.berserker.idle[0].c, 0, 0); pv.querySelector('img').src = big.toDataURL();
    mk('div', 'st', [['힘', '3,412'], ['지능', '1,020'], ['체력', '2,860'], ['정신', '940'], ['물리 공격력', '2,148'], ['최대 생명력', fmt(party[0].max)], ['치명타 확률', '38.2%'], ['공격 속도', '+24%']].map(([a, b]) => `<div><span class="dim">${a}</span><span>${b}</span></div>`).join(''), M);
    ACC.forEach(e => eqRow(Rr, e));
    mk('div', 'eng', '<div class="gold" style="border:none;background:none;padding:0 0 4px">속성 친화</div>' + [['화염', 186, '#ff7a4a'], ['서리', 142, '#7ad0ff'], ['번개', 142, '#ffe060'], ['어둠', 210, '#c08aff']].map(([n, v, c]) => `<div><span style="color:${c}">${n}</span><span>${v}</span></div>`).join('') + '<div class="gold" style="border:none;background:none;padding:10px 0 4px">숨은 옵션 · 무기 <span style="color:#f0a030">[전설]</span></div>' + [['물리 공격력 +12%', '#f0a030'], ['보스 공격 시 피해 +30%', '#f0a030'], ['치명타 피해 +8%', '#b05ae0']].map(([t, c]) => `<div><span style="color:${c}">${t}</span></div>`).join(''), Rr);
  }
  if (id === 'wInv') {
    invBd.innerHTML = '';
    const grid = mk('div', 'grid', '', invBd);
    for (let i = 0; i < 40; i++) {
      const raw = INV[i], it = raw ? (raw.ref ? ITEMS[raw.ref] : raw) : null;
      const s = slotEl(grid, 'p');
      if (!it) { s.classList.add('empty'); continue; }
      s.img.src = it.icon; s.style.background = `radial-gradient(circle at 50% 35%,${GRADE_BG[it.grade]},#0c0d12)`; s.style.borderColor = GRADE[it.grade];
      s.n.textContent = it.n > 1 ? (it.n >= 10000 ? Math.floor(it.n / 1000) + 'k' : it.n) : '';
      bindTip(s, () => itemTip(it, raw.ref ? '<div class="ln gold">우클릭으로 사용</div>' : ''));
      s.oncontextmenu = e => { e.preventDefault(); if (raw.ref) { useItem(raw.ref); renderWin('wInv'); } };
    }
    mk('div', 'money', `<span><span style="color:#ffd27a">●</span> ${fmt(1284530)}</span><span><span style="color:#c8d0dc">●</span> ${fmt(8420330)}</span>`, invBd);
  }
  if (id === 'wSet') renderSet();
  if (id === 'wSkill') {
    skillBd.innerHTML = '';
    const L = mk('div', '', `<div class="dim" style="margin-bottom:8px">스킬 포인트 <span class="gold">${skillPts.used}</span> / ${skillPts.max}</div>`, skillBd), Rr = mk('div', 'tri', '', skillBd);
    const A = party[active], kit = kitOf(A.key);
    if (!kit) { mk('div', 'dim', '이 직업은 아직 스킬이 없습니다.', Rr); return; }
    SKILL_KEYS.filter(k => kit.defs[k]).forEach(k => {
      const s = kit.defs[k], r = mk('div', 'sl p' + (k === selSkill ? ' sel' : ''), '', L), sl = slotEl(r); sl.img.src = kit.icon[k]; sl.k.textContent = k;
      mk('div', '', `<div>${s.full}</div><div class="dim">${s.tier}차 · 마나 ${kit.mana[k]}</div>`, r); mk('span', 'lv', `Lv.${kit.info[k].lv}`, r);
      r.onclick = () => { selSkill = k; renderWin('wSkill'); };
    });
    const k = selSkill, s = kit.defs[k], inf = kit.info[k], ts = tsel(A.key, k, inf.tri.length);
    mk('div', '', `<div style="font-size:15px" class="gold">${s.full}</div><div class="dim" style="margin:4px 0 8px">${s.tier}차 스킬 · 재사용 대기 ${s.cd}초 · 마나 ${kit.mana[k]}</div><div style="line-height:1.6">${inf.desc}</div>`, Rr);
    if (!inf.tri.length) mk('div', 'dim', '<h5>각성기는 트라이포드가 없습니다.</h5>', Rr);
    inf.tri.forEach((tier, ti) => {
      mk('h5', '', `트라이포드 ${['Ⅰ', 'Ⅱ', 'Ⅲ'][ti]} 단계`, Rr);
      const ops = mk('div', 'ops', '', Rr);
      tier.forEach(([n, d], oi) => {
        const tg = typeof triGrade === 'function' ? triGrade(A.key, k, ti, oi) : 2, own = tg >= 0, G = own && TGR[tg], pid = own && tid(A.key, k, ti, oi);
        const o = mk('div', 'op p' + (ts[ti] === oi && own ? ' on' : '') + (own ? '' : ' lk'), `<b>${n}${own ? `<span class="tg${tg === 3 ? ' tgx' : ''}" style="color:${G.col}">${G.name} ${Math.round(G.mul * 100)}%</span>` : '<span class="tg" style="color:#777">미획득</span>'}</b><span class="dim">${d}</span>${own && tg < 3 ? `<span class="tp">공명 ${TRIO.pts[pid] || 0} / ${TUP[tg]}</span>` : ''}`, ops);
        o.onclick = () => { if (!own) return; ts[ti] = oi; log(`[${s.full}] 트라이포드 ${['Ⅰ', 'Ⅱ', 'Ⅲ'][ti]}: ${n} 선택`); renderWin('wSkill'); };
      });
    });
  }
}

// ---- 배틀 아이템 사용 ----
function useItem(id) {
  const c = party[active], it = ITEMS[id];
  if (c.down || it.n <= 0) return;
  if (itemCd[id] > 0) { log(`${it.name}: 재사용 대기 중입니다.`); return; }
  itemCd[id] = it.cd; it.n--;
  if (id === 'hp') { const v = Math.round(c.max * 0.35); c.hp = Math.min(c.max, c.hp + v); floaters.push({ x: c.x, y: 2.8, z: c.z, t: 0, text: '+' + fmt(v), crit: false, vx: 0, color: '#7aff7a' }); for (let i = 0; i < 24; i++) glow.emit({ x: c.x + (Math.random() - .5), y: Math.random() * 2.4, z: c.z, vy: 1.4, life: 0.9, c: [0.6, 2.6, 0.6], size: PX * 1.2 }); }
  if (id === 'mp') { c.mp = Math.min(c.mpMax, c.mp + c.mpMax * 0.5); for (let i = 0; i < 24; i++) glow.emit({ x: c.x + (Math.random() - .5), y: Math.random() * 2.4, z: c.z, vy: 1.4, life: 0.9, c: [0.5, 1.2, 2.8], size: PX * 1.2 }); }
  if (id === 'charm') { c.charm = 15; toast('전투의 부적', '15초 동안 피해 +20%', '#d08aff'); }
  if (id === 'bomb') {
    let best = null, bd = 10;
    for (const tg of targets) { if (!tg.alive()) continue; const d = Math.hypot(tg.x - c.x, tg.z - c.z); if (d < bd) { bd = d; best = tg; } }
    const [fx, fz] = best ? [best.x, best.z] : fwdPt(c, 5);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex(itemIcon('bomb')), alphaTest: 0.5, side: THREE.DoubleSide }));
    const root = new THREE.Group(); root.add(bm); const sx = c.x, sz = c.z; let boom = false;
    addFx(root, 0.62, f => {
      const k = Math.min(1, f.t / 0.6); root.position.set(sx + (fx - sx) * k, 1.6 + Math.sin(k * Math.PI) * 2.6 - k * 1.3, sz + (fz - sz) * k); bm.rotation.z += 0.3;
      if (k >= 1 && !boom) { boom = true; impact(fx, fz, 3.2, [2.6, 1.4, 0.6]); shake = 0.5; hitArea(c, { cx: fx, cz: fz, range: 2.8, dmg: 120, stop: 0.08, shake: 0.5, color: '#ffb070', sg: 25 }); }
    }, true);
  }
  log(`${it.name}을(를) 사용했습니다.`, '전투');
}

// ---- 매 프레임 UI 갱신 ----
const BAR_COLS = ['#c8231e', '#d8641a', '#c8a020', '#3a9a2a', '#2a7ad0', '#7a3ac8'];
let lastBossHp = -1;
function uiUpdate(dt) {
  for (const k in itemCd) itemCd[k] = Math.max(0, itemCd[k] - dt);
  const A = party[active];
  // 하단 콘솔
  CQ.lv.textContent = `Lv.${player.level}`; CQ.pn.textContent = active === 0 ? player.name : A.cl.name; CQ.cl.textContent = A.cl.name;
  drawOrb(CQ.hpCv, A.hp / A.max, ['#ff9a8a', '#d8261e', '#4a0606'], uTime.value);
  drawOrb(CQ.mpCv, A.mp / A.mpMax, ['#a8d8ff', '#2a6ad8', '#08164a'], uTime.value + 1.7);
  CQ.hpB.textContent = fmt(A.hp); CQ.hpS.textContent = '/ ' + fmt(A.max);
  CQ.mpB.textContent = fmt(A.mp); CQ.mpS.textContent = '/ ' + fmt(A.mpMax);
  CQ.hpW.classList.toggle('low', A.hp / A.max < 0.3 && !A.down);
  const kit = kitOf(A.key);
  SKILL_KEYS.forEach((k, i) => {
    const s = skillSlots[i], has = kit && kit.defs[k];
    s.classList.toggle('empty', !has);
    if (!has) { s.img.style.visibility = 'hidden'; s.cdr.style.background = 'none'; s.ct.textContent = ''; s.sub.textContent = ''; s.classList.remove('on', 'nomp'); return; }
    s.img.style.visibility = ''; if (s.img.dataset.k !== A.key + k) { s.img.src = kit.icon[k]; s.img.dataset.k = A.key + k; }
    if (kit.impl[k].charges) { cdSweep(s, A.fCh > 0 ? 0 : A.cd[k], kit.defs[k].cd); if (A.fCh > 0) s.ct.textContent = '×' + A.fCh; }
    else cdSweep(s, A.cd[k], kit.defs[k].cd);
    s.sub.textContent = kit.mana[k] || '';
    s.classList.toggle('on', A.state === 'skill' && A.sk && A.sk.id === k);
    s.classList.toggle('nomp', A.mp < kit.mana[k]);
  });
  ITEM_KEYS.forEach(([id], i) => { const s = itemSlots[i]; cdSweep(s, itemCd[id], ITEMS[id].cd); s.sub.textContent = ITEMS[id].n; s.classList.toggle('nomp', ITEMS[id].n <= 0); });
  // 광폭화 게이지 (10칸)
  const B = party[0], burst = B.berserk > 0;
  CQ.idg.style.visibility = A.key === 'berserker' ? '' : 'hidden';
  const on = burst ? Math.ceil(B.berserk / BZ_DUR * 10) : B.exhaust > 0 ? 0 : Math.floor(B.idg / 10);
  idgSegs.forEach((sg, i) => sg.classList.toggle('on', i < on));
  CQ.idg.classList.toggle('full', B.idg >= 100 && !burst); CQ.idg.classList.toggle('burst', burst);
  CQ.idgT.textContent = burst ? `광폭화 ${B.berserk.toFixed(1)}초` : B.exhaust > 0 ? `탈진 ${B.exhaust.toFixed(1)}초` : B.idg >= 100 ? 'G · 광폭화 가능!' : `G 광폭화 ${Math.floor(B.idg)}%`;
  CQ.idgT.classList.toggle('full', B.idg >= 100 || burst);
  CQ.idg.classList.toggle('hk', A.key === 'hawk'); CQ.idg.classList.toggle('as', A.key === 'assassin');
  { const ic = conEl.querySelector('.idg2 .ic'), want = A.key; if (ic.dataset.k !== want) { ic.src = want === 'hawk' ? H_ICON.G : want === 'assassin' ? A_ICON.G : SKILL_ICON_URL.G; ic.dataset.k = want; } }
  if (A.key === 'assassin') {
    const n = A.orbs || 0, st = A.stealth > 0;
    CQ.idg.style.visibility = '';
    idgSegs.forEach((sg, i) => sg.classList.toggle('on', i < n));
    CQ.idg.classList.toggle('full', n >= 5 && !st); CQ.idg.classList.toggle('burst', st);
    CQ.idgT.textContent = st ? `잠행 ${A.stealth.toFixed(1)}초` : n > 0 ? `G 잠행 · 구슬 ${n}/5` : '그림자 구슬 0/5';
    CQ.idgT.classList.toggle('full', n >= 5 || st);
  }
  if (A.key === 'hawk') {
    const lib = A.lib > 0, on2 = lib ? Math.ceil(A.lib / LIB_DUR * 10) : A.rest > 0 ? 0 : Math.floor(A.idg / 10);
    CQ.idg.style.visibility = '';
    idgSegs.forEach((sg, i) => sg.classList.toggle('on', i < on2));
    CQ.idg.classList.toggle('full', A.idg >= 100 && !lib); CQ.idg.classList.toggle('burst', lib);
    CQ.idgT.textContent = lib ? `매 해방 ${A.lib.toFixed(1)}초` : A.rest > 0 ? `매 휴식 ${A.rest.toFixed(1)}초` : A.idg >= 100 ? 'G · 매 해방 가능!' : `G 매 해방 ${Math.floor(A.idg)}%`;
    CQ.idgT.classList.toggle('full', A.idg >= 100 || lib);
  }
  // 버프
  const bl = [];
  if (A.berserk > 0) bl.push([SKILL_ICON_URL.G, A.berserk, '광폭화']);
  if (A.exhaust > 0) bl.push([SKILL_ICON_URL.G, A.exhaust, '탈진']);
  if (A.lib > 0) bl.push([H_ICON.G, A.lib, '매 해방']);
  if (A.rest > 0) bl.push([H_ICON.G, A.rest, '매 휴식']);
  if (A.windT > 0) bl.push([H_ICON.X, A.windT, '바람 걸음']);
  if (A.stealth > 0) bl.push([A_ICON.G, A.stealth, '잠행']);
  if (A.key === 'assassin' && aClone) bl.push([A_ICON.R, aClone.life - aClone.t, '그림자 분신']);
  if (A.charm > 0) bl.push([ITEMS.charm.icon, A.charm, '전투의 부적']);
  const key = bl.map(b => b[2]).join();
  if (CQ.buffs.dataset.k !== key) { CQ.buffs.dataset.k = key; CQ.buffs.innerHTML = bl.map(b => `<div class="buff"><img src="${b[0]}"><span></span></div>`).join(''); }
  [...CQ.buffs.children].forEach((e, i) => e.querySelector('span').textContent = Math.ceil(bl[i][1]));
  CQ.exp.style.width = (player.exp * 100) + '%'; CQ.expT.textContent = `EXP ${(player.exp * 100).toFixed(2)}%`;
  // 파티
  party.forEach((c, i) => { const r = partyRows[i]; r.classList.toggle('act', i === active); r.classList.toggle('down', c.down); r.fill.style.width = (c.hp / c.max * 100) + '%'; r.txt.textContent = c.down ? '전투 불능' : `${fmt(c.hp)} / ${fmt(c.max)}`; });
  // 보스
  const s = barMon();
  bossEl.style.opacity = s ? 1 : 0;
  if (s) {
    const D = s.def, unit = D.boss ? 1000 : D.elite ? 300 : 150, lines = Math.max(1, Math.ceil(s.hp / unit)), cur = s.hp - (lines - 1) * unit;
    if (bossEl.dataset.k !== s.kind) { bossEl.dataset.k = s.kind; bossEl.querySelector('.lv').textContent = 'Lv.' + D.lv; bossEl.querySelector('.nm').textContent = D.name; bossEl.querySelector('.tag').textContent = D.boss ? '[군주]' : D.elite ? '[정예]' : ''; bossEl.querySelector('.sb').style.visibility = D.stag ? '' : 'hidden'; }
    bossQ.mul.textContent = s.state === 'dead' ? '' : 'x' + lines;
    bossQ.fg.style.width = (Math.max(0, cur) / unit * 100) + '%'; bossQ.fg.style.background = `linear-gradient(180deg,rgba(255,255,255,.25),rgba(0,0,0,0) 50%),${BAR_COLS[(lines - 1) % 6]}`;
    bossQ.bg.style.background = lines > 1 ? BAR_COLS[(lines - 2) % 6] : '#140808';
    const tl = Math.ceil(s.trail / unit); bossQ.tr.style.width = tl > lines ? '100%' : (Math.max(0, s.trail - (lines - 1) * unit) / unit * 100) + '%'; bossQ.tr.style.background = '#f0e0c0';
    bossQ.txt.textContent = s.state === 'dead' ? '처치' : `${fmt(Math.max(0, s.hp))} / ${fmt(s.max)}`;
    bossQ.sb.style.width = D.stag ? (s.stagger / D.stag * 100) + '%' : '0%';
    const db = s.state === 'stun' ? '<span>무력화</span>' : '';
    if (bossQ.db.innerHTML !== db) bossQ.db.innerHTML = db;
  }
  // 미니맵 (북쪽 위) · 던전에서는 방 지도
  if (AREA === 'dungeon' && DUN.on) drawRoomMap(miniG, 188); else {
  const g = miniG, W = 188, sc = 7, img = groundTex.image, pxu = 16 * S;
  g.fillStyle = '#16221a'; g.fillRect(0, 0, W, W);
  g.imageSmoothingEnabled = true;
  const vx = A.x - W / 2 / sc, vz = A.z - W / 2 / sc;
  g.drawImage(img, (vx - GX0) * pxu, (vz - GZ0) * pxu, W / sc * pxu, W / sc * pxu, 0, 0, W, W);
  const toM = (x, z) => [(x - vx) * sc, (z - vz) * sc];
  const cy = toM(0, CLIFF_Z)[1]; if (cy > 0) { g.fillStyle = 'rgba(40,46,60,.85)'; g.fillRect(0, 0, W, cy); g.fillStyle = '#5e5c72'; g.fillRect(0, cy - 2, W, 2); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, W, W);
  const dot = (x, z, col, r) => { const [mx, mz] = toM(x, z); g.fillStyle = '#000'; g.fillRect(mx - r - 1, mz - r - 1, r * 2 + 2, r * 2 + 2); g.fillStyle = col; g.fillRect(mx - r, mz - r, r * 2, r * 2); };
  dot(FIRE.x, FIRE.z, '#ffb030', 3); dot(TENT.x, TENT.z, '#d8c8a0', 3); dot(DUMMY.x, DUMMY.z, '#c8a060', 2);
  for (const m of mons) if (m.state !== 'dead') dot(m.x, m.z, m.def.boss ? '#ffb030' : '#ff4a4a', m.def.boss ? 5 : m.def.elite ? 4 : 2.5);
  party.forEach((c, i) => { if (i !== active) dot(c.x, c.z, '#7ad8ff', 3); });
  { const [mx, mz] = toM(A.x, A.z), a = -camYaw - Math.PI / 2 + Math.PI; g.save(); g.translate(mx, mz); g.rotate(a);
    g.fillStyle = 'rgba(255,240,180,.15)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 40, -0.6, 0.6); g.fill();
    g.fillStyle = '#ffe08a'; g.strokeStyle = '#000'; g.beginPath(); g.moveTo(8, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  }
  const d = new Date(); miniClk.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---- 키 ----
addEventListener('keydown', e => {
  if (uiTyping) return;
  if (e.code === 'Enter') { e.preventDefault(); if (document.pointerLockElement) { selfUnlock = true; document.exitPointerLock(); } chatIn.focus(); return; }
  if (e.code === 'KeyI') toggleWin('wInv');
  if (e.code === 'KeyP') toggleWin('wChar');
  if (e.code === 'KeyK') toggleWin('wSkill');
  if (e.code === 'KeyJ') toggleWin('quest');
  if (e.code === 'Escape' && !document.pointerLockElement) { const w = [...document.querySelectorAll('.win.open')].pop(); if (w) toggleWin(w.id, false); else toggleWin('wSet', true); }
  const it = ITEM_KEYS.find(([, k]) => e.code === 'Digit' + k);
  if (it && !e.repeat) useItem(it[0]);
});

renderQuest();
log('황혼의 야영지에 입장했습니다.');
log('자두 슬라임이 야영지를 노리고 있습니다!', '전투');
log('매사냥꾼: 불 옆에서 쉬고 있을게요.', '파티');
log('P 캐릭터 · I 인벤토리 · K 스킬 · J 퀘스트 · Enter 채팅');
