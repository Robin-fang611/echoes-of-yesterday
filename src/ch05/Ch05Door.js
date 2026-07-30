import { drawPrompt, roundedRect } from '../utils/sceneUtils.js';

/** Ch5 唯一正确答案 —— 向日葵面板上菊花热区的屏幕坐标 */
const SUNFLOWER_TARGET = { x: 640, y: 280, radius: 55 };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function vibe(ms) {
  try { navigator.vibrate(ms); } catch (e) { /* 不支持振动 */ }
}

export class Ch05Door {
  constructor(game) {
    this.game = game;
    this.phase = 'comicIntro';  // comicIntro → narrative → gating2 → elevating → comicOutro → complete
    this.comicPage = 0;
    this.phaseTime = 0;
    this._complete = false;
    this.time = 0;

    // Gating 2 电梯简化
    this.elevateOffset = 0;
    this.successFlash = 0;
    this.floorRevealed = 0; // 1-5

    this.comicPages = [
      './assets/images/ch5_bg_elevator.jpg',
      './assets/images/ch5_elevator_sunflower_panel.jpg',
    ];
    this.narrativeLines = [
      '走出警局，坐上了女儿的车。',
      '窗外的霓虹灯流光溢彩……',
      '车子驶入了住了几十年的老小区。',
      '可是在夜色中，这里却像一个巨大的迷宫。',
    ];
  }

  get isComplete() { return this._complete; }
  get completeTitle() { return '记忆中……有什么被唤醒了。'; }
  get completeMessage() { return '记忆解锁 35%'; }

  async onEnter() {
    const loadImg = (src) => new Promise((res, rej) => {
      const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
    if (!this._comicImgs && this.comicPages) {
      try {
        this._comicImgs = await Promise.all(this.comicPages.map(loadImg));
      } catch (err) { console.error('Ch5 comic:', err); this._comicImgs = []; }
    }
    if (!this._images) {
      try {
        this._images = {
          ch5_bg_elevator: await loadImage('./assets/images/ch5_bg_elevator.jpg'),
          ch5_sunflower_sticker: await loadImage('./assets/images/ch5_sunflower_sticker.jpg'),
          ch5_elevator_sunflower_panel: await loadImage('./assets/images/ch5_elevator_sunflower_panel.jpg'),
          ch5_floor_1: await loadImage('./assets/images/ch5_floor_1.jpg'),
          ch5_floor_2: await loadImage('./assets/images/ch5_floor_2.jpg'),
          ch5_floor_3: await loadImage('./assets/images/ch5_floor_3.jpg'),
          ch5_floor_4: await loadImage('./assets/images/ch5_floor_4.jpg'),
          ch5_floor_5: await loadImage('./assets/images/ch5_floor_5.jpg'),
        };
      } catch (err) { console.error('Ch5 images:', err); }
    }
    this.game.showHint('走出警局，坐上了女儿的车……');
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: point => this.handleMove(point),
      up: point => this.handleUp(point),
      cancel: () => this.handleCancel(),
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
  }

  // ============ 输入处理 ============

  handleDown(point) {
    try {
      if (this.phase === 'comicIntro') {
        this.comicPage++;
        if (this.comicPage >= (this._comicImgs?.length || 1)) {
          this.phase = 'narrative';
          this.phaseTime = 0;
        }
        return;
      }
      if (this.phase === 'comicOutro') {
        this.phase = 'complete';
        this.phaseTime = 0;
        return;
      }
      if (this.phase === 'narrative') {
        if (this.phaseTime > 1.5) {
          this.phase = 'gating2';
          this.phaseTime = 0;
        }
      } else if (this.phase === 'gating2') {
        const dx = point.x - SUNFLOWER_TARGET.x;
        const dy = point.y - SUNFLOWER_TARGET.y;
        if (Math.hypot(dx, dy) <= SUNFLOWER_TARGET.radius) {
          this.phase = 'gating2_elevating';
          this.phaseTime = 0;
          this.successFlash = 1;
          this.elevateOffset = 0;
          this.floorRevealed = 0;
          vibe(15);
        } else {
          vibe(30);
        }
      }
    } catch (e) { console.error('Ch05 handleDown:', e); }
  }

  handleMove(_point) {}
  handleUp(_point) {}
  handleCancel() {}

  // ============ 辅助方法 ============

  getNearestSourceIndex() {
    let minDist = Infinity, idx = -1;
    for (let i = 0; i < this.sources.length; i++) {
      if (this.sources[i].found) continue;
      const dist = Math.abs(this.scanPos - this.sources[i].screenBaseX);
      if (dist < minDist) { minDist = dist; idx = i; }
    }
    return idx;
  }

  handleButtonPress(idx) {
    if (this.phase !== 'gating2') return;
    this.lastPressed = idx;

    if (idx === ELEVATOR_CONFIG.correctIndex) {
      this.phase = 'gating2_elevating';
      this.phaseTime = 0;
      this.successFlash = 1;
      this.elevateOffset = 0;
      vibe(15);
    } else {
      this.errorTimer = 0.4;
      this.errorBtnIdx = idx;
      vibe(30);
    }
  }

  // ============ update ============

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;

    switch (this.phase) {
      case 'narrative':
        if (this.phaseTime >= 6) { this.phase = 'gating2'; this.phaseTime = 0; }
        break;

      case 'gating2':
        this.hoveredBtn = -1;
        if (this.errorTimer > 0) this.errorTimer = Math.max(0, this.errorTimer - dt);
        break;

      case 'gating2_elevating':
        this.successFlash = Math.max(0, this.successFlash - dt * 1.5);
        this.elevateOffset += dt * 180;
        if (this.phaseTime >= 2.5) {
          this.phase = 'comicOutro';
          this.phaseTime = 0;
          this.comicPage = 0;
        }
        break;

      case 'comicOutro':
        // comicOutro 点击后进 complete（在 handleDown 处理）
        break;
      case 'complete':
        if (!this._progressSaved) {
          this._progressSaved = true;
          this.game.progress.markChapterComplete(5, 40);
          setTimeout(() => this.game.goMemoryReport('chapter_05'), 500);
        }
        break;
    }
  }

  // ============ render ============

  render(ctx) {
    try {
      this._renderSafe(ctx);
    } catch (e) {
      console.error('Ch05 render error:', e);
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(0, 0, this.game.width, this.game.height);
      ctx.fillStyle = '#d4b896';
      ctx.font = '20px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('画面加载异常，请重试', this.game.width / 2, this.game.height / 2);
    }
  }

  _renderSafe(ctx) {
    const { width, height } = this.game;
    switch (this.phase) {
      case 'comicIntro':
      case 'comicOutro':
        this.renderComic(ctx, width, height);
        break;
      case 'narrative': this.renderNarrative(ctx); break;
      case 'gating2': this.renderGating2(ctx); break;
      case 'gating2_elevating': this.renderGating2Elevating(ctx); break;
      case 'complete': this.renderComplete(ctx); break;
      default:
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(0, 0, width, height);
    }
  }

  // ---------- 叙事开场 ----------

  renderNarrative(ctx) {
    const { width, height } = this.game;
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, width, height);

    const alpha = Math.min(1, this.phaseTime / 1.5);
    const textIdx = Math.min(Math.floor(this.phaseTime / 1.2), this.narrativeLines.length - 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d4b896';
    ctx.font = '500 28px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = Math.floor((this.phaseTime - textIdx * 1.2) / 0.03);
    const line = this.narrativeLines[textIdx];
    if (line) {
      ctx.fillText(line.slice(0, Math.min(chars, line.length)), width / 2, height / 2 - 20);
    }

    if (this.phaseTime > 3.5) {
      ctx.globalAlpha = Math.min(1, (this.phaseTime - 3.5) / 0.8);
      ctx.fillStyle = '#8a7a6a';
      ctx.font = '16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('点击或触摸继续……', width / 2, height - 60);
    }
    ctx.restore();
  }

  // ---------- Gating 1 ----------

  renderGating1(ctx) {
    const { width, height } = this.game;
    this.drawNightSky(ctx, width, height);
    this.drawBuildingSilhouettes(ctx, width, height);
    this.drawSoundWaves(ctx);
    this.drawNoiseOverlay(ctx, width, height);
    this.drawScanLine(ctx, width, height);
    this.drawCompass(ctx, width);
    this.drawLockProgress(ctx);

    if (this.phase === 'gating1_celebrate') this.drawCelebration(ctx, width, height);

    ctx.fillStyle = '#a09080';
    ctx.font = '16px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`已找到 ${this.sourcesFound} / 3 个声音来源`, width / 2, height - 48);

    if (this.sourcesFound < 3) drawPrompt(ctx, '← 左右拖动，寻找熟悉的声音 →', width / 2, height - 18, 0);
  }

  drawNightSky(ctx, width, height) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a14');
    grad.addColorStop(0.4, '#12101e');
    grad.addColorStop(0.7, '#1a1424');
    grad.addColorStop(1, '#0d0805');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5 + i * i * 0.3) % width;
      const sy = (i * 89.3 + i * i * 0.7) % (height * 0.4);
      const size = 0.5 + (i % 3) * 0.5;
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * (1 + i * 0.1) + i);
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBuildingSilhouettes(ctx, width, height) {
    ctx.save();
    const buildings = [
      { x: 20, w: 120, h: 180, base: 500, seed: 7 },
      { x: 160, w: 100, h: 220, base: 500, seed: 13 },
      { x: 340, w: 150, h: 160, base: 500, seed: 23 },
      { x: 510, w: 130, h: 250, base: 500, seed: 31 },
      { x: 660, w: 140, h: 190, base: 500, seed: 47 },
      { x: 840, w: 110, h: 230, base: 500, seed: 53 },
      { x: 970, w: 130, h: 170, base: 500, seed: 59 },
      { x: 1120, w: 140, h: 210, base: 500, seed: 61 },
    ];
    for (const b of buildings) {
      ctx.fillStyle = '#0d0a12';
      ctx.fillRect(b.x, b.base - b.h, b.w, b.h);
      let s = b.seed;
      for (let wy = b.base - b.h + 15; wy < b.base - 10; wy += 22) {
        for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 18) {
          s = (s * 1103515245 + 12345) & 0x7fffffff;
          const bright = (s / 0x7fffffff) * 0.1;
          if (bright > 0.03) {
            ctx.fillStyle = `rgba(255, 200, 100, ${Math.min(bright, 0.1)})`;
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
    }
    ctx.restore();
  }

  drawNoiseOverlay(ctx, width, height) {
    const roadGrad = ctx.createLinearGradient(0, height - 80, 0, height);
    roadGrad.addColorStop(0, 'rgba(30, 26, 20, 0)');
    roadGrad.addColorStop(1, 'rgba(30, 26, 20, 0.6)');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, height - 80, width, 80);

    const vignette = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 500);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  drawSoundWaves(ctx) {
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      if (source.found) continue;

      const loud = getSourceLoudness(this.scanPos, source.screenBaseX);
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + source.wavePhase);

      ctx.save();

      const baseRadius = 8 + loud * 12;
      const glow = ctx.createRadialGradient(source.screenBaseX, source.y, 0, source.screenBaseX, source.y, baseRadius * 4);
      glow.addColorStop(0, source.color + '40');
      glow.addColorStop(0.5, source.color + '15');
      glow.addColorStop(1, source.color + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(source.screenBaseX, source.y, baseRadius * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = source.color;
      ctx.globalAlpha = 0.3 + loud * 0.5;
      ctx.beginPath();
      ctx.arc(source.screenBaseX, source.y, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = source.color;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 3; r++) {
        const ringRadius = 25 + r * 20 + pulse * 10;
        ctx.globalAlpha = Math.max(0, 0.3 * (1 - r * 0.25)) * (0.4 + loud * 0.6);
        ctx.beginPath();
        ctx.arc(source.screenBaseX, source.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (loud > 0.05) {
        ctx.globalAlpha = loud * 0.6;
        const barW = 3, totalW = GATING1_CONFIG.waveBars * (barW + 2);
        const startX = source.screenBaseX - totalW / 2;
        for (let b = 0; b < GATING1_CONFIG.waveBars; b++) {
          const barPhase = (b / GATING1_CONFIG.waveBars) * Math.PI * 2 + this.time * 4 + source.wavePhase;
          const barH = Math.max(1, Math.sin(barPhase) * GATING1_CONFIG.maxBarHeight * (0.3 + loud * 0.7));
          ctx.fillStyle = source.color;
          ctx.globalAlpha = (0.15 + loud * 0.45) * (0.5 + 0.5 * Math.sin(barPhase));
          ctx.fillRect(startX + b * (barW + 2), source.y + 15, barW, barH);
          ctx.fillRect(startX + b * (barW + 2), source.y - 15 - barH, barW, barH);
        }
      }

      if (loud > 0.2) {
        ctx.globalAlpha = loud * 0.8;
        ctx.fillStyle = source.color;
        ctx.font = '16px system-ui, "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(source.label, source.screenBaseX, source.y - baseRadius - 8);

        ctx.fillStyle = '#c0b0a0';
        ctx.font = '13px system-ui, "PingFang SC", sans-serif';
        ctx.globalAlpha = loud * 0.5;
        ctx.fillText(source.hint, source.screenBaseX, source.y - baseRadius - 32);
      }

      ctx.restore();
    }

    for (const source of this.sources) {
      if (!source.found) continue;
      ctx.save();
      ctx.fillStyle = '#f0c040';
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.time * 2);
      ctx.font = '28px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', source.screenBaseX, source.y);

      ctx.strokeStyle = '#f0c040';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.2 + 0.15 * Math.sin(this.time * 2.5);
      ctx.beginPath();
      ctx.arc(source.screenBaseX, source.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawScanLine(ctx, width, height) {
    ctx.save();

    const scanGrad = ctx.createLinearGradient(this.scanPos - 100, height, this.scanPos, height - 60);
    scanGrad.addColorStop(0, 'rgba(200, 180, 150, 0)');
    scanGrad.addColorStop(0.3, 'rgba(200, 180, 150, 0.06)');
    scanGrad.addColorStop(0.7, 'rgba(200, 180, 150, 0.03)');
    scanGrad.addColorStop(1, 'rgba(200, 180, 150, 0)');
    ctx.fillStyle = scanGrad;
    ctx.beginPath();
    ctx.moveTo(this.scanPos, height);
    ctx.lineTo(this.scanPos - 60, height - 100);
    ctx.lineTo(this.scanPos + 60, height - 100);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(200, 180, 150, 0.3)';
    ctx.beginPath();
    ctx.arc(this.scanPos, height - 70, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.sourcesFound < 3) {
      ctx.fillStyle = 'rgba(200, 180, 150, 0.15)';
      ctx.font = '24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀', 30, height / 2);
      ctx.fillText('▶', width - 30, height / 2);
    }

    ctx.restore();
  }

  drawCompass(ctx, width) {
    const cx = width / 2, cy = 40, radius = 30;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200, 180, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (const source of this.sources) {
      const angle = (source.screenBaseX / 1280) * Math.PI * 2 - Math.PI / 2;
      const r = radius - 6;
      const dx = cx + Math.cos(angle) * r, dy = cy + Math.sin(angle) * r;
      ctx.fillStyle = source.found ? '#f0c040' : source.color;
      ctx.globalAlpha = source.found ? 0.8 : 0.4;
      ctx.beginPath();
      ctx.arc(dx, dy, source.found ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const scanAngle = (this.scanPos / 1280) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(scanAngle) * 6, cy + Math.sin(scanAngle) * 6);
    ctx.rotate(scanAngle);
    ctx.fillStyle = '#f0d090';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawLockProgress(ctx) {
    if (!this.isLocking || this.lockTargetIdx < 0) return;

    const source = this.sources[this.lockTargetIdx];
    const progress = source.lockProgress;
    ctx.save();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(source.screenBaseX, source.y, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = source.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(source.screenBaseX, source.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    ctx.fillStyle = source.color;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${Math.round(progress * 100)}%`, source.screenBaseX, source.y);

    ctx.restore();
  }

  drawCelebration(ctx, width, height) {
    const alpha = Math.min(1, this.phaseTime / 0.5) * (1 - Math.min(1, (this.phaseTime - 0.5) / 1.5));
    ctx.save();
    ctx.globalAlpha = alpha;

    for (let i = 0; i < 20; i++) {
      const t = this.phaseTime * 10 + i * 193.7;
      const angle = t % (Math.PI * 2);
      const dist = (i * 37.1 + this.phaseTime * 40) % 220 + 20;
      ctx.fillStyle = '#f0c040';
      ctx.beginPath();
      ctx.arc(width / 2 + Math.cos(angle) * dist, height / 2 + Math.sin(angle * 0.7) * dist * 0.6, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f0c040';
    ctx.font = 'bold 32px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('记忆解锁 +5%', width / 2, height / 2);

    ctx.restore();
  }

  // ---------- Gating 2：只显示面板底图 + 向日葵热区提示 ----------

  renderGating2(ctx) {
    const { width, height } = this.game;

    this.drawElevatorBg(ctx, width, height);
    // 竖版面板 (941x1672) — 竖版含完整的1-9+B1按钮面板，只裁顶部按钮区
    const panel = this._images?.ch5_elevator_sunflower_panel;
    if (panel) {
      // 面板原始比例: 941×1672 (≈0.56:1)
      // 只取上半部分(按钮区域约0~55%处)，缩放填满画布宽度
      const panelScale = width / panel.width;
      const cropY = 0;                    // 从顶部开始
      const cropH = panel.height * 0.42;  // 取上42%（按钮面板）
      const displayH = cropH * panelScale;
      // 画在画布上半
      ctx.drawImage(panel, 0, cropY, panel.width, cropH, 0, 80, width, displayH);
      // 半透明渐变遮罩，让下半部分灰暗
      const grad = ctx.createLinearGradient(0, 80 + displayH, 0, 80 + displayH + 80);
      grad.addColorStop(0, 'rgba(42,32,22,0.6)');
      grad.addColorStop(1, 'rgba(42,32,22,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 80 + displayH, width, 80);
    }
    // 向日葵脉冲热区
    const tx = width / 2, ty = 280;
    for (let i = 0; i < 3; i++) {
      const r = 35 + i * 16 + Math.sin(this.time * 3 + i) * 5;
      ctx.strokeStyle = `rgba(240, 192, 64, ${0.25 - i * 0.06})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawAIHint(ctx, width);

    if (this.errorTimer > 0) {
      ctx.save();
      ctx.globalAlpha = this.errorTimer / 0.4;
      const rect = getButtonRect(this.errorBtnIdx);
      ctx.fillStyle = 'rgba(200, 40, 30, 0.25)';
      roundedRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 10);
      ctx.fill();
      ctx.strokeStyle = `rgba(200, 40, 30, ${this.errorTimer / 0.4})`;
      ctx.lineWidth = 2;
      roundedRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 10);
      ctx.stroke();
      ctx.restore();
    }

    drawPrompt(ctx, '点击有向日葵标记的楼层按钮', width / 2, height - 30, 0);
  }

  drawElevatorBg(ctx, width, height) {
    const elevator = this._images?.ch5_bg_elevator;
    if (elevator) {
      ctx.drawImage(elevator, 0, 0, width, height);
      ctx.fillStyle = 'rgba(15, 13, 12, 0.24)';
      ctx.fillRect(0, 0, width, height);
      this.drawFloorDisplay(ctx);
      return;
    }
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#3a3835');
    grad.addColorStop(0.3, '#4a4845');
    grad.addColorStop(0.5, '#504e4b');
    grad.addColorStop(0.7, '#4a4845');
    grad.addColorStop(1, '#3a3835');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const lightGrad = ctx.createLinearGradient(0, 0, width, 0);
    lightGrad.addColorStop(0, 'rgba(255, 240, 200, 0.1)');
    lightGrad.addColorStop(0.2, 'rgba(255, 240, 200, 0.25)');
    lightGrad.addColorStop(0.5, 'rgba(255, 240, 200, 0.3)');
    lightGrad.addColorStop(0.8, 'rgba(255, 240, 200, 0.25)');
    lightGrad.addColorStop(1, 'rgba(255, 240, 200, 0.1)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, 12);

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(10, height);
    ctx.moveTo(width - 10, 0); ctx.lineTo(width - 10, height);
    ctx.stroke();

    this.drawFloorDisplay(ctx);
  }

  drawFloorDisplay(ctx, floorLabel) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundedRect(ctx, 20, 20, 100, 40, 4);
    ctx.fill();

    ctx.fillStyle = '#40c040';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(floorLabel || '1F', 36, 40);

    ctx.fillStyle = `rgba(64, 192, 64, ${0.3 + 0.3 * Math.sin(this.time * 2)})`;
    ctx.font = '14px system-ui';
    ctx.fillText('▲', 90, 40);
    ctx.restore();
  }

  drawElevatorPanel(ctx) {
    const cfg = ELEVATOR_CONFIG;
    ctx.save();

    // UI v1.1 向日葵电梯面板美术 (ch5_elevator_sunflower_panel.jpg) 作底；保留交互按钮叠在其上
    const artPanel = this._images?.ch5_elevator_sunflower_panel;
    if (artPanel && artPanel.naturalWidth) {
      ctx.drawImage(artPanel, cfg.panelX, cfg.panelY, cfg.panelWidth, cfg.panelHeight);
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;

      const panelGrad = ctx.createLinearGradient(cfg.panelX, cfg.panelY, cfg.panelX, cfg.panelY + cfg.panelHeight);
      panelGrad.addColorStop(0, '#2a2825');
      panelGrad.addColorStop(0.5, '#353330');
      panelGrad.addColorStop(1, '#2a2825');
      ctx.fillStyle = panelGrad;
      roundedRect(ctx, cfg.panelX, cfg.panelY, cfg.panelWidth, cfg.panelHeight, 16);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(100,95,85,0.5)';
      ctx.lineWidth = 1.5;
      roundedRect(ctx, cfg.panelX, cfg.panelY, cfg.panelWidth, cfg.panelHeight, 16);
      ctx.stroke();
    }

    ctx.fillStyle = '#706860';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('▲ 楼层选择 ▼', cfg.panelX + cfg.panelWidth / 2, cfg.panelY + 18);

    ctx.restore();
  }

  drawElevatorButton(ctx, idx) {
    const cfg = ELEVATOR_CONFIG;
    const btnData = ELEVATOR_BUTTONS[idx];
    const rect = getButtonRect(idx);
    const isHovered = this.hoveredBtn === idx;
    const isCorrect = idx === cfg.correctIndex;

    ctx.save();
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;

    if (isHovered) { ctx.shadowColor = '#f0c040'; ctx.shadowBlur = 12; }

    const btnGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, rect.w / 2);
    btnGrad.addColorStop(0, isCorrect ? '#4a4845' : '#403e3b');
    btnGrad.addColorStop(1, '#2a2825');
    ctx.fillStyle = btnGrad;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = isCorrect ? 'rgba(240, 192, 64, 0.2)' : 'rgba(80,75,65,0.6)';
    ctx.lineWidth = 1.5;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();

    this.drawDistortedNumber(ctx, btnData, cx, cy);
    if (btnData.hasSunflower) this.drawSunflowerPetals(ctx, cx, cy, cfg);

    ctx.restore();
  }

  drawDistortedNumber(ctx, btnData, cx, cy) {
    ctx.save();
    ctx.translate(cx + (btnData.offsetX || 0), cy + (btnData.offsetY || 0));
    ctx.rotate((btnData.rotation || 0) * Math.PI / 180);
    ctx.scale(btnData.scaleX || 1, btnData.scaleY || 1);
    ctx.fillStyle = '#c8c0b0';
    ctx.font = 'bold 40px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(btnData.label, 0, 0);
    ctx.restore();
  }

  drawSunflowerPetals(ctx, cx, cy, cfg) {
    const sticker = this._images?.ch5_sunflower_sticker;
    if (sticker) {
      ctx.save();
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(this.time * 1.5);
      ctx.drawImage(sticker, cx - 34, cy - 34, 68, 68);
      ctx.restore();
      return;
    }
    ctx.save();
    for (let i = 0; i < cfg.sunflowerPetals; i++) {
      const angle = (i / cfg.sunflowerPetals) * Math.PI * 2 + Math.PI / 8;
      const px = cx + Math.cos(angle) * cfg.sunflowerRadius;
      const py = cy + Math.sin(angle) * cfg.sunflowerRadius;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.time * 1.5 + i * 0.8);
      ctx.fillStyle = '#f0c040';
      ctx.beginPath();
      ctx.ellipse(0, 0, cfg.petalWidth, cfg.petalLen, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d76e';
      ctx.beginPath();
      ctx.ellipse(0, -cfg.petalLen * 0.2, cfg.petalWidth * 0.5, cfg.petalLen * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#c0a030';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawAIHint(ctx, width) {
    ctx.save();
    const hintX = width - 20, hintY = 50, hintW = 280, hintH = 80;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundedRect(ctx, hintX - hintW, hintY - 10, hintW, hintH, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(240, 192, 64, 0.3)';
    ctx.lineWidth = 1;
    roundedRect(ctx, hintX - hintW, hintY - 10, hintW, hintH, 10);
    ctx.stroke();

    ctx.fillStyle = '#f0c040';
    ctx.font = '14px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('AI 管家', hintX - 12, hintY + 4);

    ctx.fillStyle = '#d4c8b8';
    ctx.font = '15px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('"您的家在有向日葵贴纸的那一层。"', hintX - 12, hintY + 30);

    ctx.restore();
  }

  // ---------- 电梯上升动画（楼层1→2→3→4→5依次显示）----------

  renderGating2Elevating(ctx) {
    const { width, height } = this.game;
    // 每 0.5s 切一张楼层图
    const floor = Math.max(1, Math.min(5, Math.floor(this.phaseTime / 0.5) + 1));
    const floorImg = this._images?.[`ch5_floor_${floor}`];

    ctx.save();
    if (floorImg) {
      ctx.drawImage(floorImg, 0, 0, width, height);
      // 微弱暖光叠加
      if (this.successFlash > 0) {
        ctx.fillStyle = `rgba(240, 192, 64, ${this.successFlash * 0.08})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      this.drawElevatorBg(ctx, width, height);
    }
    ctx.restore();

    const shake = this.phaseTime < 1 ? Math.sin(this.phaseTime * 40) * 3 : 0;
    ctx.fillStyle = '#d4b896';
    ctx.font = 'bold 36px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${floor}F`, width / 2 + shake, height / 2 - 40);

    ctx.fillStyle = '#a09080';
    ctx.font = '20px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('电梯缓缓上升……', width / 2 + shake, height / 2 + 20);
  }

  // ---------- 章节完成 ----------

  renderComic(ctx, width, height) {
    const img = this._comicImgs?.[this.comicPage];
    if (img) {
      const scale = Math.max(width / img.width, height / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, height - 55, width, 55);
    ctx.fillStyle = '#d4b896';
    ctx.font = '16px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击继续', width / 2, height - 28);
  }

  renderComplete(ctx) {
    // 完成时弹出 overlay，不需要自渲染内容
  }
}
