'use strict';
// 설정 창 (ESC)

// ===================================================================
// 설정 (ESC): UI 크기, 마우스 감도, 화면 효과
// ===================================================================
const SET_DEF = { ui: 0.8, sens: 1, bloom: true, tilt: true, shake: true, dmg: true, dist: 23, low: false };
const SET = Object.assign({}, SET_DEF);
try { Object.assign(SET, JSON.parse(localStorage.getItem('camp.settings') || '{}')); } catch (e) {}
// 시야 1.2배 (v2): 예전에 저장된 시야 거리도 1.2배로 옮긴다
if (!SET.v2) { SET.dist = Math.min(32, Math.round(SET.dist * 1.2 * 2) / 2); SET.v2 = true; }
if (location.search.includes('low=1')) SET.low = true;
function saveSet() { try { localStorage.setItem('camp.settings', JSON.stringify(SET)); } catch (e) {} }
function applySet() {
  uiRoot.style.zoom = SET.ui;
  bloom.enabled = SET.bloom;
  gradePass.uniforms.uBlur.value = SET.tilt && !SET.low ? 5 * PR : 0;
  camDist = SET.dist;
  // 저사양: 빛 번짐 · 그림자 끄기, 해상도 낮추기, 파티클 절반 (PSys가 LOW_FX를 본다)
  if (SET.low) bloom.enabled = false;
  sun.castShadow = !SET.low;
  const pr = SET.low ? Math.min(PR, 1) * 0.75 : PR;
  if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); composer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }
  window.LOW_FX = SET.low;
}
const setBd = makeWin('wSet', '설정');
function renderSet() {
  const row = (label, inner) => `<div class="srow"><span>${label}</span>${inner}</div>`;
  const tog = (k, label) => row(label, `<label class="tog"><input type="checkbox" data-k="${k}" ${SET[k] ? 'checked' : ''}><i></i></label>`);
  setBd.innerHTML = `
    <div class="sgrp">화면</div>
    ${row('UI 크기', `<input type="range" min="0.6" max="1.3" step="0.05" value="${SET.ui}" data-k="ui"><b class="sv">${Math.round(SET.ui * 100)}%</b>`)}
    ${row('시야 거리', `<input type="range" min="12" max="32" step="0.5" value="${SET.dist}" data-k="dist"><b class="sv">${SET.dist}</b>`)}
    ${tog('low', '저사양 모드 (그림자 · 빛 번짐 끔, 해상도 · 파티클 줄임)')}
    ${tog('bloom', '빛 번짐 (블룸)')}
    ${tog('tilt', '미니어처 효과 (위아래 흐림)')}
    ${tog('shake', '화면 흔들림')}
    ${tog('dmg', '데미지 숫자 표시')}
    <div class="sgrp">조작</div>
    ${row('마우스 감도', `<input type="range" min="0.3" max="2.5" step="0.05" value="${SET.sens}" data-k="sens"><b class="sv">${SET.sens.toFixed(2)}</b>`)}
    <div class="keys dim">WASD 이동 · Space 점프 · 좌클릭 공격 · 우클릭/Shift 대시 · Q E R F Z X C V 스킬 · G 광폭화 · 5~8 아이템 · 1 2 3 캐릭터 · P I K J 창 · Enter 채팅</div>
    <div class="sbtn"><button class="b2" data-a="def">기본값</button><button class="b1" data-a="back">게임으로 돌아가기</button></div>`;
  setBd.querySelectorAll('input[type=range]').forEach(inp => inp.oninput = () => {
    SET[inp.dataset.k] = +inp.value;
    inp.nextElementSibling.textContent = inp.dataset.k === 'ui' ? Math.round(SET.ui * 100) + '%' : inp.dataset.k === 'dist' ? SET.dist : SET.sens.toFixed(2);
    applySet(); saveSet();
  });
  setBd.querySelectorAll('input[type=checkbox]').forEach(inp => inp.onchange = () => { SET[inp.dataset.k] = inp.checked; applySet(); saveSet(); });
  setBd.querySelector('[data-a=def]').onclick = () => { Object.assign(SET, SET_DEF); applySet(); saveSet(); renderSet(); };
  setBd.querySelector('[data-a=back]').onclick = () => { toggleWin('wSet', false); cvs.requestPointerLock(); };
}
applySet();
// 게임 중 ESC → 브라우저가 커서 잠금을 풀면 설정창을 연다 (창을 열려고 일부러 푼 경우는 제외)
let selfUnlock = false;
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !selfUnlock && !anyWin() && !uiTyping) toggleWin('wSet', true);
  selfUnlock = false;
});
