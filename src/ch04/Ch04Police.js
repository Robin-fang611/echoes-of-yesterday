import { drawImageCover, drawPrompt, roundedRect } from '../utils/sceneUtils.js';
import { SignaturePuzzle } from '../interactions/SignaturePuzzle.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class Ch04Police {
  constructor(game) {
    this.game = game;
    this.phase = 'comicIntro';  // comicIntro → comicFP → phone → ringing → signature → form → bracelet → complete
    this.phaseTime = 0;
    this.totalTime = 0;
    this._completed = false;
    this.comicPage = 0;
    this.signature = new SignaturePuzzle({
      game,
      onComplete: () => {
        this.phase = 'form';
        this.phaseTime = 0;
      },
    });
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '警局'; }
  get completeMessage() { return '手环上刻着一个名字……也许这就是线索。'; }

  async onEnter() {
    if (!this._images) {
      try {
        // 14张漫画图 + 3张互动图
        const comicImgs = [];
        for (let i = 1; i <= 8; i++) {
          comicImgs.push(loadImage(`./assets/images/ch4_comic_${String(i).padStart(2, '0')}.png`));
        }
        const fpImgs = [];
        for (let i = 1; i <= 6; i++) {
          fpImgs.push(loadImage(`./assets/images/ch4_fp_${String(i).padStart(2, '0')}.png`));
        }
        const [police01, police03, police08, ...comics] = await Promise.all([
          loadImage('./assets/images/ch4_police_01.png'),
          loadImage('./assets/images/ch4_police_03.png'),
          loadImage('./assets/images/ch4_police_08.png'),
          ...comicImgs,
          ...fpImgs,
        ]);
        this._images = {
          ch4_police_01: police01, ch4_police_03: police03, ch4_police_08: police08,
          comic: comics.slice(0, 8),
          fp: comics.slice(8),
        };
      } catch (err) { console.error('Ch4 images:', err); }
    }
    this.game.showHint('有人打电话来了……');
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
    if (this.phase === 'comicIntro') {
      this.comicPage++;
      if (this.comicPage >= (this._images?.comic?.length || 1)) {
        this.phase = 'comicFP';
        this.comicPage = 0;
      }
      return;
    }
    if (this.phase === 'comicFP') {
      this.comicPage++;
      if (this.comicPage >= (this._images?.fp?.length || 1)) {
        this.phase = 'phone';
        this.phaseTime = 0;
        this.comicPage = 0;
      }
      return;
    }
    if (this.phase === 'signature') {
      this.signature.handleDown(point);
    } else if (this.phase === 'phone') {
      // 电话热区：底座 + 听筒区域
      const phoneBaseX = 200, phoneBaseY = 310, phoneBaseW = 100, phoneBaseH = 70;
      const phoneEarpieceX = 190, phoneEarpieceY = 278, phoneEarpieceW = 120, phoneEarpieceH = 28;

      const hitBase = point.x >= phoneBaseX && point.x <= phoneBaseX + phoneBaseW &&
                      point.y >= phoneBaseY && point.y <= phoneBaseY + phoneBaseH;
      const hitEarpiece = point.x >= phoneEarpieceX && point.x <= phoneEarpieceX + phoneEarpieceW &&
                          point.y >= phoneEarpieceY && point.y <= phoneEarpieceY + phoneEarpieceH;

      if (hitBase || hitEarpiece) {
        this.phase = 'ringing';
        this.phaseTime = 0;
        try { navigator.vibrate?.(30); } catch {}
      }
    } else if (this.phase === 'form') {
      // 手环热区 (x:120, y:560)
      const bx = 120, by = 560;
      const dist = Math.hypot(point.x - bx, point.y - by);
      if (dist <= 40) {
        this.phase = 'bracelet';
        this.phaseTime = 0;
        try { navigator.vibrate?.(15); } catch {}
      }
    }
  }

  handleMove(point) {
    if (this.phase === 'signature') this.signature.handleMove(point);
  }

  handleUp(point) {
    if (this.phase === 'signature') this.signature.handleUp(point);
  }

  handleCancel() {
    if (this.phase === 'signature') this.signature.handleCancel();
  }

  // ============ update ============

  update(dt) {
    this.totalTime += dt;
    this.phaseTime += dt;

    if (this.phase === 'ringing') {
      // 3次铃声脉冲后自动进入 form 阶段
      // 每次脉冲 0.3s 间隔，共 3 次，再加一点缓冲
      const pulseCount = Math.min(3, Math.floor(this.phaseTime / 0.3));
      if (pulseCount >= 3 && this.phaseTime - 3 * 0.3 > 0.15) {
        this.phase = 'signature';
        this.phaseTime = 0;
        this.game.showHint('签下你的名字');
      }
    } else if (this.phase === 'signature') {
      this.signature.update(dt);
    } else if (this.phase === 'bracelet') {
      if (this.phaseTime >= 2 && !this._completed) {
        this._completed = true;
        this.game.progress.markChapterComplete(4, 30);
        setTimeout(() => this.game.goMemoryReport('chapter_04'), 500);
      }
    }
  }

  // ============ render ============

  render(ctx) {
    const { width, height } = this.game;

    if (this.phase === 'comicIntro') {
      this.drawComicPage(ctx, width, height, this._images?.comic);
      return;
    }
    if (this.phase === 'comicFP') {
      this.drawComicPage(ctx, width, height, this._images?.fp);
      return;
    }

    this.drawBackground(ctx, width, height);
    this.drawTable(ctx, width, height);

    switch (this.phase) {
      case 'phone':
      case 'ringing':
        this.drawPhone(ctx);
        this.drawPhonePrompt(ctx);
        break;
      case 'signature':
        this.signature.render(ctx);
        break;
      case 'form':
        this.drawFormCard(ctx);
        this.drawBracelet(ctx);
        this.drawReunionFocus(ctx, width, height);
        break;
      case 'bracelet':
        this.drawFormCard(ctx);
        this.drawBraceletReveal(ctx, width, height);
        break;
    }
  }

  // ---------- 漫画页 ----------

  drawComicPage(ctx, width, height, pages) {
    if (!pages || pages.length === 0) return;
    const img = pages[Math.min(this.comicPage, pages.length - 1)];
    if (!img) return;
    const scale = Math.max(width / img.width, height / img.height);
    const iw = img.width * scale;
    const ih = img.height * scale;
    ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);
    // 底部指示器
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, height - 55, width, 55);
    ctx.fillStyle = '#d4b896';
    ctx.font = '16px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const total = pages.length;
    const cur = this.comicPage + 1;
    ctx.fillText(`${cur} / ${total}  ·  点击继续`, width / 2, height - 28);
  }

  // ---------- 背景 ----------

  drawBackground(ctx, width, height) {
    // 优先使用真实警局场景底图，加载失败回退程序化
    const bgImg = this._images?.ch4_police_01;
    if (bgImg) {
      drawImageCover(ctx, bgImg, width, height);
      ctx.fillStyle = 'rgba(8, 12, 16, 0.30)';
      ctx.fillRect(0, 0, width, height);
      return;
    }
    // 回退：程序化渐变
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a2025');
    grad.addColorStop(1, '#252d35');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 灰色墙壁纹理——浅色墙缝线
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 80; y < height - 100; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 160; x < width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 100);
      ctx.stroke();
    }
  }

  drawTable(ctx, width, height) {
    // 底部木色桌子
    const tableY = height - 80;
    ctx.fillStyle = '#5c4030';
    ctx.fillRect(0, tableY, width, 80);

    // 木纹线条
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = tableY + 5; y < height - 5; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 桌面高光
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, tableY, width, 3);
  }

  // ---------- 阶段1：电话 ----------

  drawPhone(ctx) {
    const baseX = 200, baseY = 310, baseW = 100, baseH = 70;
    const earpieceX = 190, earpieceY = 278, earpieceW = 120, earpieceH = 28;

    ctx.save();

    // 脉冲光环（仅 idle 时呼吸）
    if (this.phase === 'phone') {
      const breath = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(this.totalTime * 2 * Math.PI / 1.5));
      const cx = baseX + baseW / 2;
      const cy = baseY + baseH / 2;
      for (let i = 0; i < 3; i++) {
        const radius = Math.max(baseW, baseH) / 2 + 20 + i * 20;
        ctx.strokeStyle = `rgba(180, 150, 120, ${breath * (1 - i * 0.25)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 铃声脉冲
    if (this.phase === 'ringing') {
      const pulseIndex = Math.min(2, Math.floor(this.phaseTime / 0.3));
      const pulseElapsed = this.phaseTime - pulseIndex * 0.3;
      const isPulsing = pulseIndex < 3 && pulseElapsed < 0.2;
      const scale = isPulsing ? 1 + 0.15 * Math.sin(pulseElapsed / 0.2 * Math.PI) : 1;

      ctx.translate(baseX + baseW / 2, baseY + baseH / 2);
      ctx.scale(scale, scale);
      ctx.translate(-baseX - baseW / 2, -baseY - baseH / 2);
    }

    // ---- 底座 ----
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    roundedRect(ctx, baseX, baseY, baseW, baseH, 8);
    ctx.fillStyle = '#5a3020';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 底座细节——转盘
    ctx.fillStyle = '#4a2518';
    roundedRect(ctx, baseX + 15, baseY + 12, baseW - 30, 8, 3);
    ctx.fill();

    // 转盘数字点
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rx = baseX + baseW / 2 + 26 * Math.cos(angle);
      const ry = baseY + 35 + 18 * Math.sin(angle);
      ctx.fillStyle = '#8a6040';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- 听筒（横躺长条，在底座上方） ----
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    roundedRect(ctx, earpieceX, earpieceY, earpieceW, earpieceH, 14);
    ctx.fillStyle = '#5a3020';
    ctx.fill();

    // 听筒线缆
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#3a1a10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(earpieceX + earpieceW / 2, earpieceY + earpieceH);
    ctx.quadraticCurveTo(
      earpieceX + earpieceW / 2 + 20, earpieceY + earpieceH + 30,
      earpieceX + earpieceW / 2 - 10, earpieceY + earpieceH + 50
    );
    ctx.stroke();

    ctx.restore();
  }

  drawPhonePrompt(ctx) {
    ctx.save();
    const text = '有人打电话来了……';
    const tx = 30, ty = 30;
    const tw = ctx.measureText(text).width;
    const pad = 16;

    // 气泡背景
    roundedRect(ctx, tx - pad, ty - pad, tw + pad * 2, 36, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.fillStyle = '#d4c8b8';
    ctx.font = '500 20px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, tx, ty + 2);
    ctx.restore();
  }

  // ---------- 阶段2：登记单 + 手环 ----------

  drawFormCard(ctx) {
    const cardX = 700, cardY = 180, cardW = 380, cardH = 280;

    ctx.save();

    // 阴影
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    roundedRect(ctx, cardX, cardY, cardW, cardH, 8);
    ctx.fillStyle = '#f5f0e8';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 边框
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    roundedRect(ctx, cardX, cardY, cardW, cardH, 8);
    ctx.stroke();

    // 标题占位横线
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(cardX + 20, cardY + 20, 80, 3);

    // 手写风格文字行（短横线模拟，每行长度不同）
    const lineStartY = cardY + 45;
    const lineGap = 24;
    const lineConfigs = [
      { offset: 30, width: 180 },
      { offset: 45, width: 140 },
      { offset: 35, width: 50 },
      { offset: 30, width: 120 },
      { offset: 35, width: 200 },
      { offset: 55, width: 90 },
    ];

    for (let i = 0; i < lineConfigs.length; i++) {
      const { offset, width } = lineConfigs[i];
      const lx = cardX + offset;
      const ly = lineStartY + i * lineGap;
      const segments = Math.max(3, Math.floor(width / 12));

      ctx.strokeStyle = `rgba(60, 40, 30, ${0.18 + (i % 2) * 0.08})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      for (let s = 1; s <= segments; s++) {
        const px = lx + (width / segments) * s;
        const py = ly + ((s % 2 === 0) ? -1 : 1) * Math.random() * 1.2;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 红印标记标题
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 17px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('【重点】', cardX + cardW / 2, cardY + cardH - 75);

    // 关键线索（红色大字）
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 26px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('XX小区 5栋 503', cardX + cardW / 2, cardY + cardH - 40);

    ctx.restore();
  }

  drawBracelet(ctx) {
    const bx = 120, by = 560;
    const pulse = 0.4 + 0.3 * Math.sin(this.totalTime * 2.5);

    ctx.save();

    // 外圈脉冲光圈
    ctx.strokeStyle = `rgba(212, 168, 64, ${pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 28 + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();

    // 第二圈
    ctx.strokeStyle = `rgba(212, 168, 64, ${pulse * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, 38 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();

    // 光点渐变
    const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
    glow.addColorStop(0, `rgba(255, 220, 120, ${0.6 + pulse * 0.3})`);
    glow.addColorStop(0.5, `rgba(212, 168, 64, ${0.3 + pulse * 0.2})`);
    glow.addColorStop(1, 'rgba(212, 168, 64, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();

    drawPrompt(ctx, '桌上还有一个手环……', bx, by + 55, 0);

    ctx.restore();
  }

  // ---------- 阶段3：手环揭示 ----------

  drawBraceletReveal(ctx, width, height) {
    const cx = width / 2, cy = height / 2;
    const t = this.phaseTime;
    const revealProgress = Math.min(1, t / 1);

    ctx.save();

    // 变亮变大的光环
    const glowRadius = 40 + (1 - revealProgress) * 60;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, `rgba(212, 168, 64, ${0.4 + revealProgress * 0.3})`);
    glow.addColorStop(0.4, `rgba(212, 168, 64, ${0.25})`);
    glow.addColorStop(1, 'rgba(212, 168, 64, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 外圈光环
    ctx.strokeStyle = `rgba(212, 168, 64, ${0.2 + 0.15 * Math.sin(this.totalTime * 2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // 手环焦点图（ch4_police_03）：缩放 + 位移聚焦过渡，替代纯程序化光点
    this._drawBraceletFocus(ctx, cx, cy, revealProgress);

    // 文字（t > 0.8s 后淡入）
    if (t > 0.8) {
      const textAlpha = Math.min(1, (t - 0.8) / 0.6);
      ctx.globalAlpha = textAlpha;

      ctx.fillStyle = '#d4c8b8';
      ctx.font = '500 28px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('上面刻着一个名字……', cx, cy - 55);

      ctx.font = '400 16px system-ui, "PingFang SC", sans-serif';
      ctx.fillStyle = 'rgba(180, 170, 155, 0.6)';
      ctx.textBaseline = 'top';
      ctx.fillText('线索正在浮出水面……', cx, cy + 55);
    }

    ctx.restore();
  }

  // 中心裁剪 + 圆形聚焦的通用绘制（缩放+位移）
  _drawFocusImage(ctx, img, cx, cy, size, scale, alpha, offsetX = 0, offsetY = 0) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + offsetX, cy + offsetY);
    ctx.scale(scale, scale);
    // 圆形聚焦裁剪，突出关键物件
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.clip();
    // 居中正方形裁剪，避免拉伸
    const sw = Math.min(img.width || size, img.height || size);
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sw) / 2;
    ctx.drawImage(img, sx, sy, sw, sw, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  _drawBraceletFocus(ctx, cx, cy, revealProgress) {
    const img = this._images?.ch4_police_03;
    if (!img) return;
    // 缩放 + 位移聚焦过渡：从小图缩放放大并向中心位移
    const scale = 0.4 + 0.6 * revealProgress;
    const offsetX = (1 - revealProgress) * 70;
    const offsetY = (1 - revealProgress) * 24;
    const alpha = Math.min(1, revealProgress * 1.2);
    this._drawFocusImage(ctx, img, cx, cy, 320, scale, alpha, offsetX, offsetY);
  }

  drawReunionFocus(ctx, width, height) {
    const img = this._images?.ch4_police_08;
    if (!img) return;
    // 重逢焦点：表单出现时从桌面左侧缩放淡入，作为关键物件焦点
    const p = Math.min(1, this.phaseTime / 1.0);
    const cx = 300, cy = 430;
    const scale = 0.5 + 0.5 * p;
    const alpha = Math.min(1, p);
    this._drawFocusImage(ctx, img, cx, cy, 200, scale, alpha);
  }
}
