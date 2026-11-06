'use strict';
// 9 = 이끼 골렘, 0 = 군주를 눈앞에 부른다 (시험용)
// (야영지는 마을이라 몬스터가 없다. ?mons=wolf,boss 로 시험용 배치)
addEventListener('keydown', e => {
  if (uiTyping || (e.code !== 'Digit9' && e.code !== 'Digit0')) return;
  const A = party[active], [rx, rz] = camRight();
  spawnMon(e.code === 'Digit0' ? 'boss' : 'golem', A.x + rx * A.face * 6, A.z + rz * A.face * 6, { aggro: true });
});
// 확인용 시뮬레이션 · 메인 루프

// ===================================================================
// 루프
// ===================================================================
document.getElementById('loading').remove();
// 확인용: ?sim=초 만큼 미리 진행 (?sim=3&atk=1 은 공격도 같이)
{
  const q = new URLSearchParams(location.search), sim = +q.get('sim') || 0;
  // 출현: ?mons=wolf,boss 처럼 고르면 그것만, 아니면 캠프 둘레 기본 배치
  if (q.get('mons')) q.get('mons').split(',').forEach((k, i) => addSpawner(k, 5.5 + (i % 2) * 1.8, 4.4 - Math.floor(i / 2) * 2.2, k === 'boss' ? 30 : 8));
  // 확인용: ?dun=0&room=2 이면 그 던전 방으로 바로 (등불을 쓰지 않음)
  if (q.get('diff') && q.get('dun')) DIFFSEL[DUNGEONS[+q.get('dun')].id] = +q.get('diff');
  if (q.get('dun')) { enterDungeon(+q.get('dun'), true); if (q.get('room')) buildRoom(+q.get('room')); }
  if (q.get('yaw')) camYaw = +q.get('yaw');
  if (q.get('win')) q.get('win').split(',').forEach(id => toggleWin(id, true));
  if (q.get('near')) { party[0].x = 2.2; party[0].z = 4.4; camTarget.set(2.2, 0, 4.4); }
  if (q.get('pitch')) camPitch = +q.get('pitch');
  if (q.get('char')) { active = +q.get('char'); const A = party[active]; if (q.get('near')) { const nx = active === 2 ? 1.8 : -1.6; A.x = nx; A.z = 4.4; camTarget.set(nx, 0, 4.4); } }
  if (q.get('lib')) party[1].lib = LIB_DUR;
  for (let i = 0; i < sim * 60; i++) {
    if (q.get('atk') && i % 40 === 0) attack(party[active]);
    if (q.get('pat') && i === 70 && mons[0]) { mons[0].state = 'chase'; startPat(mons[0], q.get('pat'), party[active]); }
    if (q.get('leave') && i === 90) leaveDungeon();
    if (q.get('enter') && i === 30) enterDungeon(+q.get('enter'));
    if (q.get('clearall') && i === 80) for (const m of [...mons]) monDie(m);
    if (q.get('orbs') && i === 59) party[2].orbs = +q.get('orbs');
    if (q.get('stealth') && i === 59) { party[2].stealth = 4; party[2].ambush = 2; }
    if (q.get('marks') && i === 59 && mons[0]) { mons[0].tg.marks = +q.get('marks'); mons[0].tg.markT = 4; }
    if (q.get('skill') && i === 60) { noCD = true; simHold = +q.get('hold') || 0; useSkill(party[active], q.get('skill')); noCD = !!q.get('nocd'); }
    if (q.get('parry') && i === 60 + 15) { const m0 = mons[0]; if (m0) hurtPlayer(party[active], 34, m0.x, m0.z); }
    botStep(1 / 60);
    update(1 / 60);
  }
  botReport();
}
// 확인용: ?gtest=1 대장간 버튼을 차례로 눌러 본다
if (location.search.includes('gtest')) {
  const press = (tab, n = 1) => { SM.tab = tab; renderSmith(); for (let i = 0; i < n; i++) { const b = [...document.querySelectorAll('#wSmith button')].find(x => !x.disabled); if (b) b.click(); } };
  toggleWin('wSmith', true); press('강화', 12); press('숨은 옵션', 30); press('분해'); press('상점'); renderSmith();
  console.log('GTEST enh=' + party[0].eq['무기'].enh + ' awaken=' + MATS.awaken + ' bag=' + BAG.length + ' gold=' + MATS.gold);
}
if (location.search.includes('tritest')) {
  let n = 0, empty = [];
  for (const cls of ['berserker', 'hawk', 'assassin']) { const kit = kitOf(cls); for (const k in kit.info) kit.info[k].tri.forEach((tier, ti) => tier.forEach(([nm, d]) => { n++; const p = triOf(cls, k, nm, d); if (!Object.keys(p).length) empty.push(`${cls}:${k}${ti + 1} ${nm} - ${d}`); })); }
  console.log('TRITEST total=' + n + ' empty=' + empty.length + '\n' + empty.join('\n'));
}
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now;
  update(dt * GAME_SPEED);
  composer.render();
  drawHUD(); drawWorldHUD(hctx, innerWidth, innerHeight);
  uiUpdate(dt * GAME_SPEED); uiWorld();
}
requestAnimationFrame(loop);
// 확인용: ?mlist = 몬스터 프레임을 한 장에 늘어놓는다
if (location.search.includes('mlist')) {
  const sc = 3, cv = document.createElement('canvas'), keys = (new URLSearchParams(location.search).get('mlist') || '').split(',').filter(k => MON_FRAMES[k]).concat([]).filter((k, i, a) => a.length) .length ? new URLSearchParams(location.search).get('mlist').split(',').filter(k => MON_FRAMES[k]) : Object.keys(MON_FRAMES), fw = 80 * S * sc, fh = 92 * S * sc / 2;
  cv.width = fw / 2 * 6 + 40; cv.height = keys.length * fh + 40; Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 99, background: '#3a3a44' });
  document.body.appendChild(cv); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#3a3a44'; g.fillRect(0, 0, cv.width, cv.height);
  keys.forEach((k, row) => { const F = MON_FRAMES[k]; [...F.idle, ...F.move, ...F.wind, ...F.act].forEach((f, i) => { const s = k === 'boss' ? sc / 2 : sc / 2; g.drawImage(f.c, 10 + i * fw / 2, 10 + row * fh, f.c.width * s, f.c.height * s); }); });
}
