'use strict';
// 기본 공격 · 캐릭터 이동 · 프레임 갱신(update)

function meleeHit(c, range, dmg, color) {
  const [rx, rz] = camRight(), f = c.face;
  for (const tg of targets) {
    if (!tg.alive() || tg.y() > 1.6) continue;
    const dx = tg.x - c.x, dz = tg.z - c.z;
    if (Math.hypot(dx, dz) < range + tg.r && (dx * rx + dz * rz) * f > -0.3) hitTarget(tg, dmg, c.x, c.z, color);
  }
}
function fireAttack(c) {
  const [rx, rz] = camRight(), f = c.face;
  if (c.key === 'berserker') {
    // 대검 3연격 100 / 110 / 180% · 광폭화 중 4타: 6m 날아가는 핏빛 검기 220%
    const i = c.combo || 0, col = berserkCol([1.5, 1.7, 2.1]);
    stepFwd(c, i === 2 ? 0.5 : 0.35);
    if (i < 2) {
      spawnSlash({ x: c.x, y: 1.15, z: c.z, size: 3.4, rot: i ? -8 : 14, flipV: i === 1, face: f, color: col, life: 0.18 });
      hitArea(c, { range: 2.6, cone: true, dmg: P(i ? 110 : 100), stop: 0.03, shake: 0, color: '#cfe8ff' });
    } else if (i === 2) {
      spawnSlash({ x: c.x, y: 1.45, z: c.z, size: 4.4, rot: 62, face: f, color: col, life: 0.24, grow: 0.12 });
      spawnSlash({ x: c.x, y: 1.3, z: c.z, size: 3.8, rot: 50, face: f, color: col.map(v => v * 0.5), life: 0.2 });
      const [fx, fz] = fwdPt(c, 1.6); shockwave(fx, fz, 1.8, [1.8, 1.9, 2.2], 0.3); dustRing(fx, fz, 14, 3, '#8a7058');
      hitArea(c, { range: 2.6, cone: true, dmg: P(180), stop: 0.06, shake: 0.15, color: '#cfe8ff' });
    } else {
      spawnSlash({ x: c.x, y: 1.2, z: c.z, size: 4, rot: 0, face: f, color: [2.6, 0.5, 0.4], life: 0.2 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), addMat(2.6, 0.45, 0.35, 0.95, ARC[3]));
      m.position.set(c.x + rx * f, 1.2, c.z + rz * f); scene.add(m); billboards.push(m);
      projs.push({ kind: 'wave', mesh: m, f, vx: rx * f * 10, vz: rz * f * 10, life: 0.6, dmg: P(220), color: '#ff8a7a', hit: new Set() });
      shake = Math.max(shake, 0.2);
    }
  } else if (c.key === 'hawk') {
    hawkShot(c);
  } else assSlash(c);
}
function collide(o, r) {
  for (const ob of obstacles) {
    const dx = o.x - ob.x, dz = o.z - ob.z, rr = r + ob.r;
    if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
    const d = Math.hypot(dx, dz); if (d < rr && d > 1e-4) { o.x = ob.x + dx / d * rr; o.z = ob.z + dz / d * rr; }
  }
  const ps = AREA === 'town' ? pondSDF(o.x, o.z) : 1;
  if (ps < 0.25) { const e = 0.01, gx = (pondSDF(o.x + e, o.z) - ps) / e, gz = (pondSDF(o.x, o.z + e) - ps) / e, gl = Math.hypot(gx, gz) || 1; o.x += gx / gl * (0.25 - ps); o.z += gz / gl * (0.25 - ps); }
  o.x = clamp(o.x, -11, 11); o.z = clamp(o.z, CLIFF_Z + 0.5, 11);
}

function updateChar(c, dt, ctrl) {
  const [rx, rz] = camRight();
  c.inv -= dt; c.dashCd -= dt; c.hurtFlash -= dt;
  c.postDash = (c.postDash || 0) - dt; c.thrustCd = (c.thrustCd || 0) - dt; c.exhaust = Math.max(0, (c.exhaust || 0) - dt);
  c.aimCd = (c.aimCd || 0) - dt; c.msT = (c.msT || 0) - dt; c.windT = (c.windT || 0) - dt;
  // 넉백
  if (Math.abs(c.kx) + Math.abs(c.kz) > 0.05) {
    c.x += c.kx * dt; c.z += c.kz * dt; const k = Math.exp(-9 * dt); c.kx *= k; c.kz *= k; collide(c, 0.35);
  }
  // 쓰러짐
  if (c.down) {
    c.downT += dt;
    c.mesh.rotation.z = c.face * Math.PI / 2 * Math.min(1, c.downT * 6);
    c.mat.map = c.face > 0 ? c.fr.idle[0].r : c.fr.idle[0].l;
    c.mat.emissive.setScalar(0); c.mesh.visible = true;
    c.mesh.position.set(c.x, -3.5 * PX, c.z); c.sh.position.set(c.x, 0.015, c.z);
    if (c.downT > 3) {
      c.down = false; c.hp = c.max; c.inv = 1.5; c.mesh.rotation.z = 0; c.state = 'idle';
      for (let i = 0; i < 30; i++) glow.emit({ x: c.x + (Math.random() - 0.5) * 0.8, y: Math.random() * 2, z: c.z, vy: 1 + Math.random() * 1.5, life: 1, c: [1.2, 2.6, 1.0], size: PX * 1.2 });
      floaters.push({ x: c.x, y: 2.6, z: c.z, t: 0, text: '부활!', crit: false, vx: 0, color: '#9aff9a' });
    }
    return;
  }
  for (const k in c.cd) c.cd[k] = Math.max(0, c.cd[k] - dt * (c.berserk > 0 ? 1.5 : 1));
  if (c.key === 'hawk' && c.fCh < 2 && c.cd.F <= 0) { c.fCh++; if (c.fCh < 2) c.cd.F = HSKILLS.F.cd; }
  if (c.state !== 'skill' && ((c.y || 0) > 0 || (c.vy || 0) > 0)) {
    c.vy -= 24 * dt; c.y += c.vy * dt;
    if (c.y <= 0) { c.y = 0; c.vy = 0; dustRing(c.x, c.z, 10, 2, '#9c8466'); }
  }
  c.mp = Math.min(c.mpMax, c.mp + 12 * dt); c.charm = Math.max(0, c.charm - dt);
  if (c.state === 'skill') { updateSkill(c, dt, ctrl); return; }
  if (ctrl && c.key !== 'berserker' && mouseL && locked && c.state !== 'atk' && !(c.dash > 0)) attack(c);
  let moving = false;
  if (c.dash > 0) {
    c.dash -= dt; if (c.dash <= 0) c.postDash = 0.3; c.x += c.dx * 14 * dt; c.z += c.dz * 14 * dt; collide(c, 0.35);
    const sd = c.dx * rx + c.dz * rz; if (sd > 0.15) c.face = 1; else if (sd < -0.15) c.face = -1;
    c.ghostT -= dt; if (c.ghostT <= 0) { c.ghostT = 0.035; spawnGhost(c); }
    moving = true;
  } else if (ctrl && (c.state !== 'atk' || c.key === 'hawk')) {
    const [mx, mz, ok] = inputDir();
    if (ok) {
      moving = true;
      const spd = 4.2 * (c.exhaust > 0 ? 0.7 : c.berserk > 0 ? 1.2 : 1) * (c.lib > 0 ? 1.25 : 1) * (c.windT > 0 ? 1.4 : 1) * (c.stealth > 0 ? 1.3 : 1) * (c.msT > 0 ? 1 + c.msV : 1) * (c.state === 'atk' ? 0.7 : 1) * (typeof chillMove === 'function' ? chillMove(c) : 1);
      c.x += mx * spd * dt; c.z += mz * spd * dt; collide(c, 0.35);
      if (c.state !== 'atk') { const sd = mx * rx + mz * rz; if (sd > 0.15) c.face = 1; else if (sd < -0.15) c.face = -1; }
    }
  }
  // 슬라임과 겹치지 않게
  if (ctrl) for (const m of mons) {
    if (m.state === 'dead' || m.state === 'spawn' || m.y + m.lift > 0.8) continue;
    const dx = c.x - m.x, dz = c.z - m.z, d = Math.hypot(dx, dz), rr = m.def.r + 0.35;
    if (d < rr && d > 1e-4) { c.x = m.x + dx / d * rr; c.z = m.z + dz / d * rr; collide(c, 0.35); }
  }
  const bzE = c.berserk > 0 ? 0.22 + 0.1 * Math.sin(uTime.value * 10) : 0;
  c.mat.emissive.setRGB(c.hurtFlash > 0 ? 1 : bzE, c.hurtFlash > 0 ? 0.15 : bzE * 0.1, c.hurtFlash > 0 ? 0.15 : 0);
  c.mesh.visible = !(c.inv > 0 && c.dash <= 0 && Math.floor(uTime.value * 18) % 2);
  if (!ctrl && c.state !== 'atk') { const sd = (FIRE.x - c.x) * rx + (FIRE.z - c.z) * rz; c.face = sd >= 0 ? 1 : -1; }
  if (c.state === 'atk') {
    c.at += dt * (c.berserk > 0 ? 1.2 : 1) * (c.key === 'assassin' ? 1.5 : 1);
    while (c.af < 3 && c.at > ATK_DUR[c.af]) { c.at -= ATK_DUR[c.af]; c.af++; if (c.af === 1 && !c.fired) { c.fired = true; fireAttack(c); } }
    if (c.af >= 3) { c.state = 'idle'; c.t = 0; }
  } else {
    if (moving && c.state !== 'walk') { c.state = 'walk'; c.t = 0; }
    if (!moving && c.state === 'walk') { c.state = 'idle'; c.t = 0; }
  }
  c.t += dt;
  let f;
  if (c.state === 'atk') f = c.fr.atk[Math.min(2, c.af)];
  else if (c.state === 'walk') {
    const i = Math.floor(c.t * 10) % WALK_N; f = c.fr.walk[i];
    if ((i === 0 || i === 3) && c.step !== i) {
      c.step = i;
      for (let k = 0; k < 3; k++) soft.emit({ x: c.x + (Math.random() - 0.5) * 0.3, y: 0.05, z: c.z + 0.05, vx: (Math.random() - 0.5) * 0.8, vy: 0.3 + Math.random() * 0.4, drag: 2, life: 0.5, c: lc('#9c8466'), size: PX * 1.6, grow: 1.2, a: 0.6 });
    }
  } else f = c.fr.idle[Math.floor(c.t * 3) % 4];
  if ((c.y || 0) > 0.05 && c.state !== 'atk') f = c.fr.skill ? c.fr.skill[2] : c.fr.walk[1];
  c.mat.map = c.face > 0 ? f.r : f.l;
  if (c.glowMat) c.glowMat.map = c.face > 0 ? f.gr : f.gl;
  c.mesh.position.set(c.x, -3.5 * PX + (c.y || 0), c.z);
  c.sh.position.set(c.x, 0.015, c.z);
  { const hs = 1 / (1 + (c.y || 0) * 0.4); c.sh.scale.set(0.85 * hs, 1, 0.45 * hs); }
  c.cur = f;
}

function emitAmbient(dt) {
  // 불티
  if (AREA === 'town' && Math.random() < dt * 22) glow.emit({ x: FIRE.x + (Math.random() - 0.5) * 0.6, y: 0.5, z: FIRE.z + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 0.5, vy: 1.2 + Math.random() * 1.4, life: 1.2 + Math.random() * 1.4, drag: 0.4, c1: [3.2, 1.4, 0.35], c2: [1.6, 0.25, 0.05], size: PX, upd: (p, d) => { p.vx += Math.sin(p.t * 4 + p.y * 3) * d * 1.2; } });
  // 연기
  if (AREA === 'town' && Math.random() < dt * 4) soft.emit({ x: FIRE.x + (Math.random() - 0.5) * 0.3, y: 1.4, z: FIRE.z, vx: 0.15 + Math.random() * 0.2, vy: 0.6 + Math.random() * 0.3, life: 3.5, c: lc('#6a6070'), size: PX * 3, grow: 3, a: 0.22, fadeIn: 0.6 });
  // 반딧불
  if (glow.p.filter(p => p.ff).length < 34 && Math.random() < dt * 8) {
    glow.emit({ ff: 1, x: -11 + Math.random() * 22, y: 0.4 + Math.random() * 2.2, z: -9 + Math.random() * 19, life: 6 + Math.random() * 6, c: [1.6, 2.6, 0.7], size: PX * 1.2, fadeIn: 1.5, flick: 3 + Math.random() * 3, ph: Math.random() * 6,
      upd: (p, d) => { p.vx = Math.sin(p.t * 0.7 + p.ph) * 0.35; p.vy = Math.sin(p.t * 1.1 + p.ph * 2) * 0.2; p.vz = Math.cos(p.t * 0.6 + p.ph) * 0.3; } });
  }
  // 낙엽
  if (!(DUN.on && DUN.d.region >= 2) && Math.random() < dt * 1.2) {
    const side = Math.random() < 0.5 ? -1 : 1;
    soft.emit({ x: side * (9 + Math.random() * 5), y: 4.5 + Math.random() * 1.5, z: -8 + Math.random() * 18, life: 7, c: lc(['#c87a3a', '#e0a040', '#8aaa48', '#b8503a'][(Math.random() * 4) | 0]), size: PX * 1.4, fadeIn: 0.5, ph: Math.random() * 6,
      upd: (p, d) => { p.vy = -0.55; p.vx = Math.sin(p.t * 2 + p.ph) * 0.9 - side * 0.25; p.vz = Math.cos(p.t * 1.6 + p.ph) * 0.3; if (p.y < 0.03) { p.y = 0.03; p.vx = p.vz = p.vy = 0; } } });
  }
  // 물가 반짝
  if (AREA === 'town' && Math.random() < dt * 3) { const a = Math.random() * TAU, rr = pondR(a) * Math.random() * 0.8; glow.emit({ x: POND.x + Math.cos(a) * rr, y: 0.05, z: POND.z + Math.sin(a) * rr, vy: 0.1, life: 0.6, c: [2.4, 2.0, 1.6], size: PX }); }
}

function update(dt) {
  uTime.value += dt;

  slowT -= dt; timeScale += ((slowT > 0 ? 0.35 : 1) - timeScale) * Math.min(1, dt * 12);
  if (cutin) { cutin.t += dt; if (cutin.t > 1.2) cutin = null; }
  cineAmt += (cine - cineAmt) * Math.min(1, dt * 6);
  dimW += ((cine ? 0.35 : 0) - dimW) * Math.min(1, dt * 5);
  redW = Math.max(0, redW - dt * 1.2);
  const gdt = hitstop > 0 ? 0 : dt * timeScale;
  hitstop -= dt;
  party.forEach((c, i) => updateChar(c, gdt, i === active));
  updateMons(enemyFreeze > 0 ? 0 : gdt * (enemySlow > 0 ? 0.4 : 1));
  // 광폭화 오라
  {
    const B = party[0];
    if (B.berserk > 0) {
      B.berserk = Math.max(0, B.berserk - gdt);
      if (B.berserk <= 0) { B.exhaust = 3; log('광폭화가 끝났습니다. 3초 동안 탈진합니다.', '전투'); floaters.push({ x: B.x, y: 3, z: B.z, t: 0, text: '탈진', crit: false, vx: 0, color: '#b8b0b0' }); }
      aura.visible = !B.down; aura.position.set(B.x, 1.4 + (B.y || 0), B.z + 0.05);
      aura.material.opacity = 0.5 + 0.2 * Math.sin(uTime.value * 9);
      if (Math.random() < dt * 30) glow.emit({ x: B.x + (Math.random() - 0.5) * 1.2, y: 0.2 + Math.random() * 2.2 + (B.y || 0), z: B.z, vy: 1.2 + Math.random(), vx: (Math.random() - 0.5) * 0.4, life: 0.8, c: [2.8, 0.35, 0.25], size: PX * 1.2 });
      if (Math.random() < dt * 12) soft.emit({ x: B.x + (Math.random() - 0.5), y: 0.4 + Math.random() * 1.8 + (B.y || 0), z: B.z, vy: 1, life: 1, c: lc('#2a0808'), size: PX * 2, grow: 1.5, a: 0.5 });
    } else {
      aura.visible = false;
      if (B.exhaust > 0 && !B.down && Math.random() < dt * 14) soft.emit({ x: B.x + (Math.random() - 0.5) * 0.6, y: 1.5 + Math.random() * 0.7, z: B.z, vy: 0.8, vx: (Math.random() - 0.5) * 0.3, life: 1.2, c: lc('#8a8888'), size: PX * 2, grow: 2, a: 0.45 });
    }
  }
  hurtVig = Math.max(0, hurtVig - dt * 1.6);
  updateFxs(gdt);
  flashW = Math.max(0, flashW - dt * 2.5);
  camZoom += (camZoomT - camZoom) * Math.min(1, dt * 5);
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const g = ghosts[i]; g.t += dt; g.m.material.opacity = 0.55 * (1 - g.t / 0.25);
    if (g.t >= 0.25) { scene.remove(g.m); g.m.material.dispose(); ghosts.splice(i, 1); }
  }

  // 투사체
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i], m = p.mesh;
    m.position.x += p.vx * gdt; m.position.z += p.vz * gdt; p.life -= gdt;
    if (p.kind === 'orb') {
      const cc = [0.5, 1.8, 2.6];
      for (let k = 0; k < 3; k++) glow.emit({ x: m.position.x + (Math.random() - .5) * .2, y: m.position.y + 0.45 + (Math.random() - .5) * .2, z: m.position.z, vy: 0.3, life: 0.4, c: cc, size: PX });
      fxLight.position.set(m.position.x, m.position.y + 0.5, m.position.z); fxFlash = Math.max(fxFlash, 0.5);
    }
    if (p.kind === 'wave') {
      { const sc = 1 + (1 - p.life / 0.6) * 0.35; m.scale.set((p.f || 1) * sc, sc, 1); }
      for (let n = 0; n < 4; n++) glow.emit({ x: m.position.x + (Math.random() - 0.5) * 1.5, y: 0.4 + Math.random() * 2.4, z: m.position.z + (Math.random() - 0.5) * 0.6, vy: 0.5, drag: 2, life: 0.4, c: [3, 0.4, 0.35], size: PX * 1.2 });
      for (const tg of targets) if (tg.alive() && !p.hit.has(tg) && Math.hypot(m.position.x - tg.x, m.position.z - tg.z) < tg.r + 1.4) { p.hit.add(tg); hitTarget(tg, p.dmg, m.position.x - p.vx, m.position.z - p.vz, p.color, { stop: 0.14, shake: 0.5 }); }
      if (p.life <= 0) { scene.remove(m); billboards.splice(billboards.indexOf(m), 1); m.material.dispose(); m.geometry.dispose(); projs.splice(i, 1); }
      continue;
    }
    if (p.kind === 'adag') { if (updateADag(p, gdt)) { scene.remove(m); billboards.splice(billboards.indexOf(m), 1); m.material.dispose(); m.geometry.dispose(); projs.splice(i, 1); } continue; }
    if (p.kind === 'harrow') { if (updateHArrow(p, gdt)) { scene.remove(m); billboards.splice(billboards.indexOf(m), 1); m.material.dispose(); m.geometry.dispose(); projs.splice(i, 1); } continue; }
    let hit = null;
    for (const tg of targets) if (tg.alive() && tg.y() < 1.6 && Math.hypot(m.position.x - tg.x, m.position.z - tg.z) < tg.r) { hit = tg; break; }
    if (hit) hitTarget(hit, p.dmg, m.position.x - p.vx, m.position.z - p.vz, p.color);
    if (hit || p.life <= 0) { scene.remove(m); billboards.splice(billboards.indexOf(m), 1); m.material.dispose(); m.geometry.dispose(); projs.splice(i, 1); }
  }
  // 베기 이펙트
  if (slashT >= 0) {
    slashT += gdt;
    const fi = Math.floor(slashT / 0.05);
    if (fi > 2) { slashMesh.visible = false; slashT = -1; }
    else { slashMesh.visible = true; slashMat.map = slashFace > 0 ? slashFrames[fi].r : slashFrames[fi].l; }
  }
  // 허수아비 흔들림
  dummyVel += (-dummyWob * 90 - dummyVel * 7) * dt; dummyWob += dummyVel * dt;
  dummyMesh.rotation.z = -dummyWob * 0.12;

  // 불
  const t = uTime.value;
  fireMat.map = fireTexes[Math.floor(t * 11) % 6];
  const fl = 0.8 + 0.12 * Math.sin(t * 13) + 0.1 * Math.sin(t * 23.7) + 0.08 * (vnoise(t * 6, 1) - 0.5) * 2;
  fireLight.intensity = AREA === 'town' ? 22 * fl : 0; fireGlow.material.opacity = 0.5 + 0.25 * fl; fireGlow.scale.setScalar(3.6 + fl * 0.8);
  // 암살자 가면 눈빛
  {
    const sn = party[2], [rx, rz] = camRight(), lx = sn.face * 4 * PX;
    orbLight.color.set('#ff3a7a'); orbLight.distance = 3.5;
    orbLight.position.set(sn.x + rx * lx, 2.6, sn.z + rz * lx + 0.25);
    orbLight.intensity = sn.down ? 0 : 0.8 + Math.sin(t * 4) * 0.2;
    if (!sn.down && Math.random() < dt * 3) glow.emit({ x: orbLight.position.x, y: 2.65, z: sn.z + 0.05, vx: -sn.face * rx * 0.4, vy: 0.15, life: 0.7, c: [2.6, 0.5, 1.2], size: PX });
  }
  updateHawk(gdt); updateHawkKit(gdt); updateAssKit(gdt);
  fxFlash = Math.max(0, fxFlash - dt * 6); fxLight.intensity = fxFlash * 10;

  emitAmbient(dt); updateWorld(dt); updateGear(gdt); updateDots(gdt);
  glow.update(gdt || dt * 0.2); soft.update(gdt || dt * 0.2);
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t += dt; if (f.t > 0) f.y += dt * 1.4 * (1 - f.t); f.x += f.vx * dt; if (f.t > 0.9) floaters.splice(i, 1); }
  clouds.forEach((c, i) => { c.position.x += dt * (0.4 + i * 0.1); if (c.position.x > 90) c.position.x = -90; });

  // 카메라
  const A = party[active];
  camTarget.x += (A.x - camTarget.x) * Math.min(1, dt * 5);
  camTarget.z += (A.z - camTarget.z) * Math.min(1, dt * 5);
  shake = Math.max(0, shake - dt);
  const shk = SET.shake ? shake : 0, sx = (Math.random() - 0.5) * shk * 0.6, sy = (Math.random() - 0.5) * shk * 0.6;
  camLift += ((A.y || 0) * 0.55 - camLift) * Math.min(1, dt * 6);
  const cd = camDist + camZoom + (typeof VFX !== 'undefined' ? VFX.punch : 0), hd = Math.cos(camPitch) * cd;
  camera.position.set(camTarget.x + Math.sin(camYaw) * hd + sx, Math.sin(camPitch) * cd + 1.4 + camLift + sy, camTarget.z + Math.cos(camYaw) * hd);
  camera.lookAt(camTarget.x, 1.4 + camLift, camTarget.z);
  for (const b of billboards) b.rotation.y = camYaw;
  // 시야를 가리는 나무/덤불 숨기기: 카메라→캐릭터 시선 근처에 있고, 그 지점의 시선 높이보다 높은 것
  {
    const cx = camera.position.x, cz = camera.position.z, cy = camera.position.y;
    const ddx = camTarget.x - cx, ddz = camTarget.z - cz, D = Math.hypot(ddx, ddz) || 1, ux = ddx / D, uz = ddz / D;
    for (const o of occluders) {
      const ox = o.mesh.position.x - cx, oz = o.mesh.position.z - cz;
      const t = ox * ux + oz * uz, perp = Math.abs(ox * uz - oz * ux);
      const lineH = cy + (1.4 - cy) * clamp(t / D, 0, 1);
      const near = Math.hypot(ox, oz) < o.r + 4;
      o.mesh.visible = !(near || (t > -1.5 && t < D - 0.6 && perp < o.r + 0.5 && o.h > lineH - 1.2));
    }
  }
  const v = new THREE.Vector3(A.x, 1, A.z).project(camera);
  gradePass.uniforms.uFocus.value += ((v.y + 1) / 2 - gradePass.uniforms.uFocus.value) * Math.min(1, dt * 4);
}
