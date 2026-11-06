'use strict';
// 에셋 굽기 (캐릭터 프레임) · 도트 시트 보기(?sheet)

// ===================================================================
// 에셋 굽기
// ===================================================================
const HERO_FRAMES = {};
for (const k in HEROES) {
  const cl = HEROES[k], set = { idle: [], walk: [], atk: [] };
  const bake = (st, i) => {
    const R = new Rig(); cl.draw(R, cl.pose(st, i));
    const { g, gl } = R.render(), c = g.canvas(), gc = gl && gl.canvas();
    return { c, l: flipCanvas(c), gc, gl: gc && flipCanvas(gc) };
  };
  for (let i = 0; i < 4; i++) set.idle.push(bake('idle', i));
  for (let i = 0; i < WALK_N; i++) set.walk.push(bake('walk', i));
  for (let i = 0; i < 3; i++) set.atk.push(bake('atk', i));
  if (k === 'berserker') { set.skill = []; for (let i = 0; i < 8; i++) set.skill.push(bake('skill', i)); }
  HERO_FRAMES[k] = set;
}

if (SHEET) {
  document.getElementById('loading').remove();
  const sc = 2.6, cv = document.createElement('canvas');
  cv.width = 13 * HW * sc + 40; cv.height = 3 * HH * sc + 420;
  document.body.appendChild(cv); document.body.style.overflow = 'auto';
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#4a6a4a'; g.fillRect(0, 0, cv.width, cv.height);
  Object.keys(HEROES).forEach((k, row) => {
    const s = HERO_FRAMES[k];
    [...s.idle, ...s.walk, ...s.atk].forEach((f, i) => g.drawImage(f.c, 10 + i * HW * sc, 10 + row * HH * sc, HW * sc, HH * sc));
  });
  const extras = [makeOak(3).canvas(), makePine(5).canvas(), makeBush(2, true).canvas(), makeRock(4, 24, 16).canvas(), makeTent().canvas(), makeDummy().canvas(), makeLogs().canvas(), makeFireFrames()[0], makeTuft(1, true).canvas(), makeMushroom().canvas()];
  let x = 10; extras.forEach(c => { g.drawImage(c, x, 3 * HH * sc + 20, c.width * 3, c.height * 3); x += c.width * 3 + 10; });
  window.SHEET_STOP = true; // 뒤 파일을 더 읽지 않는다
  throw 'sheet';
}
