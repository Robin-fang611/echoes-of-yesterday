// Ch7 惊悚夜醒——黑暗中摸到门锁（叙事可读链路 + 宽松通关）
// 状态机：nightNarrative → socialLights → flashlightSearch → hallucinationClear → doorOpen → complete

import { drawPrompt, roundedRect } from '../utils/sceneUtils.js';
import { DanmakuBubbleField } from '../interactions/DanmakuBubbleField.js';

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

export class Ch07Night {
  constructor(game) {
    this.game = game;
    this.phase = 'comicIntro';  // comicIntro → nightNarrative → searching → found → complete
    this.phaseTime = 0;
    this._complete = false;
    this.time = 0;

    // 门锁位置
    this.lockX = 640;
    this.lockY = 500;

    // 手指跟踪
    this.fingerX = -1;
    this.fingerY = -1;
    this.fingerActive = false;

    // 静态噪点（极暗的灰点）
    this.noiseDots = [];
    for (let i = 0; i < 80; i++) {
      this.noiseDots.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        opacity: 0.01 + Math.random() * 0.03,
      });
    }

    // 超时兜底
    this.warmLightProgress = 0; // 0~1，50s 开始增长，60s 达到 1
    this.timeoutRevealed = false;
    this.moonHintShown = false;

    // 叙事文本（narrative 阶段用，socialLights 阶段改用 Canvas 气泡，避免文字堆砌）
    this.narrativeLines = [
      '深夜，不知是几点。',
      '黑暗中，只有自己的呼吸声。',
      '白天的信息、朋友的光，都远了……',
      '需要找到那个熟悉的东西……',
    ];

    this.socialBubbleField = new DanmakuBubbleField({
      targetX: 640,
      targetY: 510,
      messages: ['你不是一个人。', '有人在等你回家。', '慢慢来，不着急。', '微光就在前方。', '深呼吸，放轻松。'],
    });

    // 完成动画参数
    this.openProgress = 0;
    this.completeTransition = false;
  }

  get isComplete() { return this._complete; }
  get completeTitle() { return '找到门锁'; }
  get completeMessage() { return '终于找到了门……'; }

  // ============ 生命周期 ============

  async onEnter() {
    if (!this._images) {
      try {
        this._images = {
          ch7_bg_bedroom_night: await loadImage('./assets/images/ch7_bg_bedroom_night.jpg'),
          ch7_door_lock: await loadImage('./assets/images/ch7_door_lock.png'),
          ch7_flashlight_beam: await loadImage('./assets/images/ch7_flashlight_beam.png'),
        };
      } catch (err) { console.error('Ch7 images:', err); }
    }
    this.game.showHint('深夜，不知是几点……');
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: point => this.handleMove(point),
      up: () => this.handleUp(),
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
      switch (this.phase) {
        case 'comicIntro':
          this._goto('nightNarrative');
          return;

        case 'nightNarrative':
          if (this.phaseTime > 1.0) this._goto('flashlightSearch');
          return;

        case 'flashlightSearch': {
          this.fingerX = point.x;
          this.fingerY = point.y;
          this.fingerActive = true;

          // 超时后任意点击即开门
          if (this.timeoutRevealed) {
            this._goto('hallucinationClear');
            return;
          }

          // 手指非常接近门锁时点击 → 找到门锁，进入「幻觉散去」
          const dist = Math.hypot(point.x - this.lockX, point.y - this.lockY);
          if (dist < 35) {
            vibe(50);
            this._goto('hallucinationClear');
          }
          return;
        }

        case 'hallucinationClear':
          // 点击直接确认幻觉散去，进入开门
          this._goto('doorOpen');
          return;

        default:
          return;
      }
    } catch (e) { console.error('Ch07 handleDown:', e); }
  }

  handleMove(point) {
    if (this.phase === 'flashlightSearch') {
      this.fingerX = point.x;
      this.fingerY = point.y;
    }
  }

  handleUp() {
    this.fingerActive = false;
  }

  handleCancel() {
    this.fingerActive = false;
  }

  _goto(phase) {
    this.phase = phase;
    this.phaseTime = 0;
  }

  // ============ 辅助方法 ============

  /** 手指到门锁的距离 */
  _getFingerDist() {
    if (this.fingerX < 0 || this.fingerY < 0) return Infinity;
    return Math.hypot(this.fingerX - this.lockX, this.fingerY - this.lockY);
  }

  /** 门锁呼吸透明度（0.04~0.08），周期 3.5s */
  _getBreathOpacity() {
    const breath = Math.sin(this.time * Math.PI * 2 / 3.5);
    return 0.04 + (breath * 0.5 + 0.5) * 0.04;
  }

  // ============ update ============

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;

    switch (this.phase) {
      case 'nightNarrative':
        if (this.phaseTime >= 5) this._goto('flashlightSearch');
        break;

      case 'flashlightSearch':
        // 60s 超时兜底机制
        if (this.phaseTime > 50) {
          this.warmLightProgress = Math.min(1, (this.phaseTime - 50) / 10);
          if (this.phaseTime > 58 && !this.moonHintShown) {
            this.moonHintShown = true;
          }
          if (this.phaseTime > 60 && !this.timeoutRevealed) {
            this.timeoutRevealed = true;
            vibe(30);
          }
        }
        break;

      case 'hallucinationClear':
        // 幻觉在数秒内散去，随后进入开门
        if (this.phaseTime >= 3.0) this._goto('doorOpen');
        break;

      case 'doorOpen':
        this.openProgress = Math.min(1, this.phaseTime / 1.0);
        if (this.phaseTime >= 1.0 && !this._complete) {
          this._complete = true;
          this._goto('complete');
          // P1-1 修复：原本缺失存档调用，导致 ch07 进度不落库、刷新回退、报告页永远未完成
          this.game.progress.markChapterComplete(7, 60);
          setTimeout(() => this.game.goMemoryReport('chapter_07'), 500);
        }
        break;

      case 'complete':
        // 由 ChapterManager 检测 isComplete 统一弹 Overlay
        break;
    }
  }

  // ============ render ============

  render(ctx) {
    try {
      this._renderSafe(ctx);
    } catch (e) {
      console.error('Ch07 render error:', e);
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
        this.renderComicIntro(ctx, width, height);
        break;
      case 'nightNarrative':
        this.renderNarrative(ctx);
        break;
      case 'flashlightSearch':
        this.renderSearching(ctx);
        break;
      case 'hallucinationClear':
        this.renderHallucinationClear(ctx);
        break;
      case 'doorOpen':
        this.renderDoorOpen(ctx);
        break;
      case 'complete':
        /* overlay 处理 */
        break;
      default:
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(0, 0, width, height);
    }
  }

  // ---------- 漫画入场 ----------

  renderComicIntro(ctx, width, height) {
    const img = this._images?.ch7_bg_bedroom_night;
    if (img) {
      const scale = Math.max(width / img.width, height / img.height);
      ctx.drawImage(img, (width - img.width * scale) / 2, (height - img.height * scale) / 2, img.width * scale, img.height * scale);
    } else {
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, height - 55, width, 55);
    ctx.fillStyle = '#d4b896';
    ctx.font = '16px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击进入暗夜……', width / 2, height - 28);
  }

  // ---------- 叙事开场（夜醒） ----------

  renderNarrative(ctx) {
    const { width, height } = this.game;
    const bedroom = this._images?.ch7_bg_bedroom_night;
    if (bedroom) ctx.drawImage(bedroom, 0, 0, width, height);
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, width, height); }
    ctx.fillStyle = 'rgba(5, 5, 8, 0.72)';
    ctx.fillRect(0, 0, width, height);

    const alpha = Math.min(1, this.phaseTime / 1.5);
    const textIdx = Math.min(Math.floor(this.phaseTime / 1.0), this.narrativeLines.length - 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d4b896';
    ctx.font = '500 26px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = Math.floor((this.phaseTime - textIdx * 1.0) / 0.035);
    ctx.fillText(this.narrativeLines[textIdx].slice(0, Math.min(chars, this.narrativeLines[textIdx].length)), width / 2, height / 2 - 20);

    if (this.phaseTime > 2.8) {
      ctx.globalAlpha = Math.min(1, (this.phaseTime - 2.8) / 0.8);
      ctx.fillStyle = '#8a7a6a';
      ctx.font = '16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('点击或触摸继续……', width / 2, height - 60);
    }
    ctx.restore();
  }

  // ---------- 社交气泡阶段（朋友圈 / 灯光飘动，替代文字堆砌） ----------

  renderSocialLights(ctx) {
    const { width, height } = this.game;
    const bedroom = this._images?.ch7_bg_bedroom_night;
    if (bedroom) { ctx.drawImage(bedroom, 0, 0, width, height); ctx.fillStyle = 'rgba(3, 4, 8, 0.86)'; ctx.fillRect(0, 0, width, height); }
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, width, height); }

    this.socialBubbleField.render(ctx);

    drawPrompt(ctx, `点亮 ${this.socialBubbleField.collected}/4 份牵挂`, width / 2, height - 50, 0);
  }

  // ---------- 搜索阶段（手电筒） ----------

  renderSearching(ctx) {
    const { width, height } = this.game;

    // 1. 正式卧室夜景，保持黑暗探索的可读性。
    const bedroom = this._images?.ch7_bg_bedroom_night;
    if (bedroom) { ctx.drawImage(bedroom, 0, 0, width, height); ctx.fillStyle = 'rgba(3, 4, 8, 0.88)'; ctx.fillRect(0, 0, width, height); }
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, width, height); }

    // 2. 噪点
    this._drawNoise(ctx);

    // 3. 门锁（根据手指距离与超时状态决定透明度和光晕）
    this._drawLock(ctx);

    // 4. 手指光圈（微弱暖光照亮手指周围）
    if (this.fingerActive) {
      this._drawFingerLight(ctx);
    }

    // 5. 超时暖光（月光）
    if (this.warmLightProgress > 0) {
      this._drawWarmLight(ctx);
    }

    // 6. UI 提示
    this._drawSearchUI(ctx);
  }

  _drawNoise(ctx) {
    ctx.save();
    for (const dot of this.noiseDots) {
      ctx.fillStyle = `rgba(160, 150, 140, ${dot.opacity})`;
      ctx.fillRect(dot.x, dot.y, 1.5, 1.5);
    }
    ctx.restore();
  }

  _drawLock(ctx) {
    ctx.save();

    // 根据不同状态计算门锁透明度与光晕参数
    let lockOpacity;
    let drawGlow = false;
    let glowRadius = 50;
    const dist = this._getFingerDist();
    const isNear = this.fingerActive && dist < 100;
    const isClose = this.fingerActive && dist < 35;

    if (this.timeoutRevealed) {
      // 超时自动高亮：大脉冲
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      lockOpacity = 0.7 + pulse * 0.15;
      glowRadius = 70 + pulse * 30;
      drawGlow = true;
    } else if (isClose) {
      lockOpacity = 0.8;
      drawGlow = true;
      glowRadius = 35;
    } else if (isNear) {
      lockOpacity = 0.3;
      drawGlow = true;
      glowRadius = 50;
    } else {
      lockOpacity = this._getBreathOpacity();
    }

    // 光晕
    if (drawGlow) {
      const glow = ctx.createRadialGradient(this.lockX, this.lockY, 0, this.lockX, this.lockY, glowRadius);
      glow.addColorStop(0, `rgba(196, 160, 96, ${lockOpacity * 0.6})`);
      glow.addColorStop(0.5, `rgba(196, 160, 96, ${lockOpacity * 0.2})`);
      glow.addColorStop(1, 'rgba(196, 160, 96, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.lockX, this.lockY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const lock = this._images?.ch7_door_lock;
    if (lock) {
      ctx.save();
      ctx.globalAlpha = lockOpacity;
      ctx.drawImage(lock, this.lockX - 30, this.lockY - 50, 60, 100);
      ctx.restore();
    } else {
    // 门锁本身（兼容未加载时的小圆形）
    ctx.fillStyle = `rgba(196, 160, 96, ${lockOpacity})`;
    ctx.beginPath();
    ctx.arc(this.lockX, this.lockY, 18, 0, Math.PI * 2);
    ctx.fill();

    // 门锁轮廓（仅在高亮时可见）
    if (lockOpacity > 0.2) {
      ctx.strokeStyle = `rgba(196, 160, 96, ${lockOpacity * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.lockX, this.lockY, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    }

    // 门锁十字标记（钥匙孔示意）
    if (lockOpacity > 0.3) {
      ctx.strokeStyle = `rgba(120, 100, 60, ${lockOpacity * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.lockX - 5, this.lockY);
      ctx.lineTo(this.lockX + 5, this.lockY);
      ctx.moveTo(this.lockX, this.lockY - 5);
      ctx.lineTo(this.lockX, this.lockY + 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** 手指光圈的微弱暖光效果 */
  _drawFingerLight(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(this.fingerX, this.fingerY, 20, this.fingerX, this.fingerY, 140);
    grad.addColorStop(0, 'rgba(200, 180, 140, 0.08)');
    grad.addColorStop(0.4, 'rgba(200, 180, 140, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.game.width, this.game.height);
    const beam = this._images?.ch7_flashlight_beam;
    if (beam) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(beam, this.fingerX - 115, this.fingerY - 115, 230, 230);
    }
    ctx.restore();
  }

  /** 超时 50~60s 的月光效果 */
  _drawWarmLight(ctx) {
    ctx.save();

    const progress = this.warmLightProgress;
    const radius = 200 + progress * 1000;  // 200 → 1200
    const centerX = 100;
    const centerY = 100;

    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    grad.addColorStop(0, `rgba(255, 230, 160, ${progress * 0.15})`);
    grad.addColorStop(0.3, `rgba(255, 220, 150, ${progress * 0.08})`);
    grad.addColorStop(0.6, `rgba(220, 200, 140, ${progress * 0.04})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.game.width, this.game.height);
    ctx.restore();
  }

  _drawSearchUI(ctx) {
    const { width, height } = this.game;

    ctx.save();
    const dist = this._getFingerDist();
    const isNear = this.fingerActive && dist < 100;
    const isClose = this.fingerActive && dist < 35;

    // 靠近门锁时的提示
    if (isClose) {
      drawPrompt(ctx, '咔嗒……', this.lockX, this.lockY - 45, 0.3);
    } else if (isNear) {
      drawPrompt(ctx, '似乎摸到了什么……', width / 2, height - 30, 0);
    } else if (!this.fingerActive) {
      drawPrompt(ctx, '伸出手，在黑暗中摸索', width / 2, height - 30, 0);
    }

    // 月光提示
    if (this.moonHintShown) {
      ctx.fillStyle = 'rgba(255, 230, 180, 0.5)';
      ctx.font = '18px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('月光照了进来……', width - 30, height - 30);
    }

    // 超时提示
    if (this.timeoutRevealed) {
      ctx.fillStyle = 'rgba(255, 230, 180, 0.7)';
      ctx.font = 'bold 20px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('门就在那里……点击任意位置打开', width / 2, height / 2 + 100);
    }

    ctx.restore();
  }

  // ---------- 幻觉散去阶段（ch7_hallucination_shadow） ----------

  renderHallucinationClear(ctx) {
    const { width, height } = this.game;

    const bedroom = this._images?.ch7_bg_bedroom_night;
    if (bedroom) { ctx.drawImage(bedroom, 0, 0, width, height); ctx.fillStyle = 'rgba(3, 4, 8, 0.9)'; ctx.fillRect(0, 0, width, height); }
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, width, height); }

    // 幻觉阴影：随时间淡出（被「看清」后散去）
    const shadow = this.game.images.ch7_hallucination_shadow;
    const fade = Math.max(0, 1 - this.phaseTime / 2.6);
    if (shadow && fade > 0) {
      ctx.save();
      ctx.globalAlpha = fade * 0.85;
      // 轻微晃动，表现幻觉的不稳定
      const wob = Math.sin(this.time * 3) * 6;
      ctx.drawImage(shadow, width / 2 - 120 + wob, height / 2 - 160, 240, 320);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.phaseTime / 0.6);
    drawPrompt(ctx, '那不是真的……幻影散去了', width / 2, height - 60, 0.2);
    ctx.restore();
  }

  // ---------- 开门动画（ch7_door_lock） ----------

  renderDoorOpen(ctx) {
    const { width, height } = this.game;

    // 暖光从门锁扩散
    const progress = this.openProgress;
    const radius = 18 + progress * 800;

    const bedroom = this._images?.ch7_bg_bedroom_night;
    if (bedroom) ctx.drawImage(bedroom, 0, 0, width, height);
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, width, height); }

    // 从门锁位置扩散暖光
    ctx.save();
    const grad = ctx.createRadialGradient(this.lockX, this.lockY, 0, this.lockX, this.lockY, radius);
    grad.addColorStop(0, `rgba(255, 230, 160, ${progress * 0.5})`);
    grad.addColorStop(0.3, `rgba(255, 210, 130, ${progress * 0.3})`);
    grad.addColorStop(0.6, `rgba(220, 180, 100, ${progress * 0.15})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 门锁淡出
    ctx.save();
    const lockFade = Math.max(0, 1 - progress * 2);
    if (lockFade > 0) {
      const lock = this._images?.ch7_door_lock;
      if (lock) {
        ctx.globalAlpha = lockFade;
        ctx.drawImage(lock, this.lockX - 30, this.lockY - 50, 60, 100);
      } else {
        ctx.fillStyle = `rgba(196, 160, 96, ${lockFade})`;
        ctx.beginPath();
        ctx.arc(this.lockX, this.lockY, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 开门文字（淡入）
    if (progress > 0.3) {
      ctx.save();
      const textAlpha = Math.min(1, (progress - 0.3) / 0.3);
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#d4b896';
      ctx.font = 'bold 28px system-ui, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('门开了……', width / 2, height / 2);
      ctx.restore();
    }
  }
}
