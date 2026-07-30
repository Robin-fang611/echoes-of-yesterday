/**
 * Ch1 镜前 — 方形镜子 + 碎裂特效
 * HTML 场景层放底图+镜子，Canvas 负责呼吸光晕/碎裂/粒子
 */

export class Ch01Mirror {
  constructor(ctx) {
    this.game = ctx;
    this.phase = 'idle';
    this._completed = false;
    this.clickCount = 0;
    this.breathTime = Math.random() * Math.PI * 2;
    this.shatterParticles = [];
    this.phaseTime = 0;

    // 镜子在 1280×720 画布中的位置（居中偏上）
    this.mirrorW = 300;
    this.mirrorH = 386;   // 保持 350:450 比例
    this.mirrorX = (1280 - this.mirrorW) / 2;  // 490
    this.mirrorY = 160;

    // 镜子 DOM 引用
    this._mirrorImg = null;
    this._mirrorEl = null;
  }

  get isComplete() { return this._completed; }

  onEnter() {
    const layer = this.game.sceneLayer;
    layer.innerHTML = '';

    // 房间全景底图
    const bg = document.createElement('img');
    bg.src = './第一章/微信图片_20260730001807_56_115.png';
    bg.alt = '';
    bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    layer.appendChild(bg);

    // 暖色压暗
    const overlay = document.createElement('div');
    overlay.id = 'ch1-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(13,8,5,0.35);pointer-events:none;';
    layer.appendChild(overlay);

    // 方形镜子图（放大居中）
    this._mirrorEl = document.createElement('div');
    this._mirrorEl.id = 'ch1-mirror';
    const mirrorScale = 1.5; // 放大到 525×675
    const mw = Math.round(this.mirrorW * mirrorScale);
    const mh = Math.round(this.mirrorH * mirrorScale);
    const mx = Math.round((1280 - mw) / 2);
    const my = Math.round((720 - mh) / 2); // 垂直也居中
    this._mirrorEl.style.cssText = [
      `position:absolute;`,
      `left:${mx}px;top:${my}px;`,
      `width:${mw}px;height:${mh}px;`,
      `pointer-events:none;`,
      `transition: opacity 0.15s;`,
      `opacity:0.92;`,
      `filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));`,
    ].join('');

    const mirrorImg = document.createElement('img');
    mirrorImg.src = './第一章/mirror.png';
    mirrorImg.alt = '镜子';
    mirrorImg.id = 'ch1-mirror-img';
    mirrorImg.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    this._mirrorImg = mirrorImg;
    this._mirrorEl.appendChild(mirrorImg);
    layer.appendChild(this._mirrorEl);

    // 提示
    this.game.showHint('凝视镜中的自己……');

    this.game.input.setHandlers({
      down: (point) => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
    this.game.sceneLayer.innerHTML = '';
  }

  /** 判断点击是否在镜子区域内 */
  isInMirror(point) {
    return (
      point.x >= this.mirrorX &&
      point.x <= this.mirrorX + this.mirrorW &&
      point.y >= this.mirrorY &&
      point.y <= this.mirrorY + this.mirrorH
    );
  }

  handleDown(point) {
    if (this.phase === 'shattering' || this.phase === 'complete') return;

    this.clickCount++;

    if (this.isInMirror(point) || this.clickCount >= 3) {
      this.startShattering();
    }
  }

  startShattering() {
    this.phase = 'shattering';
    this.phaseTime = 0;
    this.shatterParticles = [];

    // 切换镜子图为碎裂版
    if (this._mirrorImg) {
      this._mirrorImg.src = './第一章/mirror_crack.png';
    }

    // 从镜子区域飞出的碎片
    const cx = this.mirrorX + this.mirrorW / 2;
    const cy = this.mirrorY + this.mirrorH / 2;
    const rx = this.mirrorW / 2;
    const ry = this.mirrorH / 2;

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      const size = 3 + Math.random() * 12;
      const sx = cx + (Math.random() - 0.5) * rx * 1.8;
      const sy = cy + (Math.random() - 0.5) * ry * 1.8;

      const t = Math.random();
      const r = Math.round(180 + t * 75);
      const g = Math.round(130 + t * 125);
      const b = Math.round(70 + t * 185);

      this.shatterParticles.push({
        x: sx, y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size, color: `rgb(${r},${g},${b})`,
        rotation: 0,
        spin: (Math.random() - 0.5) * 8,
        life: 1.5 + Math.random() * 1.2,
      });
    }

    try { navigator.vibrate?.(30); } catch {}
  }

  update(dt) {
    this.breathTime += dt;

    if (this.phase === 'shattering') {
      this.phaseTime += dt;

      const gravity = 80;
      for (const p of this.shatterParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * dt;
        p.rotation += p.spin * dt;
        p.life -= dt;
      }
      this.shatterParticles = this.shatterParticles.filter(p => p.life > 0);

      if (this.phaseTime >= 2) {
        this.phase = 'complete';
        this._completed = true;
        this.game.progress.markChapterComplete(1, 5);
        this.game.showHint('');

        setTimeout(() => {
          this.game.goMemoryReport('chapter_01');
        }, 800);
      }
    }
  }

  render(ctx, gameCtx) {
    // Canvas 只绘制呼吸光晕（idle 阶段）和粒子（shattering 阶段）
    // 场景（底图+镜子）由 HTML 层负责

    const cx = this.mirrorX + this.mirrorW / 2;
    const cy = this.mirrorY + this.mirrorH / 2;
    const rx = this.mirrorW / 2 + 20;
    const ry = this.mirrorH / 2 + 20;

    if (this.phase === 'idle') {
      // 镜子呼吸光晕
      const glowAlpha = 0.06 + Math.sin(this.breathTime * (Math.PI * 2 / 3)) * 0.04;
      const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, rx);
      glow.addColorStop(0, `rgba(200, 170, 110, ${glowAlpha})`);
      glow.addColorStop(0.6, `rgba(180, 140, 80, ${glowAlpha * 0.5})`);
      glow.addColorStop(1, 'rgba(180, 140, 80, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(this.mirrorX - 40, this.mirrorY - 40, this.mirrorW + 80, this.mirrorH + 80);
    }

    // 碎裂粒子
    for (const p of this.shatterParticles) {
      const alpha = Math.min(1, p.life * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.5, -s * 0.6);
      ctx.lineTo(-s * 0.4, s * 0.7);
      ctx.closePath();
      ctx.fill();
      // 碎片高光
      ctx.strokeStyle = `rgba(255, 220, 160, ${alpha * 0.25})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}
