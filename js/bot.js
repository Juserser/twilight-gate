'use strict';
// 플레이 테스트 봇 (?bot=1): 가까운 적에게 붙어 기본 공격 · 스킬을 돌리고, 바닥 예고 안이면 대시로 피하고, 방을 정리하면 출구로 간다
// 결과는 콘솔에 BOT 줄로 남긴다 (방별 시간 · 쓰러짐 · 받은 피해)

const BOT = { on: location.search.includes('bot'), log: [], roomT: 0, room: -1, taken: 0, hpPrev: 0, skillI: 0, castT: 0, done: false };
const BOT_ORDER = ['G', 'V', 'C', 'Z', 'X', 'R', 'F', 'E', 'Q'];
function botDanger(A) {
  for (const m of mons) {
    if (m.state !== 'wind') continue;
    const P = PAT[m.pat], left = P.wind - m.t; if (left > 0.45) continue;
    const k = m.pat;
    let hit = false;
    if (k === 'lunge') hit = inRect(m.x, m.z, m.aim[0], m.aim[1], 5.2, 1.3)(A);
    else if (k === 'roots') hit = inRect(m.x, m.z, m.aim[0], m.aim[1], 7, 1.4)(A);
    else if (k === 'lines') hit = m.fan.some(([x, z]) => inRect(m.x, m.z, x, z, 10, 1.3)(A));
    else if (k === 'smack') hit = inCircle(m.px, m.pz, 1.8)(A);
    else if (k === 'dive') hit = inCircle(m.px, m.pz, 1.3)(A);
    else if (k === 'boulder') hit = inCircle(m.px, m.pz, 1.6)(A);
    else if (k === 'slam') hit = inCircle(m.x, m.z, 2.6)(A);
    else if (k === 'ring') hit = Math.hypot(A.x - m.x, A.z - m.z) < 6.8;
    else if (k === 'mawring' || k === 'bell' || k === 'nova') { const d = Math.hypot(A.x - m.x, A.z - m.z); hit = d > 2.5 && d < 8; }
    else if (k === 'gslam' || k === 'icering' || k === 'stomp' || k === 'tail' || k === 'scythes') hit = Math.hypot(A.x - m.x, A.z - m.z) < 4.5;
    else if (k === 'sweep') hit = inCone(m.x, m.z, m.aim[0], m.aim[1], 5.5, Math.PI * 2 / 3)(A);
    if (hit) return m;
  }
  return null;
}
// 원하는 세계 방향을 WASD 키로 바꾼다 (inputDir의 반대)
// 막히면 잠깐 옆으로 비켜 간다
function botMove(dx, dz) {
  const A = party[active];
  if (BOT.side > 0) { const t = dx; dx = -dz * BOT.sd; dz = t * BOT.sd; }
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), [rx, rz] = camRight(), iz = dx * fx + dz * fz, ix = dx * rx + dz * rz;
  keys.KeyW = iz > 0.38; keys.KeyS = iz < -0.38; keys.KeyD = ix > 0.38; keys.KeyA = ix < -0.38;
}
function botStop() { keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false; }
function botStep(dt) {
  if (!BOT.on || BOT.done) return;
  const A = party[active];
  // 기록
  if (DUN.on && DUN.room !== BOT.room) { if (BOT.room >= 0) BOT.log.push(`방${BOT.room + 1} ${BOT.roomT.toFixed(1)}s`); BOT.room = DUN.room; BOT.roomT = 0; }
  BOT.roomT += dt; BOT.side = (BOT.side || 0) - dt;
  { const mv = Math.hypot(A.x - (BOT.px ?? A.x), A.z - (BOT.pz ?? A.z)); BOT.stuck = (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD) && mv < dt * 0.8 ? (BOT.stuck || 0) + dt : 0; BOT.px = A.x; BOT.pz = A.z; if (BOT.stuck > 0.4) { BOT.side = 0.7; BOT.sd = Math.random() < 0.5 ? 1 : -1; BOT.stuck = 0; } } if (A.hp < BOT.hpPrev) BOT.taken += BOT.hpPrev - A.hp; BOT.hpPrev = A.hp;
  if (DUN.result && !BOT.done) {
    BOT.done = true; BOT.log.push(`방${BOT.room + 1} ${BOT.roomT.toFixed(1)}s`);
    console.log(`BOT ${A.key} ${DUN.d.name} 등급=${DUN.result.grade} 시간=${DUN.result.t.toFixed(1)}s 쓰러짐=${DUN.deaths} 받은피해=${Math.round(BOT.taken)} (최대 ${A.max}) 레벨=${player.level} | ${BOT.log.join(', ')}`);
    botStop(); return;
  }
  if (A.down || DUN.fadeDir) { botStop(); return; }
  if (A.hp < A.max * 0.35) useItem('hp');
  if (A.mp < 60) useItem('mp');
  // 출구
  if (DUN.on && DUN.cleared && exitGate.open) { const wx = Math.abs(A.z - exitGate.z) > 1 && A.x < 7.5 ? 6.5 : exitGate.x, dx = wx - A.x, dz = exitGate.z - A.z, d = Math.hypot(dx, dz) || 1; botMove(dx / d, dz / d); return; }
  const tg = mons.filter(m => m.state !== 'dead' && m.state !== 'spawn').sort((a, b) => Math.hypot(a.x - A.x, a.z - A.z) - Math.hypot(b.x - A.x, b.z - A.z))[0];
  if (!tg) { botStop(); return; }
  const dx = tg.x - A.x, dz = tg.z - A.z, d = Math.hypot(dx, dz) || 1;
  // 피하기
  const dm = botDanger(A);
  if (dm && A.state !== 'skill' && A.dashCd <= 0) {
    let ax = A.x - dm.x, az = A.z - dm.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
    if (dm.pat === 'lunge' || dm.pat === 'roots' || dm.pat === 'lines') { const a = dm.pat === 'lines' ? dm.fan[1] : dm.aim; ax = -a[1]; az = a[0]; }
    botMove(ax, az); dash(A); return;
  }
  const want = A.key === 'hawk' ? 7 : 1.6 + tg.def.r;
  // 스킬 (쿨 · 마나 되는 것 중 우선순위대로)
  BOT.castT -= dt;
  if (A.state !== 'skill' && BOT.castT <= 0 && d < (A.key === 'hawk' ? 11 : want + 2.5)) {
    const kit = kitOf(A.key);
    for (const k of BOT_ORDER) {
      if (k === 'G' ? false : (A.cd[k] > 0 || A.mp < kit.mana[k])) continue;
      if (k === 'G') { const ok = A.key === 'berserker' ? A.idg >= 100 && !(A.berserk > 0) : A.key === 'hawk' ? A.idg >= 100 && !(A.lib > 0) && !(A.rest > 0) : (A.orbs >= 3 && !(A.stealth > 0)); if (!ok) continue; }
      if (k === 'V' && !(tg.def.boss || tg.def.elite)) continue;
      faceTo(A, tg); simHold = k === 'C' ? 1.6 : 0.9; useSkill(A, k);
      if (A.state === 'skill') { BOT.castT = 0.25; return; }
    }
  }
  if (d > want) { botMove(dx / d, dz / d); }
  else if (A.key === 'hawk' && d < want - 2.5 && Math.abs(A.x) < 7 && Math.abs(A.z - 1) < 7) { botMove(-dx / d, -dz / d); }
  else { botStop(); faceTo(A, tg); }
  if (d < want + 1.2) attack(A);
}
function botReport() {
  if (!BOT.on || BOT.done) return;
  const A = party[active];
  console.log(`RAID t=${typeof RAID !== 'undefined' ? RAID.t.toFixed(0) : 0} 부활=${typeof RAID !== 'undefined' ? RAID.revives : 0} 보호막=${typeof RAID !== 'undefined' ? RAID.shieldT.toFixed(1) : 0} 기둥=${typeof RAID !== 'undefined' ? RAID.pillars.map(p => p.dead ? 'X' : Math.round(p.charge) + '/' + p.hp).join(' ') : ''}`);
  console.log(`BOT-PROGRESS ${A.key} 방=${DUN.room + 1} 정리=${DUN.cleared} 남은적=${mons.filter(m => m.state !== 'dead').map(m => m.kind + ':' + Math.round(m.hp) + ':' + m.state).join(' ')} hp=${Math.round(A.hp)}/${A.max} 위치=${A.x.toFixed(1)},${A.z.toFixed(1)} 상태=${A.state} 쓰러짐=${DUN.deaths} | ${BOT.log.join(', ')}`);
}
