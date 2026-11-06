'use strict';
// 트라이포드 효과: 스킬창에서 고른 선택지의 설명문을 읽어 효과로 바꾼다 (수치는 설명 그대로)
//  피해 · 범위 · 속도 · 재사용 · 받는 피해 감소 · 무력화 · 치명 · 흡혈 · 지속 피해 · 기절/속박 · 끝 폭발 · 검기 · 이동 속도 · 게이지
//  특정 부위만 세지는 선택지(마무리 +80% 등)는 스킬 전체 피해로 나눠 반영한다 (부위 비중 약 1/3)

const PART = /마무리|폭발 피해|착지|강화 화살|반격 피해|파고들기|역수|내리찍기|X |쓰기|감전|표식당|표식 폭발/;
function parseTri(desc) {
  const f = {}, num = re => { const m = desc.match(re); return m ? +m[1] : 0; };
  let v;
  // 피해 증가 (받는 피해 제외)
  if ((v = num(/(?<!받는 )피해 \+(\d+)%/))) f.dmg = PART.test(desc) ? v / 100 / 3 : v / 100;
  if ((v = num(/추가 \+(\d+)%/))) f.dmg = (f.dmg || 0) + v / 100 / 3;
  if ((v = num(/(?:지진파로|칼날 3개|파고들기|강화 화살|하늘 가르기)[^+]*\+(\d+)%/)) && !f.dmg) f.dmg = v / 1000;
  // 끝에 터지는 폭발 · 추가 일격
  if ((v = desc.match(/반경 (\d+)m 폭발 (\d+)%/))) f.boom = [+v[1], +v[2]];
  else if ((v = desc.match(/폭발 (\d+)%/))) f.boom = [3, +v[1]];
  else if ((v = desc.match(/(?:지진파로|중심 폭발|큰 화살 1발|빛의 칼날 3개)[^%]*?(\d+)%/))) f.boom = [3.5, +v[1]];
  else if ((v = desc.match(/(?:회전 베기 1타 추가|한 번 더 베기|추가 피해|더 베기)[^%]*?(\d+)%/))) f.boom = [2.6, +v[1]];
  if ((v = desc.match(/검기 (\d+)개[^%]*?(\d+)%/))) f.wave = [+v[1], +v[2]];
  // 지속 피해
  if ((v = desc.match(/(출혈|화상|중독)[^%]*?(\d+)초[^%]*?초당 (\d+)%/))) f.dot = [+v[3], +v[2], v[1]];
  else if ((v = desc.match(/(출혈|화상|중독|장판)[^%]*?초당 (\d+)%/))) f.dot = [+v[2], 3, v[1]];
  if ((v = desc.match(/(\d+)초 (?:번개 장판|둔화 장판)/))) f.dot = f.dot || [60, +v[1], '장판'];
  // 재사용
  if ((v = num(/(?:쿨|재사용) -(\d+)초/))) f.cd = -v;
  if (/쿨 \+(\d+)초/.test(desc)) f.cd = num(/쿨 \+(\d+)초/);
  // 속도
  if ((v = num(/(?:시전|공격|연사|타격 간격|비행|던지기|도약) ?(?:속도)? ?[+-](\d+)%/))) f.spd = v / 100;
  if ((v = num(/(?:준비 동작|시간|준비|차지 시간|시전|동작) -?(\d+)% ?(?:단축|빠르게)?/)) && !f.spd) f.spd = v / 100;
  // 범위 · 거리
  if ((v = num(/(?:범위|판정|폭|반경|각도|거리|사거리|판정 폭) \+(\d+)%/))) f.range = Math.min(0.6, v / 100);
  if (/(?:폭|범위|판정 폭) 2배/.test(desc)) f.range = 0.5;
  // 받는 피해 감소
  if ((v = num(/받는 피해 -(\d+)%/))) f.dr = v / 100;
  // 무력화 · 치명
  if ((v = num(/무력화 \+(\d+)%/))) f.stag = v / 100;
  if (/무력화 상/.test(desc)) f.stag = Math.max(f.stag || 0, 0.5);
  if ((v = num(/무력화 (\d)배/))) f.stag = v - 1;
  if ((v = num(/치명타 확률 \+(\d+)%/))) f.crit = v / 100;
  if ((v = num(/치명(?:타)? 피해 \+(\d+)%/))) f.cdmg = v / 100;
  // 흡혈
  if ((v = desc.match(/적중마다 생명력 ([\d.]+)% 회복/))) f.heal = +v[1] / 100;
  else if ((v = desc.match(/생명력 ([\d.]+)% 회복/))) f.healOnce = +v[1] / 100;
  // 기절 · 속박 · 둔화
  if ((v = num(/(\d)초 (?:기절|속박)/)) || (v = num(/속박 (\d)초/))) f.stun = v;
  if ((v = num(/(?:이동|속도) -(\d+)%/))) f.slow = v / 100;
  // 이동 속도 버프 (끝난 뒤 · 시전 중)
  if ((v = desc.match(/(\d)초(?:간)? 이동 속도 \+(\d+)%/))) f.ms = [+v[1], +v[2] / 100];
  else if ((v = num(/이동 (?:속도 )?(\d+)%/)) && v > 50) f.move = v / 100;
  // 게이지
  if ((v = num(/게이지 (?:획득 )?(\d)배/))) f.gauge = v;
  if ((v = num(/게이지 \+(\d+)/))) f.gaugeAdd = v;
  // 표식 · 구슬
  if ((v = num(/표식 \+(\d)/))) f.mark = v;
  if (/표식 5개 즉시/.test(desc)) f.mark = 5;
  if ((v = num(/구슬 \+(\d)/))) f.orb = v;
  return f;
}
// 지금 고른 트라이포드 효과를 합친다 (직업 · 스킬별로 캐시)
const triCache = {};
function triFx(c, key) {
  const kit = kitOf(c.key), inf = kit && kit.info[key]; if (!inf || !inf.tri.length) return null;
  const ts = tsel(c.key, key, inf.tri.length), owned = typeof triGrade === 'function', sig = c.key + key + ts.join() + (owned ? '|' + ts.map((o, i) => triGrade(c.key, key, i, o)).join() : '');
  if (triCache[sig]) return triCache[sig];
  const f = { dmg: 0, range: 0, spd: 0, dr: 0, stag: 0, crit: 0, cdmg: 0, cd: 0, names: [] };
  inf.tri.forEach((tier, i) => {
    const o = tier[ts[i]]; if (!o) return; let p = triOf(c.key, key, o[0], o[1]);
    if (owned) { const g = triGrade(c.key, key, i, ts[i]); if (g < 0) return; p = scaleTri(p, TGR[g].mul); }
    f.names.push(o[0]);
    for (const k in p) { if (typeof p[k] === 'number' && k in f) f[k] += p[k]; else f[k] = p[k]; }
  });
  return (triCache[sig] = f);
}
// 지금 시전 중인 스킬의 트라이포드 (기본 공격 · 대시 후속은 없음)
function curTri(c) { return c && c.state === 'skill' && c.sk && kitOf(c.key) && kitOf(c.key).info[c.sk.id] ? triFx(c, c.sk.id) : null; }

// ---- 지속 피해 ----
const dots = [];
function addDot(tg, pct, dur, kind) {
  const d = dots.find(x => x.tg === tg && x.kind === kind);
  if (d) { d.t = 0; d.dur = dur; return; }
  dots.push({ tg, pct, dur, kind, t: 0, tick: 0 });
}
const DOTC = { 출혈: '#ff5a5a', 화상: '#ff9a40', 중독: '#9aff6a', 장판: '#c8a0ff' };
function updateDots(dt) {
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i]; d.t += dt; d.tick += dt;
    if (!d.tg.alive() || d.t > d.dur) { dots.splice(i, 1); continue; }
    if (Math.random() < dt * 10) glow.emit({ x: d.tg.x + (Math.random() - 0.5) * 0.6, y: d.tg.y() + 0.5 + Math.random(), z: d.tg.z, vy: 0.6, life: 0.4, c: lc(DOTC[d.kind] || '#ffffff').map(v => v * 2), size: PX });
    if (d.tick >= 1) { d.tick -= 1; hitTarget(d.tg, P(d.pct), d.tg.x, d.tg.z, DOTC[d.kind] || '#ffffff', { stop: 0, shake: 0, quiet: true, numColor: DOTC[d.kind], sg: 0, noTri: true }); }
  }
}
// 타격마다 (hitTarget에서 부른다): 흡혈 · 지속 피해 · 기절 · 둔화 · 표식 · 구슬
function triOnHit(c, tg) {
  const f = curTri(c); if (!f) return;
  const sk = c.sk; sk.triHit = sk.triHit || new Set();
  if (f.heal) c.hp = Math.min(c.max, c.hp + c.max * f.heal);
  if (sk.triHit.has(tg)) return; sk.triHit.add(tg);
  if (f.dot) addDot(tg, f.dot[0], f.dot[1], f.dot[2]);
  if (f.stun && tg.mon) { tg.mon.rootT = Math.max(tg.mon.rootT, f.stun); if (tg.mon.state === 'wind') monInterrupt(tg.mon, true); }
  if (f.slow && tg.mon) tg.mon.slowT = Math.max(tg.mon.slowT, 3);
  if (f.mark && c.key === 'hawk') addMark(tg, f.mark);
  if (f.orb && c.key === 'assassin') gainOrb(c, f.orb);
  if (f.gaugeAdd && c.key === 'berserker' && !(c.berserk > 0)) c.idg = Math.min(100, c.idg + f.gaugeAdd);
  if (f.healOnce && !sk.healed) { sk.healed = true; c.hp = Math.min(c.max, c.hp + c.max * f.healOnce); }
}
// 스킬이 끝날 때 (endSkill에서 부른다): 끝 폭발 · 검기 · 이동 속도
function triOnEnd(c, sk) {
  const kit = kitOf(c.key); if (!kit || !kit.info[sk.id]) return;
  const f = triFx(c, sk.id); if (!f) return;
  if (f.ms) { c.msT = f.ms[0]; c.msV = f.ms[1]; }
  if (f.resetQ) c.cd.Q = 0;
  if (f.hop) { const [rx, rz] = camRight(); c.x -= rx * c.face * f.hop; c.z -= rz * c.face * f.hop; collide(c, 0.35); aGhost(c, [0.6, 0.9, 1.2], 0.4); }
  if (!sk.triHit) return;   // 한 번도 안 맞혔으면 폭발 · 검기는 없음
  const col = { berserker: [2.4, 1.6, 0.8], hawk: [0.9, 2.4, 2.0], assassin: [2.4, 0.8, 2.2] }[c.key];
  if (f.boom) {
    const tg = [...sk.triHit].find(t => t.alive()) || null, [bx, bz] = tg ? [tg.x, tg.z] : fwdPt(c, 2);
    shockwave(bx, bz, f.boom[0] + 0.5, col, 0.4); embers(bx, 0.6, bz, 24, col, 6); dustRing(bx, bz, 14, 3, '#9c8466'); shake = Math.max(shake, 0.3);
    for (const t of targets) if (t.alive() && t.y() < 3 && Math.hypot(t.x - bx, t.z - bz) < f.boom[0] + t.r) hitTarget(t, P(f.boom[1]), bx, bz, '#ffe0a0', { stop: 0.05, shake: 0.3, sg: 10 });
  }
  if (f.wave) {
    const [rx, rz] = camRight();
    for (let i = 0; i < f.wave[0]; i++) {
      const a = i / f.wave[0] * TAU, dx = Math.cos(a), dz = Math.sin(a), fc = (dx * rx + dz * rz) >= 0 ? 1 : -1;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), addMat(...col, 0.85, ARC[3])); m.scale.x = fc; scene.add(m); billboards.push(m);
      m.position.set(c.x + dx, 1.1, c.z + dz);
      projs.push({ kind: 'wave', mesh: m, f: fc, vx: dx * 11, vz: dz * 11, life: 0.5, dmg: P(f.wave[1]), color: '#ffe0c0', hit: new Set() });
    }
  }
}

// ---- 설명문으로는 못 읽는 선택지: 직접 정한 효과 (행동을 바꾸는 선택지는 가장 가까운 이득으로 근사) ----
const TRI_OVR = {
  'berserker:Q:파고들기': { dmg: 0.15, range: 0.2 }, 'berserker:E:연속 돌진': { cd: -3 }, 'berserker:R:끌어당기기': { pull: 5 }, 'berserker:R:연장': { dmg: 0.25 },
  'berserker:F:연쇄 여진': { dmg: 0.2, boom: [6, 120] }, 'berserker:Z:추가 난무': { dmg: 0.2 }, 'berserker:X:넓은 자세': { dr: 0.3 }, 'berserker:X:전방위 방어': { dr: 0.5 },
  'berserker:X:반격 연쇄': { dmg: 0.25 }, 'berserker:C:대지 해방': { range: 0.5 }, 'berserker:C:즉발': { spd: 0.6 }, 'berserker:C:분노의 차지': { gaugeAdd: 20 },
  'hawk:Q:반동 도약': { hop: 2 }, 'hawk:Q:세 갈래': { dmg: 0.5 }, 'hawk:E:세 번째 부리': { dmg: 0.18 }, 'hawk:E:귀환의 바람': { boom: [3, 200] },
  'hawk:R:먼 하늘': { range: 0.2 }, 'hawk:R:무거운 비': { slow: 0.5 }, 'hawk:R:표식의 비': { mark: 1 }, 'hawk:R:지속': { dmg: 0.5 }, 'hawk:R:폭풍우': { boom: [4, 600], stun: 1 },
  'hawk:F:빠른 설치': { spd: 0.5 }, 'hawk:F:세 번째 덫': { cd: -3 }, 'hawk:F:연쇄 폭발': { dmg: 0.3 }, 'hawk:F:매 미끼': { stun: 1 },
  'hawk:Z:넓은 탄막': { range: 0.3, dmg: 0.2 }, 'hawk:Z:연장 사격': { dmg: 0.5 }, 'hawk:Z:표식 집중': { mark: 1 }, 'hawk:Z:매 협공': { dmg: 0.3 },
  'hawk:X:높은 도약': { ms: [2, 0.2] }, 'hawk:X:방향 도약': { ms: [2, 0.2] }, 'hawk:X:넓은 부채': { dmg: 0.4 }, 'hawk:X:회피 장전': { resetQ: true }, 'hawk:X:바람 장벽': { dr: 0.3 },
  'hawk:X:폭풍 도약': { boom: [3, 480] }, 'hawk:X:연속 도약': { cd: -4 }, 'hawk:C:과충전': { dmg: 0.07 }, 'hawk:C:연쇄 번개': { boom: [3, 200] }, 'hawk:C:천둥의 왕': { dmg: 0.2 }, 'hawk:C:폭풍의 눈': { dmg: 0.15 },
  'assassin:Q:긴 그림자': { range: 0.3 }, 'assassin:Q:되돌아 돌파': { dmg: 0.5 }, 'assassin:Q:그림자 낙인': { boom: [2, 400] }, 'assassin:E:멀리 던지기': { range: 0.5 }, 'assassin:E:부채 펼치기': { dmg: 0.3 },
  'assassin:E:긴 박힘': { cd: -1 }, 'assassin:E:연기 파고들기': { boom: [3, 200] }, 'assassin:E:그림자 엮기': { dmg: 0.3 }, 'assassin:R:오래 가는 그림자': { dmg: 0.3 }, 'assassin:R:도발': { dr: 0.2 },
  'assassin:R:더 짙은 그림자': { dmg: 0.35 }, 'assassin:R:그림자 맞바꾸기': { ms: [3, 0.3] }, 'assassin:R:두 그림자': { dmg: 0.4 }, 'assassin:R:자폭': { boom: [4, 600] },
  'assassin:F:넓은 연막': { range: 0.35 }, 'assassin:F:진한 독': { dot: [120, 5, '중독'] }, 'assassin:F:멀리 던지기': { range: 0.3 }, 'assassin:F:숙마': { ms: [5, 0.2] }, 'assassin:F:눈멀기': { dr: 0.15 },
  'assassin:F:발밑 연막': { hop: 2.5 }, 'assassin:F:독무 폭발': { boom: [4, 400] }, 'assassin:F:그림자 둥지': { dmg: 0.1 }, 'assassin:Z:넓은 찌르기': { range: 0.4 }, 'assassin:Z:빠른 발동': { spd: 0.25 },
  'assassin:Z:작별 베기': { boom: [5, 1000], dmg: -0.2 }, 'assassin:X:긴 사슬': { range: 0.5 }, 'assassin:X:처형자': { dmg: 0.2 }, 'assassin:X:끌어내기': { range: 0.3 }, 'assassin:X:두 번째 사슬': { boom: [2.5, 400] },
  'assassin:C:넓은 무도': { range: 0.5 }, 'assassin:C:빠른 발': { spd: 0.4 }, 'assassin:C:무도의 입장': { dmg: 0.2 }, 'assassin:C:고요한 죽음': { dmg: 0.1 },
};
const _parseTri = parseTri;
// 직업 · 스킬 · 이름으로 먼저 찾고, 없으면 설명문을 읽는다
function triOf(cls, key, name, desc) { return TRI_OVR[`${cls}:${key}:${name}`] || _parseTri(desc); }
// 시전 시작 (useSkill에서 부른다): 끌어당기기
function triOnStart(c, key) {
  const f = triFx(c, key); if (!f || !f.pull) return;
  for (const m of mons) { if (m.state === 'dead' || m.def.heavy) continue; const dx = c.x - m.x, dz = c.z - m.z, d = Math.hypot(dx, dz); if (d < f.pull && d > 1.2) { m.x += dx / d * (d - 1.2) * 0.7; m.z += dz / d * (d - 1.2) * 0.7; } }
  shockwave(c.x, c.z, f.pull, [1.4, 1.8, 2.6], 0.4);
}
