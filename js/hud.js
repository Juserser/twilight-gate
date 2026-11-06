'use strict';
// HUD 캔버스: 데미지 숫자 · 컷인 · 화면 효과

// ===================================================================
// HUD
// ===================================================================
function txt(s, x, y, size, color, align = 'left', alpha = 1) {
  hctx.globalAlpha = alpha; hctx.font = `${size}px Galmuri11, monospace`;
  hctx.textAlign = align; hctx.textBaseline = 'middle';
  hctx.fillStyle = '#0c0814'; hctx.fillText(s, x + 2, y + 2);
  hctx.fillStyle = color; hctx.fillText(s, x, y); hctx.globalAlpha = 1;
}
function panel(x, y, w, h, on) {
  hctx.fillStyle = '#0c0814'; hctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  hctx.fillStyle = on ? '#3a2c5a' : '#221a36'; hctx.fillRect(x, y, w, h);
  hctx.fillStyle = on ? '#f1c40f' : '#4a3a6b';
  hctx.fillRect(x, y, w, 2); hctx.fillRect(x, y + h - 2, w, 2); hctx.fillRect(x, y, 2, h); hctx.fillRect(x + w - 2, y, 2, h);
}
function drawHUD() {
  const w = innerWidth, h = innerHeight;
  hctx.setTransform(PR, 0, 0, PR, 0, 0); hctx.clearRect(0, 0, w, h);
  hctx.imageSmoothingEnabled = false;
  const vig = (a, col) => {
    const g = hctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(${col},${a})`); hctx.fillStyle = g; hctx.fillRect(0, 0, w, h);
  };
  if (hurtVig > 0) vig(hurtVig, '200,20,30');
  if (dimW > 0.01) { hctx.fillStyle = `rgba(0,0,0,${dimW})`; hctx.fillRect(0, 0, w, h); }
  if (redW > 0.01) vig(redW, '200,10,10');
  if (party[0].berserk > 0) vig(0.18 + 0.06 * Math.sin(uTime.value * 6), '150,0,0');
  drawMarks(hctx, w, h); drawAssHUD(hctx, w, h);
  // 데미지 숫자
  for (const f of floaters) {
    if (f.t < 0 || !SET.dmg) continue;
    const v = new THREE.Vector3(f.x, f.y, f.z).project(camera);
    const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h, pop = f.t < 0.1 ? 1 + (0.1 - f.t) * 6 : 1;
    txt(f.text, sx, sy, Math.round((f.big ? 30 : f.crit ? 26 : 19) * Math.min(pop, 1.6)), f.color || (f.crit ? '#ffd23f' : '#ffffff'), 'center', 1 - Math.max(0, f.t - 0.5) / 0.4);
    if (f.crit && f.t < 0.6) txt('치명타!', sx, sy - 22, 12, '#ff9a40', 'center', 1 - f.t / 0.6);
  }
  // 시네마틱 띠
  const barH = cineAmt * h * 0.1;
  if (barH > 0.5) { hctx.fillStyle = '#000'; hctx.fillRect(0, 0, w, barH); hctx.fillRect(0, h - barH, w, barH); }
  // 4차 스킬 컷인
  if (cutin) {
    const T = cutin.t, inK = Math.min(1, T / 0.14), outK = Math.max(0, (T - 0.95) / 0.2);
    const slide = (1 - inK) ** 2 * -w + outK ** 2 * w, by = h * 0.34, bh = h * 0.22, sk = h * 0.04;
    hctx.save(); hctx.translate(slide, 0);
    hctx.beginPath(); hctx.moveTo(0, by + sk); hctx.lineTo(w, by - sk); hctx.lineTo(w, by + bh - sk); hctx.lineTo(0, by + bh + sk); hctx.closePath();
    const gr = hctx.createLinearGradient(0, 0, w, 0);
    const pal = cutin.pal || ['rgba(40,0,0,.94)', 'rgba(150,12,12,.9)', 'rgba(25,0,0,.94)']; gr.addColorStop(0, pal[0]); gr.addColorStop(0.45, pal[1]); gr.addColorStop(1, pal[2]);
    hctx.fillStyle = gr; hctx.fill();
    hctx.save(); hctx.clip();
    hctx.fillStyle = 'rgba(255,190,170,.35)';
    for (let i = 0; i < 16; i++) hctx.fillRect(((i * 211 + T * 2600) % (w + 400)) - 300, by - sk + ((i * 53) % (bh + sk * 2)), 140 + (i % 3) * 90, 2);
    const ph = bh * 1.5;
    hctx.drawImage(HERO_FRAMES[cutin.hero || 'berserker'].atk[0].c, 40, 0, 112, 112, w * 0.1 + (1 - inK) * 60, by + bh / 2 - ph * 0.42, ph, ph);
    hctx.restore();
    hctx.fillStyle = cutin.line || '#ffd0c0'; hctx.fillRect(0, by + bh + sk - 3, w, 3); hctx.fillRect(0, by - sk, w, 3);
    txt(cutin.name, w * 0.5, by + bh * 0.46, Math.round(bh * 0.34), '#ffffff', 'left');
    txt(cutin.sub, w * 0.5 + 4, by + bh * 0.8, 15, cutin.subC || '#ffb0a0', 'left');
    hctx.restore();
  }
  if (!locked && !anyWin() && !uiTyping && !(typeof TITLE !== 'undefined' && TITLE.open)) {
    const msg = '화면을 클릭하면 마우스로 시점을 돌릴 수 있어요';
    hctx.font = '14px Galmuri11, monospace';
    const mw = hctx.measureText(msg).width;
    hctx.fillStyle = 'rgba(0,0,0,.6)'; hctx.fillRect(w / 2 - mw / 2 - 18, h * 0.62, mw + 36, 34);
    txt(msg, w / 2, h * 0.62 + 17, 14, '#f1c40f', 'center', 0.7 + 0.3 * Math.sin(uTime.value * 4));
  }
  if (noCD) txt('테스트 모드: 쿨타임·마나 무시 ( ` 키로 끄기)', w / 2, h - 250, 12, '#9aff9a', 'center');
  if (flashW > 0) { hctx.fillStyle = `rgba(${flashCol},${flashW})`; hctx.fillRect(0, 0, w, h); }
}
