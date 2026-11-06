'use strict';
// 키보드 · 마우스 입력, 마우스 시점

// ===================================================================
// 입력
// ===================================================================
const keys = {};
let camYaw = 0.18, camPitch = 0.36, camDist = 15, locked = false, camTarget = new THREE.Vector3(party[0].x, 0, party[0].z);
addEventListener('keydown', e => {
  if (uiTyping) return;
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') active = +e.code.slice(5) - 1;
  if (e.code === 'Space' && !e.repeat) jump(party[active]);
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') dash(party[active]);
  if (['KeyQ', 'KeyE', 'KeyR', 'KeyF', 'KeyZ', 'KeyX', 'KeyC', 'KeyV'].includes(e.code) && !e.repeat) useSkill(party[active], e.code.slice(3));
  if (e.code === 'KeyG' && !e.repeat) useSkill(party[active], 'G');
  if (e.code === 'Backquote') noCD = !noCD;
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('wheel', e => { camDist = clamp(camDist + Math.sign(e.deltaY) * 1.2, 8, 32); }, { passive: true });
// 마우스 시점: 화면을 클릭하면 커서가 잠기고, 마우스 움직임이 곧 시점이 된다 (ESC로 해제)
const cvs = renderer.domElement;
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cvs; });
addEventListener('mousemove', e => {
  if (!locked) return;
  camYaw -= e.movementX * 0.0026 * SET.sens;
  camPitch = clamp(camPitch + e.movementY * 0.0015 * SET.sens, 0.2, 0.55);
});
let mouseL = false;
addEventListener('mouseup', e => { if (e.button === 0) mouseL = false; });
addEventListener('mousedown', e => {
  if (!locked) { if (e.target === cvs && !uiTyping) cvs.requestPointerLock(); return; }
  if (e.button === 0) { mouseL = true; attack(party[active]); }
  if (e.button === 2) dash(party[active]);
});
addEventListener('contextmenu', e => e.preventDefault());
